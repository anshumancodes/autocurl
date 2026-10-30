// Package ai contains direct, user-keyed AI providers for autocurl.
package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/anshumancodes/autocurl/internal/discovery"
)

const defaultGeminiModel = "gemini-2.0-flash"

type providerError struct{ code, message string }

func (e *providerError) Error() string     { return e.message }
func (e *providerError) ErrorCode() string { return e.code }

// Gemini calls Google's API directly. The key is loaded lazily so auto mode
// can finish without a key whenever deterministic discovery is sufficient.
type Gemini struct {
	APIKey  string
	Model   string
	Client  *http.Client
	BaseURL string
}

func NewGeminiFromEnv() *Gemini {
	return &Gemini{APIKey: strings.TrimSpace(os.Getenv("GEMINI_API_KEY")), Model: strings.TrimSpace(os.Getenv("GEMINI_MODEL")), Client: &http.Client{Timeout: 30 * time.Second}}
}

func (g *Gemini) Analyze(ctx context.Context, request discovery.AIRequest) (discovery.AIResponse, error) {
	key := strings.TrimSpace(g.APIKey)
	if key == "" {
		return discovery.AIResponse{}, &providerError{"configuration_required", "GEMINI_API_KEY is required for AI analysis; set it in your environment or use --ai=off"}
	}
	model := strings.TrimSpace(g.Model)
	if model == "" {
		model = defaultGeminiModel
	}
	base := strings.TrimRight(strings.TrimSpace(g.BaseURL), "/")
	if base == "" {
		base = "https://generativelanguage.googleapis.com/v1beta"
	}
	promptData, err := json.Marshal(request)
	if err != nil {
		return discovery.AIResponse{}, errors.New("could not encode AI discovery context")
	}
	payload := map[string]any{
		"systemInstruction": map[string]any{"parts": []map[string]string{{"text": "Analyze the supplied bounded and redacted source context for HTTP API endpoints. Return only JSON matching {\"endpoints\":[{\"method\":string,\"path\":string,\"source\":{\"file\":string,\"line\":number},\"path_parameters\":string[],\"headers\":object,\"body\":string,\"has_body\":boolean,\"auth\":object|null,\"evidence\":string[]}]}. Include exact source evidence copied from the snippets. Do not invent routes or secrets."}}},
		"contents":          []map[string]any{{"role": "user", "parts": []map[string]string{{"text": string(promptData)}}}},
		"generationConfig":  map[string]any{"responseMimeType": "application/json"},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return discovery.AIResponse{}, errors.New("could not encode Gemini request")
	}
	endpoint := base + "/models/" + url.PathEscape(model) + ":generateContent?key=" + url.QueryEscape(key)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return discovery.AIResponse{}, errors.New("could not create Gemini request")
	}
	req.Header.Set("Content-Type", "application/json")
	client := g.Client
	if client == nil {
		client = &http.Client{Timeout: 30 * time.Second}
	}
	resp, err := client.Do(req)
	if err != nil {
		var networkError net.Error
		if errors.Is(ctx.Err(), context.DeadlineExceeded) || (errors.As(err, &networkError) && networkError.Timeout()) {
			return discovery.AIResponse{}, errors.New("Gemini request timed out")
		}
		return discovery.AIResponse{}, errors.New("Gemini request failed; check your network connection and try again")
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if err != nil {
		return discovery.AIResponse{}, errors.New("could not read Gemini response")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		switch resp.StatusCode {
		case http.StatusUnauthorized, http.StatusForbidden, http.StatusBadRequest:
			return discovery.AIResponse{}, &providerError{"invalid_credentials", "Gemini rejected the API key or request; verify GEMINI_API_KEY and that the Gemini API is enabled"}
		case http.StatusTooManyRequests:
			return discovery.AIResponse{}, errors.New("Gemini rate limit reached; wait and try again")
		default:
			return discovery.AIResponse{}, fmt.Errorf("Gemini request failed with HTTP %d", resp.StatusCode)
		}
	}
	var envelope struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(data, &envelope); err != nil || len(envelope.Candidates) == 0 || len(envelope.Candidates[0].Content.Parts) == 0 {
		return discovery.AIResponse{}, errors.New("Gemini returned an empty or invalid response")
	}
	text := strings.TrimSpace(envelope.Candidates[0].Content.Parts[0].Text)
	var result discovery.AIResponse
	if err := json.Unmarshal([]byte(text), &result); err != nil {
		return discovery.AIResponse{}, errors.New("Gemini returned invalid discovery JSON")
	}
	return result, nil
}
