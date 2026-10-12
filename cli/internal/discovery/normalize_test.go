package discovery

import (
	"errors"
	"math"
	"reflect"
	"testing"
)

func TestNormalizeRoute(t *testing.T) {
	tests := []struct {
		name    string
		method  string
		path    string
		wantM   string
		wantP   string
		wantErr error
	}{
		{"method and path", " post ", " users/ ", "POST", "/users", nil},
		{"express parameter", "get", "/users/:id", "GET", "/users/{id}", nil},
		{"fastapi parameter", "GET", "/users/{id}", "GET", "/users/{id}", nil},
		{"flask converter", "GET", "/users/<int:id>", "GET", "/users/{id}", nil},
		{"flask named parameter", "GET", "/users/<slug>", "GET", "/users/{slug}", nil},
		{"root", "GET", "/", "GET", "/", nil},
		{"static case preserved", "GET", "/API/Users", "GET", "/API/Users", nil},
		{"missing method", "", "/users", "", "", ErrInvalidMethod},
		{"unsupported method", "INVALID", "/users", "", "", ErrInvalidMethod},
		{"missing path", "GET", "", "", "", ErrInvalidPath},
		{"complete URL", "GET", "https://example.com/users", "", "", ErrInvalidPath},
		{"double internal slash", "GET", "/users//id", "", "", ErrInvalidPath},
		{"malformed parameter", "GET", "/users/:", "", "", ErrInvalidPath},
		{"ambiguous parameter", "GET", "/users/{id?}", "", "", ErrInvalidPath},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := NormalizeRoute(Route{Method: tt.method, Path: tt.path, Strategy: StrategyAST, Confidence: 1})
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("error = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr == nil && (got.Method != tt.wantM || got.Path != tt.wantP) {
				t.Fatalf("route = %#v, want method %q path %q", got, tt.wantM, tt.wantP)
			}
		})
	}
}

func TestNormalizeRouteValidation(t *testing.T) {
	tests := []struct {
		name  string
		route Route
		want  error
	}{
		{"nan confidence", Route{Method: "GET", Path: "/", Strategy: StrategyAST, Confidence: math.NaN()}, ErrInvalidConfidence},
		{"infinite confidence", Route{Method: "GET", Path: "/", Strategy: StrategyAST, Confidence: math.Inf(1)}, ErrInvalidConfidence},
		{"out of range confidence", Route{Method: "GET", Path: "/", Strategy: StrategyAST, Confidence: 1.1}, ErrInvalidConfidence},
		{"invalid strategy", Route{Method: "GET", Path: "/", Strategy: "other", Confidence: 1}, ErrInvalidStrategy},
		{"negative source line", Route{Method: "GET", Path: "/", Strategy: StrategyAST, Confidence: 1, Source: SourceLocation{Line: -1}}, ErrInvalidSourceLine},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NormalizeRoute(tt.route)
			if !errors.Is(err, tt.want) {
				t.Fatalf("error = %v, want %v", err, tt.want)
			}
		})
	}
}

func TestNormalizeRoutesDeduplicatesByPriority(t *testing.T) {
	result := NormalizeRoutes([]Route{
		{Method: "get", Path: "/users/:id", Strategy: StrategyAI, Confidence: 1, Language: "z"},
		{Method: "GET", Path: "/users/{id}", Strategy: StrategyAST, Confidence: 0.1, Language: "a"},
		{Method: "GET", Path: "/users/<int:id>", Strategy: StrategyAST, Confidence: 0.9, Language: "z"},
	})
	if len(result.Routes) != 1 {
		t.Fatalf("got %d routes, want 1", len(result.Routes))
	}
	if result.Routes[0].Strategy != StrategyAST || result.Routes[0].Confidence != 0.9 {
		t.Fatalf("selected route = %#v, want highest-confidence AST route", result.Routes[0])
	}
}

func TestNormalizeRoutesDeterministicTieBreakAndOrdering(t *testing.T) {
	input := []Route{
		{Method: "POST", Path: "/z", Strategy: StrategyAI, Confidence: 0.5, Source: SourceLocation{File: "z.go", Line: 2}},
		{Method: "GET", Path: "/z", Strategy: StrategyAI, Confidence: 0.5, Source: SourceLocation{File: "a.go", Line: 1}},
		{Method: "GET", Path: "/z", Strategy: StrategyAI, Confidence: 0.5, Source: SourceLocation{File: "z.go", Line: 1}},
		{Method: "GET", Path: "/a", Strategy: StrategyAI, Confidence: 0.5},
	}
	first := NormalizeRoutes(input)
	second := NormalizeRoutes([]Route{input[2], input[0], input[3], input[1]})
	if !reflect.DeepEqual(first, second) {
		t.Fatalf("results depend on input order:\nfirst:  %#v\nsecond: %#v", first, second)
	}
	if got := first.Routes[0].Path + " " + first.Routes[0].Method; got != "/a GET" {
		t.Fatalf("first route = %q, want /a GET", got)
	}
	if first.Routes[1].Source.File != "a.go" {
		t.Fatalf("tie-break route = %#v, want source a.go", first.Routes[1])
	}
}

func TestNormalizeRoutesWarningsAndEmptyInput(t *testing.T) {
	empty := NormalizeRoutes(nil)
	if len(empty.Routes) != 0 || len(empty.Warnings) != 0 {
		t.Fatalf("empty result = %#v, want no routes or warnings", empty)
	}
	result := NormalizeRoutes([]Route{
		{Method: "GET", Path: "/ok", Strategy: StrategyAST, Confidence: 1},
		{Method: "bad", Path: "/bad", Strategy: StrategyAST, Confidence: 1},
		{Method: "GET", Path: "", Strategy: StrategyAST, Confidence: 1},
	})
	if len(result.Routes) != 1 || result.Routes[0].Path != "/ok" || len(result.Warnings) != 2 {
		t.Fatalf("result = %#v, want one valid route and two warnings", result)
	}
}

func TestNormalizeRoutesDoesNotMutateInput(t *testing.T) {
	input := []Route{{Method: " get ", Path: "users/:id", Strategy: StrategyAST, Confidence: 1}}
	original := append([]Route(nil), input...)
	_ = NormalizeRoutes(input)
	if !reflect.DeepEqual(input, original) {
		t.Fatalf("input mutated: got %#v, want %#v", input, original)
	}
}
