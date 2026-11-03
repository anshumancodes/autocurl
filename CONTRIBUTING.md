# Contributing

Thanks for helping improve autocurl. Please follow these steps for each contribution:

1. **Create an issue.** Describe the bug or proposed change and its expected outcome before starting work.
2. **Fork the repository and prepare a pull request.** Create a branch on your fork, make your changes, and open a PR against the original repository. Describe the user-visible changes and link the issue in the PR description. Include tests for behavior changes.
3. **Run the checks before opening your PR.** Run the checks for the area you changed.

   From `cli/`:

   ```sh
   go test ./...
   go vet ./...
   go build ./cmd/autocurl
   ```

   From `web/`:

   ```sh
   npm ci
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

4. **Tag the maintainer and reference the LinkedIn issue.** Mention `@anshumancodes` in the PR and include a link to the related LinkedIn issue.

Do not commit credentials, API keys, or generated release archives.

# Contributing

Please follow these four steps when contributing to autocurl:

1. **Create an issue.** Describe the bug or proposed change and its expected outcome before starting work.
2. **Fork the repository and open a pull request.** Make your changes in a branch on your fork, then create a PR against the original repository. Link the issue in the PR description.
3. **Run linting and builds before opening the PR.** For the CLI, run `go vet ./...` and `go build ./cmd/autocurl` from `cli/`. For the website, run `npm ci`, `npm run lint`, and `npm run build` from `web/`.
4. **Tag the maintainer and reference the LinkedIn issue.** Mention `@anshumancodes` in the PR and include a link to the related LinkedIn issue so it can be matched to the contribution.
