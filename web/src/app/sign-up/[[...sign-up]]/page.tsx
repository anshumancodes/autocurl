import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a free autocurl account to start using AI-assisted repository scans.",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const params = await searchParams;
  const redirectUrl = params.redirect_url || "/account/billing";
  return <main className="min-h-[70vh] flex items-center justify-center px-6 py-16"><SignUp forceRedirectUrl={redirectUrl} /></main>;
}
