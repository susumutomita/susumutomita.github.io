import { defineConfig } from 'astro/config'
import node from "@astrojs/node";

export default defineConfig({
	site: 'https://susumutomita.github.io',
	output: "server",
	adapter: node({
		mode: "standalone"
	})
})
