package project

import (
	"errors"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

var ignoredDirectories = map[string]struct{}{
	".git":         {},
	"node_modules": {},
	"vendor":       {},
	"dist":         {},
	"build":        {},
	".next":        {},
	".nuxt":        {},
	".turbo":       {},
	"venv":         {},
	"__pycache__":  {},
	"coverage":     {},
	"utils":        {},
}

var allowedExtensions = map[string]struct{}{
	".js": {},
	".ts": {},
	".py": {},
	".go": {},
}

// these will be passed to the Scan function
// Whether hidden files and directories should be considered
// Whether Git ignore rules should be applied
// Maximum allowed source file size in bytes (by default i have kept it as 1mb)
type ScanOptions struct {
	IncludeHidden    bool
	RespectGitignore bool
	MaxFileSize      int64
}

// root folder
// Files
// will return absolute paths so that the consumer functions downstream will have it easier to process
type ScanResult struct {
	Root  string
	Files []string
}

// errors
var ErrEmptyRoot = errors.New("project root cannot be empty")
var ErrInvalidDir = errors.New("project root cannot be empty")
var FailedToResolve = errors.New("Failed to Resolve file path")

// the scanner is deterministic: the same project and options should/will produce the same ordered results,
// assuming that that filesystem doesn't change.
func Scan(root string, options ScanOptions) (ScanResult, error) {

	// Validate input
	validInput := strings.TrimSpace(root)

	if validInput == "" {
		return ScanResult{}, ErrEmptyRoot
	}

	//  Resolve absolute path
	absolutePath, err := filepath.Abs(validInput)

	if err != nil {
		return ScanResult{}, FailedToResolve
	}

	// get file metadata
	fileMetadata, err := os.Stat(absolutePath)

	if err != nil {
		return ScanResult{}, err
	}

	// Ensure root is a directory
	if !fileMetadata.IsDir() {
		return ScanResult{}, ErrInvalidDir
	}

	files := make([]string, 0)
	err = filepath.WalkDir(absolutePath, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		name := entry.Name()
		if entry.IsDir() {
			if path != absolutePath && (isIgnoredDirectory(name) || (!options.IncludeHidden && isHidden(name))) {
				return filepath.SkipDir
			}
			return nil
		}

		// WalkDir does not follow directory symlinks, but symlinked files still
		// need to be excluded explicitly.
		if entry.Type()&os.ModeSymlink != 0 || !entry.Type().IsRegular() {
			return nil
		}
		if !options.IncludeHidden && isHidden(name) {
			return nil
		}
		if _, ok := allowedExtensions[strings.ToLower(filepath.Ext(name))]; !ok {
			return nil
		}

		if options.MaxFileSize > 0 {
			info, infoErr := entry.Info()
			if infoErr != nil {
				return infoErr
			}
			if info.Size() > options.MaxFileSize {
				return nil
			}
		}

		files = append(files, path)
		return nil
	})
	if err != nil {
		return ScanResult{}, err
	}

	sort.Strings(files)
	return ScanResult{Root: absolutePath, Files: files}, nil
}

func isIgnoredDirectory(name string) bool {
	_, ignored := ignoredDirectories[name]
	return ignored
}

func isHidden(name string) bool {
	return strings.HasPrefix(name, ".") && name != "." && name != ".."
}
