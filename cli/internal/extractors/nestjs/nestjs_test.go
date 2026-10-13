package nestjs

import (
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/project"
)

const nestImports = `import { All, Controller, Delete, Get, Head, Options, Patch, Post, Put } from '@nestjs/common';`

func TestExtractNestJSRoutesAndMetadata(t *testing.T) {
	root := fixtureProject(t, map[string]string{"users.controller.ts": nestImports + `
@Controller('/api/users/')
export class UsersController {
  @Get() findAll() {}
  @Get(':id') findOne() {}
  @Post('create') create() {}
  @Put(':id') update() {}
  @Patch(':id') patch() {}
  @Delete(':id') remove() {}
  @Head() head() {}
  @Options() options() {}
}`})
	routes, warnings, err := (Extractor{}).Extract(nestContext(t, root))
	if err != nil || len(warnings) != 0 {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	want := []string{"DELETE /api/users/:id", "GET /api/users", "GET /api/users/:id", "HEAD /api/users", "OPTIONS /api/users", "PATCH /api/users/:id", "POST /api/users/create", "PUT /api/users/:id"}
	if got := routeKeys(routes); !reflect.DeepEqual(got, want) {
		t.Fatalf("routes=%v, want %v", got, want)
	}
	for _, route := range routes {
		if route.Language != "typescript" || route.Framework != "nestjs" || route.Strategy != discovery.StrategyAST || route.Confidence != staticConfidence || route.Source.Line <= 0 {
			t.Errorf("metadata=%#v", route)
		}
		if route.Source.File != filepath.Join(root, "users.controller.ts") {
			t.Errorf("source file=%q", route.Source.File)
		}
	}
}

func TestExtractRootAndEmptyPaths(t *testing.T) {
	root := fixtureProject(t, map[string]string{"app.ts": nestImports + `
@Controller()
export class AppController {
  @Get() root() {}
  @Get('health') health() {}
}
@Controller('/')
class RootController { @Post('/') post() {} }`})
	routes, warnings, err := (Extractor{}).Extract(nestContext(t, root))
	if err != nil || len(warnings) != 0 {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	if got, want := routeKeys(routes), []string{"GET /", "GET /health", "POST /"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("routes=%v, want %v", got, want)
	}
}

func TestExtractMultipleFilesAndIgnoresUnrelatedClasses(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"a.ts": nestImports + `
@Controller('a') class A { @Get() one() {} }
class NotAController { @Get('no') no() {} }
`,
		"b.ts": `import { Controller as C, Get as G } from '@nestjs/common';
@C('b') export class B { @G() two() {} }
`,
		"unrelated.ts": `function Controller(path: string) { return path; }
@Controller('fake') class Fake { @Get('fake') fake() {} }
`,
	})
	routes, warnings, err := (Extractor{}).Extract(nestContext(t, root))
	if err != nil || len(warnings) != 0 {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	if got, want := routeKeys(routes), []string{"GET /a", "GET /b"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("routes=%v, want %v", got, want)
	}
}

func TestExtractDynamicAndUnsupportedPatternsWarn(t *testing.T) {
	root := fixtureProject(t, map[string]string{"dynamic.ts": nestImports + `
const API_PREFIX = 'users';
const ROUTE_PATH = ':id';
@Controller(API_PREFIX)
class DynamicController { @Get(ROUTE_PATH) dynamic() {} }
@Controller('ok') class AllController { @All() everything() {} }
@Controller('dynamic-method') class DynamicMethodController { @Get(ROUTE_PATH) find() {} }
`})
	routes, warnings, err := (Extractor{}).Extract(nestContext(t, root))
	if err != nil || len(routes) != 0 || !containsWarning(warnings, "dynamic controller prefix") || !containsWarning(warnings, "dynamic route path") || !containsWarning(warnings, "unsupported @All") {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	// A dynamic controller is intentionally not traversed, so its unresolved
	// method path is not reported as a misleading route-level warning.
}

func TestExtractMalformedAndDeterministic(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"bad.ts":   "@Controller('bad') export class Broken { @Get( }",
		"valid.ts": nestImports + "\n@Controller('ok')\nclass Ok {\n @Get('x') x() {}\n}\n",
	})
	first, firstWarnings, err := (Extractor{}).Extract(nestContext(t, root))
	if err != nil || len(first) != 1 || !containsWarning(firstWarnings, "parse errors") {
		t.Fatalf("routes=%#v warnings=%#v err=%v", first, firstWarnings, err)
	}
	second, secondWarnings, err := (Extractor{}).Extract(nestContext(t, root))
	if err != nil || !reflect.DeepEqual(first, second) || !reflect.DeepEqual(firstWarnings, secondWarnings) {
		t.Fatalf("non-deterministic output: first=%#v/%#v second=%#v/%#v", first, firstWarnings, second, secondWarnings)
	}
}

func TestAppliesAndDiscoverIntegration(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json":  `{"dependencies":{"@nestjs/core":"^10.0.0"}}`,
		"tsconfig.json": `{"compilerOptions":{"experimentalDecorators":true}}`,
		"src/users.ts": nestImports + `
@Controller('users') export class Users { @Get(':id') find() {} @Post() create() {} }`,
	})
	result, err := discovery.Discover(root, discovery.DiscoverOptions{Extractors: []discovery.Extractor{New()}})
	if err != nil {
		t.Fatal(err)
	}
	if got, want := routeKeys(result.Routes), []string{"GET /users/{id}", "POST /users"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("normalized routes=%v, want %v; warnings=%v", got, want, result.Warnings)
	}
	if (Extractor{}).Applies(discovery.ExtractionContext{Detection: project.DetectionResult{Frameworks: []string{"nestjs"}, Languages: []string{"typescript"}}}) == false {
		t.Fatal("expected NestJS TypeScript applicability")
	}
	if (Extractor{}).Applies(discovery.ExtractionContext{Detection: project.DetectionResult{Frameworks: []string{"express"}, Languages: []string{"typescript"}}}) {
		t.Fatal("must not apply to Express")
	}
}

func nestContext(t *testing.T, root string) discovery.ExtractionContext {
	t.Helper()
	scan, err := project.Scan(root, project.ScanOptions{})
	if err != nil {
		t.Fatal(err)
	}
	return discovery.ExtractionContext{Root: scan.Root, Files: scan.Files, Detection: project.DetectionResult{Languages: []string{"typescript"}, Frameworks: []string{"nestjs"}}}
}

func routeKeys(routes []discovery.Route) []string {
	keys := make([]string, 0, len(routes))
	for _, route := range routes {
		keys = append(keys, route.Method+" "+route.Path)
	}
	sort.Strings(keys)
	return keys
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

func containsWarning(warnings []string, wanted string) bool {
	for _, warning := range warnings {
		if strings.Contains(warning, wanted) {
			return true
		}
	}
	return false
}
