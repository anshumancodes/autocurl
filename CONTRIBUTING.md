# Contributing

Thanks for helping improve autocurl. Before opening a pull request, run the checks for the area you changed.

For the CLI, from `cli/`:

```sh
go test ./...
go vet ./...
go build ./cmd/autocurl
```

For the website, from `web/`:

```sh
npm ci
npx tsc --noEmit
npm run build
```

Pull requests should describe the user-visible change and include tests for behavior changes. Do not commit credentials, API keys, or generated release archives.
