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

### 1. Generate routes from a project or module
Run autocurl from anywhere and pass either the project root for a full scan or a module directory/file to limit discovery to that part of the project:

```bash
autocurl ./path-to-project                  # scan the whole project
autocurl ./path-to-project/src/modules/users # scan one module
autocurl ./path-to-project/src/routes/users.js # scan one source file
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

### macOS and Linux

```bash
curl -fsSL https://autocurl.lol/install.sh | sh
```

The installer supports macOS and Linux on AMD64 and ARM64. It verifies the release archive checksum and installs the binary into `~/.local/bin`. Set `AUTOCURL_VERSION=vX.Y.Z` to install a specific stable version, or `AUTOCURL_INSTALL_DIR` to choose another install directory. Add `~/.local/bin` to your `PATH` if the installer prompts you.

### Windows

Download `autocurl_vX.Y.Z_windows_amd64.zip` from [GitHub Releases](https://github.com/anshumancodes/autocurl/releases), extract `autocurl.exe`, and add its folder to your `PATH`. Verify the archive against the release's `checksums.txt`. Windows ARM64 users can build from source with Go; the published Windows release currently targets AMD64.

---

## Tech Stack

- **CLI:** Go
- **AST Route Parsing:** Tree-sitter
- **Web & Documentation:** Next.js, React, Fumadocs, Tailwind CSS
- **Execution:** Built-in Go HTTP client

---

## Website & Docs

Visit [autocurl.lol](https://autocurl.lol) to read the documentation and learn more.

See the [contribution guide](CONTRIBUTING.md) for issue, pull request, and validation steps.

---

## License

[MIT](LICENSE)
