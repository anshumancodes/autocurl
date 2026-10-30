# autocurl Homebrew tap

The v1.0.0 formula and URLs are prepared locally, but the four checksum values
remain placeholders until release archives are published. Replace them from
the release's `checksums.txt` before updating the external tap; this preparation
does not mean v1.0.0 is already published.

Install the published precompiled autocurl CLI with:

```sh
brew tap anshumancodes/tap
brew install autocurl
autocurl --version
```

Upgrade it with `brew update && brew upgrade autocurl`. Uninstall it with
`brew uninstall autocurl`; remove the tap itself, if desired, with
`brew untap anshumancodes/tap`.

The prepared v1.0.0 formula supports macOS Apple Silicon (arm64), macOS Intel
(amd64), Linux ARM64, and Linux AMD64. Before updating the external tap after
the release is published, replace the four SHA-256 placeholders in
`Formula/autocurl.rb` with the matching entries from that release's
`checksums.txt`. Archive URLs and names follow the main repository's release
workflow. Homebrew installs the precompiled executable; it does not rebuild
autocurl from source.

The Linux release binaries are dynamically linked against glibc and were
verified to require symbols through `GLIBC_2.34`. macOS binaries use the
platform system libraries. This tap therefore does not claim support for
Linux systems without a compatible glibc runtime.
