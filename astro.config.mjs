import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import UnoCSS from "@unocss/astro";
import icon from "astro-icon";

import solidJs from "@astrojs/solid-js";
import { remarkReadingTime } from "./src/lib/ remark-reading-time.mjs";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";

import svelte from "@astrojs/svelte";

// Production deploys to Netlify (SSR). Cloudflare Pages sets CF_PAGES=1 in its
// build environment; there we emit a fully static build instead, which Pages
// serves directly. The site has no runtime SSR needs (no Astro.request/cookies,
// endpoints are build-time), so the static output is equivalent.
const isCloudflareBuild = Boolean(process.env.CF_PAGES);

// Load the Netlify adapter only for the Netlify (SSR) build. Importing it during
// the Cloudflare build pulls in @netlify/zip-it-and-ship-it → @vercel/nft, whose
// bare-specifier ESM resolution breaks in the Pages build environment and crashes
// config loading ("Unable to load your Astro config"). The static Cloudflare build
// does not need an adapter, so we skip the import entirely there.
const netlify = isCloudflareBuild
	? null
	: (await import("@astrojs/netlify")).default;

// https://astro.build/config
export default defineConfig({
	site: 'https://www.susumutomita.com',
	integrations: [
		sitemap(),
		robotsTxt({
			sitemap: [
				"https://www.susumutomita.com/sitemap-index.xml",
				"https://www.susumutomita.com/sitemap-0.xml",
			],
		}),
		solidJs(),
		UnoCSS({ injectReset: true }),
		icon(),
		svelte(),
	],
	markdown: {
		// Keep Shiki for real code, but exclude `mermaid` so the fenced block is
		// left as `<code class="language-mermaid">` for rehype-mermaid to pick up.
		// Without this, Shiki highlights it into spans first and rehype-mermaid
		// never sees a diagram.
		syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid"] },
		remarkPlugins: [remarkReadingTime, remarkMath],
		// rehype-mermaid runs with the `pre-mermaid` strategy: it rewrites each
		// mermaid fenced block into a `mermaid`-classed pre element at build time
		// WITHOUT launching a browser (so Netlify / Cloudflare Pages builds stay
		// browser-free). The actual SVG is rendered client-side in BaseLayout.
		rehypePlugins: [rehypeKatex, [rehypeMermaid, { strategy: "pre-mermaid" }]],
	},
	output: isCloudflareBuild ? "static" : "server",
	adapter: isCloudflareBuild ? undefined : netlify({ edgeMiddleware: true }),
	vite: {
		assetsInclude: "**/*.riv",
	},
});
