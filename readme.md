# autocurl

Define API requests in a simple, human-readable format. Let agents and humans execute them without dealing with messy JSON, complicated tool schemas, or copy-pasting curl commands into the terminal.

Visit the website: [autocurl.lol](https://autocurl.lol)

---

## How It Works

autocurl bridges the gap between your codebase and API testing:
- **Scans your code:** Automatically discovers routes in backend projects (Express, NestJS).
- **Generates plain text:** Compiles routes into clean, human-readable `.autocurl` files that are easy to review in git.
- **Runs with curl:** Executes requests interactively in your terminal using your system's native `curl`.

---

## How to Use

### 1. Generate routes from a project
Run autocurl against your project directory:

```bash
autocurl ./path-to-project
```

This generates an `index.autocurl` file containing all discovered routes.

### 2. Run requests interactively
Execute the `.autocurl` file:

```bash
autocurl index.autocurl
```

Select a request from the interactive menu using arrow keys or fuzzy search, and press `Enter` to run it.

---

## Installation

### Direct binary

Download the archive for your platform from the [GitHub Releases](https://github.com/anshumancodes/autocurl/releases) page, extract it, and place the `autocurl` binary somewhere on your `PATH`.

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
- **Execution:** Native system `curl`

---

## Website & Docs

Visit [autocurl.lol](https://autocurl.lol) to read the documentation and learn more.

---

## License

[MIT](LICENSE)
