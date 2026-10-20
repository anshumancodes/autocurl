package commands_test

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/commands"
	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/parser"
)

func TestRunGeneratesExpressProjectAndParsesOutput(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json": `{"dependencies":{"express":"5.0.0"}}`,
		"server.js":    "const express = require('express');\nconst app = express();\napp.get('/health', handler);\napp.get('/users/:id', handler);\n",
	})

	var out bytes.Buffer
	if err := commands.Run([]string{root}, commands.Config{Out: &out}); err != nil {
		t.Fatal(err)
	}
	content := readGenerated(t, root)
	doc, err := parser.Parse(content)
	if err != nil {
		t.Fatal(err)
	}
	if len(doc.Requests) != 2 || !strings.Contains(content, "# @source server.js:3") {
		t.Fatalf("output=%q document=%#v", content, doc)
	}
	if !strings.Contains(out.String(), "Framework: Express") || !strings.Contains(out.String(), "Discovered 2 routes.") || !strings.Contains(out.String(), "Generated: ") {
		t.Fatalf("CLI output=%q", out.String())
	}
}

func TestRunGeneratesGinProjectAndParsesOutput(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"go.mod": `module example.test/gin

go 1.23

require github.com/gin-gonic/gin v1.10.0`,
		"main.go": `package main
import "github.com/gin-gonic/gin"
func main() {
  router := gin.Default()
  api := router.Group("/api")
  api.GET("/users/:id", handler)
}`,
	})
	var out bytes.Buffer
	if err := commands.Run([]string{root}, commands.Config{Out: &out}); err != nil {
		t.Fatal(err)
	}
	content := readGenerated(t, root)
	doc, err := parser.Parse(content)
	if err != nil || len(doc.Requests) != 1 || doc.Requests[0].URL != "{{baseUrl}}/api/users/{{id}}" {
		t.Fatalf("content=%q document=%#v err=%v", content, doc, err)
	}
	if !strings.Contains(out.String(), "Framework: Gin") || !strings.Contains(out.String(), "Discovered 1 routes.") {
		t.Fatalf("CLI output=%q", out.String())
	}
}

func TestRunGeneratesNestJSFromAbsolutePathDeterministically(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json":            `{"dependencies":{"@nestjs/core":"^10.0.0"}}`,
		"tsconfig.json":           `{}`,
		"src/users.controller.ts": "import { Controller, Get, Post } from '@nestjs/common';\n@Controller('users')\nexport class Users { @Get(':id') find() {} @Post() create() {} }",
	})

	var firstOut bytes.Buffer
	if err := commands.Run([]string{root}, commands.Config{Out: &firstOut}); err != nil {
		t.Fatal(err)
	}
	first := readGenerated(t, root)
	if err := os.Remove(generatedPath(t, root)); err != nil {
		t.Fatal(err)
	}
	var secondOut bytes.Buffer
	if err := commands.Run([]string{root}, commands.Config{Out: &secondOut}); err != nil {
		t.Fatal(err)
	}
	second := readGenerated(t, root)
	if first != second {
		t.Fatal("generation is not deterministic")
	}
	doc, err := parser.Parse(second)
	if err != nil || len(doc.Requests) != 2 {
		t.Fatalf("content parse=%v document=%#v content=%q", err, doc, second)
	}
	if !strings.Contains(secondOut.String(), "Framework: NestJS") {
		t.Fatalf("framework output=%q", secondOut.String())
	}
	if !strings.Contains(second, "# @source src/users.controller.ts:3") {
		t.Fatalf("missing source metadata: %q", second)
	}
}

func TestRunPreservesWarningsAndRejectsEmptyDiscovery(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json": `{"dependencies":{"express":"5.0.0"}}`,
		"server.js":    "const express = require('express');\nconst app = express();\nconst path = '/dynamic';\napp.get(path, handler);\n",
	})
	var out bytes.Buffer
	if err := commands.Run([]string{root}, commands.Config{Out: &out}); err == nil || !strings.Contains(err.Error(), "no routes discovered") || !strings.Contains(out.String(), "Warning:") {
		t.Fatalf("err=%v output=%q", err, out.String())
	}
	if _, err := os.Stat(filepath.Join(root, filepath.Base(root)+".autocurl")); !os.IsNotExist(err) {
		t.Fatalf("generated output exists after empty discovery: %v", err)
	}

	empty := t.TempDir()
	if err := commands.Run([]string{empty}, commands.Config{Out: &bytes.Buffer{}}); err == nil || !strings.Contains(err.Error(), "no routes discovered") {
		t.Fatalf("empty project error=%v", err)
	}
}

func TestRunArgumentValidationAndExistingOutputProtection(t *testing.T) {
	root := t.TempDir()
	source := filepath.Join(root, "books.js")
	if err := os.WriteFile(source, []byte("console.log('deferred')"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := commands.Run([]string{source}, commands.Config{Out: io.Discard}); err == nil || !strings.Contains(err.Error(), "no routes discovered") {
		t.Fatalf("source-file error=%v", err)
	}
	if err := commands.Run([]string{filepath.Join(root, "missing")}, commands.Config{Out: io.Discard}); err == nil || !strings.Contains(err.Error(), "stat") {
		t.Fatalf("missing path error=%v", err)
	}
	output := filepath.Join(root, filepath.Base(root)+".autocurl")
	if err := os.WriteFile(output, []byte("keep"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := commands.Run([]string{root}, commands.Config{Out: io.Discard}); err == nil || !strings.Contains(err.Error(), "already exists") {
		t.Fatalf("existing output error=%v", err)
	}
	content, err := os.ReadFile(output)
	if err != nil || string(content) != "keep" {
		t.Fatalf("existing output changed: %q, %v", content, err)
	}
}

func TestRunExistingAutocurlRemainsInteractive(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "requests.autocurl")
	if err := os.WriteFile(path, []byte("### 1. GET /health\nGET http://example.test/health\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	var out bytes.Buffer
	client := &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 200, Status: "200 OK", Header: make(http.Header), Body: io.NopCloser(strings.NewReader(`{"ok":true}`)), Request: req}, nil
	})}
	if err := commands.Run([]string{path}, commands.Config{In: strings.NewReader("1\n"), Out: &out, Client: client}); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out.String(), "HTTP 200 OK") || !strings.Contains(out.String(), `"ok": true`) {
		t.Fatalf("interactive output=%q", out.String())
	}
}

func TestAIModeFlagOverridesEnvironment(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json": `{"dependencies":{"express":"5.0.0"}}`,
		"server.js":    "const express = require('express');\nconst app = express();\napp.get('/health', handler);\n",
	})
	t.Setenv("AUTOCURL_AI", "always")
	provider := &commandStubProvider{}
	if err := commands.Run([]string{root}, commands.Config{Out: io.Discard, AIProvider: provider}); err != nil {
		t.Fatal(err)
	}
	if !provider.called {
		t.Fatal("environment mode did not enable AI")
	}
	if err := os.Remove(generatedPath(t, root)); err != nil {
		t.Fatal(err)
	}
	provider = &commandStubProvider{}
	if err := commands.Run([]string{"--ai=off", root}, commands.Config{Out: io.Discard, AIProvider: provider}); err != nil {
		t.Fatal(err)
	}
	if provider.called {
		t.Fatal("CLI off flag did not override environment")
	}
}

func TestRunScopedModuleAndFileGeneration(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json":                      `{"name":"Servio","dependencies":{"express":"5.0.0"}}`,
		"src/app.js":                        "const express = require('express');\nconst app = express();\nconst user = require('./modules/user/user.routes');\napp.use('/api', user);\napp.get('/health', handler);\n",
		"src/modules/user/user.routes.js":   "const express = require('express');\nconst router = express.Router();\nrouter.get('/profile', handler);\nmodule.exports = router;\n",
		"src/modules/admin/admin.routes.js": "const express = require('express');\nconst router = express.Router();\nrouter.get('/audit', handler);\nmodule.exports = router;\n",
	})
	moduleDir := filepath.Join(root, "src", "modules", "user")
	if err := commands.Run([]string{moduleDir}, commands.Config{Out: io.Discard}); err != nil {
		t.Fatal(err)
	}
	moduleOutput := filepath.Join(root, "servio.user.autocurl")
	content, err := os.ReadFile(moduleOutput)
	if err != nil || !strings.Contains(string(content), "/api/profile") || strings.Contains(string(content), "/audit") || strings.Contains(string(content), "/health") {
		t.Fatalf("module output=%q err=%v", content, err)
	}
	if err := os.Remove(moduleOutput); err != nil {
		t.Fatal(err)
	}
	if err := commands.Run([]string{filepath.Join(moduleDir, "user.routes.js")}, commands.Config{Out: io.Discard}); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(moduleOutput); err != nil {
		t.Fatalf("file output missing: %v", err)
	}
}

type commandStubProvider struct{ called bool }

func (p *commandStubProvider) Analyze(context.Context, discovery.AIRequest) (discovery.AIResponse, error) {
	p.called = true
	return discovery.AIResponse{}, nil
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) { return f(req) }

func fixtureProject(t *testing.T, files map[string]string) string {
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

func readGenerated(t *testing.T, root string) string {
	t.Helper()
	content, err := os.ReadFile(generatedPath(t, root))
	if err != nil {
		t.Fatal(err)
	}
	return string(content)
}

func generatedPath(t *testing.T, root string) string {
	t.Helper()
	entries, err := os.ReadDir(root)
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".autocurl") {
			return filepath.Join(root, entry.Name())
		}
	}
	t.Fatalf("no generated autocurl file in %s", root)
	return ""
}
