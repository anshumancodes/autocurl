"use client";

import { useState } from "react";
import Link from "next/link";

const REPOSITORY_URL = "https://github.com/anshumancodes/autocurl";

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#install", label: "Install" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMenu = () => setIsMobileMenuOpen(false);
  return (
    <header className="sticky top-0 max-w-280 w-full mx-auto px-6 relative z-50 backdrop-blur-md">
      <nav className="flex justify-between items-center py-5 sm:py-5.5">
        <Link className="font-extrabold text-[22px] tracking-[-0.02em] no-underline" href="/">auto<span className="text-sun">cURL</span></Link>
        <div className="hidden md:flex items-center">{NAV_LINKS.map((link) => <Link key={link.href} className="text-[15px] text-mute no-underline ml-6 hover:text-bone transition-colors" href={link.href}>{link.label}</Link>)}<a className="ml-6 inline-flex items-center gap-2 rounded-lg border border-line bg-[rgba(21,19,27,0.7)] px-3.5 py-2 text-sm font-medium text-bone no-underline transition-colors hover:border-sun hover:text-sun" href={REPOSITORY_URL} target="_blank" rel="noreferrer"><GitHubIcon />GitHub</a></div>
        <button type="button" onClick={() => setIsMobileMenuOpen((prev) => !prev)} className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg border border-line bg-[rgba(21,19,27,0.7)] text-bone hover:text-sun focus:outline-none transition-colors shrink-0" aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isMobileMenuOpen}>
          {isMobileMenuOpen ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>}
        </button>
      </nav>
      {isMobileMenuOpen && <div className="md:hidden absolute top-full left-6 right-6 mt-1 p-3 bg-[rgba(21,19,27,0.96)] border border-line rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col gap-1 z-50">{NAV_LINKS.map((link) => <Link key={link.href} onClick={closeMenu} className="text-[15px] text-mute hover:text-bone hover:bg-white/5 px-3.5 py-2.5 rounded-lg transition-colors no-underline" href={link.href}>{link.label}</Link>)}<a onClick={closeMenu} className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-[rgba(21,19,27,0.7)] px-3.5 py-2.5 text-[15px] font-medium text-bone no-underline transition-colors hover:border-sun hover:text-sun" href={REPOSITORY_URL} target="_blank" rel="noreferrer"><GitHubIcon size={17} />GitHub repository</a></div>}
    </header>
  );
}
