---
layout: ../../layouts/LayoutBlogPost.astro
title: "SlitherにClaude統合を実装した - Claude Code MAXでAPIコストゼロのスマートコントラクト脆弱性分析"
description: "Slitherの--codexオプションがOpenAI APIを必要とする問題に対し、Claude Code MAXのOAuthトークンを活用してAPIコストなしでAI脆弱性分析を行える機能を実装した話"
pubDate: 2024-12-21
category: "blockchain"
---

## きっかけ

Slither でスマートコントラクトの静的解析をしていて、`--codex`オプションを試してみた。

```bash
$ slither src/MynaWallet.sol --codex
```

すると、こんなメッセージが大量に出力された。

```
INFO:Slither:Please provide an Open API Key in OPENAI_API_KEY (https://beta.openai.com/account/api-keys)
INFO:Slither:Please provide an Open API Key in OPENAI_API_KEY (https://beta.openai.com/account/api-keys)
...
```

`--codex`オプションは OpenAI API を使って AI で脆弱性を分析する機能だが、当然ながら API キーが必要で、使うたびにコストがかかる。

## Shannonの仕組みに着目

ここで思い出したのが、[Shannon](https://github.com/KeygraphHQ/shannon)という AI ペンテスターツールだ。

Shannon は`CLAUDE_CODE_OAUTH_TOKEN`を使うことで、Claude Code MAX サブスクリプションのトークンを活用している。

```bash
docker run --rm -it \
  -e CLAUDE_CODE_OAUTH_TOKEN="$CLAUDE_CODE_OAUTH_TOKEN" \
  shannon:latest \
  "https://your-app.com/" \
  "/app/repos/your-app"
```

これなら、Claude Code MAX 契約者（$100-200/月）は追加の API コストなしで AI 分析が使える。

## 実装

この仕組みを Slither にも適用できないかと考え、実装してみた。

### 変更ファイル

1. **`slither/utils/claude.py`** - CLI オプションと API/CLI の抽象化
2. **`slither/detectors/functions/claude.py`** - Claude ベースの脆弱性検出器
3. **`slither/utils/command_line.py`** - デフォルト設定の追加
4. **`slither/slither.py`** - Claude 関連設定の追加
5. **`slither/__main__.py`** - CLI パーサーの初期化
6. **`slither/detectors/all_detectors.py`** - 検出器の登録

### 使い方

```bash
# Anthropic APIを使う場合
export ANTHROPIC_API_KEY="your-key"
slither . --claude

# Claude Code MAX（APIコストなし）を使う場合
export CLAUDE_CODE_OAUTH_TOKEN="your-token"
slither . --claude --claude-use-code
```

### オプション一覧

```
Claude (https://www.anthropic.com/claude):
  --claude              Enable Claude (requires ANTHROPIC_API_KEY or
                        CLAUDE_CODE_OAUTH_TOKEN)
  --claude-log          Log Claude queries (in crytic_export/claude/)
  --claude-contracts    Comma separated list of contracts to submit to Claude
  --claude-model        Name of the Claude model to use
  --claude-max-tokens   Maximum amount of tokens to use on the response
  --claude-use-code     Use Claude Code CLI instead of API (no API cost for MAX)
```

## コントリビューションの可能性

この実装は[susumutomita/slither](https://github.com/susumutomita/slither/tree/feat/claude-integration)にある。

Trail of Bits（Slither の開発元）への PR として出せる可能性がある。

特に以下の点がアピールポイントになる。

1. **代替 LLM プロバイダー** - OpenAI 依存からの脱却
2. **コスト効率** - MAX 契約者は追加コストなし
3. **Claude の強み** - コード解析での Claude 評価が高い

## まとめ

- Slither の`--codex`は OpenAI API が必要でコストがかかる
- Shannon と同じ仕組みで`CLAUDE_CODE_OAUTH_TOKEN`を使えば、Claude Code MAX 契約者は API コストなしで AI 分析が可能
- 実装は fork で完成、upstream PR の検討余地あり

Claude Code MAX を契約している人にとっては、追加コストなしで AI セキュリティ分析ができるのは大きなメリットだ。

## 関連リンク

- [Slither (Trail of Bits)](https://github.com/crytic/slither)
- [Shannon (Keygraph)](https://github.com/KeygraphHQ/shannon)
- [実装ブランチ](https://github.com/susumutomita/slither/tree/feat/claude-integration)
