import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your autocurl account.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const params = await searchParams;
  const redirectUrl = params.redirect_url || "/account/billing";
  return <main className="min-h-[70vh] flex items-center justify-center px-6 py-16"><SignIn forceRedirectUrl={redirectUrl} /></main>;
}
