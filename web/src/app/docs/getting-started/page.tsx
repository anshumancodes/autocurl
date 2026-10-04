import type { Metadata } from "next";
import Link from "next/link";
import DocsLayout from "@/components/DocsLayout";
import CopyButton from "@/components/CopyButton";

export const metadata: Metadata = {
  title: "Getting Started with autocurl - 2-Minute Quickstart Guide",
  description:
    "Learn how to install autocurl, define your API requests in JavaScript, compile to .acr format, and execute requests directly from your terminal.",
  alternates: {
    canonical: "/docs/getting-started",
  },
  openGraph: {
    title: "Getting Started with autocurl - Quickstart Guide",
    description:
      "Step-by-step tutorial on defining, compiling, and running curl requests with autocurl CLI.",
    url: "/docs/getting-started",
  },
};

export default function GettingStartedPage() {
  return (
    <DocsLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs" },
        { label: "Getting Started" },
      ]}
      currentSlug="/docs/getting-started"
    >
      <div className="space-y-8">
        <div>
          <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
            Quickstart Tutorial
          </div>
          <h1 className="font-extrabold text-[clamp(28px,4vw,42px)] leading-[1.1] tracking-[-0.03em] text-bone">
            Getting Started with autocurl
          </h1>
          <p className="mt-3 text-mute text-[16px] sm:text-[17px] leading-relaxed max-w-[42em]">
            This guide walks you through setting up autocurl, defining your
            first request collection in JavaScript, generating human-readable
            curl commands, and executing requests interactively.
          </p>
        </div>

        {/* Step 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-sun text-ink font-mono font-bold text-[14px] flex items-center justify-center shrink-0">
              1
            </span>
            <h2 className="text-[20px] font-bold text-bone">Install autocurl</h2>
          </div>
          <p className="text-mute text-[15px] leading-relaxed pl-10">
            If you are on macOS or Linux with Homebrew installed, run:
          </p>
          <div className="pl-10">
            <div className="inline-flex max-w-full flex-wrap gap-3 items-center font-mono text-[14px] bg-[#0e0c13] border border-line rounded-lg px-4 py-3">
              <span>brew install autocurl</span>
              <CopyButton text="brew install autocurl" />
            </div>
            <p className="mt-2 text-[13px] text-mute">
              For Linux binaries, Windows, or curl installation scripts, see the{" "}
              <Link
                href="/docs/installation"
                className="text-sun hover:underline"
              >
                full installation guide
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Step 2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-sun text-ink font-mono font-bold text-[14px] flex items-center justify-center shrink-0">
              2
            </span>
            <h2 className="text-[20px] font-bold text-bone">
              Define your API requests in JavaScript
            </h2>
          </div>
          <p className="text-mute text-[15px] leading-relaxed pl-10">
            Create a file named <code className="text-bone">requests.js</code> (or{" "}
            <code className="text-bone">index.js</code>) in your project root.
            Export an array of request objects:
          </p>
          <div className="pl-10">
            <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] overflow-x-auto text-bone">
              {`// requests.js
export default [
  {
    name: "Health Check",
    method: "GET",
    url: "https://api.github.com/zen"
  },
  {
    name: "Fetch User Profile",
    method: "GET",
    url: "https://api.github.com/users/octocat",
    headers: {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "autocurl-client"
    }
  },
  {
    name: "Create Test Issue",
    method: "POST",
    url: "https://httpbin.org/post",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      title: "Found a bug in API",
      severity: "medium"
    }
  }
];`}
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-sun text-ink font-mono font-bold text-[14px] flex items-center justify-center shrink-0">
              3
            </span>
            <h2 className="text-[20px] font-bold text-bone">
              Compile to plain .acr curl file
            </h2>
          </div>
          <p className="text-mute text-[15px] leading-relaxed pl-10">
            Run the generator command against your JavaScript file:
          </p>
          <div className="pl-10">
            <div className="inline-flex max-w-full flex-wrap gap-3 items-center font-mono text-[14px] bg-[#0e0c13] border border-line rounded-lg px-4 py-3 mb-3">
              <span>autocurl requests.js</span>
              <CopyButton text="autocurl requests.js" />
            </div>
            <p className="text-mute text-[14px] mb-3">
              autocurl reads the definitions and creates{" "}
              <code className="text-sun">requests.acr</code>:
            </p>
            <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] overflow-x-auto text-bone">
              {`# Health Check
curl -X GET \\
  "https://api.github.com/zen"

# Fetch User Profile
curl -X GET \\
  "https://api.github.com/users/octocat" \\
  -H "Accept: application/vnd.github.v3+json" \\
  -H "User-Agent: autocurl-client"

# Create Test Issue
curl -X POST \\
  "https://httpbin.org/post" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Found a bug in API","severity":"medium"}'`}
            </div>
          </div>
        </section>

        {/* Step 4 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-sun text-ink font-mono font-bold text-[14px] flex items-center justify-center shrink-0">
              4
            </span>
            <h2 className="text-[20px] font-bold text-bone">
              Pick and execute interactively
            </h2>
          </div>
          <p className="text-mute text-[15px] leading-relaxed pl-10">
            Now pass the generated <code className="text-bone">.acr</code> file
            to autocurl:
          </p>
          <div className="pl-10">
            <div className="inline-flex max-w-full flex-wrap gap-3 items-center font-mono text-[14px] bg-[#0e0c13] border border-line rounded-lg px-4 py-3 mb-3">
              <span>autocurl requests.acr</span>
              <CopyButton text="autocurl requests.acr" />
            </div>
            <p className="text-mute text-[14px] mb-3">
              autocurl opens an interactive prompt in your terminal:
            </p>
            <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] overflow-x-auto text-bone">
              {`? Select a request to run:
  ❯ Health Check
    Fetch User Profile
    Create Test Issue

(Press ↑/↓ to move, Enter to execute, Ctrl+C to exit)`}
            </div>
            <p className="text-mute text-[14px] mt-3">
              Select an item and press <kbd className="font-mono text-sun">Enter</kbd>.
              autocurl invokes standard cURL and displays the response status,
              headers, and response body directly in stdout.
            </p>
          </div>
        </section>

        {/* Next Steps */}
        <div className="pt-6 border-t border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-[13px] text-mute uppercase font-mono tracking-wider">
              Next Step
            </div>
            <Link
              href="/docs/usage"
              className="text-[17px] font-bold text-sun hover:underline"
            >
              Explore CLI Usage & Keyboard Navigation →
            </Link>
          </div>
          <Link
            href="/docs/acr-format"
            className="text-[14px] text-mute hover:text-bone underline"
          >
            Learn about .acr syntax
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
