import type { Metadata } from "next";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import FlipWord from "@/components/FlipWord";
import TerminalDemo from "@/components/TerminalDemo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "autocurl - CLI tool for generating and running curl requests",
  description:
    "Define your API requests in JavaScript. autocurl compiles them into a plain .autocurl file, then gives you an interactive terminal picker to run curl requests instantly. Local-first, git-friendly, zero GUI.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "autocurl - CLI tool for generating and running curl requests",
    description:
      "Define requests in JS, compile to plain .autocurl curl files, and run them with an interactive terminal picker. 100% local, git-diffable, and lightweight.",
    url: "/",
  },
};

const faqItems = [
  {
    question: "What is autocurl and how does it relate to curl?",
    answer:
      "autocurl is a command-line developer tool designed to bridge the gap between ad-hoc curl commands and heavy GUI API clients. It does not replace curl—instead, it lets you define API requests cleanly in JavaScript, generates standard, reproducible curl commands in a human-readable .autocurl file, and provides an interactive terminal runner to execute them.",
  },
  {
    question: "What is an .autocurl file?",
    answer:
      "An .autocurl file is a plain-text file containing standard, multi-line curl commands separated by readable comments. Because it is plain text, .autocurl files can be checked into git, reviewed in pull requests, and inspected in any text editor without proprietary software.",
  },
  {
    question: "Can I run .autocurl requests without autocurl installed?",
    answer:
      "Yes. Every request in an .autocurl file is formatted as valid, copy-pasteable curl commands with backslash line continuations. If a teammate does not have autocurl installed, they can simply copy and execute the command directly in any standard bash or zsh shell.",
  },
  {
    question: "How does autocurl compare to Postman or Insomnia?",
    answer:
      "Unlike Postman or Insomnia, autocurl requires no electron GUI, no account login, no cloud sync, and zero background memory overhead. All requests live directly in your repository as plain code and text, giving your team instant git diffs and offline reliability.",
  },
  {
    question: "How do I install autocurl?",
    answer:
      "Once the public binary distribution is deployed, the recommended installation will be curl -fsSL https://autocurl.lol/install.sh | sh. Homebrew and direct prebuilt binary downloads are also available.",
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
              Define API requests in a simple, human-readable format. Let agents
              and humans execute them without dealing with messy JSON,
              complicated tool schemas, or copy-pasting curl commands into the
              terminal.
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
                <span aria-hidden="true">
                  <ArrowRight />
                </span>
              </Link>
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
                  Define your API requests in any programming language
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
              Your API requests are plain text on your own disk. No cloud sync,
              no account hurdles, no 500 MB Electron client to open.
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
                  title: "Nothing leaves your machine",
                  body: "Requests live in files on your disk. No cloud sync, no telemetry, no sign-in required.",
                },
                {
                  label: "Human-readable",
                  title: "Open the file, read the file",
                  body: "Every .autocurl file is plain curl commands separated by comments. Inspect, edit, or share them in any text editor.",
                },
                {
                  label: "Zero lock-in",
                  title: "Works without autocurl installed",
                  body: "Each entry is a valid copy-pasteable curl command. Your team can run requests directly in bash or zsh without any tooling.",
                },
                {
                  label: "Lightweight",
                  title: "One small CLI, instant startup",
                  body: "No background processes, no memory overhead. autocurl starts and exits in milliseconds, exactly like a Unix tool should.",
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
                  Test your Express, FastAPI, Go, or Rails routes locally
                  without opening heavy GUI tools or searching through bash
                  history for long curl flags.
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
              Install autocurl in seconds and start managing curl requests as
              clean code.
            </p>
            <div className="inline-flex max-w-full flex-wrap gap-2.5 sm:gap-3.5 items-center font-medium text-[13.5px] sm:text-[15px] font-mono bg-[rgba(21,19,27,0.7)] border border-line rounded-[10px] px-3.5 sm:px-4 py-2.5 sm:py-3 backdrop-blur-[6px] mt-6 sm:mt-7.5">
              <span className="truncate">curl -fsSL https://autocurl.lol/install.sh | sh</span>
              <CopyButton text="curl -fsSL https://autocurl.lol/install.sh | sh" />
            </div>

            <div className="mt-8 flex justify-center gap-4 text-[14px]">
              <Link
                href="/docs/getting-started"
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
