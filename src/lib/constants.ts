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
  url: "https://susumutomita.github.io",
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
   * Google Form endpoints for the bilingual contact flow (issue #314).
   * Leave empty to fall back to a pre-filled mailto: link until the Forms are
   * published. The field spec lives in docs/google-form-spec.md.
   */
  contactFormEn: "",
  contactFormJa: "",
};

export const loaderAnimation: [string, Record<string, unknown>, Record<string, unknown>] = [
  ".loader",
  { opacity: [1, 0], pointerEvents: "none" },
  { easing: "ease-out" },
];

// Blog pagination
export const POSTS_PER_PAGE = 10;
