/**
 * Structured data (JSON-LD) builders for the BULL business pages (issue #315).
 *
 * Each page passes the resulting graph to BaseLayout via the `jsonLd` prop so
 * search engines and social platforms can understand the entity correctly:
 * a small engineering firm, its operator, and TenkaCloud as a product.
 */
import { SITE, LINKS, BULL } from "./constants";
import type { Lang } from "./i18n";

const ORG_DESCRIPTION: Record<Lang, string> = {
  en: "A small engineering firm helping small teams with cloud foundations, corporate domain and identity migrations, and IaC, observability and non-functional design — from design through implementation and operational improvement.",
  ja: "クラウド基盤づくり、コーポレートドメイン・ID移行、IaC・監視・非機能設計を、設計から実装・運用改善まで一気通貫で担う小規模事業者向けエンジニアリングファーム。",
};

/** schema.org Organization node for BULL. */
export function organizationSchema(lang: Lang) {
  return {
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: BULL.name,
    // Stable entity URL (the org root), since the @id is shared across the EN and
    // JA pages — a per-language url would make the same @id assert conflicting urls.
    url: SITE.url,
    description: ORG_DESCRIPTION[lang],
    sameAs: [LINKS.github, LINKS.linkedin],
    knowsAbout: [
      "AWS",
      "Cloud architecture",
      "Identity and access management",
      "Infrastructure as Code",
      "Observability",
      "Domain and DNS migration",
    ],
    // Link to the shared Person node instead of duplicating it.
    founder: { "@id": `${SITE.url}/#person` },
  };
}

/** schema.org Person node for the operator. */
export function personSchema() {
  return {
    "@type": "Person",
    "@id": `${SITE.url}/#person`,
    name: SITE.name,
    url: SITE.url,
    jobTitle: "Software Engineer",
    sameAs: [LINKS.github, LINKS.linkedin],
  };
}

const TENKACLOUD_DESCRIPTION: Record<Lang, string> = {
  en: "An open-source, multi-tenant platform for cloud challenges, GameDays, and technical learning events, with role-based access, SSO, and auditability.",
  ja: "クラウドチャレンジ、GameDay、技術学習イベントのためのオープンソース・マルチテナント基盤。ロールベースアクセス、SSO、監査可能性を備える。",
};

/** schema.org SoftwareApplication node for TenkaCloud. */
export function tenkaCloudSchema(lang: Lang) {
  return {
    "@type": "SoftwareApplication",
    name: "TenkaCloud",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    // Canonical product home page (not the GitHub source repo).
    url: BULL.tenkacloudSite,
    description: TENKACLOUD_DESCRIPTION[lang],
    // Link to the shared Organization node instead of duplicating it.
    author: { "@id": `${SITE.url}/#organization` },
  };
}

/** Default page graph: Organization + Person. */
export function bullGraph(lang: Lang, extra: object[] = []) {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationSchema(lang), personSchema(), ...extra],
  };
}
