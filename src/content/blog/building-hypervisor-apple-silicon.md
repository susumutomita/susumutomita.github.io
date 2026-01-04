---
title: "macOS で Apple Silicon 向けハイパーバイザーを実装した - Hypervisor.framework で VM を作る"
description: "macOS の Hypervisor.framework を使って Rust で Apple Silicon 向けハイパーバイザーを実装。ARM64 ゲストプログラムの作成、VM Entry/Exit メカニズム、Fibonacci 数列計算の例を通じて仮想化技術の基礎を学ぶ。"
pubDate: 2026-01-04
category: "system"
---

## きっかけ

[KVM ベースのハイパーバイザー構築記事](https://iovec.net/2024-01-29)を読んで、「macOS でもハイパーバイザーを作れるのではないか」と思った。

調べてみると、macOS には `Hypervisor.framework` という公式の仮想化フレームワークがあり、Apple Silicon（M1/M2/M3）で使える。さらに Rust バインディングの [applevisor](https://github.com/impalabs/applevisor) も存在する。

これを使えば、KVM の記事と同様に Apple Silicon で動くハイパーバイザーを作れそうだ。

## 実装したもの

GitHub: [Building-a-hypervisor](https://github.com/susumutomita/Building-a-hypervisor)

### 基本構成

- **言語**: Rust
- **フレームワーク**: macOS Hypervisor.framework（applevisor 経由）
- **アーキテクチャ**: ARM64（Apple Silicon）
- **ゲストプログラム**: ARM64 機械語

### 共通ライブラリ (`src/lib.rs`)

ゲストプログラムを簡単に作成できる `Hypervisor` 構造体を提供している。

```rust
pub struct Hypervisor {
    vm: VirtualMachine,
    vcpu: Vcpu,
    mapping: Mapping,
    guest_addr: u64,
}
```

主な機能。

- `new(guest_addr, mem_size)`: VM とメモリを初期化
- `write_instructions(&[u32])`: ARM64 命令列を書き込み
- `write_data(offset, value)`: ゲストメモリにデータを書き込み
- `read_data(offset)`: ゲストメモリからデータを読み込み
- `run(max_iterations, step_callback)`: vCPU を実行

### Fibonacci 数列計算の例

VM 内で Fibonacci 数列を計算するゲストプログラムを実装した。

```rust
let instructions = [
    0xd2800000, // mov x0, #0       ; F(0) = 0
    0xd2800021, // mov x1, #1       ; F(1) = 1
    0xd2800142, // mov x2, #10      ; カウンタ = 10
    0x8b010003, // add x3, x0, x1   ; loop: x3 = x0 + x1
    0xaa0103e0, // mov x0, x1       ; x0 = x1
    0xaa0303e1, // mov x1, x3       ; x1 = x3
    0xd1000442, // sub x2, x2, #1   ; x2--
    0xb5ffff82, // cbnz x2, loop    ; if x2 != 0, continue
    0xd4200000, // brk #0           ; VM Exit
];
```

**実行結果**:

```
=== Fibonacci 数列計算デモ ===

[1] ハイパーバイザーを初期化中...
    ✓ ゲストアドレス: 0x10000
[2] ゲストコードを書き込み中...
    ✓ 9 命令を書き込み完了
[3] ゲストプログラムを実行中...

---
VM Exit:
  - Reason: EXCEPTION
  - PC: 0x10020

レジスタ:
  - X0: 55 (F(10))
  - X1: 89 (F(11))
  - X2: 0 (ループカウンタ)

✓ 計算結果: F(10) = 55
  (期待値: 55)

✅ 正しい結果です！
```

## 実装の流れ

### 1. VM とメモリの初期化

```rust
let guest_addr = 0x10000;
let mut hv = Hypervisor::new(guest_addr, 0x2000)?; // 8KB
```

Hypervisor.framework を使って仮想マシン（VM）と vCPU を作成し、ゲスト用のメモリ領域をマッピングする。

### 2. ARM64 命令の書き込み

```rust
hv.write_instructions(&instructions)?;
```

ゲストメモリに ARM64 機械語命令を書き込む。命令は 32-bit リトルエンディアン形式。

### 3. vCPU の実行

```rust
let result = hv.run(None, None)?;
```

vCPU を実行し、`BRK` 命令で VM Exit が発生するまでゲストコードを実行する。

### 4. レジスタ状態の取得

```rust
println!("X0: {} (F(10))", result.registers[0]);
```

VM Exit 時のレジスタ状態を取得し、計算結果を検証する。

## ARM64 命令のエンコーディング

ARM64 命令は 32-bit の固定長。例えば `mov x0, #0` は以下のようにエンコードされる。

```
0xd2800000 = 1101 0010 1000 0000 0000 0000 0000 0000
             │    │    │         │              │
             │    │    │         │              └─ Rd = X0 (0b00000)
             │    │    │         └──────────────── imm16 = 0 (0x0000)
             │    │    └────────────────────────── hw = 0 (lsl #0)
             │    └─────────────────────────────── opc = 10 (MOVZ)
             └──────────────────────────────────── sf = 1 (64-bit)
```

詳細は [ARM64 Architecture Reference Manual](https://developer.arm.com/documentation/ddi0487/latest/) 参照。

## VM Entry/Exit のメカニズム

### VM Entry

1. ホスト（macOS）がゲストの実行を開始
2. CPU が Exception Level を EL1（ゲスト）に切り替え
3. ゲストコードが実行される

### VM Exit

1. ゲストで例外が発生（例: BRK 命令）
2. CPU が自動的に EL2（ハイパーバイザー）に戻る
3. ESR_EL2（Exception Syndrome Register）に例外情報を記録
4. ホストが例外を処理

```rust
if let Some(syndrome) = result.exception_syndrome {
    let ec = (syndrome >> 26) & 0x3f; // Exception Class
    if ec == 0x3c {
        println!("✓ BRK 命令を検出！");
    }
}
```

## ハマったポイント

### 1. コード署名が必要

macOS では Hypervisor.framework を使用するために、バイナリへのコード署名が必須。

```bash
# entitlements.plist を作成
cat > /tmp/entitlements.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.hypervisor</key>
    <true/>
</dict>
</plist>
EOF

# バイナリに署名
codesign --entitlements /tmp/entitlements.plist -s - target/debug/hypervisor
```

### 2. レジスタの列挙

`Reg` 型が加算をサポートしていないため、ループで読み取れない。

```rust
// ❌ 動かない
for i in 0..31 {
    registers[i] = self.vcpu.get_reg(Reg::X0 + i as u16)?;
}

// ✅ 明示的に列挙する必要がある
let registers = [
    self.vcpu.get_reg(Reg::X0)?,
    self.vcpu.get_reg(Reg::X1)?,
    // ... X30 まで
];
```

### 3. ARM64 の即値エンコーディング

`MOVZ` 命令は `lsl` の値が 0, 16, 32, 48 のみサポート。

```rust
// ❌ これは無効
// movz x0, #0x102, lsl #8

// ✅ 正しい方法
// movz x0, #0x1, lsl #16    ; x0 = 0x10000
// movk x0, #0x200, lsl #0   ; x0 = 0x10200
```

## 学んだこと

### 仮想化の仕組み

- VM Entry/Exit は CPU の Exception Level 切り替えで実現される
- ゲストの状態（レジスタ、PC）はホストが管理する
- 例外が発生すると自動的にホストに戻る

### ARM64 アーキテクチャ

- 命令は 32-bit 固定長
- 即値のエンコーディングには制限がある（MOVZ の lsl など）
- 条件分岐は PC 相対オフセットで実現

### Rust での低レベルプログラミング

- `Box<dyn Error>` で柔軟なエラー処理
- `unsafe` を使わずに仮想化フレームワークを操作できる
- 型安全性を保ちながら機械語を扱える

## まとめ

macOS の Hypervisor.framework を使って、Apple Silicon 向けのハイパーバイザーを実装した。

KVM ベースの記事と同じように、VM の作成、メモリマッピング、ゲストコードの実行、VM Exit のハンドリングという基本的な流れを学べた。

次は以下のような拡張を考えている。

- メモリアクセスを含むゲストプログラム（現在は ARM64 エンコーディングの問題で保留中）
- マルチコア対応（複数 vCPU）
- デバイスエミュレーション（UART など）
- ページテーブルの設定（Stage-2 変換）

低レベルのシステムプログラミングに興味がある人は、ぜひ試してみてほしい。

## 参考資料

- [Building a hypervisor - Part 1: Hello, World!](https://iovec.net/2024-01-29) - 元記事（KVM ベース）
- [applevisor](https://github.com/impalabs/applevisor) - Apple Silicon 向け Hypervisor.framework バインディング
- [Apple Hypervisor Documentation](https://developer.apple.com/documentation/hypervisor)
- [ARM64 Architecture Reference Manual](https://developer.arm.com/documentation/ddi0487/latest/)
- [GitHub Repository](https://github.com/susumutomita/Building-a-hypervisor)
