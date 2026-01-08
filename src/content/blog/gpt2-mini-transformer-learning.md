---
title: "GPT-2 miniを自作して学ぶTransformerの仕組み - 壊して観測して理解する"
description: "nn.Transformerを使わずにAttention、MLP、LayerNorm、Residualを自前で実装し、各コンポーネントを無効化する実験を通じてTransformerがなぜ動くのかを理解する"
pubDate: 2026-01-07
category: "engineering"
---

## なぜ GPT-2 mini を自作したのか

LLM（大規模言語モデル）が話題だが、「なぜ Transformer は学習できるのか」「なぜあの構造なのか」を腹落ちさせたかった。

論文を読むだけでは理解が浅い。実際に手を動かして、**壊して観測して理解する**アプローチを取ることにした。

## 実装方針

- `nn.Transformer` は使わない
- Attention / MLP / LayerNorm / Residual を自前で組む
- 実験スイッチで各コンポーネントを無効化できるようにする
- Mac（MPS）で動作確認

コード全体は [GitHub リポジトリ](https://github.com/susumutomita/GPT-2mini) で公開している。

## Decoder-only Transformer の全体像

GPT 系のモデルは以下の流れで動作する。

```
入力トークン
    ↓
Token Embedding + Positional Embedding
    ↓
N回 Transformer Block を通す
    ↓
LayerNorm
    ↓
Linear（語彙サイズ）→ logits
    ↓
Cross Entropy Loss
```

各ステップを順番に見ていく。

## 1. Embedding（埋め込み）

トークン（文字や単語）を数値ベクトルに変換する。

```python
self.tok_emb = nn.Embedding(vocab_size, n_embd)  # トークン埋め込み
self.pos_emb = nn.Embedding(block_size, n_embd)  # 位置埋め込み
```

**なぜ位置埋め込みが必要か**

Attention は「どの位置のトークンか」という情報を持たない。RNN と違い、入力を並列処理するため、位置情報を明示的に与える必要がある。

## 2. Causal Self-Attention

Transformer の心臓部。「どのトークンに注目するか」を学習する。

```python
# Q, K, V を線形変換で作成
qkv = self.c_attn(x)
q, k, v = qkv.split(n_embd, dim=2)

# スケールド内積
att = (q @ k.transpose(-2, -1)) * (1.0 / math.sqrt(head_dim))

# Causal mask（未来を見ない）
att = att.masked_fill(causal_mask == 0, float("-inf"))
att = F.softmax(att, dim=-1)

# 重み付き和
y = att @ v
```

**Causal mask とは**

GPT は次のトークンを予測するタスクなので、未来のトークンを見てはいけない。下三角行列でマスクすることで、各位置は自分より前のトークンだけを参照できる。

```
位置 0: [1, 0, 0, 0]  → 自分だけ見える
位置 1: [1, 1, 0, 0]  → 0と1が見える
位置 2: [1, 1, 1, 0]  → 0,1,2が見える
位置 3: [1, 1, 1, 1]  → すべて見える
```

## 3. MLP（Feed-Forward Network）

位置ごとの非線形変換。Attention で「どこを見るか」を決めた後、「何を抽出するか」を学習する。

```python
class MLP(nn.Module):
    def __init__(self, config):
        self.c_fc = nn.Linear(n_embd, 4 * n_embd)   # 拡張
        self.gelu = nn.GELU()                        # 活性化
        self.c_proj = nn.Linear(4 * n_embd, n_embd) # 縮小
```

隠れ層を 4 倍に拡張するのは GPT-2 の設計に従った。GELU は ReLU より滑らかな活性化関数。

## 4. Residual 接続

入力を出力に加算する。

```python
x = x + self.attn(self.ln1(x))  # Attention + Residual
x = x + self.mlp(self.ln2(x))   # MLP + Residual
```

**なぜ必要か**

深いネットワークでは勾配が消失しやすい。Residual 接続は「情報の高速道路」として機能し、勾配が直接流れる経路を提供する。

## 5. LayerNorm の位置（Pre-LN vs Post-LN）

**Pre-LN（現代の標準）**

```
x → LayerNorm → Sublayer → +Residual
```

**Post-LN（オリジナル Transformer）**

```
x → Sublayer → +Residual → LayerNorm
```

Pre-LN は勾配が安定しやすく、学習率に対してロバスト。

## 実験：壊して観測する

各コンポーネントを無効化して、何が起きるか観測した。

### 実験 1: Residual OFF

```bash
python train_gpt2_mini.py --disable_residual 1 --steps 30
```

**結果**

| 設定 | 30step 後 Loss |
|------|---------------|
| Baseline | 2.3 |
| Residual OFF | 4.15 |

**考察**

Loss がほぼ下がらない。情報が深い層に流れず、学習が成立しない。

### 実験 2: Post-LN

```bash
python train_gpt2_mini.py --ln_style post --steps 30
```

**結果**

| 設定 | 30step 後 Loss |
|------|---------------|
| Pre-LN | 2.3 |
| Post-LN | 3.64 |

**考察**

学習は進むが遅い。初期の勾配分布が不安定で、収束に時間がかかる。

### 実験 3: Attention OFF（MLP-only）

```bash
python train_gpt2_mini.py --disable_attention 1 --steps 30
```

**結果**

| 設定 | 30step 後 Loss |
|------|---------------|
| Baseline | 2.3 |
| Attention OFF | 2.78 |

**考察**

Loss は下がるが、生成テキストの文脈依存が弱い。MLP は位置ごとの変換しかできないため、離れたトークン間の依存関係を捉えられない。

## 学んだこと

### 1. Residual は必須

深いネットワークで学習を成立させるには、勾配が直接流れる経路が必要。Residual なしでは 4 層程度でも学習が壊れる。

### 2. LayerNorm の位置は重要

Pre-LN は Post-LN より安定。現代の LLM が Pre-LN を採用している理由が体感できた。

### 3. Attention の役割

「位置をまたぐ情報の統合」が Attention の本質。MLP だけでは文脈を捉えられない。逆に言えば、短い依存関係なら MLP でも学習できる。

### 4. 壊して学ぶ価値

論文を読むだけでは「なぜその設計なのか」がわからない。実際に壊してみることで、各コンポーネントの必要性が腹落ちする。

## 次のステップ

- Attention entropy のログ化（どれだけ鋭く見ているか）
- 層別の grad_norm 可視化
- BPE tokenizer との比較

コードは [GitHub](https://github.com/susumutomita/GPT-2mini) で公開している。実験を通じて Transformer の理解を深めたい方はぜひ試してほしい。
