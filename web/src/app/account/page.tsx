import type { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your autocurl account profile and settings.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return <main className="min-h-[70vh] max-w-180 mx-auto px-6 py-16"><p className="font-mono text-sun text-xs uppercase tracking-widest">account</p><h1 className="text-bone text-4xl font-extrabold mt-3 mb-8">Profile</h1><UserProfile routing="hash" /></main>;
}
