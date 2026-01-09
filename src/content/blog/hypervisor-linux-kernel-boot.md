---
title: "自作ハイパーバイザーで Linux カーネルを起動した - macOS Hypervisor.framework で本物の OS を動かす"
description: "macOS の Hypervisor.framework を使って自作したハイパーバイザー上で、Linux 6.6 カーネルを起動することに成功。UART 経由で起動ログを出力し、タイマーやメモリ管理が動作していることを確認した。ハイパーバイザー開発における技術的な課題と解決策を詳しく解説する。"
pubDate: 2026-01-09
category: "system"
---

## はじめに

自作ハイパーバイザーで **本物の Linux カーネル (v6.6)** を起動することに成功した。

これまでの開発では、自分で書いた ARM64 機械語のテストプログラム（Fibonacci 計算など）を動かしていたが、今回は実際の OS カーネルという大きなプログラムを動かすことができた。

```
Booting Linux on physical CPU 0x0000000000 [0x610f0000]
Linux version 6.6.0 ...
Machine model: hypervisor-virt
earlycon: pl11 at MMIO 0x0000000009000000
arch_timer: cp15 timer(s) running at 24.00MHz (virt)
```

この記事では、Linux カーネルを起動するまでに必要だった技術的な課題と、その解決方法を詳しく解説する。

## ハイパーバイザーとは何か

ハイパーバイザー（Hypervisor）は、仮想マシン（VM）を動かすためのソフトウェアのことである。

### 仮想マシンの仕組み

通常、OS はハードウェア（CPU、メモリ、ディスクなど）の上で直接動作する。

```
┌─────────────────────────────────┐
│          アプリケーション         │
├─────────────────────────────────┤
│          オペレーティングシステム    │
├─────────────────────────────────┤
│          ハードウェア             │
└─────────────────────────────────┘
```

ハイパーバイザーを使うと、ハードウェアと OS の間に仮想化層が入り、複数の OS を同時に動かせるようになる。

```
┌─────────────┐ ┌─────────────┐
│   Linux     │ │   Windows   │  ← ゲスト OS
├─────────────┤ ├─────────────┤
│   仮想 HW   │ │   仮想 HW   │  ← 仮想ハードウェア
├─────────────┴─┴─────────────┤
│        ハイパーバイザー        │  ← 今回作ったもの
├─────────────────────────────┤
│          ホスト OS            │  ← macOS
├─────────────────────────────┤
│          ハードウェア          │  ← Apple Silicon
└─────────────────────────────┘
```

### Hypervisor.framework

Apple は macOS 向けに `Hypervisor.framework` という仮想化フレームワークを提供している。これを使うと、カーネルモジュールを書かなくてもユーザー空間からハイパーバイザーを作成できる。

今回のプロジェクトでは、Rust から `Hypervisor.framework` を使うために [applevisor](https://github.com/impalabs/applevisor) というクレートを利用した。

## Linux カーネルを起動するために必要なもの

テストプログラムと違い、Linux カーネルを起動するには多くの仮想デバイスが必要になる。

### 1. UART (シリアルコンソール)

UART（Universal Asynchronous Receiver/Transmitter）は、コンピュータがテキストを入出力するためのシリアル通信デバイスである。

Linux カーネルは起動時に UART を使ってログを出力する。今回は ARM 標準の PL011 UART をエミュレートした。

```rust
pub struct Pl011Uart {
    base_addr: u64,
    // 各種レジスタ
    dr: u64,      // Data Register - 送受信データ
    fr: u64,      // Flag Register - 状態フラグ
    cr: u64,      // Control Register - 制御設定
    // ... 他のレジスタ
}
```

カーネルが UART のアドレス（`0x0900_0000`）に文字を書き込むと、ハイパーバイザーがそれを捕捉して画面に表示する。

### 2. タイマー

OS はタイマーを使って時間を計測し、プロセスのスケジューリングを行う。ARM アーキテクチャには Generic Timer という標準タイマーがある。

```rust
pub struct Timer {
    frequency: u64,           // タイマー周波数（24MHz）
    virtual_count: u64,       // 仮想カウンタ
    virtual_timer_ctl: u64,   // タイマー制御レジスタ
    virtual_timer_cval: u64,  // 比較値レジスタ
}
```

Linux カーネルはタイマーを使って「48.00 BogoMIPS」のような性能測定も行っている。

### 3. GIC (割り込みコントローラ)

GIC（Generic Interrupt Controller）は、デバイスからの割り込みを管理するコントローラである。タイマー割り込みやデバイス割り込みを CPU に伝える役割を持つ。

今回の起動では GIC の完全なエミュレーションはまだ実装途中のため、起動ログの途中で停止している。

### 4. Device Tree

Device Tree（デバイスツリー）は、ハードウェア構成を記述したデータ構造である。Linux カーネルは起動時に Device Tree を読み込んで、どのようなデバイスが存在するかを把握する。

```rust
let config = DeviceTreeConfig {
    memory_base: 0x4000_0000,      // RAM の開始アドレス
    memory_size: 256 * 1024 * 1024, // 256MB
    uart_base: 0x0900_0000,        // UART のアドレス
    gic_dist_base: 0x0800_0000,    // GIC Distributor
    gic_cpu_base: 0x0801_0000,     // GIC CPU Interface
    cmdline: "console=ttyAMA0 earlycon".to_string(),
};
```

## 技術的な課題と解決策

### 課題 1: Data Abort の IPA 取得

**問題**: Linux カーネルが UART に文字を書き込もうとしても、正しいアドレスが取得できなかった。

ARM アーキテクチャでは、ゲストがマップされていないメモリにアクセスすると **Data Abort** という例外が発生する。この例外をハイパーバイザーで捕捉して、UART などの MMIO（Memory-Mapped I/O）デバイスをエミュレートする。

最初は `FAR_EL1`（Fault Address Register）からアドレスを読み取ろうとしたが、Stage 2 フォールト（ゲスト物理アドレスからホスト物理アドレスへの変換失敗）では正しい値が取得できなかった。

**解決策**: `Hypervisor.framework` が提供する `exit_info.exception.physical_address` を使用した。

```rust
fn handle_data_abort(
    &mut self,
    syndrome: u64,
    fault_ipa: u64,  // ← IPA（Intermediate Physical Address）
) -> Result<bool, Box<dyn std::error::Error>> {
    // fault_ipa を使って MMIO をエミュレート
    let fault_addr = fault_ipa;

    if is_write {
        let value = self.get_register_by_index(srt)?;
        self.mmio_manager.handle_write(fault_addr, value, size)?;
    } else {
        let value = self.mmio_manager.handle_read(fault_addr, size)?;
        self.set_register_by_index(srt, value)?;
    }
    // ...
}
```

### 課題 2: 未知のシステムレジスタアクセス

**問題**: Linux カーネルが多くのシステムレジスタにアクセスするが、すべてをエミュレートするのは困難。

ARM アーキテクチャには数百のシステムレジスタがあり、Linux カーネルは起動時にキャッシュ情報やデバッグ設定などを読み書きする。

**解決策**: 未対応のレジスタは「読み取り時は 0 を返し、書き込みは無視」するフォールバック処理を実装した。

```rust
// 未対応のシステムレジスタ
if direction == 0 {
    // MRS (read): 0 を返す
    if rt < 31 {
        self.set_register_by_index(rt, 0)?;
    }
}
// MSR (write): 無視する

// PC を進める
let pc = self.vcpu.get_reg(Reg::PC)?;
self.vcpu.set_reg(Reg::PC, pc + 4)?;

Ok(true) // 続行
```

これにより、必須ではないレジスタアクセスでカーネルが停止することを防げた。

### 課題 3: ARM64 命令エンコーディング

**問題**: ARM64 命令のエンコーディングを間違えていて、意図した動作をしなかった。

例えば `MOVK X0, #0x8400, LSL #16` という命令は、X0 レジスタの上位 16 ビットに `0x8400` を設定する。しかし、`hw`（shift amount）フィールドのエンコードを間違えていた。

```
間違い: 0xF2A1_0800  → hw=00 (no shift)
正解:   0xF2B0_8000  → hw=01 (LSL #16)
```

**解決策**: ARM Architecture Reference Manual を確認して、正しいエンコーディングを適用した。

## Linux カーネルのビルド

macOS 上で ARM64 Linux カーネルをビルドするために、Docker を使用した。

### Dockerfile

```dockerfile
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc-aarch64-linux-gnu \
    binutils-aarch64-linux-gnu \
    bison flex libncurses-dev libssl-dev libelf-dev bc git
WORKDIR /build
```

### ビルドスクリプト

```bash
# カーネルソースを取得
git clone --depth 1 --branch v6.6 \
    https://github.com/torvalds/linux.git linux-6.6

cd linux-6.6

# ARM64 向け最小構成
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- defconfig

# 追加設定
cat >> .config << 'EOF'
CONFIG_SERIAL_AMBA_PL011=y
CONFIG_SERIAL_AMBA_PL011_CONSOLE=y
CONFIG_EARLY_PRINTK=y
CONFIG_ARM_GIC=y
CONFIG_ARM_ARCH_TIMER=y
CONFIG_CMDLINE="console=ttyAMA0 earlycon=pl011,0x09000000 loglevel=8"
CONFIG_CMDLINE_FORCE=y
EOF

# ビルド
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- Image -j$(nproc)
```

約 5 分で 42MB のカーネルイメージ（`arch/arm64/boot/Image`）が生成される。

## 起動テスト

### テストコード

```rust
#[test]
fn linux_カーネルが起動してuart出力する() {
    // カーネルを読み込み
    let kernel_data = fs::read("output/Image")?;
    let kernel = KernelImage::from_bytes(kernel_data, Some(0x4008_0000));

    // ハイパーバイザーを作成（256MB RAM）
    let mut hv = Hypervisor::new(0x4000_0000, 256 * 1024 * 1024)?;

    // UART を登録
    let uart = UartCollector::new(0x0900_0000, Arc::clone(&uart_output));
    hv.register_mmio_handler(Box::new(uart));

    // カーネルを起動
    let result = hv.boot_linux(
        &kernel,
        "console=ttyAMA0 earlycon=pl011,0x09000000 loglevel=8",
        Some(0x4400_0000),
    )?;

    // UART 出力を確認
    let output = uart_output.lock().unwrap();
    assert!(!output.is_empty());
}
```

### 起動ログ

```
[    0.000000] Booting Linux on physical CPU 0x0000000000 [0x610f0000]
[    0.000000] Linux version 6.6.0 (root@fc8576565d43) ...
[    0.000000] Machine model: hypervisor-virt
[    0.000000] earlycon: pl11 at MMIO 0x0000000009000000 (options '')
[    0.000000] printk: bootconsole [pl11] enabled
[    0.000000] NUMA: Faking a node at [mem 0x40000000-0x4fffffff]
[    0.000000] Zone ranges:
[    0.000000]   DMA      [mem 0x40000000-0x4fffffff]
[    0.000000] Memory: 114716K/262144K available
[    0.000000] SLUB: HWalign=64, Order=0-3, MinObjects=0, CPUs=1
[    0.000000] rcu: Preemptible hierarchical RCU implementation.
[    0.000000] NR_IRQS: 64, nr_irqs: 64
[    0.000000] Root IRQ handler: gic_handle_irq
[    0.000000] arch_timer: cp15 timer(s) running at 24.00MHz (virt).
[    0.000000] sched_clock: 56 bits at 24MHz, resolution 41ns
[    0.001211] Console: colour dummy device 80x25
```

カーネルが正常に起動し、以下のことが確認できた。

- **CPU 検出**: Apple Silicon の CPU ID `0x610f0000` を認識
- **メモリ管理**: 256MB のメモリを正しくマッピング
- **タイマー動作**: 24MHz のタイマーが動作
- **UART 出力**: シリアルコンソールへのログ出力

## メモリマップ

今回の仮想マシンでは、以下のメモリレイアウトを使用した。

```
アドレス          サイズ    用途
────────────────────────────────────────
0x0800_0000      4KB       GIC Distributor
0x0801_0000      4KB       GIC CPU Interface
0x0900_0000      4KB       UART (PL011)
0x4000_0000      256MB     RAM
0x4008_0000      -         カーネルエントリポイント
0x4400_0000      -         Device Tree (DTB)
```

## 現在の制限と今後の課題

### シェルが起動しない理由

現時点では、カーネルの起動ログは表示されるが、シェル（`/bin/sh`）は起動しない。理由は以下の 2 つである。

1. **initramfs がない**: カーネルだけでは `/bin/sh` などのプログラムがない。BusyBox などを含む initramfs が必要になる。

2. **GIC の MMIO 未対応**: 割り込みコントローラへのアクセスがまだ完全にエミュレートされていない。

```
MMIO read from unhandled address: 0x8000004 (size: 4)
MMIO write to unhandled address: 0x8000000 = 0x0 (size: 4)
```

### 今後の開発計画

1. **GIC MMIO ハンドラーの登録**: 既に実装済みの GIC コードを MMIO マネージャーに登録する。

2. **initramfs の作成**: BusyBox を含むミニマルなルートファイルシステムを作成する。

3. **VirtIO デバイスの追加**: ネットワークやブロックデバイスの仮想化。

## まとめ

macOS の `Hypervisor.framework` を使って、実際の Linux カーネル（v6.6）を起動することに成功した。

テストプログラムから始めて、UART、タイマー、Device Tree と段階的に機能を追加し、ついに本物の OS カーネルを動かせるようになった。

ハイパーバイザー開発は、CPU アーキテクチャ、OS の起動シーケンス、デバイスエミュレーションなど多くの低レイヤー技術を学ぶ良い機会になる。

## 参考資料

- [GitHub: Building-a-hypervisor](https://github.com/susumutomita/Building-a-hypervisor)
- [Apple Hypervisor.framework Documentation](https://developer.apple.com/documentation/hypervisor)
- [ARM Architecture Reference Manual](https://developer.arm.com/documentation/ddi0487/latest)
- [Linux Kernel Documentation](https://www.kernel.org/doc/html/latest/)
- [applevisor - Rust bindings for Hypervisor.framework](https://github.com/impalabs/applevisor)
