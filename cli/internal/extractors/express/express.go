// Package express extracts statically declared Express routes from JavaScript.
package express

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

const staticConfidence = 0.95

var routeMethods = map[string]struct{}{
	"get": {}, "post": {}, "put": {}, "patch": {}, "delete": {},
	"head": {}, "options": {}, "connect": {}, "trace": {},
}

// Extractor implements discovery.Extractor for JavaScript Express applications.
type Extractor struct{}

// New returns the Express extractor for registration with discovery.
func New() discovery.Extractor { return Extractor{} }

func (Extractor) Name() string { return "express-ast" }

func (Extractor) Applies(ctx discovery.ExtractionContext) bool {
	framework := false
	for _, value := range ctx.Detection.Frameworks {
		if strings.EqualFold(value, "express") {
			framework = true
			break
		}
	}
	if !framework {
		return false
	}
	for _, value := range ctx.Detection.Languages {
		if strings.EqualFold(value, "javascript") {
			return true
		}
	}
	return false
}

func (Extractor) Extract(ctx discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	routes := make([]discovery.Route, 0)
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
		fileRoutes, fileWarnings := extractProgram(program, path)
		routes = append(routes, fileRoutes...)
		warnings = append(warnings, fileWarnings...)
	}
	sort.Strings(warnings)
	return routes, warnings, nil
}

type bindings struct {
	expressFactories map[string]bool
	routers          map[string]bool
	apps             map[string]bool
}

func extractProgram(program *ast.Program, filename string) ([]discovery.Route, []string) {
	b := bindings{expressFactories: map[string]bool{}, routers: map[string]bool{}, apps: map[string]bool{}}
	// A first pass establishes the small, explicit set of Express bindings. This
	// avoids treating arbitrary object.get() calls as routes.
	collectBindings(program.Body, &b)

	state := routeState{bindings: b, filename: filename, file: program.File}
	for _, statement := range program.Body {
		state.visitStatement(statement)
	}
	sort.SliceStable(state.routes, func(i, j int) bool {
		return state.routes[i].Source.Line < state.routes[j].Source.Line
	})
	return state.routes, state.warnings
}

func collectBindings(statements []ast.Statement, b *bindings) {
	for _, statement := range statements {
		switch statement := statement.(type) {
		case *ast.BlockStatement:
			collectBindings(statement.List, b)
		case *ast.VariableStatement:
			collectBindingList(statement.List, b)
		case *ast.LexicalDeclaration:
			collectBindingList(statement.List, b)
		case *ast.IfStatement:
			collectBindings([]ast.Statement{statement.Consequent}, b)
			if statement.Alternate != nil {
				collectBindings([]ast.Statement{statement.Alternate}, b)
			}
		case *ast.ForStatement:
			collectBindings([]ast.Statement{statement.Body}, b)
		case *ast.ForInStatement:
			collectBindings([]ast.Statement{statement.Body}, b)
		case *ast.ForOfStatement:
			collectBindings([]ast.Statement{statement.Body}, b)
		case *ast.WhileStatement:
			collectBindings([]ast.Statement{statement.Body}, b)
		case *ast.DoWhileStatement:
			collectBindings([]ast.Statement{statement.Body}, b)
		case *ast.TryStatement:
			collectBindings(statement.Body.List, b)
			if statement.Catch != nil {
				collectBindings(statement.Catch.Body.List, b)
			}
			if statement.Finally != nil {
				collectBindings(statement.Finally.List, b)
			}
		case *ast.FunctionDeclaration:
			collectBindings(statement.Function.Body.List, b)
		}
	}
}

func collectBindingList(list []*ast.Binding, b *bindings) {
	for _, binding := range list {
		name, ok := binding.Target.(*ast.Identifier)
		if !ok || binding.Initializer == nil {
			continue
		}
		if isExpressRequire(binding.Initializer) {
			b.expressFactories[name.Name.String()] = true
			continue
		}
		if isExpressFactoryCall(binding.Initializer, b.expressFactories) {
			b.apps[name.Name.String()] = true
			continue
		}
		if isRouterFactoryCall(binding.Initializer, b.expressFactories) || isExpressRequireRouter(binding.Initializer) {
			b.routers[name.Name.String()] = true
		}
	}
}

func isExpressRequire(expression ast.Expression) bool {
	call, ok := expression.(*ast.CallExpression)
	if !ok || len(call.ArgumentList) != 1 || !isIdentifier(call.Callee, "require") {
		return false
	}
	value, ok := call.ArgumentList[0].(*ast.StringLiteral)
	return ok && value.Value.String() == "express"
}

func isExpressRequireRouter(expression ast.Expression) bool {
	dot, ok := expression.(*ast.DotExpression)
	return ok && dot.Identifier.Name.String() == "Router" && isExpressRequire(dot.Left)
}

func isExpressFactoryCall(expression ast.Expression, factories map[string]bool) bool {
	call, ok := expression.(*ast.CallExpression)
	if !ok {
		return false
	}
	name, ok := call.Callee.(*ast.Identifier)
	return ok && factories[name.Name.String()]
}

func isRouterFactoryCall(expression ast.Expression, factories map[string]bool) bool {
	call, ok := expression.(*ast.CallExpression)
	if !ok {
		return false
	}
	dot, ok := call.Callee.(*ast.DotExpression)
	if !ok || dot.Identifier.Name.String() != "Router" {
		return false
	}
	name, ok := dot.Left.(*ast.Identifier)
	return ok && factories[name.Name.String()]
}

func isIdentifier(expression ast.Expression, wanted string) bool {
	identifier, ok := expression.(*ast.Identifier)
	return ok && identifier.Name.String() == wanted
}

type routeState struct {
	bindings bindings
	filename string
	file     *file.File
	routes   []discovery.Route
	warnings []string
}

func (s *routeState) visitStatement(statement ast.Statement) {
	switch statement := statement.(type) {
	case *ast.BlockStatement:
		for _, child := range statement.List {
			s.visitStatement(child)
		}
	case *ast.ExpressionStatement:
		s.visitExpression(statement.Expression)
	case *ast.VariableStatement:
		for _, binding := range statement.List {
			if binding.Initializer != nil {
				s.visitExpression(binding.Initializer)
			}
		}
	case *ast.LexicalDeclaration:
		for _, binding := range statement.List {
			if binding.Initializer != nil {
				s.visitExpression(binding.Initializer)
			}
		}
	case *ast.IfStatement:
		s.visitExpression(statement.Test)
		s.visitStatement(statement.Consequent)
		if statement.Alternate != nil {
			s.visitStatement(statement.Alternate)
		}
	case *ast.ForStatement:
		if initializer, ok := statement.Initializer.(*ast.ForLoopInitializerExpression); ok {
			s.visitExpression(initializer.Expression)
		}
		if statement.Test != nil {
			s.visitExpression(statement.Test)
		}
		if statement.Update != nil {
			s.visitExpression(statement.Update)
		}
		s.visitStatement(statement.Body)
	case *ast.ForInStatement:
		s.visitExpression(statement.Source)
		s.visitStatement(statement.Body)
	case *ast.ForOfStatement:
		s.visitExpression(statement.Source)
		s.visitStatement(statement.Body)
	case *ast.WhileStatement:
		s.visitExpression(statement.Test)
		s.visitStatement(statement.Body)
	case *ast.DoWhileStatement:
		s.visitStatement(statement.Body)
		s.visitExpression(statement.Test)
	case *ast.ReturnStatement:
		if statement.Argument != nil {
			s.visitExpression(statement.Argument)
		}
	case *ast.ThrowStatement:
		s.visitExpression(statement.Argument)
	case *ast.TryStatement:
		s.visitStatement(statement.Body)
		if statement.Catch != nil {
			s.visitStatement(statement.Catch.Body)
		}
		if statement.Finally != nil {
			s.visitStatement(statement.Finally)
		}
	case *ast.FunctionDeclaration:
		s.visitStatement(statement.Function.Body)
	}
}

func (s *routeState) visitExpression(expression ast.Expression) {
	if expression == nil {
		return
	}
	switch expression := expression.(type) {
	case *ast.CallExpression:
		s.inspectCall(expression)
		s.visitExpression(expression.Callee)
		for _, argument := range expression.ArgumentList {
			s.visitExpression(argument)
		}
	case *ast.DotExpression:
		s.visitExpression(expression.Left)
	case *ast.BracketExpression:
		s.visitExpression(expression.Left)
		s.visitExpression(expression.Member)
	case *ast.FunctionLiteral:
		s.visitStatement(expression.Body)
	case *ast.ArrowFunctionLiteral:
		switch body := expression.Body.(type) {
		case *ast.BlockStatement:
			s.visitStatement(body)
		case *ast.ExpressionBody:
			s.visitExpression(body.Expression)
		}
	case *ast.AssignExpression:
		s.visitExpression(expression.Left)
		s.visitExpression(expression.Right)
	case *ast.BinaryExpression:
		s.visitExpression(expression.Left)
		s.visitExpression(expression.Right)
	case *ast.ConditionalExpression:
		s.visitExpression(expression.Test)
		s.visitExpression(expression.Consequent)
		s.visitExpression(expression.Alternate)
	case *ast.SequenceExpression:
		for _, child := range expression.Sequence {
			s.visitExpression(child)
		}
	case *ast.NewExpression:
		s.visitExpression(expression.Callee)
		for _, argument := range expression.ArgumentList {
			s.visitExpression(argument)
		}
	case *ast.AwaitExpression:
		s.visitExpression(expression.Argument)
	case *ast.YieldExpression:
		s.visitExpression(expression.Argument)
	case *ast.UnaryExpression:
		s.visitExpression(expression.Operand)
	case *ast.ObjectLiteral:
		for _, property := range expression.Value {
			s.visitExpression(property)
		}
	case *ast.ArrayLiteral:
		for _, child := range expression.Value {
			s.visitExpression(child)
		}
	}
}

func (s *routeState) inspectCall(call *ast.CallExpression) {
	dot, ok := call.Callee.(*ast.DotExpression)
	if !ok {
		return
	}
	receiver, ok := dot.Left.(*ast.Identifier)
	if !ok {
		return
	}
	receiverName := receiver.Name.String()
	known := s.bindings.apps[receiverName] || s.bindings.routers[receiverName]
	if !known {
		return
	}
	method := strings.ToLower(dot.Identifier.Name.String())
	if _, ok := routeMethods[method]; !ok {
		if method == "all" || method == "route" {
			s.warnings = append(s.warnings, fmt.Sprintf("express: unsupported route declaration %s.%s() in %s", receiverName, method, s.filename))
		}
		return
	}
	if len(call.ArgumentList) == 0 {
		s.warnings = append(s.warnings, fmt.Sprintf("express: unsupported route declaration %s.%s() without a path in %s", receiverName, method, s.filename))
		return
	}
	path, ok := call.ArgumentList[0].(*ast.StringLiteral)
	if !ok {
		s.warnings = append(s.warnings, fmt.Sprintf("express: dynamic path in %s.%s() in %s", receiverName, method, s.filename))
		return
	}
	position := s.file.Position(int(call.Idx0()))
	s.routes = append(s.routes, discovery.Route{
		Method: strings.ToUpper(method), Path: path.Value.String(), Language: "javascript", Framework: "express",
		Source: discovery.SourceLocation{File: s.filename, Line: position.Line}, Strategy: discovery.StrategyAST, Confidence: staticConfidence,
	})
}
