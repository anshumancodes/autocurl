// Package executor resolves and executes parsed autocurl requests.
package executor

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/anshumancodes/autocurl/internal/parser"
)

const (
	DefaultTimeout         = 30 * time.Second
	DefaultMaxResponseSize = 10 << 20
)

var (
	ErrUnresolvedPlaceholder = errors.New("unresolved request placeholder")
	ErrResponseTooLarge      = errors.New("response body exceeds configured limit")
)

// HTTPClient is the part of http.Client needed by the executor.
type HTTPClient interface {
	Do(*http.Request) (*http.Response, error)
}

// ResolvedRequest is a request ready to be sent to an HTTP server.
type ResolvedRequest struct {
	Method  string
	URL     string
	Headers map[string]string
	Body    string
	HasBody bool
}

// Result contains a completed HTTP exchange. HTTP error statuses are valid results.
type Result struct {
	Method     string
	URL        string
	StatusCode int
	Status     string
	Headers    http.Header
	Body       string
	Duration   time.Duration
}

// MissingVariablesError identifies placeholders for which no value was supplied.
type MissingVariablesError struct{ Names []string }

func (e *MissingVariablesError) Error() string {
	return fmt.Sprintf("missing values for variables: %s", strings.Join(e.Names, ", "))
}

// Resolve substitutes document variables and supplied values without changing req.
// Base URL variables are inserted as URLs; other URL placeholders are escaped as
// path values when they occur in a path segment.
func Resolve(req parser.Request, variables map[string]string) (ResolvedRequest, error) {
	values := make(map[string]string, len(variables))
	for name, value := range variables {
		values[name] = value
	}

	missing := make(map[string]struct{})
	resolve := func(raw string, urlValue bool) string {
		return substitute(raw, values, urlValue, missing)
	}
	resolved := ResolvedRequest{
		Method:  req.Method,
		URL:     resolve(req.URL, true),
		Headers: make(map[string]string, len(req.Headers)),
		HasBody: req.HasBody,
	}
	for name, value := range req.Headers {
		resolved.Headers[name] = resolve(value, false)
	}
	resolved.Body = resolve(req.Body, false)
	if len(missing) != 0 {
		names := make([]string, 0, len(missing))
		for name := range missing {
			names = append(names, name)
		}
		sort.Strings(names)
		return ResolvedRequest{}, &MissingVariablesError{Names: names}
	}
	if hasUnresolvedPlaceholder(resolved.URL, resolved.Headers, resolved.Body) {
		return ResolvedRequest{}, ErrUnresolvedPlaceholder
	}
	return resolved, nil
}

func hasUnresolvedPlaceholder(rawURL string, headers map[string]string, body string) bool {
	if strings.Contains(rawURL, "{{") || strings.Contains(rawURL, "}}") || strings.Contains(body, "{{") || strings.Contains(body, "}}") {
		return true
	}
	for name, value := range headers {
		if strings.Contains(name, "{{") || strings.Contains(name, "}}") || strings.Contains(value, "{{") || strings.Contains(value, "}}") {
			return true
		}
	}
	return false
}

// Execute resolves req with variables and executes it using client. A nil client
// uses a standard client with a bounded timeout.
func Execute(req parser.Request, variables map[string]string, client HTTPClient) (Result, error) {
	resolved, err := Resolve(req, variables)
	if err != nil {
		return Result{}, err
	}
	return ExecuteResolved(resolved, client, DefaultMaxResponseSize)
}

// ExecuteResolved executes a request that has already been resolved.
func ExecuteResolved(req ResolvedRequest, client HTTPClient, maxResponseSize int64) (Result, error) {
	if maxResponseSize <= 0 {
		maxResponseSize = DefaultMaxResponseSize
	}
	parsedURL, err := url.Parse(req.URL)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		return Result{}, errors.New("invalid request URL")
	}
	var body io.Reader
	if req.HasBody {
		body = strings.NewReader(req.Body)
	}
	httpReq, err := http.NewRequest(req.Method, parsedURL.String(), body)
	if err != nil {
		return Result{}, errors.New("invalid HTTP request")
	}
	for name, value := range req.Headers {
		httpReq.Header.Set(name, value)
	}
	if client == nil {
		client = &http.Client{Timeout: DefaultTimeout}
	}
	started := time.Now()
	response, err := client.Do(httpReq)
	if err != nil {
		return Result{}, err
	}
	defer response.Body.Close()
	bodyBytes, err := io.ReadAll(io.LimitReader(response.Body, maxResponseSize+1))
	if err != nil {
		return Result{}, err
	}
	if int64(len(bodyBytes)) > maxResponseSize {
		return Result{}, ErrResponseTooLarge
	}
	return Result{
		Method: req.Method, URL: req.URL, StatusCode: response.StatusCode,
		Status: response.Status, Headers: response.Header.Clone(), Body: string(bodyBytes),
		Duration: time.Since(started),
	}, nil
}

func substitute(raw string, values map[string]string, urlValue bool, missing map[string]struct{}) string {
	var output bytes.Buffer
	for offset := 0; offset < len(raw); {
		start := strings.Index(raw[offset:], "{{")
		if start < 0 {
			output.WriteString(raw[offset:])
			break
		}
		start += offset
		output.WriteString(raw[offset:start])
		end := strings.Index(raw[start+2:], "}}")
		if end < 0 {
			output.WriteString(raw[start:])
			break
		}
		end += start + 2
		name := strings.TrimSpace(raw[start+2 : end])
		value, ok := values[name]
		if !ok {
			missing[name] = struct{}{}
			output.WriteString(raw[start : end+2])
		} else if urlValue && name != "baseUrl" && name != "baseURL" && !inQueryOrFragment(raw, start) {
			output.WriteString(url.PathEscape(value))
		} else {
			output.WriteString(value)
		}
		offset = end + 2
	}
	return output.String()
}

func inQueryOrFragment(value string, placeholder int) bool {
	return strings.ContainsAny(value[:placeholder], "?#")
}
