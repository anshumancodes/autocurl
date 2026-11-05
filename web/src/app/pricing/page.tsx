import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pricing: Free, Open-Source CLI API Tool",
  description:
    "autocurl is free and MIT-licensed, with no account or subscription. Optional donations support development and include yearly release and community access.",
  path: "/pricing",
});

export default function PricingPage() {
  return <>
    <div className="bg" aria-hidden="true" />
    <Navbar />
    <main>
      <section aria-labelledby="pricing-heading" className="px-3 sm:px-6 pt-[calc(10vh+12px)] sm:pt-[calc(10vh+16px)] pb-16 md:pb-24">
        <div className="surface dot-grid relative mx-auto max-w-280 overflow-hidden rounded-[28px] lg:rounded-[52px]">
          <div className="relative mx-auto max-w-280 px-5 sm:px-10 pt-14 sm:pt-24 pb-5 sm:pb-10">
            <div className="flex flex-col items-center text-center">
              <p className="inline-flex max-w-full items-center rounded-full border border-line bg-[rgba(21,19,27,0.7)] px-3 sm:px-3.5 py-1.5 font-mono text-sun text-[11px] sm:text-[12px] font-semibold tracking-[0.04em] sm:tracking-[0.14em]">Free, open-source software</p>
              <h1 id="pricing-heading" className="mt-7 sm:mt-8 max-w-[12em] text-balance font-extrabold text-[clamp(40px,6.4vw,80px)] leading-[1.04] tracking-[-0.04em] text-bone">Free to use. Support if you can.</h1>
              <p className="mt-6 sm:mt-7 max-w-[34em] text-mute text-[16px] sm:text-[18px] leading-[1.65]">Use autocurl for free, forever. If it helps your work, a donation supports its continued development.</p>
            </div>

            <div className="mt-12 sm:mt-16 grid gap-5 lg:gap-7 md:grid-cols-2 max-w-4xl mx-auto">
              <section className="reveal surface lifted flex flex-col rounded-[28px] sm:rounded-[32px] border-sun/40! p-6 sm:p-8 text-left">
                <p className="self-start inline-flex items-center rounded-full border border-line bg-[rgba(14,12,19,0.5)] px-2.5 py-1 font-mono text-sun text-[11px] tracking-[0.12em]">For everyone</p>
                <h2 className="mt-5 font-bold text-[22px] sm:text-[24px] leading-[1.25] tracking-[-0.02em] text-bone">Free forever</h2>
                <p className="mt-3 text-mute text-[15px] sm:text-[16px] leading-[1.65]">All the core autocurl features, free to use: route discovery, .autocurl generation, and terminal execution. Open source under the MIT license, with no account or subscription required.</p>
                <div className="mt-auto pt-8">
                  <Link className="press lifted inline-flex w-full justify-center items-center gap-1.5 min-h-12 rounded-[14px] bg-sun text-ink px-5 font-semibold no-underline" href="/docs/getting-started">
                    Get started
                    <span aria-hidden="true" className="nudge">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  </Link>
                </div>
              </section>
              <section className="reveal surface flex flex-col rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 text-left">
                <p className="self-start inline-flex items-center rounded-full border border-line bg-[rgba(14,12,19,0.5)] px-2.5 py-1 font-mono text-sun text-[11px] tracking-[0.12em]">Support development</p>
                <h2 className="mt-5 font-bold text-[22px] sm:text-[24px] leading-[1.25] tracking-[-0.02em] text-bone">Support development</h2>
                <p className="mt-3 text-mute text-[15px] sm:text-[16px] leading-[1.65]">Enjoying autocurl? Donations help fund development. Supporters get access to yearly releases and the autocurl community.</p>
                <div className="mt-auto pt-8 flex flex-col gap-3">
                  <a
                    className="press inline-flex min-h-12 justify-center items-center gap-2 rounded-[14px] border border-[#000] bg-[#FFDD00] px-5 text-[15px] font-semibold text-[#000] no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-2px_0_rgba(0,0,0,0.35),0_10px_24px_-10px_rgba(0,0,0,0.6)] hover:brightness-95"
                    href="https://www.buymeacoffee.com/anshumancdx"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                      <path d="M4 3h14v3h2a2 2 0 0 1 2 2v2a5 5 0 0 1-5 5h-.4A6 6 0 0 1 11 19H8a6 6 0 0 1-6-6V3h2Zm14 5v4a3 3 0 0 0 2-2V8h-2ZM5 6v7a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3V6H5Zm-1 15h15v2H4v-2Z" />
                    </svg>
                    Buy me a coffee
                  </a>
                  <a
                    className="press group inline-flex min-h-12 justify-center items-center gap-2 rounded-[14px] border border-line bg-[rgba(21,19,27,0.7)] px-5 text-[15px] font-semibold text-bone no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-2px_0_rgba(0,0,0,0.35),0_10px_24px_-10px_rgba(0,0,0,0.6)] hover:border-sun/60 hover:text-sun"
                    href="https://github.com/sponsors/anshumancodes?o=esb"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" className="text-sun transition-transform duration-200 group-hover:scale-110" fill="currentColor">
                      <path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002Z" />
                    </svg>
                    Sponsor on GitHub
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
