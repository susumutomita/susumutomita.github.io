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

export const loaderAnimation: [string, Record<string, unknown>, Record<string, unknown>] = [
  ".loader",
  { opacity: [1, 0], pointerEvents: "none" },
  { easing: "ease-out" },
];

// Blog pagination
export const POSTS_PER_PAGE = 10;
