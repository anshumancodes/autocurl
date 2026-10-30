package ai

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/anshumancodes/autocurl/internal/discovery"
)

type doerFunc func(*http.Request) (*http.Response, error)

func (f doerFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestGeminiLoadsKeyFromEnvironment(t *testing.T) {
	t.Setenv("GEMINI_API_KEY", "local-test-key")
	if got := NewGeminiFromEnv().APIKey; got != "local-test-key" {
		t.Fatalf("key = %q", got)
	}
}

func TestGeminiRequiresKeyWithoutPrintingIt(t *testing.T) {
	_, err := (&Gemini{APIKey: " "}).Analyze(context.Background(), structRequest())
	if err == nil {
		t.Fatal("expected missing key error")
	}
	if !strings.Contains(err.Error(), "GEMINI_API_KEY") {
		t.Fatalf("unclear error: %v", err)
	}
}

func TestGeminiMapsProviderErrorsWithoutLeakingKey(t *testing.T) {
	for _, tc := range []struct {
		status int
		want   string
	}{{http.StatusUnauthorized, "rejected"}, {http.StatusTooManyRequests, "rate limit"}, {http.StatusServiceUnavailable, "HTTP 503"}} {
		g := &Gemini{APIKey: "private-key", BaseURL: "https://gemini.test", Client: &http.Client{Transport: doerFunc(func(r *http.Request) (*http.Response, error) {
			if !strings.Contains(r.URL.RawQuery, "key=private-key") {
				t.Errorf("missing key query")
			}
			return &http.Response{StatusCode: tc.status, Body: io.NopCloser(strings.NewReader(`{"error":{"message":"private-key"}}`)), Header: make(http.Header)}, nil
		})}}
		_, err := g.Analyze(context.Background(), structRequest())
		if err == nil || !strings.Contains(err.Error(), tc.want) || strings.Contains(err.Error(), "private-key") {
			t.Fatalf("status %d error = %v", tc.status, err)
		}
	}
}

func TestGeminiTimeoutAndResponseValidation(t *testing.T) {
	failed := &Gemini{APIKey: "private", BaseURL: "https://gemini.test", Client: &http.Client{Transport: doerFunc(func(*http.Request) (*http.Response, error) {
		return nil, errors.New("request URL included private key")
	})}}
	if _, err := failed.Analyze(context.Background(), structRequest()); err == nil || strings.Contains(err.Error(), "private") || !strings.Contains(err.Error(), "network connection") {
		t.Fatalf("safe network failure = %v", err)
	}
	key := &Gemini{APIKey: "test", BaseURL: "https://gemini.test", Client: &http.Client{Transport: doerFunc(func(*http.Request) (*http.Response, error) { return nil, errors.New("transport failed") })}}
	ctx, cancel := context.WithTimeout(context.Background(), time.Nanosecond)
	defer cancel()
	<-ctx.Done()
	if _, err := key.Analyze(ctx, structRequest()); err == nil || !strings.Contains(err.Error(), "timed out") {
		t.Fatalf("timeout error = %v", err)
	}
	for _, text := range []string{"not json", `{"endpoints":[{"method":"GET","path":"/ok","source":{"file":"a.go","line":1},"path_parameters":[],"evidence":["ok"]}]}`} {
		key.Client = &http.Client{Transport: doerFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`{"candidates":[{"content":{"parts":[{"text":` + quote(text) + `}]}}]}`)), Header: make(http.Header)}, nil
		})}
		_, err := key.Analyze(context.Background(), structRequest())
		if text == "not json" && (err == nil || !strings.Contains(err.Error(), "invalid discovery JSON")) {
			t.Fatalf("invalid JSON error = %v", err)
		}
		if text != "not json" && err != nil {
			t.Fatalf("valid response error = %v", err)
		}
	}
}

func structRequest() discovery.AIRequest {
	return discovery.AIRequest{Operation: "discover", Snippets: []discovery.SourceSnippet{{File: "a.go", Start: 1, End: 1, Content: "GET /ok"}}}
}
func quote(s string) string { b, _ := json.Marshal(s); return string(b) }
