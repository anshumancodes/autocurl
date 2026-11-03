import type { Metadata } from "next";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import FlipWord from "@/components/FlipWord";
import TerminalDemo from "@/components/TerminalDemo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";
import { pageMetadata, jsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

const guideLinks = [
  {
    href: "/docs/guides/ai-coding-agents",
    label: "Guide",
    title: "Let AI coding agents run your API requests",
    body: "Give Claude Code, Codex, or Cursor a readable request file instead of hand-built curl commands.",
  },
  {
    href: "/docs/guides/test-apis-from-terminal",
    label: "Guide",
    title: "How to test APIs from the terminal",
    body: "curl, HTTPie, .http files, and autocurl: when each one fits a backend workflow.",
  },
  {
    href: "/docs/guides/discover-api-routes",
    label: "Guide",
    title: "Discover API routes from a codebase",
    body: "How AST-first route discovery works, and where AI-assisted refinement helps.",
  },
  {
    href: "/docs/supported-frameworks",
    label: "Reference",
    title: "Supported frameworks",
    body: "Express, NestJS, FastAPI, Flask, Django, Gin, Echo, Fiber, and net/http.",
  },
  {
    href: "/docs/compare/autocurl-vs-postman",
    label: "Compare",
    title: "autocurl vs Postman",
    body: "A terminal-first, plain-text workflow compared with a full GUI API platform.",
  },
  {
    href: "/docs/compare/autocurl-vs-curl",
    label: "Compare",
    title: "autocurl vs curl",
    body: "What autocurl adds on top of raw curl commands, and when plain curl is still the right call.",
  },
];

const faqItems = [
  {
    question: "What is autocurl and how does it relate to curl?",
    answer:
      "autocurl is a command-line API testing tool. It discovers routes in supported backend projects, writes them to a readable .autocurl request file, and executes the request you pick with its own built-in Go HTTP client. It does not shell out to the system curl binary; the name refers to the job it automates.",
  },
  {
    question: "What is an .autocurl file?",
    answer:
      "An .autocurl file is a plain-text collection of HTTP requests separated by readable comments. It can be checked into git, reviewed in pull requests, and inspected in any text editor.",
  },
  {
    question: "Can I run .autocurl requests without autocurl installed?",
    answer:
      "The .autocurl file is readable text, but executing requests and resolving variables requires autocurl's CLI.",
  },
  {
    question: "How does autocurl compare to Postman or Insomnia?",
    answer:
      "Postman and Insomnia are full GUI API platforms with features such as test scripts, collection runners, and team workspaces. autocurl is narrower: a terminal tool with no account, whose requests live in your repository as plain text and are generated from your route code. See the autocurl vs Postman comparison in the docs for details.",
  },
  {
    question: "Can AI coding agents use autocurl?",
    answer:
      "Yes. Agents can read and edit .autocurl files as plain text, and request selection and variable values are read from standard input, so an agent can run a request non-interactively, for example: printf '2\\n42\\n' | autocurl index.autocurl. autocurl is a CLI, not an MCP server.",
  },
  {
    question: "Which backend frameworks are supported?",
    answer:
      "Route extraction currently supports Express and NestJS (JavaScript/TypeScript), FastAPI, Flask, and Django (Python), and Gin, Echo, Fiber, and net/http (Go). Discovery is AST-first and works offline; optional Gemini analysis with your own API key can help with routes the AST pass cannot resolve.",
  },
  {
    question: "How do I install autocurl?",
    answer:
      "On macOS and Linux, run curl -fsSL https://autocurl.lol/install.sh | sh to install the latest stable GitHub Release. Set AUTOCURL_VERSION=vX.Y.Z to pin a version. Windows users can download autocurl.exe from GitHub Releases.",
  },
];

export default function Home() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.longDescription,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Command-line API testing tool",
    operatingSystem: "macOS, Linux, Windows",
    downloadUrl: siteConfig.links.releases,
    installUrl: `${siteConfig.url}/docs/getting-started`,
    license: "https://opensource.org/licenses/MIT",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(softwareSchema)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqSchema)}
      />
      <div className="bg" aria-hidden="true"></div>
      <Navbar />

      <main>
        {/* Hero Section */}
        <section
          aria-label="Hero"
          className="max-w-280 mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-12 items-center pt-8 sm:pt-14 pb-16 lg:pb-24 lg:min-h-screen"
        >
          <div>
            <p className="font-mono text-sun text-[12px] sm:text-[13px] font-semibold tracking-widest mb-3">
              CLI API testing for developers &amp; AI agents
            </p>
            <h1 className="font-extrabold text-[clamp(32px,5.4vw,72px)] leading-[1.05] sm:leading-[1.02] tracking-[-0.035em]">
              API requests in one file <FlipWord /> can read.
            </h1>
            <p className="mt-4.5 sm:mt-5.5 mb-6 sm:mb-7.5 max-w-[30em] text-mute text-[16px] sm:text-[19px] leading-relaxed">
              Make agents run cURLs better without the JSON mess. autocurl
              discovers routes in your backend code, writes them to a readable
              .autocurl file, and runs any request from the terminal.
            </p>
            <div className="inline-flex max-w-full flex-wrap gap-2.5 sm:gap-3.5 items-center font-medium text-[13.5px] sm:text-[15px] font-mono bg-[rgba(21,19,27,0.7)] border border-line rounded-[10px] px-3.5 sm:px-4 py-2.5 sm:py-3 backdrop-blur-[6px]">
              <span className="truncate">curl -fsSL https://autocurl.lol/install.sh | sh</span>
              <CopyButton text="curl -fsSL https://autocurl.lol/install.sh | sh" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] sm:text-[14px] text-mute">
              <Link
                href="/docs/getting-started"
                className="text-sun hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Read quickstart guide</span>
                <span aria-hidden="true">
                  <ArrowRight />
                </span>
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.producthunt.com/products/autocurl?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-autocurl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="autocurl on Product Hunt"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="autocurl featured on Product Hunt"
                  width="160"
                  height="56"
                  className="h-14 w-40 object-contain"
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1300282&theme=light&t=1793524530971"
                />
              </a>
              <a
                href="https://peerlist.io/anshumancdx/project/autocurl"
                target="_blank"
                rel="noreferrer"
                aria-label="autocURL on Peerlist"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://peerlist.io/api/v1/projects/embed/PRJHJKNDPE89DDKP72KQ6LBBAMQE8R?showUpvote=true&theme=light"
                  alt="autocurl project on Peerlist"
                  width="160"
                  height="56"
                  loading="lazy"
                  className="h-14 w-40 object-contain"
                />
              </a>
            </div>
          </div>
          <TerminalDemo />
        </section>

        {/* Workflow Section */}
        <section
          id="how"
          aria-labelledby="how-heading"
          className="py-20 md:py-28 border-t border-line bg-[rgba(21,19,27,0.88)]"
        >
          <div className="max-w-280 mx-auto px-6">
            <div className="flex items-end justify-between gap-8 mb-14">
              <div>
                <div className="font-mono text-sun text-[12px] font-semibold tracking-widest mb-3">
                  workflow
                </div>

                <h2
                  id="how-heading"
                  className="font-extrabold text-[clamp(24px,3.2vw,40px)] leading-[1.1] tracking-[-0.03em]"
                >
                  From code to request.
                </h2>
              </div>

              
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-8 md:gap-6">
              {/* 01 */}
              <div>
                <div className="font-mono text-[11px] text-mute mb-4">01</div>

                <div className="font-mono text-[13px] text-sun mb-3">
                  index.js
                </div>

                <h3 className="font-bold text-[18px] tracking-[-0.02em] mb-2">
                  Define
                </h3>

                <p className="text-mute text-[14px] leading-relaxed max-w-65">
                  Routes declared in{" "}
                  <Link href="/docs/supported-frameworks" className="underline hover:text-sun">
                    supported frameworks
                  </Link>{" "}
                  are extracted from source.
                </p>
              </div>

              <div
                className="hidden md:block font-mono text-mute text-xl"
                aria-hidden="true"
              >
                <ArrowRight />
              </div>

              {/* 02 */}
              <div>
                <div className="font-mono text-[11px] text-mute mb-4">02</div>

                <div className="font-mono text-[13px] text-sun mb-3">
                  index.autocurl
                </div>

                <h3 className="font-bold text-[18px] tracking-[-0.02em] mb-2">
                  Generate
                </h3>

                <p className="text-mute text-[14px] leading-relaxed max-w-65">
                  Turn them into a portable, human-readable request file.
                </p>
              </div>

              <div
                className="hidden md:block font-mono text-mute text-xl"
                aria-hidden="true"
              >
                <ArrowRight />
              </div>

              {/* 03 */}
              <div>
                <div className="font-mono text-[11px] text-mute mb-4">03</div>

                <div className="font-mono text-[13px] text-sun mb-3">
                  autocurl index.autocurl
                </div>

                <h3 className="font-bold text-[18px] tracking-[-0.02em] mb-2">
                  Execute
                </h3>

                <p className="text-mute text-[14px] leading-relaxed max-w-65">
                  Pick a request and execute it directly from your terminal.
                </p>
              </div>
            </div>

            <div className="mt-14 pt-6 border-t border-line md:hidden">
              <Link
                href="/docs/using-autocurl"
                className="inline-flex items-center gap-1.5 font-mono text-[12px] text-mute hover:text-sun transition-colors"
              >
                .autocurl specification
                <span aria-hidden="true"> </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Why autocurl Section */}
        <section
          id="why"
          aria-labelledby="why-heading"
          className="py-16 md:py-24 border-t border-line bg-[rgba(21,19,27,0.88)] backdrop-blur-[10px]"
        >
          <div className="max-w-280 mx-auto px-6">
            <div className="font-mono text-sun text-[12px] font-semibold   tracking-widest mb-3">
              Philosophy
            </div>
            <h2
              id="why-heading"
              className="font-extrabold text-[clamp(24px,3.2vw,40px)] leading-[1.1] tracking-[-0.03em] max-w-[18em]"
            >
              Built to stay out of your way.
            </h2>
            <p className="mt-4 max-w-[34em] text-mute text-[15px] leading-relaxed">
              Requests are stored as plain text in your project. Local discovery
              stays on your machine; when AI analysis is enabled, bounded source
              context is sent to Gemini using your key.
            </p>

            <div className="mt-12 md:mt-16">
              {[
                {
                  label: "Git-native",
                  title: "Version-controlled by default",
                  body: "The .autocurl file is plain text. Diffs and pull requests show exactly what changed — no JSON blobs, no binary formats.",
                },
                {
                  label: "Local-first",
                  title: "Local by default",
                  body: "Deterministic discovery stays local. Optional Gemini analysis sends bounded source context to Google when enabled.",
                },
                {
                  label: "Human-readable",
                  title: "Open the file, read the file",
                  body: "Every .autocurl file is plain-text HTTP requests separated by comments. Inspect, edit, or share them in any text editor.",
                },
                {
                  label: "Zero lock-in",
                  title: "Readable without autocurl installed",
                  body: "Files are readable in any editor. Request execution and variable prompts are provided by the autocurl CLI.",
                },
                {
                  label: "Lightweight",
                  title: "One small CLI, instant startup",
                  body: "A single prebuilt Go binary with no background process, no runtime to install, and no dependency on the system curl executable.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-1 sm:grid-cols-[160px_1fr] md:grid-cols-[200px_1fr_1fr] gap-x-10 gap-y-1 py-6 border-b border-line last:border-b-0 items-start"
                >
                  <span className="font-mono text-[12px] text-sun   tracking-wider pt-0.5">
                    {item.label}
                  </span>
                  <h3 className="font-bold text-[16px] leading-[1.35] tracking-[-0.01em]">
                    {item.title}
                  </h3>
                  <p className="text-mute text-[14px] leading-relaxed mt-1 sm:mt-0 sm:col-start-2 md:col-start-auto">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who is autocurl for? Section */}
        <section
          aria-labelledby="who-heading"
          className="py-16 md:py-24 border-t border-line bg-[rgba(21,19,27,0.88)] backdrop-blur-[10px]"
        >
          <div className="max-w-280 mx-auto px-6">
            <div className="font-mono text-sun text-[12px] font-semibold   tracking-widest mb-3">
              Audience
            </div>
            <h2
              id="who-heading"
              className="font-extrabold text-[clamp(24px,3.2vw,40px)] leading-[1.1] tracking-[-0.03em]"
            >
              Who is autocurl for?
            </h2>
            <p className="mt-4 max-w-[36em] text-mute text-[15px] leading-relaxed">
              Built for developers who prefer the speed, precision, and
              transparency of terminal workflows.
            </p>

            <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-line">
              <div className="md:pr-10 pb-10 md:pb-0 border-b border-line md:border-b-0">
                <div className="font-mono text-[11px] text-mute   tracking-widest mb-5">
                  01
                </div>
                <h3 className="font-bold text-[17px] leading-[1.3] tracking-[-0.01em] mb-1">
                  Backend Developers
                </h3>
                <p className="text-sun text-[12px] font-mono mb-4   tracking-wider">
                  Fast local API iteration
                </p>
                <p className="text-mute text-[14px] leading-relaxed">
                  Generate requests straight from your Express, FastAPI, Gin,
                  or other{" "}
                  <Link href="/docs/supported-frameworks" className="text-bone underline hover:text-sun">
                    supported framework
                  </Link>{" "}
                  routes, without opening a heavy GUI tool or digging through
                  shell history for long curl flags.
                </p>
              </div>

              <div className="md:px-10 py-10 md:py-0 border-b border-line md:border-b-0">
                <div className="font-mono text-[11px] text-mute   tracking-widest mb-5">
                  02
                </div>
                <h3 className="font-bold text-[17px] leading-[1.3] tracking-[-0.01em] mb-1">
                  DevOps &amp; Infrastructure
                </h3>
                <p className="text-sun text-[12px] font-mono mb-4   tracking-wider">
                  Headless &amp; SSH environments
                </p>
                <p className="text-mute text-[14px] leading-relaxed">
                  Run requests seamlessly over SSH on remote dev servers and
                  staging boxes where no graphical browser or Electron app can
                  exist.
                </p>
              </div>

              <div className="md:pl-10 pt-10 md:pt-0">
                <div className="font-mono text-[11px] text-mute   tracking-widest mb-5">
                  03
                </div>
                <h3 className="font-bold text-[17px] leading-[1.3] tracking-[-0.01em] mb-1">
                  API &amp; Engineering Teams
                </h3>
                <p className="text-sun text-[12px] font-mono mb-4   tracking-wider">
                  Version-controlled collections
                </p>
                <p className="text-mute text-[14px] leading-relaxed">
                  Keep requests inside the repo right alongside the API code.
                  When endpoints update, your .autocurl files are updated and
                  reviewed in the same PR.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Guides Section */}
        <section
          id="guides"
          aria-labelledby="guides-heading"
          className="py-16 md:py-24 border-t border-line bg-[rgba(21,19,27,0.88)] backdrop-blur-[10px]"
        >
          <div className="max-w-280 mx-auto px-6">
            <div className="font-mono text-sun text-[12px] font-semibold tracking-widest mb-3">
              Learn
            </div>
            <h2
              id="guides-heading"
              className="font-extrabold text-[clamp(24px,3.2vw,40px)] leading-[1.1] tracking-[-0.03em]"
            >
              Guides and comparisons
            </h2>
            <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded-xl overflow-hidden">
              {guideLinks.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="group block bg-[rgba(21,19,27,0.96)] p-6 no-underline hover:bg-[rgba(30,27,38,0.96)] transition-colors"
                >
                  <span className="font-mono text-[11px] text-sun tracking-wider">
                    {guide.label}
                  </span>
                  <h3 className="mt-2 font-bold text-[16px] leading-[1.35] tracking-[-0.01em] text-bone group-hover:text-sun transition-colors">
                    {guide.title}
                  </h3>
                  <p className="mt-2 text-mute text-[14px] leading-relaxed">
                    {guide.body}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="py-16 md:py-24 border-t border-line bg-[rgba(21,19,27,0.88)] backdrop-blur-[10px]"
        >
          <div className="max-w-180 mx-auto px-6">
            <div className="font-mono text-sun text-[12px] font-semibold   tracking-widest mb-3">
              FAQ
            </div>
            <h2
              id="faq-heading"
              className="font-extrabold text-[clamp(24px,3.2vw,40px)] leading-[1.1] tracking-[-0.03em] mb-12 md:mb-14"
            >
              Frequently asked questions
            </h2>

            <div>
              {faqItems.map((item, idx) => (
                <details
                  key={idx}
                  className="group border-t border-line last:border-b last:border-line"
                >
                  <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none select-none">
                    <h3 className="font-semibold text-[15px] leading-[1.4] tracking-[-0.01em]">
                      {item.question}
                    </h3>
                    <span
                      className="text-mute text-[20px] font-light leading-none shrink-0 transition-transform duration-200 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-mute text-[14px] leading-relaxed pb-6 pr-10">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Install Section */}
        <section
          id="install"
          aria-labelledby="install-heading"
          className="py-16 md:py-22 border-t border-line bg-[rgba(21,19,27,0.88)] backdrop-blur-[10px] text-center"
        >
          <div className="max-w-280 mx-auto px-6">
            <h2
              id="install-heading"
              className="font-extrabold text-[clamp(28px,3.8vw,46px)] leading-[1.1] tracking-[-0.03em] max-w-[16em] mx-auto"
            >
              Try it on your next API.
            </h2>
            <p className="mt-3.5 text-mute text-[16px] max-w-[30em] mx-auto">
              Install autocurl, point it at your backend, and run your first
              request in a couple of minutes.
            </p>
            <div className="inline-flex max-w-full flex-wrap gap-2.5 sm:gap-3.5 items-center font-medium text-[13.5px] sm:text-[15px] font-mono bg-[rgba(21,19,27,0.7)] border border-line rounded-[10px] px-3.5 sm:px-4 py-2.5 sm:py-3 backdrop-blur-[6px] mt-6 sm:mt-7.5">
              <span className="truncate">curl -fsSL https://autocurl.lol/install.sh | sh</span>
              <CopyButton text="curl -fsSL https://autocurl.lol/install.sh | sh" />
            </div>

            <div className="mt-8 flex justify-center gap-4 text-[14px]">
              <Link
                href="/docs/getting-started#step-1-install-autocurl"
                className="text-mute hover:text-bone underline transition-colors"
              >
                Other install methods
              </Link>
              <span className="text-mute">•</span>
              <Link
                href="/docs/getting-started"
                className="text-mute hover:text-bone underline transition-colors"
              >
                Getting started tutorial
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
