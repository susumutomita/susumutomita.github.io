# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Personal portfolio website for Susumu Tomita, built with Astro and deployed on Netlify.

## Tech Stack

- **Framework**: Astro
- **Styling**: UnoCSS (Tailwind-like utility classes)
- **Package Manager**: bun (NOT npm/yarn)
- **Deployment**: Netlify
- **Language**: TypeScript

## Commands

```bash
# Development
bun run dev

# Build (includes type checking)
bun run build

# Preview production build
bun run preview

# Lint markdown files
bun run lint
bun run lint:fix
```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   └── global/     # Header, Footer, etc.
├── content/        # Blog posts (MDX/MD)
├── layouts/        # Page layouts (BaseLayout.astro)
├── lib/            # Utilities and constants
└── pages/          # Route pages
public/
└── fonts/          # Custom fonts (AXIS Std)
```

## Important Rules

1. **Always use bun** - Never use npm or yarn commands
2. **No Google Analytics** - Site is privacy-focused, no tracking
3. **Font stack** - AXIS Std → Helvetica Neue → Hiragino Kaku Gothic → Noto Sans JP
4. **UnoCSS classes** - Use Tailwind-like utility classes defined in `uno.config.ts`
5. **Dark mode** - Site supports dark/light mode via `dark:` prefix classes

## Key Files

- `uno.config.ts` - UnoCSS configuration (colors, fonts, shadows)
- `src/layouts/BaseLayout.astro` - Main layout with meta tags and fonts
- `src/lib/constants.ts` - Site metadata and social links
- `astro.config.mjs` - Astro configuration
