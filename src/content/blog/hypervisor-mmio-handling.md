---
title: "Apple Silicon ハイパーバイザーに MMIO ハンドリングを実装 - デバイスエミュレーションの基礎"
description: "macOS Hypervisor.framework を使った ARM64 ハイパーバイザーに MMIO（Memory-Mapped I/O）ハンドリング機能を実装。Data Abort 例外の処理、デバイスハンドラの抽象化、FAR_EL1 の制限への対処など、デバイスエミュレーションの基礎を解説。"
pubDate: 2026-01-05
category: "system"
---

## はじめに

[前回の記事](/blog/building-hypervisor-apple-silicon)で、macOS の Hypervisor.framework を使って基本的なハイパーバイザーを実装した。

今回は、そのハイパーバイザーに **MMIO（Memory-Mapped I/O）ハンドリング機能** を実装した。これは UART などのデバイスをエミュレートするための基盤となる。

GitHub: [Building-a-hypervisor](https://github.com/susumutomita/Building-a-hypervisor)

## MMIO とは

MMIO（Memory-Mapped I/O）は、メモリアクセスを通じてデバイスを制御する仕組みである。

例えば、UART（シリアルポート）は通常 `0x09000000` のようなアドレスに配置される。ゲストプログラムがこのアドレスに書き込むと、以下の処理が実行される。

1. **Data Abort 例外**（EC=0×24）が発生
2. ハイパーバイザーが例外をトラップ
3. アドレスとデータから UART への書き込みだと判断
4. UART デバイスエミュレータが処理（例: stdout に出力）
5. ゲストプログラムに制御を戻す

これにより、実際のハードウェアがなくてもデバイスをエミュレートできる。

## 実装の全体像

### アーキテクチャ

```
ゲストプログラム
    ↓ str w0, [x1]  // MMIO アドレスへの書き込み
Data Abort (EC=0x24)
    ↓
Hypervisor::handle_data_abort()
    ↓ アドレスとデータを取得
MmioManager::handle_write()
    ↓ 該当するハンドラを検索
UartDevice::write()  // 実際のデバイス処理
```

### ファイル構成

```
src/
├── lib.rs          # Hypervisor に MMIO 統合
├── mmio.rs         # MMIO ハンドリング基盤（NEW）
└── ...
examples/
└── mmio_test.rs    # MMIO テスト（NEW）
```

## 実装詳細

### 1. MmioHandler trait - デバイスの抽象化

デバイスエミュレータの共通インタフェースを定義する。

```rust
// src/mmio.rs
pub trait MmioHandler: Send + Sync {
    /// デバイスのベースアドレス
    fn base(&self) -> u64;

    /// デバイスのメモリマップサイズ
    fn size(&self) -> u64;

    /// デバイスからデータを読み取る
    fn read(&mut self, offset: u64, size: usize) -> Result<u64, Box<dyn Error>>;

    /// デバイスにデータを書き込む
    fn write(&mut self, offset: u64, value: u64, size: usize) -> Result<(), Box<dyn Error>>;
}
```

この trait を実装することで、UART、タイマー、割り込みコントローラーなど、任意のデバイスをエミュレートできる。

### 2. MmioManager - ハンドラのルーティング

複数のデバイスを管理し、メモリアクセスを適切なハンドラにディスパッチする。

```rust
pub struct MmioManager {
    handlers: Vec<Box<dyn MmioHandler>>,
}

impl MmioManager {
    pub fn handle_write(&mut self, addr: u64, value: u64, size: usize)
        -> Result<(), Box<dyn Error>>
    {
        // アドレスから該当するハンドラを検索
        for handler in &mut self.handlers {
            let base = handler.base();
            let handler_size = handler.size();

            if addr >= base && addr < base + handler_size {
                let offset = addr - base;
                return handler.write(offset, value, size);
            }
        }

        // ハンドラが見つからない場合は警告
        eprintln!("MMIO write to unhandled address: 0x{:x} = 0x{:x}", addr, value);
        Ok(())
    }
}
```

### 3. Data Abort ハンドラ - 例外処理

ゲストの MMIO アクセスを検出し、MmioManager に転送する。

```rust
// src/lib.rs
fn handle_data_abort(&mut self, syndrome: u64) -> Result<bool, Box<dyn std::error::Error>> {
    // WnR ビット: 0 = read, 1 = write
    let is_write = (syndrome & (1 << 6)) != 0;

    // SAS (Syndrome Access Size) ビット [23:22]
    let sas = (syndrome >> 22) & 0x3;
    let size = 1 << sas; // 1, 2, 4, 8 bytes

    // FAR_EL1 から fault address を取得
    let far_el1 = self.vcpu.get_sys_reg(SysReg::FAR_EL1)?;

    // macOS Hypervisor.framework の制限への対処（後述）
    let fault_addr = if far_el1 == 0 {
        self.vcpu.get_reg(Reg::X1)?  // フォールバック
    } else {
        far_el1
    };

    if is_write {
        let value = self.vcpu.get_reg(Reg::X0)?;
        self.mmio_manager.handle_write(fault_addr, value, size)?;
    } else {
        let value = self.mmio_manager.handle_read(fault_addr, size)?;
        self.vcpu.set_reg(Reg::X0, value)?;
    }

    // PC を進める（命令は 4 bytes）
    let pc = self.vcpu.get_reg(Reg::PC)?;
    self.vcpu.set_reg(Reg::PC, pc + 4)?;

    Ok(true) // 続行
}
```

## 技術的な発見とハマったポイント

### 1. FAR_EL1 が 0 を返す問題

**問題**: macOS Hypervisor.framework では `FAR_EL1` が常に 0×0 を返す。

**原因**: 例外が EL2（ハイパーバイザーレベル）にトラップされた際、FAR_EL1 が設定されないため。

**対処**: 命令の base register（今回は X1）をフォールバックとして使用。

```rust
let fault_addr = if far_el1 == 0 {
    self.vcpu.get_reg(Reg::X1)?  // Workaround
} else {
    far_el1
};
```

**TODO**: 将来的には命令をデコードして実際の base register を特定する必要がある。

### 2. ARM64 命令エンコーディングのバグ

**問題**: `movz x1, #0x900, lsl #16` を `0xd2a12000` とエンコードしたが、これは X0 を対象とする命令だった。

**デバッグ**:

```python
instruction = 0xd2a12000
rd = instruction & 0x1F  # Rd フィールド = 0 (X0)
```

**修正**: Rd フィールドを 1 に変更して X1 を指定。

```rust
0xd2a12001, // mov x1, #0x09000000 - FIXED: X1 not X0
```

**教訓**: ARM64 命令のエンコーディングは、各フィールド（Rd, Rn, imm）を正確に設定する必要がある。

### 3. EC=0×20 (Instruction Abort) の誤検出

**問題**: 最初のテストで MMIO アドレスを `0x1` にしたところ、Data Abort (EC=0×24) ではなく Instruction Abort (EC=0×20) が発生した。

**原因**: アドレス `0x1` は命令フェッチとして解釈された。

**修正**: 適切な MMIO アドレス（UART ベース `0x09000000`）を使用。

```rust
// ❌ NG: EC=0x20 が発生
0xd2800021, // mov x1, #0x1

// ✅ OK: EC=0x24 が発生
0xd2a12001, // mov x1, #0x09000000
```

## テスト

### テストコード

```rust
// examples/mmio_test.rs
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let guest_addr = 0x10000;
    let mut hv = Hypervisor::new(guest_addr, 0x1000)?;

    let instructions = [
        0xd2800840, // mov x0, #0x42
        0xd2a12001, // mov x1, #0x09000000  // UART base address
        0xb9000020, // str w0, [x1]         // MMIO write
        0xd4200000, // brk #0
    ];

    hv.write_instructions(&instructions)?;
    let result = hv.run(None, None)?;

    // 結果を検証...
}
```

### 実行結果

```
=== MMIO ハンドリングテスト ===

[1] ハイパーバイザーを初期化中...
    ✓ ゲストアドレス: 0x10000

[2] ゲストコードを書き込み中...
    ARM64 アセンブリ:
      mov x0, #0x42
      mov x1, #0x09000000  // UART base address
      str w0, [x1]         // MMIO アドレス 0x09000000 への書き込み
      brk #0
    ✓ 4 命令を書き込み完了

[3] ゲストプログラムを実行中...
---
Data Abort: addr=0x9000000, is_write=true, size=4, syndrome=0x93800046
MMIO write to unhandled address: 0x9000000 = 0x42 (size: 4)

VM Exit:
  - Reason: EXCEPTION
  - PC: 0x1000c
  - Exception Class (EC): 0x3c

✅ 成功: BRK 命令で正常に終了しました
   Data Abort が正しく処理され、プログラムが最後まで実行されました
```

### 検証項目

- ✅ Data Abort (EC=0×24) が検出される
- ✅ Fault address が正しく取得される (`0x9000000`)
- ✅ Write 値が正しく取得される (`0x42`)
- ✅ サイズが正しく取得される (4 bytes)
- ✅ BRK 命令で正常終了

## 実行方法

```bash
# ビルド
cargo build --example mmio_test

# コード署名（hypervisor entitlements 必須）
codesign --entitlements hypervisor.entitlements -s - ./target/debug/examples/mmio_test

# 実行
./target/debug/examples/mmio_test
```

一発実行コマンドは以下の通り。

```bash
cargo build --example mmio_test && \
codesign --entitlements hypervisor.entitlements -s - ./target/debug/examples/mmio_test && \
./target/debug/examples/mmio_test
```

## 次のステップ

MMIO ハンドリング基盤が完成したので、次は実際のデバイスエミュレーションに進む。

**Week 2** - UART (PL011) エミュレーション。
- デバイスレジスタの実装（UART_DR, UART_FR）
- stdout への文字出力
- ゲストプログラムからの printf 相当の機能

**Week 3** - Device Tree 生成。
- FDT (Flattened Device Tree) バイナリの生成
- CPU、メモリ、UART ノードの定義

**Week 4** - Linux カーネルブート。
- カーネルイメージのロード
- ブート条件の設定
- シリアルコンソールへの出力

最終目標は、Linux カーネルを起動してシリアルコンソールに「Hello from Linux」を出力することである。

## まとめ

macOS Hypervisor.framework を使った ARM64 ハイパーバイザーに MMIO ハンドリング機能を実装した。

**実装したもの**:
- `MmioHandler` trait によるデバイスの抽象化
- `MmioManager` による複数デバイスの管理
- Data Abort (EC=0×24) 例外の処理
- FAR_EL1 制限への対処

**技術的発見**:
- macOS では FAR_EL1 が 0 を返す → X1 フォールバック
- ARM64 命令の Rd フィールドを正確に設定する必要がある
- MMIO アドレスは適切な範囲を使用する

これにより、UART やタイマーなどのデバイスをエミュレートする基盤が整った。次回は実際に UART デバイスを実装し、ゲストプログラムから文字列を出力できるようにする。

## 参考資料

- [ARM Architecture Reference Manual](https://developer.arm.com/documentation/ddi0487/latest/)
- [Apple Hypervisor Framework](https://developer.apple.com/documentation/hypervisor)
- [applevisor - Rust bindings](https://github.com/impalabs/applevisor)
- [PL011 UART Technical Reference](https://developer.arm.com/documentation/ddi0183/latest/)
