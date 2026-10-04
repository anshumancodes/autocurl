import type { Metadata } from "next";
import Link from "next/link";
import DocsLayout from "@/components/DocsLayout";

export const metadata: Metadata = {
  title: "CLI Usage & Terminal Picker - autocurl Guide",
  description:
    "Learn how to use the autocurl CLI, operate the interactive terminal request selector, fuzzy search requests, and run requests in dry-run mode.",
  alternates: {
    canonical: "/docs/usage",
  },
  openGraph: {
    title: "CLI Usage & Terminal Picker Guide - autocurl",
    description:
      "Master keyboard shortcuts, fuzzy filtering, and CLI execution modes with autocurl.",
    url: "/docs/usage",
  },
};

export default function UsagePage() {
  return (
    <DocsLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs" },
        { label: "CLI Usage" },
      ]}
      currentSlug="/docs/usage"
    >
      <div className="space-y-8">
        <div>
          <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
            CLI Guide
          </div>
          <h1 className="font-extrabold text-[clamp(28px,4vw,42px)] leading-[1.1] tracking-[-0.03em] text-bone">
            CLI Usage & Terminal Picker
          </h1>
          <p className="mt-3 text-mute text-[16px] sm:text-[17px] leading-relaxed max-w-[42em]">
            autocurl adapts to the file format you provide: give it a JavaScript
            definition file to compile curl commands, or give it an{" "}
            <code className="text-bone">.acr</code> file to launch the
            interactive request picker.
          </p>
        </div>

        {/* The Two Modes */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-bone">
            The Two Execution Modes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-line bg-[#0e0c13]/70">
              <div className="font-mono text-sun text-[12.5px] font-semibold mb-1">
                Mode 1: Generator
              </div>
              <h3 className="font-bold text-[17px] text-bone mb-2">
                Compiling JavaScript to Curl
              </h3>
              <p className="text-mute text-[14px] leading-relaxed mb-3">
                Reads an array of request objects from your JavaScript file and
                writes the compiled curl commands to a matching{" "}
                <code className="text-bone">.acr</code> file.
              </p>
              <div className="bg-[#15131b] border border-line rounded-lg p-3 font-mono text-[13px] text-sun">
                $ autocurl index.js
              </div>
            </div>

            <div className="p-5 rounded-xl border border-line bg-[#0e0c13]/70">
              <div className="font-mono text-sun text-[12.5px] font-semibold mb-1">
                Mode 2: Runner
              </div>
              <h3 className="font-bold text-[17px] text-bone mb-2">
                Interactive Terminal Selector
              </h3>
              <p className="text-mute text-[14px] leading-relaxed mb-3">
                Parses an existing <code className="text-bone">.acr</code> file,
                displays every request in an interactive terminal menu, and
                executes the one you choose.
              </p>
              <div className="bg-[#15131b] border border-line rounded-lg p-3 font-mono text-[13px] text-sun">
                $ autocurl index.acr
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard Navigation */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-bone">
            Terminal Picker Controls
          </h2>
          <p className="text-mute text-[15px] leading-relaxed">
            When running in interactive mode, use the following standard
            terminal keyboard navigation:
          </p>

          <div className="border border-line rounded-xl overflow-hidden">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#15131b] border-b border-line text-bone font-mono text-[13px]">
                <tr>
                  <th className="py-3 px-4">Key / Action</th>
                  <th className="py-3 px-4">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-[#0e0c13]/60 text-mute">
                <tr>
                  <td className="py-3 px-4 font-mono text-sun">↑ / k</td>
                  <td className="py-3 px-4">Move selection up</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-sun">↓ / j</td>
                  <td className="py-3 px-4">Move selection down</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-sun">Enter</td>
                  <td className="py-3 px-4">Execute highlighted request via cURL</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-sun">[Type text]</td>
                  <td className="py-3 px-4">
                    Fuzzy filter requests by title or endpoint name
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-sun">Esc / Ctrl+C</td>
                  <td className="py-3 px-4">Exit picker without running requests</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Direct Execution Without Selector */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-bold text-bone">
            Direct Execution (Bypassing the Selector)
          </h2>
          <p className="text-mute text-[15px] leading-relaxed">
            For scripts, shell aliases, or CI/CD pipelines, you can run a
            specific request directly by name using the{" "}
            <code className="text-sun">-r</code> or{" "}
            <code className="text-sun">--run</code> flag:
          </p>
          <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13.5px] text-bone">
            <span className="text-sun">$</span> autocurl --run &quot;List users&quot; index.acr
          </div>
        </section>

        {/* Dry Run Mode */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-bold text-bone">
            Dry Run Mode (Inspect Without Executing)
          </h2>
          <p className="text-mute text-[15px] leading-relaxed">
            Need to see the exact curl command that will be fired before sending
            network packets to production? Pass the{" "}
            <code className="text-sun">--dry-run</code> flag:
          </p>
          <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13.5px] text-bone">
            <div><span className="text-sun">$</span> autocurl --dry-run index.acr</div>
            <div className="text-mute mt-2">
              curl -X POST &quot;https://api.dev/users&quot; \
              <br />
              {"  "}-H &quot;Content-Type: application/json&quot; \
              <br />
              {"  "}-d &#39;&#123;&quot;name&quot;:&quot;Ada&quot;&#125;&#39;
            </div>
          </div>
        </section>

        {/* Environment Variables */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-bold text-bone">
            Using Environment Variables
          </h2>
          <p className="text-mute text-[15px] leading-relaxed">
            Because autocurl compiles JavaScript code into curl, you can use
            standard Node.js <code className="text-bone">process.env</code> in
            your <code className="text-bone">index.js</code> file:
          </p>
          <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13px] leading-[1.65] text-bone overflow-x-auto">
            {`const API_URL = process.env.API_URL || "http://localhost:3000";
const TOKEN = process.env.AUTH_TOKEN || "test-token";

export default [
  {
    name: "Get Authenticated User",
    method: "GET",
    url: \`\${API_URL}/me\`,
    headers: {
      "Authorization": \`Bearer \${TOKEN}\`
    }
  }
];`}
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-line flex justify-between items-center">
          <Link
            href="/docs/installation"
            className="text-[14px] text-mute hover:text-bone underline"
          >
            ← Installation Guide
          </Link>
          <Link
            href="/docs/acr-format"
            className="text-[15px] font-bold text-sun hover:underline"
          >
            .acr File Format Spec →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
