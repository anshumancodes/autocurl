# autocurl Homebrew tap

Install the published precompiled autocurl CLI with:

```sh
brew tap anshumancodes/tap
brew install autocurl
autocurl --version
```

Upgrade it with `brew update && brew upgrade autocurl`. Uninstall it with
`brew uninstall autocurl`; remove the tap itself, if desired, with
`brew untap anshumancodes/tap`.

The formula supports macOS Apple Silicon (arm64), macOS Intel (amd64), Linux
ARM64, and Linux AMD64. It installs the executable from the corresponding
precompiled `v0.1.0-beta.3` GitHub Release archive; Homebrew does not rebuild
autocurl from source.

The Linux release binaries are dynamically linked against glibc and were
verified to require symbols through `GLIBC_2.34`. macOS binaries use the
platform system libraries. This tap therefore does not claim support for
Linux systems without a compatible glibc runtime.
