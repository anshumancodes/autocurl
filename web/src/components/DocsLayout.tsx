import { ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";

interface DocsLayoutProps {
  children: ReactNode;
  breadcrumbs: { label: string; href?: string }[];
  currentSlug: string;
}

const docsNav = [
  {
    title: "Getting Started",
    links: [
      { title: "Documentation Overview", href: "/docs" },
      { title: "Quickstart (2 min)", href: "/docs/getting-started" },
      { title: "Installation", href: "/docs/installation" },
    ],
  },
  {
    title: "Core Concepts",
    links: [
      { title: "CLI Usage & Terminal Picker", href: "/docs/usage" },
      { title: ".acr File Format Specification", href: "/docs/acr-format" },
      { title: "CLI Command Reference", href: "/docs/commands" },
      { title: "Real-World Examples", href: "/docs/examples" },
    ],
  },
  {
    title: "Developer Guides",
    links: [
      { title: "Curl Command Generator", href: "/curl-command-generator" },
      { title: "Curl API Testing Guide", href: "/curl-api-testing" },
      { title: "Postman Alternative CLI", href: "/curl-alternative" },
    ],
  },
];

export default function DocsLayout({
  children,
  breadcrumbs,
  currentSlug,
}: DocsLayoutProps) {
  return (
    <>
      <div className="bg" aria-hidden="true"></div>
      <Navbar />

      <div className="max-w-[1120px] mx-auto px-6 py-8 sm:py-12">
        <Breadcrumbs items={breadcrumbs} />

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 items-start">
          {/* Docs Sidebar */}
          <aside className="hidden lg:block sticky top-8 bg-[rgba(21,19,27,0.7)] border border-line rounded-2xl p-5 backdrop-blur-[8px]">
            <nav aria-label="Documentation Sidebar">
              {docsNav.map((section, idx) => (
                <div key={idx} className={idx > 0 ? "mt-6" : ""}>
                  <div className="font-mono text-[12px] font-semibold text-sun uppercase tracking-wider mb-2.5">
                    {section.title}
                  </div>
                  <ul className="list-none p-0 m-0 space-y-1.5">
                    {section.links.map((link) => {
                      const isActive = currentSlug === link.href;
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className={`block text-[14px] px-2.5 py-1.5 rounded-lg transition-colors no-underline ${
                              isActive
                                ? "bg-sun text-ink font-semibold"
                                : "text-mute hover:text-bone hover:bg-white/5"
                            }`}
                          >
                            {link.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Docs Main Content */}
          <main className="min-w-0 prose-invert">
            <article>{children}</article>
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
}
