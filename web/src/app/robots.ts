import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Docs search endpoint returns JSON, not content worth indexing.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
