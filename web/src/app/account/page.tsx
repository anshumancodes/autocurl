import type { Metadata } from "next";
import { SignOutButton, UserProfile } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your autocurl account profile and settings.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return (
    <main className="min-h-[70vh] max-w-180 mx-auto px-6 py-16">
      <p className="font-mono text-sun text-xs uppercase tracking-widest">account</p>
      <div className="mt-3 mb-8 flex items-center justify-between gap-4">
        <h1 className="text-bone text-4xl font-extrabold">Profile</h1>
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-bone transition-colors hover:border-sun hover:text-sun"
          >
            Sign out
          </button>
        </SignOutButton>
      </div>
      <UserProfile routing="hash" />
    </main>
  );
}
