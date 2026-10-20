package echo

import (
	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/extractors/goast"
	"strings"
)

type Extractor struct{}

func New() discovery.Extractor                               { return Extractor{} }
func (Extractor) Name() string                               { return "echo-ast" }
func (Extractor) Applies(c discovery.ExtractionContext) bool { return has(c, "echo") && has(c, "go") }
func (Extractor) Extract(c discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	return goast.Extract(c, goast.Config{Framework: "echo", Imports: []string{"github.com/labstack/echo/v4"}, RootNames: []string{"New"}, GroupNames: []string{"Group"}, AddNames: []string{"Add"}, HandleNames: []string{"Handle"}})
}
func has(c discovery.ExtractionContext, w string) bool {
	for _, x := range append(c.Detection.Frameworks, c.Detection.Languages...) {
		if strings.EqualFold(x, w) {
			return true
		}
	}
	return false
}
