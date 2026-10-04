import type { Metadata } from "next";
import Link from "next/link";
import DocsLayout from "@/components/DocsLayout";

export const metadata: Metadata = {
  title: "CLI Command Reference & Options - autocurl Manual",
  description:
    "Complete command-line interface reference for autocurl. Inspect all flags, options, exit codes, and environment variables.",
  alternates: {
    canonical: "/docs/commands",
  },
  openGraph: {
    title: "autocurl CLI Command Reference & Flags",
    description:
      "Full reference manual of autocurl commands, options, and exit codes.",
    url: "/docs/commands",
  },
};

export default function CommandsPage() {
  return (
    <DocsLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs" },
        { label: "Commands" },
      ]}
      currentSlug="/docs/commands"
    >
      <div className="space-y-8">
        <div>
          <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
            Reference Manual
          </div>
          <h1 className="font-extrabold text-[clamp(28px,4vw,42px)] leading-[1.1] tracking-[-0.03em] text-bone">
            CLI Command Reference
          </h1>
          <p className="mt-3 text-mute text-[16px] sm:text-[17px] leading-relaxed max-w-[42em]">
            Detailed synopsis, command-line arguments, flags, and exit codes for
            the <code className="text-bone">autocurl</code> binary.
          </p>
        </div>

        {/* Synopsis */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-bold text-bone">Synopsis</h2>
          <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[14px] text-sun">
            autocurl [file] [options]
          </div>
        </section>

        {/* Options Table */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-bone">Flags & Options</h2>

          <div className="border border-line rounded-xl overflow-hidden">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#15131b] border-b border-line text-bone font-mono text-[13px]">
                <tr>
                  <th className="py-3 px-4">Flag</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-[#0e0c13]/60 text-mute">
                <tr>
                  <td className="py-3.5 px-4 font-mono text-sun">[file]</td>
                  <td className="py-3.5 px-4 font-mono text-[12.5px]">String</td>
                  <td className="py-3.5 px-4">
                    Path to definition (<code className="text-bone">.js</code>)
                    or compiled (<code className="text-bone">.acr</code>) file.
                    Defaults to <code className="text-bone">index.js</code> or{" "}
                    <code className="text-bone">index.acr</code> if omitted.
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-sun">-r, --run &lt;name&gt;</td>
                  <td className="py-3.5 px-4 font-mono text-[12.5px]">String</td>
                  <td className="py-3.5 px-4">
                    Execute a request by its name immediately without opening the
                    interactive terminal picker.
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-sun">-d, --dry-run</td>
                  <td className="py-3.5 px-4 font-mono text-[12.5px]">Boolean</td>
                  <td className="py-3.5 px-4">
                    Print the fully formatted curl command to stdout instead of
                    sending network packets.
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-sun">-g, --generate</td>
                  <td className="py-3.5 px-4 font-mono text-[12.5px]">Boolean</td>
                  <td className="py-3.5 px-4">
                    Compile the input JavaScript file to .acr and exit
                    immediately.
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-sun">--filter &lt;query&gt;</td>
                  <td className="py-3.5 px-4 font-mono text-[12.5px]">String</td>
                  <td className="py-3.5 px-4">
                    Launch the terminal picker pre-filtered with the matching
                    search query.
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-sun">-v, --verbose</td>
                  <td className="py-3.5 px-4 font-mono text-[12.5px]">Boolean</td>
                  <td className="py-3.5 px-4">
                    Instruct cURL to print verbose request and response header
                    diagnostics (<code className="text-bone">curl -v</code>).
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-sun">-V, --version</td>
                  <td className="py-3.5 px-4 font-mono text-[12.5px]">Boolean</td>
                  <td className="py-3.5 px-4">
                    Display installed autocurl version and system architecture.
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono text-sun">-h, --help</td>
                  <td className="py-3.5 px-4 font-mono text-[12.5px]">Boolean</td>
                  <td className="py-3.5 px-4">
                    Display help information and command syntax.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Exit Codes */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-bone">Exit Codes</h2>
          <p className="text-mute text-[15px] leading-relaxed">
            autocurl follows standard UNIX exit code conventions for clean
            integration in bash scripts and CI runners:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
              <div className="font-mono text-emerald-400 font-bold text-[16px]">
                0 (SUCCESS)
              </div>
              <p className="text-mute text-[13px] mt-1">
                The command or HTTP request completed without error.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
              <div className="font-mono text-red-400 font-bold text-[16px]">
                1 (ERROR)
              </div>
              <p className="text-mute text-[13px] mt-1">
                cURL execution failed or returned a non-2xx status code.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
              <div className="font-mono text-amber-400 font-bold text-[16px]">
                2 (PARSE_ERROR)
              </div>
              <p className="text-mute text-[13px] mt-1">
                The input file could not be read or contains invalid syntax.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-line flex justify-between items-center">
          <Link
            href="/docs/acr-format"
            className="text-[14px] text-mute hover:text-bone underline"
          >
            ← .acr File Format Spec
          </Link>
          <Link
            href="/docs/examples"
            className="text-[15px] font-bold text-sun hover:underline"
          >
            Real-World API Examples →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
