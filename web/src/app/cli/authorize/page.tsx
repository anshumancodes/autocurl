"use client";

import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CliAuthorizePage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { const target = `/cli/authorize?${params.toString()}`; window.location.href = `/sign-in?redirect_url=${encodeURIComponent(target)}`; return; }
    const run = async () => {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.autocurl.lol"}/api/cli/exchange`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ state: params.get("state"), redirect_uri: params.get("redirect_uri") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Unable to authorize autocurl.");
      window.location.href = data.redirect;
    };
    run().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to authorize autocurl."));
  }, [getToken, isLoaded, isSignedIn, params]);
  return <main className="min-h-[70vh] flex items-center justify-center px-6 py-16 text-center"><div><p className="font-mono text-sun text-xs uppercase tracking-widest">autocurl / cli</p><h1 className="text-bone text-3xl font-extrabold mt-3">Connecting your CLI…</h1>{error && <p className="text-red-300 mt-4">{error}</p>}</div></main>;
}
