import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AI and API key setup",
  description: "Use autocurl locally and connect optional AI discovery with your own Gemini API key.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <>
    <div className="bg" aria-hidden="true" />
    <Navbar />
    <main className="max-w-280 mx-auto px-6 py-20 sm:py-28 text-center">
      <p className="font-mono text-sun text-xs uppercase tracking-widest">Local first · Bring your own key</p>
      <h1 className="mt-4 font-extrabold text-[clamp(32px,5.2vw,64px)] leading-tight tracking-[-0.035em] text-bone">Use autocurl without an account</h1>
      <p className="mt-5 text-mute text-lg leading-relaxed max-w-2xl mx-auto">Route discovery and request execution run in the CLI. Optional AI analysis connects directly to Gemini with your API key and sends bounded, redacted source context for analysis. You control your provider usage and any associated charges.</p>
      <div className="mt-9 flex flex-wrap justify-center gap-4">
        <Link className="rounded-xl bg-sun text-ink px-5 py-3 font-semibold no-underline" href="/docs/getting-started">Get started</Link>
        <Link className="rounded-xl border border-line text-bone px-5 py-3 no-underline" href="/docs/using-autocurl">AI setup and security</Link>
      </div>
    </main>
    <Footer />
  </>;
}
