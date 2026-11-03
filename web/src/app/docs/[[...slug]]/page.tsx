import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page';
import { docsSource } from '@/lib/source';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { pageMetadata, jsonLd } from '@/lib/seo';
import { siteConfig } from '@/lib/siteConfig';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = docsSource.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  // Breadcrumbs follow the URL segments, using page titles where a page exists.
  const crumbs = [{ name: 'Docs', url: '/docs' }];
  const segments = slug ?? [];
  segments.forEach((_, i) => {
    const crumbPage = docsSource.getPage(segments.slice(0, i + 1));
    if (crumbPage) crumbs.push({ name: crumbPage.data.title, url: crumbPage.url });
  });
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', url: '/' }, ...crumbs].map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${siteConfig.url}${crumb.url === '/' ? '' : crumb.url}`,
    })),
  };

  return (
    <DocsPage toc={page.data.toc}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema)} />
      <Link
        href={page.url === '/docs' ? '/' : '/docs'}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {page.url === '/docs' ? 'Back to home' : 'Back to docs'}
      </Link>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return docsSource.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = docsSource.getPage(slug);
  if (!page) notFound();

  return pageMetadata({
    title: page.data.seoTitle ?? page.data.title,
    description: page.data.description ?? siteConfig.description,
    path: page.url,
    absoluteTitle: Boolean(page.data.seoTitle),
    type: page.url === '/docs' ? 'website' : 'article',
  });
}
