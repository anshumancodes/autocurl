
package discovery

type Strategy string

const (
	StrategyAST Strategy = "ast"
	StrategyAI  Strategy = "ai"
)

type SourceLocation struct {
	File string
	Line int
}

type Route struct {
	Method     string
	Path       string
	Language   string
	Framework  string
	Source     SourceLocation
	Strategy   Strategy
	Confidence float64
}

type DiscoveryResult struct {
	Routes   []Route
	Warnings []string
}
