import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { rssSchema } from '@astrojs/rss';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: rssSchema.extend({
    heroImage: rssSchema.shape.title,
  }),
});

export const collections = { blog };
