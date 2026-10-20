// Package ai contains optional AI-assisted discovery providers.
package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/anshumancodes/autocurl/internal/discovery"
)

var ErrMissingAPIKey = errors.New("GEMINI_API_KEY is not set")

type Gemini struct {
	APIKey  string
	Client  *http.Client
	BaseURL string
	Model   string
}

func NewGemini(apiKey string) *Gemini {
	return &Gemini{APIKey: strings.TrimSpace(apiKey), Client: &http.Client{Timeout: 25 * time.Second}, BaseURL: "https://generativelanguage.googleapis.com", Model: "gemini-2.0-flash"}
}

func (g *Gemini) Analyze(ctx context.Context, request discovery.AIRequest) (discovery.AIResponse, error) {
	if strings.TrimSpace(g.APIKey) == "" {
		return discovery.AIResponse{}, ErrMissingAPIKey
	}
	client := g.Client
	if client == nil {
		client = &http.Client{Timeout: 25 * time.Second}
	}
	payload := geminiRequest{Contents: []geminiContent{{Role: "user", Parts: []geminiPart{{Text: buildPrompt(request)}}}}, GenerationConfig: geminiGenerationConfig{ResponseMIMEType: "application/json"}}
	data, err := json.Marshal(payload)
	if err != nil {
		return discovery.AIResponse{}, fmt.Errorf("encode Gemini request: %w", err)
	}
	endpoint := strings.TrimRight(g.BaseURL, "/") + "/v1beta/models/" + url.PathEscape(g.Model) + ":generateContent?key=" + url.QueryEscape(g.APIKey)
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(data))
	if err != nil {
		return discovery.AIResponse{}, fmt.Errorf("create Gemini request: %w", err)
	}
	httpRequest.Header.Set("Content-Type", "application/json")
	response, err := client.Do(httpRequest)
	if err != nil {
		return discovery.AIResponse{}, fmt.Errorf("Gemini request: %w", err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
	if err != nil {
		return discovery.AIResponse{}, fmt.Errorf("read Gemini response: %w", err)
	}
	if response.StatusCode == http.StatusTooManyRequests {
		return discovery.AIResponse{}, fmt.Errorf("Gemini rate limit (HTTP %d)", response.StatusCode)
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return discovery.AIResponse{}, fmt.Errorf("Gemini returned HTTP %d", response.StatusCode)
	}
	var envelope geminiResponse
	if err := json.Unmarshal(body, &envelope); err != nil {
		return discovery.AIResponse{}, fmt.Errorf("decode Gemini response: %w", err)
	}
	if len(envelope.Candidates) == 0 || len(envelope.Candidates[0].Content.Parts) == 0 {
		return discovery.AIResponse{}, errors.New("Gemini response contained no candidate")
	}
	text := strings.TrimSpace(envelope.Candidates[0].Content.Parts[0].Text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimSuffix(strings.TrimSpace(text), "```")
	var result aiJSONResponse
	decoder := json.NewDecoder(strings.NewReader(text))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&result); err != nil {
		return discovery.AIResponse{}, fmt.Errorf("decode structured Gemini output: %w", err)
	}
	var trailing interface{}
	if err := decoder.Decode(&trailing); err != io.EOF {
		return discovery.AIResponse{}, errors.New("decode structured Gemini output: trailing JSON")
	}
	return result.discoveryResponse(), nil
}

type geminiRequest struct {
	Contents         []geminiContent        `json:"contents"`
	GenerationConfig geminiGenerationConfig `json:"generationConfig"`
}
type geminiContent struct {
	Role  string       `json:"role"`
	Parts []geminiPart `json:"parts"`
}
type geminiPart struct {
	Text string `json:"text"`
}
type geminiGenerationConfig struct {
	ResponseMIMEType string `json:"responseMimeType"`
}
type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []geminiPart `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

type aiJSONResponse struct {
	Endpoints []aiJSONEndpoint `json:"endpoints"`
}
type aiJSONEndpoint struct {
	Method         string            `json:"method"`
	Path           string            `json:"path"`
	Source         aiJSONSource      `json:"source"`
	PathParameters []string          `json:"path_parameters"`
	Headers        map[string]string `json:"headers"`
	Body           string            `json:"body"`
	HasBody        bool              `json:"has_body"`
	Auth           *aiJSONAuth       `json:"auth"`
	Evidence       []string          `json:"evidence"`
}
type aiJSONSource struct {
	File string `json:"file"`
	Line int    `json:"line"`
}
type aiJSONAuth struct {
	Kind     string `json:"kind"`
	Variable string `json:"variable"`
}

func (r aiJSONResponse) discoveryResponse() discovery.AIResponse {
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

func buildPrompt(request discovery.AIRequest) string {
	var builder strings.Builder
	builder.WriteString("Return only strict JSON matching {\"endpoints\":[{\"method\":string,\"path\":string,\"source\":{\"file\":string,\"line\":integer},\"path_parameters\":string[],\"headers\":object,\"body\":string,\"has_body\":boolean,\"auth\":{\"kind\":string,\"variable\":string}|null,\"evidence\":string[]}]} .\n")
	builder.WriteString("Never invent endpoints. Every endpoint must be grounded in one supplied source snippet and include exact evidence text. Preserve existing endpoint method, path and source identity when enriching. Never return secrets or literal credentials; use placeholders.\n")
	fmt.Fprintf(&builder, "Operation: %s\nLanguages: %s\nFrameworks: %s\nWarnings: %s\n", request.Operation, strings.Join(request.Detection.Languages, ","), strings.Join(request.Detection.Frameworks, ","), strings.Join(request.Warnings, " | "))
	for _, route := range request.Routes {
		fmt.Fprintf(&builder, "Existing route: %s %s at %s:%d\n", route.Method, route.Path, route.Source.File, route.Source.Line)
	}
	for _, snippet := range request.Snippets {
		fmt.Fprintf(&builder, "SOURCE %s lines %d-%d:\n%s\n", snippet.File, snippet.Start, snippet.End, snippet.Content)
	}
	return builder.String()
}
