package pythonast

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
)

// Route is the JSON-neutral route emitted by the Python AST helper.
type Route struct {
	Method, Path, File string
	Line               int
}
type input struct {
	Files map[string]string `json:"files"`
}
type output struct {
	Routes   []Route  `json:"routes"`
	Warnings []string `json:"warnings"`
}

// Run parses all Python files in ctx.Files with the bundled helper. The helper
// intentionally returns only statically resolvable declarations.
func Run(files []string, framework string, helper []byte) ([]Route, []string, error) {
	doc := input{Files: map[string]string{}}
	warnings := []string{}
	for _, path := range files {
		if !strings.EqualFold(filepath.Ext(path), ".py") {
			continue
		}
		data, err := os.ReadFile(path)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("%s: read %s: %v", framework, path, err))
			continue
		}
		doc.Files[path] = string(data)
	}
	if len(doc.Files) == 0 {
		return []Route{}, warnings, nil
	}
	payload, err := json.Marshal(struct {
		Framework string            `json:"framework"`
		Files     map[string]string `json:"files"`
	}{framework, doc.Files})
	if err != nil {
		return nil, nil, fmt.Errorf("%s: encode Python sources: %w", framework, err)
	}
	cmd := exec.Command("python3", "-c", string(helper))
	cmd.Stdin = strings.NewReader(string(payload))
	data, err := cmd.Output()
	if err != nil {
		if e, ok := err.(*exec.ExitError); ok && len(e.Stderr) > 0 {
			return nil, nil, fmt.Errorf("%s: Python AST helper failed: %s", framework, strings.TrimSpace(string(e.Stderr)))
		}
		return nil, nil, fmt.Errorf("%s: run Python AST helper: %w", framework, err)
	}
	var parsed output
	if err := json.Unmarshal(data, &parsed); err != nil {
		return nil, nil, fmt.Errorf("%s: decode AST helper output: %w", framework, err)
	}
	sort.Strings(parsed.Warnings)
	parsed.Warnings = append(parsed.Warnings, warnings...)
	sort.Strings(parsed.Warnings)
	return parsed.Routes, parsed.Warnings, nil
}
