---
title: "ZeroKey: A Distributed Execution Model Separating Instruction, Execution, and Accountability in Blockchain Systems"
description: "秘密鍵管理の改善ではなく、指示・実行・責任を分離する新しい分散実行モデルの提案"
pubDate: 2025-12-30
category: "blockchain,research"
---

# ZeroKey: A Distributed Execution Model Separating Instruction, Execution, and Accountability in Blockchain Systems

**Author**: Susumu Tomita

## Abstract

現在のブロックチェインシステムにおいて、スマートコントラクトのデプロイや資産移動といった重要な操作は、秘密鍵による署名を通じて実行される。この設計では、指示・実行・責任が単一の秘密鍵に強く結び付けられており、鍵の漏洩や誤操作が不可逆な結果をもたらす。本論文では、この構造的問題に対する解として ZeroKey モデルを提案する。ZeroKey は、指示（Instruction）・実行（Execution）・責任（Accountability）を異なる主体および状態として分離する分散実行モデルである。本モデルを実装した ZeroKeyCI（キーレス CI/CD プラットフォーム）と ZeroKey Treasury（AI 駆動実行ガバナンスレイヤー）を通じて、従来の秘密鍵保持の前提を覆し、AI エージェントを安全にブロックチェーン実行プロセスへ統合する方法を示す。

## 1. Introduction

### 1.1 Problem Statement

現在のブロックチェインシステムにおいて、スマートコントラクトのデプロイや資産移動といった重要な操作は、秘密鍵による署名を通じて実行される。この設計では、**指示（何を実行するか）・実行（実際の処理）・責任（結果への帰属）**が、単一の秘密鍵、あるいは少数の鍵集合に強く結び付けられている。

この結合は、システムとしては単純である一方、実運用において複数の問題を引き起こす。第一に、人間が秘密鍵を長期間安全に管理し続けることは現実的に困難である。鍵の漏洩や誤操作は不可逆な結果をもたらし、ブロックチェイン技術の利用を高度な専門家に限定する要因となっている。第二に、業務自動化や運用効率化のために AI エージェントを導入する場合、実行権限を直接 AI に付与することは、安全性および責任の所在の観点から大きなリスクを伴う。

既存の解決策として、マルチシグネチャ、セッションキー、Account Abstraction などの手法が提案されているが、これらはいずれも「秘密鍵をどのように安全に扱うか」という枠組みの中で問題を解決しようとするものである。すなわち、**秘密鍵を人間またはエージェントが保持する前提自体は維持されたまま**であり、指示・実行・責任の結合という構造的問題は解消されていない。

本研究では、この前提そのものを問題として捉える。すなわち、「なぜ実行のために、人間や AI が秘密鍵を保持しなければならないのか」「なぜ署名は即座に実行を意味するのか」という点を問い直す。本論文が対象とする問題は、鍵管理の手法や UX の改善ではなく、**実行モデルそのものの再設計**である。

特に本研究では、以下の点を未解決の問題として位置付ける：

- 指示と実行が分離されていないことにより、誤操作や暴走の影響が直接的かつ不可逆に現れる点
- 実行結果に対する責任が、人や組織ではなく「どの状態が成立したか」という観点で定義されていない点
- AI エージェントを安全に実行プロセスへ組み込むための、計算モデルレベルの整理が不足している点

これらの問題を解決するためには、秘密鍵管理の改善ではなく、**指示・実行・責任を分離し、それぞれを異なる主体および状態として扱う新しい分散実行モデル**が必要である。

### 1.2 Contributions

本論文の主要な貢献は以下の通りである：

1. **ZeroKey モデルの提案**: 指示・実行・責任を分離する新しい分散実行モデルの形式的定義
2. **ZeroKeyCI の実装**: 秘密鍵を保持しない CI/CD プラットフォームの設計と実装
3. **ZeroKey Treasury の実装**: AI 駆動の実行ガバナンスレイヤーの設計と実装
4. **評価**: 従来手法との比較によるセキュリティおよび効率性の定量的評価

## 2. Background and Related Work

### 2.1 Traditional Key Management Approaches

ブロックチェインにおける秘密鍵管理は、システムセキュリティの根幹をなす。従来のアプローチは以下のように分類される。

#### Multi-signature Wallets

マルチシグネチャ（マルチシグ）は、複数の秘密鍵による署名を要求することで、単一障害点を排除する手法である。Gnosis Safe に代表されるスマートコントラクトウォレットは、m-of-n 署名スキームを実装し、企業や DAO における資産管理の標準となっている。しかし、マルチシグは「誰が署名するか」を分散させるものであり、各署名者が秘密鍵を保持する前提は変わらない。

#### セッション Keys

セッションキーは、一時的かつ制限された権限を持つ鍵を生成し、特定の操作に使用する手法である。これにより、マスタキーの露出リスクを低減できる。しかし、セッションキー自体も秘密鍵であり、その管理と revocation のメカニズムが必要となる。

#### Account Abstraction (ERC-4337)

Account Abstraction は、トランザクションの署名と実行を抽象化し、任意の検証ロジックを許容する。これにより、ソーシャルリカバリやガスレストランザクションが可能となる。しかし、ERC-4337 は「どのように署名を検証するか」を柔軟にするものであり、「署名が必要である」という前提自体は維持される。

### 2.2 Limitations of Existing Approaches

既存のアプローチに共通する限界は、**秘密鍵の保持を前提とした問題解決**である点にある。

| アプローチ | 解決する問題 | 残存する問題 |
|-----------|-------------|-------------|
| マルチシグ | 単一障害点 | 各署名者の鍵管理 |
| セッションキー | マスタキー露出 | セッションキー自体の管理 |
| Account Abstraction | 署名検証の柔軟性 | 署名の必要性 |

これらはいずれも、「鍵をどう管理するか」という枠組みの中での改善であり、「なぜ鍵を保持しなければならないのか」という根本的な問いに答えていない。

### 2.3 AI Agents in Blockchain

AI エージェントのブロックチェイン統合は、自律的な金融操作を可能にする一方で、新たなリスクをもたらす。x402 プロトコルのような自律支払い標準は、ボットやサービスが人間の介入なしに送金を開始することを許容する。しかし、これは誤設定、詐欺、ポリシー違反のリスクを増大させる。

AI エージェントに秘密鍵を直接付与することは、以下の問題を引き起こす：

1. **暴走リスク**: AI の判断ミスや悪意ある操作が即座に不可逆な結果をもたらす
2. **責任の曖昧さ**: AI の行動に対する法的・組織的責任の所在が不明確
3. **監査困難性**: AI の意思決定プロセスの透明性確保が困難

## 3. The ZeroKey Model

### 3.1 Design Principles

ZeroKey モデルは、以下の設計原則に基づく。

**原則 1: 指示と実行の分離**

トランザクションの「提案」と「実行」を異なるフェーズとして扱う。提案者は実行権限を持たず、実行者は提案を生成しない。

**原則 2: 責任の状態化**

責任を「誰が署名したか」ではなく、「どの状態遷移が成立したか」として定義する。これにより、複数の主体による協調的な意思決定の監査が可能となる。

**原則 3: ゼロキー実行**

人間も AI エージェントも、直接的に秘密鍵を保持する必要がない。署名権限は、条件付きの分散鍵システムによって管理される。

### 3.2 Formal Model

ZeroKey モデルを以下のように形式化する。

**定義 1 (Instruction)**: 指示 $I$ は、実行したい操作の意図を表現するタプルである。

$$I = (sender, target, action, params, metadata)$$

ここで、$sender$ は指示の発行者、$target$ は対象コントラクト、$action$ は操作種別、$params$ はパラメータ、$metadata$ は追加情報である。

**定義 2 (Execution Context)**: 実行コンテキスト $E$ は、指示を実行するために必要な状態を表す。

$$E = (I, policies, riskAssessment, approvals)$$

**定義 3 (Accountability Record)**: 責任レコード $A$ は、実行結果とその監査情報を表す。

$$A = (E, txHash, outcome, explanation, タイムスタンプ)$$

**状態遷移**: ZeroKey モデルにおける状態遷移は以下の通りである。

```
Instruction → Validation → Approval → Execution → Accountability
    ↑              ↓           ↓          ↓            ↓
 (Human/AI)    (Policy)   (Multisig)   (PKP)      (Audit Log)
```

### 3.3 Role Separation

ZeroKey モデルでは、以下の役割が明確に分離される。

| 役割 | 責任 | 権限 |
|------|------|------|
| Proposer | 指示の生成 | なし（署名権限なし） |
| Validator | ポリシー検証 | 承認/拒否の判定 |
| Approver | 最終承認 | マルチシグ署名 |
| Executor | トランザクション実行 | 条件付き署名（PKP） |
| Auditor | 監査と説明 | 読み取りのみ |

## 4. System Architecture

ZeroKey モデルを実装するシステムは、ZeroKeyCI と ZeroKey Treasury の 2 つのコンポーネントから構成される。

### 4.1 ZeroKeyCI: Keyless CI/CD Platform

ZeroKeyCI は、GitHub Actions を通じてスマートコントラクトをデプロイする際に、秘密鍵を一切保存しない CI/CD プラットフォームである。

#### 4.1.1 Workflow

```
PR Merged → Tests Pass → OPA Validates → PKP Auto-Signs → Safe Executes
```

1. **PR マージ**: 開発者がコード変更をマージ
2. **テスト実行**: 自動テストによる検証（605+ テストケース）
3. **ポリシー検証**: Open Policy Agent によるセキュリティポリシーの強制
4. **PKP 署名**: Lit Protocol の分散鍵による条件付き署名
5. **Safe 実行**: Gnosis Safe マルチシグによる最終実行

#### 4.1.2 Deployment Modes

ZeroKeyCI は 2 つのデプロイモードを提供する。

**Manual Signing Mode（デフォルト）**:
CI が Safe マルチシグプロポーザルを生成し、オーナーが手動で承認する。

**PKP Automation Mode（オプション）**:
Lit Protocol の Programmable Key Pairs（PKP）による完全自動署名。閾値暗号により、秘密鍵が完全な形で存在することはない。

#### 4.1.3 Technology Stack

| コンポーネント | 技術 |
|---------------|------|
| コントラクトコンパイル | Hardhat |
| 分散鍵管理 | Lit Protocol PKPs |
| マルチシグ | Gnosis Safe SDK |
| ポリシー検証 | Open Policy Agent |
| サポートネットワーク | Ethereum, Polygon, Arbitrum, Optimism, Base（10 チェイン） |

### 4.2 ZeroKey Treasury: AI-Governed Execution Firewall

ZeroKey Treasury は、すべての支払いとトレジャリー操作に対して、統一された安全性とガバナンスを提供する AI 駆動の実行ファイアウォールである。

#### 4.2.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ZeroKey Treasury                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────┐   │
│   │   Agents    │───▶│  AI Policy       │───▶│  On-chain Guard     │   │
│   │   Humans    │    │  Engine          │    │  (ZeroKeyGuard.sol) │   │
│   │   x402      │    │  (Risk Analysis) │    │                     │   │
│   └─────────────┘    └──────────────────┘    └─────────────────────┘   │
│                              │                         │                │
│                              ▼                         ▼                │
│                    ┌──────────────────┐      ┌─────────────────────┐   │
│                    │  Explainability  │      │  Multi-chain        │   │
│                    │  & Audit Logs    │      │  Execution          │   │
│                    └──────────────────┘      └─────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Key Features

| 機能 | 説明 |
|------|------|
| AI セマンティック分析 | トランザクションの意図、関数シグネチャ、コントラクトメタデータを検査して操作を分類 |
| ポリシーエンジン | 明示的ルール（支出制限、KYC）と履歴からの暗黙的パターンをサポート |
| オンチェイン強制 | リスクに基づいてリバート、承認要求、自動許可を行うガードコントラクト |
| 実行ファイアウォール | すべての支払いはチェインに到達する前にこのレイヤーを通過 |
| 説明可能性 | 自然言語による説明と不変の監査ログ |
| x402 サポート | 自律支払いプロトコルとの統合 |

#### 4.2.3 Technology Stack

| レイヤー | 技術 |
|---------|------|
| スマートコントラクト | Solidity 0.8.24, Foundry |
| バックエンド | Hono, TypeScript, Zod |
| フロントエンド | Next.js 15, React 19, TailwindCSS |
| Web3 | Wagmi, Viem, RainbowKit |
| テスト | Forge Test, Vitest |

## 5. Implementation

### 5.1 Smart Contracts

#### 5.1.1 ZeroKeyGuard.sol

ZeroKeyGuard は、トランザクションの実行前に検証を行うガードコントラクトである。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IZeroKeyGuard {
    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        uint8 operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures,
        address msgSender
    ) external view;

    function checkAfterExecution(bytes32 txHash, bool success) external;
}
```

ガードコントラクトは以下の検証を行う：

1. **リスクレベル判定**: AI ポリシーエンジンからのリスク評価を確認
2. **ポリシー準拠**: 明示的ルールとの整合性を検証
3. **承認状態**: 必要な承認が得られているかを確認

### 5.2 Backend Services

#### 5.2.1 Transaction Analysis API

```typescript
// POST /api/analyze/transaction
interface TransactionAnalysisRequest {
  chainId: number;
  from: string;
  to: string;
  value: string;
  data: string;
}

interface TransactionAnalysisResponse {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approved: boolean;
  reason: string;
  recommendations: string[];
}
```

AI ポリシーエンジンは、以下の観点からトランザクションを分析する：

1. **コントラクト分類**: 対象コントラクトの種類と信頼性
2. **関数シグネチャ解析**: 呼び出される関数の意図
3. **資産フロー追跡**: 資産の移動先と金額
4. **履歴パターン**: 過去の類似トランザクションとの比較

### 5.3 Lit Protocol PKP Integration

Lit Protocol の Programmable Key Pairs（PKP）は、閾値暗号を用いた分散鍵システムである。

```typescript
// PKP 条件付き署名の例
const litNodeClient = new LitNodeClient({
  litNetwork: 'cayenne',
});

const pkpSign = await litNodeClient.pkpSign({
  pubKey: pkpPublicKey,
  toSign: messageToSign,
  authSig: authSignature,
  authMethods: [
    {
      authMethodType: 'webauthn',
      accessToken: webauthnCredential,
    },
  ],
});
```

PKP の特徴：

- **分散閾値暗号**: 秘密鍵が完全な形で存在しない
- **条件付き署名**: ポリシー条件を満たす場合のみ署名を生成
- **プログラマブル**: 署名条件をコードで定義可能

## 6. Evaluation

### 6.1 Security Analysis

#### 6.1.1 Attack Surface Comparison

| 攻撃ベクトル | 従来システム | ZeroKey |
|-------------|-------------|---------|
| GitHub アカウント侵害 | 資金流出可能 | プロポーザル生成のみ |
| CI/CD パイプライン侵害 | 秘密鍵露出 | 鍵なし |
| 単一署名者の鍵漏洩 | 即時資金流出 | Safe マルチシグで保護 |
| AI エージェントの暴走 | 直接実行可能 | ポリシーエンジンで阻止 |

**従来システム**: 1 つの侵害された GitHub アカウント（リポジトリアクセス付き）で資金流出が可能

**ZeroKey**: 2/3 以上の Safe オーナーのハードウェアウォレットが必要

#### 6.1.2 Threat Model

ZeroKey は以下の脅威に対して耐性を持つ：

1. **内部脅威**: 単一の内部者による不正操作
2. **外部侵害**: CI/CD インフラへの攻撃
3. **AI 暴走**: エージェントの意図しない動作
4. **ポリシー違反**: 組織規程に反する操作

### 6.2 Efficiency Analysis

#### 6.2.1 Deployment Time

| 項目 | 手動デプロイ | ZeroKeyCI |
|------|-------------|-----------|
| 総所要時間 | 35 分 | 3-4 分 |
| 高速化率 | - | 10 倍 |

#### 6.2.2 Gas Optimization

実際のシナリオ（ERC-721 デプロイ）：

| ネットワーク | ガス費用 |
|-------------|---------|
| Ethereum Mainnet | $180 |
| Polygon（ZeroKey 推奨） | $2.50 |
| 削減率 | 98.6% |

ZeroKey のガス分析機能により、最適なネットワークを自動推奨する。

### 6.3 Audit Trail

ZeroKey は完全な監査証跡を提供する：

```
PR → CI Logs → Policy Decision → Safe Proposal → On-chain Transaction
```

従来システムでは GitHub の監査ログのみに依存するが、ZeroKey は以下を記録する：

- ポリシー評価結果と理由
- AI のリスク判定プロセス
- 各承認者の署名タイムスタンプ
- オンチェイントランザクションハッシュ

## 7. Discussion

### 7.1 ZeroKey vs Traditional Proxies

ZeroKey はトランザクションのフローに介在するが、単なるプロキシではない。

| 観点 | 従来のプロキシ | ZeroKey Treasury |
|------|---------------|------------------|
| 理解 | 生データの中継 | 深いセマンティック分析 |
| ポリシー | なし | 明示的 + 暗黙的ルール |
| 強制 | パススルー | オンチェインガードコントラクト |
| 透明性 | なし | 完全な説明可能性 |

ZeroKey Treasury は、自律金融のための基盤的な**実行ガバナンスレイヤー**となる。これは、人間と AI エージェントの両方がマシンスピードで価値を移動する世界において、欠けていた安全層である。

### 7.2 Limitations

本研究には以下の制限がある：

1. **レイテンシ**: AI 分析とポリシー検証による追加遅延
2. **コスト**: ガードコントラクトの追加ガス消費
3. **複雑性**: システム全体の運用複雑性の増加
4. **依存性**: Lit Protocol、Safe 等の外部サービスへの依存

### 7.3 Future Work

今後の研究課題として以下を挙げる：

1. **マルチチェイン対応の拡充**: クロスチェイントランザクションへの対応
2. **AI モデルの改善**: より高精度なリスク判定
3. **形式検証**: ガードコントラクトの形式的安全性証明
4. **プライバシー保護**: ゼロ知識証明を用いた監査情報の秘匿化

## 8. Conclusion

本論文では、ブロックチェインにおける秘密鍵への過度な依存という構造的問題に対し、ZeroKey モデルを提案した。ZeroKey は、指示・実行・責任を分離する新しい分散実行モデルであり、以下の貢献を行った。

1. 秘密鍵を人間や AI が直接保持しない実行モデルの設計
2. ZeroKeyCI による CI/CD パイプラインのキーレス化
3. ZeroKey Treasury による AI 駆動の実行ガバナンス
4. 従来手法と比較した 10 倍の効率化と攻撃表面の大幅削減

ZeroKey は、自律金融の時代における安全な実行基盤として、ブロックチェイン技術の大衆化に貢献することが期待される。

## References

1. Buterin, V. et al. "ERC-4337: Account Abstraction Using Alt Mempool." Ethereum Improvement Proposals, 2021.

2. Gnosis. "Safe: Programmable Accounts." https://safe.global/

3. Lit Protocol. "Programmable Key Pairs." https://developer.litprotocol.com/

4. Open Policy Agent. "Policy-based control for cloud native environments." https://www.openpolicyagent.org/

5. ETHGlobal. "Bangkok 2024 Hackathon." https://ethglobal.com/events/bangkok

---

*This paper was developed as part of the ETHGlobal Bangkok 2024 hackathon.*
