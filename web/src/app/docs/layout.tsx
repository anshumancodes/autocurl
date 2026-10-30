
import Link from 'next/link';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { docsSource } from '@/lib/source';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Documentation',
    template: '%s | autocurl Docs',
  },
  description:
    'Learn how to install, configure, and use autocurl to discover routes in supported projects and execute reproducible API requests.',
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'autocurl Documentation',
    description:
      'Learn how to install, configure, and use autocurl to discover routes in supported projects and execute reproducible API requests.',
    url: '/docs',
  },
};

export default function RootDocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DocsLayout
      tree={docsSource.pageTree}
      nav={{
        title: (
          <Link
            href="/"
            className="font-extrabold text-[22px] tracking-[-0.02em] no-underline"
          >
            auto<span className="text-sun">cURL</span>
          </Link>
        ),
        url: '/',
      }}
    >
      {children}
    </DocsLayout>
  );
}
