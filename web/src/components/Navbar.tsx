"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

// One source of truth for both menus.
// `mobileOnly` links appear only in the mobile dropdown, so the desktop bar
// stays at four links with room to breathe.
const NAV_LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#why", label: "Why autocurl" },
  { href: "/docs", label: "Docs" },
  { href: "/curl-alternative", label: "vs Postman", mobileOnly: true },
  { href: "/#install", label: "Install" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
         <header className="w-[1120px] mx-auto px-6 relative z-50">
        <nav className="flex justify-between items-center py-5 sm:py-5.5">
          <a
            className="font-extrabold text-[22px] tracking-[-0.02em] no-underline"
            href="#"
          >
            auto<span className="text-sun">curl</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <a
              className="text-[15px] text-mute no-underline ml-6 hover:text-bone transition-colors"
              href="#how"
            >
              How it works
            </a>
            <a
              className="text-[15px] text-mute no-underline ml-6 hover:text-bone transition-colors"
              href="#why"
            >
              Why autocurl
            </a>
            <a
              className="text-[15px] text-mute no-underline ml-6 hover:text-bone transition-colors"
              href="#install"
            >
              Install
            </a>
            
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-line bg-[rgba(21,19,27,0.7)] text-bone hover:text-sun focus:outline-none transition-colors"
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
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[15px] text-mute hover:text-bone hover:bg-white/5 px-3.5 py-2.5 rounded-lg transition-colors no-underline"
              href="#how"
            >
              How it works
            </a>
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[15px] text-mute hover:text-bone hover:bg-white/5 px-3.5 py-2.5 rounded-lg transition-colors no-underline"
              href="#why"
            >
              Why autocurl
            </a>
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[15px] text-mute hover:text-bone hover:bg-white/5 px-3.5 py-2.5 rounded-lg transition-colors no-underline"
              href="#install"
            >
              Install
            </a>
          </div>
        )}
      </header>

  );
}