/**
 * Single source of truth for the trust-hub home pages (issue #366).
 *
 * The English home ("/") and the Japanese home ("/ja/me/") render the same
 * structure from this data so the two languages cannot drift apart in meaning
 * or in the amount of information. Every achievement links to a primary
 * source (conference platform, organizer page, or published slides) — numbers
 * without a public source are intentionally not listed.
 */
import { BULL, LINKS } from "./constants";
import type { Lang } from "./i18n";

type Localized = Record<Lang, string>;

export const PROFILE = {
  /** Unified profile notation used across pages (issue #366). */
  displayName: "冨田 進 / Susumu Tomita",
  roleLine: "Founder, BULL LLC | Creator of TenkaCloud",
  focusLine: {
    en: "Cloud Infrastructure, IaC, DevOps, Security, and Hands-on Engineering Education",
    ja: "クラウド基盤・IaC・DevOps・セキュリティ・実践的エンジニアリング教育",
  } satisfies Localized,
  tagline: {
    en: "Building hands-on cloud engineering systems. Founder of BULL LLC and creator of TenkaCloud, the open-source platform for running real AWS competitions.",
    ja: "実 AWS 環境で学ぶ、クラウド実戦教育の仕組みを作る。合同会社 BULL 代表／OSS クラウド競技基盤 TenkaCloud 開発者。",
  } satisfies Localized,
  tenkaCloudOneLiner: {
    en: "TenkaCloud is an open-source, multi-tenant platform for running GameDay-style cloud competitions and hands-on training on real AWS accounts.",
    ja: "TenkaCloud は、実際の AWS アカウント上でクラウド競技（GameDay 形式）や実践研修を運営できるオープンソースのマルチテナント基盤です。",
  } satisfies Localized,
  /** Same visual as the GitHub avatar, served locally for a consistent profile image. */
  image: "/images/profile/susumu-tomita.jpg",
  imageAlt: {
    en: "Portrait of Susumu Tomita",
    ja: "冨田 進のプロフィール画像",
  } satisfies Localized,
} as const;

export interface EvidenceItem {
  event: string;
  year: string;
  role: Localized;
  title: Localized;
  href: string;
  source: Localized;
}

/**
 * Third-party-verifiable activities. Each `href` is the closest primary
 * source available: the conference platform, the organizer's official page,
 * or the slides published for that event.
 */
export const EVIDENCE: EvidenceItem[] = [
  {
    event: "AWS DevDay Tokyo",
    year: "2019",
    role: { en: "Speaker", ja: "登壇" },
    title: {
      en: "Developing, operating, and monitoring connected-car applications built on AWS",
      ja: "AWS をフル活用したコネクテッドカーを支えるアプリケーションの開発・運用・監視術",
    },
    href: "https://speakerdeck.com/susumutomita/aws-native-application-development",
    source: { en: "Slides (Speaker Deck)", ja: "講演資料（Speaker Deck）" },
  },
  {
    event: "DevOpsDays Tokyo",
    year: "2021",
    role: { en: "Speaker", ja: "登壇" },
    title: {
      en: "A team-transformation journey that started with “the login screen won’t open”",
      ja: "「ログイン画面が開きません」から始まるチーム改革の軌跡",
    },
    href: "https://confengine.com/conferences/devopsdays-tokyo-2021/proposal/15172",
    source: { en: "Session page (ConfEngine)", ja: "セッションページ（ConfEngine）" },
  },
  {
    event: "DevOpsDays Tokyo",
    year: "2025",
    role: { en: "Speaker", ja: "登壇" },
    title: {
      en: "Crossing team boundaries through an internal side job — cutting change lead time from up to a month to ten minutes",
      ja: "社内副業で他部門へ「越境」して見えた価値再定義 — 最大 1 か月のリードタイムを 10 分に短縮した DevOps 実践",
    },
    href: "https://confengine.com/conferences/devopsdays-tokyo-2025/proposal/22011",
    source: { en: "Session page (ConfEngine)", ja: "セッションページ（ConfEngine）" },
  },
  {
    event: "DevOpsDays Taipei",
    year: "",
    role: { en: "Speaker", ja: "登壇" },
    title: {
      en: "Breaking Organizational Barriers with Five Hours a Week",
      ja: "Breaking Organizational Barriers with Five Hours a Week",
    },
    href: LINKS.sessionize,
    source: { en: "Speaker profile (Sessionize)", ja: "スピーカープロフィール（Sessionize）" },
  },
  {
    event: "HashiTalks: Japan",
    year: "",
    role: { en: "Speaker", ja: "登壇" },
    title: {
      en: "Infrastructure automation with Terraform in an enterprise setting",
      ja: "エンタープライズにおける Terraform を用いたインフラ自動化",
    },
    href: LINKS.sessionize,
    source: { en: "Speaker profile (Sessionize)", ja: "スピーカープロフィール（Sessionize）" },
  },
  {
    event: "Cloud Operator Days Tokyo",
    year: "2022",
    role: { en: "Speaker", ja: "登壇" },
    title: {
      en: "Zero Trust 101 — starting small from the development platform",
      ja: "おしゃれは足元の開発基盤から — 小さく始めるゼロトラスト 101",
    },
    href: "https://speakerdeck.com/susumutomita/osiyarehazu-yuan-falsekai-fa-ji-pan-kara-xiao-sakushi-meruzerotorasuto101",
    source: { en: "Slides (Speaker Deck)", ja: "講演資料（Speaker Deck）" },
  },
  {
    event: "Cloud Operator Days Tokyo",
    year: "2024",
    role: { en: "Executive committee", ja: "実行委員" },
    title: {
      en: "Served on the executive committee of the cloud operations conference",
      ja: "クラウド運用カンファレンスの実行委員を担当",
    },
    href: "https://cloudopsdays.com/archive/2024/about/",
    source: { en: "Organizer page (About)", ja: "主催者ページ（About）" },
  },
];

export interface ExperienceItem {
  name: string;
  detail: Localized;
}

/**
 * Work history as one flat, chronological list; employment details live in
 * the resume, not on the home page.
 */
export const EXPERIENCE: ExperienceItem[] = [
  {
    name: "Hitachi, Ltd.",
    detail: { en: "QA engineer / technical lead (2006–2017)", ja: "QA エンジニア／テクニカルリード（2006–2017）" },
  },
  {
    name: "Hitachi Vantara (US)",
    detail: { en: "Software QA specialist (2017–2018)", ja: "ソフトウェア QA スペシャリスト（2017–2018）" },
  },
  {
    name: "DENSO",
    detail: {
      en: "Software architect / cloud lead (2018–2025), agile coach (2026–)",
      ja: "ソフトウェアアーキテクト／クラウドリード（2018–2025）、アジャイルコーチ（2026–）",
    },
  },
  {
    name: "WHILL",
    detail: { en: "Cloud application development (2021–2022)", ja: "クラウドアプリケーション開発（2021–2022）" },
  },
  {
    name: "Logomix",
    detail: { en: "Lab automation / SRE (2025–2026)", ja: "ラボオートメーション／SRE（2025–2026）" },
  },
  {
    name: "MynaWallet",
    detail: { en: "Web3 infrastructure and security (2025–)", ja: "Web3 インフラ・セキュリティ（2025–）" },
  },
];

export interface ContactPath {
  title: Localized;
  description: Localized;
  cta: Localized;
  href: string;
  external: boolean;
}

/** Purpose-based contact routes (issue #366). */
export function contactPaths(lang: Lang): ContactPath[] {
  return [
    {
      title: {
        en: "Adopt or run TenkaCloud",
        ja: "TenkaCloud の導入・開催相談",
      },
      description: {
        en: "Running a cloud competition or hands-on training with TenkaCloud, for companies, universities, and communities.",
        ja: "企業・大学・コミュニティでのクラウド競技や実践研修の開催について。",
      },
      cta: { en: "TenkaCloud inquiry form", ja: "TenkaCloud 専用フォーム" },
      href: BULL.tenkacloudForm,
      external: true,
    },
    {
      title: {
        en: "Cloud infrastructure / IaC / DevOps",
        ja: "クラウド基盤 / IaC / DevOps 支援",
      },
      description: {
        en: "Cloud foundations, corporate domain & identity migration, IaC, observability, and architecture reviews through BULL.",
        ja: "BULL としてのクラウド基盤構築、ドメイン・ID 移行、IaC・監視、アーキテクチャレビュー。",
      },
      cta: { en: "BULL services & contact", ja: "BULL のサービスと問い合わせ" },
      href: `/${lang}/contact/`,
      external: false,
    },
    {
      title: {
        en: "Speaking & writing",
        ja: "登壇・執筆依頼",
      },
      description: {
        en: "Conference talks and technical writing on cloud infrastructure, IaC, DevOps, and engineering education.",
        ja: "クラウド基盤・IaC・DevOps・エンジニアリング教育をテーマにした登壇や執筆。",
      },
      cta: { en: "Sessionize profile", ja: "Sessionize プロフィール" },
      href: LINKS.sessionize,
      external: true,
    },
    {
      title: {
        en: "OSS & collaboration",
        ja: "OSS・共同開発",
      },
      description: {
        en: "Issues and pull requests on TenkaCloud and other repositories are welcome on GitHub.",
        ja: "TenkaCloud ほか各リポジトリへの Issue / Pull Request は GitHub でどうぞ。",
      },
      cta: { en: "GitHub", ja: "GitHub" },
      href: LINKS.github,
      external: true,
    },
  ];
}
