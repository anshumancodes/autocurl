"use client";

import { useState } from "react";
import Link from "next/link";

// One source of truth for both menus.
// `mobileOnly` links appear only in the mobile dropdown, so the desktop bar
// stays at four links with room to breathe.
interface NavLink {
  href: string;
  label: string;
  mobileOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: "/#how", label: "How it works" },
  { href: "/#why", label: "Why autocurl" },
  { href: "/docs", label: "Docs" },
  { href: "/#install", label: "Install" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="max-w-280 w-full mx-auto px-6 relative z-50">
      <nav className="flex justify-between items-center py-5 sm:py-5.5">
        <Link
          className="font-extrabold text-[22px] tracking-[-0.02em] no-underline"
          href="/"
        >
          auto<span className="text-sun">curl</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          {NAV_LINKS.filter((link) => !link.mobileOnly).map((link) => (
            <Link
              key={link.href}
              className="text-[15px] text-mute no-underline ml-6 hover:text-bone transition-colors"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg border border-line bg-[rgba(21,19,27,0.7)] text-bone hover:text-sun focus:outline-none transition-colors shrink-0"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-6 right-6 mt-1 p-3 bg-[rgba(21,19,27,0.96)] border border-line rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col gap-1 z-50">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              onClick={closeMenu}
              className="text-[15px] text-mute hover:text-bone hover:bg-white/5 px-3.5 py-2.5 rounded-lg transition-colors no-underline"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>

  );
}