import { defineDocs, defineConfig, frontmatterSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema.extend({
      /** Full <title> for search results; `title` stays short for the sidebar. */
      seoTitle: z.string().optional(),
      /** ISO date of the last meaningful content update, used in the sitemap. */
      updated: z.string().optional(),
    }),
  },
});

export default defineConfig();
