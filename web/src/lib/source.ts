import { docs, guides } from '@/.source';
import { loader } from 'fumadocs-core/source';

// Source for /docs/**
export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

// Source for standalone guide pages
export const guidesSource = loader({
  baseUrl: '/',
  source: guides.toFumadocsSource(),
});
