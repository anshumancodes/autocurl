import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/docs/installation', destination: '/docs/getting-started', permanent: true },
      { source: '/docs/usage', destination: '/docs/using-autocurl', permanent: true },
      { source: '/docs/autocurl-format', destination: '/docs/using-autocurl', permanent: true },
      { source: '/docs/commands', destination: '/docs/using-autocurl', permanent: true },
      { source: '/docs/examples', destination: '/docs/using-autocurl', permanent: true },
      { source: '/curl-api-testing', destination: '/docs', permanent: true },
      { source: '/curl-command-generator', destination: '/docs/getting-started', permanent: true },
    ];
  },
};

const withMDX = createMDX();
export default withMDX(nextConfig);
