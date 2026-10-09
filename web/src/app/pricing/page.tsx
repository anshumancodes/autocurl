import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for autocurl. Start free with your own AI key, or upgrade to Pro or Power for managed AI with no key required.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | autocurl",
    description:
      "Simple, transparent pricing for autocurl. Start free with your own AI key, or upgrade to Pro or Power for managed AI with no key required.",
    url: "/pricing",
  },
};

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  description: string;
  badge?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
}

const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    tagline: "Bring your own key",
    description:
      "For developers who want the autocurl workflow without paying for managed AI.",
    features: [
      "Core CLI and .autocurl workflow",
      "Local API request execution",
      "AI-powered route discovery using your own Google AI API key",
      "Pay your AI provider directly for usage",
    ],
    cta: "Get started",
    ctaHref: "/docs/getting-started",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    period: "/month",
    tagline: "Recommended starting point",
    description:
      "For developers who want AI built in, without managing API keys.",
    badge: "Recommended",
    features: [
      "Everything in Free",
      "Native AI support, with no personal API key required",
      "40 AI-assisted repository scans per month",
      "Automatic language and framework detection",
      "Higher usage limits and priority access to new AI features",
    ],
    cta: "Start Pro",
    // TODO: wire up billing
    ctaHref: "#",
    highlighted: true,
  },
  {
    id: "power",
    name: "Power",
    price: "$15.99",
    period: "/month",
    tagline: "For developers and teams",
    description:
      "For developers and teams working with APIs across larger or multiple repositories.",
    features: [
      "Everything in Pro",
      "100 AI-assisted repository scans per month",
      "Higher scan budgets for larger codebases",
      "Priority processing and more generous AI usage limits",
      "Advanced discovery capabilities as they ship",
    ],
    cta: "Start Power",
    // TODO: wire up billing
    ctaHref: "#",
    highlighted: false,
  },
];

interface ComparisonFeature {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  power: string | boolean;
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    name: "Core CLI + .autocurl",
    free: true,
    pro: true,
    power: true,
  },
  {
    name: "Local request execution",
    free: true,
    pro: true,
    power: true,
  },
  {
    name: "Bring your own AI key",
    free: true,
    pro: true,
    power: true,
  },
  {
    name: "Managed AI (no key needed)",
    free: false,
    pro: true,
    power: true,
  },
  {
    name: "AI-assisted scans / month",
    free: "BYOK",
    pro: "40",
    power: "100",
  },
  {
    name: "Language & framework detection",
    free: false,
    pro: true,
    power: true,
  },
  {
    name: "Priority AI processing",
    free: false,
    pro: false,
    power: true,
  },
  {
    name: "Advanced discovery features",
    free: false,
    pro: false,
    power: true,
  },
];

const PRICING_FAQ = [
  {
    question: "Can I use autocurl for free forever?",
    answer:
      "Yes. The Free tier is unlimited for local use and BYOK AI. You only pay if you want managed AI.",
  },
  {
    question: "What counts as an AI-assisted repository scan?",
    answer:
      "A scan is one full AI pass over a codebase to discover and map API routes. Scans reset monthly.",
  },
  {
    question: "Do I need a credit card for the Free plan?",
    answer: "No. The Free plan requires no payment details.",
  },
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes. Upgrades take effect immediately; downgrades apply at the next billing cycle.",
  },
  {
    question: "What happens if I exceed my scan limit?",
    answer:
      "You'll be notified and can either upgrade or wait for the next monthly reset. No automatic charges.",
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
            Start free with your own AI key, or upgrade to Pro or Power for managed AI with no key required.
          </p>
        </section>

        {/* Pricing Cards Section */}
        <section
          aria-label="Pricing Plans"
          className="max-w-280 mx-auto px-6 pb-20 sm:pb-28"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {PLANS.map((plan) => (
              <SpotlightCard
                key={plan.id}
                className={`flex flex-col justify-between h-full p-6 sm:p-8 rounded-[22px] transition-all relative ${
                  plan.highlighted
                    ? "ring-1 ring-sun/40 shadow-[0_0_35px_rgba(242,193,78,0.08)]"
                    : ""
                }`}
              >
                {plan.badge && (
                  <span className="absolute top-4 right-4 bg-sun text-ink text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    {plan.highlighted && (
                      <span className="text-sun text-[16px] leading-none" aria-hidden="true">
                        ✦
                      </span>
                    )}
                    <h2 className="font-extrabold text-[22px] sm:text-[24px] tracking-tight text-bone">
                      {plan.name}
                    </h2>
                  </div>
                  <p className="text-mute text-[13.5px] mt-1 font-mono">
                    {plan.tagline}
                  </p>

                  <div className="flex items-baseline gap-1 mt-6 mb-3">
                    <span
                      className={`text-[38px] sm:text-[44px] font-extrabold tracking-tight font-mono ${
                        plan.highlighted ? "text-sun" : "text-bone"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-mute text-[14px] font-mono">
                      {plan.period}
                    </span>
                  </div>

                  <p className="text-mute text-[14px] leading-relaxed mb-6">
                    {plan.description}
                  </p>

                  <div className="border-t border-line pt-6 mb-8">
                    <div className="text-[12px] font-mono font-semibold uppercase tracking-wider text-mute mb-4">
                      Included features
                    </div>
                    <ul className="flex flex-col gap-3 list-none p-0 m-0">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-[14px] text-bone/90 leading-snug"
                        >
                          <Check
                            className="w-4 h-4 text-sun shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {plan.highlighted ? (
                  <Link
                    href={plan.ctaHref}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-[14px] bg-sun text-ink hover:bg-[#e0b040] transition-colors shadow-[0_0_20px_rgba(242,193,78,0.25)] no-underline w-full mt-auto"
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href={plan.ctaHref}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-[14px] bg-white/5 border border-line text-bone hover:bg-white/10 hover:border-bone/30 transition-colors no-underline w-full mt-auto"
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-4 h-4 text-mute" />
                  </Link>
                )}
              </SpotlightCard>
            ))}
          </div>
        </section>

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
                Compare all features
              </h2>
              <p className="text-mute text-[15px] sm:text-[16px] leading-relaxed">
                A detailed side-by-side view of capabilities across Free, Pro, and Power tiers.
              </p>
            </div>

            <div className="overflow-x-auto rounded-[20px] border border-line bg-[rgba(21,19,27,0.7)] shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              <table className="w-full text-left border-collapse min-w-[600px]">
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
                      className="py-4.5 px-6 font-mono text-[14px] font-bold text-sun text-center w-1/5 bg-sun/[0.04]"
                    >
                      Pro
                    </th>
                    <th
                      scope="col"
                      className="py-4.5 px-6 font-mono text-[14px] font-bold text-bone text-center w-1/5"
                    >
                      Power
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-[14.5px]">
                  {COMPARISON_FEATURES.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-white/[0.02] transition-colors"
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
                      <td className="py-4 px-6 text-center bg-sun/[0.03]">
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
                      <td className="py-4 px-6 text-center">
                        {typeof row.power === "boolean" ? (
                          row.power ? (
                            <Check
                              className="w-4.5 h-4.5 text-sun mx-auto"
                              aria-label="Included in Power"
                            />
                          ) : (
                            <span
                              className="text-mute/50 font-mono text-base select-none"
                              aria-label="Not included in Power"
                            >
                              —
                            </span>
                          )
                        ) : (
                          <span className="font-mono text-[13px] font-semibold text-bone">
                            {row.power}
                          </span>
                        )}
                      </td>
                    </tr>
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
              No credit card required for the Free plan. Run requests locally in minutes.
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
