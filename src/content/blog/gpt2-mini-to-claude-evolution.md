---
title: "自作GPT-2 miniを動かして気づいた - これがClaudeのご先祖様"
description: "400行のPythonコードで実装したGPT-2 miniが文章を生成する瞬間、現代のLLMとの繋がりを実感した"
pubDate: 2026-01-07
category: "engineering"
---

## 動いた

[前回の記事](/blog/gpt2-mini-transformer-learning)で GPT-2 mini を自作した。今回は実際に動かしてみた。

```bash
python train_gpt2_mini.py --steps 1000 --save model.pt
```

```
Device: mps (Apple Silicon)
Vocab size: 65, Block size: 256
Model parameters: 534,593

Step 0: loss=4.1742
Step 100: loss=2.1834
...
Step 1000: loss=1.2156

Checkpoint saved to model.pt
```

Loss が 4.17 → 1.21 に下がった。学習している。

生成してみる。

```bash
python train_gpt2_mini.py --load model.pt --generate --prompt "吾輩は"
```

```
吾輩は猫である。名前はまだ無い。
どこで生れたかとんと見当がつかぬ。
```

**動いた。**

たった 50 万パラメータの小さなモデルが、文脈を理解して文章を続けている。

## これは本当に GPT-2 なのか

ふと疑問が湧いた。本家 GPT-2 と比較してみる。

| 項目 | 自作 GPT-2 mini | 本家 GPT-2 (small) |
|------|-----------------|-------------------|
| 層数 | 4 | 12 |
| ヘッド数 | 4 | 12 |
| 埋め込み次元 | 128 | 768 |
| パラメータ数 | 約 50 万 | 約 1.2 億 |
| 学習データ | 数 KB | 40 GB |
| トークナイザ | 文字単位 | BPE |

パラメータ数は 240 分の 1。学習データは比較にならない。

しかし、**アーキテクチャは同じ**だ。

- Decoder-only Transformer
- Causal Self-Attention（未来を見ないマスク）
- Pre-LN（LayerNorm を前に配置）
- Residual 接続
- Weight Tying（入出力の重み共有）

つまり「本家 GPT-2 の設計図で作った超小型版」だ。

## データを増やしていくと Claude になるのか

次の疑問。このモデルのデータとパラメータを増やしていったら、Claude みたいになるのか。

答えは**半分正解、半分違う**。

### 正解の部分：スケーリング則

LLM の性能は、以下の 3 つを増やすと向上する。

```
性能 = f(パラメータ数, データ量, 計算量)
```

| モデル | パラメータ数 | データ量 |
|-------|-------------|---------|
| GPT-2 | 1.5B | 40 GB |
| GPT-3 | 175B | 570 GB |
| GPT-4 | 非公開 | 非公開 |

これが「スケーリング則」。GPT-2 → GPT-3 → GPT-4 の進化の原動力だ。

### 違う部分：学習方法の進化

単純にスケールアップしただけでは Claude のような「有用で安全なアシスタント」にはならない。

**GPT-2 の学習**

```
大量のテキスト → 次トークン予測 → 完成
```

問題：有害な内容も学習する。指示に従う能力が低い。

**Claude の学習**

```
Step 1: 事前学習（GPT-2 と同じ）
        大量のテキスト → 次トークン予測

Step 2: RLHF（人間のフィードバックから学習）
        人間が「良い回答」と「悪い回答」を評価
        → モデルが「良い回答」を出すように調整

Step 3: Constitutional AI
        「有用・安全・正直」などの原則を組み込む
        → モデル自身が自分の出力を評価・改善
```

### RLHF とは

Reinforcement Learning from Human Feedback。人間のフィードバックから学習する手法だ。

```
1. 質問を用意
   「東京タワーの高さは」

2. モデルが複数の回答を生成
   A: 「333メートルです」
   B: 「とても高いです」
   C: 「知りません」

3. 人間がランク付け
   A > B > C

4. このランク付けを学習
   → 「具体的で正確な回答」が良いと学ぶ
```

これを大量に繰り返す。人間が好む回答を出せるようになる。

## LLM の進化の系譜

```
2017  Transformer (Google)
      「Attention Is All You Need」論文
      ↓
2018  GPT-1 (OpenAI)
      Decoder-only に特化
      ↓
2019  GPT-2 (OpenAI)
      スケールアップ（1.5B パラメータ）
      ↓
2020  GPT-3 (OpenAI)
      175B パラメータ、Few-shot 学習
      ↓
      ├──────────────────────┐
      ↓                      ↓
2022  ChatGPT            Anthropic 設立
      RLHF 適用           元 OpenAI メンバー
      ↓                      ↓
2023  GPT-4               Claude
      (OpenAI)            (Anthropic)
      ↓                      ↓
2024  GPT-4o              Claude 3.5
```

Anthropic は OpenAI の元メンバーが設立した。技術的な DNA は繋がっている。

## 自作して気づいたこと

### Residual は必須

`--disable_residual` を試すと、Loss がほぼ下がらなかった。

| 設定 | 100step 後 Loss |
|------|----------------|
| Baseline | 2.3 |
| Residual OFF | 4.15 |

深いネットワークでは、勾配が直接流れる経路がないと学習が成立しない。

### Attention がないと文脈を捉えられない

`--disable_attention` を試すと、学習は進むが生成の質が落ちた。

```
Attention ON:
入力: 「吾輩は」
出力: 「吾輩は猫である。名前はまだ無い。」

Attention OFF:
入力: 「吾輩は」
出力: 「吾輩はたたたたたた...」
```

MLP だけでは離れた単語間の関係を捉えられない。

### この構造が Claude の中にもある

自分で実装した Attention、Residual、LayerNorm は、Claude の中にも入っている。「壊すと学習できない」という実験結果は、Claude にも当てはまるはずだ。

## ご先祖様を自分で作る価値

ChatGPT や Claude を使うだけなら、中身を知らなくても問題ない。

しかし、自分で実装してみると、**「なぜこの設計なのか」が腹落ちする**。

- なぜ Attention が必要か → 離れた単語の関係を捉えるため
- なぜ Residual が必要か → 深いネットワークで勾配を流すため
- なぜ Pre-LN なのか → 学習を安定させるため

これらは論文を読むだけでは実感できない。壊して、観測して、初めて理解できる。

### この知識が活きる場面

- LLM のファインチューニング
- プロンプトエンジニアリングで「なぜ動くのか」を理解したいとき
- LLM の限界を理解して適切に使いたいとき
- 新しい LLM 論文を読むとき

## まとめ

- GPT の本質は「次のトークンを予測する」だけ
- Transformer の各部品には明確な役割がある（Attention: どこを見るか、MLP: 何を抽出するか、Residual: 勾配を流す）
- Claude は GPT の子孫だが、RLHF と Constitutional AI で進化している
- 壊して観測することで、設計の意図が分かる

## 試してみる

コードは [GitHub](https://github.com/susumutomita/GPT-2mini) で公開している。

```bash
# リポジトリをクローン
git clone https://github.com/susumutomita/GPT-2mini.git
cd GPT-2mini

# 学習（約5分）
python train_gpt2_mini.py --steps 1000 --save model.pt

# 対話モード（quit で終了）
python train_gpt2_mini.py --load model.pt --interactive

# 実験: Residual を無効化
python train_gpt2_mini.py --disable_residual 1 --steps 100
```

自分の手で LLM のご先祖様を動かす体験は、論文を 100 本読むより価値がある。
