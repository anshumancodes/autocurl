package express

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/anshumancodes/autocurl/internal/discovery"
	"github.com/anshumancodes/autocurl/internal/project"
)

func TestExtractBasicAndAllMethods(t *testing.T) {
	root := fixtureProject(t, map[string]string{"server.js": `
const express = require("express");
const app = express();
app.get("/health", healthCheck);
app.post("/users", createUser);
app.put("/users/:id", updateUser);
app.patch("/users/:id", patchUser);
app.delete("/users/:id", deleteUser);
`})
	ctx := expressContext(t, root, []string{"javascript"})
	routes, warnings, err := Extractor{}.Extract(ctx)
	if err != nil || len(warnings) != 0 || len(routes) != 5 {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	if routes[0].Source.Line != 4 || routes[0].Path != "/health" || routes[0].Method != "GET" {
		t.Fatalf("first route=%#v, want GET /health on line 4", routes[0])
	}
	for _, route := range routes {
		if route.Language != "javascript" || route.Framework != "express" || route.Strategy != discovery.StrategyAST || route.Confidence != staticConfidence {
			t.Fatalf("route metadata=%#v", route)
		}
	}
}

func TestExtractRouterAndIgnoresUnrelatedGet(t *testing.T) {
	root := fixtureProject(t, map[string]string{"routes.js": `
const express = require("express");
const router = express.Router();
const cache = { get() {} };
router.get("/products", listProducts);
cache.get("/not-a-route");
`})
	routes, warnings, err := (Extractor{}).Extract(expressContext(t, root, []string{"javascript"}))
	if err != nil || len(warnings) != 0 || len(routes) != 1 || routes[0].Path != "/products" {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
}

func TestExtractWarningsForDynamicAndUnsupportedDeclarations(t *testing.T) {
	root := fixtureProject(t, map[string]string{"server.js": `
const express = require("express");
const app = express();
const path = "/dynamic";
app.get(path, handler);
app.all("/all", handler);
`})
	routes, warnings, err := (Extractor{}).Extract(expressContext(t, root, []string{"javascript"}))
	if err != nil || len(routes) != 0 || len(warnings) != 2 {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	if !containsWarning(warnings, "dynamic path") || !containsWarning(warnings, "unsupported route declaration") {
		t.Fatalf("warnings=%#v", warnings)
	}
}

func TestExtractMalformedAndEmptyFilesAreRecoverable(t *testing.T) {
	root := fixtureProject(t, map[string]string{"empty.js": "", "bad.js": "const app = ;", "valid.js": `
const express = require("express");
const app = express();
app.get("/ok", handler);
`})
	routes, warnings, err := (Extractor{}).Extract(expressContext(t, root, []string{"javascript"}))
	if err != nil || len(routes) != 1 || routes[0].Path != "/ok" {
		t.Fatalf("routes=%#v warnings=%#v err=%v", routes, warnings, err)
	}
	if !containsWarning(warnings, "parse") {
		t.Fatalf("warnings=%#v, want malformed-file warning", warnings)
	}
}

func TestExtractMultipleFilesAndApplicability(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"a.js": `const express = require("express"); const app = express(); app.get("/a", handler);`,
		"b.js": `const express = require("express"); const router = express.Router(); router.post("/b", handler);`,
	})
	ctx := expressContext(t, root, []string{"javascript"})
	routes, _, err := (Extractor{}).Extract(ctx)
	if err != nil || len(routes) != 2 {
		t.Fatalf("routes=%#v err=%v", routes, err)
	}
	if (Extractor{}).Applies(ctx) == false {
		t.Fatal("extractor should apply to JavaScript Express context")
	}
	ctx.Detection.Languages = []string{"typescript"}
	if (Extractor{}).Applies(ctx) {
		t.Fatal("extractor should not claim TypeScript support")
	}
	ctx.Detection.Languages = []string{"javascript"}
	ctx.Detection.Frameworks = []string{"fastify"}
	if (Extractor{}).Applies(ctx) {
		t.Fatal("extractor should not apply to non-Express context")
	}
}

func TestDiscoverWithRegisteredExpressExtractorNormalizesPath(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json": `{"dependencies":{"express":"5.0.0"}}`,
		"server.js":    "const express = require('express');\nconst app = express();\napp.get('/users/:id', handler);\n",
	})
	result, err := discovery.Discover(root, discovery.DiscoverOptions{Extractors: []discovery.Extractor{New()}})
	if err != nil || len(result.Routes) != 1 {
		t.Fatalf("result=%#v err=%v", result, err)
	}
	if result.Routes[0].Path != "/users/{id}" || result.Routes[0].Method != "GET" {
		t.Fatalf("route=%#v", result.Routes[0])
	}
}

func expressContext(t *testing.T, root string, languages []string) discovery.ExtractionContext {
	t.Helper()
	scan, err := project.Scan(root, project.ScanOptions{})
	if err != nil {
		t.Fatal(err)
	}
	return discovery.ExtractionContext{Root: root, Files: scan.Files, Detection: project.DetectionResult{Languages: languages, Frameworks: []string{"express"}}}
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

func containsWarning(warnings []string, wanted string) bool {
	for _, warning := range warnings {
		if strings.Contains(warning, wanted) {
			return true
		}
	}
	return false
}

func TestExpressDemoEndToEnd(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json": `{
			"dependencies": {
				"express": "^4.21.0"
			}
		}`,
		"app.js": `const express = require("express");
const app = express();
const userRouter = require("./routes/users");

app.get("/health", healthCheck);
app.post("/login", login);
app.put("/settings", updateSettings);

app.use("/api/v1", userRouter);

const config = { get(key) { return key; } };
config.get("database");
`,
		"routes/users.js": `const express = require("express");
const router = express.Router();

router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.post("/users", createUser);
router.delete("/users/:id", deleteUser);

const dynamicPath = "/dynamic";
router.get(dynamicPath, handler);

module.exports = router;
`,
	})

	result, err := discovery.Discover(root, discovery.DiscoverOptions{
		Extractors: []discovery.Extractor{New()},
	})
	if err != nil {
		t.Fatalf("discovery failed: %v", err)
	}

	expected := map[string]bool{
		"GET /health":               false,
		"POST /login":               false,
		"PUT /settings":             false,
		"GET /api/v1/users":         false,
		"GET /api/v1/users/{id}":    false,
		"POST /api/v1/users":        false,
		"DELETE /api/v1/users/{id}": false,
	}

	for _, route := range result.Routes {
		key := route.Method + " " + route.Path

		if _, exists := expected[key]; !exists {
			t.Errorf("unexpected route: %s", key)
			continue
		}

		if expected[key] {
			t.Errorf("duplicate route: %s", key)
		}

		expected[key] = true

		if route.Strategy != discovery.StrategyAST {
			t.Errorf("%s: expected AST strategy", key)
		}

		if route.Source.File == "" || route.Source.Line <= 0 {
			t.Errorf("%s: missing source location", key)
		}

		t.Logf(
			"discovered: %-7s %-20s source=%s:%d",
			route.Method,
			route.Path,
			route.Source.File,
			route.Source.Line,
		)
	}

	for route, found := range expected {
		if !found {
			t.Errorf("missing expected route: %s", route)
		}
	}

	if len(result.Routes) != len(expected) {
		t.Errorf(
			"expected %d routes, got %d",
			len(expected),
			len(result.Routes),
		)
	}

	if !containsWarning(result.Warnings, "dynamic path") {
		t.Errorf(
			"expected warning for dynamic route, got: %v",
			result.Warnings,
		)
	}

	for _, warning := range result.Warnings {
		t.Logf("warning: %s", warning)
	}
}

func TestMountedRouterImportFormsAndMultiplePrefixes(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json": `{"dependencies":{"express":"1"}}`,
		"app.js": `const express = require("express"); const app = express();
const explicit = require("./routes/explicit.js");
const extensionless = require("./routes/extensionless");
const indexed = require("./routes/indexed");
app.use("/v1/", explicit); app.use("/legacy", explicit);
app.use("/x", extensionless); app.use("/i", indexed);`,
		"routes/explicit.js":      `const express = require("express"); const router = express.Router(); router.get("/users/:id", handler); module.exports = router;`,
		"routes/extensionless.js": `const express = require("express"); const router = express.Router(); router.post("/items", handler); module.exports = router;`,
		"routes/indexed/index.js": `const express = require("express"); const router = express.Router(); router.delete("/items", handler); module.exports = router;`,
	})
	result, err := discovery.Discover(root, discovery.DiscoverOptions{Extractors: []discovery.Extractor{New()}})
	if err != nil {
		t.Fatal(err)
	}
	want := map[string]bool{"GET /v1/users/{id}": true, "GET /legacy/users/{id}": true, "POST /x/items": true, "DELETE /i/items": true}
	got := map[string]bool{}
	for _, route := range result.Routes {
		got[route.Method+" "+route.Path] = true
	}
	if len(got) != len(want) {
		t.Fatalf("routes=%v warnings=%v", got, result.Warnings)
	}
	for key := range want {
		if !got[key] {
			t.Errorf("missing %s", key)
		}
	}
}

func TestNestedMountsAndRouterIsolation(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json": `{"dependencies":{"express":"1"}}`,
		"app.js":       `const express = require("express"); const app = express(); const api = require("./api"); app.use("/api", api);`,
		"api.js":       `const express = require("express"); const one = express.Router(); const two = express.Router(); const admin = require("./admin"); one.use("/admin", admin); one.get("/one", handler); two.get("/two", handler); module.exports = one;`,
		"admin.js":     `const express = require("express"); const router = express.Router(); router.get("/users", handler); module.exports = router;`,
	})
	result, err := discovery.Discover(root, discovery.DiscoverOptions{Extractors: []discovery.Extractor{New()}})
	if err != nil {
		t.Fatal(err)
	}
	keys := map[string]bool{}
	for _, route := range result.Routes {
		keys[route.Method+" "+route.Path] = true
	}
	if !keys["GET /api/admin/users"] || !keys["GET /api/one"] || keys["GET /api/two"] || keys["GET /admin/users"] {
		t.Fatalf("routes=%v warnings=%v", keys, result.Warnings)
	}
}

func TestMountWarningsAndCircularRelationships(t *testing.T) {
	root := fixtureProject(t, map[string]string{
		"package.json": `{"dependencies":{"express":"1"}}`,
		"app.js":       `const express = require("express"); const app = express(); const a = require("./a"); app.use(prefix, a); app.use("/api", a); const missing = require("./missing"); app.use("/missing", missing);`,
		"a.js":         `const express = require("express"); const router = express.Router(); const b = require("./b"); router.use("/b", b); router.get("/a", handler); module.exports = router;`,
		"b.js":         `const express = require("express"); const router = express.Router(); const a = require("./a"); router.use("/a", a); router.get("/b", handler); module.exports = router;`,
	})
	result, err := discovery.Discover(root, discovery.DiscoverOptions{Extractors: []discovery.Extractor{New()}})
	if err != nil {
		t.Fatal(err)
	}
	if !containsWarning(result.Warnings, "dynamic mount prefix") || !containsWarning(result.Warnings, "unresolved local import") || !containsWarning(result.Warnings, "circular router mount") {
		t.Fatalf("warnings=%v", result.Warnings)
	}
	if len(result.Routes) != 2 {
		t.Fatalf("routes=%v", result.Routes)
	}
}
