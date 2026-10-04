import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Curl API Testing: How to Test APIs from the Command Line",
  description:
    "A comprehensive developer guide to API testing with curl. Learn how to organize request suites, automate CLI tests, inspect headers, and execute multiple curl requests.",
  alternates: {
    canonical: "/curl-api-testing",
  },
  openGraph: {
    title: "Curl API Testing: How to Test APIs from the Command Line",
    description:
      "Learn best practices for organizing, running, and automating API tests directly from your terminal using cURL and autocurl.",
    url: "/curl-api-testing",
  },
};

export default function CurlApiTestingPage() {
  return (
    <>
      <div className="bg" aria-hidden="true"></div>
      <Navbar />

      <main className="max-w-230 mx-auto px-6 py-10 sm:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: "/docs" },
            { label: "Curl API Testing" },
          ]}
        />

        <header className="mb-10">
          <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
            API Development Guide
          </div>
          <h1 className="font-extrabold text-[clamp(30px,4.5vw,48px)] leading-[1.1] tracking-[-0.03em] text-bone">
            Curl API Testing: How to Test APIs from the Command Line
          </h1>
          <p className="mt-4 text-mute text-[17px] sm:text-[18px] leading-relaxed">
            The terminal is where developers spend most of their time. Switching
            back and forth between your code editor and a bloated desktop API
            client breaks focus. Here is how to organize, test, and automate API
            endpoints using cURL and the autocurl CLI.
          </p>
        </header>

        <div className="space-y-10 text-[15px] sm:text-[16px] text-mute leading-relaxed">
          {/* Why test APIs with curl? */}
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-bone">
              Why Test APIs from the Command Line?
            </h2>
            <p>
              cURL has remained the gold standard for network requests since 1997.
              Modern backend engineers continue to choose cURL for API development
              for three critical reasons:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
                <div className="font-mono text-sun text-[13px] font-bold mb-1">
                  Speed
                </div>
                <h3 className="font-bold text-bone text-[16px] mb-1">
                  Instant Startup
                </h3>
                <p className="text-[13px] text-mute">
                  No loading screens, no framework initialization, zero lag.
                  Requests fire immediately.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
                <div className="font-mono text-sun text-[13px] font-bold mb-1">
                  Portability
                </div>
                <h3 className="font-bold text-bone text-[16px] mb-1">
                  Runs Everywhere
                </h3>
                <p className="text-[13px] text-mute">
                  Works over SSH on staging servers, inside Docker containers,
                  and in headless CI/CD runners.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-line bg-[#0e0c13]/60">
                <div className="font-mono text-sun text-[13px] font-bold mb-1">
                  Transparency
                </div>
                <h3 className="font-bold text-bone text-[16px] mb-1">
                  Zero Hidden Magic
                </h3>
                <p className="text-[13px] text-mute">
                  Inspect exact HTTP headers, TLS handshakes, redirects, and raw
                  byte streams without abstraction.
                </p>
              </div>
            </div>
          </section>

          {/* The Challenge */}
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-bone">
              The Real Challenge: Organizing Curl Requests
            </h2>
            <p>
              The downside of bare cURL has always been management. When you are
              building a REST or GraphQL service with 15 different endpoints,
              keeping track of long curl commands with authorization tokens,
              JSON payloads, and custom headers in text files is disorganized.
            </p>
            <p>
              That is why <strong className="text-bone">autocurl</strong> was
              created: to provide a structured workflow for organizing multiple
              curl requests inside your project repository.
            </p>

            <div className="bg-[#0e0c13] border border-line rounded-xl p-5 font-mono text-[13.5px] leading-[1.7] overflow-x-auto text-bone">
              <span className="text-mute"># endpoints.acr</span>
              <br />
              <span className="text-sun"># 1. Health Ping</span>
              <br />
              curl -s &quot;http://localhost:8080/health&quot;
              <br />
              <br />
              <span className="text-sun"># 2. Get User By ID</span>
              <br />
              curl -X GET &quot;http://localhost:8080/users/123&quot; \
              <br />
              {"  "}-H &quot;Authorization: Bearer $DEV_TOKEN&quot;
              <br />
              <br />
              <span className="text-sun"># 3. Update User Plan</span>
              <br />
              curl -X PATCH &quot;http://localhost:8080/users/123&quot; \
              <br />
              {"  "}-H &quot;Authorization: Bearer $DEV_TOKEN&quot; \
              <br />
              {"  "}-H &quot;Content-Type: application/json&quot; \
              <br />
              {"  "}-d &#39;&#123;&quot;plan&quot;: &quot;enterprise&quot;&#125;&#39;
            </div>
          </section>

          {/* Workflow Patterns */}
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-bone">
              Two Workflows: Interactive vs Automated Testing
            </h2>

            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-line bg-[#0e0c13]/60">
                <h3 className="font-bold text-[17px] text-bone mb-2">
                  1. Interactive Exploratory Testing (Local Development)
                </h3>
                <p className="text-[14.5px] text-mute leading-relaxed mb-3">
                  While coding a new feature, run{" "}
                  <code className="text-sun">autocurl endpoints.acr</code>. Use
                  fuzzy search to instantly jump to your endpoint, press Enter to
                  fire the request, and inspect the response output right in your
                  terminal without leaving your IDE.
                </p>
                <div className="bg-ink border border-line rounded-lg p-3 font-mono text-[13px] text-sun">
                  $ autocurl endpoints.acr
                </div>
              </div>

              <div className="p-5 rounded-xl border border-line bg-[#0e0c13]/60">
                <h3 className="font-bold text-[17px] text-bone mb-2">
                  2. Automated Scripting & Smoke Testing (CI/CD)
                </h3>
                <p className="text-[14.5px] text-mute leading-relaxed mb-3">
                  Execute specific requests directly in automated scripts or
                  pre-commit hooks using the <code className="text-sun">--run</code>{" "}
                  flag:
                </p>
                <div className="bg-ink border border-line rounded-lg p-3 font-mono text-[13px] text-sun">
                  $ autocurl --run &quot;Health Ping&quot; endpoints.acr
                </div>
              </div>
            </div>
          </section>

          {/* Tips for verifying status codes */}
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-bone">
              Pro Tip: Inspecting HTTP Status Codes with Curl
            </h2>
            <p>
              When testing APIs from scripts, you can format cURL to output only
              the HTTP status code using the{" "}
              <code className="text-bone">-w &quot;%&#123;http_code&#125;&quot;</code>{" "}
              flag:
            </p>
            <div className="bg-[#0e0c13] border border-line rounded-xl p-4 font-mono text-[13.5px] text-bone overflow-x-auto">
              curl -s -o /dev/null -w &quot;%&#123;http_code&#125;\n&quot; https://api.dev/health
            </div>
            <p className="text-[14px] text-mute">
              Returns <code className="text-emerald-400">200</code> directly,
              allowing you to write clean assertion logic in bash or GitHub
              Actions without external dependencies.
            </p>
          </section>

          {/* Call to action */}
          <section className="p-6 rounded-2xl border border-sun/20 bg-sun/5 space-y-3">
            <h2 className="text-[19px] font-bold text-sun">
              Upgrade Your Terminal API Workflow
            </h2>
            <p className="text-[14.5px] text-mute leading-relaxed">
              Ditch the 500MB GUI apps and start organizing your curl requests in
              lightweight, git-diffable <code className="text-bone">.acr</code>{" "}
              files.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/docs/getting-started"
                className="px-4 py-2 rounded-lg bg-sun text-ink font-semibold text-[14px] hover:brightness-105 transition-all no-underline"
              >
                Quickstart Guide
              </Link>
              <Link
                href="/curl-alternative"
                className="px-4 py-2 rounded-lg bg-[rgba(21,19,27,0.8)] border border-line text-bone font-medium text-[14px] hover:border-sun/40 transition-all no-underline"
              >
                autocurl vs Postman Comparison
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
