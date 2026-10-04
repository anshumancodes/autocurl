import type { Metadata } from "next";
import Link from "next/link";
import DocsLayout from "@/components/DocsLayout";

export const metadata: Metadata = {
  title: ".acr File Format Specification - autocurl Format Guide",
  description:
    "Learn the complete specification for the .acr file format. Understand how autocurl organizes plain-text curl commands for git version control and terminal execution.",
  alternates: {
    canonical: "/docs/acr-format",
  },
  openGraph: {
    title: ".acr File Format Specification - autocurl",
    description:
      "Deep dive into the .acr plain-text curl file format: syntax, git diffing, headers, and portability.",
    url: "/docs/acr-format",
  },
};

export default function AcrFormatPage() {
  return (
    <DocsLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs" },
        { label: ".acr File Format" },
      ]}
      currentSlug="/docs/acr-format"
    >
      <div className="space-y-8">
        <div>
          <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
            File Format Specification
          </div>
          <h1 className="font-extrabold text-[clamp(28px,4vw,42px)] leading-[1.1] tracking-[-0.03em] text-bone">
            The .acr File Format Specification
          </h1>
          <p className="mt-3 text-mute text-[16px] sm:text-[17px] leading-relaxed max-w-[42em]">
            An <code className="text-bone">.acr</code> (autocurl request) file is
            a human-readable, plain-text format designed to store reproducible
            cURL requests in version control.
          </p>
        </div>

        {/* Anatomy of an .acr file */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-bone">
            Anatomy of an .acr File
          </h2>
          <p className="text-mute text-[15px] leading-relaxed">
            Every request in an <code className="text-bone">.acr</code> file
            consists of a comment block followed by a standard, multi-line cURL
            command.
          </p>

          <div className="bg-[#0e0c13] border border-line rounded-xl p-5 font-mono text-[13.5px] leading-[1.7] overflow-x-auto text-bone">
            <span className="text-mute"># 1. Comment header acts as the request label</span>
            <br />
            <span className="text-sun"># Create New Organization</span>
            <br />
            <span className="text-sky">curl</span> -X POST \
            <br />
            {"  "}&quot;https://api.example.com/v1/organizations&quot; \
            <br />
            {"  "}-H &quot;Authorization: Bearer dev_token_xyz&quot; \
            <br />
            {"  "}-H &quot;Content-Type: application/json&quot; \
            <br />
            {"  "}-d &#39;&#123;&quot;name&quot;: &quot;Acme Corp&quot;, &quot;plan&quot;: &quot;pro&quot;&#125;&#39;
            <br />
            <br />
            <span className="text-sun"># Get Current User</span>
            <br />
            <span className="text-sky">curl</span> -X GET \
            <br />
            {"  "}&quot;https://api.example.com/v1/me&quot; \
            <br />
            {"  "}-H &quot;Authorization: Bearer dev_token_xyz&quot;
          </div>
        </section>

        {/* Formatting Rules */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-bone">
            Syntax & Formatting Rules
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
              <h3 className="font-bold text-[16px] text-bone mb-1">
                1. Request Names
              </h3>
              <p className="text-mute text-[14px] leading-relaxed">
                A line beginning with <code className="text-sun"># [Name]</code>{" "}
                defines the title of the request displayed in the interactive
                CLI picker. If omitted, autocurl defaults to the HTTP method and
                URL path.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
              <h3 className="font-bold text-[16px] text-bone mb-1">
                2. Multi-line Continuations
              </h3>
              <p className="text-mute text-[14px] leading-relaxed">
                Commands use standard POSIX backslash line continuations (
                <code className="text-sun">\</code>). This keeps headers and
                payloads formatted on separate lines for clean git diffs.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
              <h3 className="font-bold text-[16px] text-bone mb-1">
                3. Quoting Standards
              </h3>
              <p className="text-mute text-[14px] leading-relaxed">
                URLs and HTTP header values are enclosed in double quotes (
                <code className="text-sun">&quot;...&quot;</code>). JSON payloads
                and request bodies are enclosed in single quotes (
                <code className="text-sun">&#39;...&#39;</code>) to avoid
                accidental shell interpolation.
              </p>
            </div>
          </div>
        </section>

        {/* Git-diff comparison */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-bone">
            Why .acr is Superior to Postman JSON in Git
          </h2>
          <p className="text-mute text-[15px] leading-relaxed">
            When teams check Postman or Insomnia collections into git, even a
            tiny URL edit produces a massive diff with generated UUIDs and
            nested JSON arrays. In contrast, an <code className="text-bone">.acr</code>{" "}
            file produces an exact, readable 1-line diff:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 font-mono text-[12px] leading-relaxed">
              <div className="text-red-400 font-bold mb-2">❌ Postman JSON Export Diff</div>
              <div className="text-mute">
                {"@@ -124,18 +124,18 @@"}<br />
                {'- "id": "4a71f08e-28c9-4b61-9c88-29bf33ef4a01",'}<br />
                {'+ "id": "b93c8d10-38e2-47c1-8419-f538e19e0b12",'}<br />
                {'- "raw": "https://api.dev/v1/users",'}<br />
                {'+ "raw": "https://api.dev/v2/users",'}<br />
                {'- "updatedAt": "2026-10-02T18:24:00Z",'}<br />
                {'+ "updatedAt": "2026-10-03T09:12:00Z"'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 font-mono text-[12px] leading-relaxed">
              <div className="text-emerald-400 font-bold mb-2">✔ .acr Plain Text Diff</div>
              <div className="text-mute">
                {"@@ -3,2 +3,2 @@ # List users"}<br />
                <span className="text-red-400">- curl -X GET &quot;https://api.dev/v1/users&quot;</span><br />
                <span className="text-emerald-400">+ curl -X GET &quot;https://api.dev/v2/users&quot;</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-line flex justify-between items-center">
          <Link
            href="/docs/usage"
            className="text-[14px] text-mute hover:text-bone underline"
          >
            ← CLI Usage Guide
          </Link>
          <Link
            href="/docs/commands"
            className="text-[15px] font-bold text-sun hover:underline"
          >
            CLI Command Reference →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
