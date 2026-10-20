package discovery

import (
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
)

var validHeaderName = regexp.MustCompile(`^[!#$%&'*+.^_` + "`" + `|~0-9A-Za-z-]+$`)
var placeholderPattern = regexp.MustCompile(`^\{\{[A-Za-z_][A-Za-z0-9_]*\}\}$`)
var sensitiveBodyField = regexp.MustCompile(`(?i)(token|secret|password|api[_-]?key)\s*[:=]\s*["']([^"']+)["']`)

func validAIEndpoint(root string, allowed map[string]struct{}, snippets []SourceSnippet, endpoint AIEndpoint) bool {
	if _, ok := validMethods[strings.ToUpper(strings.TrimSpace(endpoint.Method))]; !ok {
		return false
	}
	if endpoint.Source.Line <= 0 {
		return false
	}
	source := resolveSource(root, endpoint.Source.File)
	if _, ok := allowed[source]; !ok {
		return false
	}
	if len(endpoint.Evidence) == 0 {
		return false
	}
	grounded := false
	for _, snippet := range snippets {
		if resolveSource(root, snippet.File) != source {
			continue
		}
		for _, evidence := range endpoint.Evidence {
			if strings.TrimSpace(evidence) != "" && strings.Contains(snippet.Content, evidence) && pathAppearsInSnippet(endpoint.Path, snippet.Content) {
				grounded = true
			}
		}
	}
	if !grounded {
		return false
	}
	if endpoint.HasBody && strings.TrimSpace(endpoint.Body) == "" {
		return false
	}
	if !validAIHeaders(endpoint.Headers) || !validAIBody(endpoint.Body) || !validAIAuth(endpoint.Auth) {
		return false
	}
	for _, parameter := range endpoint.PathParameters {
		if !strings.Contains(endpoint.Path, "{"+parameter+"}") || !validParameterName(parameter) {
			return false
		}
	}
	if filepath.IsAbs(endpoint.Source.File) && filepath.Clean(endpoint.Source.File) != source {
		return false
	}
	return true
}

func pathAppearsInSnippet(path, content string) bool {
	if strings.Contains(content, path) {
		return true
	}
	frameworkPath := strings.ReplaceAll(strings.ReplaceAll(path, "{", ":"), "}", "")
	return frameworkPath != path && strings.Contains(content, frameworkPath)
}

func validAIHeaders(headers map[string]string) bool {
	for name, value := range headers {
		if !validHeaderName.MatchString(name) || strings.ContainsAny(value, "\r\n") || looksLikeSecret(value) {
			return false
		}
		lowerName := strings.ToLower(name)
		if strings.Contains(lowerName, "token") || strings.Contains(lowerName, "secret") || strings.Contains(lowerName, "api-key") || strings.Contains(lowerName, "apikey") || strings.Contains(lowerName, "password") {
			if !containsPlaceholder(value) {
				return false
			}
		}
		if strings.EqualFold(name, "authorization") && !placeholderPattern.MatchString(strings.TrimSpace(strings.TrimPrefix(value, "Bearer "))) {
			return false
		}
	}
	return true
}

func validAIBody(body string) bool {
	if strings.ContainsAny(body, "\x00\r") {
		return false
	}
	for _, line := range strings.Split(body, "\n") {
		if strings.HasPrefix(line, "###") {
			return false
		}
	}
	for _, match := range sensitiveBodyField.FindAllStringSubmatch(body, -1) {
		if !containsPlaceholder(match[2]) {
			return false
		}
	}
	return len(body) <= 16<<10
}

func containsPlaceholder(value string) bool {
	return strings.Contains(value, "{{") && strings.Contains(value, "}}")
}

func validAIAuth(auth *AuthMetadata) bool {
	if auth == nil {
		return true
	}
	if auth.Kind == "" || !validParameterName(auth.Variable) {
		return false
	}
	return auth.Kind == "bearer" || auth.Kind == "basic" || auth.Kind == "api_key"
}

func looksLikeSecret(value string) bool {
	lower := strings.ToLower(strings.TrimSpace(value))
	if strings.HasPrefix(lower, "bearer ") && !containsPlaceholder(value) {
		return true
	}
	if strings.Contains(lower, "password=") {
		return true
	}
	return strings.Contains(lower, "secret") || strings.Contains(lower, "api_key") || strings.Contains(lower, "apikey")
}

func applyAuthHeader(headers map[string]string, auth *AuthMetadata) map[string]string {
	result := cloneHeaders(headers)
	if auth == nil {
		return result
	}
	if auth.Kind == "bearer" {
		result[http.CanonicalHeaderKey("Authorization")] = "Bearer {{" + auth.Variable + "}}"
	}
	return result
}

func cloneHeaders(headers map[string]string) map[string]string {
	if headers == nil {
		return nil
	}
	result := make(map[string]string, len(headers))
	for key, value := range headers {
		result[key] = value
	}
	return result
}

func cloneAuth(auth *AuthMetadata) *AuthMetadata {
	if auth == nil {
		return nil
	}
	copy := *auth
	return &copy
}
