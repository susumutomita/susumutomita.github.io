import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The blog frontmatter mirrors `rssSchema` from @astrojs/rss, but is declared
// with Astro's own Zod (`astro/zod`) instead of importing that schema.
// @astrojs/rss ships its own Zod copy, and as soon as it resolves to a
// different version than Astro's, the two schema types stop matching and every
// `entry.data` silently degrades to `unknown` at type-check time.
const rssFrontmatter = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  pubDate: z
    .union([z.string(), z.number(), z.date()])
    .transform((value) => new Date(value))
    .refine((value) => !isNaN(value.getTime()))
    .optional(),
  customData: z.string().optional(),
  categories: z.array(z.string()).optional(),
  author: z.string().optional(),
  commentsUrl: z.string().optional(),
  source: z.object({ url: z.string().url(), title: z.string() }).optional(),
  enclosure: z
    .object({
      url: z.string(),
      length: z.number().nonnegative().int().finite(),
      type: z.string(),
    })
    .optional(),
  link: z.string().optional(),
  content: z.string().optional(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: rssFrontmatter.extend({
    heroImage: z.string().optional(),
  }),
});

export const collections = { blog };
