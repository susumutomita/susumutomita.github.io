/**
 * Internationalization (i18n) utilities for the BULL bilingual site sections.
 *
 * The personal portfolio pages remain at their existing routes. The BULL
 * business pages live under explicit `/en` and `/ja` prefixes so that each
 * language has a stable, shareable URL (see issue #311).
 */

export const LANGUAGES = ["en", "ja"] as const;
export type Lang = (typeof LANGUAGES)[number];

/** Language used for x-default hreflang and for the home language picker. */
export const DEFAULT_LANG: Lang = "en";

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  ja: "日本語",
};

export const OG_LOCALE: Record<Lang, string> = {
  en: "en_US",
  ja: "ja_JP",
};

/** Sub-routes that exist in both languages under `/en` and `/ja`. */
export const BULL_SUBROUTES = ["", "/services", "/work", "/tenkacloud", "/contact"] as const;
export type BullSubroute = (typeof BULL_SUBROUTES)[number];

interface NavItem {
  /** Sub-route relative to the language root, e.g. "/services" or "". */
  sub: BullSubroute;
  label: string;
}

export const BULL_NAV: Record<Lang, NavItem[]> = {
  en: [
    { sub: "", label: "Home" },
    { sub: "/services", label: "Services" },
    { sub: "/work", label: "Work" },
    { sub: "/tenkacloud", label: "TenkaCloud" },
    { sub: "/contact", label: "Contact" },
  ],
  ja: [
    { sub: "", label: "ホーム" },
    { sub: "/services", label: "サービス" },
    { sub: "/work", label: "実績" },
    { sub: "/tenkacloud", label: "TenkaCloud" },
    { sub: "/contact", label: "お問い合わせ" },
  ],
};

/**
 * Portfolio (personal) pages.
 *
 * English keeps the original top-level routes ("/", "/about", ...). Japanese
 * lives under "/ja/me" so it never collides with the BULL business pages that
 * already occupy "/ja" (issue: bilingual portfolio).
 */
export const PORTFOLIO_SUBROUTES = ["", "/about", "/projects", "/resume"] as const;
export type PortfolioSubroute = (typeof PORTFOLIO_SUBROUTES)[number];

/** Path prefix for the Japanese portfolio. */
const JA_PORTFOLIO_PREFIX = "/ja/me";

/** Builds the absolute path for a portfolio page in the given language. */
export function portfolioPath(lang: Lang, sub: PortfolioSubroute): string {
  if (lang === "ja") return `${JA_PORTFOLIO_PREFIX}${sub}/`;
  return sub === "" ? "/" : `${sub}/`;
}

/**
 * Portfolio navigation. Pages that exist in one language only (papers, blog,
 * contact) point at the shared route so the nav never loses an entry.
 */
export const PORTFOLIO_NAV: Record<Lang, { href: string; label: string }[]> = {
  en: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/projects", label: "Projects" },
    { href: "/papers", label: "Papers" },
    { href: "/blog", label: "Blog" },
    { href: "/resume", label: "Resume" },
    { href: "/contact", label: "Contact" },
  ],
  ja: [
    { href: portfolioPath("ja", ""), label: "ホーム" },
    { href: portfolioPath("ja", "/about"), label: "自己紹介" },
    { href: portfolioPath("ja", "/projects"), label: "プロジェクト" },
    { href: "/papers", label: "論文" },
    { href: "/blog", label: "ブログ" },
    { href: portfolioPath("ja", "/resume"), label: "経歴" },
    { href: "/contact", label: "お問い合わせ" },
  ],
};

/** Returns the active BULL language for a pathname, or null for legacy pages. */
export function getLangFromPath(pathname: string): Lang | null {
  // "/ja/me" belongs to the portfolio, not to the BULL section.
  if (pathname === JA_PORTFOLIO_PREFIX || pathname.startsWith(`${JA_PORTFOLIO_PREFIX}/`)) {
    return null;
  }
  for (const lang of LANGUAGES) {
    if (pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)) return lang;
  }
  return null;
}

/**
 * Identifies a portfolio page from a pathname. Returns the language and the
 * sub-route, or null when the path is not a bilingual portfolio page.
 */
export function getPortfolioContext(
  pathname: string,
): { lang: Lang; sub: PortfolioSubroute } | null {
  const path = normalize(pathname);

  if (path === JA_PORTFOLIO_PREFIX) return { lang: "ja", sub: "" };
  if (path.startsWith(`${JA_PORTFOLIO_PREFIX}/`)) {
    const sub = path.slice(JA_PORTFOLIO_PREFIX.length);
    return PORTFOLIO_SUBROUTE_SET.has(sub) ? { lang: "ja", sub: sub as PortfolioSubroute } : null;
  }

  if (path === "/") return { lang: "en", sub: "" };
  return PORTFOLIO_SUBROUTE_SET.has(path) ? { lang: "en", sub: path as PortfolioSubroute } : null;
}

/** hreflang alternates for a portfolio sub-route, including x-default. */
export function portfolioAlternates(sub: PortfolioSubroute): { lang: string; href: string }[] {
  return [
    ...LANGUAGES.map((lang) => ({ lang, href: portfolioPath(lang, sub) })),
    { lang: "x-default", href: portfolioPath(DEFAULT_LANG, sub) },
  ];
}

/** Strips a trailing slash (except for the root "/"). */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/** Module-level helpers (built once, not per call). */
const LANG_PREFIX_RE = new RegExp(`^/(${LANGUAGES.join("|")})(?=/|$)`);
const BULL_SUBROUTE_SET: ReadonlySet<string> = new Set(BULL_SUBROUTES);
const PORTFOLIO_SUBROUTE_SET: ReadonlySet<string> = new Set(PORTFOLIO_SUBROUTES);

/**
 * Returns the equivalent path in the target language. Inside the BULL section
 * the sub-route is preserved (e.g. `/en/services` -> `/ja/services`). For any
 * other page we fall back safely to the target language home (issue #311).
 */
export function switchLangPath(pathname: string, target: Lang): string {
  const path = normalize(pathname);

  // Bilingual portfolio pages map to their counterpart, keeping the sub-route.
  const portfolio = getPortfolioContext(path);
  if (portfolio) return portfolioPath(target, portfolio.sub);

  const current = getLangFromPath(path);
  if (current) {
    const sub = path.replace(LANG_PREFIX_RE, "");
    // Only mirror sub-routes that exist in both languages; otherwise fall back
    // to the target language home so the switcher never points at a 404.
    return BULL_SUBROUTE_SET.has(sub) ? bullPath(target, sub as BullSubroute) : bullPath(target, "");
  }
  return bullPath(target, "");
}

/**
 * Builds the absolute path for a BULL page. Carries a trailing slash so internal
 * links match the canonical/hreflang URLs (directory build format), keeping the
 * self-referential hreflang set consistent (#315).
 */
export function bullPath(lang: Lang, sub: BullSubroute): string {
  return `/${lang}${sub}/`;
}

/**
 * hreflang alternates for a BULL sub-route, including x-default.
 *
 * Hrefs carry a trailing slash so they match the canonical URLs Astro emits
 * (directory build format), keeping the hreflang set self-consistent (#315).
 */
export function bullAlternates(sub: BullSubroute): { lang: string; href: string }[] {
  // Built via bullPath so hreflang hrefs can never drift from canonical URLs.
  return [
    ...LANGUAGES.map((lang) => ({ lang, href: bullPath(lang, sub) })),
    { lang: "x-default", href: bullPath(DEFAULT_LANG, sub) },
  ];
}
