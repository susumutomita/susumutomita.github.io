import { defineConfig } from 'astro/config'
import node from "@astrojs/node";

export default defineConfig({
	site: 'https://astronaut.github.io',
	output: "server",
	adapter: node({
		mode: "standalone"
	})
})
