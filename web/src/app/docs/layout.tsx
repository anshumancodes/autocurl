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
    'Learn how to install, configure, and use autocurl — the CLI tool for generating and running reproducible curl requests from your codebase.',
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'autocurl Documentation',
    description:
      'Learn how to install, configure, and use autocurl — the CLI tool for generating and running reproducible curl requests from your codebase.',
    url: '/docs',
  },
};

export default function RootDocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DocsLayout tree={docsSource.pageTree} nav={{ title: 'autocurl Docs' }}>
      {children}
    </DocsLayout>
  );
}
