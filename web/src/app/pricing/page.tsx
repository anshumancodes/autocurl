import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pricing",
  description: "autocurl is free forever. Support development and get yearly release access and community access.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <>
    <div className="bg" aria-hidden="true" />
    <Navbar />
    <main className="max-w-280 mx-auto px-6 py-20 sm:py-28">
      <div className="text-center">
        <p className="font-mono text-sun text-xs uppercase tracking-widest">Simple, transparent pricing</p>
        <h1 className="mt-4 font-extrabold text-[clamp(32px,5.2vw,64px)] leading-tight tracking-[-0.035em] text-bone">Free to use. Support if you can.</h1>
        <p className="mt-5 text-mute text-lg leading-relaxed max-w-2xl mx-auto">Use autocurl for free, forever. If it helps your work, a donation supports its continued development.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <section className="rounded-2xl border border-line bg-[rgba(21,19,27,0.7)] p-7 sm:p-9 text-left">
          <p className="font-mono text-sun text-xs uppercase tracking-widest">For everyone</p>
          <h2 className="mt-3 text-2xl font-bold text-bone">Free forever</h2>
          <p className="mt-4 text-mute leading-relaxed">All the core autocurl features, free to use. No account or subscription required.</p>
          <Link className="mt-7 inline-flex rounded-xl bg-sun text-ink px-5 py-3 font-semibold no-underline" href="/docs/getting-started">Get started</Link>
        </section>
        <section className="rounded-2xl border border-line bg-[rgba(21,19,27,0.7)] p-7 sm:p-9 text-left">
          <p className="font-mono text-sun text-xs uppercase tracking-widest">Support development</p>
          <h2 className="mt-3 text-2xl font-bold text-bone">Support development</h2>
          <p className="mt-4 text-mute leading-relaxed">Enjoying autocurl? Donations help fund development. Supporters get access to yearly releases and the autocurl community.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#000] bg-[#FFDD00] px-3 text-sm font-semibold text-[#000] no-underline hover:brightness-95 transition"
              href="https://www.buymeacoffee.com/anshumancdx"
              target="_blank"
              rel="noreferrer"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                <path d="M4 3h14v3h2a2 2 0 0 1 2 2v2a5 5 0 0 1-5 5h-.4A6 6 0 0 1 11 19H8a6 6 0 0 1-6-6V3h2Zm14 5v4a3 3 0 0 0 2-2V8h-2ZM5 6v7a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3V6H5Zm-1 15h15v2H4v-2Z" />
              </svg>
              Buy me a coffee
            </a>
            <iframe
              src="https://github.com/sponsors/anshumancodes/button"
              title="Sponsor anshumancodes"
              height="36"
              width="176"
              style={{ border: 0, borderRadius: 6, alignSelf: "center" }}
            />
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </>;
}
