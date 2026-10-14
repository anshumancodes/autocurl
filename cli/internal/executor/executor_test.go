package executor_test

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/anshumancodes/autocurl/internal/executor"
	"github.com/anshumancodes/autocurl/internal/parser"
)

func TestExecuteGETHeadersAndStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet || r.Header.Get("X-Test") != "one" {
			t.Errorf("request = %s, headers = %#v", r.Method, r.Header)
		}
		w.Header().Set("X-Response", "yes")
		w.WriteHeader(http.StatusNotFound)
		io.WriteString(w, `{"error":"missing"}`)
	}))
	defer server.Close()
	result, err := executor.Execute(parser.Request{Method: "GET", URL: server.URL, Headers: map[string]string{"X-Test": "one"}}, nil, nil)
	if err != nil || result.StatusCode != http.StatusNotFound || result.Body != `{"error":"missing"}` || result.Headers.Get("X-Response") != "yes" {
		t.Fatalf("result = %#v, err = %v", result, err)
	}
	if result.Duration <= 0 {
		t.Fatal("duration was not recorded")
	}
}

func TestExecutePOSTBodyAndResolution(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		if r.URL.EscapedPath() != "/users/a%2Fb" || string(body) != `{"id":"a/b"}` {
			t.Errorf("path = %q, body = %q", r.URL.EscapedPath(), body)
		}
		w.WriteHeader(http.StatusCreated)
	}))
	defer server.Close()
	req := parser.Request{Method: "POST", URL: "{{baseUrl}}/users/{{id}}", Headers: map[string]string{"X-ID": "{{id}}"}, Body: `{"id":"{{id}}"}`, HasBody: true}
	result, err := executor.Execute(req, map[string]string{"baseUrl": server.URL, "id": "a/b"}, nil)
	if err != nil || result.StatusCode != http.StatusCreated {
		t.Fatalf("result = %#v, err = %v", result, err)
	}
}

func TestExecuteServerErrorAndEmptyBody(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()
	result, err := executor.Execute(parser.Request{Method: "GET", URL: server.URL}, nil, nil)
	if err != nil || result.StatusCode != http.StatusInternalServerError || result.Body != "" {
		t.Fatalf("result = %#v, err = %v", result, err)
	}
}

func TestResolveMissingAndDoesNotMutate(t *testing.T) {
	req := parser.Request{Method: "GET", URL: "{{baseUrl}}/{{id}}", Headers: map[string]string{"X": "{{id}}"}}
	original := req
	_, err := executor.Resolve(req, map[string]string{"baseUrl": "http://example.test"})
	var missing *executor.MissingVariablesError
	if !errors.As(err, &missing) || len(missing.Names) != 1 || missing.Names[0] != "id" {
		t.Fatalf("error = %v", err)
	}
	if req.URL != original.URL || req.Headers["X"] != original.Headers["X"] {
		t.Fatal("resolve mutated parsed request")
	}
}

func TestExecuteErrorsAndResponseLimit(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { io.WriteString(w, "12345") }))
	defer server.Close()
	resolved := executor.ResolvedRequest{Method: "GET", URL: server.URL}
	if _, err := executor.ExecuteResolved(resolved, nil, 4); !errors.Is(err, executor.ErrResponseTooLarge) {
		t.Fatalf("limit error = %v", err)
	}
	if _, err := executor.ExecuteResolved(executor.ResolvedRequest{Method: "GET", URL: "http://[bad"}, nil, 10); err == nil {
		t.Fatal("invalid URL unexpectedly succeeded")
	}
	if _, err := executor.ExecuteResolved(executor.ResolvedRequest{Method: "GET", URL: "http://127.0.0.1:1"}, &http.Client{Timeout: 20 * time.Millisecond}, 10); err == nil {
		t.Fatal("connection error unexpectedly succeeded")
	}
}

func TestExecuteTimeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { time.Sleep(100 * time.Millisecond) }))
	defer server.Close()
	_, err := executor.Execute(parser.Request{Method: "GET", URL: server.URL}, nil, &http.Client{Timeout: 10 * time.Millisecond})
	if err == nil || (!strings.Contains(err.Error(), "Client.Timeout") && !strings.Contains(err.Error(), "deadline exceeded")) {
		t.Fatalf("timeout error = %v", err)
	}
}
