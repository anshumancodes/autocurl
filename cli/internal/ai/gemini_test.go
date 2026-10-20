package ai

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/discovery"
)

func TestGeminiParsesStrictStructuredResponse(t *testing.T) {
	client := &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		if req.Method != http.MethodPost || !strings.Contains(req.URL.Path, "generateContent") {
			t.Fatalf("unexpected request: %s %s", req.Method, req.URL)
		}
		return response(`{"candidates":[{"content":{"parts":[{"text":"{\"endpoints\":[{\"method\":\"GET\",\"path\":\"/health\",\"source\":{\"file\":\"server.js\",\"line\":3},\"path_parameters\":[],\"headers\":{},\"body\":\"\",\"has_body\":false,\"auth\":null,\"evidence\":[\"3|app.get\"]}]}"}]}}]}`), nil
	})}
	provider := NewGemini("test-key")
	provider.Client, provider.BaseURL = client, "https://gemini.test"
	result, err := provider.Analyze(context.Background(), discovery.AIRequest{Operation: "discover"})
	if err != nil || len(result.Endpoints) != 1 || result.Endpoints[0].Path != "/health" {
		t.Fatalf("result=%#v err=%v", result, err)
	}
}

func TestGeminiRejectsMalformedOutputAndMissingKey(t *testing.T) {
	provider := NewGemini("")
	if _, err := provider.Analyze(context.Background(), discovery.AIRequest{}); err != ErrMissingAPIKey {
		t.Fatalf("missing key error=%v", err)
	}
	provider = NewGemini("test-key")
	provider.Client, provider.BaseURL = &http.Client{Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
		return response(`{"candidates":[{"content":{"parts":[{"text":"not-json"}]}}]}`), nil
	})}, "https://gemini.test"
	if _, err := provider.Analyze(context.Background(), discovery.AIRequest{}); err == nil {
		t.Fatal("expected malformed response error")
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) { return f(req) }
func response(body string) *http.Response {
	return &http.Response{StatusCode: http.StatusOK, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(body))}
}
