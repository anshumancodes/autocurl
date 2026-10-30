#!/bin/sh
# Install autocurl from a stable GitHub Release.
set -eu

error() { printf '%s\n' "autocurl installer: $*" >&2; exit 1; }

HOME_DIR=${HOME:-}
[ -n "$HOME_DIR" ] || error "HOME is not set"
INSTALL_DIR=${AUTOCURL_INSTALL_DIR:-"${HOME_DIR}/.local/bin"}
REPOSITORY=${AUTOCURL_REPOSITORY:-anshumancodes/autocurl}
RELEASE_BASE_URL=${AUTOCURL_RELEASE_BASE_URL:-"https://github.com/${REPOSITORY}/releases/download"}
LATEST_RELEASE_URL=${AUTOCURL_LATEST_RELEASE_URL:-"https://api.github.com/repos/${REPOSITORY}/releases/latest"}

case "$RELEASE_BASE_URL:$LATEST_RELEASE_URL" in
  https://*:https://*) ;;
  *) error "release endpoints must use HTTPS" ;;
esac

command -v uname >/dev/null 2>&1 || error "uname is required"
command -v curl >/dev/null 2>&1 || error "curl is required"
command -v tar >/dev/null 2>&1 || error "tar is required"
if command -v sha256sum >/dev/null 2>&1; then
  SHA_MODE=sha256sum
elif command -v shasum >/dev/null 2>&1; then
  SHA_MODE=shasum
else
  error "sha256sum or shasum is required to verify downloads"
fi

OS=$(uname -s)
ARCH=$(uname -m)
case "$OS:$ARCH" in
  Linux:x86_64|Linux:amd64) TARGET_OS=linux; TARGET_ARCH=amd64 ;;
  Linux:aarch64|Linux:arm64) TARGET_OS=linux; TARGET_ARCH=arm64 ;;
  Darwin:x86_64|Darwin:amd64) TARGET_OS=darwin; TARGET_ARCH=amd64 ;;
  Darwin:arm64|Darwin:aarch64) TARGET_OS=darwin; TARGET_ARCH=arm64 ;;
  *) error "unsupported platform: ${OS} ${ARCH}; supported platforms are Linux and macOS on AMD64 and ARM64" ;;
esac

if [ -n "${AUTOCURL_VERSION:-}" ]; then
  VERSION=$AUTOCURL_VERSION
else
  RELEASE_JSON=$(mktemp "${TMPDIR:-/tmp}/autocurl-release.XXXXXX") || error "could not create a temporary file"
  if ! curl --fail --silent --show-error --location --retry 3 --proto '=https' --tlsv1.2 "$LATEST_RELEASE_URL" -o "$RELEASE_JSON"; then
    rm -f "$RELEASE_JSON"
    error "could not resolve the latest stable release from ${LATEST_RELEASE_URL}"
  fi
  VERSION=$(sed -n 's/^[[:space:]]*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$RELEASE_JSON" | sed -n '1p')
  rm -f "$RELEASE_JSON"
  [ -n "$VERSION" ] || error "latest release response did not contain a tag_name"
fi
case "$VERSION" in [0-9]*) VERSION="v${VERSION}" ;; esac
printf '%s\n' "$VERSION" | awk '!/^v[0-9]+\.[0-9]+\.[0-9]+(\+[0-9A-Za-z.-]+)?$/ { exit 1 }' \
  || error "invalid version '${VERSION}'; expected vMAJOR.MINOR.PATCH"
case "$VERSION" in *-*) error "${VERSION} is a prerelease; install a stable release" ;; esac

ARCHIVE="autocurl_${VERSION}_${TARGET_OS}_${TARGET_ARCH}.tar.gz"
DOWNLOAD_BASE="${RELEASE_BASE_URL%/}/${VERSION}"
TMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/autocurl-install.XXXXXX") || error "could not create a temporary directory"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup 0 1 2 15

printf '%s\n' "Downloading autocurl ${VERSION} for ${TARGET_OS}/${TARGET_ARCH}..."
curl --fail --silent --show-error --location --retry 3 --proto '=https' --tlsv1.2 \
  "${DOWNLOAD_BASE}/${ARCHIVE}" -o "${TMP_DIR}/${ARCHIVE}" \
  || error "could not download ${ARCHIVE} for ${TARGET_OS}/${TARGET_ARCH}"
curl --fail --silent --show-error --location --retry 3 --proto '=https' --tlsv1.2 \
  "${DOWNLOAD_BASE}/checksums.txt" -o "${TMP_DIR}/checksums.txt" \
  || error "could not download checksums.txt for ${VERSION}"

EXPECTED=$(awk -v name="$ARCHIVE" '$2 == name { if (found++) exit 2; print $1 } END { if (!found) exit 1 }' "$TMP_DIR/checksums.txt") \
  || error "checksums.txt has no unique entry for ${ARCHIVE}"
printf '%s\n' "$EXPECTED" | awk 'length($0) == 64 && $0 ~ /^[0-9a-fA-F]+$/ { ok = 1 } END { exit !ok }' \
  || error "invalid SHA-256 checksum for ${ARCHIVE}"
if [ "$SHA_MODE" = sha256sum ]; then
  ACTUAL=$(sha256sum "$TMP_DIR/$ARCHIVE" | awk '{print $1}')
else
  ACTUAL=$(shasum -a 256 "$TMP_DIR/$ARCHIVE" | awk '{print $1}')
fi
[ "$ACTUAL" = "$EXPECTED" ] || error "checksum verification failed for ${ARCHIVE}"

ARCHIVE_CONTENTS=$(tar -tzf "$TMP_DIR/$ARCHIVE") || error "could not inspect ${ARCHIVE}"
[ "$ARCHIVE_CONTENTS" = autocurl ] || error "${ARCHIVE} must contain exactly the autocurl executable"
EXTRACT_DIR="$TMP_DIR/extract"
mkdir "$EXTRACT_DIR" || error "could not create extraction directory"
tar -xzf "$TMP_DIR/$ARCHIVE" -C "$EXTRACT_DIR" || error "could not extract ${ARCHIVE}"
[ -f "$EXTRACT_DIR/autocurl" ] && [ -x "$EXTRACT_DIR/autocurl" ] || error "archive does not contain an executable autocurl binary"

mkdir -p "$INSTALL_DIR" || error "could not create install directory ${INSTALL_DIR}"
STAGED_BINARY="$INSTALL_DIR/.autocurl.$$"
if ! (umask 077 && cp "$EXTRACT_DIR/autocurl" "$STAGED_BINARY" && chmod 755 "$STAGED_BINARY"); then
  rm -f "$STAGED_BINARY"
  error "could not prepare ${INSTALL_DIR}/autocurl"
fi
if [ -e "$INSTALL_DIR/autocurl" ]; then printf '%s\n' "Replacing existing ${INSTALL_DIR}/autocurl" >&2; fi
if ! mv -f "$STAGED_BINARY" "$INSTALL_DIR/autocurl"; then
  rm -f "$STAGED_BINARY"
  error "could not install into ${INSTALL_DIR}"
fi

printf 'Installed: %s\n' "$INSTALL_DIR/autocurl"
if [ "$INSTALL_DIR" = "$HOME_DIR/.local/bin" ] && ! command -v autocurl >/dev/null 2>&1; then
  case ":${PATH:-}:" in *:"$INSTALL_DIR":*) ;; *) printf 'Add %s to PATH:\n  export PATH="%s:$PATH"\n' "$INSTALL_DIR" "$INSTALL_DIR" ;; esac
fi
"$INSTALL_DIR/autocurl" --version || error "installed binary failed its version check"
