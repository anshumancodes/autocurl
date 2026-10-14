
"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

const FORM_URL =
  "https://snowy-ski-a5d.notion.site/ebd//3f9d9295e83b80fd9cffd796e9191923";

export default function EarlyAccessPage() {
  const [loading, setLoading] = useState(true);

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:pt-24">

        {/* Header */}
        <header className="mb-14 flex items-center justify-between">
          <a
            href="/"
            className=" text-xl font-semibold tracking-tight"
          >
            auto<span className="text-yellow-400">curl</span>
          </a>

          <a
            href="/"
            className="text-sm text-neutral-400 transition hover:text-white"
          >
            Back to home  
          </a>
        </header>

        {/* Hero */}
        <section className="mb-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            Early access is open
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Be among the first
            <br />
            to try <span className="text-yellow-400">autocurl.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            We're building a better way to discover, generate, and run
            API requests, without the JSON mess.
          </p>

          <p className="mt-4 text-sm text-neutral-500">
            Join the early access list and help shape what we're building.
          </p>
        </section>

        {/* Form */}
        <section className="overflow-hidden rounded-xl border border-neutral-800 bg-[#111111]">
          <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
            

            <span className=" text-xs text-neutral-600">
             early access form
            </span>
          </div>

          <div className="relative bg-white">
            {loading && (
              <div className="absolute inset-0 z-10 flex min-h-150 items-center justify-center bg-white">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              </div>
            )}

            <iframe
              src={FORM_URL}
              title="Autocurl Early Access Form"
              width="100%"
              height="2200"
              onLoad={() => setLoading(false)}
              className="block w-full border-0"
              allowFullScreen
              scrolling="no"
            />
          </div>
        </section>

        {/* Fallback */}
        <p className="mt-5 text-center text-sm text-neutral-500">
          Having trouble viewing the form?{" "}
          <a
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-neutral-300 underline underline-offset-4 hover:text-white"
          >
            Open it directly
            <ArrowUpRight size={13} />
          </a>
        </p>

        {/* Footer */}
        <footer className="mt-20 flex items-center justify-between border-t border-neutral-800 pt-6 text-xs text-neutral-600">
          <span>© {new Date().getFullYear()} autocurl</span>
          <span>Built for developers.</span>
        </footer>
      </div>
    </main>
  );
}
