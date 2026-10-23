"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SpotlightCard from "@/components/SpotlightCard";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

// ─── Price definitions ────────────────────────────────────────────────────────
// Adjust these values when you want to change INR pricing.
const PRICES = {
  free: "₹0",
  pro: "₹499",
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

function buildPlans(): PricingPlan[] {
  return [
    {
      id: "free",
      name: "Free",
      price: PRICES.free,
      period: "/month",
      tagline: `${PRICES.free} /month`,
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
      price: PRICES.pro,
      period: "/month",
      tagline: `${PRICES.pro} /month`,
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

export default function PricingCards() {
  const router = useRouter();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build plans only once loaded so prices are never incorrect
  const plans = buildPlans();

  async function startCheckout() {
    setBusy(true); setError(null);
    const api = process.env.NEXT_PUBLIC_API_URL || "https://api.autocurl.lol";
    try {
      const token = await getToken();
      const response = await fetch(`${api}/api/billing/checkout`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, credentials: "include", body: JSON.stringify({ plan: "monthly" }) });
      if (response.status === 401) { localStorage.setItem("autocurl_checkout_pending", "1"); router.push(`/sign-in?redirect_url=${encodeURIComponent("/pricing")}`); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Checkout is unavailable.");
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = () => resolve(); script.onerror = () => reject(new Error("Unable to load Razorpay Checkout.")); document.body.appendChild(script);
      });
      const Razorpay = (window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!Razorpay) throw new Error("Razorpay Checkout is unavailable.");
      new Razorpay({ key: data.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, subscription_id: data.subscription_id, name: "autocurl", description: "Pro monthly", handler: async (payment: Record<string, string>) => { try { const verifyToken = await getToken(); const verification = await fetch(`${api}/api/billing/verify`, { method: "POST", headers: { "Content-Type": "application/json", ...(verifyToken ? { Authorization: `Bearer ${verifyToken}` } : {}) }, credentials: "include", body: JSON.stringify(payment) }); const result = await verification.json().catch(() => null); if (!verification.ok || result?.verified !== true) throw new Error(result?.error?.message || "Payment verification failed. No Pro access was granted."); router.push("/account/billing?pending=1"); } catch (verificationError) { setError(verificationError instanceof Error ? verificationError.message : "Payment verification failed. No Pro access was granted."); } } }).open();
    } catch (checkoutError) { setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is unavailable."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const pending = localStorage.getItem("autocurl_checkout_pending");
    if (isLoaded && isSignedIn && pending) {
      localStorage.removeItem("autocurl_checkout_pending");
      window.setTimeout(() => void startCheckout(), 0);
    }
  }, [isLoaded, isSignedIn]);

  return (
    <section
      aria-label="Pricing Plans"
      className="max-w-280 mx-auto px-6 pb-20 sm:pb-28"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-3xl mx-auto">
        {plans.map((plan) => (
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
              <button
                type="button"
                onClick={() => startCheckout()}
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
      {error && <p role="alert" className="text-center text-red-300 text-sm mt-6">{error}</p>}
    </section>
  );
}
