import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";

interface PageMetadataInput {
  /** Page title. Passed through the root "%s | autocurl" template unless `absoluteTitle` is set. */
  title: string;
  description: string;
  /** Canonical path without trailing slash, e.g. "/pricing". */
  path: string;
  /** Use the title verbatim instead of applying the site title template. */
  absoluteTitle?: boolean;
  type?: "website" | "article";
}

/**
 * Builds complete per-page metadata. Next.js replaces (rather than merges)
 * nested `openGraph` and `twitter` objects, so each page needs its own full
 * set; otherwise sub-pages inherit the homepage's social title/description.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  type = "website",
}: PageMetadataInput): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  const image = {
    url: siteConfig.ogImage,
    width: 1200,
    height: 630,
    alt: "autocurl: discover API routes and run readable .autocurl requests from the terminal",
  };

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "en_US",
      siteName: siteConfig.name,
      url: path,
      title: socialTitle,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      creator: siteConfig.author.twitter,
      images: [image.url],
    },
  };
}

/** Serialises JSON-LD safely for inline <script> tags. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
