import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export default function Footer() {
  return (
    <footer className="py-12 sm:py-16 text-[14px] text-mute bg-[rgba(21,19,27,0.92)] border-t border-line mt-auto">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Brand & Philosophy */}
          <div>
            <Link
              href="/"
              className="font-extrabold text-[20px] tracking-[-0.02em] text-bone no-underline inline-block mb-3"
            >
              auto<span className="text-sun">curl</span>
            </Link>
            <p className="text-[13.5px] leading-relaxed text-mute mb-4">
              A fast, local-first CLI tool for generating and running curl
              requests from clean, human-readable <code className="text-sun">.acr</code> files.
            </p>
            <div className="font-mono text-[12.5px] text-mute">
              <span>Licensed under MIT</span>
            </div>
          </div>

          {/* Column 2: Documentation */}
          <div>
            <div className="font-bold text-bone text-[14px] uppercase tracking-wider mb-3">
              Documentation
            </div>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0 text-[13.5px]">
              <li>
                <Link
                  href="/docs"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Overview & Architecture
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/getting-started"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Getting Started (2-min Quickstart)
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/installation"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Installation & Setup
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/usage"
                  className="hover:text-bone transition-colors no-underline"
                >
                  CLI Usage & Interactive Runner
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/acr-format"
                  className="hover:text-bone transition-colors no-underline"
                >
                  .acr File Format Spec
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/commands"
                  className="hover:text-bone transition-colors no-underline"
                >
                  CLI Command Reference
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/examples"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Real-World API Examples
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Guides & Intent */}
          <div>
            <div className="font-bold text-bone text-[14px] uppercase tracking-wider mb-3">
              Developer Guides
            </div>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0 text-[13.5px]">
              <li>
                <Link
                  href="/curl-command-generator"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Curl Command Generator Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/curl-api-testing"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Curl API Testing from CLI
                </Link>
              </li>
              <li>
                <Link
                  href="/curl-alternative"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Curl & Postman Alternative
                </Link>
              </li>
              <li>
                <Link
                  href="/#how"
                  className="hover:text-bone transition-colors no-underline"
                >
                  The index.js → index.acr Workflow
                </Link>
              </li>
              <li>
                <Link
                  href="/#why"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Why Git-Tracked Curl Files
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Community & Resources */}
          <div>
            <div className="font-bold text-bone text-[14px] uppercase tracking-wider mb-3">
              Open Source
            </div>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0 text-[13.5px]">
              <li>
                <a
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-bone transition-colors no-underline flex items-center gap-1.5"
                >
                  <span>GitHub Repository</span>
                  <span className="text-[11px] text-mute">↗</span>
                </a>
              </li>
              <li>
                <a
                  href={`${siteConfig.links.github}/issues`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-bone transition-colors no-underline flex items-center gap-1.5"
                >
                  <span>Report an Issue / Feedback</span>
                  <span className="text-[11px] text-mute">↗</span>
                </a>
              </li>
              <li>
                <a
                  href={`${siteConfig.links.github}/releases`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-bone transition-colors no-underline flex items-center gap-1.5"
                >
                  <span>Releases & Changelog</span>
                  <span className="text-[11px] text-mute">↗</span>
                </a>
              </li>
              <li>
                <Link
                  href="/#install"
                  className="hover:text-bone transition-colors no-underline"
                >
                  brew install autocurl
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-line flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-3 text-[13px]">
          <span>
            © {new Date().getFullYear()} autocurl. Plain-text curl requests for
            developers.
          </span>
          <span>
            Created with ❤️ by{" "}
            <a
              href={siteConfig.author.url}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-bone transition-colors"
            >
              {siteConfig.author.name}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
