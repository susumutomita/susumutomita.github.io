---
layout: ../../layouts/LayoutBlogPost.astro
title: "Dock.ioについて"
description: "Dock.ioの調査メモを残しておく"
pubDate: 2024-06-25
category: "Web3"
---

### Dock.ioについて

**はじめに**

Dock.io は、デジタルアイデンティティの管理と認証を支援するブロックチェインベースのプラットフォームです。このブログでは、Dock.io の機能、利点、利用方法、そして企業がどのようにしてこのプラットフォームを活用できるかについて詳しく説明します。

**Dock.ioの概要**

Dock.io は、ブロックチェイン技術を活用して、個人や組織のデジタルアイデンティティを安全かつ信頼性の高い方法で管理・認証するためのプラットフォームです。従来の中央集権型システムとは異なり、Dock.io は分散型ネットワークを利用することで、データのセキュリティとプライバシーを強化しています。

<iframe width="560" height="315" src="https://www.youtube.com/embed/h0JudHh0wOg?si=dHv_mvIghasSsWDE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

**主要な機能**

1. **分散型アイデンティティ管理**：
   Dock.io は、ユーザーが自分のアイデンティティ情報を完全にコントロールできるようにします。ユーザーは、自分のデータを誰と共有するかを決定でき、第三者に依存しないでデータを管理できます。

2. **検証可能な証明書**：
   プラットフォームは、ブロックチェインを利用して検証可能なデジタル証明書を発行します。これにより、証明書の偽造や改ざんが不可能になり、信頼性が向上します。

3. **データのプライバシーとセキュリティ**：
   Dock.io は、ユーザーのデータを暗号化して保存し、不正アクセスから保護します。ユーザーのプライバシーを最優先に考えた設計がされています。

**利用方法**

1. **登録とログイン**：
   Dock.io のウェブサイトにアクセスし、GitHub や Google アカウントを使用してサインインします。

2. **プロファイル作成**：
   プロファイル情報を入力し、組織の情報を追加します。

3. **証明書の発行**：
   必要に応じて、検証可能な証明書を発行し、関係者と共有します。

**実際の利用例**

なかなか安定していない印象です。
- サインアップができず、サポートに問い合わせ。バグと判明し修正される。
- サインアップ問題が修正されてダッシュボードにアクセスできた。その後サンプル名刺がメールで送られてきたが URL をクリックしても無効と表示される。
- 日本のアプリストアでは Dock Wallet は利用できない。サポートに聞くとダイレクト[リンク](https://apps.apple.com/us/app/dock-wallet/id1565227368)が返されてようやく動いた。

**なぜDock.ioを調べているのか**

私たちは、https://github.com/knocks-public/2024-CircuitBreaker で Inro というプロダクトを開発しました。このプロダクトを世に出すために Orange DAO S24 フェローシップに申し込みましたが、残念ながら投資は見送られました。フィードバックとして、実際の需要や使用例の明確化が求められました。

Dock.io を発見し、すでに同様の製品を成功裏にローンチしていることから、ユーザー体験の違いや彼らがどのようなニーズを把握し、満たしているのかを理解したいと考えています。これにより、Inro を改善し、ユーザーのニーズを特定し、成功する実装と採用の可能性を高めたいです。
調べてみたり話を聞いてみた感想は KYC(Know Your Customer) 実現するフルスタックプラットフォームであり必ずしも Decentraized にこだわっているというわけではなさそうでした。
Inro のコンセプトを話してみると [SpruceID](https://spruceid.com/)や[Scytáles](https://www.scytales.com/)を調べてみるとよいよとアドバイスも貰えてありがたかったです。

**まとめ**

Dock.io は、デジタルアイデンティティの管理と認証において強力なツールとなるプラットフォームです。ブロックチェイン技術を利用することで、セキュリティと信頼性を確保し、ユーザーが自分のデータを完全にコントロールできる環境を提供します。企業や教育機関がこの技術をどのように活用しているかを理解し、実際の運用に役立てることができます。

**参考文献**
- [Dock.io公式サイト](https://dock.io)
- [GitHubリポジトリ](https://github.com/knocks-public/2024-CircuitBreaker)
- [SpruceID](https://spruceid.com/)
- [Scytáles](https://www.scytales.com/)
