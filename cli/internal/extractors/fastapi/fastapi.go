// Package fastapi extracts statically declared FastAPI routes from Python projects.
package fastapi

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"

	"github.com/anshumancodes/autocurl/internal/discovery"
)

const staticConfidence = 0.95

//go:embed ast_helper.py
var astHelper []byte

type Extractor struct{}

func New() discovery.Extractor { return Extractor{} }
func (Extractor) Name() string { return "fastapi-ast" }

func (Extractor) Applies(ctx discovery.ExtractionContext) bool {
	for _, language := range ctx.Detection.Languages {
		if !strings.EqualFold(language, "python") {
			continue
		}
		for _, framework := range ctx.Detection.Frameworks {
			if strings.EqualFold(framework, "fastapi") {
				return true
			}
		}
	}
	return false
}

type helperInput struct {
	Files map[string]string `json:"files"`
}
type helperRoute struct {
	Method, Path, File string
	Line               int
}
type helperOutput struct {
	Routes   []helperRoute `json:"routes"`
	Warnings []string      `json:"warnings"`
}

func (Extractor) Extract(ctx discovery.ExtractionContext) ([]discovery.Route, []string, error) {
	input := helperInput{Files: map[string]string{}}
	warnings := make([]string, 0)
	for _, path := range ctx.Files {
		if !strings.EqualFold(filepath.Ext(path), ".py") {
			continue
		}
		data, err := osReadFile(path)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("fastapi: read %s: %v", path, err))
			continue
		}
		input.Files[path] = string(data)
	}
	if len(input.Files) == 0 {
		return []discovery.Route{}, nil, nil
	}
	payload, err := json.Marshal(input)
	if err != nil {
		return nil, nil, fmt.Errorf("fastapi: encode Python sources: %w", err)
	}
	command := exec.Command("python3", "-c", string(astHelper))
	command.Stdin = strings.NewReader(string(payload))
	output, err := command.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok && len(exitErr.Stderr) > 0 {
			return nil, nil, fmt.Errorf("fastapi: Python AST helper failed: %s", strings.TrimSpace(string(exitErr.Stderr)))
		}
		return nil, nil, fmt.Errorf("fastapi: run Python AST helper: %w", err)
	}
	var parsed helperOutput
	if err := json.Unmarshal(output, &parsed); err != nil {
		return nil, nil, fmt.Errorf("fastapi: decode AST helper output: %w", err)
	}
	routes := make([]discovery.Route, 0, len(parsed.Routes))
	for _, route := range parsed.Routes {
		routes = append(routes, discovery.Route{Method: route.Method, Path: route.Path, Language: "python", Framework: "fastapi", Source: discovery.SourceLocation{File: route.File, Line: route.Line}, Strategy: discovery.StrategyAST, Confidence: staticConfidence})
	}
	sort.SliceStable(routes, func(i, j int) bool {
		if routes[i].Source.File != routes[j].Source.File {
			return routes[i].Source.File < routes[j].Source.File
		}
		if routes[i].Source.Line != routes[j].Source.Line {
			return routes[i].Source.Line < routes[j].Source.Line
		}
		return routes[i].Method < routes[j].Method
	})
	sort.Strings(parsed.Warnings)
	parsed.Warnings = append(parsed.Warnings, warnings...)
	sort.Strings(parsed.Warnings)
	return routes, parsed.Warnings, nil
}

// Kept as a variable to make file reads easy to replace in tests without
// changing the extractor's public contract.
var osReadFile = func(path string) ([]byte, error) { return os.ReadFile(path) }
