import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { docsSource } from '@/lib/source';
import type { ReactNode } from 'react';

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
