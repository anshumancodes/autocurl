package discovery

import (
	"errors"
	"fmt"
	"sort"

	"github.com/anshumancodes/autocurl/internal/project"
)

// DiscoverOptions controls a discovery run. Extractors are supplied by the
// caller so that extractor packages can depend on discovery without creating
// an import cycle back from discovery to those packages.
type DiscoverOptions struct {
	ScanOptions project.ScanOptions
	Extractors  []Extractor
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
	sort.Strings(warnings)
	normalized.Warnings = warnings
	return normalized, nil
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
