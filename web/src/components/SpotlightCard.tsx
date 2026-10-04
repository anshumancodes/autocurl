"use client";

import { type ReactNode, type MouseEvent } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  as?: "article" | "div" | "section";
}

export default function SpotlightCard({
  children,
  className = "",
  as: Component = "article",
}: SpotlightCardProps) {
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  return (
    <Component
      className={`cell ${className}`}
      onMouseMove={handleMouseMove}
    >
      {children}
    </Component>
  );
}
