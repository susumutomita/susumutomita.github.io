---
title: "Apple Silicon ハイパーバイザーに UART エミュレーションを実装 - デバイス I/O の基礎"
description: "macOS Hypervisor.framework を使った ARM64 ハイパーバイザーに PL011 UART エミュレーションを実装。MMIO ハンドリング基盤を活用し、ゲストプログラムから stdout への文字出力を実現。デバイスエミュレーションの基本パターンを解説。"
pubDate: 2026-01-05
category: "system"
---

## はじめに

[前回の記事](/blog/hypervisor-mmio-handling)で、MMIO ハンドリング基盤を実装した。

今回は、その基盤の上に **PL011 UART デバイスエミュレーション** を実装した。これにより、ゲストプログラムから文字列を出力できるようになる。

GitHub: [Building-a-hypervisor](https://github.com/susumutomita/Building-a-hypervisor)

## UART とは

UART (Universal Asynchronous Receiver/Transmitter) は、シリアル通信するためのデバイスである。

ARM プラットフォームでは **PL011** という UART コントローラーが標準的に使われる。PL011 は以下のようなレジスタを持つ。

| レジスタ | オフセット | 説明 |
|---------|----------|------|
| UART_DR | 0×00 | Data Register (送受信データ) |
| UART_FR | 0×18 | Flag Register (ステータスフラグ) |

### UART の役割

Linux カーネルは、早期ブート段階で UART を使ってデバッグメッセージを出力する。UART エミュレーションがあれば、カーネルのブートログを確認できるようになる。

```
[    0.000000] Booting Linux on physical CPU 0x0
[    0.000000] Linux version 6.x.x ...
```

## 実装の全体像

### アーキテクチャ

```
ゲストプログラム
    ↓ str w0, [x1]  // UART_DR (0x09000000) への書き込み
Data Abort (EC=0×24)
    ↓
Hypervisor::handle_data_abort()
    ↓ アドレス 0x09000000 を検出
MmioManager::handle_write()
    ↓ UART ハンドラにディスパッチ
Pl011Uart::write()
    ↓ 文字を stdout に出力
print!("{}", ch as char);
```

### ファイル構成

```
src/
├── lib.rs                # devices モジュールを公開
├── mmio.rs               # MMIO 基盤（Week 1）
└── devices/
    ├── mod.rs            # デバイスモジュール（NEW）
    └── uart.rs           # PL011 UART 実装（NEW）
examples/
└── uart_test.rs          # UART テスト（NEW）
```

## 実装詳細

### 1. PL011 UART デバイス

UART デバイスは `MmioHandler` trait を実装することで、MMIO 基盤に統合できる。

```rust
// src/devices/uart.rs
pub struct Pl011Uart {
    base_addr: u64,
}

impl Pl011Uart {
    pub fn new(base_addr: u64) -> Self {
        Self { base_addr }
    }
}
```

### 2. MmioHandler trait の実装

UART のレジスタアクセスを処理する。

```rust
impl MmioHandler for Pl011Uart {
    fn base(&self) -> u64 {
        self.base_addr  // 0x09000000
    }

    fn size(&self) -> u64 {
        0x1000  // 4KB メモリマップ領域
    }

    fn read(&mut self, offset: u64, _size: usize) -> Result<u64, Box<dyn Error>> {
        match offset {
            UART_FR => {
                // TX FIFO が空であることを報告
                Ok(UART_FR_TXFE)  // 0x80
            }
            _ => Ok(0),
        }
    }

    fn write(&mut self, offset: u64, value: u64, _size: usize) -> Result<(), Box<dyn Error>> {
        match offset {
            UART_DR => {
                // 下位 8 ビットを文字として抽出
                let ch = (value & 0xFF) as u8;
                // stdout に出力
                print!("{}", ch as char);
                io::stdout().flush()?;
                Ok(())
            }
            _ => Ok(()),  // 他のレジスタへの書き込みは無視
        }
    }
}
```

**ポイント**:
- `UART_DR` への書き込みは文字として stdout に出力
- `UART_FR` の読み取りは常に `TXFE` (TX FIFO Empty) を返す
- 他のレジスタは実装を省略（最小限の実装）

### 3. UART デバイスの登録

ハイパーバイザーに UART を登録する。

```rust
// examples/uart_test.rs
const UART_BASE: u64 = 0x09000000;
let uart = Pl011Uart::new(UART_BASE);
hv.register_mmio_handler(Box::new(uart));
```

これで、ゲストプログラムが `0x09000000` にアクセスすると、UART デバイスが処理するようになる。

## テスト

### テストコード

複数の文字を UART に書き込むプログラム。

```rust
// examples/uart_test.rs
let instructions = [
    0xd2800820, // mov x0, #0x41        // 'A'
    0xd2a12001, // mov x1, #0x09000000  // UART base address
    0xb9000020, // str w0, [x1]         // Write to UART_DR
    0xd2800840, // mov x0, #0x42        // 'B'
    0xb9000020, // str w0, [x1]         // Write to UART_DR
    0xd2800140, // mov x0, #0x0a        // '\n'
    0xb9000020, // str w0, [x1]         // Write to UART_DR
    0xd4200000, // brk #0
];
```

### 実行結果

```
=== UART エミュレーションテスト ===

[1] ハイパーバイザーを初期化中...
    ✓ ゲストアドレス: 0x10000

[2] UART デバイスを登録中...
    ✓ UART ベースアドレス: 0x9000000

[3] ゲストコードを書き込み中...
    ARM64 アセンブリ:
      mov x0, #0x41        // 'A'
      mov x1, #0x09000000  // UART base address
      str w0, [x1]         // Write 'A' to UART_DR
      mov x0, #0x42        // 'B'
      str w0, [x1]         // Write 'B' to UART_DR
      mov x0, #0x0a        // '\n'
      str w0, [x1]         // Write '\n' to UART_DR
      brk #0
    ✓ 8 命令を書き込み完了

[4] ゲストプログラムを実行中...
---
UART 出力:
AB
---

VM Exit:
  - Reason: EXCEPTION
  - PC: 0x1001c
  - Exception Class (EC): 0x3c

✅ 成功: BRK 命令で正常に終了しました
   UART から "AB" が出力されました

=== UART エミュレーションテスト完了 ===
```

### 検証項目

- ✅ UART_DR への書き込みで文字が stdout に出力される
- ✅ 複数文字の連続出力ができる
- ✅ BRK 命令で正常終了
- ✅ ユニットテスト 5 件すべてパス

## ユニットテスト

UART 実装には以下のテストを用意した。

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_uart_base_and_size() {
        let uart = Pl011Uart::new(0x09000000);
        assert_eq!(uart.base(), 0x09000000);
        assert_eq!(uart.size(), 0x1000);
    }

    #[test]
    fn test_uart_fr_read() {
        let mut uart = Pl011Uart::new(0x09000000);
        let value = uart.read(UART_FR, 4).unwrap();
        assert_eq!(value, UART_FR_TXFE);  // TX FIFO Empty
    }

    #[test]
    fn test_uart_dr_write() {
        let mut uart = Pl011Uart::new(0x09000000);
        uart.write(UART_DR, 0x41, 4).unwrap();  // 'A' を書き込み
    }
}
```

**実行結果**:
```
running 5 tests
test devices::uart::tests::test_uart_base_and_size ... ok
test devices::uart::tests::test_uart_dr_write ... ok
test devices::uart::tests::test_uart_unknown_register_write ... ok
test devices::uart::tests::test_uart_fr_read ... ok
test devices::uart::tests::test_uart_unknown_register_read ... ok

test result: ok. 5 passed; 0 failed; 0 ignored
```

## 実行方法

```bash
# ビルド
cargo build --example uart_test

# コード署名（hypervisor entitlements 必須）
codesign --entitlements hypervisor.entitlements -s - ./target/debug/examples/uart_test

# 実行
./target/debug/examples/uart_test
```

一発実行コマンドは以下の通り。

```bash
cargo build --example uart_test && \
codesign --entitlements hypervisor.entitlements -s - ./target/debug/examples/uart_test && \
./target/debug/examples/uart_test
```

## 技術的な発見

### 1. trait によるデバイスの抽象化

`MmioHandler` trait を使うことで、デバイスの実装が統一された。

**利点**:
- 新しいデバイス（タイマー、割り込みコントローラー）を追加しやすい
- `MmioManager` はデバイスの種類を意識する必要がない
- テスタビリティが向上（モックデバイスを簡単に作れる）

### 2. 最小限の実装でも動作する

PL011 は 20 個以上のレジスタを持つが、実装したのは 2 つだけ。

- `UART_DR` (0×00): データ送受信
- `UART_FR` (0×18): フラグレジスタ

他のレジスタ（割り込み制御、ボーレート設定など）は無視しても、基本的な文字出力は動作する。

**教訓**: 完璧を目指さず、動くものを素早く作る。

### 3. ユニットテストの重要性

`print!()` を使うコードはテストしにくいが、以下のようにテストできた。

```rust
#[test]
fn test_uart_dr_write() {
    let mut uart = Pl011Uart::new(0x09000000);
    // 'A' を書き込んでも panic しない
    uart.write(UART_DR, 0x41, 4).unwrap();
}
```

出力内容の検証はできないが、エラーが起きないことは確認できる。

## Week 2 の成功基準達成状況

Plan.md で定義した Week 2 の成功基準をすべて達成した。

- ✅ UART_DR への書き込みで文字が stdout に出力される
- ✅ UART_FR の読み取りで 0×80（TX FIFO empty）が返る
- ✅ 複数文字の連続出力ができる
- ✅ ユニットテストが 100％パス

## 次のステップ

UART エミュレーションが完成したので、次は **Device Tree 生成** に進む。

**Week 3** - Device Tree 生成。
- FDT (Flattened Device Tree) バイナリの生成
- CPU、メモリ、UART ノードの定義
- `fdt` crate を使った実装

**Week 4** - Linux カーネルブート。
- カーネルイメージのロード
- ブート条件の設定（X0=DTB アドレス、PC=エントリーポイント）
- シリアルコンソールへの出力

最終目標は、Linux カーネルを起動して UART に「Booting Linux on physical CPU 0×0」を出力することである。

## まとめ

macOS Hypervisor.framework を使った ARM64 ハイパーバイザーに PL011 UART エミュレーションを実装した。

**実装したもの**:
- `Pl011Uart` 構造体による UART デバイス
- `MmioHandler` trait の実装
- UART_DR、UART_FR レジスタの処理
- 複数文字の連続出力

**技術的発見**:
- trait ベースの抽象化により、デバイスの追加が容易
- 最小限の実装でも基本機能は動作する
- ユニットテストでデバイスの動作を検証できる

これにより、ゲストプログラムから文字列を出力する基盤が整った。次回は Device Tree を生成し、Linux カーネルのブートに必要な情報を提供できるようにする。

## 参考資料

- [ARM PL011 UART Technical Reference](https://developer.arm.com/documentation/ddi0183/latest/)
- [Linux Kernel UART Driver (amba-pl011.c)](https://github.com/torvalds/linux/blob/master/drivers/tty/serial/amba-pl011.c)
- [ARM Architecture Reference Manual](https://developer.arm.com/documentation/ddi0487/latest/)
- [Apple Hypervisor Framework](https://developer.apple.com/documentation/hypervisor)
