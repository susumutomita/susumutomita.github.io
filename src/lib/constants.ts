export const LINKS = {
  github: "https://github.com/susumutomita",
  linkedin: "https://www.linkedin.com/in/susumutomita/",
  x: "https://twitter.com/tonitoni415",
  findy: "https://findy-code.io/share_profiles/534Wg0z099ZcD",
  email: "oyster880@gmail.com",
  zenn: "https://zenn.dev/bull",
  qiita: "https://qiita.com/tonitoni415",
};

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/papers", label: "Papers" },
  { href: "/blog", label: "Blog" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
] as const;

export const SITE = {
  name: "Susumu Tomita",
  title: "Susumu Tomita - Software Engineer",
  description: "Software Engineer specializing in blockchain, Web3, and cloud technologies.",
  url: "https://susumutomita.netlify.app",
};

/**
 * BULL business configuration.
 *
 * BULL is a small engineering firm for small teams that delivers cloud
 * foundations, corporate domain/identity migrations, and IaC/observability/
 * non-functional design end-to-end — design, implementation, and operational
 * improvement. Architecture reviews are an entry engagement, not the only
 * offering. See issues #310-#315.
 */
export const BULL = {
  name: "BULL",
  // External links used as proof of public implementation/operational ability.
  tenkacloud: "https://github.com/susumutomita/TenkaCloud",
  github: LINKS.github,
  /**
   * Published Google Form for general inquiries (issues #314 / #316). For now a
   * single bilingual form (JA/EN content and topic branching live in the form),
   * so both keys point at the same URL; keeping per-language keys lets us split
   * them later without touching callers. Empty → mailto: fallback. Field spec:
   * docs/google-form-spec.md. (No tracking params are appended — see CLAUDE.md.)
   */
  contactFormEn: "https://forms.gle/cHK2onML5vpTonKL8",
  contactFormJa: "https://forms.gle/cHK2onML5vpTonKL8",
  /**
   * TenkaCloud is a separate product (#316): inquiries go to its own site and
   * dedicated form, not the general BULL inquiry form.
   */
  tenkacloudSite: "https://tenkacloud.com",
  tenkacloudForm: "https://forms.gle/djVprYmq3hFgJA7P9",
};

/**
 * Returns a usable BULL contact-form URL for the language, or "" when the value
 * is not a concrete https URL (guards against an unreplaced template placeholder
 * like ".../<EN_FORM_ID>/..."). Shared by every contact entry point so the guard
 * can't be forgotten on one page.
 */
export function bullContactFormUrl(lang: "en" | "ja"): string {
  const raw = lang === "en" ? BULL.contactFormEn : BULL.contactFormJa;
  return raw.startsWith("https://") && !raw.includes("<") ? raw : "";
}

export const loaderAnimation: [string, Record<string, unknown>, Record<string, unknown>] = [
  ".loader",
  { opacity: [1, 0], pointerEvents: "none" },
  { easing: "ease-out" },
];

// Blog pagination
export const POSTS_PER_PAGE = 10;
