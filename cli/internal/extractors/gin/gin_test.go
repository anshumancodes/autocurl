package gin

import (
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"sort"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/generator"
	"github.com/anshumancodes/autocurl/internal/parser"
	"github.com/anshumancodes/autocurl/internal/project"
)

func TestExtractRoutesGroupsAliasesAndHandle(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"main.go": `package main
import "github.com/gin-gonic/gin"
const apiPrefix = "/api"
func main() {
  router := gin.Default()
  api := router.Group(apiPrefix)
  v1 := api.Group("/v1")
  alias := v1
  router.GET("/health", handler)
  alias.POST("/users", handler)
  alias.PUT("/users/:id", handler)
  alias.PATCH("/users/:id", handler)
  alias.DELETE("/users/:id", handler)
  alias.Handle("GET", "/reports", handler)
}`,
	})
	routes, warnings, err := Extractor{}.Extract(contextFor(t, root))
	if err != nil || len(warnings) != 0 {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	want := []string{
		"DELETE /api/v1/users/:id", "GET /api/v1/reports", "GET /health",
		"PATCH /api/v1/users/:id", "POST /api/v1/users", "PUT /api/v1/users/:id",
	}
	if got := routeKeys(routes); !reflect.DeepEqual(got, want) {
		t.Fatalf("routes=%v, want %v", got, want)
	}
	for _, route := range routes {
		if route.Language != "go" || route.Framework != "gin" || route.Strategy != discovery.StrategyAST || route.Source.Line <= 0 {
			t.Errorf("route metadata=%#v", route)
		}
	}
}

func TestExtractProjectRoutesAcrossFiles(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"main.go": `package main
import "github.com/gin-gonic/gin"
func main() { router := gin.New(); router.GET("/health", handler); register(router) }

func handler() {}`,
		"routes.go": `package main
import "github.com/gin-gonic/gin"
func register(router *gin.Engine) {
  router.GET("/users", handler)
  api := router.Group("/api")
  api.GET("/users/:id", handler)
}`,
	})
	routes, warnings, err := Extractor{}.Extract(contextFor(t, root))
	if err != nil || len(warnings) != 0 {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	if got, want := routeKeys(routes), []string{"GET /api/users/:id", "GET /health", "GET /users"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("routes=%v, want %v", got, want)
	}
	if routes[0].Source.File == routes[1].Source.File {
		t.Fatalf("expected routes from multiple files, got %#v", routes)
	}
}

func TestExtractSkipsDynamicRegistrationsAndMalformedFiles(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"bad.go": `package main
func broken( {`,
		"routes.go": `package main
import "github.com/gin-gonic/gin"
func main() { router := gin.Default(); register(router, "") }
func register(router *gin.Engine, path string) {
  router.GET(path, handler)
  router.Handle("CUSTOM", "/custom", handler)
  router.POST("/ok", handler)
}`,
	})
	routes, warnings, err := Extractor{}.Extract(contextFor(t, root))
	if err != nil || len(routes) != 1 || routes[0].Path != "/ok" {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	if !containsWarning(warnings, "parse") || !containsWarning(warnings, "dynamic route path") || !containsWarning(warnings, "unsupported HTTP method") {
		t.Fatalf("warnings=%v", warnings)
	}
}

func TestDiscoverDeduplicatesAndGeneratesParserCompatibleAutocurl(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"go.mod": `module example.test/api
go 1.23
require github.com/gin-gonic/gin v1.10.0`,
		"main.go": `package main
import "github.com/gin-gonic/gin"
func main() { r := gin.Default(); r.GET("/users/:id", handler) }`,
		"duplicate.go": `package main
import "github.com/gin-gonic/gin"
func duplicate(r *gin.Engine) { r.GET("/users/:id", handler) }`,
	})
	result, err := discovery.Discover(root, discovery.DiscoverOptions{Extractors: []discovery.Extractor{New()}})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Routes) != 1 || result.Routes[0].Path != "/users/{id}" {
		t.Fatalf("normalized result=%#v warnings=%v", result.Routes, result.Warnings)
	}
	content, err := generator.Generate(result.Routes, generator.Options{ProjectName: "api", ProjectRoot: root})
	if err != nil {
		t.Fatal(err)
	}
	document, err := parser.Parse(content)
	if err != nil || len(document.Requests) != 1 || document.Requests[0].URL != "{{baseUrl}}/users/{{id}}" {
		t.Fatalf("generated content=%q document=%#v err=%v", content, document, err)
	}
}

func TestAppliesAndProjectDetection(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"main.go": `package main
import "github.com/gin-gonic/gin"
func main() { _ = gin.New() }`,
	})
	detection, err := project.Detect(root)
	if err != nil {
		t.Fatal(err)
	}
	if !contains(detection.Languages, "go") || !contains(detection.Frameworks, "gin") {
		t.Fatalf("detection=%#v", detection)
	}
	if !(Extractor{}).Applies(discovery.ExtractionContext{Detection: detection}) {
		t.Fatal("expected Gin extractor to apply")
	}
	if (Extractor{}).Applies(discovery.ExtractionContext{Detection: project.DetectionResult{Languages: []string{"go"}, Frameworks: []string{"echo"}}}) {
		t.Fatal("extractor applied to non-Gin project")
	}
}

func TestGinDemoFixtureEndToEnd(t *testing.T) {
	_, testFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("could not locate Gin test source file")
	}
	root := filepath.Join(filepath.Dir(testFile), "..", "..", "..", "testdata", "gin-demo")
	detection, err := project.Detect(root)
	if err != nil {
		t.Fatal(err)
	}
	scan, err := project.Scan(root, project.ScanOptions{})
	if err != nil {
		t.Fatal(err)
	}
	result, err := discovery.Discover(root, discovery.DiscoverOptions{
		ScanOptions: project.ScanOptions{},
		Extractors:  []discovery.Extractor{New()},
	})
	if err != nil {
		t.Fatal(err)
	}
	if !contains(detection.Frameworks, "gin") || len(scan.Files) != 2 {
		t.Fatalf("detection=%#v files=%v", detection, scan.Files)
	}
	if got, want := routeKeys(result.Routes), []string{"GET /api/users", "GET /api/users/{id}", "GET /health", "POST /api/users"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("routes=%v, want %v; warnings=%v", got, want, result.Warnings)
	}
	content, err := generator.Generate(result.Routes, generator.Options{ProjectName: "gin-demo", ProjectRoot: root})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := parser.Parse(content); err != nil {
		t.Fatalf("generated Gin fixture is not parser-compatible: %v\n%s", err, content)
	}
}

func contextFor(t *testing.T, root string) discovery.ExtractionContext {
	t.Helper()
	scan, err := project.Scan(root, project.ScanOptions{})
	if err != nil {
		t.Fatal(err)
	}
	return discovery.ExtractionContext{Root: scan.Root, Files: scan.Files, Detection: project.DetectionResult{Languages: []string{"go"}, Frameworks: []string{"gin"}}}
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
