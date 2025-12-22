---
layout: ../../layouts/LayoutBlogPost.astro
title: "SlitherにClaude統合を実装してPRを出した - Claude Code MAXでAPIコストゼロのスマートコントラクト脆弱性分析"
description: "Slitherの--codexオプションがOpenAI APIを必要とする問題に対し、Claude Code MAXのOAuthトークンを活用してAPIコストなしでAI脆弱性分析を行える機能を実装し、実際にPull Requestを出した話"
pubDate: 2024-12-22
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

## 実際に動作確認

テスト用のコントラクトで動作確認を行った。意図的に脆弱性を含むコントラクトを用意した。

```solidity
contract ClaudeTest {
    mapping(address => uint256) public balances;
    address public owner;

    // Reentrancy vulnerability
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;  // State change after external call
    }

    // Missing access control
    function setOwner(address newOwner) external {
        owner = newOwner;
    }
}
```

実行結果は以下の通り。

```bash
$ slither tests/e2e/detectors/test_data/claude/0.8.0/claude_test.sol --detect claude --claude-use-code

INFO:Slither:Claude: Using model 'sonnet'
INFO:Slither:Claude: Analyzing 1 contract(s)...
INFO:Slither:Claude: [1/1] Found potential vulnerability in ClaudeTest
```

Claude は以下の脆弱性を検出した。

1. **Reentrancy Vulnerability (CRITICAL)** - 外部呼び出し後に状態変更
2. **Missing Access Control (CRITICAL)** - `setOwner()`にアクセス制御なし
3. その他、Missing Events、Zero Address Validation など

## Pull Request を提出

CONTRIBUTING.md のガイドラインに従って、実際に PR を出した。

### 準備したもの

| 項目 | 状態 |
|------|------|
| `dev`ブランチから分岐 | ✅ |
| ユニットテスト (10件) | ✅ |
| ドキュメント更新 | ✅ |
| Lint (10.00/10) | ✅ |
| 動作確認 | ✅ |

### E2Eテストについて

CONTRIBUTING.md では新しい detector には e2e テストが必要とされている。しかし、Claude detector は外部 API を呼び出すため、以下の理由で省略した。

- **非決定的な出力** - 毎回結果が変わる可能性
- **CI 環境での認証** - API キーが必要

既存の Codex detector も同じ理由で e2e テストがない前例があったため、これに倣った。

### 提出したPR

**[PR #2842: feat: add Claude integration as alternative to OpenAI Codex](https://github.com/crytic/slither/pull/2842)**

```
## Summary

Add a new detector that uses Claude (via Claude Code CLI or Anthropic API)
to analyze Solidity smart contracts for vulnerabilities.

- Claude Code CLI integration (free for MAX subscribers)
- Anthropic API fallback for programmatic access
- Configurable model selection (opus, sonnet, haiku)
- Per-contract and all-contracts analysis modes
- Optional logging of Claude's analysis

## Test plan

- [x] Unit tests pass (10 tests)
- [x] Lint passes (10.00/10)
- [x] Manual testing: detector finds reentrancy and access control issues

Note: E2E tests are not included as this detector requires external API calls
which are non-deterministic and need credentials. This is consistent with
the existing Codex detector which also lacks e2e tests.
```

## まとめ

- Slither の`--codex`は OpenAI API が必要でコストがかかる
- Shannon と同じ仕組みで`CLAUDE_CODE_OAUTH_TOKEN`を使えば、Claude Code MAX 契約者は API コストなしで AI 分析が可能
- **実際に PR #2842 として Trail of Bits に提出した**

Claude Code MAX を契約している人にとっては、追加コストなしで AI セキュリティ分析ができるのは大きなメリットだ。

PR がマージされるかはレビュー次第だが、OSS へのコントリビューションとして第一歩を踏み出せた。

## 関連リンク

- [Slither (Trail of Bits)](https://github.com/crytic/slither)
- [Shannon (Keygraph)](https://github.com/KeygraphHQ/shannon)
- [PR #2842](https://github.com/crytic/slither/pull/2842)
- [実装ブランチ](https://github.com/susumutomita/slither/tree/feat/claude-detector)
