package fastapi

import (
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/generator"
	"github.com/anshumancodes/autocurl/internal/parser"
	"github.com/anshumancodes/autocurl/internal/project"
)

func TestExtractFastAPIPatternsAndNestedRouters(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"requirements.txt": `fastapi>=0.100
`,
		"main.py": `from fastapi import FastAPI as API
from routers import api as imported
app = API()
app.include_router(imported, prefix="/api")
@app.get("/health")
def health(): pass
`,
		"routers.py": `from fastapi import APIRouter as Router
router = Router(prefix="/v1")
api = router
@api.post("/users/{user_id}")
def create(): pass
@api.api_route("/users", methods=("GET", "POST", "PATCH"))
def users(): pass
`,
	})
	routes, warnings, err := Extractor{}.Extract(contextFor(t, root))
	if err != nil || len(warnings) != 0 {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	want := []string{"GET /api/v1/users", "GET /health", "PATCH /api/v1/users", "POST /api/v1/users", "POST /api/v1/users/{user_id}"}
	if got := routeKeys(routes); !reflect.DeepEqual(got, want) {
		t.Fatalf("routes=%v, want %v", got, want)
	}
	for _, route := range routes {
		if route.Language != "python" || route.Framework != "fastapi" || route.Strategy != discovery.StrategyAST || route.Source.Line <= 0 {
			t.Errorf("route metadata=%#v", route)
		}
	}
}

func TestExtractSkipsDynamicFastAPIRoutesAndPrefixes(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"requirements.txt": `fastapi
`,
		"app.py": `from fastapi import FastAPI, APIRouter
import os
app = FastAPI()
prefix = os.getenv("PREFIX")
router = APIRouter(prefix=prefix)
@app.get(prefix)
def dynamic(): pass
@app.delete("/ok")
def ok(): pass
app.include_router(router, prefix=prefix)
`,
	})
	routes, warnings, err := Extractor{}.Extract(contextFor(t, root))
	if err != nil || len(routes) != 1 || routes[0].Path != "/ok" {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	if !containsWarning(warnings, "dynamic route path") || !containsWarning(warnings, "dynamic router prefix") || !containsWarning(warnings, "dynamic include_router prefix") {
		t.Fatalf("warnings=%v", warnings)
	}
}

func TestFastAPIDemoFixtureEndToEnd(t *testing.T) {
	root, err := filepath.Abs(filepath.Join("..", "..", "..", "testdata", "fastapi-demo"))
	if err != nil {
		t.Fatal(err)
	}
	detection, err := project.Detect(root)
	if err != nil {
		t.Fatal(err)
	}
	result, err := discovery.Discover(root, discovery.DiscoverOptions{Extractors: []discovery.Extractor{New()}})
	if err != nil {
		t.Fatal(err)
	}
	if !contains(detection.Languages, "python") || !contains(detection.Frameworks, "fastapi") {
		t.Fatalf("detection=%#v", detection)
	}
	if got, want := routeKeys(result.Routes), []string{"GET /api/v1/users", "GET /api/v1/users/{user_id}", "GET /health", "POST /api/v1/users"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("routes=%v, want %v; warnings=%v", got, want, result.Warnings)
	}
	content, err := generator.Generate(result.Routes, generator.Options{ProjectName: "fastapi-demo", ProjectRoot: root})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := parser.Parse(content); err != nil {
		t.Fatalf("generated FastAPI fixture is not parser-compatible: %v\n%s", err, content)
	}
	if !strings.Contains(content, "GET {{baseUrl}}/api/v1/users/{{user_id}}") {
		t.Fatalf("generated content=%q", content)
	}
}

func TestAppliesOnlyToFastAPIPythonProjects(t *testing.T) {
	if !(Extractor{}).Applies(discovery.ExtractionContext{Detection: project.DetectionResult{Languages: []string{"python"}, Frameworks: []string{"fastapi"}}}) {
		t.Fatal("expected FastAPI extractor to apply")
	}
	if (Extractor{}).Applies(discovery.ExtractionContext{Detection: project.DetectionResult{Languages: []string{"typescript"}, Frameworks: []string{"fastapi"}}}) {
		t.Fatal("applied to non-Python project")
	}
}

func contextFor(t *testing.T, root string) discovery.ExtractionContext {
	t.Helper()
	scan, err := project.Scan(root, project.ScanOptions{})
	if err != nil {
		t.Fatal(err)
	}
	return discovery.ExtractionContext{Root: scan.Root, Files: scan.Files, Detection: project.DetectionResult{Languages: []string{"python"}, Frameworks: []string{"fastapi"}}}
}

func fixtureProject(t *testing.T, files map[string]string) string {
	t.Helper()
	root := t.TempDir()
	for name, contents := range files {
		path := filepath.Join(root, name)
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return root
}

func routeKeys(routes []discovery.Route) []string {
	keys := make([]string, 0, len(routes))
	for _, route := range routes {
		keys = append(keys, route.Method+" "+route.Path)
	}
	sort.Strings(keys)
	return keys
}

func contains(values []string, wanted string) bool {
	for _, value := range values {
		if value == wanted {
			return true
		}
	}
	return false
}
func containsWarning(values []string, wanted string) bool {
	for _, value := range values {
		if strings.Contains(value, wanted) {
			return true
		}
	}
	return false
}
