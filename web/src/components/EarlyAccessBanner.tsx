
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";

export default function EarlyAccessBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Early access announcement"
      className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-white/10 bg-white/4 px-10 py-2.5 text-center text-xs text-white/70"
    >
      <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
        Early access
      </span>

      <p>autocurl early access is now open.</p>

      <Link
        href="/early-access"
        className="inline-flex items-center gap-1 font-medium text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
      >
        Sign up for early access
        <ArrowUpRight size={12} />
      </Link>

      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
