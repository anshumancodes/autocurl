"use client";

import { useEffect, useRef } from "react";

export default function TerminalDemo() {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = preRef.current;
    if (!el) return;

    const final =
      '<span class="p">$</span> autocurl index.js\n<span class="d">Read 4 requests</span>\n<span class="s">Wrote index.autocurl</span>\n\n<span class="p">$</span> autocurl index.autocurl\n? Select a request\n  List users\n<span class="sel">❯ Create user</span>\n  Update user\n  Delete user\n\n<span class="d">→ curl -X POST https://api.dev/users</span>\n<span class="s">201 Created</span>';

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.innerHTML = final;
      return;
    }

    const seq: Array<[string, string | null, number]> = [
      ['<span class="p">$</span> ', "autocurl index.js", 350],
      [
        '\n<span class="d">Read 4 requests</span>\n<span class="s">Wrote index.autocurl</span>\n\n',
        null,
        600,
      ],
      ['<span class="p">$</span> ', "autocurl index.autocurl", 350],
      [
        '\n? Select a request\n  List users\n<span class="sel">❯ Create user</span>\n  Update user\n  Delete user\n',
        null,
        900,
      ],
      [
        '\n<span class="d">→ curl -X POST https://api.dev/users</span>\n<span class="s">201 Created</span>',
        null,
        0,
      ],
    ];

    let html = "";
    let i = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const step = () => {
      if (!el) return;
      if (i >= seq.length) {
        el.classList.remove("cur");
        return;
      }
      const [pre, typed, wait] = seq[i];
      html += pre;

      if (!typed) {
        el.innerHTML = html;
        i++;
        timeoutId = setTimeout(step, wait);
        return;
      }

      let n = 0;
      el.classList.add("cur");
      intervalId = setInterval(() => {
        n++;
        el.innerHTML = html + typed.slice(0, n);
        if (n >= typed.length) {
          clearInterval(intervalId);
          html += typed;
          i++;
          timeoutId = setTimeout(step, wait);
        }
      }, 55);
    };

    timeoutId = setTimeout(step, 500);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      className="term"
      role="img"
      aria-label="Terminal demo: autocurl index.js generates index.autocurl, then autocurl index.autocurl opens a request picker."
    >
      <div className="bar">
        <i></i>
        <i></i>
        <i></i>
      </div>
      <pre ref={preRef} id="t"></pre>
    </div>
  );
}
