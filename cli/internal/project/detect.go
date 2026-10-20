package project

import (
	"encoding/json"
	"fmt"
	"github.com/BurntSushi/toml"
	goparser "go/parser"
	"go/token"
	"golang.org/x/mod/modfile"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// DetectionResult describes the languages and web frameworks found in a
// project. Values are lower-case, unique, and sorted.
type DetectionResult struct {
	Languages  []string
	Frameworks []string
}

// Detect identifies languages from source files and manifests, and frameworks
// from the project's dependency manifests.
func Detect(root string) (DetectionResult, error) {
	result := DetectionResult{
		Languages:  []string{},
		Frameworks: []string{},
	}

	scan, err := Scan(root, ScanOptions{})
	if err != nil {
		return DetectionResult{}, err
	}

	languages := stringSet{}
	frameworks := stringSet{}
	detectSourceLanguages(scan.Files, languages)

	if err := detectJavaScript(scan.Root, languages, frameworks); err != nil {
		return DetectionResult{}, err
	}
	if err := detectGo(scan.Root, scan.Files, languages, frameworks); err != nil {
		return DetectionResult{}, err
	}
	if err := detectPython(scan.Root, scan.Files, languages, frameworks); err != nil {
		return DetectionResult{}, err
	}

	result.Languages = languages.sorted()
	result.Frameworks = frameworks.sorted()
	return result, nil
}

type stringSet map[string]struct{}

func (s stringSet) add(value string) {
	s[value] = struct{}{}
}

func (s stringSet) sorted() []string {
	values := make([]string, 0, len(s))
	for value := range s {
		values = append(values, value)
	}
	sort.Strings(values)
	return values
}

func detectSourceLanguages(files []string, languages stringSet) {
	for _, file := range files {
		switch strings.ToLower(filepath.Ext(file)) {
		case ".js":
			languages.add("javascript")
		case ".ts":
			languages.add("typescript")
		case ".go":
			languages.add("go")
		case ".py":
			languages.add("python")
		}
	}
}

type packageManifest struct {
	Dependencies    map[string]json.RawMessage `json:"dependencies"`
	DevDependencies map[string]json.RawMessage `json:"devDependencies"`
}

func detectJavaScript(root string, languages, frameworks stringSet) error {
	packagePath := filepath.Join(root, "package.json")
	if _, err := os.Stat(packagePath); err == nil {
		languages.add("javascript")
		data, err := os.ReadFile(packagePath)
		if err != nil {
			return fmt.Errorf("read package.json: %w", err)
		}
		var manifest packageManifest
		if err := json.Unmarshal(data, &manifest); err != nil {
			return fmt.Errorf("parse package.json: %w", err)
		}
		for dependency := range manifest.Dependencies {
			addJavaScriptFramework(dependency, frameworks)
		}
		for dependency := range manifest.DevDependencies {
			addJavaScriptFramework(dependency, frameworks)
		}
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("stat package.json: %w", err)
	}

	if _, err := os.Stat(filepath.Join(root, "tsconfig.json")); err == nil {
		languages.add("typescript")
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("stat tsconfig.json: %w", err)
	}
	return nil
}

func addJavaScriptFramework(dependency string, frameworks stringSet) {
	switch dependency {
	case "express":
		frameworks.add("express")
	case "fastify":
		frameworks.add("fastify")
	case "@nestjs/core":
		frameworks.add("nestjs")
	case "hono":
		frameworks.add("hono")
	}
}

func detectGo(root string, files []string, languages, frameworks stringSet) error {
	path := filepath.Join(root, "go.mod")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			data = nil
		} else {
			return fmt.Errorf("read go.mod: %w", err)
		}
	}
	if data != nil {
		languages.add("go")
		file, err := modfile.Parse(path, data, nil)
		if err != nil {
			return fmt.Errorf("parse go.mod: %w", err)
		}
		for _, require := range file.Require {
			switch require.Mod.Path {
			case "github.com/gin-gonic/gin":
				frameworks.add("gin")
			case "github.com/labstack/echo/v4":
				frameworks.add("echo")
			case "github.com/gofiber/fiber/v2":
				frameworks.add("fiber")
			case "github.com/go-chi/chi/v5":
				frameworks.add("chi")
			}
		}
	}
	// A source import is useful for small or incomplete projects that do not
	// have a usable go.mod yet. Syntax errors are deliberately ignored here;
	// extractors report those with source locations during discovery.
	for _, sourcePath := range files {
		if strings.ToLower(filepath.Ext(sourcePath)) != ".go" {
			continue
		}
		source, readErr := os.ReadFile(sourcePath)
		if readErr != nil {
			continue
		}
		parsed, _ := goparser.ParseFile(token.NewFileSet(), sourcePath, source, goparser.ImportsOnly)
		if parsed == nil {
			continue
		}
		for _, imported := range parsed.Imports {
			path, unquoteErr := strconv.Unquote(imported.Path.Value)
			if unquoteErr == nil && path == "github.com/gin-gonic/gin" {
				frameworks.add("gin")
			}
			if unquoteErr == nil && path == "github.com/labstack/echo/v4" {
				frameworks.add("echo")
			}
			if unquoteErr == nil && path == "github.com/gofiber/fiber/v2" {
				frameworks.add("fiber")
			}
		}
	}
	return nil
}

func detectPython(root string, files []string, languages, frameworks stringSet) error {
	for _, name := range []string{"requirements.txt", "Pipfile"} {
		path := filepath.Join(root, name)
		data, err := os.ReadFile(path)
		if err == nil {
			languages.add("python")
			if name == "requirements.txt" {
				for _, dependency := range parseRequirements(string(data)) {
					addPythonFramework(dependency, frameworks)
				}
			} else if err := parsePipfile(data, frameworks); err != nil {
				return fmt.Errorf("parse Pipfile: %w", err)
			}
		} else if !os.IsNotExist(err) {
			return fmt.Errorf("read %s: %w", name, err)
		}
	}

	path := filepath.Join(root, "pyproject.toml")
	data, err := os.ReadFile(path)
	if err == nil {
		languages.add("python")
		if err := parsePyproject(data, frameworks); err != nil {
			return fmt.Errorf("parse pyproject.toml: %w", err)
		}
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("read pyproject.toml: %w", err)
	}
	// Source imports cover small projects that do not yet have a dependency
	// manifest. This is framework detection only; route extraction remains AST-based.
	for _, sourcePath := range files {
		if strings.ToLower(filepath.Ext(sourcePath)) != ".py" {
			continue
		}
		source, readErr := os.ReadFile(sourcePath)
		if readErr != nil {
			continue
		}
		for _, line := range strings.Split(string(source), "\n") {
			line = strings.TrimSpace(line)
			if strings.HasPrefix(line, "import fastapi") || strings.HasPrefix(line, "from fastapi import") {
				frameworks.add("fastapi")
				languages.add("python")
				break
			}
		}
	}
	return nil
}

var requirementName = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._-]*`)

func parseRequirements(contents string) []string {
	dependencies := make([]string, 0)
	for _, line := range strings.Split(contents, "\n") {
		line = strings.TrimSpace(strings.SplitN(line, "#", 2)[0])
		if match := requirementName.FindString(line); match != "" {
			dependencies = append(dependencies, match)
		}
	}
	return dependencies
}

func parsePipfile(data []byte, frameworks stringSet) error {
	var manifest struct {
		Packages    map[string]toml.Primitive `toml:"packages"`
		DevPackages map[string]toml.Primitive `toml:"dev-packages"`
	}
	if _, err := toml.Decode(string(data), &manifest); err != nil {
		return err
	}
	for dependency := range manifest.Packages {
		addPythonFramework(dependency, frameworks)
	}
	for dependency := range manifest.DevPackages {
		addPythonFramework(dependency, frameworks)
	}
	return nil
}

func parsePyproject(data []byte, frameworks stringSet) error {
	var document map[string]interface{}
	if _, err := toml.Decode(string(data), &document); err != nil {
		return err
	}
	collectPythonDependencies(document, frameworks)
	return nil
}

func collectPythonDependencies(value interface{}, frameworks stringSet) {
	switch value := value.(type) {
	case map[string]interface{}:
		for key, child := range value {
			if key == "dependencies" || key == "optional-dependencies" || key == "dev-dependencies" {
				collectPythonDependencyValues(child, frameworks)
			}
			collectPythonDependencies(child, frameworks)
		}
	}
}

func collectPythonDependencyValues(value interface{}, frameworks stringSet) {
	switch value := value.(type) {
	case []string:
		for _, dependency := range value {
			if match := requirementName.FindString(strings.TrimSpace(dependency)); match != "" {
				addPythonFramework(match, frameworks)
			}
		}
	case map[string]interface{}:
		for dependency := range value {
			addPythonFramework(dependency, frameworks)
		}
	}
}

func addPythonFramework(dependency string, frameworks stringSet) {
	name := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(dependency), "_", "-"))
	name = strings.SplitN(name, "[", 2)[0]
	switch name {
	case "fastapi":
		frameworks.add("fastapi")
	case "flask":
		frameworks.add("flask")
	case "django":
		frameworks.add("django")
	case "django-rest-framework", "djangorestframework":
		frameworks.add("drf")
	}
}
