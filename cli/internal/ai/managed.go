// Package ai contains the managed autocurl AI provider.
package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/anshumancodes/autocurl/internal/discovery"
)

var ErrAuthenticationRequired = errors.New("managed AI requires an autocurl login; set AUTOCURL_API_TOKEN")

type APIError struct {
	Code    string
	Message string
}

func (e *APIError) Error() string { return e.Message }

type ManagedAPI struct {
	BaseURL string
	Token   string
	Client  *http.Client
}

type BillingStatus struct {
	Plan  string `json:"plan"`
	Usage struct {
		Used         int    `json:"used"`
		Limit        int    `json:"limit"`
		PeriodEndsAt string `json:"periodEndsAt"`
	} `json:"usage"`
	Subscription *struct {
		Status            string `json:"status"`
		RenewalAt         string `json:"renewalAt"`
		CancelAtPeriodEnd bool   `json:"cancelAtPeriodEnd"`
	} `json:"subscription"`
}

func NewManagedAPI(baseURL, token string) *ManagedAPI {
	return &ManagedAPI{BaseURL: strings.TrimRight(strings.TrimSpace(baseURL), "/"), Token: strings.TrimSpace(token), Client: &http.Client{Timeout: 30 * time.Second}}
}

func NewManagedAPIFromEnv() *ManagedAPI {
	baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("AUTOCURL_API_URL")), "/")
	if baseURL == "" {
		baseURL = "https://api.autocurl.lol"
	}
	return NewManagedAPI(baseURL, LoadToken())
}

func (a *ManagedAPI) Analyze(ctx context.Context, request discovery.AIRequest) (discovery.AIResponse, error) {
	if a == nil || strings.TrimSpace(a.Token) == "" {
		return discovery.AIResponse{}, ErrAuthenticationRequired
	}
	payload := scanRequest{Version: "v1", Operation: request.Operation, Detection: scanDetection{Languages: request.Detection.Languages, Frameworks: request.Detection.Frameworks}, Routes: toRoutes(request.Routes), Warnings: request.Warnings, Snippets: toSnippets(request.Snippets), RequestID: requestID(request)}
	data, err := json.Marshal(payload)
	if err != nil {
		return discovery.AIResponse{}, fmt.Errorf("encode managed scan request: %w", err)
	}
	client := a.Client
	if client == nil {
		client = &http.Client{Timeout: 30 * time.Second}
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.BaseURL+"/v1/scan", bytes.NewReader(data))
	if err != nil {
		return discovery.AIResponse{}, fmt.Errorf("create managed scan request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+a.Token)
	req.Header.Set("Idempotency-Key", payload.RequestID)
	resp, err := client.Do(req)
	if err != nil {
		return discovery.AIResponse{}, fmt.Errorf("managed AI request: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return discovery.AIResponse{}, fmt.Errorf("read managed AI response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var envelope struct {
			Error APIError `json:"error"`
		}
		if json.Unmarshal(body, &envelope) == nil && envelope.Error.Code != "" {
			return discovery.AIResponse{}, &envelope.Error
		}
		return discovery.AIResponse{}, fmt.Errorf("managed AI returned HTTP %d", resp.StatusCode)
	}
	var result scanResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return discovery.AIResponse{}, fmt.Errorf("decode managed AI response: %w", err)
	}
	if result.Version != "v1" {
		return discovery.AIResponse{}, errors.New("managed AI response has unsupported version")
	}
	return result.discoveryResponse(), nil
}

func (a *ManagedAPI) BillingStatus(ctx context.Context) (BillingStatus, error) {
	if a == nil || strings.TrimSpace(a.Token) == "" {
		return BillingStatus{}, ErrAuthenticationRequired
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, a.BaseURL+"/api/billing/status", nil)
	if err != nil {
		return BillingStatus{}, err
	}
	req.Header.Set("Authorization", "Bearer "+a.Token)
	resp, err := a.Client.Do(req)
	if err != nil {
		return BillingStatus{}, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return BillingStatus{}, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return BillingStatus{}, fmt.Errorf("billing status returned HTTP %d", resp.StatusCode)
	}
	var result BillingStatus
	if err := json.Unmarshal(body, &result); err != nil {
		return BillingStatus{}, err
	}
	return result, nil
}

type scanRequest struct {
	Version   string        `json:"version"`
	Operation string        `json:"operation"`
	Detection scanDetection `json:"detection"`
	Routes    []scanRoute   `json:"routes"`
	Warnings  []string      `json:"warnings"`
	Snippets  []scanSnippet `json:"snippets"`
	RequestID string        `json:"request_id"`
}
type scanDetection struct {
	Languages  []string `json:"languages"`
	Frameworks []string `json:"frameworks"`
}
type scanRoute struct {
	Method  string            `json:"method"`
	Path    string            `json:"path"`
	Source  sourceLocation    `json:"source"`
	Headers map[string]string `json:"headers,omitempty"`
	Body    string            `json:"body,omitempty"`
	HasBody bool              `json:"has_body,omitempty"`
	Auth    *authMetadata     `json:"auth"`
}
type scanSnippet struct {
	File    string `json:"file"`
	Start   int    `json:"start"`
	End     int    `json:"end"`
	Content string `json:"content"`
}
type sourceLocation struct {
	File string `json:"file"`
	Line int    `json:"line"`
}
type authMetadata struct {
	Kind     string `json:"kind"`
	Variable string `json:"variable"`
}
type scanResponse struct {
	Version   string         `json:"version"`
	Endpoints []scanEndpoint `json:"endpoints"`
}
type scanEndpoint struct {
	Method         string            `json:"method"`
	Path           string            `json:"path"`
	Source         sourceLocation    `json:"source"`
	PathParameters []string          `json:"path_parameters"`
	Headers        map[string]string `json:"headers"`
	Body           string            `json:"body"`
	HasBody        bool              `json:"has_body"`
	Auth           *authMetadata     `json:"auth"`
	Evidence       []string          `json:"evidence"`
}

func toRoutes(routes []discovery.Route) []scanRoute {
	result := make([]scanRoute, 0, len(routes))
	for _, route := range routes {
		var auth *authMetadata
		if route.Auth != nil {
			auth = &authMetadata{Kind: route.Auth.Kind, Variable: route.Auth.Variable}
		}
		result = append(result, scanRoute{Method: route.Method, Path: route.Path, Source: sourceLocation{File: route.Source.File, Line: route.Source.Line}, Headers: route.Headers, Body: route.Body, HasBody: route.HasBody, Auth: auth})
	}
	return result
}
func toSnippets(snippets []discovery.SourceSnippet) []scanSnippet {
	result := make([]scanSnippet, 0, len(snippets))
	for _, snippet := range snippets {
		result = append(result, scanSnippet{File: snippet.File, Start: snippet.Start, End: snippet.End, Content: snippet.Content})
	}
	return result
}
func requestID(request discovery.AIRequest) string {
	data, _ := json.Marshal(request)
	sum := fmt.Sprintf("%x", data)
	if len(sum) > 96 {
		sum = sum[:96]
	}
	return "scan-" + sum
}
func (r scanResponse) discoveryResponse() discovery.AIResponse {
	result := discovery.AIResponse{Endpoints: make([]discovery.AIEndpoint, 0, len(r.Endpoints))}
	for _, endpoint := range r.Endpoints {
		var auth *discovery.AuthMetadata
		if endpoint.Auth != nil {
			auth = &discovery.AuthMetadata{Kind: endpoint.Auth.Kind, Variable: endpoint.Auth.Variable}
		}
		result.Endpoints = append(result.Endpoints, discovery.AIEndpoint{Method: endpoint.Method, Path: endpoint.Path, Source: discovery.SourceLocation{File: endpoint.Source.File, Line: endpoint.Source.Line}, PathParameters: endpoint.PathParameters, Headers: endpoint.Headers, Body: endpoint.Body, HasBody: endpoint.HasBody, Auth: auth, Evidence: endpoint.Evidence})
	}
	return result
}
