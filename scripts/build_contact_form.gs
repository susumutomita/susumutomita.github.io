/**
 * BULL お問い合わせフォーム ビルダー / Contact form builder
 * 対象フォーム / Target form:
 *   https://docs.google.com/forms/d/1C6L7-BERSVd1k3xbGhnkblY2kTZZp9MqnD2RLmKRiC0/edit
 *   公開URL / Live: https://forms.gle/cHK2onML5vpTonKL8
 *
 * ▼ 使い方 / How to run
 *   1. oyster880@gmail.com でログインした状態で https://script.google.com を開く
 *   2. 「新しいプロジェクト」を作成し、このコードを丸ごと貼り付け
 *   3. 関数 buildForm を選んで実行（初回のみ承認）
 *   4. 同じURLのフォームが下記の構成で組み上がります
 *
 * ※ 既存の質問はすべて削除して作り直します（フォームのURL・回答先・メール収集設定は保持）。
 * ※ メールアドレスはフォーム設定の自動収集を利用（連絡先メール欄は別に持たない）。
 *
 * 構成 / Structure:
 *   セクション1（共通）: お名前 / 何を作っているか / 実現したいこと / 希望時期 / 相談したい内容(分岐)
 *   分岐セクション: 相談種別に応じて1つだけ表示 → 送信
 *     - Corporate domain and identity migration
 *     - AWS account foundations
 *     - IaC, observability, or non-functional design
 *     - Architecture review or technical advisory
 *     - TenkaCloud（専用ページ/フォームへ誘導。設問なし）
 *     - Generative AI product development bootcamp
 *     - Other は分岐なしでそのまま送信
 */

var FORM_ID = '1C6L7-BERSVd1k3xbGhnkblY2kTZZp9MqnD2RLmKRiC0';

function buildForm() {
  var form = FormApp.openById(FORM_ID);

  // --- 既存の項目をすべて削除 / Clear existing items ---
  // まず分岐・ページ遷移の参照を解除（参照が残ったまま削除すると Invalid data になる）
  var existing = form.getItems();
  for (var n = 0; n < existing.length; n++) {
    var it = existing[n];
    var t = it.getType();
    if (t === FormApp.ItemType.MULTIPLE_CHOICE) {
      var mc0 = it.asMultipleChoiceItem();
      var vals0 = [];
      var chs0 = mc0.getChoices();
      for (var k0 = 0; k0 < chs0.length; k0++) { vals0.push(chs0[k0].getValue()); }
      if (vals0.length > 0) { mc0.setChoiceValues(vals0); }
    } else if (t === FormApp.ItemType.LIST) {
      var ls0 = it.asListItem();
      var lv0 = [];
      var lc0 = ls0.getChoices();
      for (var m0 = 0; m0 < lc0.length; m0++) { lv0.push(lc0[m0].getValue()); }
      if (lv0.length > 0) { ls0.setChoiceValues(lv0); }
    } else if (t === FormApp.ItemType.PAGE_BREAK) {
      it.asPageBreakItem().setGoToPage(FormApp.PageNavigationType.CONTINUE);
    }
  }
  var items = form.getItems();
  for (var i = items.length - 1; i >= 0; i--) {
    form.deleteItem(items[i]);
  }

  // --- フォーム全体設定 / Form-level settings ---
  form.setTitle('Start a conversation / お問い合わせ');
  form.setDescription(
    'BULLのクラウド基盤づくり、コーポレートドメイン・ID移行、IaC／監視／非機能設計などのご相談を受け付けます。' +
    '最初に「相談したい内容」を選ぶと、種別に応じた質問だけが表示されます。\n' +
    '送信前のお願い：パスワード・APIキー・本番認証情報・個人情報は入力しないでください。' +
    '本フォームの送信は契約や業務開始をお約束するものではありません。\n\n' +
    'We help with cloud foundations, corporate domain / identity migration, IaC, observability and ' +
    'non-functional design. Pick your topic first and you will only see the relevant questions.\n' +
    'Before submitting: please do NOT include passwords, API keys, production credentials, or personal data. ' +
    'Submitting this form does not create a consulting engagement.'
  );
  form.setConfirmationMessage(
    'お問い合わせありがとうございます。内容を確認のうえ、担当よりメールでご連絡します。\n' +
    'Thank you. We have received your inquiry and will reply by email.'
  );

  // ======================================================================
  // 共通セクション1：連絡先（最小）＋ 概要 ＋ 相談種別（分岐質問）
  // ======================================================================
  addText(form,      'Full name / お名前', true);
  addParagraph(form, 'What are you building or operating? / 何を作っている・運用しているか', false);
  addParagraph(form, 'What outcome would make this engagement successful? / この相談で実現したいこと', true);
  addRadio(form,     'Desired timeframe / 希望時期', false, [
    'Within 2 weeks / 2週間以内',
    'This month / 今月中',
    'Within 1–3 months / 1〜3か月以内',
    'Exploring / まだ検討段階'
  ]);

  // 分岐質問（選択肢の遷移先はページ区切り作成後に設定）
  var topic = form.addMultipleChoiceItem();
  topic.setTitle('What would you like help with? / 相談したい内容').setRequired(true);

  // ======================================================================
  // 分岐セクション / Branch sections（選んだ1つだけ表示 → 送信）
  // ======================================================================

  // A. Corporate domain and identity migration / コーポレートドメイン・ID移行
  var pbA = form.addPageBreakItem()
    .setTitle('Corporate domain and identity migration / コーポレートドメイン・ID移行');
  addParagraph(form, 'What is driving the migration? / 移行の背景（統合・ブランド変更・分社化・M&A・セキュリティ改善など）', false);
  addCheckbox(form,  'What needs to move? / 移行対象（複数選択可）', false, [
    'Domain / DNS', 'Email', 'SSO / identity provider', 'SaaS integrations',
    'Website / application hosting', 'Other / その他'
  ]);
  addText(form,      'Desired cutover date or business constraint / 切替希望日または事業上の制約', false);
  addRadio(form,     'Is rollback required? / ロールバックが必要か', false, [
    'Required / 必要', 'Not required / 不要', 'Not sure / わからない'
  ]);

  // B. AWS account foundations / AWSアカウント基盤
  var pbB = form.addPageBreakItem()
    .setTitle('AWS account foundations / AWSアカウント基盤');
  addParagraph(form, 'Current AWS organization / account situation / 現在のAWSアカウント・Organizations状況', false);
  addCheckbox(form,  'What foundation is needed? / 必要な基盤（複数選択可）', false, [
    'Organizations / account structure', 'Control Tower / guardrails', 'Centralized logging',
    'IAM / identity design', 'Security baseline', 'Cost governance', 'Other / その他'
  ]);
  addParagraph(form, 'Compliance or internal controls to consider / 考慮すべき監査・社内統制', false);

  // C. IaC, observability, or non-functional design / IaC・監視・非機能設計
  var pbC = form.addPageBreakItem()
    .setTitle('IaC, observability, or non-functional design / IaC・監視・非機能設計');
  addParagraph(form, 'Current infrastructure and delivery approach / 現在のインフラ・デプロイ方法', false);
  addCheckbox(form,  'What needs improvement? / 改善したいこと（複数選択可）', false, [
    'Terraform / AWS CDK', 'CI/CD', 'Monitoring / alerting', 'SLO / reliability',
    'Cost optimization', 'Security operations', 'Performance / scalability', 'Other / その他'
  ]);
  addText(form,      'Relevant technologies or providers / 関連技術・利用サービス', false);

  // D. Architecture review or technical advisory / アーキテクチャレビュー・技術アドバイザリー
  var pbD = form.addPageBreakItem()
    .setTitle('Architecture review or technical advisory / アーキテクチャレビュー・技術アドバイザリー');
  addParagraph(form, 'What decision, risk, or problem would you like to address? / いま判断したいこと・リスク・困りごと', false);
  addCheckbox(form,  'Existing materials available for review / 共有可能な資料（複数選択可）', false, [
    'Architecture diagram / 構成図', 'Data model / ERD',
    'State-transition or workflow diagram / 状態遷移・業務フロー',
    'API or integration design', 'Cloud / deployment design', 'None yet / まだない'
  ]);
  addRadio(form,     'Preferred format / 希望する形式', false, [
    'Asynchronous written review / 非同期の資料レビュー',
    'Focused workshop or meeting / 論点を絞ったミーティング',
    'Ongoing advisory / 継続アドバイザリー'
  ]);

  // E. TenkaCloud / cloud challenge or technical event / TenkaCloud・技術イベント
  //    専用ページ・専用フォームがあるため、設問は置かず誘導のみ。
  var pbE = form.addPageBreakItem()
    .setTitle('TenkaCloud / cloud challenge or technical event / TenkaCloud・技術イベント')
    .setHelpText(
      'TenkaCloudは専用ページとお問い合わせフォームがあります。提供内容（Hosted Event / Annual Arena / CCoE Enablement）と料金のご確認、ご相談・お見積もりは、下記からお願いします。\n' +
      'TenkaCloud has a dedicated page and inquiry form. Please check the offerings and pricing, and send inquiries there.\n\n' +
      'ランディングページ / Landing page: https://tenkacloud.com/?lang=ja\n' +
      'お問い合わせ・お見積もりフォーム / Inquiry form: https://forms.gle/djVprYmq3hFgJA7P9'
    );

  // F. Generative AI product development bootcamp / 生成AIプロダクト開発ブートキャンプ
  var pbF = form.addPageBreakItem()
    .setTitle('Generative AI product development bootcamp / 生成AIプロダクト開発ブートキャンプ');
  addText(form,      'Expected participant count / 想定参加人数', false);
  addParagraph(form, 'Participant profile / 参加者の職種・経験', false);
  addParagraph(form, 'Business theme or problem to prototype / プロトタイプ化したい業務テーマ', false);

  // ======================================================================
  // 分岐ルーティング / Branch routing
  //   ページ区切りの setGoToPage は「直前のセクション終了後」の遷移を決める。
  //   各分岐セクションの直後の区切りを SUBMIT にして、選んだ1セクションで送信完了させる。
  //   分岐質問からのジャンプはこの設定の影響を受けない。
  // ======================================================================
  var SUBMIT = FormApp.PageNavigationType.SUBMIT;
  pbB.setGoToPage(SUBMIT); // Corporate セクション終了後 → 送信
  pbC.setGoToPage(SUBMIT); // AWS セクション終了後 → 送信
  pbD.setGoToPage(SUBMIT); // IaC セクション終了後 → 送信
  pbE.setGoToPage(SUBMIT); // Architecture セクション終了後 → 送信
  pbF.setGoToPage(SUBMIT); // TenkaCloud セクション終了後 → 送信
  // GenAI（最終セクション）終了後 → 送信（最後のため自動）

  // 分岐質問の選択肢 → 対応セクションへ（Other は分岐なしでそのまま送信）
  topic.setChoices([
    topic.createChoice('Corporate domain and identity migration / コーポレートドメイン・ID移行', pbA),
    topic.createChoice('AWS account foundations / AWSアカウント基盤', pbB),
    topic.createChoice('IaC, observability, or non-functional design / IaC・監視・非機能設計', pbC),
    topic.createChoice('Architecture review or technical advisory / アーキテクチャレビュー・技術アドバイザリー', pbD),
    topic.createChoice('TenkaCloud / cloud challenge or technical event / TenkaCloud・技術イベント', pbE),
    topic.createChoice('Generative AI product development bootcamp / 生成AIプロダクト開発ブートキャンプ', pbF),
    topic.createChoice('Other / その他', SUBMIT)
  ]);

  Logger.log('Done. Edit URL: ' + form.getEditUrl());
  Logger.log('Live URL: ' + form.getPublishedUrl());
}

// ===================== helpers =====================
function addText(form, title, required) {
  form.addTextItem().setTitle(title).setRequired(!!required);
}
function addParagraph(form, title, required) {
  form.addParagraphTextItem().setTitle(title).setRequired(!!required);
}
function addRadio(form, title, required, choices) {
  form.addMultipleChoiceItem().setTitle(title).setRequired(!!required).setChoiceValues(choices);
}
function addCheckbox(form, title, required, choices) {
  form.addCheckboxItem().setTitle(title).setRequired(!!required).setChoiceValues(choices);
}
