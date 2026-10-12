package project

import (
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"testing"
)

func TestScanCollectsEligibleFiles(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, "z.ts"), "source")
	writeFile(t, filepath.Join(root, "a.go"), "source")
	writeFile(t, filepath.Join(root, "README.md"), "not source")
	writeFile(t, filepath.Join(root, "nested", "file.py"), "source")

	result, err := Scan(root, ScanOptions{})
	if err != nil {
		t.Fatalf("Scan() error = %v", err)
	}

	want := []string{
		filepath.Join(root, "a.go"),
		filepath.Join(root, "nested", "file.py"),
		filepath.Join(root, "z.ts"),
	}
	if !reflect.DeepEqual(result.Files, want) {
		t.Fatalf("Scan() files = %v, want %v", result.Files, want)
	}
	if result.Root != root {
		t.Fatalf("Scan() root = %q, want %q", result.Root, root)
	}
}

func TestScanExcludesIgnoredDirectoriesAndUnsupportedFiles(t *testing.T) {
	root := t.TempDir()
	for _, directory := range []string{".git", "node_modules", "vendor", "dist", "build", ".next", ".nuxt", ".turbo", "venv", "__pycache__", "coverage", "utils"} {
		writeFile(t, filepath.Join(root, directory, "ignored.go"), "ignored")
	}
	writeFile(t, filepath.Join(root, "included.js"), "included")

	result, err := Scan(root, ScanOptions{})
	if err != nil {
		t.Fatalf("Scan() error = %v", err)
	}
	want := []string{filepath.Join(root, "included.js")}
	if !reflect.DeepEqual(result.Files, want) {
		t.Fatalf("Scan() files = %v, want %v", result.Files, want)
	}
}

func TestScanHiddenAndSizeOptions(t *testing.T) {
	root := t.TempDir()
	writeFile(t, filepath.Join(root, ".hidden.go"), "hidden")
	writeFile(t, filepath.Join(root, ".hidden-dir", "nested.go"), "hidden")
	writeFile(t, filepath.Join(root, "small.go"), "small")
	writeFile(t, filepath.Join(root, "large.go"), "larger than the limit")

	result, err := Scan(root, ScanOptions{MaxFileSize: int64(len("small"))})
	if err != nil {
		t.Fatalf("Scan() error = %v", err)
	}
	want := []string{filepath.Join(root, "small.go")}
	if !reflect.DeepEqual(result.Files, want) {
		t.Fatalf("Scan() files = %v, want %v", result.Files, want)
	}

	result, err = Scan(root, ScanOptions{IncludeHidden: true})
	if err != nil {
		t.Fatalf("Scan() with hidden files error = %v", err)
	}
	if !contains(result.Files, filepath.Join(root, ".hidden.go")) || !contains(result.Files, filepath.Join(root, ".hidden-dir", "nested.go")) {
		t.Fatalf("Scan() with hidden files = %v", result.Files)
	}
}

func TestScanExcludesSymlinksAndNonRegularFiles(t *testing.T) {
	root := t.TempDir()
	regular := filepath.Join(root, "regular.go")
	writeFile(t, regular, "source")
	if err := os.Symlink(regular, filepath.Join(root, "link.go")); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(root, "directory.go"), 0o755); err != nil {
		t.Fatal(err)
	}

	result, err := Scan(root, ScanOptions{})
	if err != nil {
		t.Fatalf("Scan() error = %v", err)
	}
	want := []string{regular}
	if !reflect.DeepEqual(result.Files, want) {
		t.Fatalf("Scan() files = %v, want %v", result.Files, want)
	}
}

func TestScanValidationErrors(t *testing.T) {
	if _, err := Scan("   ", ScanOptions{}); !errors.Is(err, ErrEmptyRoot) {
		t.Fatalf("empty root error = %v, want %v", err, ErrEmptyRoot)
	}

	root := t.TempDir()
	file := filepath.Join(root, "file.go")
	writeFile(t, file, "source")
	if _, err := Scan(file, ScanOptions{}); !errors.Is(err, ErrInvalidDir) {
		t.Fatalf("file root error = %v, want %v", err, ErrInvalidDir)
	}
	if _, err := Scan(filepath.Join(root, "missing"), ScanOptions{}); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("missing root error = %v, want a not-exist error", err)
	}
}

func TestScanResultIsDeterministic(t *testing.T) {
	root := t.TempDir()
	for _, name := range []string{"c.go", "a.go", "b.go"} {
		writeFile(t, filepath.Join(root, name), "source")
	}

	first, err := Scan(root, ScanOptions{})
	if err != nil {
		t.Fatal(err)
	}
	second, err := Scan(root, ScanOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(first, second) || !sort.StringsAreSorted(first.Files) {
		t.Fatalf("results are not deterministic: first=%v second=%v", first, second)
	}
}

func writeFile(t *testing.T, path, contents string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatal(err)
	}
}

func contains(values []string, wanted string) bool {
	for _, value := range values {
		if value == wanted {
			return true
		}
	}
	return false
}
