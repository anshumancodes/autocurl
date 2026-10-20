package project

import (
	"fmt"
	"os"
	"path/filepath"
)

// Scope identifies the requested portion of a project while Root remains the
// directory used for complete discovery and routing-context resolution.
type Scope struct {
	Root   string
	Target string
	IsFile bool
}

// ResolveScope resolves a directory or source file to its containing project.
// The nearest reliable manifest wins; when a project has no manifest, the
// selected directory is used as the root for backwards-compatible behavior.
func ResolveScope(raw string) (Scope, error) {
	if raw == "" {
		return Scope{}, fmt.Errorf("scope cannot be empty")
	}
	target, err := filepath.Abs(raw)
	if err != nil {
		return Scope{}, fmt.Errorf("resolve scope %s: %w", raw, err)
	}
	info, err := os.Stat(target)
	if err != nil {
		return Scope{}, err
	}
	isFile := !info.IsDir()
	start := target
	if isFile {
		if !info.Mode().IsRegular() {
			return Scope{}, fmt.Errorf("%s is not a regular file or directory", raw)
		}
		start = filepath.Dir(target)
	}
	root := start
	foundManifest := false
	for {
		if hasProjectManifest(root) {
			foundManifest = true
			break
		}
		parent := filepath.Dir(root)
		if parent == root {
			break
		}
		root = parent
	}
	if !foundManifest {
		root = start
	}
	return Scope{Root: root, Target: target, IsFile: isFile}, nil
}

func hasProjectManifest(dir string) bool {
	for _, name := range []string{"package.json", "go.mod", "pyproject.toml", "requirements.txt", "Pipfile"} {
		if _, err := os.Stat(filepath.Join(dir, name)); err == nil {
			return true
		}
	}
	return false
}
