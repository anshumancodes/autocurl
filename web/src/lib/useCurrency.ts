"use client";

import { useEffect, useState } from "react";

export interface CurrencyInfo {
  /** true once the geo-fetch has resolved (or failed) */
  loaded: boolean;
  isIndia: boolean;
  /** e.g. "$" or "₹" */
  symbol: string;
}

const FALLBACK: CurrencyInfo = { loaded: true, isIndia: false, symbol: "$" };

export function useCurrency(): CurrencyInfo {
  const [info, setInfo] = useState<CurrencyInfo>({
    loaded: false,
    isIndia: false,
    symbol: "$",
  });

  useEffect(() => {
    let cancelled = false;

    // 3-second timeout so we never block the UI
    const timer = setTimeout(() => {
      if (!cancelled) setInfo(FALLBACK);
    }, 3000);

    fetch("https://ipapi.co/json/", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        if (cancelled) return;
        const isIndia = data.country_code === "IN";
        setInfo({ loaded: true, isIndia, symbol: isIndia ? "₹" : "$" });
      })
      .catch(() => {
        if (!cancelled) setInfo(FALLBACK);
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return info;
}
