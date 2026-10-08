import { notFound } from 'next/navigation';
import { DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page';
import { guidesSource } from '@/lib/source';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

const page = guidesSource.getPage(['curl-command-generator']);

export default function CurlCommandGeneratorPage() {
  if (!page) notFound();
  const MDX = page.data.body;
  return (
    <>
      <div className="bg" aria-hidden="true" />
      <Navbar />
      <main className="max-w-230 mx-auto px-6 py-10 sm:py-16">
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
        <DocsBody>
          <MDX />
        </DocsBody>
      </main>
      <Footer />
    </>
  );
}

export const metadata: Metadata = {
  title: page?.data.title,
  description: page?.data.description,
  alternates: { canonical: '/curl-command-generator' },
  openGraph: {
    title: page?.data.title,
    description: page?.data.description,
    url: '/curl-command-generator',
  },
};
