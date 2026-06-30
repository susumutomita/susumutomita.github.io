import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import netlify from "@astrojs/netlify";
import cloudflare from "@astrojs/cloudflare";
import robotsTxt from "astro-robots-txt";
import UnoCSS from "@unocss/astro";
import icon from "astro-icon";

import solidJs from "@astrojs/solid-js";
import { remarkReadingTime } from "./src/lib/ remark-reading-time.mjs";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import svelte from "@astrojs/svelte";

// Production deploys to Netlify. Cloudflare Pages sets CF_PAGES=1 in its build
// environment, so when building there we swap to the Cloudflare adapter (which
// emits Cloudflare-compatible output); everywhere else we use Netlify.
const isCloudflare = Boolean(process.env.CF_PAGES);

// https://astro.build/config
export default defineConfig({
	site: 'https://susumutomita.github.io',
	integrations: [
		sitemap(),
		robotsTxt({
			sitemap: [
				"https://susumutomita.github.io/sitemap-index.xml",
				"https://susumutomita.github.io/sitemap-0.xml",
			],
		}),
		solidJs(),
		UnoCSS({ injectReset: true }),
		icon(),
		svelte(),
	],
	markdown: {
		remarkPlugins: [remarkReadingTime, remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	output: "server",
	adapter: isCloudflare ? cloudflare() : netlify({ edgeMiddleware: true }),
	vite: {
		assetsInclude: "**/*.riv",
	},
});
