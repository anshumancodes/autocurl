"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SpotlightCard from "@/components/SpotlightCard";
import { ArrowRight, Check } from "lucide-react";
import { useCurrency } from "@/lib/useCurrency";
import { useAuth } from "@clerk/nextjs";

// ─── Price definitions ────────────────────────────────────────────────────────
// Adjust these values when you want to change INR pricing.
const PRICES = {
  free: { usd: "$0", inr: "₹0" },
  pro: {
    usd: { monthly: "$5.99", yearly: "$59" },
    inr: { monthly: "₹499", yearly: "₹4,999" },
  },
} as const;

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

function buildPlans(symbol: "$" | "₹", isIndia: boolean): PricingPlan[] {
  const proMonthly = isIndia
    ? PRICES.pro.inr.monthly
    : PRICES.pro.usd.monthly;
  const proYearly = isIndia ? PRICES.pro.inr.yearly : PRICES.pro.usd.yearly;
  const freePrice = isIndia ? PRICES.free.inr : PRICES.free.usd;
  const yearSuffix = isIndia ? "(2 months free)" : "(2 months free)";

  return [
    {
      id: "free",
      name: "Free",
      price: freePrice,
      period: "/month",
      tagline: `${freePrice} /month`,
      description:
        "For developers who want the autocurl workflow, with a free taste of AI.",
      features: [
        "Core CLI and .autocurl workflow",
        "Local API request execution",
        "10 AI-assisted repository scans in your first 30 days",
        "Free account required for AI scans, no credit card needed",
      ],
      cta: "Get started",
      ctaHref: "/docs/getting-started",
      highlighted: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: proMonthly,
      period: "/month",
      tagline: `or ${proYearly} /year ${yearSuffix}`,
      description:
        "For developers who want AI route discovery built in, ready to use.",
      badge: "Recommended",
      features: [
        "Everything in Free",
        "100 AI-assisted repository scans per month",
        "Automatic language and framework detection",
        "Email support with a 48-hour response time",
        "Early access to new AI features",
      ],
      cta: "Start Pro",
      ctaHref: "#checkout",
      highlighted: true,
    },
  ];
}

// Skeleton shimmer shown while the geo-fetch is in flight
function PriceSkeleton({ highlighted }: { highlighted: boolean }) {
  return (
    <div
      className={`h-8 rounded-md animate-pulse w-24 ${
        highlighted ? "bg-sun/20" : "bg-bone/10"
      }`}
      aria-hidden="true"
    />
  );
}

export default function PricingCards() {
  const { loaded, isIndia, symbol } = useCurrency();
  const router = useRouter();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(() => {
    const value = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("plan");
    return value === "yearly" ? "yearly" : "monthly";
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build plans only once loaded so prices are never incorrect
  const plans = loaded ? buildPlans(symbol as "$" | "₹", isIndia) : null;

  async function startCheckout(plan: "monthly" | "yearly") {
    setBusy(true); setError(null);
    const api = process.env.NEXT_PUBLIC_API_URL || "https://api.autocurl.lol";
    try {
      const token = await getToken();
      const response = await fetch(`${api}/api/billing/checkout`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, credentials: "include", body: JSON.stringify({ plan }) });
      if (response.status === 401) { localStorage.setItem("autocurl_checkout_plan", plan); router.push(`/sign-in?redirect_url=${encodeURIComponent(`/pricing?plan=${plan}`)}`); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Checkout is unavailable.");
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = () => resolve(); script.onerror = () => reject(new Error("Unable to load Razorpay Checkout.")); document.body.appendChild(script);
      });
      const Razorpay = (window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!Razorpay) throw new Error("Razorpay Checkout is unavailable.");
      new Razorpay({ key: data.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, subscription_id: data.subscription_id, name: "autocurl", description: `Pro ${plan}`, handler: async (payment: Record<string, string>) => { const verifyToken = await getToken(); await fetch(`${api}/api/billing/verify`, { method: "POST", headers: { "Content-Type": "application/json", ...(verifyToken ? { Authorization: `Bearer ${verifyToken}` } : {}) }, credentials: "include", body: JSON.stringify(payment) }); router.push("/account/billing?pending=1"); } }).open();
    } catch (checkoutError) { setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is unavailable."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const pending = localStorage.getItem("autocurl_checkout_plan");
    if (isLoaded && isSignedIn && pending && (pending === "monthly" || pending === "yearly")) {
      localStorage.removeItem("autocurl_checkout_plan");
      window.setTimeout(() => void startCheckout(pending), 0);
    }
  }, [isLoaded, isSignedIn]);

  return (
    <section
      aria-label="Pricing Plans"
      className="max-w-280 mx-auto px-6 pb-20 sm:pb-28"
    >
      {/* Currency badge — only shown to Indian users after detection */}
      {loaded && isIndia && (
        <p className="text-center text-[12px] font-mono text-mute mb-6 -mt-2">
          Prices shown in Indian Rupees (INR)
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-3xl mx-auto">
        {(plans ?? buildPlans("$", false)).map((plan) => (
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
                  <span
                    className="text-sun text-[16px] leading-none"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                )}
                <h2 className="font-extrabold text-[22px] sm:text-[24px] tracking-tight text-bone">
                  {plan.name}
                </h2>
              </div>
              <p className="text-mute text-[13.5px] mt-1 font-mono">
                {loaded ? plan.tagline : <span className="opacity-0">—</span>}
              </p>

              <div className="flex items-baseline gap-1 mt-6 mb-3">
                {loaded ? (
                  <>
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
                  </>
                ) : (
                  <PriceSkeleton highlighted={plan.highlighted} />
                )}
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
              <button
                type="button"
                onClick={() => startCheckout(selectedPlan)}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-[14px] bg-sun text-ink hover:bg-[#e0b040] transition-colors shadow-[0_0_20px_rgba(242,193,78,0.25)] no-underline w-full mt-auto"
              >
                <span>{busy ? "Opening checkout…" : plan.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
      <div className="flex justify-center gap-2 mt-6" aria-label="Billing period">
        <button type="button" onClick={() => setSelectedPlan("monthly")} className={`rounded-lg px-3 py-2 text-sm border ${selectedPlan === "monthly" ? "border-sun text-sun" : "border-line text-mute"}`}>Monthly</button>
        <button type="button" onClick={() => setSelectedPlan("yearly")} className={`rounded-lg px-3 py-2 text-sm border ${selectedPlan === "yearly" ? "border-sun text-sun" : "border-line text-mute"}`}>Yearly</button>
      </div>
      {error && <p role="alert" className="text-center text-red-300 text-sm mt-6">{error}</p>}
    </section>
  );
}
