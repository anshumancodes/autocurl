package discovery

import (
	stdcontext "context"
	"errors"
	"fmt"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/anshumancodes/autocurl/internal/project"
)

// DiscoverOptions controls a discovery run. Extractors are supplied by the
// caller so that extractor packages can depend on discovery without creating
// an import cycle back from discovery to those packages.
type DiscoverOptions struct {
	ScanOptions project.ScanOptions
	Extractors  []Extractor
	AIMode      AIMode
	AIProvider  AIProvider
	// RouteFilter is applied after extraction and normalization, before the
	// optional AI pass. Extractors still receive the complete project context
	// so cross-file routing relationships remain available.
	RouteFilter func(Route) bool
	// AIContextFiles bounds fallback AI context for scoped discovery.
	AIContextFiles []string
}

// ExtractionContext is the read-only project information made available to an
// extractor. Files contains the absolute, deterministically ordered paths
// returned by project.Scan.
type ExtractionContext struct {
	Root      string
	Files     []string
	Detection project.DetectionResult
}

// Extractor is the minimal contract for a route extractor. An extractor may
// return warnings for unsupported declarations; an ordinary error is treated
// as a recoverable failure for that extractor. Use CriticalExtractionError
// when the extractor cannot safely continue.
type Extractor interface {
	Name() string
	Applies(ExtractionContext) bool
	Extract(ExtractionContext) ([]Route, []string, error)
}

// CriticalExtractionError marks an extractor error that should abort the
// discovery run rather than be reported as a warning.
type CriticalExtractionError struct {
	Err error
}

func (e *CriticalExtractionError) Error() string {
	if e == nil || e.Err == nil {
		return "critical extraction failure"
	}
	return e.Err.Error()
}

func (e *CriticalExtractionError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Err
}

// NewCriticalExtractionError marks err as a critical extractor failure.
func NewCriticalExtractionError(err error) error {
	if err == nil {
		return nil
	}
	return &CriticalExtractionError{Err: err}
}

// Discover scans and detects a project, runs applicable extractors, and
// normalizes their combined route candidates.
func Discover(root string, options DiscoverOptions) (DiscoveryResult, error) {
	scan, err := project.Scan(root, options.ScanOptions)
	if err != nil {
		return DiscoveryResult{}, fmt.Errorf("scan project: %w", err)
	}

	detection, err := project.Detect(scan.Root)
	if err != nil {
		return DiscoveryResult{}, fmt.Errorf("detect project: %w", err)
	}

	// An empty source set is a valid result. In particular, do not emit
	// unsupported-framework warnings for a project with nothing to extract.
	if len(scan.Files) == 0 {
		return DiscoveryResult{Routes: []Route{}, Warnings: []string{}}, nil
	}

	context := ExtractionContext{
		Root:      scan.Root,
		Files:     append([]string(nil), scan.Files...),
		Detection: detection,
	}

	candidates := make([]Route, 0)
	warnings := make([]string, 0)
	selected := false
	for _, extractor := range options.Extractors {
		if extractor == nil {
			continue
		}
		if !extractor.Applies(context) {
			continue
		}
		selected = true

		routes, extractorWarnings, extractErr := extractor.Extract(context)
		candidates = append(candidates, routes...)
		warnings = append(warnings, extractorWarnings...)
		if extractErr != nil {
			var critical *CriticalExtractionError
			if errors.As(extractErr, &critical) {
				return DiscoveryResult{}, fmt.Errorf("extract routes with %s: %w", extractorName(extractor), extractErr)
			}
			warnings = append(warnings, fmt.Sprintf("extractor %s failed: %v", extractorName(extractor), extractErr))
		}
	}

	if !selected {
		warnings = append(warnings, unavailableExtractorWarnings(detection)...)
	}

	normalized := NormalizeRoutes(candidates)
	warnings = append(warnings, normalized.Warnings...)
	if options.RouteFilter != nil {
		filtered := normalized.Routes[:0]
		for _, route := range normalized.Routes {
			if options.RouteFilter(route) {
				filtered = append(filtered, route)
			}
		}
		normalized.Routes = filtered
	}
	if options.AIMode != AIModeOff && aiShouldRun(options.AIMode, normalized.Routes, warnings) {
		if options.AIProvider == nil {
			warnings = append(warnings, "AI analysis skipped: no provider configured")
		} else {
			aiFiles := scan.Files
			if options.RouteFilter != nil || len(options.AIContextFiles) > 0 {
				aiFiles = options.AIContextFiles
			}
			aiRequestContext := context
			aiRequestContext.Files = append([]string(nil), aiFiles...)
			aiRequest, requestErr := BuildAIRequest(scan.Root, aiRequestContext, normalized.Routes, warnings, "discover_and_enrich")
			if requestErr != nil {
				warnings = append(warnings, fmt.Sprintf("AI context unavailable: %v", requestErr))
			} else {
				aiContext, cancel := stdcontext.WithTimeout(stdcontext.Background(), 30*time.Second)
				aiResponse, aiErr := options.AIProvider.Analyze(aiContext, aiRequest)
				cancel()
				if aiErr != nil {
					warnings = append(warnings, fmt.Sprintf("AI analysis failed: %v", aiErr))
				} else {
					mergeAIResults(scan.Root, aiFiles, aiRequest.Snippets, &normalized, aiResponse)
				}
			}
		}
	}
	sort.Strings(warnings)
	normalized.Warnings = warnings
	return normalized, nil
}

func aiShouldRun(mode AIMode, routes []Route, warnings []string) bool {
	if mode == AIModeAlways {
		return true
	}
	if mode != AIModeAuto {
		return false
	}
	if len(routes) == 0 {
		return true
	}
	for _, warning := range warnings {
		lower := strings.ToLower(warning)
		if strings.Contains(lower, "dynamic") || strings.Contains(lower, "unresolved") || strings.Contains(lower, "unsupported") || strings.Contains(lower, "no route") {
			return true
		}
	}
	return false
}

func mergeAIResults(root string, files []string, snippets []SourceSnippet, result *DiscoveryResult, response AIResponse) {
	allowed := make(map[string]struct{}, len(files))
	for _, file := range files {
		absolute, err := filepath.Abs(file)
		if err == nil {
			allowed[filepath.Clean(absolute)] = struct{}{}
		}
	}
	byKey := make(map[string]int, len(result.Routes))
	for i, route := range result.Routes {
		byKey[route.Method+"\x00"+route.Path] = i
	}
	for _, candidate := range response.Endpoints {
		if !validAIEndpoint(root, allowed, snippets, candidate) {
			continue
		}
		route := Route{Method: candidate.Method, Path: candidate.Path, Source: candidate.Source, Strategy: StrategyAI, Confidence: .6, Headers: applyAuthHeader(candidate.Headers, candidate.Auth), Body: candidate.Body, HasBody: candidate.HasBody, Auth: cloneAuth(candidate.Auth)}
		normalized, err := NormalizeRoute(route)
		if err != nil {
			continue
		}
		key := normalized.Method + "\x00" + normalized.Path
		if index, exists := byKey[key]; exists {
			current := result.Routes[index]
			if sameSource(root, current.Source, normalized.Source) {
				current.Headers, current.Body, current.HasBody, current.Auth, current.Enriched = normalized.Headers, normalized.Body, normalized.HasBody, normalized.Auth, true
				result.Routes[index] = current
			}
			continue
		}
		byKey[key] = len(result.Routes)
		result.Routes = append(result.Routes, normalized)
	}
	sort.Slice(result.Routes, func(i, j int) bool {
		if result.Routes[i].Path != result.Routes[j].Path {
			return result.Routes[i].Path < result.Routes[j].Path
		}
		return result.Routes[i].Method < result.Routes[j].Method
	})
}

func sameSource(root string, a, b SourceLocation) bool {
	return resolveSource(root, a.File) == resolveSource(root, b.File) && a.Line == b.Line
}

func resolveSource(root, file string) string {
	if !filepath.IsAbs(file) {
		file = filepath.Join(root, file)
	}
	absolute, err := filepath.Abs(file)
	if err != nil {
		return ""
	}
	return filepath.Clean(absolute)
}

func extractorName(extractor Extractor) string {
	if name := extractor.Name(); name != "" {
		return name
	}
	return fmt.Sprintf("%T", extractor)
}

func unavailableExtractorWarnings(detection project.DetectionResult) []string {
	warnings := make([]string, 0, len(detection.Frameworks)+len(detection.Languages))
	if len(detection.Frameworks) > 0 {
		for _, framework := range detection.Frameworks {
			warnings = append(warnings, fmt.Sprintf("no route extractor registered for framework %q", framework))
		}
		return warnings
	}
	for _, language := range detection.Languages {
		warnings = append(warnings, fmt.Sprintf("no route extractor registered for language %q", language))
	}
	return warnings
}
