import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Early Access",
  description:
    "Join the autocurl early access list and be among the first to try the better way to discover, generate, and run API requests.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/early-access" },
};

export default function EarlyAccessLayout({ children }: { children: ReactNode }) {
  return children;
}
