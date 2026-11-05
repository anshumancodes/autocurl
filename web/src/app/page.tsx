import type { Metadata } from "next";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
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
        <section aria-label="Hero" className="px-3 sm:px-6 pt-[calc(10vh+12px)] sm:pt-[calc(10vh+16px)]">
          <div className="surface dot-grid relative mx-auto max-w-280 overflow-hidden rounded-[28px] lg:rounded-[52px]">
            <div className="relative mx-auto max-w-280 px-5 sm:px-10 pt-14 sm:pt-24 pb-5 sm:pb-8 flex flex-col items-center text-center">
              <p className="inline-flex max-w-full shrink-0 items-center whitespace-nowrap rounded-full border border-line bg-[rgba(21,19,27,0.7)] px-3 sm:px-3.5 py-1.5 font-mono text-sun text-[length:clamp(7px,calc((100vw_-_92px)_/_32),11px)] sm:text-[12px] font-semibold tracking-[0.04em] sm:tracking-[0.14em] mb-7 sm:mb-8">
               cURLs from your code, executed in your terminal
              </p>
              <h1 className="max-w-[12.5em] font-extrabold text-[clamp(42px,7vw,92px)] leading-[1.04] tracking-[-0.04em]">
                Generate and run{" "}
                <span className="relative inline-block -rotate-[1.5deg] rounded-[0.2em] border border-sun/45 bg-sun/12 px-[0.16em] pb-[0.04em] text-sun">
                  cURL requests
                  <Cursor className="glide absolute -right-[0.42em] -bottom-[0.5em] h-[0.5em] w-[0.5em]" />
                </span>{" "}
                directly from your code.
              </h1>
              <p className="mt-6 sm:mt-7 mb-8 sm:mb-10 max-w-[36em] text-mute text-[16px] sm:text-[18px] leading-[1.65]">
                AutoCURL scans your code files, automatically generates HTTP
                requests in a human-readable{" "}
                <code className="rounded-md border border-line bg-[rgba(21,19,27,0.7)] px-1.5 py-0.5 font-mono text-[0.9em] text-sun">
                  .autocurl
                </code>{" "}
                file, and lets you select
                and execute any request right from your terminal using your
                keyboard.
              </p>

              {/* Action row */}
              <div className="flex w-full flex-col sm:w-auto sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <div className="lifted inline-flex min-h-[52px] max-w-full items-center justify-between gap-3.5 font-medium text-[13.5px] sm:text-[15px] font-mono bg-[rgba(21,19,27,0.7)] border border-line rounded-[16px] pl-4 pr-2 py-2 backdrop-blur-[6px]">
                  <span className="truncate">curl -fsSL https://autocurl.lol/install.sh | sh</span>
                  <CopyButton text="curl -fsSL https://autocurl.lol/install.sh | sh" />
                </div>
                <div className="flex text-[14px] sm:text-[15px] text-mute">
                  <Link
                    href="/docs/getting-started"
                    className="press w-full justify-center min-h-[52px] px-5 rounded-[16px] border border-line bg-[rgba(21,19,27,0.7)] hover:border-sun/60 text-sun inline-flex items-center gap-1.5 font-semibold no-underline"
                  >
                    <span>Read quickstart guide</span>
                    <span aria-hidden="true" className="nudge [&_svg]:h-4 [&_svg]:w-4">
                      <ArrowRight />
                    </span>
                  </Link>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://www.producthunt.com/products/autocurl?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-autocurl"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="autocurl on Product Hunt"
                  className="press inline-block rounded-[12px]"
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
                  className="press inline-block rounded-[12px]"
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

              {/* Product window */}
              <div className="relative mt-12 sm:mt-18 w-full max-w-[920px] text-left">
                <div className="rounded-[28px] sm:rounded-[34px] border border-line bg-[rgba(14,12,19,0.5)] p-2.5 sm:p-4 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.5)] [&>div]:rounded-[18px]">
                  <TerminalDemo />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Everything below the hero sits on one continuous surface */}
        <div className="relative mt-20 sm:mt-28 border-t border-line bg-[rgba(21,19,27,0.88)] backdrop-blur-[10px] rounded-t-[32px] lg:rounded-t-[56px]">
          {/* Workflow Section */}
          <section
            id="how"
            aria-labelledby="how-heading"
            className="py-20 md:py-28 scroll-mt-24"
          >
            <div className="max-w-280 mx-auto px-6">
              <div className="reveal flex flex-col items-center text-center mb-12 md:mb-16">
                <div className={pillClass}>
                  <PillDot />
                  How it works
                </div>

                <h2 id="how-heading" className={h2Class}>
                  From code to executable requests in three steps.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-5 md:gap-4 lg:gap-5">
                {/* 01 */}
                <div className={`reveal ${stepCardClass}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={badgeClass}>01</div>

                    <div className="font-mono text-[13px] text-sun truncate">
                      index.js
                    </div>
                  </div>

                  <h3 className={stepTitleClass}>Scan your codebase</h3>

                  <p className={stepBodyClass}>
                    AutoCURL discovers routes across{" "}
                    <Link href="/docs/supported-frameworks" className="underline hover:text-sun">
                      supported languages and frameworks
                    </Link>
                    .
                  </p>

                  <MiniCode />
                </div>

                <div
                  className="hidden md:flex self-center font-mono text-mute text-xl"
                  aria-hidden="true"
                >
                  <ArrowRight />
                </div>

                {/* 02 */}
                <div className={`reveal ${stepCardClass}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={badgeClass}>02</div>

                    <div className="font-mono text-[13px] text-sun truncate">
                      index.autocurl
                    </div>
                  </div>

                  <h3 className={stepTitleClass}>Generate requests</h3>

                  <p className={stepBodyClass}>
                    Your routes become clean, human-readable{" "}
                    <code className="rounded-md border border-line bg-[rgba(21,19,27,0.7)] px-1.5 py-0.5 font-mono text-[0.9em] text-sun">
                      .autocurl
                    </code>{" "}
                    files.
                  </p>

                  <MiniFile />
                </div>

                <div
                  className="hidden md:flex self-center font-mono text-mute text-xl"
                  aria-hidden="true"
                >
                  <ArrowRight />
                </div>

                {/* 03 */}
                <div className={`reveal ${stepCardClass}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={badgeClass}>03</div>

                    <div className="font-mono text-[13px] text-sun truncate">
                      autocurl index.autocurl
                    </div>
                  </div>

                  <h3 className={stepTitleClass}>Select and execute</h3>

                  <p className={stepBodyClass}>
                    Navigate requests using your keyboard arrow keys and execute
                    them directly from the terminal.
                  </p>

                  <MiniRun />
                </div>
              </div>

              <div className="mt-10 flex justify-center md:hidden">
                <Link
                  href="/docs/using-autocurl"
                  className="press inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full border border-line bg-[rgba(21,19,27,0.7)] font-mono text-[12px] text-mute hover:text-sun no-underline"
                >
                  .autocurl specification
                  <span aria-hidden="true"> </span>
                </Link>
              </div>
            </div>
          </section>

          {/* Example Section */}
          <section
            id="example"
            aria-label="Example of generated requests"
            className="py-16 md:py-24 scroll-mt-24"
          >
            <div className="max-w-280 mx-auto px-6">
              <div className="reveal flex flex-col items-center text-center mb-10 md:mb-12">
                <div className={pillClass}>
                  <PillDot />
                  Example
                </div>
              </div>

              <div className="reveal grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-5 md:gap-4 lg:gap-5">
                <div className={exampleCardClass}>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="font-bold text-[18px] sm:text-[20px] tracking-[-0.02em]">
                      From your code
                    </h3>
                    <span className={exampleTagClass}>JavaScript</span>
                  </div>
                  <pre className={examplePreClass}>
                    <code>
                      <span className="text-bone">app.</span>
                      <span className="text-sky">get</span>
                      <span className="text-mute">(</span>
                      <span className="text-sun">&quot;/users/:id&quot;</span>
                      <span className="text-mute">, </span>
                      <span className="text-bone">getUser</span>
                      <span className="text-mute">);</span>
                      {"\n"}
                      <span className="text-bone">app.</span>
                      <span className="text-sky">post</span>
                      <span className="text-mute">(</span>
                      <span className="text-sun">&quot;/users&quot;</span>
                      <span className="text-mute">, </span>
                      <span className="text-bone">createUser</span>
                      <span className="text-mute">);</span>
                    </code>
                  </pre>
                </div>

                <div
                  className="hidden md:flex self-center font-mono text-mute text-xl"
                  aria-hidden="true"
                >
                  <ArrowRight />
                </div>

                <div className={exampleCardClass}>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="font-bold text-[18px] sm:text-[20px] tracking-[-0.02em]">
                      Generated requests
                    </h3>
                    <span className={exampleTagClass}>.autocurl</span>
                  </div>
                  <pre className={examplePreClass}>
                    <code>
                      <span className="text-mute"># Get user</span>
                      {"\n"}
                      <span className="text-sky">GET</span>{" "}
                      <span className="text-bone">http://localhost:3000/users/123</span>
                      {"\n\n"}
                      <span className="text-mute"># Create user</span>
                      {"\n"}
                      <span className="text-sky">POST</span>{" "}
                      <span className="text-bone">http://localhost:3000/users</span>
                    </code>
                  </pre>
                </div>
              </div>

              <p className="reveal mt-6 text-center text-mute text-[13px] sm:text-[14px]">
                Illustrative example of the generated request format.
              </p>
            </div>
          </section>

          {/* Why autocurl Section */}
          <section
            id="why"
            aria-labelledby="why-heading"
            className="py-16 md:py-24 scroll-mt-24"
          >
            <div className="max-w-280 mx-auto px-6">
              <div className="reveal flex flex-col items-center text-center">
                <div className={pillClass}>
                  <PillDot />
                  API requests, generated from code
                </div>
                <h2 id="why-heading" className={`${h2Class} max-w-[16em]`}>
                  Your code already has the API requests. AutoCURL brings them to
                  your terminal.
                </h2>
                <p className={subheadClass}>
                  AutoCURL scans your codebase, generates executable HTTP requests in
                  readable{" "}
                  <code className="rounded-md border border-line bg-[rgba(21,19,27,0.7)] px-1.5 py-0.5 font-mono text-[0.9em] text-sun">
                    .autocurl
                  </code>{" "}
                  files, and lets you select and run any request right from your
                  terminal.
                </p>
              </div>

              <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-7">
                {[
                  {
                    label: "Code to requests",
                    title: "Generate requests from your code",
                    body: "AutoCURL scans your existing codebase, discovers API routes and automatically turns them into executable HTTP requests.",
                  },
                  {
                    label: "Multi-language",
                    title: "Works with your stack",
                    body: "Supports Python, Go, JavaScript and more, with integrations for popular web frameworks. Generate requests without changing how you build your APIs.",
                  },
                  {
                    label: "Human-readable",
                    title: "Every request in one readable file",
                    body: "AutoCURL generates .autocurl files with clean, plain-text HTTP requests. Read, inspect, edit and version-control them like any other code file.",
                  },
                  {
                    label: "Keyboard-first",
                    title: "Select and execute with your keyboard",
                    body: "Navigate through your generated requests using the arrow keys, select the API you want to hit and execute it directly from your terminal.",
                  },
                  {
                    label: "CLI-native",
                    title: "No GUI API client needed",
                    body: "Generate and execute API requests right from your terminal. No separate desktop application or manually maintained collections.",
                  },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className={`reveal surface rounded-[28px] p-6 sm:p-7 lg:p-8 flex flex-col items-start ${
                      idx < 2 ? "lg:col-span-3" : "lg:col-span-2"
                    } ${idx === 4 ? "sm:col-span-2 lg:col-span-2" : ""}`}
                  >
                    <span className="inline-flex items-center rounded-[10px] border border-line bg-[rgba(14,12,19,0.5)] px-2.5 py-1 font-mono text-[11px] text-sun tracking-[0.12em]">
                      {item.label}
                    </span>
                    <h3 className="mt-5 font-bold text-[20px] sm:text-[22px] leading-[1.25] tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-mute text-[15px] leading-[1.65] max-w-[34em]">
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
            className="py-16 md:py-24"
          >
            <div className="max-w-280 mx-auto px-6">
              <div className="reveal flex flex-col items-center text-center">
                <div className={pillClass}>
                  <PillDot />
                  Audience
                </div>
                <h2 id="who-heading" className={h2Class}>
                  Who is autocurl for?
                </h2>
                <p className={subheadClass}>
                  Built for developers who prefer the speed, precision, and
                  transparency of terminal workflows.
                </p>
              </div>

              <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">
                <div className={`reveal ${audienceCardClass}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={badgeClass}>01</div>
                    <h3 className={audienceTitleClass}>Backend Developers</h3>
                  </div>
                  <p className={audienceTagClass}>Fast local API iteration</p>
                  <p className={audienceBodyClass}>
                    Generate requests straight from your Express, FastAPI, Gin,
                    or other{" "}
                    <Link href="/docs/supported-frameworks" className="text-bone underline hover:text-sun">
                      supported framework
                    </Link>{" "}
                    routes, without opening a heavy GUI tool or digging through
                    shell history for long curl flags.
                  </p>
                </div>

                <div className={`reveal ${audienceCardClass}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={badgeClass}>02</div>
                    <h3 className={audienceTitleClass}>DevOps &amp; Infrastructure</h3>
                  </div>
                  <p className={audienceTagClass}>Headless &amp; SSH environments</p>
                  <p className={audienceBodyClass}>
                    Run requests seamlessly over SSH on remote dev servers and
                    staging boxes where no graphical browser or Electron app can
                    exist.
                  </p>
                </div>

                <div className={`reveal ${audienceCardClass}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={badgeClass}>03</div>
                    <h3 className={audienceTitleClass}>API &amp; Engineering Teams</h3>
                  </div>
                  <p className={audienceTagClass}>Version-controlled collections</p>
                  <p className={audienceBodyClass}>
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
            className="py-16 md:py-24 scroll-mt-24"
          >
            <div className="max-w-280 mx-auto px-6">
              <div className="reveal flex flex-col items-center text-center">
                <div className={pillClass}>
                  <PillDot />
                  Learn
                </div>
                <h2 id="guides-heading" className={h2Class}>
                  Guides and comparisons
                </h2>
              </div>
              <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                {guideLinks.map((guide) => (
                  <Link
                    key={guide.href}
                    href={guide.href}
                    className="reveal press group flex flex-col items-start rounded-[28px] border border-line bg-[rgba(21,19,27,0.96)] p-6 sm:p-7 no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_24px_60px_-30px_rgba(0,0,0,0.5)] hover:bg-[rgba(30,27,38,0.96)] hover:border-sun/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_-18px_rgba(0,0,0,0.6)]"
                  >
                    <span className="inline-flex items-center rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-sun tracking-[0.12em]">
                      {guide.label}
                    </span>
                    <h3 className="mt-5 font-bold text-[19px] sm:text-[20px] leading-[1.3] tracking-[-0.02em] text-bone group-hover:text-sun transition-colors">
                      {guide.title}
                    </h3>
                    <p className="mt-2.5 text-mute text-[15px] leading-[1.65]">
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
            className="py-16 md:py-24 scroll-mt-24"
          >
            <div className="max-w-195 mx-auto px-6">
              <div className="reveal flex flex-col items-center text-center mb-12 md:mb-14">
                <div className={pillClass}>
                  <PillDot />
                  FAQ
                </div>
                <h2 id="faq-heading" className={h2Class}>
                  Frequently asked questions
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {faqItems.map((item, idx) => (
                  <details
                    key={idx}
                    className="reveal group surface rounded-[22px] px-5 sm:px-6 transition-colors open:bg-[rgba(21,19,27,0.96)]"
                  >
                    <summary className="flex items-center justify-between gap-6 py-5 min-h-16 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                      <h3 className="font-semibold text-[16px] leading-[1.4] tracking-[-0.01em]">
                        {item.question}
                      </h3>
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-[rgba(14,12,19,0.5)] text-mute text-[20px] font-light leading-none transition-transform duration-200 group-open:rotate-45 group-open:text-sun"
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </summary>
                    <p className="text-mute text-[15px] leading-[1.7] pb-6 pr-4 sm:pr-14 max-w-[42em]">
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
            className="px-3 sm:px-6 pt-8 md:pt-12 pb-16 md:pb-24 text-center scroll-mt-24"
          >
            <div className="reveal surface dot-grid relative mx-auto max-w-[1340px] overflow-hidden rounded-[28px] lg:rounded-[52px] py-16 md:py-24 px-6">
              <div className="relative max-w-280 mx-auto">
                <h2
                  id="install-heading"
                  className="font-extrabold text-[clamp(34px,5vw,64px)] leading-[1.05] tracking-[-0.035em] max-w-[14em] mx-auto"
                >
                  Try it on your next API.
                </h2>
                <p className="mt-4 sm:mt-5 text-mute text-[16px] sm:text-[18px] leading-[1.65] max-w-[30em] mx-auto">
                  Install autocurl, point it at your backend, and run your first
                  request in a couple of minutes.
                </p>
                <div className="lifted inline-flex min-h-[52px] max-w-full items-center justify-between gap-3.5 font-medium text-[13.5px] sm:text-[15px] font-mono bg-[rgba(21,19,27,0.7)] border border-line rounded-[16px] pl-4 pr-2 py-2 backdrop-blur-[6px] mt-8 sm:mt-10">
                  <span className="truncate">curl -fsSL https://autocurl.lol/install.sh | sh</span>
                  <CopyButton text="curl -fsSL https://autocurl.lol/install.sh | sh" />
                </div>

                <div className="mt-8 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[14px]">
                  <Link
                    href="/docs/getting-started#step-1-install-autocurl"
                    className="text-mute hover:text-bone underline underline-offset-4 transition-colors"
                  >
                    Other install methods
                  </Link>
                  <span className="text-mute">•</span>
                  <Link
                    href="/docs/getting-started"
                    className="text-mute hover:text-bone underline underline-offset-4 transition-colors"
                  >
                    Getting started tutorial
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

/* ---------- Shared presentation (classes only, no content) ---------- */

const pillClass =
  "sticker lifted inline-flex items-center gap-2 -rotate-1 rounded-full border border-line bg-[rgba(21,19,27,0.96)] px-3.5 py-1.5 font-mono text-sun text-[11px] sm:text-[12px] font-semibold tracking-[0.16em]";

const h2Class =
  "mt-5 font-extrabold text-[clamp(32px,4.6vw,56px)] leading-[1.08] tracking-[-0.03em]";

const subheadClass =
  "mt-4 sm:mt-5 max-w-[40em] text-mute text-[16px] sm:text-[17px] leading-[1.65]";

const badgeClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-line bg-[rgba(14,12,19,0.5)] font-mono text-[11px] font-semibold text-mute";

const stepCardClass =
  "surface rounded-[32px] p-5 sm:p-6 flex flex-col h-full";

const stepTitleClass = "font-bold text-[22px] sm:text-[24px] tracking-[-0.02em] mb-2";

const stepBodyClass = "text-mute text-[15px] leading-[1.65] mb-6";

const exampleCardClass = "surface rounded-[32px] p-5 sm:p-6 flex flex-col h-full min-w-0";

const exampleTagClass =
  "shrink-0 rounded-[10px] border border-line bg-[rgba(14,12,19,0.5)] px-2.5 py-1 font-mono text-[11px] text-sun";

const examplePreClass =
  "flex-1 overflow-x-auto rounded-[22px] border border-line bg-[rgba(14,12,19,0.86)] p-4 sm:p-5 font-mono text-[13px] sm:text-[14px] leading-[1.75]";

const audienceCardClass = "surface rounded-[32px] p-6 sm:p-7 lg:p-8";

const audienceTitleClass =
  "font-bold text-[20px] sm:text-[22px] leading-[1.25] tracking-[-0.02em]";

const audienceTagClass =
  "text-sun text-[12px] font-mono mb-4 tracking-wider";

const audienceBodyClass = "text-mute text-[15px] leading-[1.65]";

function PillDot() {
  return (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sun" aria-hidden="true" />
  );
}

function Cursor({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`pointer-events-none ${className}`}
    >
      <path
        d="M4 2.5 20 11l-7.2 1.9L9.6 20z"
        fill="var(--bone)"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Wordless miniature UI illustrations for the workflow steps (decorative). */

const miniFrame =
  "relative mt-auto h-40 rounded-[22px] border border-line bg-[rgba(14,12,19,0.86)] p-4";

function Bar({ w, className = "" }: { w: string; className?: string }) {
  return (
    <span
      className={`block h-2 rounded-full bg-[rgba(241,235,223,0.09)] ${className}`}
      style={{ width: w }}
    />
  );
}

function FrameDots() {
  return (
    <div className="flex gap-1.5 mb-4">
      <span className="h-2 w-2 rounded-full bg-line" />
      <span className="h-2 w-2 rounded-full bg-line" />
      <span className="h-2 w-2 rounded-full bg-line" />
    </div>
  );
}

/* 01 — source code with one route selected */
function MiniCode() {
  return (
    <div className={miniFrame} aria-hidden="true">
      <FrameDots />
      <div className="flex flex-col gap-2.5">
        <Bar w="42%" />
        <div className="relative ml-4 -my-1 rounded-[8px] border border-dashed border-sun/60 bg-sun/10 px-1.5 py-1.5">
          <Bar w="78%" className="bg-sun/45" />
          <Cursor className="glide absolute -right-1 -bottom-3 h-4 w-4" />
        </div>
        <Bar w="58%" className="ml-4" />
        <Bar w="64%" className="ml-4" />
        <Bar w="24%" />
      </div>
    </div>
  );
}

/* 02 — request file: comment separators between requests */
function MiniFile() {
  return (
    <div className={miniFrame} aria-hidden="true">
      <FrameDots />
      <div className="flex flex-col gap-3">
        {["62%", "54%", "70%"].map((w, i) => (
          <div key={i} className="flex flex-col gap-2">
            <span className="block border-t border-dashed border-line" />
            <div className="flex items-center gap-2">
              <span className="block h-2 w-7 shrink-0 rounded-full bg-sky/50" />
              <Bar w={w} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 03 — request picker with one row selected and a lifted success chip */
function MiniRun() {
  return (
    <div className="relative mt-auto" aria-hidden="true">
      <div className={`${miniFrame} mt-0`}>
        <FrameDots />
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`relative flex h-5 items-center rounded-[6px] px-2 ${
                i === 1 ? "bg-sun" : ""
              }`}
            >
              <span
                className={`block h-2 rounded-full ${
                  i === 1 ? "bg-ink/40" : "bg-[rgba(241,235,223,0.09)]"
                }`}
                style={{ width: ["40%", "52%", "60%", "66%"][i] }}
              />
              {i === 1 && (
                <Cursor className="glide absolute right-6 -bottom-2.5 h-4 w-4" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="lifted absolute -bottom-3.5 right-5 rotate-2 flex items-center gap-2 rounded-full border border-line bg-[rgba(21,19,27,0.96)] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-sky" />
        <span className="block h-2 w-14 rounded-full bg-sky/40" />
      </div>
    </div>
  );
}
