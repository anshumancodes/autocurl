import ast
import json
import os
import sys


METHODS = {"CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"}
DECORATORS = METHODS | {"API_ROUTE"}


def static_string(node, constants, seen=None):
    if node is None:
        return None
    seen = set() if seen is None else seen
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.Name) and node.id not in seen:
        value = constants.get(node.id)
        if value is not None:
            return static_string(value, constants, seen | {node.id})
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
        left, right = static_string(node.left, constants, seen), static_string(node.right, constants, seen)
        if left is not None and right is not None:
            return left + right
    return None


def dotted(node):
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        parent = dotted(node.value)
        return (parent + "." if parent else "") + node.attr
    return None


def module_name(path, root):
    name = os.path.relpath(path, root).replace(os.sep, ".")
    if name.endswith(".__init__.py"):
        return name[:-len(".__init__.py")]
    return name[:-3] if name.endswith(".py") else name


def join_path(*parts):
    values = [p for p in parts if p not in (None, "")]
    if not values:
        return "/"
    return "/" + "/".join(p.strip("/") for p in values if p.strip("/"))


class Symbol:
    def __init__(self, kind, prefix="", prefix_ok=True):
        self.kind, self.prefix, self.prefix_ok = kind, prefix, prefix_ok
        self.routes, self.includes = [], []


def main(document):
    files = document["files"]
    paths = sorted(files)
    root = os.path.commonpath(paths)
    trees, constants, symbols = {}, {}, {}
    warnings = []
    modules = {module_name(path, root): path for path in paths}

    for path in paths:
        try:
            trees[path] = ast.parse(files[path], filename=path)
        except SyntaxError as exc:
            warnings.append(f"fastapi: parse {path}:{exc.lineno or 1}: {exc.msg}")
            continue
        constants[path] = {}
        symbols[path] = {}

    def warn(path, node, message):
        warnings.append(f"fastapi: {message} in {path}:{getattr(node, 'lineno', 1)}")

    def resolve_import(path, name):
        current = module_name(path, root).split(".")
        if name.startswith("."):
            dots = len(name) - len(name.lstrip("."))
            base = current[:-dots] if dots <= len(current) else []
            name = ".".join(base + name.lstrip(".").split("."))
        candidates = [name]
        for module in list(candidates):
            if module in modules: return modules[module]
        return None

    def is_constructor(node, names, attr):
        value = dotted(node)
        return value in names or value == attr

    # Build local constructors and static constants first.
    for path in paths:
        tree = trees.get(path)
        if tree is None: continue
        constructor_kinds = {"FastAPI": "app", "APIRouter": "router"}
        for imported in tree.body:
            if isinstance(imported, ast.Import):
                for item in imported.names:
                    if item.name == "fastapi":
                        alias = item.asname or "fastapi"
                        constructor_kinds.update({alias + ".FastAPI": "app", alias + ".APIRouter": "router"})
            elif isinstance(imported, ast.ImportFrom) and imported.module == "fastapi" and imported.level == 0:
                for item in imported.names:
                    if item.name in ("FastAPI", "APIRouter"):
                        constructor_kinds[item.asname or item.name] = "app" if item.name == "FastAPI" else "router"
        for node in ast.walk(tree):
            if isinstance(node, (ast.Assign, ast.AnnAssign)):
                value = node.value
                targets = node.targets if isinstance(node, ast.Assign) else [node.target]
                for target in targets:
                    if isinstance(target, ast.Name): constants[path][target.id] = value
                call = value if isinstance(value, ast.Call) else None
                if call is None: continue
                fn = dotted(call.func)
                if fn and (fn in constructor_kinds or fn.split(".")[-1] in ("FastAPI", "APIRouter")):
                    kind = constructor_kinds.get(fn, "app" if fn.split(".")[-1] == "FastAPI" else "router")
                    prefix_node = next((kw.value for kw in call.keywords if kw.arg == "prefix"), None)
                    prefix = static_string(prefix_node, constants[path]) if prefix_node is not None else ""
                    ok = prefix is not None
                    if not ok: warn(path, call, "unresolved dynamic router prefix; affected routes skipped")
                    for target in targets:
                        if isinstance(target, ast.Name): symbols[path][target.id] = Symbol(kind, prefix or "", ok)

    # Imports and simple aliases; repeat to resolve aliases imported from files.
    for _ in range(len(paths) + 2):
        changed = False
        for path in paths:
            tree = trees.get(path)
            if tree is None: continue
            for node in tree.body:
                if isinstance(node, ast.Import):
                    for item in node.names:
                        if item.name == "fastapi":
                            alias = item.asname or item.name.split(".")[0]
                            symbols[path].setdefault(alias + ".FastAPI", Symbol("class"))
                            symbols[path].setdefault(alias + ".APIRouter", Symbol("class"))
                elif isinstance(node, ast.ImportFrom):
                    module = ("." * node.level) + (node.module or "")
                    if node.module == "fastapi" and node.level == 0:
                        for item in node.names:
                            if item.name in ("FastAPI", "APIRouter"):
                                symbols[path].setdefault(item.asname or item.name, Symbol("class"))
                    else:
                        source = resolve_import(path, module)
                        if source and source in symbols:
                            for item in node.names:
                                target = item.asname or item.name
                                value = symbols[source].get(item.name)
                                if value is not None and symbols[path].get(target) is not value:
                                    symbols[path][target] = value; changed = True
                elif isinstance(node, ast.Assign) and isinstance(node.value, ast.Name):
                    value = symbols[path].get(node.value.id)
                    if value:
                        for target in node.targets:
                            if isinstance(target, ast.Name) and symbols[path].get(target.id) is not value:
                                symbols[path][target.id] = value; changed = True
        if not changed: break

    def symbol(path, node):
        if isinstance(node, ast.Name): return symbols.get(path, {}).get(node.id)
        if isinstance(node, ast.Attribute):
            return symbols.get(path, {}).get(dotted(node))
        return None

    # Collect decorators and include_router calls after aliases are known.
    for path in paths:
        tree = trees.get(path)
        if tree is None: continue
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for decorator in node.decorator_list:
                    if not isinstance(decorator, ast.Call): continue
                    if not isinstance(decorator.func, ast.Attribute): continue
                    target, name = symbol(path, decorator.func.value), decorator.func.attr.upper()
                    if target is None or target.kind not in ("app", "router") or name not in DECORATORS: continue
                    route_path = static_string(decorator.args[0], constants[path]) if decorator.args else None
                    if route_path is None:
                        warn(path, decorator, f"dynamic route path for {name}; route skipped"); continue
                    methods = [name]
                    if name == "API_ROUTE":
                        methods = []
                        for kw in decorator.keywords:
                            if kw.arg == "methods" and isinstance(kw.value, (ast.List, ast.Tuple, ast.Set)):
                                for item in kw.value.elts:
                                    value = static_string(item, constants[path])
                                    if value is not None: methods.append(value.upper())
                        methods = [m for m in methods if m in METHODS]
                        if not methods: warn(path, decorator, "unresolved or unsupported api_route methods; route skipped"); continue
                    target.routes.extend((method, route_path, path, decorator.lineno) for method in methods)
            elif isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "include_router":
                destination = symbol(path, node.func.value)
                source = symbol(path, node.args[0]) if node.args else None
                if destination is None or source is None or source.kind != "router": continue
                prefix_node = next((kw.value for kw in node.keywords if kw.arg == "prefix"), None)
                prefix = static_string(prefix_node, constants[path]) if prefix_node is not None else ""
                if prefix is None:
                    warn(path, node, "unresolved dynamic include_router prefix; included routes skipped"); continue
                destination.includes.append((source, prefix))

    routes = []
    def walk(target, inherited, seen):
        if id(target) in seen or not target.prefix_ok: return
        seen = seen | {id(target)}
        base = join_path(inherited, target.prefix)
        for method, path, filename, line in target.routes:
            routes.append({"Method": method, "Path": join_path(base, path), "File": filename, "Line": line})
        for source, prefix in target.includes: walk(source, join_path(base, prefix), seen)

    roots = {id(value): value for per_file in symbols.values() for value in per_file.values() if value.kind == "app"}
    for target in sorted(roots.values(), key=lambda item: (item.prefix, len(item.routes))): walk(target, "", set())
    routes.sort(key=lambda item: (item["File"], item["Line"], item["Method"], item["Path"]))
    return {"routes": routes, "warnings": sorted(set(warnings))}


if __name__ == "__main__":
    try:
        print(json.dumps(main(json.load(sys.stdin)), separators=(",", ":")))
    except Exception as exc:
        print(json.dumps({"routes": [], "warnings": [f"fastapi: AST helper error: {exc}"]}))
