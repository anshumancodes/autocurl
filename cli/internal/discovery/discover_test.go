package discovery

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/project"
)

type actionableProviderError struct{ code string }

func (e actionableProviderError) Error() string     { return "managed access denied" }
func (e actionableProviderError) ErrorCode() string { return e.code }

type actionableProvider struct{}

func (actionableProvider) Analyze(context.Context, AIRequest) (AIResponse, error) {
	return AIResponse{}, actionableProviderError{code: "upgrade_required"}
}

type stubExtractor struct {
	name       string
	applicable bool
	routes     []Route
	warnings   []string
	err        error
	seen       *ExtractionContext
}

func (s *stubExtractor) Name() string { return s.name }

func (s *stubExtractor) Applies(context ExtractionContext) bool {
	if s.seen != nil {
		*s.seen = context
	}
	return s.applicable
}

func (s *stubExtractor) Extract(context ExtractionContext) ([]Route, []string, error) {
	if s.seen != nil {
		*s.seen = context
	}
	return s.routes, s.warnings, s.err
}

func writeFixture(t *testing.T, files map[string]string) string {
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

func TestDiscoverInvalidRootAndScannerFailure(t *testing.T) {
	if _, err := Discover("", DiscoverOptions{}); !errors.Is(err, project.ErrEmptyRoot) {
		t.Fatalf("error = %v, want ErrEmptyRoot", err)
	}
	file := filepath.Join(t.TempDir(), "main.go")
	if err := os.WriteFile(file, []byte("package main"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Discover(file, DiscoverOptions{}); !errors.Is(err, project.ErrInvalidDir) {
		t.Fatalf("error = %v, want ErrInvalidDir", err)
	}
}

func TestDiscoverEmptyProject(t *testing.T) {
	result, err := Discover(t.TempDir(), DiscoverOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Routes) != 0 || len(result.Warnings) != 0 {
		t.Fatalf("result = %#v, want empty result", result)
	}
}

func TestDiscoverSuccessfulScanDetectionAndExtractorSelection(t *testing.T) {
	root := writeFixture(t, map[string]string{
		"package.json":  `{"dependencies":{"express":"1.0.0"}}`,
		"src/server.js": "const app = express();",
		"README.md":     "ignored",
	})
	var seen ExtractionContext
	extractor := &stubExtractor{
		name:       "express-stub",
		applicable: true,
		seen:       &seen,
		routes:     []Route{{Method: "get", Path: "/users/:id", Language: "javascript", Framework: "express", Strategy: StrategyAST, Confidence: 0.8}},
	}
	result, err := Discover(root, DiscoverOptions{Extractors: []Extractor{extractor}})
	if err != nil {
		t.Fatal(err)
	}
	if len(seen.Files) != 1 || seen.Detection.Frameworks[0] != "express" || seen.Root != root {
		t.Fatalf("context = %#v, want scanned file and express detection", seen)
	}
	if len(result.Routes) != 1 || result.Routes[0].Path != "/users/{id}" || result.Routes[0].Method != "GET" {
		t.Fatalf("result = %#v, want normalized route", result)
	}
}

func TestDiscoverNoRegisteredExtractorDoesNotFabricateRoutes(t *testing.T) {
	root := writeFixture(t, map[string]string{"main.go": "package main"})
	result, err := Discover(root, DiscoverOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Routes) != 0 {
		t.Fatalf("routes = %#v, want none", result.Routes)
	}
	if !containsWarning(result.Warnings, `no route extractor registered for language "go"`) {
		t.Fatalf("warnings = %#v, want unavailable extractor warning", result.Warnings)
	}
}

func TestDiscoverMultipleExtractorsWarningsAndNormalization(t *testing.T) {
	root := writeFixture(t, map[string]string{"a.ts": "export const a = 1", "b.go": "package main"})
	first := &stubExtractor{
		name:       "typescript",
		applicable: true,
		routes: []Route{
			{Method: "GET", Path: "/users/:id", Language: "typescript", Strategy: StrategyAST, Confidence: 0.5},
			{Method: "GET", Path: "/broken route", Strategy: StrategyAST, Confidence: 1},
		},
		warnings: []string{"unsupported route declaration"},
	}
	second := &stubExtractor{
		name:       "go",
		applicable: true,
		routes:     []Route{{Method: "get", Path: "/users/{id}", Language: "go", Strategy: StrategyAST, Confidence: 0.9}},
	}
	result, err := Discover(root, DiscoverOptions{Extractors: []Extractor{first, second}})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Routes) != 1 || result.Routes[0].Language != "go" || result.Routes[0].Confidence != 0.9 {
		t.Fatalf("routes = %#v, want deduplicated highest-confidence route", result.Routes)
	}
	if len(result.Warnings) != 2 || !containsWarning(result.Warnings, "unsupported route declaration") || !containsWarning(result.Warnings, "skipping route") {
		t.Fatalf("warnings = %#v, want extractor and normalization warnings", result.Warnings)
	}
}

func TestDiscoverRecoverableAndCriticalExtractorErrors(t *testing.T) {
	root := writeFixture(t, map[string]string{"main.go": "package main"})
	good := &stubExtractor{name: "good", applicable: true, routes: []Route{{Method: "GET", Path: "/ok", Strategy: StrategyAST, Confidence: 1}}}
	bad := &stubExtractor{name: "bad", applicable: true, err: errors.New("unsupported syntax")}
	result, err := Discover(root, DiscoverOptions{Extractors: []Extractor{bad, good}})
	if err != nil || len(result.Routes) != 1 || !containsWarning(result.Warnings, "extractor bad failed") {
		t.Fatalf("result = %#v, error = %v, want good route and warning", result, err)
	}

	critical := &stubExtractor{name: "critical", applicable: true, err: NewCriticalExtractionError(errors.New("source unavailable"))}
	if _, err := Discover(root, DiscoverOptions{Extractors: []Extractor{critical}}); err == nil || !strings.Contains(err.Error(), "critical") {
		t.Fatalf("error = %v, want critical extraction error", err)
	}
}

func TestDiscoverDeterministicOutput(t *testing.T) {
	root := writeFixture(t, map[string]string{"a.go": "package main", "b.go": "package main"})
	factory := func() []Extractor {
		return []Extractor{&stubExtractor{name: "routes", applicable: true, routes: []Route{
			{Method: "POST", Path: "/z", Strategy: StrategyAST, Confidence: 1},
			{Method: "GET", Path: "/a", Strategy: StrategyAST, Confidence: 1},
		}, warnings: []string{"z warning", "a warning"}}}
	}
	first, err := Discover(root, DiscoverOptions{Extractors: factory()})
	if err != nil {
		t.Fatal(err)
	}
	second, err := Discover(root, DiscoverOptions{Extractors: factory()})
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(first, second) {
		t.Fatalf("results differ:\nfirst: %#v\nsecond: %#v", first, second)
	}
}

func TestDiscoverSurfacesManagedAccessErrorsAndKeepsASTRoutes(t *testing.T) {
	root := writeFixture(t, map[string]string{"main.go": "package main"})
	result, err := Discover(root, DiscoverOptions{
		Extractors: []Extractor{&stubExtractor{name: "routes", applicable: true, routes: []Route{{Method: "GET", Path: "/health", Strategy: StrategyAST, Confidence: 1}}}},
		AIMode:     AIModeAlways, AIProvider: actionableProvider{},
	})
	if err != nil || len(result.Routes) != 1 || len(result.Errors) != 1 || !strings.Contains(result.Errors[0], "upgrade_required") {
		t.Fatalf("result = %#v, error = %v", result, err)
	}
	if len(result.Warnings) != 0 {
		t.Fatalf("warnings = %#v, want actionable error separated from warnings", result.Warnings)
	}
}

func containsWarning(warnings []string, want string) bool {
	for _, warning := range warnings {
		if strings.Contains(warning, want) {
			return true
		}
	}
	return false
}
