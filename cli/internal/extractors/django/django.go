package django

import (
	_ "embed"
	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/extractors/pythonast"
	"sort"
	"strings"
)

//go:embed ast_helper.py
var helper []byte

type Extractor struct{}

func New() discovery.Extractor { return Extractor{} }
func (Extractor) Name() string { return "django-ast" }
func (Extractor) Applies(ctx discovery.ExtractionContext) bool {
	for _, l := range ctx.Detection.Languages {
		if strings.EqualFold(l, "python") {
			for _, f := range ctx.Detection.Frameworks {
				if strings.EqualFold(f, "django") || strings.EqualFold(f, "drf") {
					return true
				}
			}
		}
	}
	return false
}
func (Extractor) Extract(ctx discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	got, warnings, err := pythonast.Run(ctx.Files, "django", helper)
	if err != nil {
		return nil, warnings, err
	}
	routes := make([]discovery.Route, 0, len(got))
	for _, r := range got {
		routes = append(routes, discovery.Route{Method: r.Method, Path: r.Path, Language: "python", Framework: "django", Source: discovery.SourceLocation{File: r.File, Line: r.Line}, Strategy: discovery.StrategyAST, Confidence: .95})
	}
	sort.SliceStable(routes, func(i, j int) bool {
		if routes[i].Source.File != routes[j].Source.File {
			return routes[i].Source.File < routes[j].Source.File
		}
		if routes[i].Source.Line != routes[j].Source.Line {
			return routes[i].Source.Line < routes[j].Source.Line
		}
		return routes[i].Method < routes[j].Method
	})
	return routes, warnings, nil
}
