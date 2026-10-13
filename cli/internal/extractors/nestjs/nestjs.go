// Package nestjs extracts statically declared NestJS controller routes.
package nestjs

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/anshumancodes/autocurl/internal/discovery"
	sitter "github.com/tree-sitter/go-tree-sitter"
	typescript "github.com/tree-sitter/tree-sitter-typescript/bindings/go"
)

const staticConfidence = 0.95

var httpDecorators = map[string]string{"Get": "GET", "Post": "POST", "Put": "PUT", "Patch": "PATCH", "Delete": "DELETE", "Head": "HEAD", "Options": "OPTIONS"}

type Extractor struct{}

func New() discovery.Extractor { return Extractor{} }
func (Extractor) Name() string { return "nestjs-ast" }
func (Extractor) Applies(ctx discovery.ExtractionContext) bool {
	framework, language := false, false
	for _, v := range ctx.Detection.Frameworks {
		framework = framework || strings.EqualFold(v, "nestjs")
	}
	for _, v := range ctx.Detection.Languages {
		language = language || strings.EqualFold(v, "typescript")
	}
	return framework && language
}
func (Extractor) Extract(ctx discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	return extractProject(ctx)
}

type bindings struct {
	controller, version, versioningType, versionNeutral, factory, routerModule, module, nestCommon map[string]bool
	http                                                                                           map[string]string
}

func newBindings() bindings {
	return bindings{map[string]bool{}, map[string]bool{}, map[string]bool{}, map[string]bool{}, map[string]bool{}, map[string]bool{}, map[string]bool{}, map[string]bool{}, map[string]string{}}
}

type methodRoute struct {
	method, path string
	line         int
	versions     []string
	neutral      bool
}
type controller struct {
	name, path, file string
	versions         []string
	neutral          bool
	routes           []methodRoute
}
type module struct {
	name, file           string
	controllers, imports []string
}
type mount struct{ path, module string }
type exclusion struct{ path, method string }
type appConfig struct {
	prefix                                                                                string
	prefixConfigured, versionURI, versionConfigured, versionWarning, exclusionsUnresolved bool
	exclusions                                                                            []exclusion
}
type projectModel struct {
	controllers map[string]controller
	modules     map[string]module
	mounts      []mount
	config      appConfig
	warnings    []string
}

func extractProject(ctx discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	model := projectModel{controllers: map[string]controller{}, modules: map[string]module{}}
	for _, filename := range ctx.Files {
		if strings.ToLower(filepath.Ext(filename)) != ".ts" {
			continue
		}
		source, err := os.ReadFile(filename)
		if err != nil {
			return nil, model.warnings, fmt.Errorf("read %s: %w", filename, err)
		}
		parseFile(&model, source, filename)
	}
	for _, m := range model.modules {
		for _, imported := range m.imports {
			if _, ok := model.modules[imported]; !ok {
				model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved module reference %q in %s", imported, m.file))
			}
		}
	}
	routes := []discovery.Route{}
	for _, c := range model.controllers {
		for _, r := range c.routes {
			mounts := mountsForController(model, c.name)
			if len(mounts) == 0 {
				mounts = []mount{{}}
			}
			for _, m := range mounts {
				for _, v := range routeVersions(model.config, c, r) {
					unprefixed := joinPath(v, m.path, c.path, r.path)
					if model.config.exclusionsUnresolved && model.config.prefix != "" {
						continue
					}
					path := joinPath(model.config.prefix, unprefixed)
					if isExcluded(model.config.exclusions, r.method, unprefixed) {
						path = unprefixed
					}
					routes = append(routes, discovery.Route{Method: r.method, Path: path, Language: "typescript", Framework: "nestjs", Source: discovery.SourceLocation{File: c.file, Line: r.line}, Strategy: discovery.StrategyAST, Confidence: staticConfidence})
				}
			}
		}
	}
	sort.SliceStable(routes, func(i, j int) bool {
		if routes[i].Source.File != routes[j].Source.File {
			return routes[i].Source.File < routes[j].Source.File
		}
		return routes[i].Source.Line < routes[j].Source.Line
	})
	sort.Strings(model.warnings)
	return routes, model.warnings, nil
}

func parseFile(model *projectModel, source []byte, filename string) {
	parser := sitter.NewParser()
	defer parser.Close()
	if err := parser.SetLanguage(sitter.NewLanguage(typescript.LanguageTypescript())); err != nil {
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: configure TypeScript parser for %s: %v", filename, err))
		return
	}
	tree := parser.Parse(source, nil)
	defer tree.Close()
	root := tree.RootNode()
	if root.HasError() {
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: parse errors in %s", filename))
	}
	b := collectBindings(root, source)
	for i := uint(0); i < root.NamedChildCount(); i++ {
		statement := root.NamedChild(i)
		class := statement
		if statement.Kind() == "export_statement" {
			class = statement.ChildByFieldName("declaration")
		}
		if class != nil && class.Kind() == "class_declaration" {
			parseClass(model, class, source, filename, b, statement)
		}
	}
	findProjectCalls(model, root, source, b, filename)
}

func collectBindings(root *sitter.Node, source []byte) bindings {
	b := newBindings()
	for i := uint(0); i < root.NamedChildCount(); i++ {
		n := root.NamedChild(i)
		if n.Kind() != "import_statement" {
			continue
		}
		mod := n.ChildByFieldName("source")
		if mod == nil {
			continue
		}
		packageName := stringLiteral(mod, source)
		forEachNode(n, func(spec *sitter.Node) {
			if spec.Kind() != "import_specifier" {
				return
			}
			name, local := spec.ChildByFieldName("name"), spec.ChildByFieldName("alias")
			if local == nil {
				local = name
			}
			if name == nil || local == nil {
				return
			}
			original, alias := name.Utf8Text(source), local.Utf8Text(source)
			switch packageName {
			case "@nestjs/common":
				b.nestCommon[alias] = true
				switch original {
				case "Controller":
					b.controller[alias] = true
				case "Version":
					b.version[alias] = true
				case "VERSION_NEUTRAL":
					b.versionNeutral[alias] = true
				case "VersioningType":
					b.versioningType[alias] = true
				case "Module":
					b.module[alias] = true
				case "Get", "Post", "Put", "Patch", "Delete", "Head", "Options", "All":
					b.http[alias] = original
				}
			case "@nestjs/core":
				if original == "NestFactory" {
					b.factory[alias] = true
				}
				if original == "RouterModule" {
					b.routerModule[alias] = true
				}
			case "@nestjs/core/router":
				if original == "RouterModule" {
					b.routerModule[alias] = true
				}
			}
		})
	}
	return b
}

func parseClass(model *projectModel, class *sitter.Node, source []byte, filename string, b bindings, wrapper *sitter.Node) {
	nameNode := class.ChildByFieldName("name")
	if nameNode == nil {
		return
	}
	name := nameNode.Utf8Text(source)
	if call, ok := findDecoratorIn(class, wrapper, source, b.module); ok {
		parseModule(model, name, call, source, filename)
		return
	}
	call, ok := findDecoratorIn(class, wrapper, source, b.controller)
	if !ok {
		return
	}
	if value := firstArgument(call); value != nil && value.Kind() != "string" && value.Kind() != "object" {
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: dynamic controller prefix in %s:%d", filename, call.StartPosition().Row+1))
		return
	}
	if value := firstArgument(call); value != nil && value.Kind() == "object" {
		dynamic := false
		forEachPair(value, source, func(key string, node *sitter.Node) {
			if key == "path" {
				if _, ok := staticString(node, source); !ok {
					dynamic = true
					model.warnings = append(model.warnings, fmt.Sprintf("nestjs: dynamic controller prefix in %s:%d", filename, call.StartPosition().Row+1))
				}
			}
		})
		if dynamic {
			return
		}
	}
	c := controller{name: name, file: filename}
	c.path, c.versions, c.neutral = controllerOptions(call, source, b)
	body := class.ChildByFieldName("body")
	if body == nil {
		return
	}
	var decorators []*sitter.Node
	for i := uint(0); i < body.NamedChildCount(); i++ {
		child := body.NamedChild(i)
		if child.Kind() == "decorator" {
			decorators = append(decorators, child)
			continue
		}
		if child.Kind() != "method_definition" {
			decorators = nil
			continue
		}
		for _, d := range decorators {
			name, call, valid := decoratorCall(d, source)
			if !valid {
				continue
			}
			method, exists := b.http[name]
			if !exists {
				continue
			}
			if method == "All" {
				model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unsupported @All() route in %s:%d", filename, d.StartPosition().Row+1))
				continue
			}
			method = httpDecorators[method]
			path, good := firstString(call, source)
			if !good {
				model.warnings = append(model.warnings, fmt.Sprintf("nestjs: dynamic route path for @%s in %s:%d", name, filename, d.StartPosition().Row+1))
				continue
			}
			r := methodRoute{method: method, path: path, line: int(d.StartPosition().Row) + 1}
			parseMethodVersion(&r, decorators, source, b)
			c.routes = append(c.routes, r)
		}
		decorators = nil
	}
	model.controllers[name] = c
}

func parseModule(model *projectModel, name string, call *sitter.Node, source []byte, filename string) {
	m := module{name: name, file: filename}
	object := firstArgument(call)
	if object == nil || object.Kind() != "object" {
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved @Module metadata in %s:%d", filename, call.StartPosition().Row+1))
		return
	}
	forEachPair(object, source, func(key string, value *sitter.Node) {
		if value == nil || value.Kind() != "array" {
			return
		}
		for i := uint(0); i < value.NamedChildCount(); i++ {
			id, ok := identifier(value.NamedChild(i), source)
			if !ok {
				continue
			}
			if key == "controllers" {
				m.controllers = append(m.controllers, id)
			} else if key == "imports" {
				m.imports = append(m.imports, id)
			}
		}
	})
	model.modules[name] = m
}

func findProjectCalls(model *projectModel, root *sitter.Node, source []byte, b bindings, filename string) {
	apps := map[string]bool{}
	forEachNode(root, func(n *sitter.Node) {
		if n.Kind() != "variable_declarator" {
			return
		}
		name, value := n.ChildByFieldName("name"), n.ChildByFieldName("value")
		id, ok := identifier(name, source)
		if !ok || value == nil {
			return
		}
		call := unwrapAwait(value)
		if call == nil || call.Kind() != "call_expression" {
			return
		}
		fn := call.ChildByFieldName("function")
		if fn == nil || fn.Kind() != "member_expression" {
			return
		}
		obj, prop := fn.ChildByFieldName("object"), fn.ChildByFieldName("property")
		if obj != nil && prop != nil && obj.Kind() == "identifier" && b.factory[obj.Utf8Text(source)] && prop.Utf8Text(source) == "create" {
			apps[id] = true
		}
	})
	forEachNode(root, func(n *sitter.Node) {
		if n.Kind() != "call_expression" {
			return
		}
		fn := n.ChildByFieldName("function")
		if fn == nil || fn.Kind() != "member_expression" {
			return
		}
		obj, prop := fn.ChildByFieldName("object"), fn.ChildByFieldName("property")
		if obj == nil || prop == nil || obj.Kind() != "identifier" || !apps[obj.Utf8Text(source)] {
			return
		}
		switch prop.Utf8Text(source) {
		case "setGlobalPrefix":
			parseGlobalPrefix(model, n, source, filename)
		case "enableVersioning":
			parseVersioning(model, n, source, b, filename)
		}
	})
	forEachNode(root, func(n *sitter.Node) {
		if n.Kind() != "call_expression" {
			return
		}
		fn := n.ChildByFieldName("function")
		if fn == nil || fn.Kind() != "member_expression" {
			return
		}
		obj, prop := fn.ChildByFieldName("object"), fn.ChildByFieldName("property")
		if obj == nil || prop == nil || obj.Kind() != "identifier" || !b.routerModule[obj.Utf8Text(source)] || prop.Utf8Text(source) != "register" {
			return
		}
		parseRouterRegister(model, n, source, filename)
	})
}

func parseGlobalPrefix(model *projectModel, call *sitter.Node, source []byte, filename string) {
	value, ok := argument(call, 0)
	if !ok {
		return
	}
	prefix, ok := staticString(value, source)
	if !ok {
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: dynamic global prefix in %s:%d", filename, call.StartPosition().Row+1))
		return
	}
	model.config.prefix, model.config.prefixConfigured = prefix, true
	options, ok := argument(call, 1)
	if !ok || options.Kind() != "object" {
		return
	}
	forEachPair(options, source, func(key string, value *sitter.Node) {
		if key != "exclude" {
			return
		}
		if value.Kind() != "array" {
			model.config.exclusionsUnresolved = true
			model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved global prefix exclusions in %s:%d", filename, value.StartPosition().Row+1))
			return
		}
		for i := uint(0); i < value.NamedChildCount(); i++ {
			parseExclusion(model, value.NamedChild(i), source, filename)
		}
	})
}
func parseExclusion(model *projectModel, node *sitter.Node, source []byte, filename string) {
	if path, ok := staticString(node, source); ok {
		model.config.exclusions = append(model.config.exclusions, exclusion{path: path})
		return
	}
	if node.Kind() != "object" {
		model.config.exclusionsUnresolved = true
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved global prefix exclusion in %s:%d", filename, node.StartPosition().Row+1))
		return
	}
	e := exclusion{}
	valid := true
	forEachPair(node, source, func(key string, value *sitter.Node) {
		switch key {
		case "path":
			e.path, valid = staticString(value, source)
		case "method":
			if id, ok := identifier(value, source); ok {
				e.method = strings.ToUpper(id)
			} else if value.Kind() == "member_expression" {
				e.method = strings.ToUpper(value.ChildByFieldName("property").Utf8Text(source))
			} else {
				valid = false
			}
		}
	})
	if !valid || e.path == "" {
		model.config.exclusionsUnresolved = true
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved global prefix exclusion in %s:%d", filename, node.StartPosition().Row+1))
		return
	}
	model.config.exclusions = append(model.config.exclusions, e)
}

func parseVersioning(model *projectModel, call *sitter.Node, source []byte, b bindings, filename string) {
	model.config.versionConfigured = true
	options, ok := argument(call, 0)
	if !ok || options.Kind() != "object" {
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved versioning configuration in %s:%d", filename, call.StartPosition().Row+1))
		return
	}
	found := false
	forEachPair(options, source, func(key string, value *sitter.Node) {
		if key != "type" {
			return
		}
		found = true
		if id, ok := identifier(value, source); ok && b.versioningType[id] && id == "URI" {
			model.config.versionURI = true
			return
		}
		if value.Kind() == "member_expression" {
			obj, prop := value.ChildByFieldName("object"), value.ChildByFieldName("property")
			if obj != nil && prop != nil && b.versioningType[obj.Utf8Text(source)] && prop.Utf8Text(source) == "URI" {
				model.config.versionURI = true
				return
			}
		}
		model.config.versionWarning = true
	})
	if !found {
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved versioning strategy in %s:%d", filename, call.StartPosition().Row+1))
	} else if model.config.versionWarning {
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unsupported NestJS versioning strategy in %s:%d; preserving unversioned route paths", filename, call.StartPosition().Row+1))
	}
}

func parseRouterRegister(model *projectModel, call *sitter.Node, source []byte, filename string) {
	value, ok := argument(call, 0)
	if !ok || value.Kind() != "array" {
		model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved RouterModule.register routes in %s:%d", filename, call.StartPosition().Row+1))
		return
	}
	var walk func(*sitter.Node, string)
	walk = func(node *sitter.Node, prefix string) {
		if node.Kind() != "object" {
			model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved RouterModule route in %s:%d", filename, node.StartPosition().Row+1))
			return
		}
		path := prefix
		moduleName := ""
		var children *sitter.Node
		forEachPair(node, source, func(key string, value *sitter.Node) {
			switch key {
			case "path":
				if p, ok := staticString(value, source); ok {
					path = joinPath(prefix, p)
				} else {
					model.warnings = append(model.warnings, fmt.Sprintf("nestjs: dynamic RouterModule path in %s:%d", filename, value.StartPosition().Row+1))
				}
			case "module":
				if n, ok := identifier(value, source); ok {
					moduleName = n
				}
			case "children":
				children = value
			}
		})
		if moduleName != "" {
			if _, ok := model.modules[moduleName]; !ok {
				model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved RouterModule module reference %q in %s:%d", moduleName, filename, node.StartPosition().Row+1))
			} else {
				model.mounts = append(model.mounts, mount{path: path, module: moduleName})
			}
		}
		if children != nil && children.Kind() == "array" {
			for i := uint(0); i < children.NamedChildCount(); i++ {
				walk(children.NamedChild(i), path)
			}
		} else if children != nil {
			model.warnings = append(model.warnings, fmt.Sprintf("nestjs: unresolved RouterModule children in %s:%d", filename, children.StartPosition().Row+1))
		}
	}
	for i := uint(0); i < value.NamedChildCount(); i++ {
		walk(value.NamedChild(i), "")
	}
}

func mountsForController(model projectModel, name string) []mount {
	owners := map[string]bool{}
	for moduleName, m := range model.modules {
		for _, c := range m.controllers {
			if c == name {
				owners[moduleName] = true
			}
		}
	}
	if len(owners) == 0 {
		return nil
	}
	result := []mount{}
	seen := map[string]bool{}
	for _, root := range model.mounts {
		if reachableModule(model, root.module, owners, map[string]bool{}) {
			key := root.module + "\x00" + root.path
			if !seen[key] {
				result = append(result, root)
				seen[key] = true
			}
		}
	}
	return result
}
func reachableModule(model projectModel, current string, owners, visiting map[string]bool) bool {
	if owners[current] {
		return true
	}
	if visiting[current] {
		return false
	}
	visiting[current] = true
	for _, child := range model.modules[current].imports {
		if reachableModule(model, child, owners, visiting) {
			return true
		}
	}
	return false
}
func routeVersions(config appConfig, c controller, r methodRoute) []string {
	if !config.versionURI {
		return []string{""}
	}
	if r.neutral {
		return []string{""}
	}
	versions := r.versions
	if len(versions) == 0 {
		if c.neutral {
			return []string{""}
		}
		versions = c.versions
	}
	if len(versions) == 0 {
		return []string{""}
	}
	result := []string{}
	for _, v := range versions {
		if v != "" {
			result = append(result, "v"+strings.Trim(v, "/"))
		}
	}
	if len(result) == 0 {
		return []string{""}
	}
	return result
}
func isExcluded(exclusions []exclusion, method, path string) bool {
	for _, e := range exclusions {
		if strings.Trim(strings.TrimSpace(e.path), "/") == strings.Trim(strings.TrimSpace(path), "/") && (e.method == "" || strings.EqualFold(e.method, method)) {
			return true
		}
	}
	return false
}
func joinPath(parts ...string) string {
	result := ""
	for _, part := range parts {
		part = strings.Trim(part, "/")
		if part != "" {
			result += "/" + part
		}
	}
	if result == "" {
		return "/"
	}
	return result
}

func controllerOptions(call *sitter.Node, source []byte, b bindings) (string, []string, bool) {
	value := firstArgument(call)
	if value != nil && value.Kind() == "object" {
		path := ""
		var versions []string
		neutral := false
		forEachPair(value, source, func(key string, node *sitter.Node) {
			switch key {
			case "path":
				path, _ = staticString(node, source)
			case "version":
				versions, neutral = versionValue(node, source, b)
			}
		})
		return path, versions, neutral
	}
	path, _ := firstString(call, source)
	return path, nil, false
}
func parseMethodVersion(route *methodRoute, decorators []*sitter.Node, source []byte, b bindings) {
	for _, d := range decorators {
		name, call, ok := decoratorCall(d, source)
		if ok && b.version[name] {
			if value := firstArgument(call); value != nil {
				route.versions, route.neutral = versionValue(value, source, b)
			}
		}
	}
}
func versionValue(node *sitter.Node, source []byte, b bindings) ([]string, bool) {
	if id, ok := identifier(node, source); ok && b.versionNeutral[id] {
		return nil, true
	}
	if value, ok := staticString(node, source); ok {
		return []string{value}, false
	}
	if node.Kind() == "array" {
		var values []string
		neutral := false
		for i := uint(0); i < node.NamedChildCount(); i++ {
			v, n := versionValue(node.NamedChild(i), source, b)
			values = append(values, v...)
			neutral = neutral || n
		}
		return values, neutral
	}
	return nil, false
}
func findDecorator(class *sitter.Node, source []byte, wanted map[string]bool) (*sitter.Node, bool) {
	for i := uint(0); i < class.NamedChildCount(); i++ {
		d := class.NamedChild(i)
		if d.Kind() != "decorator" {
			continue
		}
		name, call, ok := decoratorCall(d, source)
		if ok && wanted[name] {
			return call, true
		}
	}
	return nil, false
}

func findDecoratorIn(class, wrapper *sitter.Node, source []byte, wanted map[string]bool) (*sitter.Node, bool) {
	if call, ok := findDecorator(class, source, wanted); ok {
		return call, true
	}
	if wrapper != nil && wrapper != class {
		return findDecorator(wrapper, source, wanted)
	}
	return nil, false
}
func decoratorCall(decorator *sitter.Node, source []byte) (string, *sitter.Node, bool) {
	call := decorator.NamedChild(0)
	if call == nil || call.Kind() != "call_expression" {
		return "", nil, false
	}
	fn := call.ChildByFieldName("function")
	if fn == nil || fn.Kind() != "identifier" {
		return "", nil, false
	}
	return fn.Utf8Text(source), call, true
}
func firstArgument(call *sitter.Node) *sitter.Node { n, _ := argument(call, 0); return n }
func argument(call *sitter.Node, index uint) (*sitter.Node, bool) {
	args := call.ChildByFieldName("arguments")
	if args == nil || index >= args.NamedChildCount() {
		return nil, false
	}
	return args.NamedChild(index), true
}
func firstString(call *sitter.Node, source []byte) (string, bool) {
	value, ok := argument(call, 0)
	if !ok {
		return "", true
	}
	return staticString(value, source)
}
func staticString(node *sitter.Node, source []byte) (string, bool) {
	if node == nil || node.Kind() != "string" {
		return "", false
	}
	return stringLiteral(node, source), true
}
func identifier(node *sitter.Node, source []byte) (string, bool) {
	if node != nil && node.Kind() == "identifier" {
		return node.Utf8Text(source), true
	}
	return "", false
}
func unwrapAwait(node *sitter.Node) *sitter.Node {
	if node != nil && node.Kind() == "await_expression" {
		return node.NamedChild(0)
	}
	return node
}
func stringLiteral(node *sitter.Node, source []byte) string {
	if node.Kind() == "string" && node.NamedChildCount() == 1 && node.NamedChild(0).Kind() == "string_fragment" {
		return node.NamedChild(0).Utf8Text(source)
	}
	value, err := strconv.Unquote(node.Utf8Text(source))
	if err == nil {
		return value
	}
	return ""
}
func forEachNode(node *sitter.Node, fn func(*sitter.Node)) {
	if node == nil {
		return
	}
	fn(node)
	for i := uint(0); i < node.NamedChildCount(); i++ {
		forEachNode(node.NamedChild(i), fn)
	}
}
func forEachPair(object *sitter.Node, source []byte, fn func(string, *sitter.Node)) {
	for i := uint(0); i < object.NamedChildCount(); i++ {
		pair := object.NamedChild(i)
		if pair.Kind() != "pair" {
			continue
		}
		key, value := pair.ChildByFieldName("key"), pair.ChildByFieldName("value")
		if key == nil || value == nil {
			continue
		}
		text := key.Utf8Text(source)
		text = strings.Trim(text, "'\"")
		fn(text, value)
	}
}
