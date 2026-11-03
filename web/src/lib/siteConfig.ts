export const siteConfig = {
  name: "autocurl",
  // Homepage <title>: kept under ~60 characters so it is not truncated in results.
  title: "autocurl: CLI API Testing Tool for Developers and AI Agents",
  tagline: "Make agents run cURLs better without the JSON mess.",
  // Default meta description: kept around 155 characters.
  description:
    "autocurl discovers API routes in your codebase and generates readable .autocurl request files you, or your AI coding agent, can run from the terminal.",
  // Longer description for structured data and the web manifest.
  longDescription:
    "autocurl is a CLI-first alternative to GUI-based API testing tools, built for developers and AI agents. It discovers routes from supported backend frameworks with AST-first analysis (optional AI-assisted refinement), writes plain-text .autocurl request files, and executes them from the terminal with a built-in HTTP client.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://autocurl.lol",
  ogImage: "/opengraph-image",
  author: {
    name: "Anshuman Praharaj",
    url: "https://github.com/anshumancodes",
    github: "anshumancodes",
    twitter: "@anshumancdx",
  },
  links: {
    github: "https://github.com/anshumancodes/autocurl",
    releases: "https://github.com/anshumancodes/autocurl/releases",
  },
  // Search engines largely ignore the keywords meta tag; this list is kept
  // short and accurate rather than exhaustive.
  keywords: [
    "autocurl",
    "CLI API testing tool",
    "API testing from terminal",
    "curl alternative",
    "Postman alternative CLI",
    "API route discovery",
    "generate API requests from source code",
    "API tools for AI coding agents",
    ".autocurl file",
    "git-friendly API client",
  ],
  // Set these in the deployment environment once the properties are verified
  // in Google Search Console / Bing Webmaster Tools. Empty values emit no tag.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
  },
};

export type SiteConfig = typeof siteConfig;
