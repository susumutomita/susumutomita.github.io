# BULL Contact — Google Form Specification (#314)

This document is the build spec for the bilingual BULL inquiry forms. The site
already wires the **Start a conversation / お問い合わせ** CTA to these forms; once
the forms are published, set their URLs in `src/lib/constants.ts`:

```ts
export const BULL = {
  // ...
  contactFormEn: "https://docs.google.com/forms/d/e/<EN_FORM_ID>/viewform",
  contactFormJa: "https://docs.google.com/forms/d/e/<JA_FORM_ID>/viewform",
};
```

Until they are set, the CTA falls back to a plain `mailto:` link to the contact
address (no referrer/UTM data is forwarded — see the privacy note below).

## Approach

- Build **one English form** and **one Japanese form** (the site opens the form
  that matches the current site language). Alternatively, use one form with a
  leading language section — but two forms keep branching simpler.
- Use Google Forms **section branching** ("Go to section based on answer") on the
  "What would you like help with?" question.
- Enable response notifications (email or a Slack/Sheets integration) and collect
  responses into a Google Sheet.
- reCAPTCHA / spam protection relies on the Google Forms default.

## Common questions (all topics)

### 1. Contact details

| Field | EN label | JA label | Required |
| --- | --- | --- | --- |
| name | Full name | お名前 | ✅ |
| email | Work email | 連絡先メールアドレス | ✅ |
| company | Company or organization | 会社・組織名 | ✅ |
| role | Role | 役割・役職 | — |
| website | Website or LinkedIn | WebサイトまたはLinkedIn | — |
| country | Country / Time zone | 国・タイムゾーン | — |

### 2. What would you like help with? (single select, required — drives branching)

- Corporate domain and identity migration / コーポレートドメイン・ID移行
- AWS account foundations / AWSアカウント基盤
- IaC, observability, or non-functional design / IaC・監視・非機能設計
- Architecture review or technical advisory / アーキテクチャレビュー・技術アドバイザリー
- TenkaCloud / cloud challenge or technical event / TenkaCloud・技術イベント
- Generative AI product development bootcamp / 生成AIプロダクト開発ブートキャンプ
- Other / その他

### 3. Project context (all topics)

- What are you building or operating? / 何を作っている・運用しているか — long text, required
- What outcome would make this engagement successful? / この相談で実現したいこと — long text, required
- Current stage / 現在のフェーズ — Exploring / In design / In development / In production / Incident or urgent support
- Desired timeframe / 希望時期 — Within 2 weeks / This month / Within 1–3 months / Exploring

## Branch questions by topic

### A. Corporate domain and identity migration

- What is driving the migration? / 移行の背景 (integration, rebrand, carve-out, M&A, security)
- What needs to move? (multi-select): Domain/DNS, Email, SSO/IdP, SaaS integrations, Website/app hosting, Other
- Desired cutover date or business constraint / 切替希望日または事業上の制約
- Is rollback required? / ロールバックが必要か

### B. AWS account foundations

- Current AWS organization/account situation / 現在のAWSアカウント・Organizations状況
- What foundation is needed? (multi-select): Organizations/account structure, Control Tower/guardrails, Centralized logging, IAM/identity design, Security baseline, Cost governance, Other
- Compliance or internal controls to consider / 考慮すべき監査・社内統制

### C. IaC, observability, or non-functional design

- Current infrastructure and delivery approach / 現在のインフラ・デプロイ方法
- What needs improvement? (multi-select): Terraform/CDK, CI/CD, Monitoring/alerting, SLO/reliability, Cost optimization, Security operations, Performance/scalability, Other
- Relevant technologies or providers / 関連技術・利用サービス

### D. Architecture review or technical advisory

- What decision, risk, or problem would you like to address? / いま判断したいこと、リスク、困りごと
- Existing materials available (multi-select): Architecture diagram, Data model/ERD, State-transition/workflow, API/integration design, Cloud/deployment design, None yet
- Preferred format: Asynchronous written review / Focused workshop or meeting / Ongoing advisory

### E. TenkaCloud

- Event type: Cloud challenge / Security training / GameDay / Hackathon / Internal learning program / Other
- Expected participant count / 想定参加人数
- Desired event date / 開催希望日
- Need for custom challenges, operations, or self-hosting / カスタム問題・運営支援・自走化の希望

### F. Generative AI product development bootcamp

- Expected participant count / 想定参加人数
- Participant profile / 参加者の職種・経験
- Desired format: 2-day bootcamp / Internal workshop / Custom program
- Business theme or problem to prototype / プロトタイプ化したい業務テーマ

## Budget / commercial context (all topics, optional)

- Budget range / 予算感: Not decided / Under USD 3,000 / USD 3,000–10,000 / USD 10,000+ / Prefer to discuss
  - JA: 未定 / 50万円未満 / 50〜150万円程度 / 150万円以上 / 相談したい

## Consent (required checkboxes)

- I understand that this form is an inquiry only and does not create a consulting engagement. / このフォーム送信は契約・業務開始を意味しないことを理解しました。
- I will not include passwords, API keys, personal data, or production credentials. / パスワード、APIキー、個人情報、本番認証情報を送信しません。
- I agree that BULL may use the information solely to respond to this inquiry. / 問い合わせへの対応に必要な範囲で情報を利用することに同意します。

## Inbound source capture

To stay aligned with the site's privacy-focused, no-tracking policy (CLAUDE.md),
the site CTA opens the form **without appending** `document.referrer` or `utm_*`
parameters. If submission-source measurement is needed later, rely on Google
Forms' own response metadata rather than forwarding tracking params from the site.
