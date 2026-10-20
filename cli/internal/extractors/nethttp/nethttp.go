package nethttp

import (
	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/extractors/goast"
	"os"
	"strings"
)

type Extractor struct{}

func New() discovery.Extractor { return Extractor{} }
func (Extractor) Name() string { return "nethttp-ast" }
func (Extractor) Applies(c discovery.ExtractionContext) bool {
	for _, p := range c.Files {
		if strings.HasSuffix(p, ".go") {
			if b, e := os.ReadFile(p); e == nil && strings.Contains(string(b), "net/http") {
				return true
			}
		}
	}
	return false
}
func (Extractor) Extract(c discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	return goast.Extract(c, goast.Config{Framework: "net/http", Imports: []string{"net/http"}, Standard: true})
}
