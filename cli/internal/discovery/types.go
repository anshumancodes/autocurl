package discovery

import "context"

type Strategy string

const (
	StrategyAST Strategy = "ast"
	StrategyAI  Strategy = "ai"
)

type SourceLocation struct {
	File string
	Line int
}

type AuthMetadata struct {
	Kind     string
	Variable string
}

type Route struct {
	Method     string
	Path       string
	Language   string
	Framework  string
	Source     SourceLocation
	Strategy   Strategy
	Confidence float64
	Headers    map[string]string
	Body       string
	HasBody    bool
	Enriched   bool
	Auth       *AuthMetadata
}

type DiscoveryResult struct {
	Routes   []Route
	Warnings []string
	Errors   []string
}

type ActionableError interface {
	error
	ErrorCode() string
}

type AIMode string

const (
	AIModeOff    AIMode = "off"
	AIModeAuto   AIMode = "auto"
	AIModeAlways AIMode = "always"
)

type SourceSnippet struct {
	File    string
	Start   int
	End     int
	Content string
}

type AIRequest struct {
	Operation string
	Detection DetectionSummary
	Routes    []Route
	Warnings  []string
	Snippets  []SourceSnippet
}

type DetectionSummary struct {
	Languages  []string
	Frameworks []string
}

type AIEndpoint struct {
	Method         string
	Path           string
	Source         SourceLocation
	PathParameters []string
	Headers        map[string]string
	Body           string
	HasBody        bool
	Auth           *AuthMetadata
	Evidence       []string
}

type AIResponse struct {
	Endpoints []AIEndpoint
}

type AIProvider interface {
	Analyze(context.Context, AIRequest) (AIResponse, error)
}
