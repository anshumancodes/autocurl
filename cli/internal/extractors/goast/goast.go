// Package goast contains the shared AST walker used by Go route extractors.
package goast

import (
	"fmt"
	goast "go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/anshumancodes/autocurl/internal/discovery"
)

type Config struct {
	Framework   string
	Imports     []string
	RootNames   []string
	GroupNames  []string
	AddNames    []string
	HandleNames []string
	Standard    bool
}

const confidence = .95

var methods = map[string]bool{"CONNECT": true, "DELETE": true, "GET": true, "HEAD": true, "OPTIONS": true, "PATCH": true, "POST": true, "PUT": true, "TRACE": true}

type file struct {
	path    string
	ast     *goast.File
	fset    *token.FileSet
	aliases map[string]bool
}
type model struct {
	cfg      Config
	files    []*file
	funcs    map[string]*goast.FuncDecl
	sources  map[*goast.FuncDecl]*file
	consts   map[string]string
	routes   []discovery.Route
	warnings []string
}
type env map[string]string

func Extract(ctx discovery.ExtractionContext, cfg Config) ([]discovery.Route, []string, error) {
	m := &model{cfg: cfg, funcs: map[string]*goast.FuncDecl{}, sources: map[*goast.FuncDecl]*file{}, consts: map[string]string{}}
	fset := token.NewFileSet()
	for _, path := range ctx.Files {
		if filepath.Ext(path) != ".go" {
			continue
		}
		src, err := os.ReadFile(path)
		if err != nil {
			m.warnings = append(m.warnings, fmt.Sprintf("%s: read %s: %v", cfg.Framework, path, err))
			continue
		}
		a, err := parser.ParseFile(fset, path, src, parser.AllErrors)
		if err != nil {
			m.warnings = append(m.warnings, fmt.Sprintf("%s: parse %s: %v", cfg.Framework, path, err))
		}
		if a == nil {
			continue
		}
		aliases := map[string]bool{}
		for _, im := range a.Imports {
			p, e := strconv.Unquote(im.Path.Value)
			if e != nil {
				continue
			}
			for _, want := range cfg.Imports {
				if p == want {
					n := filepath.Base(p)
					if strings.HasPrefix(n, "v") && len(p) > len(n)+1 {
						n = filepath.Base(filepath.Dir(p))
					}
					if im.Name != nil && im.Name.Name != "." && im.Name.Name != "_" {
						n = im.Name.Name
					}
					aliases[n] = true
				}
			}
		}
		f := &file{path: path, ast: a, fset: fset, aliases: aliases}
		m.files = append(m.files, f)
		collectConsts(m.consts, a)
		for _, d := range a.Decls {
			if fn, ok := d.(*goast.FuncDecl); ok && fn.Recv == nil {
				m.funcs[fn.Name.Name] = fn
				m.sources[fn] = f
			}
		}
	}
	sort.Slice(m.files, func(i, j int) bool { return m.files[i].path < m.files[j].path })
	for _, f := range m.files {
		for _, d := range f.ast.Decls {
			if fn, ok := d.(*goast.FuncDecl); ok && fn.Body != nil {
				m.analyze(fn, env{}, map[string]bool{}, f)
			}
		}
	}
	sort.SliceStable(m.routes, func(i, j int) bool {
		if m.routes[i].Source.File != m.routes[j].Source.File {
			return m.routes[i].Source.File < m.routes[j].Source.File
		}
		if m.routes[i].Source.Line != m.routes[j].Source.Line {
			return m.routes[i].Source.Line < m.routes[j].Source.Line
		}
		return m.routes[i].Method < m.routes[j].Method
	})
	sort.Strings(m.warnings)
	return m.routes, m.warnings, nil
}
func (m *model) analyze(fn *goast.FuncDecl, initial env, stack map[string]bool, src *file) {
	key := fn.Name.Name + envKey(initial)
	if stack[key] {
		return
	}
	stack[key] = true
	defer delete(stack, key)
	b := clone(initial)
	var visit func(goast.Node)
	visit = func(n goast.Node) {
		switch x := n.(type) {
		case *goast.BlockStmt:
			for _, s := range x.List {
				visit(s)
			}
		case *goast.DeclStmt:
			if g, ok := x.Decl.(*goast.GenDecl); ok {
				for _, sp := range g.Specs {
					if v, ok := sp.(*goast.ValueSpec); ok {
						for i, n := range v.Names {
							if i < len(v.Values) {
								m.bind(b, n.Name, v.Values[i], src)
							}
						}
					}
				}
			}
		case *goast.AssignStmt:
			for i, l := range x.Lhs {
				if i < len(x.Rhs) {
					if id, ok := l.(*goast.Ident); ok {
						m.bind(b, id.Name, x.Rhs[i], src)
					}
				}
			}
			for _, r := range x.Rhs {
				m.call(r, b, stack, src)
			}
		case *goast.ExprStmt:
			m.call(x.X, b, stack, src)
		case *goast.IfStmt:
			visit(x.Body)
			if x.Else != nil {
				visit(x.Else)
			}
		case *goast.ForStmt:
			if x.Init != nil {
				visit(x.Init)
			}
			visit(x.Body)
		case *goast.RangeStmt:
			visit(x.Body)
		case *goast.SwitchStmt:
			visit(x.Body)
		case *goast.TypeSwitchStmt:
			visit(x.Body)
		case *goast.SelectStmt:
			visit(x.Body)
		case *goast.ReturnStmt:
			for _, r := range x.Results {
				m.call(r, b, stack, src)
			}
		}
	}
	visit(fn.Body)
}
func (m *model) bind(e env, n string, x goast.Expr, src *file) {
	if p, ok := m.resolve(x, e, src); ok {
		e[n] = p
	} else {
		delete(e, n)
	}
}
func (m *model) call(x goast.Expr, e env, stack map[string]bool, src *file) {
	c, ok := x.(*goast.CallExpr)
	if !ok {
		return
	}
	if s, ok := c.Fun.(*goast.SelectorExpr); ok {
		name := s.Sel.Name
		if m.cfg.Standard && src.aliases[identName(s.X)] && (name == "HandleFunc" || name == "Handle") {
			m.standardCall(c, name, "/", e, src)
		} else if p, yes := m.receiver(s.X, e); yes {
			if m.cfg.Standard {
				m.standardCall(c, name, p, e, src)
			} else {
				m.frameworkCall(c, name, p, e, src)
			}
		}
	}
	if id, ok := c.Fun.(*goast.Ident); ok {
		if fn := m.funcs[id.Name]; fn != nil && fn.Body != nil {
			args := env{}
			if fn.Type.Params != nil {
				j := 0
				for _, f := range fn.Type.Params.List {
					for _, n := range f.Names {
						if j < len(c.Args) {
							if p, ok := m.receiver(c.Args[j], e); ok {
								args[n.Name] = p
							}
						}
						j++
					}
				}
			}
			m.analyze(fn, args, stack, m.sources[fn])
		}
	}
}
func (m *model) frameworkCall(c *goast.CallExpr, name, p string, e env, src *file) {
	up := strings.ToUpper(name)
	for _, n := range m.cfg.GroupNames {
		if name == n {
			return
		}
	}
	if contains(m.cfg.AddNames, name) {
		if name == "Add" && len(c.Args) > 0 {
			method, _ := m.static(c.Args[0])
			m.route(c, strings.ToUpper(method), 1, p, src)
			return
		}
		m.route(c, up, 0, p, src)
		return
	}
	if methods[up] {
		m.route(c, up, 0, p, src)
		return
	}
	if contains(m.cfg.HandleNames, name) {
		if len(c.Args) >= 2 {
			method, ok := m.static(c.Args[0])
			if !ok {
				m.warnings = append(m.warnings, fmt.Sprintf("%s: dynamic HTTP method in %s", m.cfg.Framework, src.path))
				return
			}
			m.route(c, strings.ToUpper(method), 1, p, src)
		} else {
			m.warnings = append(m.warnings, fmt.Sprintf("%s: incomplete Handle registration in %s", m.cfg.Framework, src.path))
		}
	}
	_ = e
}
func (m *model) standardCall(c *goast.CallExpr, name, p string, e env, src *file) {
	if name == "Group" {
		return
	}
	if name == "HandleFunc" || name == "Handle" {
		if len(c.Args) < 1 {
			return
		}
		if method, path, ok := m.pattern(c.Args[0]); ok {
			m.add(c, method, path, p, src)
		} else {
			m.warnings = append(m.warnings, fmt.Sprintf("nethttp: dynamic route path in %s", src.path))
		}
	}
	_ = e
}
func (m *model) route(c *goast.CallExpr, method string, idx int, p string, src *file) {
	m.add(c, method, idxString(c, idx, m), p, src)
}
func idxString(c *goast.CallExpr, i int, m *model) string {
	if i >= len(c.Args) {
		return ""
	}
	v, _ := m.static(c.Args[i])
	return v
}
func (m *model) add(c *goast.CallExpr, method, path, p string, src *file) {
	if !methods[method] {
		m.warnings = append(m.warnings, fmt.Sprintf("%s: unsupported HTTP method %q in %s", m.cfg.Framework, method, src.path))
		return
	}
	if path == "" {
		m.warnings = append(m.warnings, fmt.Sprintf("%s: dynamic route path in %s", m.cfg.Framework, src.path))
		return
	}
	pos := src.fset.Position(c.Pos())
	m.routes = append(m.routes, discovery.Route{Method: method, Path: join(p, path), Language: "go", Framework: m.cfg.Framework, Source: discovery.SourceLocation{File: src.path, Line: pos.Line}, Strategy: discovery.StrategyAST, Confidence: confidence})
}
func (m *model) pattern(x goast.Expr) (string, string, bool) {
	s, ok := m.static(x)
	if !ok {
		return "", "", false
	}
	parts := strings.SplitN(strings.TrimSpace(s), " ", 2)
	if len(parts) == 2 {
		return strings.ToUpper(parts[0]), parts[1], true
	}
	return "GET", s, true
}
func (m *model) resolve(x goast.Expr, e env, src *file) (string, bool) {
	if id, ok := x.(*goast.Ident); ok {
		p, yes := e[id.Name]
		return p, yes
	}
	if c, ok := x.(*goast.CallExpr); ok {
		if s, yes := c.Fun.(*goast.SelectorExpr); yes {
			if contains(m.cfg.RootNames, s.Sel.Name) && src.aliases[identName(s.X)] {
				return "/", true
			}
			if contains(m.cfg.GroupNames, s.Sel.Name) && len(c.Args) > 0 {
				base, yes := m.receiver(s.X, e)
				if !yes {
					return "", false
				}
				q, yes := m.static(c.Args[0])
				if !yes {
					return "", false
				}
				return join(base, q), true
			}
			if m.cfg.Standard && s.Sel.Name == "NewServeMux" && src.aliases[identName(s.X)] {
				return "/", true
			}
		}
	}
	if p, ok := m.receiver(x, e); ok {
		return p, true
	}
	return "", false
}
func (m *model) receiver(x goast.Expr, e env) (string, bool) {
	if id, ok := x.(*goast.Ident); ok {
		p, yes := e[id.Name]
		return p, yes
	}
	if p, ok := x.(*goast.ParenExpr); ok {
		return m.receiver(p.X, e)
	}
	return "", false
}
func (m *model) static(x goast.Expr) (string, bool) {
	switch q := x.(type) {
	case *goast.BasicLit:
		if q.Kind != token.STRING {
			return "", false
		}
		v, e := strconv.Unquote(q.Value)
		return v, e == nil
	case *goast.Ident:
		v, ok := m.consts[q.Name]
		return v, ok
	case *goast.BinaryExpr:
		if q.Op != token.ADD {
			return "", false
		}
		a, ao := m.static(q.X)
		b, bo := m.static(q.Y)
		return a + b, ao && bo
	case *goast.ParenExpr:
		return m.static(q.X)
	}
	return "", false
}
func (m *model) staticMethod(x goast.Expr) string { v, _ := m.static(x); return v }
func collectConsts(dst map[string]string, f *goast.File) {
	for _, d := range f.Decls {
		g, ok := d.(*goast.GenDecl)
		if !ok || g.Tok != token.CONST {
			continue
		}
		for _, s := range g.Specs {
			v, ok := s.(*goast.ValueSpec)
			if !ok {
				continue
			}
			for i, n := range v.Names {
				if i < len(v.Values) {
					if lit, ok := v.Values[i].(*goast.BasicLit); ok && lit.Kind == token.STRING {
						if x, e := strconv.Unquote(lit.Value); e == nil {
							dst[n.Name] = x
						}
					}
				}
			}
		}
	}
}
func identName(x goast.Expr) string {
	if i, ok := x.(*goast.Ident); ok {
		return i.Name
	}
	return ""
}
func contains(xs []string, s string) bool {
	for _, x := range xs {
		if x == s {
			return true
		}
	}
	return false
}
func clone(x env) env {
	y := env{}
	for k, v := range x {
		y[k] = v
	}
	return y
}
func envKey(x env) string {
	keys := []string{}
	for k := range x {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return strings.Join(keys, ",")
}
func join(a, b string) string {
	if a == "" {
		a = "/"
	}
	return strings.TrimRight(a, "/") + "/" + strings.Trim(b, "/")
}
