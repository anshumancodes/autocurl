// Package parser parses autocurl V1 request-file text.
package parser

import (
	"fmt"
	"strconv"
	"strings"
	"unicode"
)

// Document is a parsed autocurl request file.
type Document struct {
	Comments  []string
	Project   string
	Variables map[string]string
	Requests  []Request
}

// Request is one numbered request block.
type Request struct {
	Number  int
	Title   string
	Method  string
	URL     string
	Headers map[string]string
	Source  *Source
	Body    string
	HasBody bool
}

// Source identifies the source location recorded for a request.
type Source struct {
	File string
	Line int
}

// ParseError identifies the line at which parsing failed.
type ParseError struct {
	Line    int
	Message string
}

func (e *ParseError) Error() string { return fmt.Sprintf("line %d: %s", e.Line, e.Message) }

// Parse parses autocurl V1 content without executing or resolving it.
func Parse(content string) (Document, error) {
	content = strings.ReplaceAll(content, "\r\n", "\n")
	content = strings.ReplaceAll(content, "\r", "\n")
	lines := strings.Split(content, "\n")
	doc := Document{Variables: make(map[string]string)}
	seenNumbers := make(map[int]bool)

	for i := 0; i < len(lines); {
		line := lines[i]
		if strings.TrimSpace(line) == "" {
			i++
			continue
		}
		if isSeparator(line) {
			req, next, err := parseRequest(lines, i, seenNumbers)
			if err != nil {
				return Document{}, err
			}
			doc.Requests = append(doc.Requests, req)
			i = next
			continue
		}
		if strings.HasPrefix(line, "#") {
			if strings.HasPrefix(line, "# Project:") {
				if doc.Project != "" {
					return Document{}, parseErr(i+1, "duplicate project metadata")
				}
				doc.Project = strings.TrimSpace(strings.TrimPrefix(line, "# Project:"))
				if doc.Project == "" {
					return Document{}, parseErr(i+1, "project metadata must not be empty")
				}
			} else {
				doc.Comments = append(doc.Comments, line)
			}
			i++
			continue
		}
		if strings.HasPrefix(line, "@") {
			name, value, ok := parseVariable(line)
			if !ok {
				return Document{}, parseErr(i+1, "invalid variable declaration")
			}
			if _, exists := doc.Variables[name]; exists {
				return Document{}, parseErr(i+1, "duplicate variable %q", name)
			}
			doc.Variables[name] = value
			i++
			continue
		}
		return Document{}, parseErr(i+1, "unexpected content outside request block")
	}
	return doc, nil
}

func parseRequest(lines []string, start int, seen map[int]bool) (Request, int, error) {
	number, title, ok := parseSeparator(lines[start])
	if !ok {
		return Request{}, start, parseErr(start+1, "invalid request separator")
	}
	if seen[number] {
		return Request{}, start, parseErr(start+1, "duplicate request number %d", number)
	}
	seen[number] = true
	req := Request{Number: number, Title: title, Headers: make(map[string]string)}
	i := start + 1
	for i < len(lines) && strings.TrimSpace(lines[i]) == "" {
		i++
	}
	if i < len(lines) && strings.HasPrefix(lines[i], "# @source") {
		source, ok := parseSource(lines[i])
		if !ok {
			return Request{}, i, parseErr(i+1, "invalid source metadata")
		}
		req.Source = &source
		i++
	}
	for i < len(lines) && strings.TrimSpace(lines[i]) == "" {
		i++
	}
	if i >= len(lines) || isSeparator(lines[i]) {
		return Request{}, i, parseErr(start+1, "request is missing a method and URL")
	}
	method, rawURL, ok := parseRequestLine(lines[i])
	if !ok {
		return Request{}, i, parseErr(i+1, "invalid request line; expected METHOD URL")
	}
	req.Method, req.URL = method, rawURL
	i++
	for i < len(lines) {
		if isSeparator(lines[i]) {
			return req, i, nil
		}
		if strings.TrimSpace(lines[i]) == "" {
			bodyStart := i + 1
			bodyEnd := bodyStart
			for bodyEnd < len(lines) && !isSeparator(lines[bodyEnd]) {
				bodyEnd++
			}
			bodyLines := lines[bodyStart:bodyEnd]
			for len(bodyLines) > 0 && bodyLines[len(bodyLines)-1] == "" {
				bodyLines = bodyLines[:len(bodyLines)-1]
			}
			if len(bodyLines) > 0 {
				req.HasBody = true
				req.Body = strings.Join(bodyLines, "\n")
			}
			return req, bodyEnd, nil
		}
		name, value, ok := parseHeader(lines[i])
		if !ok {
			return Request{}, i, parseErr(i+1, "malformed header; expected Name: value")
		}
		if _, exists := req.Headers[name]; exists {
			return Request{}, i, parseErr(i+1, "duplicate header %q", name)
		}
		req.Headers[name] = value
		i++
	}
	return req, i, nil
}

func parseSeparator(line string) (int, string, bool) {
	if !strings.HasPrefix(line, "### ") {
		return 0, "", false
	}
	rest := strings.TrimPrefix(line, "### ")
	dot := strings.Index(rest, ". ")
	if dot <= 0 || dot+2 >= len(rest) {
		return 0, "", false
	}
	number, err := strconv.Atoi(rest[:dot])
	if err != nil || number <= 0 || strings.TrimSpace(rest[dot+2:]) == "" {
		return 0, "", false
	}
	return number, rest[dot+2:], true
}

func isSeparator(line string) bool { return strings.HasPrefix(line, "###") }

func parseVariable(line string) (string, string, bool) {
	equal := strings.IndexByte(line, '=')
	if equal <= 1 || !strings.HasPrefix(line, "@") {
		return "", "", false
	}
	name := strings.TrimSpace(line[1:equal])
	value := strings.TrimSpace(line[equal+1:])
	if !validName(name) || value == "" || strings.ContainsAny(value, "\r\n") {
		return "", "", false
	}
	return name, value, true
}

func parseRequestLine(line string) (string, string, bool) {
	parts := strings.Fields(line)
	if len(parts) != 2 || !validMethod(parts[0]) || strings.ContainsAny(parts[1], "\r\n") {
		return "", "", false
	}
	return parts[0], parts[1], true
}

func parseHeader(line string) (string, string, bool) {
	colon := strings.IndexByte(line, ':')
	if colon <= 0 {
		return "", "", false
	}
	name := strings.TrimSpace(line[:colon])
	if !validToken(name) {
		return "", "", false
	}
	return name, strings.TrimSpace(line[colon+1:]), true
}

func parseSource(line string) (Source, bool) {
	const prefix = "# @source "
	if !strings.HasPrefix(line, prefix) {
		return Source{}, false
	}
	raw := strings.TrimSpace(strings.TrimPrefix(line, prefix))
	if raw == "" || strings.ContainsAny(raw, "\r\n") {
		return Source{}, false
	}
	source := Source{File: raw}
	lastColon := strings.LastIndexByte(raw, ':')
	if lastColon >= 0 {
		lineNumber, err := strconv.Atoi(raw[lastColon+1:])
		if err != nil || lineNumber <= 0 || lastColon == 0 {
			return Source{}, false
		}
		source.File = raw[:lastColon]
		source.Line = lineNumber
	}
	return source, true
}

func validName(name string) bool { return validToken(name) }

func validMethod(method string) bool { return validToken(method) }

func validToken(value string) bool {
	if value == "" {
		return false
	}
	for _, r := range value {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || strings.ContainsRune("!#$%&'*+-.^_`|~", r) {
			continue
		}
		return false
	}
	return true
}

func parseErr(line int, format string, args ...any) error {
	return &ParseError{Line: line, Message: fmt.Sprintf(format, args...)}
}
