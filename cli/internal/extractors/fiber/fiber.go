package fiber

import (
	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/extractors/goast"
	"strings"
)

type Extractor struct{}

func New() discovery.Extractor                               { return Extractor{} }
func (Extractor) Name() string                               { return "fiber-ast" }
func (Extractor) Applies(c discovery.ExtractionContext) bool { return has(c, "fiber") && has(c, "go") }
func (Extractor) Extract(c discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	return goast.Extract(c, goast.Config{Framework: "fiber", Imports: []string{"github.com/gofiber/fiber/v2"}, RootNames: []string{"New"}, GroupNames: []string{"Group"}, AddNames: []string{"Add"}})
}
func has(c discovery.ExtractionContext, w string) bool {
	for _, x := range append(c.Detection.Frameworks, c.Detection.Languages...) {
		if strings.EqualFold(x, w) {
			return true
		}
	}
	return false
}
