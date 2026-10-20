// Package gin extracts statically declared Gin routes from Go projects.
package gin

import (
	"fmt"
	goast "go/ast"
	goparser "go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/anshumancodes/autocurl/internal/discovery"
)

const staticConfidence = 0.95

var routeMethods = map[string]struct{}{
	"CONNECT": {}, "DELETE": {}, "GET": {}, "HEAD": {}, "OPTIONS": {},
	"PATCH": {}, "POST": {}, "PUT": {}, "TRACE": {},
}

// Extractor implements discovery.Extractor for Gin applications.
type Extractor struct{}

func New() discovery.Extractor { return Extractor{} }

func (Extractor) Name() string { return "gin-ast" }

func (Extractor) Applies(ctx discovery.ExtractionContext) bool {
	hasGin := false
	for _, framework := range ctx.Detection.Frameworks {
		if strings.EqualFold(framework, "gin") {
			hasGin = true
			break
		}
	}
	if !hasGin {
		return false
	}
	for _, language := range ctx.Detection.Languages {
		if strings.EqualFold(language, "go") {
			return true
		}
	}
	return false
}

func (Extractor) Extract(ctx discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	model := &projectModel{
		files:          make([]*sourceFile, 0),
		funcs:          make(map[string]*goast.FuncDecl),
		functionSource: make(map[*goast.FuncDecl]*sourceFile),
		consts:         make(map[string]string),
	}

	fset := token.NewFileSet()
	for _, path := range ctx.Files {
		if !strings.EqualFold(filepath.Ext(path), ".go") {
			continue
		}
		source, err := os.ReadFile(path)
		if err != nil {
			model.warnings = append(model.warnings, fmt.Sprintf("gin: read %s: %v", path, err))
			continue
		}
		file, err := goparser.ParseFile(fset, path, source, goparser.AllErrors)
		if err != nil {
			model.warnings = append(model.warnings, fmt.Sprintf("gin: parse %s: %v", path, err))
		}
		if file == nil {
			continue
		}
		sourceFile := &sourceFile{path: path, file: file, fset: fset, ginNames: map[string]bool{"gin": true}}
		for _, imported := range file.Imports {
			importPath, unquoteErr := strconv.Unquote(imported.Path.Value)
			if unquoteErr != nil || importPath != "github.com/gin-gonic/gin" {
				continue
			}
			name := "gin"
			if imported.Name != nil && imported.Name.Name != "_" && imported.Name.Name != "." {
				name = imported.Name.Name
			}
			sourceFile.ginNames[name] = true
		}
		model.files = append(model.files, sourceFile)
		for _, declaration := range file.Decls {
			if function, ok := declaration.(*goast.FuncDecl); ok && function.Recv == nil {
				model.funcs[function.Name.Name] = function
				model.functionSource[function] = model.files[len(model.files)-1]
			}
			collectConstants(model.consts, file)
		}
	}

	sort.Slice(model.files, func(i, j int) bool { return model.files[i].path < model.files[j].path })
	for _, sourceFile := range model.files {
		for _, declaration := range sourceFile.file.Decls {
			function, ok := declaration.(*goast.FuncDecl)
			if !ok || function.Body == nil {
				continue
			}
			model.analyzeFunction(function, env{}, nil, sourceFile)
		}
	}

	sort.SliceStable(model.routes, func(i, j int) bool {
		if model.routes[i].Source.File != model.routes[j].Source.File {
			return model.routes[i].Source.File < model.routes[j].Source.File
		}
		if model.routes[i].Source.Line != model.routes[j].Source.Line {
			return model.routes[i].Source.Line < model.routes[j].Source.Line
		}
		return model.routes[i].Method < model.routes[j].Method
	})
	sort.Strings(model.warnings)
	return model.routes, model.warnings, nil
}

type sourceFile struct {
	path     string
	file     *goast.File
	fset     *token.FileSet
	ginNames map[string]bool
}

type env map[string]string

type projectModel struct {
	files          []*sourceFile
	funcs          map[string]*goast.FuncDecl
	functionSource map[*goast.FuncDecl]*sourceFile
	consts         map[string]string
	routes         []discovery.Route
	warnings       []string
}

func (m *projectModel) analyzeFunction(function *goast.FuncDecl, initial env, stack map[string]bool, source *sourceFile) {
	if stack == nil {
		stack = map[string]bool{}
	}
	key := function.Name.Name + "\x00" + envKey(initial)
	if stack[key] {
		m.warnings = append(m.warnings, fmt.Sprintf("gin: circular function call involving %s", function.Name.Name))
		return
	}
	stack[key] = true
	defer delete(stack, key)

	current := cloneEnv(initial)
	var visit func(goast.Node, env)
	visit = func(node goast.Node, bindings env) {
		switch node := node.(type) {
		case *goast.BlockStmt:
			for _, statement := range node.List {
				visit(statement, bindings)
			}
		case *goast.DeclStmt:
			if declaration, ok := node.Decl.(*goast.GenDecl); ok {
				for _, spec := range declaration.Specs {
					valueSpec, ok := spec.(*goast.ValueSpec)
					if !ok {
						continue
					}
					for i, name := range valueSpec.Names {
						if i >= len(valueSpec.Values) {
							continue
						}
						m.bindValue(bindings, name.Name, valueSpec.Values[i], source)
					}
				}
			}
		case *goast.AssignStmt:
			for i, left := range node.Lhs {
				if i >= len(node.Rhs) {
					continue
				}
				name, ok := left.(*goast.Ident)
				if ok {
					m.bindValue(bindings, name.Name, node.Rhs[i], source)
				}
			}
			for _, right := range node.Rhs {
				m.visitCall(right, bindings, stack, source)
			}
		case *goast.ExprStmt:
			m.visitCall(node.X, bindings, stack, source)
		case *goast.IfStmt:
			visit(node.Body, bindings)
			if node.Else != nil {
				visit(node.Else, bindings)
			}
		case *goast.ForStmt:
			if node.Init != nil {
				visit(node.Init, bindings)
			}
			visit(node.Body, bindings)
		case *goast.RangeStmt:
			visit(node.Body, bindings)
		case *goast.SwitchStmt:
			if node.Body != nil {
				visit(node.Body, bindings)
			}
		case *goast.TypeSwitchStmt:
			if node.Body != nil {
				visit(node.Body, bindings)
			}
		case *goast.SelectStmt:
			if node.Body != nil {
				visit(node.Body, bindings)
			}
		case *goast.ReturnStmt:
			for _, result := range node.Results {
				m.visitCall(result, bindings, stack, source)
			}
		}
	}
	visit(function.Body, current)
}

func (m *projectModel) bindValue(bindings env, name string, value goast.Expr, source *sourceFile) {
	if prefix, ok := m.resolveEngine(value, bindings, source); ok {
		bindings[name] = prefix
		return
	}
	if alias, ok := value.(*goast.Ident); ok {
		if prefix, exists := bindings[alias.Name]; exists {
			bindings[name] = prefix
			return
		}
	}
	delete(bindings, name)
}

func (m *projectModel) visitCall(expression goast.Expr, bindings env, stack map[string]bool, source *sourceFile) {
	call, ok := expression.(*goast.CallExpr)
	if !ok {
		return
	}
	selector, ok := call.Fun.(*goast.SelectorExpr)
	if ok {
		receiver, receiverOK := m.resolvePrefix(selector.X, bindings)
		if receiverOK {
			method := strings.ToUpper(selector.Sel.Name)
			if _, routeOK := routeMethods[method]; routeOK {
				m.addRoute(method, call, receiver, 0, bindings, source)
			} else if selector.Sel.Name == "Handle" {
				m.addHandleRoute(call, receiver, bindings, source)
			}
		}
	}
	if functionName, ok := call.Fun.(*goast.Ident); ok {
		if function := m.funcs[functionName.Name]; function != nil && function.Body != nil {
			arguments := env{}
			if function.Type.Params != nil {
				parameterIndex := 0
				for _, field := range function.Type.Params.List {
					for _, name := range field.Names {
						if parameterIndex < len(call.Args) {
							if prefix, ok := m.resolvePrefix(call.Args[parameterIndex], bindings); ok {
								arguments[name.Name] = prefix
							}
						}
						parameterIndex++
					}
				}
			}
			functionFile := m.functionSource[function]
			if functionFile == nil {
				functionFile = source
			}
			m.analyzeFunction(function, arguments, stack, functionFile)
		}
	}
}

func (m *projectModel) addHandleRoute(call *goast.CallExpr, prefix string, bindings env, source *sourceFile) {
	if len(call.Args) < 2 {
		m.warnings = append(m.warnings, fmt.Sprintf("gin: unsupported Handle registration without method and path in %s", source.path))
		return
	}
	method, ok := m.staticString(call.Args[0])
	if !ok {
		m.warnings = append(m.warnings, fmt.Sprintf("gin: dynamic Handle method in %s", source.path))
		return
	}
	method = strings.ToUpper(method)
	if _, ok := routeMethods[method]; !ok {
		m.warnings = append(m.warnings, fmt.Sprintf("gin: unsupported HTTP method %q in %s", method, source.path))
		return
	}
	m.addRoute(method, call, prefix, 1, bindings, source)
}

func (m *projectModel) addRoute(method string, call *goast.CallExpr, prefix string, pathIndex int, bindings env, source *sourceFile) {
	if len(call.Args) <= pathIndex {
		m.warnings = append(m.warnings, fmt.Sprintf("gin: route %s registration without path in %s", method, source.path))
		return
	}
	path, ok := m.staticString(call.Args[pathIndex])
	if !ok {
		m.warnings = append(m.warnings, fmt.Sprintf("gin: dynamic route path for %s in %s", method, source.path))
		return
	}
	position := source.fset.Position(call.Pos())
	m.routes = append(m.routes, discovery.Route{
		Method: method, Path: joinPath(prefix, path), Language: "go", Framework: "gin",
		Source:   discovery.SourceLocation{File: source.path, Line: position.Line},
		Strategy: discovery.StrategyAST, Confidence: staticConfidence,
	})
}

func (m *projectModel) resolveEngine(expression goast.Expr, bindings env, source *sourceFile) (string, bool) {
	if call, ok := expression.(*goast.CallExpr); ok {
		if selector, ok := call.Fun.(*goast.SelectorExpr); ok {
			if ident, ok := selector.X.(*goast.Ident); ok && (selector.Sel.Name == "New" || selector.Sel.Name == "Default") && source.ginNames[ident.Name] {
				return "/", true
			}
			if selector.Sel.Name == "Group" {
				return m.resolveGroupPrefix(call, bindings)
			}
		}
	}
	return "", false
}

func (m *projectModel) resolveGroupPrefix(call *goast.CallExpr, bindings env) (string, bool) {
	selector, ok := call.Fun.(*goast.SelectorExpr)
	if !ok || selector.Sel.Name != "Group" || len(call.Args) == 0 {
		return "", false
	}
	base, ok := m.resolvePrefix(selector.X, bindings)
	if !ok {
		return "", false
	}
	prefix, ok := m.staticString(call.Args[0])
	if !ok {
		return "", false
	}
	return joinPath(base, prefix), true
}

func (m *projectModel) resolvePrefix(expression goast.Expr, bindings env) (string, bool) {
	if ident, ok := expression.(*goast.Ident); ok {
		prefix, exists := bindings[ident.Name]
		return prefix, exists
	}
	if call, ok := expression.(*goast.CallExpr); ok {
		return m.resolveGroupPrefix(call, bindings)
	}
	if paren, ok := expression.(*goast.ParenExpr); ok {
		return m.resolvePrefix(paren.X, bindings)
	}
	return "", false
}

func (m *projectModel) staticString(expression goast.Expr) (string, bool) {
	switch expression := expression.(type) {
	case *goast.BasicLit:
		if expression.Kind != token.STRING {
			return "", false
		}
		value, err := strconv.Unquote(expression.Value)
		return value, err == nil
	case *goast.Ident:
		value, ok := m.consts[expression.Name]
		return value, ok
	case *goast.SelectorExpr:
		if packageName, ok := expression.X.(*goast.Ident); ok && packageName.Name == "http" && strings.HasPrefix(expression.Sel.Name, "Method") {
			return strings.TrimPrefix(expression.Sel.Name, "Method"), true
		}
	case *goast.BinaryExpr:
		if expression.Op != token.ADD {
			return "", false
		}
		left, leftOK := m.staticString(expression.X)
		right, rightOK := m.staticString(expression.Y)
		return left + right, leftOK && rightOK
	case *goast.ParenExpr:
		return m.staticString(expression.X)
	}
	return "", false
}

func collectConstants(constants map[string]string, file *goast.File) {
	for _, declaration := range file.Decls {
		gen, ok := declaration.(*goast.GenDecl)
		if !ok || gen.Tok != token.CONST {
			continue
		}
		for _, spec := range gen.Specs {
			values, ok := spec.(*goast.ValueSpec)
			if !ok {
				continue
			}
			for i, name := range values.Names {
				if i >= len(values.Values) {
					continue
				}
				if literal, ok := values.Values[i].(*goast.BasicLit); ok && literal.Kind == token.STRING {
					if value, err := strconv.Unquote(literal.Value); err == nil {
						constants[name.Name] = value
					}
				}
			}
		}
	}
}

func cloneEnv(input env) env {
	output := env{}
	for key, value := range input {
		output[key] = value
	}
	return output
}

func envKey(values env) string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, key+"="+values[key])
	}
	return strings.Join(parts, ",")
}

func joinPath(prefix, path string) string {
	if prefix == "" {
		prefix = "/"
	}
	if path == "" {
		path = "/"
	}
	return strings.TrimRight(prefix, "/") + "/" + strings.Trim(path, "/")
}
