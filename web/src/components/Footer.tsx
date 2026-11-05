import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export default function Footer() {
  return (
    <footer className="py-12 sm:py-16 text-[14px] text-mute bg-[rgba(21,19,27,0.92)] border-t border-line mt-auto">
      <div className="max-w-280 mx-auto px-6">
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
              A CLI API testing tool that discovers routes in your codebase and
              runs requests from human-readable <code className="text-sun">.autocurl</code> files,
              for developers and AI coding agents.
            </p>
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
                  Why autocurl
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/getting-started"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Getting Started
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/using-autocurl"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Using autocurl
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/supported-frameworks"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Supported Frameworks
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Guides & comparisons */}
          <div>
            <div className="font-bold text-bone text-[14px] uppercase tracking-wider mb-3">
              Guides
            </div>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0 text-[13.5px]">
              {[
                { href: "/docs/guides/ai-coding-agents", label: "API Requests for AI Agents" },
                { href: "/docs/guides/test-apis-from-terminal", label: "Test APIs from the Terminal" },
                { href: "/docs/guides/discover-api-routes", label: "Discover API Routes from Code" },
                { href: "/docs/compare/autocurl-vs-postman", label: "autocurl vs Postman" },
                { href: "/docs/compare/autocurl-vs-curl", label: "autocurl vs curl" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-bone transition-colors no-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
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
                 
                </a>
              </li>
              <li>
                <a
                  href="https://www.buymeacoffee.com/anshumancdx"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-bone transition-colors no-underline"
                >
                  Buy me a coffee
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-line flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-3 text-[13px]">
          <span>
            © {new Date().getFullYear()} autocurl. Plain-text API requests for
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
