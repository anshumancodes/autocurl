import type { Metadata } from "next";
import Link from "next/link";
import DocsLayout from "@/components/DocsLayout";
import CopyButton from "@/components/CopyButton";

export const metadata: Metadata = {
  title: "Installation Guide - Install autocurl CLI",
  description:
    "How to install autocurl on macOS, Linux, and Windows using Homebrew, direct binary downloads, or shell installer scripts.",
  alternates: {
    canonical: "/docs/installation",
  },
  openGraph: {
    title: "Installing autocurl CLI - Homebrew, Linux & Windows",
    description:
      "Official installation instructions for autocurl command line API client and curl generator.",
    url: "/docs/installation",
  },
};

export default function InstallationPage() {
  return (
    <DocsLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs" },
        { label: "Installation" },
      ]}
      currentSlug="/docs/installation"
    >
      <div className="space-y-8">
        <div>
          <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
            Installation
          </div>
          <h1 className="font-extrabold text-[clamp(28px,4vw,42px)] leading-[1.1] tracking-[-0.03em] text-bone">
            Install autocurl
          </h1>
          <p className="mt-3 text-mute text-[16px] sm:text-[17px] leading-relaxed max-w-[42em]">
            autocurl is distributed as a single static binary with zero external
            runtime dependencies. It utilizes the native <code className="text-bone">curl</code> binary
            already present on your system.
          </p>
        </div>

        {/* Method 1: Homebrew */}
        <section className="p-6 rounded-2xl border border-line bg-[#0e0c13]/70 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-bone">
              1. macOS & Linux via Homebrew (Recommended)
            </h2>
            <span className="font-mono text-[12px] text-sun bg-sun/10 px-2.5 py-1 rounded-full border border-sun/20">
              macOS / Linux
            </span>
          </div>
          <p className="text-mute text-[14.5px] leading-relaxed">
            The simplest way to install and keep autocurl up to date is via Homebrew:
          </p>
          <div className="flex max-w-full flex-wrap gap-3 items-center font-mono text-[14px] bg-[#15131b] border border-line rounded-lg px-4 py-3">
            <span>brew install autocurl</span>
            <CopyButton text="brew install autocurl" />
          </div>
          <p className="text-[13px] text-mute">
            To update autocurl in the future, simply run:{" "}
            <code className="text-sun">brew upgrade autocurl</code>
          </p>
        </section>

        {/* Method 2: Shell Script */}
        <section className="p-6 rounded-2xl border border-line bg-[#0e0c13]/70 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-bone">
              2. Quick Shell Installer
            </h2>
            <span className="font-mono text-[12px] text-mute bg-white/5 px-2.5 py-1 rounded-full border border-line">
              Bash / Zsh
            </span>
          </div>
          <p className="text-mute text-[14.5px] leading-relaxed">
            If you do not use Homebrew or are working inside a CI/CD runner or
            remote Linux container, install via curl:
          </p>
          <div className="flex max-w-full flex-wrap gap-3 items-center font-mono text-[13.5px] bg-[#15131b] border border-line rounded-lg px-4 py-3 overflow-x-auto">
            <span>curl -fsSL https://raw.githubusercontent.com/anshuman/autocurl/main/install.sh | bash</span>
            <CopyButton text="curl -fsSL https://raw.githubusercontent.com/anshuman/autocurl/main/install.sh | bash" />
          </div>
        </section>

        {/* Method 3: Direct Binary Downloads */}
        <section className="p-6 rounded-2xl border border-line bg-[#0e0c13]/70 space-y-4">
          <h2 className="text-[20px] font-bold text-bone">
            3. Manual Binary Download
          </h2>
          <p className="text-mute text-[14.5px] leading-relaxed">
            Precompiled standalone binaries are available on GitHub Releases for
            every major architecture:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-line bg-[#15131b]">
              <div className="font-bold text-[15px] text-bone">macOS</div>
              <div className="text-[12.5px] text-mute mt-1">
                Apple Silicon (M1/M2/M3) & Intel x86_64
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-line bg-[#15131b]">
              <div className="font-bold text-[15px] text-bone">Linux</div>
              <div className="text-[12.5px] text-mute mt-1">
                x86_64 & ARM64 (aarch64)
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-line bg-[#15131b]">
              <div className="font-bold text-[15px] text-bone">Windows</div>
              <div className="text-[12.5px] text-mute mt-1">
                x86_64 executable (.exe)
              </div>
            </div>
          </div>
        </section>

        {/* Verifying Installation */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-bold text-bone">
            Verifying Installation
          </h2>
          <p className="text-mute text-[14.5px] leading-relaxed">
            Verify that autocurl is accessible in your current shell path:
          </p>
          <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13.5px] text-bone">
            <div><span className="text-sun">$</span> autocurl --version</div>
            <div className="text-mute mt-1">autocurl 0.1.0 (x86_64-apple-darwin)</div>
          </div>
        </section>

        {/* Requirements */}
        <section className="p-5 rounded-xl border border-sun/20 bg-sun/5 space-y-2">
          <div className="font-mono text-sun text-[13px] font-bold uppercase tracking-wider">
            System Requirements
          </div>
          <p className="text-[14px] text-mute leading-relaxed">
            autocurl relies on the standard <code className="text-bone">curl</code> binary
            installed on your machine. Ensure that <code className="text-bone">curl</code> is
            available in your PATH (which is default on macOS, modern Linux, and Windows 10/11).
          </p>
        </section>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-line flex justify-between items-center">
          <Link
            href="/docs/getting-started"
            className="text-[14px] text-mute hover:text-bone underline"
          >
            ← Quickstart Guide
          </Link>
          <Link
            href="/docs/usage"
            className="text-[15px] font-bold text-sun hover:underline"
          >
            CLI Usage & Terminal Picker →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
