package interactive_test

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/executor"
	"github.com/anshumancodes/autocurl/internal/interactive"
	"github.com/anshumancodes/autocurl/internal/parser"
)

func TestRunSelectsByParsedNumberPromptsAndFormatsJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.EscapedPath() != "/users/alice%2Fadmin" {
			t.Errorf("path = %q", r.URL.EscapedPath())
		}
		w.Header().Set("Authorization", "must not print")
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"ok":true}`))
	}))
	defer server.Close()
	doc, err := parser.Parse("@baseUrl = " + server.URL + "\n\n### 1. GET /health\nGET {{baseUrl}}/health\n\n### 2. GET /users/{id}\nGET {{baseUrl}}/users/{{id}}\nAuthorization: Bearer secret\n")
	if err != nil {
		t.Fatal(err)
	}
	var out bytes.Buffer
	err = interactive.Run(doc, interactive.Config{In: strings.NewReader("2\nalice/admin\n"), Out: &out})
	if err != nil {
		t.Fatal(err)
	}
	got := out.String()
	if !strings.Contains(got, "1. GET /health") || !strings.Contains(got, "2. GET /users/{id}") || !strings.Contains(got, "\"ok\": true") || strings.Contains(got, "secret") {
		t.Fatalf("output = %q", got)
	}
}

func TestRunInvalidSelectionAndEOF(t *testing.T) {
	doc := parser.Document{Requests: []parser.Request{{Number: 4, Method: "GET", URL: "http://example.test"}}}
	if err := interactive.Run(doc, interactive.Config{In: strings.NewReader("1\n"), Out: &bytes.Buffer{}}); err == nil || !strings.Contains(err.Error(), "invalid request selection") {
		t.Fatalf("selection error = %v", err)
	}
	if err := interactive.Run(doc, interactive.Config{In: strings.NewReader(""), Out: &bytes.Buffer{}}); err != interactive.ErrEOF {
		t.Fatalf("EOF error = %v", err)
	}
	if err := interactive.Run(doc, interactive.Config{In: strings.NewReader("\n"), Out: &bytes.Buffer{}}); err != interactive.ErrCancelled {
		t.Fatalf("cancellation error = %v", err)
	}
}

func TestRunEmptyDocument(t *testing.T) {
	if err := interactive.Run(parser.Document{}, interactive.Config{Out: &bytes.Buffer{}}); err == nil || !strings.Contains(err.Error(), "no requests") {
		t.Fatalf("empty error = %v", err)
	}
}

func TestFixtureEndToEnd(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/users/alice" {
			t.Errorf("path = %q", r.URL.Path)
		}
		w.Write([]byte(`{"user":"alice"}`))
	}))
	defer server.Close()
	_, file, _, _ := runtime.Caller(0)
	fixture, err := os.ReadFile(filepath.Join(filepath.Dir(file), "../../fixtures/example-api.autocurl"))
	if err != nil {
		t.Fatal(err)
	}
	doc, err := parser.Parse(string(fixture))
	if err != nil {
		t.Fatal(err)
	}
	doc.Variables["baseUrl"] = server.URL
	var out bytes.Buffer
	if err := interactive.Run(doc, interactive.Config{In: strings.NewReader("2\nalice\n"), Out: &out}); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out.String(), "1. GET /health") || !strings.Contains(out.String(), "2. GET /users/{id}") || !strings.Contains(out.String(), `"user": "alice"`) {
		t.Fatalf("output = %q", out.String())
	}
}

func TestDisplayResponseEmptyBody(t *testing.T) {
	var out bytes.Buffer
	if err := interactive.DisplayResponse(&out, executor.Result{Method: "HEAD", URL: "http://example.test", Status: "200 OK"}); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out.String(), "Response body: <empty>") {
		t.Fatalf("output = %q", out.String())
	}
}
