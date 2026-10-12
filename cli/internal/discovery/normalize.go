package discovery

import (
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"unicode"
)

var (
	ErrInvalidMethod     = errors.New("invalid HTTP method")
	ErrInvalidPath       = errors.New("invalid route path")
	ErrInvalidConfidence = errors.New("invalid route confidence")
	ErrInvalidStrategy   = errors.New("invalid route strategy")
	ErrInvalidSourceLine = errors.New("invalid source line")
)

var validMethods = map[string]struct{}{
	"CONNECT": {},
	"DELETE":  {},
	"GET":     {},
	"HEAD":    {},
	"OPTIONS": {},
	"PATCH":   {},
	"POST":    {},
	"PUT":     {},
	"TRACE":   {},
}

// NormalizeRoute validates and canonicalizes a single discovered route.
func NormalizeRoute(route Route) (Route, error) {
	method := strings.ToUpper(strings.TrimSpace(route.Method))
	if _, ok := validMethods[method]; !ok {
		return Route{}, fmt.Errorf("%w: %q", ErrInvalidMethod, route.Method)
	}

	path, err := normalizePath(route.Path)
	if err != nil {
		return Route{}, err
	}

	if math.IsNaN(route.Confidence) || math.IsInf(route.Confidence, 0) ||
		route.Confidence < 0 || route.Confidence > 1 {
		return Route{}, fmt.Errorf("%w: %v", ErrInvalidConfidence, route.Confidence)
	}
	if route.Strategy != StrategyAST && route.Strategy != StrategyAI {
		return Route{}, fmt.Errorf("%w: %q", ErrInvalidStrategy, route.Strategy)
	}
	if route.Source.Line < 0 {
		return Route{}, fmt.Errorf("%w: %d", ErrInvalidSourceLine, route.Source.Line)
	}

	route.Method = method
	route.Path = path
	return route, nil
}

// NormalizeRoutes normalizes valid candidates, skips invalid ones, and
// returns a stable, deduplicated result.
func NormalizeRoutes(routes []Route) DiscoveryResult {
	selected := make(map[string]Route)
	warnings := make([]string, 0)

	for _, candidate := range routes {
		route, err := NormalizeRoute(candidate)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("skipping route %q %q: %v", candidate.Method, candidate.Path, err))
			continue
		}

		key := route.Method + "\x00" + route.Path
		if current, ok := selected[key]; !ok || routePrecedes(route, current) {
			selected[key] = route
		}
	}

	result := DiscoveryResult{
		Routes:   make([]Route, 0, len(selected)),
		Warnings: warnings,
	}
	for _, route := range selected {
		result.Routes = append(result.Routes, route)
	}
	sort.Slice(result.Routes, func(i, j int) bool {
		if result.Routes[i].Path != result.Routes[j].Path {
			return result.Routes[i].Path < result.Routes[j].Path
		}
		return result.Routes[i].Method < result.Routes[j].Method
	})
	sort.Strings(result.Warnings)
	return result
}

func normalizePath(raw string) (string, error) {
	path := strings.TrimSpace(raw)
	if path == "" {
		return "", fmt.Errorf("%w: path is empty", ErrInvalidPath)
	}
	if hasURLScheme(path) {
		return "", fmt.Errorf("%w: complete URLs are not route paths", ErrInvalidPath)
	}
	if strings.ContainsAny(path, "?#\\") {
		return "", fmt.Errorf("%w: queries, fragments, and backslashes are unsupported", ErrInvalidPath)
	}
	for _, r := range path {
		if unicode.IsControl(r) || unicode.IsSpace(r) {
			return "", fmt.Errorf("%w: path contains whitespace or control characters", ErrInvalidPath)
		}
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	if strings.HasPrefix(path, "//") {
		return "", fmt.Errorf("%w: redundant leading slash", ErrInvalidPath)
	}
	for len(path) > 1 && strings.HasSuffix(path, "/") {
		path = strings.TrimSuffix(path, "/")
	}
	if path == "/" {
		return path, nil
	}

	segments := strings.Split(path[1:], "/")
	for _, segment := range segments {
		if segment == "" || segment == "." || segment == ".." {
			return "", fmt.Errorf("%w: ambiguous segment %q", ErrInvalidPath, segment)
		}
		normalized, err := normalizeSegment(segment)
		if err != nil {
			return "", err
		}
		if normalized != segment {
			path = strings.Replace(path, "/"+segment, "/"+normalized, 1)
		}
	}
	return path, nil
}

func normalizeSegment(segment string) (string, error) {
	if strings.HasPrefix(segment, ":") {
		name := strings.TrimPrefix(segment, ":")
		if !validParameterName(name) {
			return "", fmt.Errorf("%w: unsupported parameter %q", ErrInvalidPath, segment)
		}
		return "{" + name + "}", nil
	}
	if strings.HasPrefix(segment, "{") || strings.HasSuffix(segment, "}") {
		if len(segment) < 3 || !strings.HasSuffix(segment, "}") ||
			!validParameterName(segment[1:len(segment)-1]) {
			return "", fmt.Errorf("%w: malformed parameter %q", ErrInvalidPath, segment)
		}
		return segment, nil
	}
	if strings.HasPrefix(segment, "<") || strings.HasSuffix(segment, ">") {
		if len(segment) < 3 || !strings.HasSuffix(segment, ">") {
			return "", fmt.Errorf("%w: malformed parameter %q", ErrInvalidPath, segment)
		}
		body := segment[1 : len(segment)-1]
		parts := strings.Split(body, ":")
		name := body
		if len(parts) == 2 && validParameterName(parts[0]) {
			name = parts[1]
		} else if len(parts) != 1 {
			return "", fmt.Errorf("%w: malformed parameter %q", ErrInvalidPath, segment)
		}
		if !validParameterName(name) {
			return "", fmt.Errorf("%w: malformed parameter %q", ErrInvalidPath, segment)
		}
		return "{" + name + "}", nil
	}
	if strings.ContainsAny(segment, "{}<>") {
		return "", fmt.Errorf("%w: unsupported parameter pattern %q", ErrInvalidPath, segment)
	}
	return segment, nil
}

func validParameterName(name string) bool {
	if name == "" || !((name[0] >= 'a' && name[0] <= 'z') || (name[0] >= 'A' && name[0] <= 'Z') || name[0] == '_') {
		return false
	}
	for _, r := range name[1:] {
		if !((r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_') {
			return false
		}
	}
	return true
}

func hasURLScheme(path string) bool {
	colon := strings.IndexByte(path, ':')
	return colon > 0 && strings.Contains(path[colon+1:], "//")
}

func routePrecedes(a, b Route) bool {
	if a.Strategy != b.Strategy {
		return a.Strategy == StrategyAST
	}
	if a.Confidence != b.Confidence {
		return a.Confidence > b.Confidence
	}
	return routeTieKey(a) < routeTieKey(b)
}

func routeTieKey(route Route) string {
	return strings.Join([]string{
		route.Language,
		route.Framework,
		route.Source.File,
		fmt.Sprintf("%020d", route.Source.Line),
		string(route.Strategy),
	}, "\x00")
}
