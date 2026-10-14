// Package commands contains the CLI orchestration behind the autocurl binary.
package commands

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/executor"
	"github.com/anshumancodes/autocurl/internal/extractors/express"
	"github.com/anshumancodes/autocurl/internal/extractors/nestjs"
	"github.com/anshumancodes/autocurl/internal/generator"
	"github.com/anshumancodes/autocurl/internal/interactive"
	"github.com/anshumancodes/autocurl/internal/parser"
	"github.com/anshumancodes/autocurl/internal/project"
)

const outputFilename = "index.autocurl"

// Config supplies the streams and optional HTTP client used by a command.
type Config struct {
	In     io.Reader
	Out    io.Writer
	Client executor.HTTPClient
}

// Run routes one CLI argument to project generation or existing-file
// execution. It returns errors for main to report and choose an exit status.
func Run(args []string, config Config) error {
	if len(args) != 1 {
		return errors.New("usage: autocurl <project-directory|file.autocurl>")
	}
	if config.In == nil {
		config.In = strings.NewReader("")
	}
	if config.Out == nil {
		config.Out = io.Discard
	}

	info, err := os.Stat(args[0])
	if err != nil {
		return fmt.Errorf("stat %s: %w", args[0], err)
	}
	if info.IsDir() {
		return generateProject(args[0], config.Out)
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("%s is not a regular file or directory", args[0])
	}
	if !strings.EqualFold(filepath.Ext(args[0]), ".autocurl") {
		return fmt.Errorf("source-file generation is not supported for %s; pass a project directory instead", args[0])
	}
	return executeFile(args[0], config)
}

func generateProject(rawRoot string, out io.Writer) error {
	root, err := filepath.Abs(rawRoot)
	if err != nil {
		return fmt.Errorf("resolve project directory %s: %w", rawRoot, err)
	}
	outputPath := filepath.Join(root, outputFilename)
	if _, err := os.Stat(outputPath); err == nil {
		return fmt.Errorf("%s already exists; rename or remove it before regenerating", outputFilename)
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("check generated output %s: %w", outputPath, err)
	}

	detection, err := project.Detect(root)
	if err != nil {
		return fmt.Errorf("detect project: %w", err)
	}
	fmt.Fprintln(out, "Scanning project...")
	fmt.Fprintf(out, "\n%s.\n", frameworkSummary(detection.Frameworks))

	result, err := discovery.Discover(root, discovery.DiscoverOptions{
		Extractors: []discovery.Extractor{
			express.New(),
			nestjs.New(),
		},
	})
	if err != nil {
		return err
	}
	for _, warning := range result.Warnings {
		fmt.Fprintf(out, "Warning: %s\n", warning)
	}
	if len(result.Routes) == 0 {
		return errors.New("no routes discovered; no index.autocurl was generated")
	}
	fmt.Fprintf(out, "Discovered %d routes.\n", len(result.Routes))

	content, err := generator.Generate(result.Routes, generator.Options{
		ProjectName: filepath.Base(root),
		ProjectRoot: root,
	})
	if err != nil {
		return fmt.Errorf("generate %s: %w", outputFilename, err)
	}
	if err := os.WriteFile(outputPath, []byte(content), 0o644); err != nil {
		return fmt.Errorf("write %s: %w", outputPath, err)
	}
	fmt.Fprintf(out, "\nGenerated: %s\n", outputFilename)
	return nil
}

func executeFile(path string, config Config) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read %s: %w", path, err)
	}
	doc, err := parser.Parse(string(content))
	if err != nil {
		return fmt.Errorf("parse %s: %w", path, err)
	}
	if err := interactive.Run(doc, interactive.Config{In: config.In, Out: config.Out, Client: config.Client}); err != nil {
		return fmt.Errorf("execute %s: %w", path, err)
	}
	return nil
}

func frameworkSummary(frameworks []string) string {
	if len(frameworks) == 0 {
		return "Framework: none detected"
	}
	values := append([]string(nil), frameworks...)
	sort.Strings(values)
	for i, value := range values {
		switch strings.ToLower(value) {
		case "nestjs":
			values[i] = "NestJS"
		default:
			if value != "" {
				values[i] = strings.ToUpper(value[:1]) + value[1:]
			}
		}
	}
	if len(values) == 1 {
		return "Framework: " + values[0]
	}
	return "Frameworks: " + strings.Join(values, ", ")
}
