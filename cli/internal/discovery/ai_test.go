package discovery_test

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/extractors/express"
	"github.com/anshumancodes/autocurl/internal/generator"
	"github.com/anshumancodes/autocurl/internal/parser"
)

func TestHybridDiscoveryEnrichesASTAndRejectsUngroundedOrDuplicateRoutes(t *testing.T) {
	root := aiFixture(t, map[string]string{
		"package.json": `{"dependencies":{"express":"5.0.0"}}`,
		"server.js":    "const express = require('express');\nconst app = express();\napp.get('/health', handler);\nconst path = '/users/:id';\napp.post(path, handler);\n",
	})
	provider := &stubProvider{response: discovery.AIResponse{Endpoints: []discovery.AIEndpoint{
		{Method: "GET", Path: "/health", Source: discovery.SourceLocation{File: "server.js", Line: 3}, Headers: map[string]string{"Content-Type": "application/json"}, Auth: &discovery.AuthMetadata{Kind: "bearer", Variable: "authToken"}, Evidence: []string{"3|app.get('/health', handler);"}},
		{Method: "POST", Path: "/users/{id}", Source: discovery.SourceLocation{File: "server.js", Line: 5}, PathParameters: []string{"id"}, Evidence: []string{"5|app.post(path, handler);"}},
		{Method: "DELETE", Path: "/admin", Source: discovery.SourceLocation{File: "server.js", Line: 3}, Evidence: []string{"3|app.get('/health', handler);"}},
		{Method: "PUT", Path: "/health", Source: discovery.SourceLocation{File: "server.js", Line: 99}, Evidence: []string{"not present"}},
	}}}
	result, err := discovery.Discover(root, discovery.DiscoverOptions{AIMode: discovery.AIModeAlways, AIProvider: provider, Extractors: []discovery.Extractor{express.New()}})
	if err != nil {
		t.Fatal(err)
	}
	if !provider.called || provider.request.Operation != "discover_and_enrich" {
		t.Fatalf("provider was not called correctly: %#v", provider.request)
	}
	if len(result.Routes) != 2 {
		t.Fatalf("routes = %#v", result.Routes)
	}
	var health, users discovery.Route
	for _, route := range result.Routes {
		if route.Path == "/health" {
			health = route
		}
		if route.Path == "/users/{id}" {
			users = route
		}
	}
	if health.Strategy != discovery.StrategyAST || !health.Enriched || health.Headers["Content-Type"] != "application/json" || health.Headers["Authorization"] != "Bearer {{authToken}}" {
		t.Fatalf("health enrichment = %#v", health)
	}
	if users.Strategy != discovery.StrategyAI {
		t.Fatalf("AI route = %#v", users)
	}
	if users.Path != "/users/{id}" {
		t.Fatalf("unexpected AI path %q", users.Path)
	}
}

func TestHybridDiscoveryModesAndProviderFailureFallback(t *testing.T) {
	root := aiFixture(t, map[string]string{
		"package.json": `{"dependencies":{"express":"5.0.0"}}`,
		"server.js":    "const express = require('express');\nconst app = express();\napp.get('/health', handler);\n",
	})
	for _, mode := range []discovery.AIMode{discovery.AIModeOff, discovery.AIModeAuto, discovery.AIModeAlways} {
		provider := &stubProvider{err: errors.New("provider unavailable")}
		result, err := discovery.Discover(root, discovery.DiscoverOptions{AIMode: mode, AIProvider: provider, Extractors: []discovery.Extractor{express.New()}})
		if err != nil {
			t.Fatal(err)
		}
		if len(result.Routes) != 1 || result.Routes[0].Path != "/health" {
			t.Fatalf("mode %s lost AST route: %#v", mode, result.Routes)
		}
		if mode == discovery.AIModeOff && provider.called {
			t.Fatal("off mode called provider")
		}
		if mode == discovery.AIModeAlways && !provider.called {
			t.Fatalf("%s mode did not call provider", mode)
		}
	}
}

func TestAIContextIsBoundedAndBestEffortRedacted(t *testing.T) {
	root := aiFixture(t, map[string]string{
		"package.json": `{"dependencies":{"express":"5.0.0"}}`,
		"server.js":    "const express = require('express');\nconst token = 'do-not-send';\nconst app = express();\napp.get('/health', handler);\n",
	})
	request, err := discovery.BuildAIRequest(root, discovery.ExtractionContext{Root: root, Files: []string{filepath.Join(root, "server.js")}}, nil, []string{"unresolved route in server.js:4"}, "discover")
	if err != nil {
		t.Fatal(err)
	}
	if len(request.Snippets) != 1 || strings.Contains(request.Snippets[0].Content, "do-not-send") || !strings.Contains(request.Snippets[0].Content, "redacted") {
		t.Fatalf("unsafe context: %#v", request.Snippets)
	}
}

func TestAIOutputRemainsParserCompatibleAndStable(t *testing.T) {
	root := aiFixture(t, map[string]string{
		"package.json": `{"dependencies":{"express":"5.0.0"}}`,
		"server.js":    "const express = require('express');\nconst app = express();\napp.get('/health', handler);\nconst metrics = '/metrics';\napp.get(metrics, handler);\n",
	})
	provider := &stubProvider{response: discovery.AIResponse{Endpoints: []discovery.AIEndpoint{{Method: "GET", Path: "/metrics", Source: discovery.SourceLocation{File: "server.js", Line: 5}, Evidence: []string{"5|app.get(metrics, handler);"}}}}}
	result, err := discovery.Discover(root, discovery.DiscoverOptions{AIMode: discovery.AIModeAlways, AIProvider: provider, Extractors: []discovery.Extractor{express.New()}})
	if err != nil {
		t.Fatal(err)
	}
	first, err := generator.Generate(result.Routes, generator.Options{ProjectName: "api", ProjectRoot: root})
	if err != nil {
		t.Fatal(err)
	}
	second, err := generator.Generate(result.Routes, generator.Options{ProjectName: "api", ProjectRoot: root})
	if err != nil || first != second {
		t.Fatalf("unstable output: %v", err)
	}
	doc, err := parser.Parse(first)
	if err != nil || len(doc.Requests) != 2 {
		t.Fatalf("generated output is not parser-compatible: %v\n%s", err, first)
	}
	if doc.Requests[1].Strategy != "ai" {
		t.Fatalf("missing AI strategy metadata: %#v", doc.Requests)
	}
}

type stubProvider struct {
	response discovery.AIResponse
	err      error
	called   bool
	request  discovery.AIRequest
}

func (s *stubProvider) Analyze(_ context.Context, request discovery.AIRequest) (discovery.AIResponse, error) {
	s.called = true
	s.request = request
	return s.response, s.err
}

func aiFixture(t *testing.T, files map[string]string) string {
	t.Helper()
	root := t.TempDir()
	for name, content := range files {
		path := filepath.Join(root, name)
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return root
}
