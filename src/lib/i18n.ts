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

/** Returns the active BULL language for a pathname, or null for legacy pages. */
export function getLangFromPath(pathname: string): Lang | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/ja" || pathname.startsWith("/ja/")) return "ja";
  return null;
}

/** Strips a trailing slash (except for the root "/"). */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/**
 * Returns the equivalent path in the target language. Inside the BULL section
 * the sub-route is preserved (e.g. `/en/services` -> `/ja/services`). For any
 * other page we fall back safely to the target language home (issue #311).
 */
export function switchLangPath(pathname: string, target: Lang): string {
  const path = normalize(pathname);
  const current = getLangFromPath(path);
  if (current) {
    const sub = path.replace(/^\/(en|ja)/, "");
    // Only mirror sub-routes that exist in both languages; otherwise fall back
    // to the target language home so the switcher never points at a 404.
    return (BULL_SUBROUTES as readonly string[]).includes(sub) ? bullPath(target, sub as BullSubroute) : bullPath(target, "");
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
  const href = (lang: Lang) => `/${lang}${sub}/`;
  return [
    { lang: "en", href: href("en") },
    { lang: "ja", href: href("ja") },
    { lang: "x-default", href: href(DEFAULT_LANG) },
  ];
}
