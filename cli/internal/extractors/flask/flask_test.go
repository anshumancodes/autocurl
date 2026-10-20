package flask

import (
	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/generator"
	"github.com/anshumancodes/autocurl/internal/parser"
	"github.com/anshumancodes/autocurl/internal/project"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"
)

func TestExtractFlaskBlueprintsAndMethods(t *testing.T) {
	root := t.TempDir()
	files := map[string]string{
		"requirements.txt": "Flask\n", "main.py": "from flask import Flask\nfrom api import api\napp=Flask(__name__)\napp.register_blueprint(api,url_prefix='/v1')\n@app.get('/health')\ndef health(): pass\n",
		"api.py": "from flask import Blueprint\napi=Blueprint('api',__name__,url_prefix='/api')\nsub=Blueprint('sub',__name__,url_prefix='/sub')\napi.register_blueprint(sub)\n@api.route('/users/<int:id>',methods=['GET','POST'])\ndef user(id): pass\n@sub.post('/ping')\ndef ping(): pass\n",
	}
	for n, c := range files {
		p := filepath.Join(root, n)
		if err := os.WriteFile(p, []byte(c), 0644); err != nil {
			t.Fatal(err)
		}
	}
	scan, _ := project.Scan(root, project.ScanOptions{})
	got, w, e := Extractor{}.Extract(discovery.ExtractionContext{Root: root, Files: scan.Files, Detection: project.DetectionResult{Languages: []string{"python"}, Frameworks: []string{"flask"}}})
	if e != nil || len(w) > 0 {
		t.Fatalf("warnings=%v err=%v", w, e)
	}
	normalized := discovery.NormalizeRoutes(got)
	keys := []string{}
	for _, r := range normalized.Routes {
		keys = append(keys, r.Method+" "+r.Path)
	}
	sort.Strings(keys)
	want := []string{"GET /health", "GET /v1/api/users/{id}", "POST /v1/api/sub/ping", "POST /v1/api/users/{id}"}
	if !reflect.DeepEqual(keys, want) {
		t.Fatalf("got=%v want=%v", keys, want)
	}
}
func TestFlaskSkipsDynamicAndMalformed(t *testing.T) {
	root := t.TempDir()
	_ = os.WriteFile(filepath.Join(root, "app.py"), []byte("from flask import Flask\napp=Flask(__name__)\nprefix=get_prefix()\n@app.route(prefix)\ndef x():pass\n@bad\ndef broken(: pass\n"), 0644)
	scan, _ := project.Scan(root, project.ScanOptions{})
	_, w, e := Extractor{}.Extract(discovery.ExtractionContext{Files: scan.Files, Detection: project.DetectionResult{Languages: []string{"python"}, Frameworks: []string{"flask"}}})
	if e != nil || !strings.Contains(strings.Join(w, " "), "parse") {
		t.Fatalf("warnings=%v err=%v", w, e)
	}
}

func TestFlaskGeneratedDocumentIsParserCompatible(t *testing.T) {
	routes := []discovery.Route{{Method: "GET", Path: "/users/<int:id>", Language: "python", Framework: "flask", Strategy: discovery.StrategyAST, Confidence: .95}}
	content, err := generator.Generate(routes, generator.Options{ProjectName: "flask-demo", ProjectRoot: t.TempDir()})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := parser.Parse(content); err != nil {
		t.Fatalf("generated Flask document is not parser-compatible: %v", err)
	}
}
