package parser_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/extractors/express"
	"github.com/anshumancodes/autocurl/internal/extractors/nestjs"
	"github.com/anshumancodes/autocurl/internal/generator"
	"github.com/anshumancodes/autocurl/internal/parser"
)

func TestParseEmpty(t *testing.T) {
	doc, err := parser.Parse("")
	if err != nil || len(doc.Requests) != 0 || len(doc.Variables) != 0 {
		t.Fatalf("got %#v, %v", doc, err)
	}
}

func TestParseGeneratedExpressAndNestJS(t *testing.T) {
	cases := []struct {
		name      string
		files     map[string]string
		extractor discovery.Extractor
		project   string
	}{
		{
			name:      "Express",
			files:     map[string]string{"package.json": `{"dependencies":{"express":"5.0.0"}}`, "server.js": "const express = require('express');\nconst app = express();\napp.get('/users/:id', handler);\n"},
			extractor: express.New(),
			project:   "express-api",
		},
		{
			name:      "NestJS",
			files:     map[string]string{"package.json": `{"dependencies":{"@nestjs/core":"^10.0.0"}}`, "tsconfig.json": `{}`, "src/users.controller.ts": "import { Controller, Get, Post } from '@nestjs/common';\n@Controller('users')\nexport class Users { @Get(':id') find() {} @Post() create() {} }"},
			extractor: nestjs.New(),
			project:   "nest-api",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			root := fixtureProject(t, tc.files)
			result, err := discovery.Discover(root, discovery.DiscoverOptions{Extractors: []discovery.Extractor{tc.extractor}})
			if err != nil {
				t.Fatal(err)
			}
			content, err := generator.Generate(result.Routes, generator.Options{ProjectName: tc.project, ProjectRoot: root})
			if err != nil {
				t.Fatal(err)
			}
			doc, err := parser.Parse(content)
			if err != nil {
				t.Fatal(err)
			}
			if doc.Project != tc.project || len(doc.Requests) != len(result.Routes) {
				t.Fatalf("unexpected document: %#v", doc)
			}
		})
	}
}

func TestParseVariablesHeadersPlaceholdersBodyAndCRLF(t *testing.T) {
	content := "# note\r\n# Project: api\r\n\r\n@baseUrl = http://localhost:3000\r\n@id = unchanged\r\n\r\n### 1. GET /users/{id}\r\n# @source server.js:3\r\nGET {{baseUrl}}/users/{{id}}\r\nAccept: application/json\r\nX-Test: one\r\n\r\n{\"id\":\"{{id}}\"}\r\n\r\n### 2. POST /users\r\nPOST {{baseUrl}}/users\r\nAccept: application/json\r\n"
	doc, err := parser.Parse(content)
	if err != nil {
		t.Fatal(err)
	}
	if doc.Variables["id"] != "unchanged" || len(doc.Requests) != 2 {
		t.Fatalf("unexpected %#v", doc)
	}
	if doc.Requests[0].URL != "{{baseUrl}}/users/{{id}}" || doc.Requests[0].Body != "{\"id\":\"{{id}}\"}" {
		t.Fatalf("placeholders/body changed: %#v", doc.Requests[0])
	}
	if doc.Requests[0].Source == nil || doc.Requests[0].Source.Line != 3 || doc.Requests[0].Headers["X-Test"] != "one" {
		t.Fatalf("metadata lost: %#v", doc.Requests[0])
	}
}

func TestParseValidationErrorsHaveLineNumbers(t *testing.T) {
	cases := []string{
		"@bad =\n",
		"@x = 1\n@x = 2\n",
		"### 1. GET /\nGET /\nBadHeader\n",
		"### 1. GET /\nGET /\n\n### 1. POST /\nPOST /\n",
		"### 1. GET /\n# @source :x\nGET /\n",
		"### 1. GET /\n",
	}
	for _, content := range cases {
		if _, err := parser.Parse(content); err == nil || !strings.Contains(err.Error(), "line ") {
			t.Errorf("expected line-numbered error for %q, got %v", content, err)
		}
	}
}

func TestParseDeterministicAndGeneratedRoundTrip(t *testing.T) {
	content, err := generator.Generate(nil, generator.Options{ProjectName: "api"})
	if err != nil {
		t.Fatal(err)
	}
	one, err := parser.Parse(content)
	if err != nil {
		t.Fatal(err)
	}
	two, err := parser.Parse(content)
	if err != nil {
		t.Fatal(err)
	}
	if len(one.Requests) != len(two.Requests) || one.Project != two.Project || one.Variables["baseUrl"] != two.Variables["baseUrl"] {
		t.Fatalf("non-deterministic parse")
	}
}

func TestParserIntegrationInputsRemainGeneratorCompatible(t *testing.T) {
	for _, routes := range [][]discovery.Route{
		{{Method: "GET", Path: "/health"}},
		{{Method: "POST", Path: "/users"}, {Method: "DELETE", Path: "/users/{id}"}},
	} {
		text, err := generator.Generate(routes, generator.Options{ProjectName: "api"})
		if err != nil {
			t.Fatal(err)
		}
		if _, err := parser.Parse(text); err != nil {
			t.Fatalf("generated output rejected: %v", err)
		}
	}
}

func fixtureProject(t *testing.T, files map[string]string) string {
	t.Helper()
	root := t.TempDir()
	for name, contents := range files {
		path := filepath.Join(root, name)
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return root
}
