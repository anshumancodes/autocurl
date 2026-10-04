import type { Metadata } from "next";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import FlipWord from "@/components/FlipWord";
import TerminalDemo from "@/components/TerminalDemo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "autocurl - CLI tool for generating and running curl requests",
  description:
    "Define your API requests in JavaScript. autocurl compiles them into a plain .acr file, then gives you an interactive terminal picker to run curl requests instantly. Local-first, git-friendly, zero GUI.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "autocurl - CLI tool for generating and running curl requests",
    description:
      "Define requests in JS, compile to plain .acr curl files, and run them with an interactive terminal picker. 100% local, git-diffable, and lightweight.",
    url: "/",
  },
};

const faqItems = [
  {
    question: "What is autocurl and how does it relate to curl?",
    answer:
      "autocurl is a command-line developer tool designed to bridge the gap between ad-hoc curl commands and heavy GUI API clients. It does not replace curl—instead, it lets you define API requests cleanly in JavaScript, generates standard, reproducible curl commands in a human-readable .acr file, and provides an interactive terminal runner to execute them.",
  },
  {
    question: "What is an .acr file?",
    answer:
      "An .acr (autocurl request) file is a plain-text file containing standard, multi-line curl commands separated by readable comments. Because it is plain text, .acr files can be checked into git, reviewed in pull requests, and inspected in any text editor without proprietary software.",
  },
  {
    question: "Can I run .acr requests without autocurl installed?",
    answer:
      "Yes. Every request in an .acr file is formatted as valid, copy-pasteable curl commands with backslash line continuations. If a teammate does not have autocurl installed, they can simply copy and execute the command directly in any standard bash or zsh shell.",
  },
  {
    question: "How does autocurl compare to Postman or Insomnia?",
    answer:
      "Unlike Postman or Insomnia, autocurl requires no electron GUI, no account login, no cloud sync, and zero background memory overhead. All requests live directly in your repository as plain code and text, giving your team instant git diffs and offline reliability.",
  },
  {
    question: "How do I install autocurl?",
    answer:
      "autocurl can be installed via Homebrew using 'brew install autocurl'. You can also run it via npx or download prebuilt binaries directly from GitHub releases for macOS, Linux, and Windows.",
  },
];

export default function Home() {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
            
            <h1 className="font-extrabold text-[clamp(32px,5.4vw,72px)] leading-[1.05] sm:leading-[1.02] tracking-[-0.035em]">
              Every curl request, in one file <FlipWord /> can read.
            </h1>
            <p className="mt-4.5 sm:mt-5.5 mb-6 sm:mb-7.5 max-w-[30em] text-mute text-[16px] sm:text-[19px] leading-relaxed">
              Define API requests in a simple, human-readable format. Let agents and humans execute them without dealing with messy JSON, complicated tool schemas, or copy-pasting curl commands into the terminal.
            </p>
            <div className="inline-flex max-w-full flex-wrap gap-2.5 sm:gap-3.5 items-center font-medium text-[13.5px] sm:text-[15px] font-mono bg-[rgba(21,19,27,0.7)] border border-line rounded-[10px] px-3.5 sm:px-4 py-2.5 sm:py-3 backdrop-blur-[6px]">
              <span className="truncate">brew install autocurl</span>
              <CopyButton text="brew install autocurl" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] sm:text-[14px] text-mute">
            
             
              <Link
                href="/docs/getting-started"
                className="text-sun hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Read quickstart guide</span>
                <span aria-hidden="true"><ArrowRight/></span>
              </Link>
            </div>
          </div>
          <TerminalDemo />
        </section>

        {/* How It Works Section */}
        <section
          id="how"
          aria-labelledby="how-heading"
          className="py-16 md:py-22 border-t border-line bg-[rgba(21,19,27,0.72)] backdrop-blur-[10px]"
        >
          <div className="max-w-[1120px] mx-auto px-6">
            <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
              Workflow
            </div>
            <h2
              id="how-heading"
              className="font-extrabold text-[clamp(28px,3.8vw,46px)] leading-[1.1] tracking-[-0.03em] max-w-[18em]"
            >
              The index.js → index.acr → execute workflow.
            </h2>
            <p className="mt-[14px] max-w-[36em] text-mute text-[15px] sm:text-[16px]">
              Three steps: write your request objects, compile them into
              human-readable curl files, and run them with an interactive
              terminal selector.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 md:mt-11">
              <div>
                <div className="font-medium text-[13px] font-mono text-sun">
                  1. index.js
                </div>
                <h3 className="font-bold text-[20px] mt-[14px] mb-[6px]">
                  Define requests in code
                </h3>
                <p className="text-mute text-[15px] mb-3">
                  List your endpoints with methods, headers, and request bodies
                  as plain JavaScript.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[10px] p-4 font-mono text-[13px] leading-[1.65] whitespace-pre overflow-x-auto">
                  {`export default [
  {
    name: "List users",
    method: "GET",
    url: "https://api.dev/users"
  },
  {
    name: "Create user",
    method: "POST",
    url: "https://api.dev/users",
    body: { name: "Ada" }
  }
]`}
                </div>
              </div>
              <div>
                <div className="font-medium text-[13px] font-mono text-sun">
                  2. autocurl index.js
                </div>
                <h3 className="font-bold text-[20px] mt-[14px] mb-[6px]">
                  Generate the .acr file
                </h3>
                <p className="text-mute text-[15px] mb-3">
                  Each request compiles into a standalone, reproducible curl
                  command. Readable and git-diffable.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[10px] p-4 font-mono text-[13px] leading-[1.65] whitespace-pre overflow-x-auto">
                  {`# List users
curl -X GET \\
  "https://api.dev/users"

# Create user
curl -X POST \\
  "https://api.dev/users" \\
  -d '{"name":"Ada"}'`}
                </div>
              </div>
              <div>
                <div className="font-medium text-[13px] font-mono text-sun">
                  3. autocurl index.acr
                </div>
                <h3 className="font-bold text-[20px] mt-[14px] mb-[6px]">
                  Pick and execute
                </h3>
                <p className="text-mute text-[15px] mb-3">
                  autocurl launches an interactive terminal picker. Select a
                  request to run it with native curl.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[10px] p-4 font-mono text-[13px] leading-[1.65] whitespace-pre overflow-x-auto">
                  {`? Select a request
  ❯ List users
    Create user

→ curl -X GET ...
200 OK`}
                </div>
              </div>
            </div>

            <div className="mt-8 text-center sm:text-left">
              <Link
                href="/docs/acr-format"
                className="text-[14px] text-sun hover:underline inline-flex items-center gap-1 font-mono"
              >
                <span>Learn more about the .acr file specification</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Why autocurl Section */}
        <section
          id="why"
          aria-labelledby="why-heading"
          className="py-16 md:py-[112px] border-t border-line bg-[rgba(21,19,27,0.72)] backdrop-blur-[10px]"
        >
          <div className="max-w-[1120px] mx-auto px-6">
            <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
              Features & Philosophy
            </div>
            <h2
              id="why-heading"
              className="font-extrabold text-[clamp(28px,4.4vw,56px)] leading-[1.1] tracking-[-0.03em] max-w-[18em]"
            >
              Built to stay out of your way.
            </h2>
            <p className="mt-[14px] max-w-[34em] text-mute text-[15px] sm:text-[16px]">
              Your API requests are plain text on your own disk. No cloud sync,
              no account hurdles, no 500MB Electron client to open.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-8 md:mt-14">
              {/* Version control: wide */}
              <SpotlightCard className="col-span-1 md:col-span-2 lg:col-span-4">
                <h3 className="font-bold text-[20px] sm:text-[22px] leading-[1.2] tracking-[-0.02em]">
                  Git-native version control
                </h3>
                <p className="text-mute text-[15px] sm:text-[16px] max-w-[30em]">
                  The .acr file is plain text, so diffs and pull requests show
                  exactly what changed without messy JSON blobs.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[12px] font-mono text-[13px] leading-[1.8] overflow-x-auto mt-6">
                  <div className="px-[14px] py-2 border-b border-line text-mute text-[12px]">
                    api.acr
                  </div>
                  <div className="px-[14px] whitespace-pre text-mute">
                    {" "}
                    # Create user
                  </div>
                  <div className="px-[14px] whitespace-pre bg-[rgba(255,120,120,0.1)] text-[#ff9d9d] shadow-[inset_2px_0_#ff9d9d]">
                    {`- curl -X POST "https://api.dev/users" \\`}
                  </div>
                  <div className="px-[14px] whitespace-pre bg-[rgba(143,180,255,0.12)] text-sky shadow-[inset_2px_0_var(--sky)]">
                    {`+ curl -X POST "https://api.dev/v2/users" \\`}
                  </div>
                  <div className="px-[14px] whitespace-pre text-mute">{`    -d '{"name":"Ada"}'`}</div>
                </div>
              </SpotlightCard>

              {/* Local only: narrow */}
              <SpotlightCard className="col-span-1 md:col-span-1 lg:col-span-2">
                <h3 className="font-bold text-[20px] sm:text-[22px] leading-[1.2] tracking-[-0.02em]">
                  100% Local-first
                </h3>
                <p className="text-mute text-[15px] sm:text-[16px] max-w-[30em]">
                  Requests live in files on your disk. Nothing leaves your
                  machine.
                </p>
                <div className="flex flex-wrap gap-2 mt-auto pt-6">
                  <span className="font-medium text-[13px] font-mono px-3 py-[6px] rounded-full border border-line text-mute line-through decoration-[rgba(255,157,157,0.8)]">
                    Cloud Sync
                  </span>
                  <span className="font-medium text-[13px] font-mono px-3 py-[6px] rounded-full border border-line text-mute line-through decoration-[rgba(255,157,157,0.8)]">
                    Telemetry
                  </span>
                  <span className="font-medium text-[13px] font-mono px-3 py-[6px] rounded-full border border-line text-mute line-through decoration-[rgba(255,157,157,0.8)]">
                    Sign-in
                  </span>
                  <span className="font-medium text-[13px] font-mono px-3 py-[6px] rounded-full border border-sun bg-sun text-ink font-semibold">
                    Just plain files
                  </span>
                </div>
              </SpotlightCard>

              {/* Human-readable: narrow */}
              <SpotlightCard className="col-span-1 md:col-span-1 lg:col-span-2">
                <h3 className="font-bold text-[20px] sm:text-[22px] leading-[1.2] tracking-[-0.02em]">
                  Zero lock-in format
                </h3>
                <p className="text-mute text-[15px] sm:text-[16px] max-w-[30em]">
                  Open the file and copy any curl command. You never need
                  autocurl installed just to run them.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[12px] font-mono text-[13px] leading-[1.8] overflow-x-auto mt-6">
                  <div className="px-[14px] py-3 whitespace-pre text-bone bg-[rgba(242,193,78,0.1)] shadow-[inset_2px_0_var(--sun)]">
                    {`curl "https://api.dev/users"`}
                  </div>
                </div>
              </SpotlightCard>

              {/* Not heavy: wide */}
              <SpotlightCard className="col-span-1 md:col-span-2 lg:col-span-4">
                <h3 className="font-bold text-[20px] sm:text-[22px] leading-[1.2] tracking-[-0.02em]">
                  Lightweight command-line API client
                </h3>
                <p className="text-mute text-[15px] sm:text-[16px] max-w-[30em]">
                  One small, instant CLI replaces the pile of scattered curl
                  snippets in your notes and bash history.
                </p>
                <div
                  className="flex items-center gap-3 sm:gap-5 mt-auto pt-6 flex-wrap sm:flex-nowrap"
                  aria-hidden="true"
                >
                  <div className="scraps min-w-[100px]">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <span className="text-sun font-medium text-[20px] sm:text-[22px] font-mono">
                    →
                  </span>
                  <div className="font-medium text-[13px] sm:text-[14px] font-mono text-sun px-4 sm:px-[26px] py-3 sm:py-[22px] rounded-[12px] bg-[#0e0c13] border border-[rgba(242,193,78,0.45)] shadow-[0_0_40px_rgba(242,193,78,0.12)] shrink-0">
                    api.acr
                  </div>
                </div>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* Who is autocurl for? Section */}
        <section
          aria-labelledby="who-heading"
          className="py-16 md:py-[88px] border-t border-line bg-[rgba(21,19,27,0.72)] backdrop-blur-[10px]"
        >
          <div className="max-w-[1120px] mx-auto px-6">
            <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
              Audience & Use Cases
            </div>
            <h2
              id="who-heading"
              className="font-extrabold text-[clamp(28px,3.8vw,46px)] leading-[1.1] tracking-[-0.03em] max-w-[20em]"
            >
              Who is autocurl for?
            </h2>
            <p className="mt-[14px] max-w-[36em] text-mute text-[15px] sm:text-[16px]">
              Designed specifically for developers who prefer the speed,
              automation, and transparency of terminal workflows.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <div className="p-6 rounded-2xl border border-line bg-[#0e0c13]/60">
                <div className="text-sun font-mono text-[14px] font-bold mb-2">
                  01. Backend Developers
                </div>
                <h3 className="font-bold text-[18px] mb-2 text-bone">
                  Fast Local API Iteration
                </h3>
                <p className="text-mute text-[14px] leading-relaxed">
                  Test your Express, FastAPI, Go, or Rails routes locally without
                  opening heavy GUI tools or searching through bash history for
                  long curl flags.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-line bg-[#0e0c13]/60">
                <div className="text-sun font-mono text-[14px] font-bold mb-2">
                  02. DevOps & Infrastructure
                </div>
                <h3 className="font-bold text-[18px] mb-2 text-bone">
                  Headless & SSH Environments
                </h3>
                <p className="text-mute text-[14px] leading-relaxed">
                  Run requests seamlessly over SSH on remote dev servers and
                  staging boxes where no graphical browser or Electron app can
                  exist.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-line bg-[#0e0c13]/60">
                <div className="text-sun font-mono text-[14px] font-bold mb-2">
                  03. API & Engineering Teams
                </div>
                <h3 className="font-bold text-[18px] mb-2 text-bone">
                  Version-Controlled Collections
                </h3>
                <p className="text-mute text-[14px] leading-relaxed">
                  Keep requests inside the repo right alongside the API code.
                  When endpoints update, your API request files are updated and
                  reviewed in the same PR.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="py-16 md:py-[88px] border-t border-line bg-[rgba(21,19,27,0.72)] backdrop-blur-[10px]"
        >
          <div className="max-w-[1120px] mx-auto px-6">
            <div className="font-mono text-sun text-[13px] font-semibold uppercase tracking-wider mb-2">
              FAQ
            </div>
            <h2
              id="faq-heading"
              className="font-extrabold text-[clamp(28px,3.8vw,46px)] leading-[1.1] tracking-[-0.03em]"
            >
              Frequently Asked Questions
            </h2>
            <p className="mt-[14px] max-w-[34em] text-mute text-[15px] sm:text-[16px] mb-10">
              Clear answers about autocurl, curl compatibility, and command-line
              API workflows.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-line bg-[#0e0c13]/70 flex flex-col justify-start"
                >
                  <h3 className="font-bold text-[18px] text-bone mb-3">
                    {item.question}
                  </h3>
                  <p className="text-mute text-[14.5px] leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Install Section */}
        <section
          id="install"
          aria-labelledby="install-heading"
          className="py-16 md:py-[88px] border-t border-line bg-[rgba(21,19,27,0.72)] backdrop-blur-[10px] text-center"
        >
          <div className="max-w-[1120px] mx-auto px-6">
            <h2
              id="install-heading"
              className="font-extrabold text-[clamp(28px,3.8vw,46px)] leading-[1.1] tracking-[-0.03em] max-w-[16em] mx-auto"
            >
              Try it on your next API.
            </h2>
            <p className="mt-[14px] text-mute text-[16px] max-w-[30em] mx-auto">
              Install autocurl in seconds and start managing curl requests as
              clean code.
            </p>
            <div className="inline-flex max-w-full flex-wrap gap-2.5 sm:gap-[14px] items-center font-medium text-[13.5px] sm:text-[15px] font-mono bg-[rgba(21,19,27,0.7)] border border-line rounded-[10px] px-3.5 sm:px-4 py-2.5 sm:py-3 backdrop-blur-[6px] mt-6 sm:mt-[30px]">
              <span className="truncate">brew install autocurl</span>
              <CopyButton text="brew install autocurl" />
            </div>

            <div className="mt-8 flex justify-center gap-4 text-[14px]">
              <Link
                href="/docs/installation"
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
