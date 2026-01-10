---
title: "GPT-2 miniでスケーリング則を観測する - パラメータ数と性能の関係"
description: "自作のGPT-2 miniで複数のモデルサイズを学習し、パラメータ数とLossの関係（スケーリング則）を実験で確認する"
pubDate: 2026-01-10
category: "engineering"
---

## スケーリング則とは

2020 年の OpenAI 論文 "Scaling Laws for Neural Language Models" で、LLM の性能はパラメータ数、データ量、計算量のべき乗則に従うことが示された。

```
L ∝ N^(-α)
```

- L: Loss（低いほど良い）
- N: パラメータ数
- α: べき乗指数（Chinchilla 論文では約 0.076）

この法則を自作の GPT-2 mini で実際に観測してみた。

## 実験設定

### モデルサイズ

5 種類のモデルサイズを用意した。

| Name | n_layer | n_head | n_embd | Params |
|------|---------|--------|--------|--------|
| tiny | 2 | 2 | 64 | 344K |
| small | 4 | 4 | 128 | 1.28M |
| medium | 6 | 6 | 192 | 3.40M |
| base | 6 | 8 | 256 | 5.71M |
| large | 8 | 8 | 384 | 15.7M |

### 学習条件

- データ: 青空文庫の文学作品（881K 文字）
- トークナイザー: Character-level
- ステップ数: 2000
- バッチサイズ: 32
- コンテキスト長: 256
- 学習率: 3e-4（cosine decay with warmup）

## 実験結果

### Loss の推移

各モデルサイズで 2000 ステップ学習した結果。

| Model | Params | Val Loss | 学習時間 |
|-------|--------|----------|----------|
| tiny | 344K | 3.92 | 82秒 |
| small | 1.28M | 3.44 | 4.5分 |
| medium | 3.40M | 3.07 | 10分 |
| base | 5.71M | 2.86 | 15分 |
| large | 15.7M | 2.37 | 32分 |

パラメータ数が増えるほど、Loss が下がっている。

### べき乗則のフィッティング

log-log プロットで直線関係が見える。以下のグラフは、パラメータ数（横軸）と検証 Loss（縦軸）の関係を示している。

![スケーリング則のプロット](/images/scaling-law-plot.png)

フィッティングの結果は以下の通り。

```
L = 20.89 × N^(-0.129)
```

べき乗指数は 0.129。Chinchilla 論文の 0.076 より大きい。

## 考察

### なぜ指数が大きいのか

1. **データ量が少ない**: 881K 文字（約 1MB）は論文の実験（数百 GB）に比べて圧倒的に少ない。
2. **学習トークン数が少ない**: 2000 ステップ × 32 バッチ × 256 トークン ≈ 16M トークン。
3. **Character-level トークナイザー**: BPE と異なり、1 文字 = 1 トークンで効率が悪い。

スケーリング則は「十分な」データと計算量がある前提の法則。小規模実験では指数が大きくなる傾向がある。

### 学習の飽和

tiny モデル（344K params）は、このデータ量ではほぼ限界に達している。一方、large モデル（15.7M params）はまだ改善の余地がある。

これは「モデルサイズとデータ量のバランス」の重要性を示している。Chinchilla 論文が示したように、パラメータ数を増やすだけでなく、データ量も比例して増やす必要がある。

## 再現方法

実験を再現するには、以下のコマンドを実行する。

```bash
# リポジトリをクローン
git clone https://github.com/susumutomita/GPT-2mini
cd GPT-2mini

# クイック実験（約3分）
python run_scaling_experiment.py --data data.txt --quick

# フル実験（約60分）
python run_scaling_experiment.py --data data.txt --steps 2000

# 結果の可視化
python plot_scaling.py scaling_results.json --output scaling_plot.png
```

## まとめ

- 自作の GPT-2 mini で**スケーリング則を観測できた**
- パラメータ数が 10 倍になると、Loss が約 0.5 下がる
- 小規模実験でも、べき乗則の傾向は確認できる
- より正確な指数を得るには、データ量と学習量を増やす必要がある

スケーリング則は LLM の設計指針として重要。「とりあえず大きいモデルを作る」のではなく、データ量と計算量のバランスを考える必要がある。

## 参考文献

- [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) (OpenAI, 2020)
- [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) (Chinchilla, 2022)
- [GPT-2 mini リポジトリ](https://github.com/susumutomita/GPT-2mini)
