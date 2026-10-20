package goast

import (
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"testing"

	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/generator"
	"github.com/anshumancodes/autocurl/internal/parser"
	"github.com/anshumancodes/autocurl/internal/project"
)

func TestEchoAndFiberGroupsAndCrossFileRoutes(t *testing.T) {
	for _, tc := range []struct {
		name, importPath, framework string
		config                      Config
	}{
		{"echo", "github.com/labstack/echo/v4", "echo", Config{Framework: "echo", Imports: []string{"github.com/labstack/echo/v4"}, RootNames: []string{"New"}, GroupNames: []string{"Group"}, AddNames: []string{"Add"}, HandleNames: []string{"Handle"}}},
		{"fiber", "github.com/gofiber/fiber/v2", "fiber", Config{Framework: "fiber", Imports: []string{"github.com/gofiber/fiber/v2"}, RootNames: []string{"New"}, GroupNames: []string{"Group"}, AddNames: []string{"Add"}}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			root := fixture(t, map[string]string{
				"main.go":   "package main\nimport \"" + tc.importPath + "\"\nfunc main(){ r := " + tc.name + ".New(); api := r.Group(\"/api\"); register(api) }\n",
				"routes.go": "package main\nfunc register(r interface{ GET(string, ...func()) }) { r.GET(\"/users\") }\n",
			})
			scan, _ := project.Scan(root, project.ScanOptions{})
			routes, warnings, err := Extract(discovery.ExtractionContext{Files: scan.Files}, tc.config)
			if err != nil || len(warnings) != 0 || !reflect.DeepEqual(keys(routes), []string{"GET /api/users"}) {
				t.Fatalf("routes=%v warnings=%v err=%v", keys(routes), warnings, err)
			}
		})
	}
}

func TestNetHTTPPatternsAndFalsePositiveAvoidance(t *testing.T) {
	root := fixture(t, map[string]string{
		"main.go": `package main
import "net/http"
const prefix = "/api"
func main() {
 mux := http.NewServeMux()
 mux.HandleFunc("GET /users/{id}", handler)
 mux.Handle("POST "+prefix+"/users", handler)
 http.HandleFunc("/health", handler)
 other := thing{}
 other.Handle("/not-a-route", handler)
 register(mux)
}
func register(m *http.ServeMux) { m.HandleFunc("DELETE /users", handler) }
type thing struct{}
func (thing) Handle(string, func()) {}
func handler(w http.ResponseWriter, r *http.Request) {}
`,
	})
	scan, _ := project.Scan(root, project.ScanOptions{})
	routes, warnings, err := Extract(discovery.ExtractionContext{Files: scan.Files}, Config{Framework: "net/http", Imports: []string{"net/http"}, Standard: true})
	if err != nil || len(warnings) != 0 {
		t.Fatalf("routes=%v warnings=%v err=%v", routes, warnings, err)
	}
	want := []string{"DELETE /users", "GET /health", "GET /users/{id}", "POST /api/users"}
	if got := keys(routes); !reflect.DeepEqual(got, want) {
		t.Fatalf("routes=%v want=%v", got, want)
	}
	content, err := generator.Generate(discovery.NormalizeRoutes(routes).Routes, generator.Options{ProjectName: "nethttp", ProjectRoot: root})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := parser.Parse(content); err != nil {
		t.Fatalf("generated content is not parser-compatible: %v", err)
	}
}

func fixture(t *testing.T, files map[string]string) string {
	t.Helper()
	root := t.TempDir()
	for name, body := range files {
		p := filepath.Join(root, name)
		if err := os.MkdirAll(filepath.Dir(p), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(p, []byte(body), 0644); err != nil {
			t.Fatal(err)
		}
	}
	return root
}
func keys(routes []discovery.Route) []string {
	out := make([]string, 0, len(routes))
	for _, r := range routes {
		out = append(out, r.Method+" "+r.Path)
	}
	sort.Strings(out)
	return out
}
