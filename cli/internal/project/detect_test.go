package project

import (
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestDetectValidationAndEmptyProject(t *testing.T) {
	if _, err := Detect("   "); !errors.Is(err, ErrEmptyRoot) {
		t.Fatalf("empty root error = %v, want %v", err, ErrEmptyRoot)
	}
	root := t.TempDir()
	if _, err := Detect(filepath.Join(root, "missing")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("missing root error = %v, want a not-exist error", err)
	}
	file := filepath.Join(root, "file.go")
	writeFile(t, file, "package main")
	if _, err := Detect(file); !errors.Is(err, ErrInvalidDir) {
		t.Fatalf("file root error = %v, want %v", err, ErrInvalidDir)
	}
	root = t.TempDir()
	result, err := Detect(root)
	if err != nil {
		t.Fatalf("empty project error = %v", err)
	}
	if !reflect.DeepEqual(result, DetectionResult{Languages: []string{}, Frameworks: []string{}}) {
		t.Fatalf("empty project result = %#v", result)
	}
}

func TestDetectJavaScriptFrameworksAndTypeScript(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "package.json"), `{
  "dependencies": {"express": "1", "@nestjs/core": "1", "hono": "1"},
  "devDependencies": {"fastify": "1", "express": "2", "not-express-like": "1"}
}`)
	writeFile(t, filepath.Join(root, "tsconfig.json"), "{}")
	writeFile(t, filepath.Join(root, "src", "main.ts"), "export {}")

	result, err := Detect(root)
	if err != nil {
		t.Fatal(err)
	}
	want := DetectionResult{
		Languages:  []string{"javascript", "typescript"},
		Frameworks: []string{"express", "fastify", "hono", "nestjs"},
	}
	if !reflect.DeepEqual(result, want) {
		t.Fatalf("Detect() = %#v, want %#v", result, want)
	}
}

func TestDetectGoFrameworks(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "go.mod"), `module example.com/app

go 1.23

require (
	github.com/gin-gonic/gin v1.10.0
	github.com/labstack/echo/v4 v4.13.0
	github.com/go-chi/chi/v5 v5.2.0
)`)
	result, err := Detect(root)
	if err != nil {
		t.Fatal(err)
	}
	want := DetectionResult{Languages: []string{"go"}, Frameworks: []string{"chi", "echo", "gin"}}
	if !reflect.DeepEqual(result, want) {
		t.Fatalf("Detect() = %#v, want %#v", result, want)
	}
}

func TestDetectPythonFrameworks(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "requirements.txt"), "fastapi>=1\nFlask==2\nDjango\ndjangorestframework\n# not-a-framework\n")
	writeFile(t, filepath.Join(root, "pyproject.toml"), `[project]
dependencies = ["fastapi>=1", "flask"]

[tool.poetry.dependencies]
python = "^3.12"
django = "^5"
`)
	writeFile(t, filepath.Join(root, "Pipfile"), `[[source]]
name = "pypi"
url = "https://pypi.org/simple"
verify_ssl = true

[packages]
flask = "*"

[dev-packages]
django = "*"
`)
	writeFile(t, filepath.Join(root, "app.py"), "print('ok')")

	result, err := Detect(root)
	if err != nil {
		t.Fatal(err)
	}
	want := DetectionResult{Languages: []string{"python"}, Frameworks: []string{"django", "drf", "fastapi", "flask"}}
	if !reflect.DeepEqual(result, want) {
		t.Fatalf("Detect() = %#v, want %#v", result, want)
	}
}

func TestDetectMixedLanguagesAndManifestFreeSources(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "main.go"), "package main")
	writeFile(t, filepath.Join(root, "service.py"), "print('ok')")
	writeFile(t, filepath.Join(root, "client.js"), "console.log('ok')")

	result, err := Detect(root)
	if err != nil {
		t.Fatal(err)
	}
	want := DetectionResult{Languages: []string{"go", "javascript", "python"}, Frameworks: []string{}}
	if !reflect.DeepEqual(result, want) {
		t.Fatalf("Detect() = %#v, want %#v", result, want)
	}
}

func TestDetectMalformedManifestReturnsWrappedError(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "package.json"), `{not json}`)
	if _, err := Detect(root); err == nil {
		t.Fatal("Detect() error = nil, want malformed manifest error")
	}

	root = t.TempDir()
	writeFile(t, filepath.Join(root, "pyproject.toml"), "[project\n")
	if _, err := Detect(root); err == nil {
		t.Fatal("Detect() error = nil, want malformed TOML error")
	}
}
