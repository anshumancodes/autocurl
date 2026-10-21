import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Check } from "lucide-react";
import PricingCards from "./PricingCards";


export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for autocurl. Run requests free, forever. Try AI scans free for 30 days, then upgrade to Pro when you're ready.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | autocurl",
    description:
      "Simple, transparent pricing for autocurl. Run requests free, forever. Try AI scans free for 30 days, then upgrade to Pro when you're ready.",
    url: "/pricing",
  },
};



interface ComparisonFeature {
  name: string;
  free: string | boolean;
  pro: string | boolean;
}

interface ComparisonSection {
  section: string;
  rows: ComparisonFeature[];
}

const COMPARISON_SECTIONS: ComparisonSection[] = [
  {
    section: "Core",
    rows: [
      {
        name: "Core CLI and .autocurl files",
        free: "Included",
        pro: "Included",
      },
      {
        name: "Local request execution",
        free: "Included",
        pro: "Included",
      },
    ],
  },
  {
    section: "AI scans",
    rows: [
      {
        name: "AI-assisted repository scans",
        free: "10 in your first 30 days",
        pro: "100 per month",
      },
      {
        name: "Scan limit resets",
        free: false,
        pro: "Every billing period",
      },
      {
        name: "Language and framework detection",
        free: false,
        pro: true,
      },
    ],
  },
  {
    section: "Account",
    rows: [
      {
        name: "Account required for AI scans",
        free: "Yes (free)",
        pro: "Yes",
      },
    ],
  },
  {
    section: "Support",
    rows: [
      {
        name: "Support",
        free: "GitHub issues",
        pro: "Email, 48-hour response",
      },
    ],
  },
];

// Kept for the FAQ schema — flat list of all features
const COMPARISON_FEATURES: ComparisonFeature[] = COMPARISON_SECTIONS.flatMap(
  (s) => s.rows
);

const PRICING_FAQ = [
  {
    question: "Is Free really free forever?",
    answer:
      "Yes. The core CLI and local request execution are free forever. AI scans include 10 free scans in your first 30 days. After that, AI scans require Pro.",
  },
  {
    question: "Do I need an account?",
    answer:
      "You need a free account to run AI scans (when you use the --ai flag). It takes a minute and no credit card is required. The base CLI works without any account.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "When you create your account, you get 10 AI scans to use within 30 days. When they're used up or the 30 days pass, you can upgrade to Pro to keep scanning.",
  },
  {
    question: "What counts as an AI-assisted repository scan?",
    answer:
      "A scan is one AI pass over a codebase to discover and map its API routes. See the documentation for details and limits.",
  },
  {
    question: "What happens if I use all 100 scans?",
    answer:
      "You'll be notified and can wait for your next reset. We never charge automatically for extra usage.",
  },
  {
    question: "Do unused scans roll over?",
    answer: "No. Your 100 scans reset at the start of each billing period.",
  },
  {
    question: "What happens to my code during an AI scan?",
    answer:
      "Only the code needed for the scan is sent to our servers to generate results.",
  },
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes. Upgrades take effect immediately. Downgrades apply at the end of your current billing period.",
  },
  {
    question: "How do I cancel, and do you offer refunds?",
    answer:
      "You can cancel anytime from your account, and you keep Pro until the end of your billing period.",
  },
];

export default function PricingPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PRICING_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="bg" aria-hidden="true" />
      <Navbar />

      <main>
        {/* Hero Section */}
        <section
          aria-label="Pricing Hero"
          className="max-w-280 mx-auto px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center"
        >
          
          <h1 className="font-extrabold text-[clamp(32px,5.2vw,64px)] leading-[1.05] tracking-[-0.035em] text-bone">
            Simple pricing. No surprises.
          </h1>
          <p className="mt-4 sm:mt-5 text-mute text-[16px] sm:text-[19px] leading-relaxed max-w-[34em] mx-auto">
            Run requests free, forever. Try AI scans free for 30 days, then upgrade to Pro when you&apos;re ready.
          </p>
        </section>

        <PricingCards />

        {/* Feature Comparison Table */}
        <section
          aria-labelledby="comparison-heading"
          className="py-16 md:py-24 border-t border-line bg-[rgba(21,19,27,0.88)] backdrop-blur-[10px]"
        >
          <div className="max-w-280 mx-auto px-6">
            <div className="text-center max-w-180 mx-auto mb-12 sm:mb-16">
              <div className="font-mono text-sun text-[12px] font-semibold tracking-widest uppercase mb-3">
                comparison
              </div>
              <h2
                id="comparison-heading"
                className="font-extrabold text-[clamp(24px,3.4vw,40px)] leading-[1.1] tracking-[-0.03em] text-bone mb-4"
              >
                Compare plans
              </h2>
              <p className="text-mute text-[15px] sm:text-[16px] leading-relaxed">
                A detailed side-by-side view of capabilities across Free and Pro.
              </p>
            </div>

            <div className="overflow-x-auto rounded-[20px] border border-line bg-[rgba(21,19,27,0.7)] shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              <table className="w-full text-left border-collapse min-w-150">
                <thead>
                  <tr className="border-b border-line bg-[rgba(255,255,255,0.02)]">
                    <th
                      scope="col"
                      className="py-4.5 px-6 font-mono text-[13px] font-semibold tracking-wider text-mute uppercase w-2/5"
                    >
                      Feature
                    </th>
                    <th
                      scope="col"
                      className="py-4.5 px-6 font-mono text-[14px] font-bold text-bone text-center w-1/5"
                    >
                      Free
                    </th>
                    <th
                      scope="col"
                      className="py-4.5 px-6 font-mono text-[14px] font-bold text-sun text-center w-1/5 bg-sun/4"
                    >
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-[14.5px]">
                  {COMPARISON_SECTIONS.map((section) => (
                    <>
                      <tr key={section.section} className="bg-white/1.5">
                        <th
                          colSpan={3}
                          className="py-2.5 px-6 font-mono text-[11px] font-semibold tracking-widest uppercase text-mute/60"
                        >
                          {section.section}
                        </th>
                      </tr>
                      {section.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-white/2 transition-colors"
                        >
                          <th
                            scope="row"
                            className="py-4 px-6 font-medium text-bone/90"
                          >
                            {row.name}
                          </th>
                          <td className="py-4 px-6 text-center">
                            {typeof row.free === "boolean" ? (
                              row.free ? (
                                <Check
                                  className="w-4.5 h-4.5 text-sun mx-auto"
                                  aria-label="Included in Free"
                                />
                              ) : (
                                <span
                                  className="text-mute/50 font-mono text-base select-none"
                                  aria-label="Not included in Free"
                                >
                                  —
                                </span>
                              )
                            ) : (
                              <span className="font-mono text-[13px] font-semibold text-bone">
                                {row.free}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center bg-sun/3">
                            {typeof row.pro === "boolean" ? (
                              row.pro ? (
                                <Check
                                  className="w-4.5 h-4.5 text-sun mx-auto"
                                  aria-label="Included in Pro"
                                />
                              ) : (
                                <span
                                  className="text-mute/50 font-mono text-base select-none"
                                  aria-label="Not included in Pro"
                                >
                                  —
                                </span>
                              )
                            ) : (
                              <span className="font-mono text-[13px] font-semibold text-sun">
                                {row.pro}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pricing FAQ Accordion */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="py-16 md:py-24 border-t border-line bg-[rgba(21,19,27,0.88)] backdrop-blur-[10px]"
        >
          <div className="max-w-180 mx-auto px-6">
            <div className="font-mono text-sun text-[12px] font-semibold tracking-widest uppercase mb-3">
              FAQ
            </div>
            <h2
              id="faq-heading"
              className="font-extrabold text-[clamp(24px,3.2vw,40px)] leading-[1.1] tracking-[-0.03em] mb-12 md:mb-14 text-bone"
            >
              Frequently asked questions
            </h2>

            <div>
              {PRICING_FAQ.map((item, idx) => (
                <details
                  key={idx}
                  className="group border-t border-line last:border-b last:border-line"
                >
                  <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none select-none">
                    <h3 className="font-semibold text-[15px] leading-[1.4] tracking-[-0.01em] text-bone">
                      {item.question}
                    </h3>
                    <span
                      className="text-mute text-[20px] font-light leading-none shrink-0 transition-transform duration-200 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-mute text-[14px] leading-relaxed pb-6 pr-10">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Strip */}
        <section
          aria-labelledby="pricing-cta-heading"
          className="py-16 md:py-24 border-t border-line bg-[rgba(21,19,27,0.88)] backdrop-blur-[10px] text-center"
        >
          <div className="max-w-280 mx-auto px-6">
            <h2
              id="pricing-cta-heading"
              className="font-extrabold text-[clamp(28px,3.8vw,46px)] leading-[1.1] tracking-[-0.03em] max-w-[16em] mx-auto text-bone"
            >
              Start for free today.
            </h2>
            <p className="mt-3.5 text-mute text-[16px] max-w-[30em] mx-auto">
              Run requests locally in minutes. Try AI scans on us for 30 days.
            </p>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-4 text-[14px]">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-sun text-ink hover:bg-[#e0b040] transition-colors shadow-[0_0_20px_rgba(242,193,78,0.2)] no-underline"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-white/5 border border-line text-bone hover:bg-white/10 hover:border-bone/30 transition-colors no-underline"
              >
                <span>Read the docs</span>
                <ArrowRight className="w-4 h-4 text-mute" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
