#!/bin/sh
# Install autocurl from the public binary distribution.
# Keep the release version pinned and update it only when the matching public
# release and checksums.txt have been published.

set -eu

error() {
  printf '%s\n' "autocurl installer: $*" >&2
  exit 1
}

VERSION=${AUTOCURL_VERSION:-v0.1.0-beta.5}
HOME_DIR=${HOME:-}
[ -n "$HOME_DIR" ] || error "HOME is not set"
INSTALL_DIR=${AUTOCURL_INSTALL_DIR:-"${HOME_DIR}/.local/bin"}
RELEASE_BASE_URL=${AUTOCURL_RELEASE_BASE_URL:-https://github.com/anshumancodes/autocurl-distribution/releases/download}

case "$RELEASE_BASE_URL" in
  https://*) ;;
  *) error "release downloads must use HTTPS" ;;
esac

command -v uname >/dev/null 2>&1 || error "uname is required"
command -v curl >/dev/null 2>&1 || error "curl is required"
command -v tar >/dev/null 2>&1 || error "tar is required"

OS=$(uname -s)
ARCH=$(uname -m)
case "$OS:$ARCH" in
  Linux:x86_64|Linux:amd64) TARGET_OS=linux; TARGET_ARCH=amd64 ;;
  Linux:aarch64|Linux:arm64) TARGET_OS=linux; TARGET_ARCH=arm64 ;;
  Darwin:x86_64|Darwin:amd64) TARGET_OS=darwin; TARGET_ARCH=amd64 ;;
  Darwin:arm64|Darwin:aarch64) TARGET_OS=darwin; TARGET_ARCH=arm64 ;;
  *) error "unsupported platform: ${OS} ${ARCH}; supported platforms are Linux and macOS on AMD64 and ARM64" ;;
esac

ARCHIVE="autocurl_${VERSION}_${TARGET_OS}_${TARGET_ARCH}.tar.gz"
DOWNLOAD_BASE="${RELEASE_BASE_URL%/}/${VERSION}"

TMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/autocurl-install.XXXXXX") || error "could not create a temporary directory"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup 0 1 2 15

printf '%s\n' "Downloading autocurl ${VERSION} for ${TARGET_OS}/${TARGET_ARCH}..."
curl --fail --silent --show-error --location --retry 3 --proto '=https' --tlsv1.2 \
  "${DOWNLOAD_BASE}/${ARCHIVE}" -o "${TMP_DIR}/${ARCHIVE}" \
  || error "could not download ${ARCHIVE}"
curl --fail --silent --show-error --location --retry 3 --proto '=https' --tlsv1.2 \
  "${DOWNLOAD_BASE}/checksums.txt" -o "${TMP_DIR}/checksums.txt" \
  || error "could not download checksums.txt"

EXPECTED=$(awk -v name="$ARCHIVE" '$2 == name { print $1; found = 1; exit } END { if (!found) exit 1 }' \
  "$TMP_DIR/checksums.txt") \
  || error "checksums.txt has no entry for ${ARCHIVE}"
if ! printf '%s\n' "$EXPECTED" | awk 'length($0) == 64 && $0 ~ /^[0-9a-fA-F]+$/ { found = 1 } END { exit !found }'; then
  error "invalid SHA-256 checksum for ${ARCHIVE}"
fi

if command -v sha256sum >/dev/null 2>&1; then
  ACTUAL=$(sha256sum "${TMP_DIR}/${ARCHIVE}" | awk '{print $1}')
elif command -v shasum >/dev/null 2>&1; then
  ACTUAL=$(shasum -a 256 "${TMP_DIR}/${ARCHIVE}" | awk '{print $1}')
else
  error "sha256sum or shasum is required to verify the download"
fi
[ "$ACTUAL" = "$EXPECTED" ] || error "checksum verification failed for ${ARCHIVE}"

EXTRACT_DIR="${TMP_DIR}/extract"
mkdir "$EXTRACT_DIR" || error "could not create extraction directory"
ARCHIVE_CONTENTS=$(tar -tzf "${TMP_DIR}/${ARCHIVE}") \
  || error "could not inspect ${ARCHIVE}"
[ "$ARCHIVE_CONTENTS" = "autocurl" ] \
  || error "archive must contain only the autocurl executable"
tar -xzf "${TMP_DIR}/${ARCHIVE}" -C "$EXTRACT_DIR" \
  || error "could not extract ${ARCHIVE}"
test -f "${EXTRACT_DIR}/autocurl" \
  || error "archive does not contain the autocurl executable"

mkdir -p "$INSTALL_DIR" || error "could not create install directory ${INSTALL_DIR}"
STAGED_BINARY="${INSTALL_DIR}/.autocurl.$$"
if ! (umask 077 && cp "${EXTRACT_DIR}/autocurl" "$STAGED_BINARY" && chmod 755 "$STAGED_BINARY"); then
  rm -f "$STAGED_BINARY"
  error "could not prepare ${INSTALL_DIR}/autocurl"
fi
if [ -e "${INSTALL_DIR}/autocurl" ]; then
  printf '%s\n' "Replacing existing ${INSTALL_DIR}/autocurl" >&2
fi
if ! mv -f "$STAGED_BINARY" "${INSTALL_DIR}/autocurl"; then
  rm -f "$STAGED_BINARY"
  error "could not install into ${INSTALL_DIR}"
fi

printf 'Installed: %s\n' "${INSTALL_DIR}/autocurl"
if [ "$INSTALL_DIR" = "${HOME_DIR}/.local/bin" ] && ! command -v autocurl >/dev/null 2>&1; then
  case ":${PATH:-}:" in
    *:"${INSTALL_DIR}":*) ;;
    *)
      printf '%s\n' "Add ${INSTALL_DIR} to PATH to run autocurl from anywhere:"
      printf '  export PATH="%s:$PATH"\n' "$INSTALL_DIR"
      ;;
  esac
fi
"${INSTALL_DIR}/autocurl" --version || error "installed binary failed its version check"
