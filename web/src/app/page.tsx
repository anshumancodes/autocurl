'use client';

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
      <header className="wrap">
        <nav>
          <a className="logo" href="#">
            auto<span>curl</span>
          </a>
          <div>
            <a className="link" href="#how">
              How it works
            </a>
            <a className="link" href="#why">
              Why autocurl
            </a>
            <a className="link" href="#install">
              Install
            </a>
          </div>
        </nav>
      </header>

      <main>
        <div className="wrap hero">
          <div>
            <h1>
              Every curl request, in one file <FlipWord /> can read.
            </h1>
            <p className="lede">
              Define your requests in JavaScript. autocurl turns them into a
              plain <code>.autocurl</code> file, then lets you pick one and run
              it. No GUI, no account, nothing leaves your machine.
            </p>
            <div className="install">
              <span>brew install autocurl</span>
              <CopyButton text="brew install autocurl" />
            </div>
            <p className="sub">
              Works on any project that has a JavaScript file.
            </p>
          </div>
          <TerminalDemo />
        </div>

        <section id="how">
          <div className="wrap">
            <h2>Write once. Read anywhere. Run what you pick.</h2>
            <p className="intro">
              Three steps, and the middle one is a file you can open in any
              editor.
            </p>
            <div className="steps">
              <div className="step">
                <div className="fn">index.js</div>
                <h3>Define requests</h3>
                <p>List your requests as plain JavaScript.</p>
                <div className="code">
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
              <div className="step">
                <div className="fn">autocurl index.js</div>
                <h3>Generate the .autocurl file</h3>
                <p>
                  Each request becomes a ready-to-run curl command. Copy one by
                  hand or run it yourself.
                </p>
                <div className="code">
                  {`# List users
curl -X GET \\
  "https://api.dev/users"

# Create user
curl -X POST \\
  "https://api.dev/users" \\
  -d '{"name":"Ada"}'`}
                </div>
              </div>
              <div className="step">
                <div className="fn">autocurl index.autocurl</div>
                <h3>Pick and run</h3>
                <p>
                  autocurl lists every request. Choose one and it runs in your
                  terminal.
                </p>
                <div className="code">
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

        <section id="why" className="why">
          <div className="wrap">
            <h2>Built to stay out of your way.</h2>
            <p className="intro">
              Your requests are plain text on your own disk. Nothing else to run, host or log into.
            </p>

            <div className="bento">
              {/* Version control: wide */}
              <article className="cell c-git" onMouseMove={spot}>
                <h3>Easy to version-control</h3>
                <p>
                  The .autocurl file is plain text, so diffs and pull requests show exactly what changed.
                </p>
                <div className="shot">
                  <div className="shot-head">api.autocurl</div>
                  <div className="ln">  # Create user</div>
                  <div className="ln del">- curl -X POST "https://api.dev/users" \</div>
                  <div className="ln add">+ curl -X POST "https://api.dev/v2/users" \</div>
                  <div className="ln">{`    -d '{"name":"Ada"}'`}</div>
                </div>
              </article>

              {/* Local only: narrow */}
              <article className="cell c-local" onMouseMove={spot}>
                <h3>Local only</h3>
                <p>Requests live in files on your disk.</p>
                <div className="chips">
                  <span className="chip no">Sync</span>
                  <span className="chip no">Cloud</span>
                  <span className="chip no">Sign-in</span>
                  <span className="chip yes">Just files</span>
                </div>
              </article>

              {/* Human-readable: narrow */}
              <article className="cell c-read" onMouseMove={spot}>
                <h3>Human-readable</h3>
                <p>Open the file and copy any curl command. You never need autocurl to use it.</p>
                <div className="shot">
                  <div className="ln hl">curl "https://api.dev/users"</div>
                </div>
              </article>

              {/* Not heavy: wide */}
              <article className="cell c-light" onMouseMove={spot}>
                <h3>Not a heavy API client</h3>
                <p>One small CLI replaces the pile of scattered curl snippets in your notes.</p>
                <div className="merge" aria-hidden="true">
                  <div className="scraps">
                    <i /><i /><i /><i /><i />
                  </div>
                  <span className="arrow">→</span>
                  <div className="onefile">api.autocurl</div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="install" className="cta">
          <div className="wrap">
            <h2>Try it on your next API.</h2>
            <div className="install">
              <span>brew install autocurl</span>
              <CopyButton text="brew install autocurl" />
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span>© {new Date().getFullYear()} autocurl </span>
          <span>All rights reserved. </span>
          <span>Created with ❤️ by <Link href="github.com/anshumancodes" className="underline">Anshuman</Link></span>
        </div>
      </footer>
    </>
  );
}
