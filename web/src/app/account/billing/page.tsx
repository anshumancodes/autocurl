import type { Metadata } from "next";
import BillingView from "./BillingView";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your autocurl subscription and billing details.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account/billing" },
};

export default function BillingPage() { return <BillingView />; }
