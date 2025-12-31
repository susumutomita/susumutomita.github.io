# Susumu Tomita - Portfolio

[![Netlify Status](https://api.netlify.com/api/v1/badges/caefb044-929a-4195-a9a2-cf5d9ad5b245/deploy-status)](https://app.netlify.com/sites/susumutomita/deploys)

Personal portfolio site built with Astro, featuring a minimal dark/light theme design.

## Features

- Dark/Light theme toggle with system preference detection
- Responsive design optimized for all devices
- Interactive 3D globe showing visited countries (D3.js)
- Blog with MDX support
- Papers/Publications section
- Resume page
- Contact page

## Tech Stack

- **Framework**: [Astro](https://astro.build/) 5.x
- **Styling**: [UnoCSS](https://unocss.dev/) with custom design tokens
- **Interactive Components**: [Solid.js](https://www.solidjs.com/)
- **3D Globe**: [D3.js](https://d3js.org/)
- **Animations**: [Motion](https://motion.dev/)
- **Deployment**: [Netlify](https://www.netlify.com/)

## Pages

| Page | Description |
|:-----|:------------|
| `/` | Home - Hero, featured work, recent blog posts |
| `/about` | About - Skills, experience, technical writing |
| `/projects` | Projects - Portfolio of work |
| `/papers` | Papers - Academic publications |
| `/blog` | Blog - Technical articles |
| `/resume` | Resume - Professional experience |
| `/contact` | Contact - Get in touch |
| `/travel` | Travel - 3D globe of visited countries |

## Commands

| Command | Action |
|:--------|:-------|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server at `localhost:4321` |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run lint` | Run textlint on markdown files |
| `bun run lint:fix` | Fix textlint errors |

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## Deployment

This project is automatically deployed to Netlify on push to the `main` branch.

**Live Site**: [https://susumutomita.netlify.app/](https://susumutomita.netlify.app/)

## Author

**Susumu Tomita**
- GitHub: [@susumutomita](https://github.com/susumutomita)
- LinkedIn: [susumutomita](https://www.linkedin.com/in/susumutomita/)
- Zenn: [bull](https://zenn.dev/bull)
- Qiita: [tonitoni415](https://qiita.com/tonitoni415)

## License

MIT
