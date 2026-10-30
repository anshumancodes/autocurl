# autocurl

Discover routes in supported backend projects, store requests in a simple, human-readable format, and execute them with autocurl's built-in Go HTTP client.

Visit the website: [autocurl.lol](https://autocurl.lol)

---

## How It Works

autocurl connects your codebase to API testing:
- **Scans supported code:** Extracts routes from Express and NestJS (JavaScript/TypeScript), FastAPI, Flask, and Django (Python), and Gin, Echo, Fiber, and `net/http` (Go). Framework detection does not imply route extraction support.
- **Generates plain text:** Compiles routes into clean, human-readable `.autocurl` files that are easy to review in git.
- **Runs requests:** Executes requests interactively with autocurl's built-in Go HTTP client. It does not invoke the system `curl` executable.

---

## How to Use

### 1. Generate routes from a project
Run autocurl against your project directory:

```bash
autocurl ./path-to-project
```

This generates an `index.autocurl` file containing routes supported by autocurl's extractors. Detection of other frameworks may identify them without extracting their routes.

AI-assisted discovery is optional and disabled by default. AST discovery works
offline without an API key or account. To use AI, obtain a Gemini API key and
set it locally as `GEMINI_API_KEY`; the CLI connects directly to Google Gemini.
Use `--ai=auto` to invoke AI only when more analysis is needed, or `--ai=always`
to request it for every scan. Users are responsible for their Gemini usage and
any provider charges. See the [AI setup guide](https://autocurl.lol/docs/using-autocurl).
When AI analysis runs, bounded and redacted source context is sent to Gemini for analysis.

### 2. Run requests interactively
Execute the `.autocurl` file:

```bash
autocurl index.autocurl
```

Select a request by entering its number, then press `Enter` to run it.

---

## Installation

### Quick installer (macOS & Linux)

```bash
curl -fsSL https://autocurl.lol/install.sh | sh
```

This installs the verified release binary into `~/.local/bin`. The installer is prepared for the first stable release and will work once its release assets are published; this repository preparation does not mean v1.0.0 is already available. Set `AUTOCURL_VERSION=vX.Y.Z` to select a stable version explicitly.
By default, the installer resolves the latest stable release. Set `AUTOCURL_VERSION=vX.Y.Z` to install a specific stable version.

### Direct binary

After a stable release is published, download the matching archive from [GitHub Releases](https://github.com/anshumancodes/autocurl/releases), verify it with that release's `checksums.txt`, extract it, and place the `autocurl` binary somewhere on your `PATH`.

### Homebrew

Once the tap is available, install autocurl with:

```bash
brew tap anshumancodes/tap
brew install autocurl
```

---

## Tech Stack

- **CLI:** Go
- **AST Route Parsing:** Tree-sitter
- **Web & Documentation:** Next.js, React, Fumadocs, Tailwind CSS
- **Execution:** Built-in Go HTTP client

---

## Website & Docs

Visit [autocurl.lol](https://autocurl.lol) to read the documentation and learn more.

---

## License

[MIT](LICENSE)
