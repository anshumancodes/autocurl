# Prepared for v1.0.0. Replace each placeholder with its value from the
# published release's checksums.txt before publishing this formula to the tap.
class Autocurl < Formula
  desc "Generate and interactively execute API requests from source projects"
  homepage "https://autocurl.lol"
  version "1.0.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/anshumancodes/autocurl/releases/download/v#{version}/autocurl_v#{version}_darwin_arm64.tar.gz"
      sha256 "__MACOS_ARM64_SHA256__"
    else
      url "https://github.com/anshumancodes/autocurl/releases/download/v#{version}/autocurl_v#{version}_darwin_amd64.tar.gz"
      sha256 "__MACOS_AMD64_SHA256__"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/anshumancodes/autocurl/releases/download/v#{version}/autocurl_v#{version}_linux_arm64.tar.gz"
      sha256 "__LINUX_ARM64_SHA256__"
    else
      url "https://github.com/anshumancodes/autocurl/releases/download/v#{version}/autocurl_v#{version}_linux_amd64.tar.gz"
      sha256 "__LINUX_AMD64_SHA256__"
    end
  end

  def install
    bin.install "autocurl"
  end

  test do
    assert_equal "autocurl v#{version}", shell_output("#{bin}/autocurl --version").strip
  end
end
