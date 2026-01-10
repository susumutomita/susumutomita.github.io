---
title: "拡散モデル（DDPM）をゼロから実装して理解する"
description: "Denoising Diffusion Probabilistic Model を単一ファイルで実装し、画像生成の仕組みを理論から実装まで深掘りする。ノイズスケジュール、U-Net アーキテクチャ、そして Stable Diffusion への発展まで解説"
pubDate: 2026-01-10
category: "engineering"
---

## はじめに

2020 年、Ho らによる "Denoising Diffusion Probabilistic Models"（DDPM）論文が発表された。この論文は画像生成の新しいパラダイムを確立し、後の Stable Diffusion、DALL-E 2、Midjourney へと繋がる基盤となった。

本記事では、DDPM を単一ファイルで実装し、その仕組みを理論から実装まで深掘りする。GPT-2 mini と同じ「壊して観測して理解する」アプローチで、拡散モデルの本質に迫る。

## 拡散モデルの直感的理解

### インクの拡散アナロジー

水にインクを一滴垂らすと、徐々に拡散して最終的には均一な色になる。これは物理的な拡散過程である。

```
時刻 0: 濃いインク滴（構造あり）
  ↓ 拡散
時刻 T: 均一な薄い色（構造なし）
```

拡散モデルはこの過程を逆転させる。均一なノイズから始めて、徐々に構造を持った画像を生成する。

```
時刻 T: 純粋なノイズ（構造なし）
  ↓ 逆拡散（学習）
時刻 0: 綺麗な画像（構造あり）
```

### なぜこのアプローチが有効か

従来の生成モデル（GAN、VAE）と比較した拡散モデルの利点は以下の通り。

| モデル | 学習の安定性 | 多様性 | 品質 |
|--------|------------|--------|------|
| GAN | 不安定（モード崩壊） | 低い傾向 | 高い |
| VAE | 安定 | 高い | ぼやける |
| 拡散モデル | 安定 | 高い | 高い |

拡散モデルは「ノイズを予測する」という単純なタスクに帰着するため、学習が安定する。また、確率的なサンプリング過程により多様性も確保できる。

## 数学的定式化

### Forward Process（拡散過程）

元画像 x₀ に徐々にガウスノイズを加えていく。

```
q(xₜ | xₜ₋₁) = N(xₜ; √(1-βₜ) xₜ₋₁, βₜI)
```

ここで βₜ はノイズスケジュールで、時刻 t でどれだけノイズを加えるかを制御する。

重要な性質として、任意の時刻 t のサンプルを x₀ から直接計算できる。

```
q(xₜ | x₀) = N(xₜ; √ᾱₜ x₀, (1-ᾱₜ)I)
```

ここで αₜ = 1 - βₜ、ᾱₜ = ∏ᵢ₌₁ᵗ αᵢ（累積積）。

これは以下のように書き換えられる。

```
xₜ = √ᾱₜ x₀ + √(1-ᾱₜ) ε,  ε ~ N(0, I)
```

### Reverse Process（逆拡散過程）

ノイズ画像 xₜ から元画像 x₀ を復元する。真の逆過程 q(xₜ₋₁|xₜ, x₀) は解析的に求まる。

```
q(xₜ₋₁ | xₜ, x₀) = N(xₜ₋₁; μ̃ₜ(xₜ, x₀), β̃ₜI)
```

しかし生成時には x₀ は未知なので、ニューラルネットワークで近似する。

```
pθ(xₜ₋₁ | xₜ) = N(xₜ₋₁; μθ(xₜ, t), σₜ²I)
```

### 学習目的関数

DDPM の核心的な洞察は、「ノイズ ε を予測する」ことで μθ を間接的に学習できること。

```
L = E[||ε - εθ(xₜ, t)||²]
```

つまり、ノイズ画像 xₜ と時刻 t を入力として、加えられたノイズ ε を予測するネットワーク εθ を学習する。

これは直感的にも理解しやすい。「この画像にはどんなノイズが乗っているか」を予測できれば、そのノイズを引けば元画像に近づく。

## ノイズスケジュール

### Linear Schedule

最も単純なスケジュール。β を β₁ = 10⁻⁴ から βT = 0.02 まで線形に増加させる。

```python
betas = torch.linspace(1e-4, 0.02, timesteps)
```

### Cosine Schedule

"Improved DDPM" 論文で提案された。ᾱₜ が滑らかに減少するよう設計されている。

```python
s = 0.008
t = torch.linspace(0, timesteps, timesteps + 1)
alphas_bar = torch.cos((t / timesteps + s) / (1 + s) * pi / 2) ** 2
alphas_bar = alphas_bar / alphas_bar[0]
betas = 1 - (alphas_bar[1:] / alphas_bar[:-1])
```

### スケジュールの比較

| スケジュール | 特徴 | 用途 |
|-------------|------|------|
| Linear | 実装が簡単、後半でノイズが急増 | 基本実装 |
| Cosine | 滑らかな遷移、高解像度で有効 | 高品質生成 |

Cosine スケジュールは特に画像の細部（高周波成分）の生成に有効である。Linear では後半で急激にノイズが増えるため、細部の情報が失われやすい。

## U-Net アーキテクチャ

### なぜ U-Net か

拡散モデルのノイズ予測器として U-Net が選ばれる理由は以下の通り。

1. **入出力が同サイズ**: 入力画像と同じサイズのノイズマップを出力。
2. **マルチスケール特徴**: ダウンサンプリングで大域的、アップサンプリングで局所的特徴を捉える。
3. **Skip Connection**: 細部情報を保持。

### アーキテクチャ詳細

```
Input (1, 28, 28) + Time Embedding
    ↓
┌─────────────────────────────────┐
│  Down Block 1: 64 channels      │──┐
│  Down Block 2: 64 channels      │──┼─ Skip
│  Downsample: 28→14              │  │
├─────────────────────────────────┤  │
│  Down Block 3: 128 channels     │──┼─ Skip
│  Down Block 4: 128 channels     │──┤
│  Downsample: 14→7               │  │
├─────────────────────────────────┤  │
│  Mid Block 1: 128 channels      │  │
│  Mid Block 2: 128 channels      │  │
├─────────────────────────────────┤  │
│  Upsample: 7→14                 │  │
│  Up Block 1: concat + 128 ch    │←─┤
│  Up Block 2: 128 channels       │  │
├─────────────────────────────────┤  │
│  Upsample: 14→28                │  │
│  Up Block 3: concat + 64 ch     │←─┘
│  Up Block 4: 64 channels        │
└─────────────────────────────────┘
    ↓
Output (1, 28, 28)
```

### ResBlock の設計

各ブロックは残差接続と時刻条件付けを持つ。

```python
class ResBlock(nn.Module):
    def forward(self, x, t_emb):
        h = self.conv1(x)
        h = self.norm1(h)
        h = F.silu(h)

        # 時刻埋め込みを加算
        h = h + self.time_mlp(t_emb)[:, :, None, None]

        h = self.conv2(h)
        h = self.norm2(h)
        h = F.silu(h)

        # 残差接続
        return h + self.skip(x)
```

時刻埋め込みは「今どの程度ノイズが乗っているか」をネットワークに伝える。これがないと、ネットワークは適切なノイズ量を推定できない。

### 時刻埋め込み

Transformer と同じ Sinusoidal Positional Encoding を使用。

```python
class SinusoidalPositionEmbedding(nn.Module):
    def forward(self, t):
        half_dim = self.dim // 2
        emb = math.log(10000) / (half_dim - 1)
        emb = torch.exp(torch.arange(half_dim) * -emb)
        emb = t[:, None] * emb[None, :]
        return torch.cat([torch.sin(emb), torch.cos(emb)], dim=-1)
```

この埋め込みを MLP で変換し、各 ResBlock に注入する。

## 実装の詳細

### 学習ループ

```python
for step in range(steps):
    # 1. バッチ取得
    x_0 = next(dataloader)

    # 2. ランダムな時刻をサンプル
    t = torch.randint(0, timesteps, (batch_size,))

    # 3. ノイズを生成
    noise = torch.randn_like(x_0)

    # 4. Forward process: x_0 → x_t
    x_t = sqrt_alpha_bar[t] * x_0 + sqrt_one_minus_alpha_bar[t] * noise

    # 5. ノイズを予測
    predicted_noise = model(x_t, t)

    # 6. 損失計算（MSE）
    loss = F.mse_loss(predicted_noise, noise)

    # 7. 逆伝播
    loss.backward()
    optimizer.step()
```

### サンプリング（生成）

```python
def sample(model, timesteps):
    # 純粋なノイズから開始
    x = torch.randn(n_samples, 1, 28, 28)

    # T → 0 へ逆拡散
    for t in reversed(range(timesteps)):
        # ノイズを予測
        predicted_noise = model(x, t)

        # x_{t-1} を計算
        mean = (1 / sqrt_alpha[t]) * (
            x - (beta[t] / sqrt_one_minus_alpha_bar[t]) * predicted_noise
        )

        if t > 0:
            noise = torch.randn_like(x)
            x = mean + sqrt_posterior_variance[t] * noise
        else:
            x = mean

    return x
```

## 実験結果

### 基本実験

MNIST で 5000 ステップ学習した結果。

| 設定 | 最終 Loss | 生成品質 |
|------|----------|---------|
| Baseline | 0.023 | 数字が認識可能 |
| Residual OFF | 0.089 | ぼやけた形状 |
| Time Emb OFF | 0.156 | ほぼノイズ |
| Cosine Schedule | 0.021 | やや鮮明 |

### 実験スイッチの効果

#### 残差接続なし

残差接続を無効化すると、勾配消失により深い層の学習が困難になる。生成画像はぼやけ、細部が失われる。

```bash
python train_diffusion_mini.py --disable_residual 1 --steps 5000
```

#### 時刻埋め込みなし

時刻埋め込みなしでは、ネットワークは現在のノイズレベルを知ることができない。結果として、どの時刻でも同じ予測をしてしまい、生成が完全に失敗する。

```bash
python train_diffusion_mini.py --disable_time_emb 1 --steps 5000
```

これは拡散モデルにおいて時刻条件付けが本質的に重要であることを示している。

## Stable Diffusion への発展

### DDPM から Stable Diffusion へ

```
DDPM (2020)
  ↓ 高速化
DDIM (2020): 決定論的サンプリング、ステップ数削減
  ↓ 条件付け
Classifier-Free Guidance (2021): テキスト条件付け
  ↓ 潜在空間
LDM / Stable Diffusion (2022): VAE 潜在空間で拡散
```

### Latent Diffusion Model（LDM）

DDPM の最大の課題は計算コスト。512×512 画像を直接扱うのは非効率。

LDM は以下のアプローチで解決する。

1. **エンコード**: 画像を VAE で低次元潜在空間に圧縮（512×512 → 64×64）。
2. **拡散**: 潜在空間で拡散過程を実行。
3. **デコード**: 生成された潜在表現を VAE でデコード。

```
画像 (512×512x3) → VAE Encoder → 潜在 (64×64x4) → 拡散 → VAE Decoder → 画像
```

これにより計算量が 64 倍削減される。

### Cross-Attention によるテキスト条件付け

Stable Diffusion では U-Net に Cross-Attention 層を追加し、テキスト埋め込み（CLIP）を注入する。

```python
class CrossAttention(nn.Module):
    def forward(self, x, context):
        # x: 画像特徴 [B, H*W, C]
        # context: テキスト埋め込み [B, seq_len, C]

        q = self.to_q(x)
        k = self.to_k(context)
        v = self.to_v(context)

        attn = softmax(q @ k.T / sqrt(d))
        return attn @ v
```

## 実装を動かす

### インストール

```bash
git clone https://github.com/susumutomita/GPT-2mini
cd GPT-2mini
pip install torch torchvision pillow
```

### 学習

```bash
# クイック確認（約 1 分）
python train_diffusion_mini.py --steps 500

# 本格学習（約 10 分）
python train_diffusion_mini.py --steps 5000

# 長時間学習（約 30 分）
python train_diffusion_mini.py --steps 20000
```

### 生成結果の確認

```bash
open samples_final.png
```

### 実験

```bash
# 残差接続の重要性を確認
python train_diffusion_mini.py --disable_residual 1 --steps 5000

# 時刻埋め込みの重要性を確認
python train_diffusion_mini.py --disable_time_emb 1 --steps 5000

# Cosine スケジュール
python train_diffusion_mini.py --noise_schedule cosine --steps 5000
```

## まとめ

本記事では、拡散モデル（DDPM）をゼロから実装し、その仕組みを深掘りした。

### 学んだこと

1. **拡散過程の数学**: Forward/Reverse 過程の定式化。
2. **ノイズ予測**: 損失関数の導出と直感的理解。
3. **U-Net の役割**: マルチスケール特徴と Skip Connection。
4. **時刻条件付けの重要性**: 実験で確認。
5. **Stable Diffusion への道筋**: DDPM → DDIM → LDM。

### 拡散モデルの本質

拡散モデルの本質は「構造化されたデノイジング」である。

- 単純なノイズ除去ではなく、時刻に応じた適切なノイズ除去。
- 大域的構造から局所的細部へ、段階的に生成。
- 確率的過程により多様性を確保。

この「段階的な生成」という考え方は、人間の創作プロセスにも通じる。まず大まかな構図を決め、徐々に細部を詰めていく。

## 参考文献

1. Ho, J., et al. (2020). [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239). NeurIPS 2020.
2. Nichol, A., Dhariwal, P. (2021). [Improved Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2102.09672). ICML 2021.
3. Song, J., et al. (2020). [Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502). ICLR 2021.
4. Rombach, R., et al. (2022). [High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752). CVPR 2022.
5. Ho, J., Salimans, T. (2021). [Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598). NeurIPS 2021 Workshop.

## 付録: パラメータ数の計算

本実装の U-Net パラメータ数は約 3.1M。

```
時刻埋め込み MLP: 64 × 256 + 256 × 256 = 81,920
Down blocks: 4 × (64² × 9 × 2 + 64 × 2) ≈ 295,000
Mid blocks: 2 × (128² × 9 × 2) ≈ 590,000
Up blocks: 4 × (128² × 9 × 2) ≈ 1,180,000
その他（Conv, Norm）: ≈ 950,000
合計: 約 3,100,000
```

GPT-2 mini（1.28M）より大きいが、画像生成タスクの複雑さを考えると妥当なサイズである。
