package express

// This file contains the project-level part of the extractor. The original
// single-file AST pass remains below in express.go; this pass adds only the
// information needed to follow explicit CommonJS router mounts.

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/dop251/goja/ast"
	"github.com/dop251/goja/file"
	"github.com/dop251/goja/parser"
)

type projectModule struct {
	path     string
	program  *ast.Program
	file     *file.File
	bindings bindings
	imports  map[string]string
	modules  map[string]*projectModule
	export   string
	routes   []moduleRoute
	mounts   []moduleMount
}

type moduleRoute struct {
	receiver string
	route    discovery.Route
}

type moduleMount struct {
	receiver string
	prefix   string
	target   string
	line     int
}

type moduleRef struct {
	module  *projectModule
	binding string
}

func extractProject(ctx discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	modules := make(map[string]*projectModule)
	warnings := make([]string, 0)
	for _, path := range ctx.Files {
		if strings.ToLower(filepath.Ext(path)) != ".js" {
			continue
		}
		data, err := os.ReadFile(path)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("express: read %s: %v", path, err))
			continue
		}
		program, err := parser.ParseFile(nil, path, data, 0, parser.WithDisableSourceMaps)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("express: parse %s: %v", path, err))
			continue
		}
		m := &projectModule{path: path, program: program, file: program.File, imports: map[string]string{}, bindings: bindings{expressFactories: map[string]bool{}, routers: map[string]bool{}, apps: map[string]bool{}}}
		collectBindings(program.Body, &m.bindings)
		inspectModule(m, program.Body, &warnings)
		modules[path] = m
	}

	// Resolve require() paths only after every scanned file has been parsed.
	for _, m := range modules {
		m.modules = modules
		for name, requested := range m.imports {
			resolved := resolveLocalModule(m.path, requested, ctx.Root, modules)
			if resolved == "" {
				warnings = append(warnings, fmt.Sprintf("express: unresolved local import %q in %s", requested, m.path))
				delete(m.imports, name)
				continue
			}
			m.imports[name] = resolved
		}
	}

	routes := make([]discovery.Route, 0)
	publicRoots := make([]moduleRef, 0)
	importedModules := make(map[string]bool)
	for _, m := range modules {
		for _, imported := range m.imports {
			importedModules[imported] = true
		}
	}
	for _, m := range modules {
		for app := range m.bindings.apps {
			publicRoots = append(publicRoots, moduleRef{module: m, binding: app})
		}
	}
	// Keep the V1 behaviour for a project consisting only of a router module.
	// Once an application exists, an unmounted router is not a public endpoint.
	if len(publicRoots) == 0 {
		for _, m := range modules {
			for router := range m.bindings.routers {
				publicRoots = append(publicRoots, moduleRef{module: m, binding: router})
			}
		}
	} else {
		// Preserve the established standalone-router behaviour for files which
		// are not imported by an application. Imported routers are reached only
		// through their explicit mount relationship.
		for _, m := range modules {
			if len(m.bindings.apps) != 0 || importedModules[m.path] {
				continue
			}
			for router := range m.bindings.routers {
				publicRoots = append(publicRoots, moduleRef{module: m, binding: router})
			}
		}
	}
	sort.Slice(publicRoots, func(i, j int) bool {
		if publicRoots[i].module.path != publicRoots[j].module.path {
			return publicRoots[i].module.path < publicRoots[j].module.path
		}
		return publicRoots[i].binding < publicRoots[j].binding
	})

	seenWarnings := map[string]bool{}
	for _, root := range publicRoots {
		collectMountedRoutes(root, "", nil, &routes, &warnings, seenWarnings)
	}
	sort.SliceStable(routes, func(i, j int) bool {
		if routes[i].Source.File != routes[j].Source.File {
			return routes[i].Source.File < routes[j].Source.File
		}
		if routes[i].Source.Line != routes[j].Source.Line {
			return routes[i].Source.Line < routes[j].Source.Line
		}
		if routes[i].Method != routes[j].Method {
			return routes[i].Method < routes[j].Method
		}
		return routes[i].Path < routes[j].Path
	})
	sort.Strings(warnings)
	return routes, warnings, nil
}

func inspectModule(m *projectModule, statements []ast.Statement, warnings *[]string) {
	var visitStatement func(ast.Statement)
	var visitExpression func(ast.Expression)
	visitStatement = func(statement ast.Statement) {
		switch statement := statement.(type) {
		case *ast.BlockStatement:
			for _, child := range statement.List {
				visitStatement(child)
			}
		case *ast.ExpressionStatement:
			visitExpression(statement.Expression)
		case *ast.VariableStatement:
			for _, b := range statement.List {
				if name, ok := b.Target.(*ast.Identifier); ok && b.Initializer != nil {
					if req, ok := localRequire(b.Initializer); ok {
						m.imports[name.Name.String()] = req
					}
				}
				if b.Initializer != nil {
					visitExpression(b.Initializer)
				}
			}
		case *ast.LexicalDeclaration:
			for _, b := range statement.List {
				if name, ok := b.Target.(*ast.Identifier); ok && b.Initializer != nil {
					if req, ok := localRequire(b.Initializer); ok {
						m.imports[name.Name.String()] = req
					}
				}
				if b.Initializer != nil {
					visitExpression(b.Initializer)
				}
			}
		case *ast.IfStatement:
			visitStatement(statement.Consequent)
			if statement.Alternate != nil {
				visitStatement(statement.Alternate)
			}
		case *ast.ForStatement:
			if initializer, ok := statement.Initializer.(*ast.ForLoopInitializerExpression); ok {
				visitExpression(initializer.Expression)
			}
			if statement.Test != nil {
				visitExpression(statement.Test)
			}
			if statement.Update != nil {
				visitExpression(statement.Update)
			}
			visitStatement(statement.Body)
		case *ast.ForInStatement:
			visitExpression(statement.Source)
			visitStatement(statement.Body)
		case *ast.ForOfStatement:
			visitExpression(statement.Source)
			visitStatement(statement.Body)
		case *ast.WhileStatement:
			visitExpression(statement.Test)
			visitStatement(statement.Body)
		case *ast.DoWhileStatement:
			visitStatement(statement.Body)
			visitExpression(statement.Test)
		case *ast.ReturnStatement:
			visitExpression(statement.Argument)
		case *ast.ThrowStatement:
			visitExpression(statement.Argument)
		case *ast.TryStatement:
			visitStatement(statement.Body)
			if statement.Catch != nil {
				visitStatement(statement.Catch.Body)
			}
			if statement.Finally != nil {
				visitStatement(statement.Finally)
			}
		case *ast.FunctionDeclaration:
			visitStatement(statement.Function.Body)
		}
	}
	visitExpression = func(expression ast.Expression) {
		if expression == nil {
			return
		}
		switch expression := expression.(type) {
		case *ast.CallExpression:
			inspectModuleCall(m, expression, warnings)
			visitExpression(expression.Callee)
			for _, arg := range expression.ArgumentList {
				visitExpression(arg)
			}
		case *ast.AssignExpression:
			if isModuleExports(expression.Left) {
				if name, ok := expression.Right.(*ast.Identifier); ok {
					m.export = name.Name.String()
				}
			}
			visitExpression(expression.Left)
			visitExpression(expression.Right)
		case *ast.DotExpression:
			visitExpression(expression.Left)
		case *ast.BracketExpression:
			visitExpression(expression.Left)
			visitExpression(expression.Member)
		case *ast.FunctionLiteral:
			visitStatement(expression.Body)
		case *ast.ArrowFunctionLiteral:
			if body, ok := expression.Body.(*ast.BlockStatement); ok {
				visitStatement(body)
			}
		case *ast.BinaryExpression:
			visitExpression(expression.Left)
			visitExpression(expression.Right)
		case *ast.ConditionalExpression:
			visitExpression(expression.Test)
			visitExpression(expression.Consequent)
			visitExpression(expression.Alternate)
		case *ast.SequenceExpression:
			for _, child := range expression.Sequence {
				visitExpression(child)
			}
		case *ast.ObjectLiteral:
			for _, child := range expression.Value {
				visitExpression(child)
			}
		case *ast.ArrayLiteral:
			for _, child := range expression.Value {
				visitExpression(child)
			}
		}
	}
	for _, statement := range statements {
		visitStatement(statement)
	}
}

func inspectModuleCall(m *projectModule, call *ast.CallExpression, warnings *[]string) {
	dot, ok := call.Callee.(*ast.DotExpression)
	if !ok {
		return
	}
	receiver, ok := dot.Left.(*ast.Identifier)
	if !ok {
		return
	}
	name := receiver.Name.String()
	known := m.bindings.apps[name] || m.bindings.routers[name] || m.imports[name] != ""
	if !known {
		return
	}
	method := strings.ToLower(dot.Identifier.Name.String())
	if _, ok := routeMethods[method]; ok {
		if len(call.ArgumentList) == 0 {
			*warnings = append(*warnings, fmt.Sprintf("express: unsupported route declaration %s.%s() without a path in %s", name, method, m.path))
			return
		}
		path, ok := call.ArgumentList[0].(*ast.StringLiteral)
		if !ok {
			*warnings = append(*warnings, fmt.Sprintf("express: dynamic path in %s.%s() in %s", name, method, m.path))
			return
		}
		pos := m.file.Position(int(call.Idx0()))
		m.routes = append(m.routes, moduleRoute{receiver: name, route: discovery.Route{Method: strings.ToUpper(method), Path: path.Value.String(), Language: "javascript", Framework: "express", Source: discovery.SourceLocation{File: m.path, Line: pos.Line}, Strategy: discovery.StrategyAST, Confidence: staticConfidence}})
		return
	}
	if method == "all" || method == "route" {
		*warnings = append(*warnings, fmt.Sprintf("express: unsupported route declaration %s.%s() in %s", name, method, m.path))
		return
	}
	if method != "use" {
		return
	}
	if len(call.ArgumentList) < 2 {
		return
	}
	prefix, ok := call.ArgumentList[0].(*ast.StringLiteral)
	if !ok {
		*warnings = append(*warnings, fmt.Sprintf("express: dynamic mount prefix in %s.use() in %s", name, m.path))
		return
	}
	target, ok := call.ArgumentList[1].(*ast.Identifier)
	if !ok {
		*warnings = append(*warnings, fmt.Sprintf("express: unresolved router mount in %s.use() in %s", name, m.path))
		return
	}
	pos := m.file.Position(int(call.Idx0()))
	m.mounts = append(m.mounts, moduleMount{receiver: name, prefix: prefix.Value.String(), target: target.Name.String(), line: pos.Line})
}

func localRequire(expression ast.Expression) (string, bool) {
	call, ok := expression.(*ast.CallExpression)
	if !ok || len(call.ArgumentList) != 1 || !isIdentifier(call.Callee, "require") {
		return "", false
	}
	value, ok := call.ArgumentList[0].(*ast.StringLiteral)
	if !ok || !strings.HasPrefix(value.Value.String(), ".") {
		return "", false
	}
	return value.Value.String(), true
}

func isModuleExports(expression ast.Expression) bool {
	dot, ok := expression.(*ast.DotExpression)
	if !ok || dot.Identifier.Name.String() != "exports" {
		return false
	}
	return isIdentifier(dot.Left, "module")
}

func resolveLocalModule(from, requested, root string, modules map[string]*projectModule) string {
	base := filepath.Clean(filepath.Join(filepath.Dir(from), requested))
	root = filepath.Clean(root)
	if base != root && !strings.HasPrefix(base, root+string(filepath.Separator)) {
		return ""
	}
	candidates := []string{base}
	if filepath.Ext(base) == "" {
		candidates = append(candidates, base+".js")
	}
	candidates = append(candidates, filepath.Join(base, "index.js"))
	for _, candidate := range candidates {
		if _, ok := modules[candidate]; ok {
			return candidate
		}
	}
	return ""
}

func resolveBinding(ref moduleRef) (moduleRef, bool) {
	if requested := ref.module.imports[ref.binding]; requested != "" {
		target := ref.module.modules[requested]
		if target == nil || target.export == "" {
			return moduleRef{}, false
		}
		return moduleRef{module: target, binding: target.export}, true
	}
	return ref, true
}

func collectMountedRoutes(ref moduleRef, prefix string, stack []string, routes *[]discovery.Route, warnings *[]string, seenWarnings map[string]bool) {
	resolved, ok := resolveBinding(ref)
	if !ok {
		return
	}
	key := resolved.module.path + "#" + resolved.binding
	for _, item := range stack {
		if item == key {
			warningOnce(warnings, seenWarnings, fmt.Sprintf("express: circular router mount involving %s", resolved.module.path))
			return
		}
	}
	stack = append(stack, key)
	for _, route := range resolved.module.routes {
		if route.receiver == resolved.binding {
			route.route.Path = composePath(prefix, route.route.Path)
			*routes = append(*routes, route.route)
		}
	}
	for _, mount := range resolved.module.mounts {
		if mount.receiver != resolved.binding {
			continue
		}
		targetPath := resolved.module.imports[mount.target]
		if targetPath == "" {
			if resolved.module.bindings.routers[mount.target] {
				collectMountedRoutes(moduleRef{module: resolved.module, binding: mount.target}, composePath(prefix, mount.prefix), stack, routes, warnings, seenWarnings)
				continue
			}
			warningOnce(warnings, seenWarnings, fmt.Sprintf("express: unresolved router mount target %s in %s", mount.target, resolved.module.path))
			continue
		}
		target := resolved.module.modules[targetPath]
		if target == nil || target.export == "" {
			warningOnce(warnings, seenWarnings, fmt.Sprintf("express: unresolved router export %s in %s", mount.target, resolved.module.path))
			continue
		}
		collectMountedRoutes(moduleRef{module: target, binding: target.export}, composePath(prefix, mount.prefix), stack, routes, warnings, seenWarnings)
	}
}

func warningOnce(warnings *[]string, seen map[string]bool, warning string) {
	if !seen[warning] {
		seen[warning] = true
		*warnings = append(*warnings, warning)
	}
}

func composePath(prefix, child string) string {
	prefix = strings.TrimSpace(prefix)
	child = strings.TrimSpace(child)
	if prefix == "" || prefix == "/" {
		if child == "" {
			return "/"
		}
		return child
	}
	if child == "" || child == "/" {
		return strings.TrimRight(prefix, "/")
	}
	return strings.TrimRight(prefix, "/") + "/" + strings.TrimLeft(child, "/")
}
