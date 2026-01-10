---
title: "ZeroKey Treasury を実装した - AIエージェント時代のトランザクションファイアウォール"
description: "Claude APIを使ってブロックチェーントランザクションをリアルタイムで分析し、リスクに応じて承認・拒否するAI駆動のセキュリティレイヤーを実装した"
pubDate: 2025-01-10
category: "blockchain,ai"
---

## 作ったもの

**ZeroKey Treasury** - AI エージェントや自律決済プロトコル（x402 など）が暗号資産を送金する際に、トランザクションをリアルタイムで分析し、リスクに応じて承認・拒否するセキュリティレイヤー。

GitHub: [susumutomita/ZeroKey-Treasury](https://github.com/susumutomita/ZeroKey-Treasury)

## なぜ作ったか

### AIエージェント時代の課題

Claude Code のような AI エージェントが人間の介入なしに金融トランザクションを実行できる時代が来ている。x402 プロトコルでは、AI が自律的に支払いを行うことが可能になる。

しかし、これには重大なリスクがある。

1. **プロンプトインジェクション攻撃** - 悪意のあるプロンプトで AI を騙し、不正に送金させる
2. **設定ミス** - パラメータの誤りで意図しない大規模トランザクションが発生
3. **ポリシー違反** - 組織の支出ルールに違反するトランザクション

### 従来のプロキシとの違い

| 観点 | 従来のプロキシ | ZeroKey Treasury |
|------|---------------|------------------|
| 理解 | 生データの中継 | AIによるセマンティック分析 |
| ポリシー | なし | 明示的 + 暗黙的ルール |
| 強制 | パススルー | オンチェインガードコントラクト |
| 透明性 | なし | 完全な説明可能性 |

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                      リクエストソース                            │
│            (AIエージェント / 人間 / x402プロトコル)              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AIポリシーエンジン                            │
│  • トランザクション意図のセマンティック分析                      │
│  • リスク分類 (LOW/MEDIUM/HIGH)                                 │
│  • ポリシーマッチング（支出制限、許可リスト）                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   オンチェーンガード                             │
│               (ZeroKeyGuard.sol)                                │
│  • 承認決定を不変に記録                                          │
│  • 未承認トランザクションをリバート                              │
│  • 監査イベントを発行                                            │
└─────────────────────────────────────────────────────────────────┘
```

## 技術スタック

### モノレポ構成

```
packages/
├── contracts/    # Solidityスマートコントラクト（Foundry）
├── backend/      # オフチェーンAI分析サービス（Hono + Claude API）
├── frontend/     # ダッシュボード（Next.js 15 + React 19）
└── shared/       # 共有型と定数
```

### 主要技術

| レイヤー | 技術 |
|---------|------|
| スマートコントラクト | Solidity 0.8.24, Foundry |
| バックエンド | Hono, TypeScript, Zod, SQLite |
| フロントエンド | Next.js 15, React 19, TailwindCSS |
| Web3 | Wagmi, Viem |
| AI | Anthropic Claude API |

## 実装のポイント

### 1. フェイルセーフ設計

LLM 分析が失敗した場合、デフォルトで HIGH_RISK としてトランザクションをブロックする。

```typescript
// analyzer.ts
catch (error) {
  return {
    riskLevel: 3,          // HIGH_RISK
    classification: "unknown",
    approved: false,       // デフォルトでブロック
    reason: "Analysis failed - transaction blocked as precaution",
  };
}
```

### 2. Zodによる厳格なバリデーション

API の入力と LLM の出力の両方を Zod スキーマで検証する。

```typescript
// LLMレスポンスのバリデーション
const analysisResponseSchema = z.object({
  riskLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  classification: z.string(),
  approved: z.boolean(),
  reason: z.string(),
  warnings: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});
```

### 3. オンチェイン強制

ZeroKeyGuard コントラクトが承認決定を不変に記録し、未承認トランザクションをリバートする。

```solidity
// ZeroKeyGuard.sol
function submitDecision(
    bytes32 txHash,
    bool approved,
    uint256 riskLevel,
    string calldata reason
) external onlyPolicyOracle {
    if (approved) {
        approvedTransactions[txHash] = true;
        emit TransactionApproved(txHash, riskLevel, reason);
    } else {
        emit TransactionRejected(txHash, riskLevel, reason);
    }
}

function validateTransaction(bytes32 txHash) external view {
    if (!approvedTransactions[txHash]) {
        revert TransactionNotApproved();
    }
}
```

### 4. マルチチェイン対応

Ethereum、Base、Optimism（メインネット＆テストネット）をサポート。

```typescript
const CHAIN_CONFIG: Record<number, { chain: Chain; rpcUrl?: string }> = {
  1: { chain: mainnet },
  8453: { chain: base },
  84532: { chain: baseSepolia },
  10: { chain: optimism },
  11155420: { chain: optimismSepolia },
};
```

## 動かし方

### 1. 環境変数を設定

```bash
cp .env.example .env
```

最低限必要な設定は以下の通り。

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Claude API用
```

### 2. 依存関係をインストール

```bash
pnpm install
```

### 3. 起動

```bash
pnpm dev:all
```

### 4. アクセス

| サービス | URL |
|---------|-----|
| ダッシュボード | http://localhost:3000/dashboard |
| バックエンドAPI | http://localhost:3001 |

## API使用例

### トランザクション分析

```bash
curl -X POST http://localhost:3001/api/analyze/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": 8453,
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0x0987654321098765432109876543210987654321",
    "value": "1000000000000000000"
  }'
```

レスポンス例を以下に示す。

```json
{
  "riskLevel": 1,
  "classification": "transfer",
  "approved": true,
  "reason": "Standard ETH transfer to known address with reasonable amount",
  "warnings": [],
  "recommendations": [],
  "timestamp": "2025-01-10T12:00:00.000Z",
  "txHash": "0x..."
}
```

## 今後の展開

1. **Lit Protocol PKP統合** - 閾値暗号による分散鍵署名
2. **x402プロトコル統合** - 自律決済の標準対応
3. **マルチチェインインデクサ** - クロスチェイン履歴の統合分析

## 関連リンク

- [GitHub: ZeroKey-Treasury](https://github.com/susumutomita/ZeroKey-Treasury)
- [ZeroKey Paper](/blog/zerokey-paper) - 理論的背景の詳細
- [ETHGlobal Bangkok 2024](https://ethglobal.com/events/bangkok) - 本プロジェクトのきっかけとなったハッカソン
