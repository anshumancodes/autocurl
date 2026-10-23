package ai

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/discovery"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestManagedAPIUsesBearerAuthAndV1Contract(t *testing.T) {
	provider := NewManagedAPI("https://api.test", "clerk-token")
	provider.Client = &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		if req.Header.Get("Authorization") != "Bearer clerk-token" {
			t.Fatalf("missing bearer auth")
		}
		if req.URL.Path != "/v1/scan" {
			t.Fatalf("path = %s", req.URL.Path)
		}
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(`{"version":"v1","endpoints":[]}`)), Header: make(http.Header)}, nil
	})}
	result, err := provider.Analyze(context.Background(), discovery.AIRequest{Operation: "discover"})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Endpoints) != 0 {
		t.Fatalf("unexpected endpoints: %#v", result.Endpoints)
	}
}

func TestManagedAPIMapsStructuredErrors(t *testing.T) {
	provider := NewManagedAPI("https://api.test", "clerk-token")
	provider.Client = &http.Client{Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusForbidden, Body: io.NopCloser(strings.NewReader(`{"error":{"code":"upgrade_required","message":"upgrade at pricing"}}`)), Header: make(http.Header)}, nil
	})}
	_, err := provider.Analyze(context.Background(), discovery.AIRequest{Operation: "discover"})
	apiErr, ok := err.(*APIError)
	if !ok || apiErr.Code != "upgrade_required" {
		t.Fatalf("error = %#v", err)
	}
}

func TestManagedAPIBillingStatusUsesCLIAuthRoute(t *testing.T) {
	provider := NewManagedAPI("https://api.test", "cli-session")
	provider.Client = &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		if req.URL.Path != "/api/cli/billing/status" {
			t.Fatalf("path = %s", req.URL.Path)
		}
		if req.Header.Get("Authorization") != "Bearer cli-session" {
			t.Fatalf("authorization = %q", req.Header.Get("Authorization"))
		}
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(`{"plan":"FREE","usage":{"used":1,"limit":10}}`)), Header: make(http.Header)}, nil
	})}
	status, err := provider.BillingStatus(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if status.Plan != "FREE" || status.Usage.Used != 1 {
		t.Fatalf("status = %#v", status)
	}
}
