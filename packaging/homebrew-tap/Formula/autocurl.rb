class Autocurl < Formula
  desc "Generate and interactively execute API requests from source projects"
  homepage "https://autocurl.lol"
  version "0.1.0-beta.3"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/anshumancodes/autocurl/releases/download/v0.1.0-beta.3/autocurl_v0.1.0-beta.3_darwin_arm64.tar.gz"
      sha256 "739d7e8104a6c5a6c0bcb2bdc9413ac1e014d3867089ea17d15a2c8d82eca0f3"
    else
      url "https://github.com/anshumancodes/autocurl/releases/download/v0.1.0-beta.3/autocurl_v0.1.0-beta.3_darwin_amd64.tar.gz"
      sha256 "b9a7c32d117232c123643859c7a0c304427f210df42205f693c4821d7aa70295"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/anshumancodes/autocurl/releases/download/v0.1.0-beta.3/autocurl_v0.1.0-beta.3_linux_arm64.tar.gz"
      sha256 "76cb97d54cfd579b48ee66c9db75ad96727ae281193d4b5cb3730bde8bb09ac8"
    else
      url "https://github.com/anshumancodes/autocurl/releases/download/v0.1.0-beta.3/autocurl_v0.1.0-beta.3_linux_amd64.tar.gz"
      sha256 "9d7499b6bb1ed296def25b0059b74531a45a29ad7cc49dbb5249b2264a21b48e"
    end
  end

  def install
    bin.install "autocurl"
  end

  test do
    assert_equal "autocurl v#{version}", shell_output("#{bin}/autocurl --version").strip
  end
end
