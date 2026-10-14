
"use client";

import { useState } from "react";

export default function DevelopmentBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-white/10 bg-white/4 px-4 py-2 pr-10 text-center text-xs text-white/70 sm:px-10"
    >
      <span className="shrink-0 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
        Early access
      </span>

      <p className="min-w-0">
        autocurl is still in development. Some features may be
        unstable or not work as expected.
      </p>

      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}