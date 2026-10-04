import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import CopyButton from "@/components/CopyButton";

export const metadata: Metadata = {
  title: "Curl Command Generator: How to Generate Reproducible Curl Commands",
  description:
    "Learn how to generate clean, reproducible curl commands from code and structured objects. Avoid quote-escaping bugs, protect API secrets, and automate cURL with autocurl.",
  alternates: {
    canonical: "/curl-command-generator",
  },
  openGraph: {
    title: "Curl Command Generator: How to Generate Reproducible Curl Commands",
    description:
      "A developer guide on generating clean, multi-line curl commands from JavaScript and structured API definitions.",
    url: "/curl-command-generator",
  },
};

export default function CurlCommandGeneratorPage() {
  return (
    <>
      <div className="bg" aria-hidden="true"></div>
      <Navbar />

      <main className="max-w-230 mx-auto px-6 py-10 sm:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: "/docs" },
            { label: "Curl Command Generator" },
          ]}
        />

        <header className="mb-10">
          <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
            Developer Guide
          </div>
          <h1 className="font-extrabold text-[clamp(30px,4.5vw,48px)] leading-[1.1] tracking-[-0.03em] text-bone">
            Curl Command Generator: How to Generate Reproducible Curl Commands
          </h1>
          <p className="mt-4 text-mute text-[17px] sm:text-[18px] leading-relaxed">
            Every backend engineer has experienced the frustration of manually
            assembling curl commands in shell scripts or documentation. From
            mangled JSON quotes to accidental secret leaks, manual string
            concatenation is brittle. Here is how modern developers generate
            reproducible, readable cURL commands automatically.
          </p>
        </header>

        <div className="space-y-10 text-[15px] sm:text-[16px] text-mute leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-bone">
              The Pain of Manual Curl Command Construction
            </h2>
            <p>
              cURL is the universal lingua franca of HTTP networking. However,
              when you need to send an authenticated POST request with headers and
              a nested JSON payload, writing the command by hand in bash quickly
              becomes error-prone:
            </p>

            <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] text-red-300 overflow-x-auto">
              {`# Brittle manual string escaping in bash:
curl -X POST "https://api.dev/v1/users" \\
  -H "Authorization: Bearer "$API_KEY"" \\ # Broken quote escaping
  -H "Content-Type: application/json" \\
  -d "{\"user\": {\"name\": \"Ada Lovelace\", \"role\": \"admin\"}}"`}
            </div>

            <p>Common issues with manual curl construction include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-bone">Escaping hell:</strong> Mixing single
                quotes, double quotes, and shell variable expansions frequently
                results in malformed JSON payloads.
              </li>
              <li>
                <strong className="text-bone">Secret leakage:</strong> Hardcoding API
                keys into ad-hoc shell commands pollutes your shell history (`~/.bash_history`).
              </li>
              <li>
                <strong className="text-bone">Formatting drift:</strong> Team members
                format flags differently (`-X POST` vs `--request POST`, `-d` vs
                `--data-raw`), making pull request reviews noisy.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-bone">
              The Solution: Code-First Request Generation
            </h2>
            <p>
              Instead of manually stitching strings together in bash or notepad,
              define your requests as structured data in JavaScript or TypeScript.
              This guarantees that query parameters are properly encoded, JSON
              bodies are syntactically valid, and header formatting is
              consistent.
            </p>
            <p>
              With <strong className="text-bone">autocurl</strong>, you define an
              array of request objects in a standard JS file:
            </p>

            <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] text-bone overflow-x-auto">
              {`// requests.js
export default [
  {
    name: "Create User",
    method: "POST",
    url: "https://api.dev/v1/users",
    headers: {
      "Authorization": "Bearer dev_token",
      "Content-Type": "application/json"
    },
    body: {
      user: {
        name: "Ada Lovelace",
        role: "admin"
      }
    }
  }
];`}
            </div>

            <p>Then generate the clean curl commands with a single CLI command:</p>

            <div className="flex max-w-full flex-wrap gap-3 items-center font-mono text-[14px] bg-[#0e0c13] border border-line rounded-lg px-4 py-3">
              <span>autocurl requests.js</span>
              <CopyButton text="autocurl requests.js" />
            </div>

            <p>
              autocurl compiles the code into a clean, human-readable{" "}
              <code className="text-sun">requests.acr</code> file:
            </p>

            <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] text-sun overflow-x-auto">
              {`# Create User
curl -X POST \\
  "https://api.dev/v1/users" \\
  -H "Authorization: Bearer dev_token" \\
  -H "Content-Type: application/json" \\
  -d '{"user":{"name":"Ada Lovelace","role":"admin"}}'`}
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-bone">
              Why Generate Curl Instead of Using GUI Export Features?
            </h2>
            <p>
              Many GUI clients offer &ldquo;Copy as cURL&rdquo; buttons. While
              useful for one-off debugging, this workflow does not scale for
              teams:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
                <h3 className="font-bold text-bone text-[16px] mb-2">
                  GUI Export Drawbacks
                </h3>
                <p className="text-[13.5px] text-mute leading-relaxed">
                  Requires opening a heavyweight app, navigating menus, clicking
                  export, and leaves no audit trail or git history. Commands rot
                  as endpoints change.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
                <h3 className="font-bold text-bone text-[16px] mb-2">
                  autocurl Generator Advantages
                </h3>
                <p className="text-[13.5px] text-mute leading-relaxed">
                  Version-controlled right in the repository. Running{" "}
                  <code className="text-sun">autocurl index.js</code> regenerates
                  the entire collection in milliseconds.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl border border-sun/20 bg-sun/5 space-y-3">
            <h2 className="text-[19px] font-bold text-sun">
              Start Generating Curl Commands with autocurl
            </h2>
            <p className="text-[14.5px] text-mute leading-relaxed">
              Install autocurl via Homebrew and start managing curl requests as
              reproducible code today.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/docs/getting-started"
                className="px-4 py-2 rounded-lg bg-sun text-ink font-semibold text-[14px] hover:brightness-105 transition-all no-underline"
              >
                Read Quickstart Tutorial
              </Link>
              <Link
                href="/docs/acr-format"
                className="px-4 py-2 rounded-lg bg-[rgba(21,19,27,0.8)] border border-line text-bone font-medium text-[14px] hover:border-sun/40 transition-all no-underline"
              >
                Explore .acr Format
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
