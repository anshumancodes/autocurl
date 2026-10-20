package django

import (
	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/project"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"
)

func TestExtractDjangoIncludesAndDRFRouter(t *testing.T) {
	root := t.TempDir()
	files := map[string]string{"urls.py": "from django.urls import path,include\nfrom api import urlpatterns as api_urls\nurlpatterns=[path('admin/',admin),path('api/',include('api'))]\n", "api.py": "from django.urls import path\nfrom rest_framework.routers import DefaultRouter\nrouter=DefaultRouter()\nrouter.register('users',UserViewSet)\nurlpatterns=[path('health/',health)]\n"}
	for n, c := range files {
		if err := os.WriteFile(filepath.Join(root, n), []byte(c), 0644); err != nil {
			t.Fatal(err)
		}
	}
	scan, _ := project.Scan(root, project.ScanOptions{})
	got, w, e := Extractor{}.Extract(discovery.ExtractionContext{Files: scan.Files, Detection: project.DetectionResult{Languages: []string{"python"}, Frameworks: []string{"django", "drf"}}})
	if e != nil {
		t.Fatal(e)
	}
	keys := []string{}
	for _, r := range got {
		keys = append(keys, r.Method+" "+r.Path)
	}
	sort.Strings(keys)
	want := []string{"DELETE /users/{pk}", "GET /admin", "GET /api/health", "GET /users", "GET /users/{pk}", "PATCH /users/{pk}", "POST /users", "PUT /users/{pk}"}
	if !reflect.DeepEqual(keys, want) {
		t.Fatalf("got=%v want=%v warnings=%v", keys, want, w)
	}
}
func TestDjangoDynamicWarning(t *testing.T) {
	root := t.TempDir()
	_ = os.WriteFile(filepath.Join(root, "urls.py"), []byte("from django.urls import path\nprefix=get_prefix()\nurlpatterns=[path(prefix,view)]"), 0644)
	scan, _ := project.Scan(root, project.ScanOptions{})
	_, w, e := Extractor{}.Extract(discovery.ExtractionContext{Files: scan.Files, Detection: project.DetectionResult{Languages: []string{"python"}, Frameworks: []string{"django"}}})
	if e != nil || !strings.Contains(strings.Join(w, " "), "dynamic URL path") {
		t.Fatalf("warnings=%v err=%v", w, e)
	}
}
