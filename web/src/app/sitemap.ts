import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { docsSource } from "@/lib/source";

// Built from the docs source so new pages are never missing from the sitemap.
// lastModified is only emitted when a page declares an `updated` date in its
// frontmatter; stamping every URL with the build time teaches crawlers to
// ignore the field.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/pricing`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const docPages: MetadataRoute.Sitemap = docsSource.getPages().map((page) => {
    const updated = page.data.updated ? new Date(page.data.updated) : undefined;
    return {
      url: `${baseUrl}${page.url}`,
      ...(updated && !Number.isNaN(updated.getTime()) && { lastModified: updated }),
      changeFrequency: "monthly",
      priority: page.url === "/docs" || page.url === "/docs/getting-started" ? 0.9 : 0.7,
    };
  });

  return [...staticPages, ...docPages];
}
