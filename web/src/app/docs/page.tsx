import type { Metadata } from "next";
import Link from "next/link";
import DocsLayout from "@/components/DocsLayout";

export const metadata: Metadata = {
  title: "Documentation Overview - Architecture & Concepts",
  description:
    "Comprehensive documentation for autocurl CLI. Learn how autocurl compiles JavaScript request definitions into plain .acr curl files and executes them in your terminal.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "autocurl Documentation - Overview & Concepts",
    description:
      "Learn the core architecture, workflow, and developer philosophy of the autocurl CLI tool.",
    url: "/docs",
  },
};

export default function DocsOverviewPage() {
  return (
    <DocsLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs" },
        { label: "Overview" },
      ]}
      currentSlug="/docs"
    >
      <div className="space-y-8">
        <div>
          <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
            Documentation
          </div>
          <h1 className="font-extrabold text-[clamp(30px,4.5vw,46px)] leading-[1.1] tracking-[-0.03em] text-bone">
            autocurl Documentation
          </h1>
          <p className="mt-4 text-mute text-[17px] sm:text-[18px] leading-relaxed max-w-[44em]">
            autocurl is a local-first, developer-friendly command-line tool that
            simplifies generating, organizing, and executing curl requests.
            Define your API calls in JavaScript, generate plain{" "}
            <code className="text-bone">.acr</code> files, and run them with an
            interactive terminal selector.
          </p>
        </div>

        {/* Core Architecture */}
        <section className="p-6 sm:p-8 rounded-2xl border border-line bg-[#0e0c13]/70">
          <h2 className="text-[22px] font-bold text-bone mb-3">
            Core Architecture: Separation of Concerns
          </h2>
          <p className="text-mute text-[15px] leading-relaxed mb-6">
            Traditional API tools either force you into heavy GUI applications
            with proprietary cloud databases, or leave you wrestling with
            unwieldy, unquoted bash strings. autocurl separates the request
            lifecycle into three distinct, transparent phases:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-line/60 bg-[rgba(21,19,27,0.8)]">
              <div className="font-mono text-sun text-[12px] font-semibold mb-1">
                Phase 1: Definition
              </div>
              <h3 className="font-bold text-[16px] text-bone mb-2">
                Code (index.js)
              </h3>
              <p className="text-mute text-[13.5px] leading-relaxed">
                Structured JavaScript array containing endpoint URLs, HTTP
                methods, headers, and request bodies. Fully programmable and
                clean.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line/60 bg-[rgba(21,19,27,0.8)]">
              <div className="font-mono text-sun text-[12px] font-semibold mb-1">
                Phase 2: Representation
              </div>
              <h3 className="font-bold text-[16px] text-bone mb-2">
                Plain Text (index.acr)
              </h3>
              <p className="text-mute text-[13.5px] leading-relaxed">
                Clean, human-readable curl commands separated by readable
                headers. Tracked in git, diffable in pull requests, zero lock-in.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line/60 bg-[rgba(21,19,27,0.8)]">
              <div className="font-mono text-sun text-[12px] font-semibold mb-1">
                Phase 3: Execution
              </div>
              <h3 className="font-bold text-[16px] text-bone mb-2">
                Terminal Runner
              </h3>
              <p className="text-mute text-[13.5px] leading-relaxed">
                Interactive keyboard-driven selector or direct command runner
                that delegates directly to native cURL on your machine.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links Grid */}
        <section>
          <h2 className="text-[22px] font-bold text-bone mb-4">
            Documentation Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/docs/getting-started"
              className="p-5 rounded-xl border border-line bg-[rgba(21,19,27,0.6)] hover:border-sun/40 hover:bg-[rgba(21,19,27,0.9)] transition-all no-underline block"
            >
              <div className="font-mono text-sun text-[12px] font-semibold mb-1">
                Quickstart
              </div>
              <h3 className="text-[17px] font-bold text-bone mb-1">
                Getting Started →
              </h3>
              <p className="text-mute text-[14px]">
                Create your first request file, compile it, and run your first
                curl command in 2 minutes.
              </p>
            </Link>

            <Link
              href="/docs/installation"
              className="p-5 rounded-xl border border-line bg-[rgba(21,19,27,0.6)] hover:border-sun/40 hover:bg-[rgba(21,19,27,0.9)] transition-all no-underline block"
            >
              <div className="font-mono text-sun text-[12px] font-semibold mb-1">
                Setup
              </div>
              <h3 className="text-[17px] font-bold text-bone mb-1">
                Installation Methods →
              </h3>
              <p className="text-mute text-[14px]">
                Install via Homebrew, shell script, or binary download for
                macOS, Linux, and Windows.
              </p>
            </Link>

            <Link
              href="/docs/usage"
              className="p-5 rounded-xl border border-line bg-[rgba(21,19,27,0.6)] hover:border-sun/40 hover:bg-[rgba(21,19,27,0.9)] transition-all no-underline block"
            >
              <div className="font-mono text-sun text-[12px] font-semibold mb-1">
                CLI
              </div>
              <h3 className="text-[17px] font-bold text-bone mb-1">
                CLI Usage & Interactive Runner →
              </h3>
              <p className="text-mute text-[14px]">
                Master the terminal request selector, fuzzy search, dry-run
                mode, and CLI flags.
              </p>
            </Link>

            <Link
              href="/docs/acr-format"
              className="p-5 rounded-xl border border-line bg-[rgba(21,19,27,0.6)] hover:border-sun/40 hover:bg-[rgba(21,19,27,0.9)] transition-all no-underline block"
            >
              <div className="font-mono text-sun text-[12px] font-semibold mb-1">
                Format
              </div>
              <h3 className="text-[17px] font-bold text-bone mb-1">
                .acr File Format Spec →
              </h3>
              <p className="text-mute text-[14px]">
                Understand comment delimiters, multi-line arguments, JSON body
                escaping, and git diffing.
              </p>
            </Link>

            <Link
              href="/docs/commands"
              className="p-5 rounded-xl border border-line bg-[rgba(21,19,27,0.6)] hover:border-sun/40 hover:bg-[rgba(21,19,27,0.9)] transition-all no-underline block"
            >
              <div className="font-mono text-sun text-[12px] font-semibold mb-1">
                Reference
              </div>
              <h3 className="text-[17px] font-bold text-bone mb-1">
                Command Reference →
              </h3>
              <p className="text-mute text-[14px]">
                Full table of CLI options, environment variable inheritance, and
                standard exit codes.
              </p>
            </Link>

            <Link
              href="/docs/examples"
              className="p-5 rounded-xl border border-line bg-[rgba(21,19,27,0.6)] hover:border-sun/40 hover:bg-[rgba(21,19,27,0.9)] transition-all no-underline block"
            >
              <div className="font-mono text-sun text-[12px] font-semibold mb-1">
                Workflows
              </div>
              <h3 className="text-[17px] font-bold text-bone mb-1">
                Real-World API Examples →
              </h3>
              <p className="text-mute text-[14px]">
                Authentication tokens, multipart file uploads, query parameters,
                and webhook debugging.
              </p>
            </Link>
          </div>
        </section>

        {/* Why developers choose autocurl */}
        <section className="space-y-4">
          <h2 className="text-[22px] font-bold text-bone">
            Why Developers Use autocurl
          </h2>
          <div className="space-y-3 text-mute text-[15px] leading-relaxed">
            <p>
              Developers reach for curl because it is universally available,
              fast, and has no moving parts. However, managing 20+ curl commands
              in Markdown files, scratchpads, or shell histories is painful.
              Flags are forgotten, quotes are corrupted, and tokens are
              accidentally overwritten.
            </p>
            <p>
              GUI clients like Postman or Insomnia solve organization, but at
              the expense of hundreds of megabytes of RAM, forced account
              logins, cloud storage of private endpoints, and opaque JSON export
              files that break git merges.
            </p>
            <p>
              <strong className="text-bone">autocurl</strong> gives you the best
              of both worlds: structured request authoring in JavaScript,
              plain-text curl storage on your disk, and an instant terminal
              runner.
            </p>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
