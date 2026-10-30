// Package commands contains the CLI orchestration behind the autocurl binary.
package commands

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/anshumancodes/autocurl/internal/ai"
	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/executor"
	"github.com/anshumancodes/autocurl/internal/extractors/django"
	"github.com/anshumancodes/autocurl/internal/extractors/echo"
	"github.com/anshumancodes/autocurl/internal/extractors/express"
	"github.com/anshumancodes/autocurl/internal/extractors/fastapi"
	"github.com/anshumancodes/autocurl/internal/extractors/fiber"
	"github.com/anshumancodes/autocurl/internal/extractors/flask"
	"github.com/anshumancodes/autocurl/internal/extractors/gin"
	"github.com/anshumancodes/autocurl/internal/extractors/nestjs"
	"github.com/anshumancodes/autocurl/internal/extractors/nethttp"
	"github.com/anshumancodes/autocurl/internal/generator"
	"github.com/anshumancodes/autocurl/internal/interactive"
	"github.com/anshumancodes/autocurl/internal/parser"
	"github.com/anshumancodes/autocurl/internal/project"
)

// Config supplies the streams and optional HTTP client used by a command.
type Config struct {
	In         io.Reader
	Out        io.Writer
	Client     executor.HTTPClient
	AIMode     discovery.AIMode
	AIProvider discovery.AIProvider
}

// Run routes one CLI argument to project generation or existing-file
// execution. It returns errors for main to report and choose an exit status.
func Run(args []string, config Config) error {
	if config.In == nil {
		config.In = strings.NewReader("")
	}
	if config.Out == nil {
		config.Out = io.Discard
	}
	if len(args) == 1 && (args[0] == "--help" || args[0] == "-h") {
		fmt.Fprintln(config.Out, "Usage: autocurl [--ai=off|auto|always] <project-directory|source-file|file.autocurl>")
		fmt.Fprintln(config.Out, "       autocurl --version")
		fmt.Fprintln(config.Out, "")
		fmt.Fprintln(config.Out, "Generate .autocurl requests from a project or source file, or execute an existing file.")
		fmt.Fprintln(config.Out, "AI modes: off (default, local only), auto (when more analysis is needed), always (Gemini).")
		fmt.Fprintln(config.Out, "Set GEMINI_API_KEY in your environment to use Gemini AI analysis.")
		return nil
	}
	path, mode, err := parseArgs(args, config.AIMode)
	if err != nil {
		return err
	}
	info, err := os.Stat(path)
	if err != nil {
		return fmt.Errorf("stat %s: %w", path, err)
	}
	if info.IsDir() {
		provider := config.AIProvider
		if provider == nil && mode != discovery.AIModeOff {
			provider = ai.NewGeminiFromEnv()
		}
		return generateProject(path, config.Out, mode, provider)
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("%s is not a regular file or directory", path)
	}
	if strings.EqualFold(filepath.Ext(path), ".autocurl") {
		return executeFile(path, config)
	}
	switch strings.ToLower(filepath.Ext(path)) {
	case ".js", ".ts", ".py", ".go":
	default:
		return fmt.Errorf("unsupported source file %s", path)
	}
	provider := config.AIProvider
	if provider == nil && mode != discovery.AIModeOff {
		provider = ai.NewGeminiFromEnv()
	}
	return generateProject(path, config.Out, mode, provider)
}

func parseArgs(args []string, configured discovery.AIMode) (string, discovery.AIMode, error) {
	mode := configured
	if mode == "" {
		mode = discovery.AIMode(strings.ToLower(strings.TrimSpace(os.Getenv("AUTOCURL_AI"))))
	}
	if mode == "" {
		mode = discovery.AIModeOff
	}
	if !validAIMode(mode) {
		return "", "", fmt.Errorf("invalid AI mode %q; expected off, auto or always", mode)
	}
	paths := make([]string, 0, 1)
	for _, arg := range args {
		if strings.HasPrefix(arg, "--ai=") {
			mode = discovery.AIMode(strings.ToLower(strings.TrimPrefix(arg, "--ai=")))
			if !validAIMode(mode) {
				return "", "", fmt.Errorf("invalid AI mode %q; expected off, auto or always", mode)
			}
			continue
		}
		if strings.HasPrefix(arg, "--") {
			return "", "", fmt.Errorf("unknown option %s", arg)
		}
		paths = append(paths, arg)
	}
	if len(paths) != 1 {
		return "", "", errors.New("usage: autocurl [--ai=off|auto|always] <project-directory|source-file|file.autocurl>")
	}
	return paths[0], mode, nil
}

func validAIMode(mode discovery.AIMode) bool {
	return mode == discovery.AIModeOff || mode == discovery.AIModeAuto || mode == discovery.AIModeAlways
}

func generateProject(rawRoot string, out io.Writer, mode discovery.AIMode, provider discovery.AIProvider) error {
	scope, err := project.ResolveScope(rawRoot)
	if err != nil {
		return fmt.Errorf("resolve scope %s: %w", rawRoot, err)
	}
	root := scope.Root
	outputFilename := outputName(root, scope)
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

	scan, err := project.Scan(root, project.ScanOptions{})
	if err != nil {
		return fmt.Errorf("scan project context: %w", err)
	}
	result, err := discovery.Discover(root, discovery.DiscoverOptions{
		Extractors: []discovery.Extractor{
			express.New(),
			fastapi.New(),
			flask.New(),
			django.New(),
			gin.New(),
			echo.New(),
			fiber.New(),
			nethttp.New(),
			nestjs.New(),
		},
		AIMode: mode, AIProvider: provider,
		RouteFilter:    scopeFilter(scope),
		AIContextFiles: scopedFiles(scan.Files, scope),
	})
	if err != nil {
		return err
	}
	for _, warning := range result.Warnings {
		fmt.Fprintf(out, "Warning: %s\n", warning)
	}
	for _, message := range result.Errors {
		fmt.Fprintf(out, "AI: %s\n", message)
	}
	if len(result.Errors) > 0 {
		return errors.New(result.Errors[0])
	}
	if len(result.Routes) == 0 {
		if len(result.Errors) > 0 {
			return errors.New(result.Errors[0])
		}
		return fmt.Errorf("no routes discovered; no %s was generated", outputFilename)
	}
	fmt.Fprintf(out, "Discovered %d routes.\n", len(result.Routes))

	content, err := generator.Generate(result.Routes, generator.Options{
		ProjectName: projectName(root),
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

func scopeFilter(scope project.Scope) func(discovery.Route) bool {
	return func(route discovery.Route) bool {
		if route.Source.File == "" {
			return false
		}
		file := route.Source.File
		if !filepath.IsAbs(file) {
			file = filepath.Join(scope.Root, file)
		}
		file, err := filepath.Abs(file)
		if err != nil {
			return false
		}
		if scope.IsFile {
			return filepath.Clean(file) == filepath.Clean(scope.Target)
		}
		rel, err := filepath.Rel(scope.Target, file)
		return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
	}
}

func scopedFiles(files []string, scope project.Scope) []string {
	filter := scopeFilter(scope)
	selected := make([]string, 0)
	for _, file := range files {
		if filter(discovery.Route{Source: discovery.SourceLocation{File: file}}) {
			selected = append(selected, file)
		}
	}
	return selected
}

func outputName(root string, scope project.Scope) string {
	name := projectName(root)
	if filepath.Clean(scope.Target) != filepath.Clean(root) {
		module := moduleName(root, scope.Target, scope.IsFile)
		if module != "" {
			name += "." + module
		}
	}
	return name + ".autocurl"
}

func moduleName(root, target string, isFile bool) string {
	if isFile {
		target = filepath.Dir(target)
	}
	rel, err := filepath.Rel(root, target)
	if err != nil || rel == "." || strings.HasPrefix(rel, "..") {
		if isFile {
			return safeName(strings.TrimSuffix(filepath.Base(target), filepath.Ext(target)))
		}
		return ""
	}
	parts := strings.Split(filepath.ToSlash(rel), "/")
	start := 0
	for i, part := range parts {
		if strings.EqualFold(part, "modules") {
			start = i + 1
		}
	}
	if start == len(parts) {
		start = 0
	}
	if isFile && len(parts) > 0 {
		// A file directly under the project gets its stem as its module name.
		if relDir, _ := filepath.Rel(root, filepath.Dir(target)); relDir == "." {
			parts = []string{modulePart(strings.TrimSuffix(filepath.Base(target), filepath.Ext(target)))}
		}
	}
	parts = parts[start:]
	for i := range parts {
		parts[i] = modulePart(parts[i])
	}
	parts = compact(parts)
	return strings.Join(parts, ".")
}

func modulePart(raw string) string {
	for _, suffix := range []string{".routes", ".controller", ".module", ".handler", ".api"} {
		if strings.HasSuffix(strings.ToLower(raw), suffix) {
			raw = raw[:len(raw)-len(suffix)]
			break
		}
	}
	return safeName(raw)
}

func compact(values []string) []string {
	result := values[:0]
	for _, value := range values {
		if value != "" {
			result = append(result, value)
		}
	}
	return result
}

func safeName(raw string) string {
	raw = strings.ToLower(raw)
	var b strings.Builder
	for _, r := range raw {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			b.WriteRune(r)
		} else {
			b.WriteByte('-')
		}
	}
	return strings.Trim(b.String(), "-_")
}

func projectName(root string) string {
	packagePath := filepath.Join(root, "package.json")
	if data, err := os.ReadFile(packagePath); err == nil {
		var manifest struct {
			Name string `json:"name"`
		}
		if json.Unmarshal(data, &manifest) == nil && safeName(manifest.Name) != "" {
			return safeName(manifest.Name)
		}
	}
	if data, err := os.ReadFile(filepath.Join(root, "go.mod")); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			fields := strings.Fields(line)
			if len(fields) == 2 && fields[0] == "module" {
				parts := strings.Split(strings.TrimSuffix(fields[1], "/"), "/")
				if name := safeName(parts[len(parts)-1]); name != "" {
					return name
				}
			}
		}
	}
	return safeName(filepath.Base(root))
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
