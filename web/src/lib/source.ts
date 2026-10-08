import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

// Source for /docs/**
export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
