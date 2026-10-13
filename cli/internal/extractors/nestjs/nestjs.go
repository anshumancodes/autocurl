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

var httpDecorators = map[string]string{
	"Get": "GET", "Post": "POST", "Put": "PUT", "Patch": "PATCH",
	"Delete": "DELETE", "Head": "HEAD", "Options": "OPTIONS",
}

// Extractor implements discovery.Extractor for TypeScript NestJS projects.
type Extractor struct{}

// New returns the NestJS extractor for registration with discovery.
func New() discovery.Extractor { return Extractor{} }

func (Extractor) Name() string { return "nestjs-ast" }

func (Extractor) Applies(ctx discovery.ExtractionContext) bool {
	framework := false
	for _, value := range ctx.Detection.Frameworks {
		if strings.EqualFold(value, "nestjs") {
			framework = true
			break
		}
	}
	if !framework {
		return false
	}
	for _, value := range ctx.Detection.Languages {
		if strings.EqualFold(value, "typescript") {
			return true
		}
	}
	return false
}

func (Extractor) Extract(ctx discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	return extractProject(ctx)
}

func extractProject(ctx discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	routes := make([]discovery.Route, 0)
	warnings := make([]string, 0)
	for _, filename := range ctx.Files {
		if strings.ToLower(filepath.Ext(filename)) != ".ts" {
			continue
		}
		data, err := os.ReadFile(filename)
		if err != nil {
			return routes, warnings, fmt.Errorf("read %s: %w", filename, err)
		}
		fileRoutes, fileWarnings := extractFile(data, filename)
		routes = append(routes, fileRoutes...)
		warnings = append(warnings, fileWarnings...)
	}
	sort.SliceStable(routes, func(i, j int) bool {
		if routes[i].Source.File != routes[j].Source.File {
			return routes[i].Source.File < routes[j].Source.File
		}
		return routes[i].Source.Line < routes[j].Source.Line
	})
	sort.Strings(warnings)
	return routes, warnings, nil
}

func extractFile(source []byte, filename string) ([]discovery.Route, []string) {
	parser := sitter.NewParser()
	defer parser.Close()
	if err := parser.SetLanguage(sitter.NewLanguage(typescript.LanguageTypescript())); err != nil {
		return nil, []string{fmt.Sprintf("nestjs: configure TypeScript parser for %s: %v", filename, err)}
	}
	tree := parser.Parse(source, nil)
	defer tree.Close()
	root := tree.RootNode()
	warnings := make([]string, 0)
	if root.HasError() {
		warnings = append(warnings, fmt.Sprintf("nestjs: parse errors in %s", filename))
	}

	bindings := collectNestBindings(root, source)
	if len(bindings.controller) == 0 || len(bindings.http) == 0 {
		return nil, warnings
	}
	state := fileState{source: source, filename: filename, bindings: bindings}
	for i := uint(0); i < root.NamedChildCount(); i++ {
		child := root.NamedChild(i)
		if child.Kind() == "class_declaration" {
			state.visitClass(child)
		} else if child.Kind() == "export_statement" {
			declaration := child.ChildByFieldName("declaration")
			if declaration != nil && declaration.Kind() == "class_declaration" {
				state.visitClass(declaration, child)
			}
		}
	}
	warnings = append(warnings, state.warnings...)
	return state.routes, warnings
}

type nestBindings struct {
	controller map[string]bool
	http       map[string]string
}

func collectNestBindings(root *sitter.Node, source []byte) nestBindings {
	b := nestBindings{controller: make(map[string]bool), http: make(map[string]string)}
	for i := uint(0); i < root.NamedChildCount(); i++ {
		statement := root.NamedChild(i)
		if statement.Kind() != "import_statement" {
			continue
		}
		module := statement.ChildByFieldName("source")
		if module == nil || stringLiteral(module, source) != "@nestjs/common" {
			continue
		}
		var namedImports *sitter.Node
		for j := uint(0); j < statement.NamedChildCount(); j++ {
			child := statement.NamedChild(j)
			if child.Kind() != "import_clause" {
				continue
			}
			for k := uint(0); k < child.NamedChildCount(); k++ {
				if child.NamedChild(k).Kind() == "named_imports" {
					namedImports = child.NamedChild(k)
				}
			}
		}
		if namedImports == nil {
			continue
		}
		for k := uint(0); k < namedImports.NamedChildCount(); k++ {
			spec := namedImports.NamedChild(k)
			if spec.Kind() != "import_specifier" {
				continue
			}
			name := spec.ChildByFieldName("name")
			local := spec.ChildByFieldName("alias")
			if local == nil {
				local = name
			}
			if name == nil || local == nil {
				continue
			}
			localName := local.Utf8Text(source)
			switch name.Utf8Text(source) {
			case "Controller":
				b.controller[localName] = true
			case "Get", "Post", "Put", "Patch", "Delete", "Head", "Options", "All":
				b.http[localName] = name.Utf8Text(source)
			}
		}
	}
	return b
}

type fileState struct {
	source   []byte
	filename string
	bindings nestBindings
	routes   []discovery.Route
	warnings []string
}

func (s *fileState) visitClass(class *sitter.Node, wrappers ...*sitter.Node) {
	body := class.ChildByFieldName("body")
	if body == nil || body.Kind() != "class_body" {
		return
	}
	controller, ok := s.controllerDecorator(class, wrappers...)
	if !ok {
		return
	}
	prefix, ok := decoratorPath(controller, s.source)
	if !ok {
		s.warnings = append(s.warnings, fmt.Sprintf("nestjs: dynamic controller prefix in %s:%d", s.filename, controller.StartPosition().Row+1))
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
		for _, decorator := range decorators {
			s.visitMethodDecorator(decorator, prefix)
		}
		decorators = nil
	}
}

func (s *fileState) controllerDecorator(class *sitter.Node, wrappers ...*sitter.Node) (*sitter.Node, bool) {
	objects := append([]*sitter.Node{class}, wrappers...)
	for _, object := range objects {
		for i := uint(0); i < object.NamedChildCount(); i++ {
			child := object.NamedChild(i)
			if child.Kind() != "decorator" {
				continue
			}
			name, call, ok := decoratorCall(child, s.source)
			if ok && s.bindings.controller[name] {
				return call, true
			}
		}
	}
	return nil, false
}

func (s *fileState) visitMethodDecorator(decorator *sitter.Node, prefix string) {
	name, call, valid := decoratorCall(decorator, s.source)
	if !valid {
		return
	}
	canonical, ok := s.bindings.http[name]
	if !ok {
		return
	}
	if canonical == "All" {
		s.warnings = append(s.warnings, fmt.Sprintf("nestjs: unsupported @All() route in %s:%d", s.filename, decorator.StartPosition().Row+1))
		return
	}
	path, ok := decoratorPath(call, s.source)
	if !ok {
		s.warnings = append(s.warnings, fmt.Sprintf("nestjs: dynamic route path for @%s in %s:%d", name, s.filename, decorator.StartPosition().Row+1))
		return
	}
	s.routes = append(s.routes, discovery.Route{
		Method: httpDecorators[canonical], Path: composePath(prefix, path), Language: "typescript", Framework: "nestjs",
		Source:   discovery.SourceLocation{File: s.filename, Line: int(decorator.StartPosition().Row) + 1},
		Strategy: discovery.StrategyAST, Confidence: staticConfidence,
	})
}

func decoratorCall(decorator *sitter.Node, source []byte) (string, *sitter.Node, bool) {
	call := decorator.NamedChild(0)
	if call == nil || call.Kind() != "call_expression" {
		return "", nil, false
	}
	function := call.ChildByFieldName("function")
	if function == nil || function.Kind() != "identifier" {
		return "", nil, false
	}
	return function.Utf8Text(source), call, true
}

func decoratorPath(call *sitter.Node, source []byte) (string, bool) {
	arguments := call.ChildByFieldName("arguments")
	if arguments == nil || arguments.NamedChildCount() == 0 {
		return "", true
	}
	if arguments.NamedChildCount() != 1 {
		return "", false
	}
	value := arguments.NamedChild(0)
	if value.Kind() != "string" {
		return "", false
	}
	return stringLiteral(value, source), true
}

func stringLiteral(node *sitter.Node, source []byte) string {
	if node.Kind() == "string" && node.NamedChildCount() == 1 && node.NamedChild(0).Kind() == "string_fragment" {
		return node.NamedChild(0).Utf8Text(source)
	}
	raw := node.Utf8Text(source)
	if value, err := strconv.Unquote(raw); err == nil {
		return value
	}
	return ""
}

func composePath(prefix, route string) string {
	prefix = strings.Trim(prefix, "/")
	route = strings.Trim(route, "/")
	switch {
	case prefix == "" && route == "":
		return "/"
	case prefix == "":
		return "/" + route
	case route == "":
		return "/" + prefix
	default:
		return "/" + prefix + "/" + route
	}
}
