"use client";

import type { MouseEvent } from "react";
import CopyButton from "@/components/CopyButton";
import FlipWord from "@/components/FlipWord";
import TerminalDemo from "@/components/TerminalDemo";
import Link from "next/link";

const spot = (e: MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
};

export default function Home() {
  return (
    <>
      <div className="bg" aria-hidden="true"></div>
      <header className="max-w-280 mx-auto px-6">
        <nav className="flex justify-between items-center py-5.5">
          <a
            className="font-extrabold text-[22px] tracking-[-0.02em] no-underline"
            href="#"
          >
            auto<span className="text-sun">curl</span>
          </a>
          <div>
            <a
              className="text-[15px] text-mute no-underline ml-6 hover:text-bone transition-colors max-[860px]:hidden"
              href="#how"
            >
              How it works
            </a>
            <a
              className="text-[15px] text-mute no-underline ml-6 hover:text-bone transition-colors max-[860px]:hidden"
              href="#why"
            >
              Why autocurl
            </a>
            <a
              className="text-[15px] text-mute no-underline ml-6 hover:text-bone transition-colors max-[860px]:hidden"
              href="#install"
            >
              Install
            </a>
          </div>
        </nav>
      </header>

      <main>
        <div className="max-w-[1120px] mx-auto grid grid-cols-[1fr_1.05fr] gap-[48px] items-center pt-[56px] pb-[96px] h-screen max-[860px]:grid-cols-1 max-[860px]:h-auto max-[860px]:pb-16">
          <div>
            <h1 className="font-extrabold text-[clamp(40px,5.6vw,72px)] leading-[1.02] tracking-[-0.035em]">
              Every curl request, in one file <FlipWord /> can read.
            </h1>
            <p className="mt-[22px] mb-[30px] max-w-[30em] text-mute text-[19px]">
              Define your requests in JavaScript. autocurl turns them into a
              plain <code>.autocurl</code> file, then lets you pick one and run
              it. No GUI, no account, nothing leaves your machine.
            </p>
            <div className="inline-flex gap-[14px] items-center font-medium text-[15px] font-mono bg-[rgba(21,19,27,0.7)] border border-line rounded-[10px] px-4 py-3 backdrop-blur-[6px]">
              <span>brew install autocurl</span>
              <CopyButton text="brew install autocurl" />
            </div>
            <p className="mt-[14px] text-[14px] text-mute">
              Works on any project that has a JavaScript file.
            </p>
          </div>
          <TerminalDemo />
        </div>

        <section
          id="how"
          className="py-[88px] border-t border-line bg-[rgba(21,19,27,0.72)] backdrop-blur-[10px]"
        >
          <div className="max-w-[1120px] mx-auto px-6">
            <h2 className="font-extrabold text-[clamp(30px,3.8vw,46px)] leading-[1.08] tracking-[-0.03em] max-w-[16em]">
              Write once. Read anywhere. Run what you pick.
            </h2>
            <p className="mt-[14px] max-w-[34em] text-mute">
              Three steps, and the middle one is a file you can open in any
              editor.
            </p>
            <div className="grid grid-cols-3 gap-5 mt-11 max-[860px]:grid-cols-1">
              <div>
                <div className="font-medium text-[13px] font-mono text-sun">
                  index.js
                </div>
                <h3 className="font-bold text-[20px] mt-[14px] mb-[6px]">
                  Define requests
                </h3>
                <p className="text-mute text-[16px]">
                  List your requests as plain JavaScript.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[10px] p-4 font-mono text-[13px] leading-[1.65] whitespace-pre overflow-x-auto">
                  {`export default [
  {
    name: "List users",
    method: "GET",
    url: "https://api.dev/users"
  },
  {
    name: "Create user",
    method: "POST",
    url: "https://api.dev/users",
    body: { name: "Ada" }
  }
]`}
                </div>
              </div>
              <div>
                <div className="font-medium text-[13px] font-mono text-sun">
                  autocurl index.js
                </div>
                <h3 className="font-bold text-[20px] mt-[14px] mb-[6px]">
                  Generate the .autocurl file
                </h3>
                <p className="text-mute text-[16px]">
                  Each request becomes a ready-to-run curl command. Copy one by
                  hand or run it yourself.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[10px] p-4 font-mono text-[13px] leading-[1.65] whitespace-pre overflow-x-auto">
                  {`# List users
curl -X GET \\
  "https://api.dev/users"

# Create user
curl -X POST \\
  "https://api.dev/users" \\
  -d '{"name":"Ada"}'`}
                </div>
              </div>
              <div>
                <div className="font-medium text-[13px] font-mono text-sun">
                  autocurl index.autocurl
                </div>
                <h3 className="font-bold text-[20px] mt-[14px] mb-[6px]">
                  Pick and run
                </h3>
                <p className="text-mute text-[16px]">
                  autocurl lists every request. Choose one and it runs in your
                  terminal.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[10px] p-4 font-mono text-[13px] leading-[1.65] whitespace-pre overflow-x-auto">
                  {`? Select a request
  ❯ List users
    Create user

→ curl -X GET ...
200 OK`}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="why"
          className="py-[112px] border-t border-line bg-[rgba(21,19,27,0.72)] backdrop-blur-[10px]"
        >
          <div className="max-w-[1120px] mx-auto px-6">
            <h2 className="font-extrabold text-[clamp(34px,4.4vw,56px)] leading-[1.08] tracking-[-0.03em] max-w-[16em]">
              Built to stay out of your way.
            </h2>
            <p className="mt-[14px] max-w-[34em] text-mute">
              Your requests are plain text on your own disk. Nothing else to
              run, host or log into.
            </p>

            <div className="grid grid-cols-6 gap-4 mt-14 max-[860px]:grid-cols-1">
              {/* Version control: wide */}
              <article
                className="cell col-span-4 max-[860px]:col-auto"
                onMouseMove={spot}
              >
                <h3 className="font-bold text-[22px] leading-[1.2] tracking-[-0.02em]">
                  Easy to version-control
                </h3>
                <p className="text-mute text-[16px] max-w-[30em]">
                  The .autocurl file is plain text, so diffs and pull requests
                  show exactly what changed.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[12px] font-mono text-[13px] leading-[1.8] overflow-x-auto mt-6">
                  <div className="px-[14px] py-2 border-b border-line text-mute text-[12px]">
                    api.autocurl
                  </div>
                  <div className="px-[14px] whitespace-pre text-mute">
                    {" "}
                    # Create user
                  </div>
                  <div className="px-[14px] whitespace-pre bg-[rgba(255,120,120,0.1)] text-[#ff9d9d] shadow-[inset_2px_0_#ff9d9d]">
                    {`- curl -X POST "https://api.dev/users" \\`}
                  </div>
                  <div className="px-[14px] whitespace-pre bg-[rgba(143,180,255,0.12)] text-sky shadow-[inset_2px_0_var(--sky)]">
                    {`+ curl -X POST "https://api.dev/v2/users" \\`}
                  </div>
                  <div className="px-[14px] whitespace-pre text-mute">{`    -d '{"name":"Ada"}'`}</div>
                </div>
              </article>

              {/* Local only: narrow */}
              <article
                className="cell col-span-2 max-[860px]:col-auto"
                onMouseMove={spot}
              >
                <h3 className="font-bold text-[22px] leading-[1.2] tracking-[-0.02em]">
                  Local only
                </h3>
                <p className="text-mute text-[16px] max-w-[30em]">
                  Requests live in files on your disk.
                </p>
                <div className="flex flex-wrap gap-2 mt-auto pt-6">
                  <span className="font-medium text-[13px] font-mono px-3 py-[6px] rounded-full border border-line text-mute line-through decoration-[rgba(255,157,157,0.8)]">
                    Sync
                  </span>
                  <span className="font-medium text-[13px] font-mono px-3 py-[6px] rounded-full border border-line text-mute line-through decoration-[rgba(255,157,157,0.8)]">
                    Cloud
                  </span>
                  <span className="font-medium text-[13px] font-mono px-3 py-[6px] rounded-full border border-line text-mute line-through decoration-[rgba(255,157,157,0.8)]">
                    Sign-in
                  </span>
                  <span className="font-medium text-[13px] font-mono px-3 py-[6px] rounded-full border border-sun bg-sun text-ink">
                    Just files
                  </span>
                </div>
              </article>

              {/* Human-readable: narrow */}
              <article
                className="cell col-span-2 max-[860px]:col-auto"
                onMouseMove={spot}
              >
                <h3 className="font-bold text-[22px] leading-[1.2] tracking-[-0.02em]">
                  Human-readable
                </h3>
                <p className="text-mute text-[16px] max-w-[30em]">
                  Open the file and copy any curl command. You never need
                  autocurl to use it.
                </p>
                <div className="bg-[#0e0c13] border border-line rounded-[12px] font-mono text-[13px] leading-[1.8] overflow-x-auto mt-6">
                  <div className="px-[14px] py-3 whitespace-pre text-bone bg-[rgba(242,193,78,0.1)] shadow-[inset_2px_0_var(--sun)]">
                    {`curl "https://api.dev/users"`}
                  </div>
                </div>
              </article>

              {/* Not heavy: wide */}
              <article
                className="cell col-span-4 max-[860px]:col-auto"
                onMouseMove={spot}
              >
                <h3 className="font-bold text-[22px] leading-[1.2] tracking-[-0.02em]">
                  Not a heavy API client
                </h3>
                <p className="text-mute text-[16px] max-w-[30em]">
                  One small CLI replaces the pile of scattered curl snippets in
                  your notes.
                </p>
                <div
                  className="flex items-center gap-5 mt-auto pt-6"
                  aria-hidden="true"
                >
                  <div className="scraps">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <span className="text-sun font-medium text-[22px] font-mono">
                    →
                  </span>
                  <div className="font-medium text-[14px] font-mono text-sun px-[26px] py-[22px] rounded-[12px] bg-[#0e0c13] border border-[rgba(242,193,78,0.45)] shadow-[0_0_40px_rgba(242,193,78,0.12)]">
                    api.autocurl
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          id="install"
          className="py-[88px] border-t border-line bg-[rgba(21,19,27,0.72)] backdrop-blur-[10px] text-center"
        >
          <div className="max-w-[1120px] mx-auto px-6">
            <h2 className="font-extrabold text-[clamp(30px,3.8vw,46px)] leading-[1.08] tracking-[-0.03em] max-w-[16em] mx-auto">
              Try it on your next API.
            </h2>
            <div className="inline-flex gap-[14px] items-center font-medium text-[15px] font-mono bg-[rgba(21,19,27,0.7)] border border-line rounded-[10px] px-4 py-3 backdrop-blur-[6px] mt-[30px]">
              <span>brew install autocurl</span>
              <CopyButton text="brew install autocurl" />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-7 text-[14px] text-mute bg-[rgba(21,19,27,0.9)] border-t border-line">
        <div className="max-w-[1120px] mx-auto px-6 flex justify-between flex-wrap gap-[10px]">
          <span>© {new Date().getFullYear()} autocurl </span>
          <span>All rights reserved. </span>
          <span>
            Created with ❤️ by{" "}
            <Link href="github.com/anshuman" className="underline">
              Anshuman
            </Link>
          </span>
        </div>
      </footer>
    </>
  );
}
