"use client";

import { useEffect, useRef } from "react";

export default function TerminalDemo() {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = preRef.current;
    if (!el) return;

    const final =
      '<span class="p">$</span> autocurl index.js\n<span class="d">Read 4 requests</span>\n<span class="s">Wrote index.autocurl</span>\n\n<span class="p">$</span> autocurl index.autocurl\nSelect request:\n  1. GET /users\n<span class="sel">  2. POST /users</span>\n  3. PUT /users/{id}\n  4. DELETE /users/{id}\nSelect request: 2\n\n<span class="d">POST https://api.dev/users</span>\n<span class="s">HTTP 201 Created</span>';

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
        '\nSelect request:\n  1. GET /users\n<span class="sel">  2. POST /users</span>\n  3. PUT /users/{id}\n  4. DELETE /users/{id}\nSelect request: 2\n',
        null,
        900,
      ],
      [
        '\n<span class="d">POST https://api.dev/users</span>\n<span class="s">HTTP 201 Created</span>',
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
      className="w-full bg-[rgba(14,12,19,0.86)] border border-line rounded-[14px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      role="img"
        aria-label="Terminal demo: autocurl generates index.autocurl, then lists requests with numbers so one can be selected by number."
    >
      <div className="flex gap-1.75 px-3.5 py-3 border-b border-line">
        <i className="w-2.75 h-2.75 rounded-full bg-line not-italic block" />
        <i className="w-2.75 h-2.75 rounded-full bg-line not-italic block" />
        <i className="w-2.75 h-2.75 rounded-full bg-line not-italic block" />
      </div>
      <pre
        ref={preRef}
        id="t"
        className="font-mono text-[12.5px] sm:text-[14px] leading-[1.65] sm:leading-[1.7] p-3.5 sm:p-5 whitespace-pre-wrap break-all sm:break-normal min-h-72.5 sm:min-h-82.5 text-bone font-normal overflow-x-auto"
      ></pre>
    </div>
  );
}
