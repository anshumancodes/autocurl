package discovery

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

const (
	maxAISnippets     = 12
	maxAISnippetLines = 48
	maxAITotalBytes   = 48 << 10
)

var warningSourcePattern = regexp.MustCompile(`(?:^|[[:space:]])([^[:space:]]+\.(?:js|ts|go|py)):(\d+)`)

// BuildAIRequest selects bounded source context for the optional AI pass. It
// intentionally works from the scanner's already-filtered file set.
func BuildAIRequest(root string, context ExtractionContext, routes []Route, warnings []string, operation string) (AIRequest, error) {
	selected := make(map[string]map[int]bool)
	for _, route := range routes {
		file := resolveContextFile(root, route.Source.File)
		if file != "" {
			if selected[file] == nil {
				selected[file] = make(map[int]bool)
			}
			selected[file][route.Source.Line] = true
		}
	}
	for _, warning := range warnings {
		match := warningSourcePattern.FindStringSubmatch(warning)
		if len(match) != 3 {
			continue
		}
		file := resolveContextFile(root, match[1])
		if file == "" {
			continue
		}
		var line int
		_, _ = fmt.Sscanf(match[2], "%d", &line)
		if selected[file] == nil {
			selected[file] = make(map[int]bool)
		}
		selected[file][line] = true
	}
	if len(selected) == 0 {
		for _, file := range context.Files {
			selected[file] = map[int]bool{1: true}
			if len(selected) >= 4 {
				break
			}
		}
	}

	files := make([]string, 0, len(selected))
	for file := range selected {
		files = append(files, file)
	}
	sort.Strings(files)
	request := AIRequest{
		Operation: operation,
		Detection: DetectionSummary{
			Languages:  append([]string(nil), context.Detection.Languages...),
			Frameworks: append([]string(nil), context.Detection.Frameworks...),
		},
		Routes:   append([]Route(nil), routes...),
		Warnings: append([]string(nil), warnings...),
	}
	for _, file := range files {
		if len(request.Snippets) >= maxAISnippets {
			break
		}
		data, err := os.ReadFile(file)
		if err != nil {
			continue
		}
		lines := strings.Split(strings.ReplaceAll(string(data), "\r\n", "\n"), "\n")
		centers := make([]int, 0, len(selected[file]))
		for line := range selected[file] {
			centers = append(centers, line)
		}
		sort.Ints(centers)
		for _, center := range centers {
			if len(request.Snippets) >= maxAISnippets {
				break
			}
			if center < 1 {
				center = 1
			}
			start := center - 16
			if start < 1 {
				start = 1
			}
			end := start + maxAISnippetLines - 1
			if end > len(lines) {
				end = len(lines)
			}
			if end-start+1 > maxAISnippetLines {
				end = start + maxAISnippetLines - 1
			}
			var content strings.Builder
			for line := start; line <= end; line++ {
				fmt.Fprintf(&content, "%d|%s\n", line, redactSourceLine(lines[line-1]))
			}
			if requestBytes(request)+content.Len() > maxAITotalBytes {
				break
			}
			relative, err := filepath.Rel(root, file)
			if err != nil {
				relative = filepath.Base(file)
			}
			request.Snippets = append(request.Snippets, SourceSnippet{File: filepath.ToSlash(relative), Start: start, End: end, Content: content.String()})
		}
	}
	return request, nil
}

func requestBytes(request AIRequest) int {
	total := 0
	for _, snippet := range request.Snippets {
		total += len(snippet.Content)
	}
	return total
}

func resolveContextFile(root, raw string) string {
	if strings.TrimSpace(raw) == "" {
		return ""
	}
	file := raw
	if !filepath.IsAbs(file) {
		file = filepath.Join(root, file)
	}
	file, err := filepath.Abs(file)
	if err != nil {
		return ""
	}
	return file
}

var sensitiveSourcePattern = regexp.MustCompile(`(?i)(api[_-]?key|secret|token|password|authorization|private[_-]?key)\s*[:=]`)

// redactSourceLine is deliberately conservative best-effort filtering, not a
// guarantee that arbitrary secrets cannot be present in source code.
func redactSourceLine(line string) string {
	if sensitiveSourcePattern.MatchString(line) {
		return "[redacted sensitive source line]"
	}
	if strings.Contains(strings.ToLower(line), "bearer ") {
		return "[redacted bearer source line]"
	}
	return line
}
