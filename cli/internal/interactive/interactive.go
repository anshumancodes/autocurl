// Package interactive provides the small terminal flow for autocurl files.
package interactive

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/anshumancodes/autocurl/internal/executor"
	"github.com/anshumancodes/autocurl/internal/parser"
)

var (
	ErrCancelled = errors.New("interactive execution cancelled")
	ErrEOF       = errors.New("input ended before request selection")
)

// Config controls terminal input/output and execution.
type Config struct {
	In               io.Reader
	Out              io.Writer
	Client           executor.HTTPClient
	MaxResponseBytes int64
}

// Run displays doc, prompts for a request and any missing values, then executes it.
func Run(doc parser.Document, config Config) error {
	if len(doc.Requests) == 0 {
		return errors.New("document contains no requests")
	}
	if config.In == nil {
		config.In = strings.NewReader("")
	}
	if config.Out == nil {
		config.Out = io.Discard
	}
	input := bufio.NewReader(config.In)
	for _, request := range doc.Requests {
		fmt.Fprintf(config.Out, "%d. %s %s\n", request.Number, request.Method, displayURL(request))
	}
	fmt.Fprint(config.Out, "Select request: ")
	line, err := input.ReadString('\n')
	if err != nil && !errors.Is(err, io.EOF) {
		return err
	}
	if strings.TrimSpace(line) == "" {
		if errors.Is(err, io.EOF) {
			return ErrEOF
		}
		return ErrCancelled
	}
	number, parseErr := strconv.Atoi(strings.TrimSpace(line))
	if parseErr != nil {
		return fmt.Errorf("invalid request selection %q", strings.TrimSpace(line))
	}
	request, ok := requestByNumber(doc.Requests, number)
	if !ok {
		return fmt.Errorf("invalid request selection %d", number)
	}

	variables := cloneVariables(doc.Variables)
	for {
		_, resolveErr := executor.Resolve(request, variables)
		if resolveErr == nil {
			break
		}
		var missing *executor.MissingVariablesError
		if !errors.As(resolveErr, &missing) {
			return resolveErr
		}
		for _, name := range missing.Names {
			fmt.Fprintf(config.Out, "Enter value for %s: ", name)
			value, readErr := input.ReadString('\n')
			if readErr != nil && !errors.Is(readErr, io.EOF) {
				return readErr
			}
			value = strings.TrimSuffix(strings.TrimSuffix(value, "\n"), "\r")
			if errors.Is(readErr, io.EOF) && value == "" {
				return ErrEOF
			}
			if strings.TrimSpace(value) == "" {
				return fmt.Errorf("value for %s must not be empty", name)
			}
			variables[name] = value
		}
	}

	result, err := executor.Execute(request, variables, config.Client)
	if err != nil {
		return err
	}
	return DisplayResponse(config.Out, result)
}

// DisplayResponse writes a concise, safe response summary. Authorization headers
// and other sensitive request metadata are never displayed by this package.
func DisplayResponse(out io.Writer, result executor.Result) error {
	fmt.Fprintf(out, "\n%s %s\nHTTP %s\nDuration: %s\n", result.Method, result.URL, result.Status, result.Duration.Round(1e6))
	if result.Body == "" {
		fmt.Fprintln(out, "Response body: <empty>")
		return nil
	}
	body := result.Body
	var value any
	if json.Unmarshal([]byte(body), &value) == nil {
		pretty, err := json.MarshalIndent(value, "", "  ")
		if err == nil {
			body = string(pretty)
		}
	}
	fmt.Fprintf(out, "Response body:\n%s\n", body)
	return nil
}

func requestByNumber(requests []parser.Request, number int) (parser.Request, bool) {
	for _, request := range requests {
		if request.Number == number {
			return request, true
		}
	}
	return parser.Request{}, false
}

func cloneVariables(values map[string]string) map[string]string {
	clone := make(map[string]string, len(values))
	for name, value := range values {
		clone[name] = value
	}
	return clone
}

func displayURL(request parser.Request) string {
	if request.Title != "" {
		parts := strings.SplitN(request.Title, " ", 2)
		if len(parts) == 2 {
			return parts[1]
		}
	}
	return request.URL
}
