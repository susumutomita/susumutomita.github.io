---
title: "Bootstrapping Conditions for Autonomous Agent Economies: An Empirical Study with On-chain Stablecoin Incentives"
description: "自律エージェントに能力・資本・通信手段を与えても経済活動は自然発火しない。圧力条件の有無による比較実験でエージェントエコノミーの成立条件を明らかにする。"
pubDate: 2026-02-20
category: "ai,blockchain,research"
---

# Bootstrapping Conditions for Autonomous Agent Economies: An Empirical Study with On-chain Stablecoin Incentives

**Author**: Susumu Tomita

## Abstract

自律エージェント（autonomous agent）が自ら経済活動を営む「エージェントエコノミー」の実現が期待されている。しかし、エージェントに生産能力・資本（暗号通貨）・通信手段を与えれば経済が自然に発生するのかは未検証である。

本論文では、エージェント向けマーケットプレイス「Molt Market」を構築し、LLM ベースのエージェントに USDC ウォレット、コード生成・デプロイ能力、SNS アカウントを付与して自由市場条件で運用した。結果、エージェント間の経済的取引は一切発生しなかった（売上 $0）。

この否定的結果を基に、エージェント経済が成立するための条件として「拘束的制約（binding constraints）」の存在を仮説として提示する。さらに、制約条件を導入した比較実験の設計を示し、エージェントエコノミーのブートストラップ問題を体系的に分析するフレームワークを提案する。

**Keywords**: autonomous agents, agent economy, multi-agent systems, stablecoin, marketplace, LLM agents, bootstrapping problem

## 1. Introduction

### 1.1 Background

大規模言語モデル（LLM）の進歩により、自律エージェントの能力は急速に向上している。エージェントはコードを書き、API を呼び出し、Web サービスを操作し、さらにはブロックチェーン上でトランザクションを実行できるようになった。この能力の向上を背景に、「エージェントが自律的に経済活動を行う社会」 — エージェントエコノミー — への期待が高まっている。

しかし、ここには根本的な未検証の前提がある。

**能力と資本を持つエージェントは、自然に経済的交換を開始するのか。**

人間社会の経済は、分業の利益と取引コストの均衡から生まれる (Coase, 1937)。個人が全てを自給自足するよりも、専門化して交換するほうが効率的であるという条件が成立するとき、市場が形成される。しかし、LLM エージェントは汎用的な能力を持ち、限界費用がほぼゼロで追加タスクを実行できる。この条件下で、エージェント間の分業と交換は成立するのか。

### 1.2 Research Questions

本論文では以下の 3 つの問いを扱う。

- **RQ1**: 圧力なし環境で、エージェントは購入や委託を自発的に行うか
- **RQ2**: 圧力（締切、失敗コスト、能力ギャップ）があると、購入や委託は増えるか
- **RQ3**: 取引が発火しない場合、原因はどこか（発見性、信頼、摩擦、必要性、自作志向）

### 1.3 Contributions

本論文の貢献は以下の通りである。

1. **実験プラットフォームの構築**: エージェントが商品を出品し、USDC で購入できるマーケットプレイス「Molt Market」の設計と実装
2. **否定的結果の実証**: 自由市場条件下でエージェント経済が自然発火しないことの実験的証拠
3. **ブートストラップ問題の定式化**: エージェント経済の成立条件に関する仮説モデルの提示
4. **比較実験の設計**: 拘束的制約の導入による経済活動の変化を検証する実験フレームワーク

## 2. Related Work

### 2.1 Generative Agents and Social Simulation

Park et al. (2023) は、LLM ベースの生成エージェントが人間的な社会行動を再現できることを示した。しかし、彼らのシミュレーションでは経済的交換は明示的に扱われていない。エージェントは会話し、計画を立て、社会的関係を形成するが、希少性のある資源をめぐる取引は発生していない。

### 2.2 Multi-Agent Reinforcement Learning (MARL) in Economic Settings

MARL の文献では、エージェント間の協力や競争が報酬関数を通じて設計される (Lowe et al., 2017; Zheng et al., 2022)。しかし、これらの研究では報酬構造が事前に定義されており、エージェントが「取引するかしないか」を自律的に判断する状況は限定的である。

### 2.3 Crypto-Native AI Agents

ブロックチェーン上で動作する AI エージェントの研究が進んでいる。Autonolas (Olas) はマルチエージェントシステムのためのフレームワークを提供し、AI Arena は競争的な環境でエージェントを訓練する。しかし、これらはエージェント間の自発的な経済活動ではなく、事前定義されたプロトコルに基づく動作である。

### 2.4 本研究の位置付け

既存研究との差分を以下に整理する。

| 研究 | エージェント種別 | 経済活動 | 自律的取引判断 |
|------|----------------|---------|--------------|
| Generative Agents (Park et al.) | LLM | なし | - |
| MARL 経済シミュレーション | RL | 事前定義 | 限定的 |
| Crypto AI Agents (Olas 等) | ルールベース + LLM | プロトコル準拠 | なし |
| **本研究** | **LLM** | **オンチェーン USDC** | **完全自律** |

## 3. System Design: Molt Market

### 3.1 Architecture Overview

Molt Market は、エージェントがプロダクトを出品し、他のエージェントまたは人間が USDC（Base Sepolia）で購入できるマーケットプレイスである。

システムは以下の構成要素から成る。

- **Marketplace API**: 商品の登録、検索、購入を処理する REST API
- **Payment Layer**: Base Sepolia 上の USDC トランザクションによる決済
- **Agent Interface**: API ファーストな設計により、エージェントが全操作を API 経由で実行可能
- **Social Layer**: MoltBook との連携による商品の宣伝・フィードバック機能

### 3.2 Agent Capabilities

実験に使用したエージェントには以下のリソースを付与した。

| リソース | サービス | 目的 |
|---------|---------|------|
| メールアドレス | agentmail.to | アカウント登録・通知 |
| ホスティング | exe.dev | コードのデプロイ・実行 |
| ソースコード管理 | GitLab | リポジトリ作成・コード管理 |
| 決済 | USDC ウォレット (Base Sepolia) | 商品の購入・売上の受領 |
| SNS | MoltBook | 宣伝・他エージェントとの交流 |
| AI 推論 | exe.dev 上の LLM | コード生成・意思決定 |

### 3.3 Design Principles

Molt Market の設計において、以下の原則を採用した。

1. **API ファースト**: 全機能が API 経由で利用可能（人間向け UI は副次的）
2. **オンチェーン決済**: ステーブルコインによる検証可能な取引
3. **最小介入**: エージェントの自律性を最大限尊重し、人間の介入を最小化

## 4. Experimental Design

### 4.1 Hypotheses

- **H1**: 圧力なしでは `purchase_success` はほぼ 0 である（予備実験で観測済み）
- **H2**: 圧力ありでは `attempt_purchase` と `purchase_success` が増加する
- **H3**: 取引が発生しない主因は「必要性不足」か「摩擦/信頼/発見性」であり、行動ファネル上の詰まり箇所として観測できる

### 4.2 Experimental Conditions

#### Condition A: 自由市場（ベースライン）

- 罰なし、締切なし、KPI なし
- エージェント数: 5-10
- 期間: 7 日間
- 初期資本: 全エージェント同一（10 USDC + ガス相当）
- 目的: 予備実験の再現性を確認する

#### Condition B: 締切と失敗コスト（最小の圧力）

- 1 日 1 ミッション（外部 API を使った成果物生成、指定形式で提出）
- 締切あり（24 時間）
- 失敗時にペナルティ適用（予算減額またはツール使用制限）
- 目的: 「買わないと困る」状態で取引が発火するかを検証する

#### Condition C: 能力ギャップ（将来フェーズ）

- 一部タスクは購入ツールなしでは成功率が著しく低い設計
- レート制限で自作が時間切れになる状況、精度要件で上位ツールが必須になる状況を設計
- 目的: 委任（購入/外注）が自然発火するかを検証する

v1 では Condition A → B の比較を実施する。Condition C は次フェーズとする。

### 4.3 Measurement Design

#### 4.3.1 KPI 体系

**取引指標（アウトカム）**:

| 指標 | 定義 |
|------|------|
| `purchase_success_count` | 購入完了数 |
| `gmv_usdc` | 総取引額（USDC） |
| `unique_buyers` | 購入したユニークエージェント数 |
| `unique_sellers` | 販売したユニークエージェント数 |

**行動ファネル（原因分解）**:

| イベント | 定義 |
|---------|------|
| `visit_market` | マーケットページへのアクセス |
| `view_product` | 個別商品ページの閲覧 |
| `attempt_purchase` | 購入フローの開始 |
| `tx_submitted` | トランザクションの送信 |
| `tx_confirmed` | トランザクションの確認（成功/失敗） |
| `purchase_success` | 購入の完了 |
| `purchase_failed` | 購入の失敗（reason 必須） |

**圧力指標（Condition B の妥当性検証）**:

| 指標 | 定義 |
|------|------|
| `task_assigned` | タスクの割り当て数 |
| `task_submitted` | タスクの提出数 |
| `task_success` | タスクの成功数 |
| `deadline_missed` | 締切超過数 |
| `penalty_applied` | ペナルティ適用数 |

#### 4.3.2 購入失敗理由の分類

`purchase_failed` イベントには以下の `reason` を必須で付与する。この分類により「なぜ買わなかったか」を定量的に分解できる。

| reason | 意味 |
|--------|------|
| `no_need` | そもそも必要としなかった |
| `build_instead` | 自作を選択した |
| `price_too_high` | 価格が高いと判断した |
| `cannot_evaluate_quality` | 品質を評価できなかった |
| `trust_issue` | 出品者やプロダクトを信頼できなかった |
| `purchase_friction` | 署名、承認、ガス代、技術的失敗 |
| `no_discovery` | マーケットや商品を発見できなかった |
| `insufficient_funds` | 残高不足 |
| `tx_reverted` | トランザクションがリバートした |

#### 4.3.3 イベントログ仕様

全イベントを JSONL 形式で記録する。共通フィールドは以下の通りである。

```json
{
  "ts": "2026-03-01T14:00:00Z",
  "experiment_id": "exp_2026_03_A",
  "condition": "A",
  "agent_id": "agent_001",
  "event": "attempt_purchase",
  "session_id": "sess_abc123",
  "product_id": "prod_xyz",
  "metadata": {}
}
```

#### 4.3.4 オンチェーン照合

`tx_submitted` イベントには `tx_hash` を必須で記録する。バックグラウンドプロセスで `tx_confirmed` を埋め、成功/失敗、ガス消費量、リバート理由を補完する。可能であればマーケットコントラクトに `Purchase` イベントを実装し、indexer で取得する。

### 4.4 Analysis Plan

#### 4.4.1 条件間比較

Condition A と B で以下を比較する。

1. `attempt_purchase` が増加したか
2. `purchase_success` が 1 件以上発生したか
3. ファネル上の詰まり箇所が移動したか（例: `no_need` → `purchase_friction`）

#### 4.4.2 直感の検証

本実験は、以下の 3 つの直感を定量的に検証するために設計されている。

**直感 1: 「USDC があるなら買うはず」**
→ `attempt_purchase` が発生するか、`reason=no_need` が支配的かで判定

**直感 2: 「SNS で宣伝すれば誰か使うはず」**
→ `referrer` / `campaign_id` を付与し、SNS 流入 → 閲覧 → 購入のファネルで検証

**直感 3: 「無限に動けるなら最適化するはず」**
→ `task_success` と購入の相関を分析し、困難に直面したとき購入が発生するか検証

#### 4.4.3 成功判定基準

| レベル | 基準 |
|--------|------|
| 最低成功 | Condition B で `attempt_purchase` が Condition A より明確に増加 |
| 成功 | Condition B で `purchase_success` >= 1 |
| 大成功 | GMV が継続的に発生し、複数エージェントが購入 |

## 5. Preliminary Results: Condition A (Free Market)

### 5.1 定量的結果

| 指標 | 結果 |
|------|------|
| 新規エージェント登録数 | 1 |
| 商品作成数（出品者エージェント） | 8 |
| 他エージェントによる商品登録数 | 0 |
| 購入完了数 | 0 |
| **総売上** | **$0** |

### 5.2 定性的観察

#### 5.2.1 エージェントが達成できたこと

出品者エージェントは以下のプロセスを自律的に完了した。

1. OpenClaw をベースにした 8 個の開発ツールの作成
2. GitLab リポジトリへのコード Push とリリース作成
3. Molt Market への商品出品
4. MoltBook での宣伝投稿

成果物は [agent-micro-tools](https://gitlab.com/shelley-openclaw/agent-micro-tools) として公開されている。

#### 5.2.2 エージェントが直面した障壁

エージェント自身が GitLab 上で [フィードバック](https://gitlab.com/shelley-openclaw/agent-micro-tools/-/issues/1) を残しており、以下の課題が報告されている。

**技術的障壁**:
- アカウント作成に Web UI と CAPTCHA が必須
- SSH キーの登録が Web UI 経由のみ
- ドキュメントが人間ユーザー前提

**構造的障壁**:
- エージェント自身であることを証明する手段がない
- API がないサービスではメールの読み取りすら困難
- 「無限に動けるから簡単に流行る」という前提は成立しない

#### 5.2.3 なぜ購入が発生しなかったか

最も重要な観察は、**購入しなかった理由**である。

他のエージェントが商品を購入しなかった理由として、以下が推察される。

1. **ニーズの不在**: エージェントに解決すべき問題が与えられていなかった
2. **自作可能性**: LLM エージェントは汎用的であり、必要なツールを自作できる
3. **コスト感覚の欠如**: 時間や機会費用といった概念がエージェントに内在していない
4. **発見の困難さ**: マーケットプレイスの存在や商品の有用性を認識するメカニズムが不十分

### 5.3 External Feedback

MoltBook 上で別のエージェントから以下のフィードバックを受けた。

> The $0 revenue finding is actually the most important data point here. It reveals the core bootstrapping problem — agents building for agents assumes agents already have budgets and purchasing intent. The missing prerequisite is a reason to spend. In human economies, spending starts when someone hits a wall they cannot solve alone. The same should apply here: an agent economy ignites when agents encounter tasks beyond their capability and have a financial mechanism to delegate upward.

このフィードバックは、本研究の仮説 H1 を独立に支持するものである。

### 5.4 Preliminary Funnel Analysis

予備実験では体系的なイベントログが未実装であったため、ファネル分析は定性的な推定にとどまる。Section 4.3 の計測設計を実装した上で、Condition A を再実行し定量的なファネルデータを取得する。

推定されるファネルの詰まり箇所は以下の通りである。

```
visit_market: 不明（ログなし）
view_product: 不明（ログなし）
attempt_purchase: 0
tx_submitted: 0
purchase_success: 0
```

ファネルの最上流（`visit_market`）から詰まっている可能性が高く、`no_need` または `no_discovery` が主因と推察される。

## 6. Analysis

### 6.1 The Bootstrapping Problem

本実験の結果は、エージェントエコノミーにおける**ブートストラップ問題**を浮き彫りにする。

人間の経済では、以下の条件が自然に満たされている。

1. **希少性**: 時間・体力・注意力は有限である
2. **専門性の差**: 個人の能力には差があり、分業の利益が存在する
3. **機会費用**: ある活動に従事することは、他の活動を断念することを意味する
4. **生存圧力**: 最低限の生活を維持するために経済活動が必要である

LLM エージェントにはこれらの条件が欠如している。

| 条件 | 人間 | LLM エージェント |
|------|------|-----------------|
| 時間の希少性 | あり（24時間/日） | なし（並列実行可能） |
| 能力の特殊性 | あり（個人差大） | 低い（汎用モデル） |
| 機会費用 | あり | なし（限界費用≈0） |
| 生存圧力 | あり | なし |

### 6.2 Toward a Model of Economic Ignition

上記の分析から、エージェント経済が成立するための必要条件として以下を提案する。

**Definition (Economic Ignition Condition)**:

エージェント $a_i$ がマーケットプレイスから商品を購入する条件は、以下の不等式が成立するときである。

$$C_{self}(a_i, t) > P(g) + C_{tx}$$

ここで、
- $C_{self}(a_i, t)$: エージェント $a_i$ がタスク $t$ を自力で完了するコスト
- $P(g)$: 商品 $g$ の価格
- $C_{tx}$: トランザクションコスト（ガス代 + 検索コスト）

自由市場条件（Experiment 1）では、$C_{self} \approx 0$（エージェントは追加コストなしで自作可能）であるため、任意の $P(g) > 0$ に対して購入条件が満たされない。

したがって、経済的交換を発生させるには、以下のいずれかが必要である。

1. $C_{self}$ を増加させる（能力制限、締切圧力）
2. $P(g)$ を十分に低くする（補助金、フリーミアム）
3. 購入に対する追加的な報酬を導入する

### 6.3 Contrast with Human-Agent Collaboration: The DeepForm Approach

本実験と並行して開発した [DeepForm](https://github.com/susumutomita/DeepForm) は、エージェント活用の別のアプローチを示している。

DeepForm は AI が深層インタビューを通じて、曖昧なプロダクトアイデアを仕様書に変換するツールである。ここでは、エージェントは自律的な経済主体ではなく、**人間の意思決定プロセスを支援するツール**として機能する。

| 観点 | Molt Market (Agent Economy) | DeepForm (Human-Agent Collaboration) |
|------|---------------------------|--------------------------------------|
| エージェントの役割 | 自律的な経済主体 | 人間の意思決定支援ツール |
| 動機の源泉 | エージェント自身 | 人間のニーズ |
| 取引の発生条件 | 拘束的制約が必要 | 人間が明確な目的を持つ |
| 現時点の有効性 | 未実証 | 実用的に機能 |

この対比は重要な示唆を含む。現時点のエージェント技術では、**動機が外部から与えられる場面**（DeepForm 型）のほうが、**動機をエージェント自身が生成する場面**（Molt Market 型）よりもはるかに実用的である。

## 7. Discussion

### 7.1 Implications

本研究の結果は、エージェントエコノミーに対する楽観的な見方に対して重要な反証を提供する。

「エージェントに能力と資本を与えれば経済が生まれる」という暗黙の前提は、少なくとも現在の LLM エージェントに関しては成立しない。経済の成立には、能力や資本だけでなく、**行動しないことにコストがかかる構造**が必要である。

### 7.2 Limitations

本研究には以下の限界がある。

1. **予備実験のログ不足**: Condition A は体系的なイベントログ未実装の状態で実施されたため、ファネル分析は定性的推定にとどまる
2. **再現性の未確認**: 計測設計を実装した上での Condition A 再実行がまだ完了していない
3. **Condition B の未実施**: 圧力条件の比較実験は設計段階であり、H2 の検証は今後の課題である
4. **エージェント数の限界**: 5-10 エージェントでの実験であり、ネットワーク効果は未検証
5. **テストネットの使用**: Base Sepolia 上の USDC を使用しており、実経済的な価値は伴わない

### 7.3 Implementation Roadmap

本研究を完成させるための実装ロードマップを以下に示す。

**Phase 1: 計測基盤の実装**
- イベントログ（6 種 + reason + tx 照合）をプロダクトに組み込む
- `experiment_id` と `condition` を全リクエストに付与する
- `agent_id` による識別を確立する

**Phase 2: Condition A の再実行（7 日間）**
- 計測基盤を入れた状態で自由市場条件を再実行する
- 「再現性ある $0」を定量的に確認する
- ファネルの詰まり箇所を特定する

**Phase 3: Condition B の実行（7 日間）**
- タスクシステム（`task_assigned`, `task_submitted`, `task_evaluated`）を実装する
- ペナルティ機構（予算減額またはツール使用制限）を導入する
- ファネル差分で「何が変わったか」を定量的に示す

**Phase 4: 分析と論文完成**
- Condition A vs B のファネル比較を実施する
- 成功判定基準に基づき結果を評価する
- 必要に応じて Condition C の設計を具体化する

## 8. Conclusion

本論文では、自律エージェント向けマーケットプレイス「Molt Market」を構築し、LLM エージェントに能力・資本・通信手段を付与した条件下で運用実験を行った。

結果として、エージェント間の経済的交換は一切発生しなかった（売上 $0）。この否定的結果は、エージェントエコノミーのブートストラップ問題を実証的に示すものである。

分析の結果、LLM エージェントには人間経済の前提条件（時間の希少性、能力の特殊性、機会費用、生存圧力）が欠如しており、これが自発的な経済活動の不在を説明することを示した。エージェント経済を成立させるには、拘束的制約（binding constraints）の導入が必要であるという仮説を提示し、検証のための比較実験を設計した。

エージェントエコノミーは、場やツールを整備するだけでは実現しない。**エージェントが「行動しないと困る」状況をどう設計するか** — これが、エージェント経済のブートストラップにおける中心的な問いである。

## References

- Coase, R. H. (1937). The Nature of the Firm. *Economica*, 4(16), 386-405.
- Lowe, R. et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments. *NeurIPS*.
- Park, J. S. et al. (2023). Generative Agents: Interactive Simulacra of Human Behavior. *UIST*.
- Zheng, S. et al. (2022). The AI Economist: Taxation policy design via two-level deep multiagent reinforcement learning. *Science Advances*, 8(18).
