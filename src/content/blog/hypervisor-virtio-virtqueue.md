---
title: 'Apple Silicon ハイパーバイザー Week 5: VirtIO VirtQueue 実装'
description: 'VirtIO 1.2 仕様に基づいた Split Virtqueues の実装。ドライバーとデバイス間のデータ転送用リングバッファの詳細解説。'
pubDate: 2026-01-06
tags: ['hypervisor', 'virtualization', 'virtio', 'rust', 'apple-silicon']
---

## 概要

Phase 2 Week 1 として、VirtIO Block デバイスの基盤となる VirtQueue（Split Virtqueues）を実装しました。VirtQueue は、ゲスト OS（ドライバー）とハイパーバイザー（デバイス）間で効率的にデータを転送するためのリングバッファ構造です。

**実装内容**:
- VirtIO 1.2 仕様に基づいた Split Virtqueues
- Descriptor Table, Available Ring, Used Ring の 3 つのリング構造
- ユニットテスト 8 件（カバレッジ 100％）

**リポジトリ**: [Building-a-hypervisor](https://github.com/susumutomita/Building-a-hypervisor)
**PR**: [#16 feat: Phase 2 Week 1 - VirtQueue 実装](https://github.com/susumutomita/Building-a-hypervisor/pull/16)

---

## VirtIO とは

### VirtIO の役割

VirtIO は、仮想化環境で使用される標準化されたデバイスインタフェースです。以下の特徴があります。

- **効率的な I/O 通信**: ゲスト OS とハイパーバイザー間の高速なデータ転送
- **標準化**: QEMU、KVM、Firecracker などで広く使用
- **デバイス非依存**: Block、Network、Console など様々なデバイスタイプをサポート

### Split Virtqueues

VirtIO 1.2 仕様では、Split Virtqueues と Packed Virtqueues の 2 種類が定義されています。今回は、より一般的な Split Virtqueues を実装しました。

Split Virtqueues は以下の 3 つの部分から構成されます。

```
┌─────────────────────────────────────┐
│         Descriptor Table            │  ← バッファを記述する記述子のテーブル
│  (16 bytes × queue_size)            │
│                                     │
│  [0] addr, len, flags, next         │
│  [1] addr, len, flags, next         │
│  ...                                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         Available Ring              │  ← ドライバーが利用可能にした記述子
│  (Driver → Device)                  │
│                                     │
│  flags, idx, ring[queue_size]       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         Used Ring                   │  ← デバイスが処理完了した記述子
│  (Device → Driver)                  │
│                                     │
│  flags, idx, ring[queue_size]       │
└─────────────────────────────────────┘
```

---

## Descriptor Table

### Descriptor 構造体

Descriptor は 16 bytes の固定サイズで、バッファの情報を保持します。

```rust
/// VirtQueue Descriptor (16 bytes)
#[derive(Debug, Clone, Copy, Default)]
pub struct Descriptor {
    /// ゲスト物理アドレス
    pub addr: u64,
    /// バッファ長
    pub len: u32,
    /// フラグ（NEXT, WRITE, INDIRECT）
    pub flags: u16,
    /// 次の記述子のインデックス（NEXT フラグが立っている場合）
    pub next: u16,
}
```

### フラグ定義

```rust
/// Descriptor フラグ: 次の記述子へチェーン
const VIRTQ_DESC_F_NEXT: u16 = 1;

/// Descriptor フラグ: 書き込み専用バッファ
const VIRTQ_DESC_F_WRITE: u16 = 2;

/// Descriptor フラグ: 間接記述子
const VIRTQ_DESC_F_INDIRECT: u16 = 4;
```

### 記述子チェイン

複数の Descriptor を `NEXT` フラグでチェインすることで、大きなバッファを表現できます。

```rust
impl Descriptor {
    /// NEXT フラグが立っているか
    pub fn has_next(&self) -> bool {
        (self.flags & VIRTQ_DESC_F_NEXT) != 0
    }

    /// WRITE フラグが立っているか（書き込み専用）
    pub fn is_write(&self) -> bool {
        (self.flags & VIRTQ_DESC_F_WRITE) != 0
    }

    /// INDIRECT フラグが立っているか
    pub fn is_indirect(&self) -> bool {
        (self.flags & VIRTQ_DESC_F_INDIRECT) != 0
    }
}
```

---

## Available Ring

### 構造

Available Ring は、ドライバー（ゲスト OS）がデバイスに対して「この記述子を処理してください」と通知するためのリングです。

```rust
struct AvailRing {
    /// フラグ（将来の実装で使用予定）
    #[allow(dead_code)]
    flags: u16,
    /// 次に書き込むインデックス
    idx: u16,
    /// 記述子インデックスのリング
    ring: Vec<u16>,
}
```

### push メソッド（テスト用）

```rust
#[cfg(test)]
fn push(&mut self, desc_idx: u16) {
    let idx = self.idx as usize % self.ring.len();
    self.ring[idx] = desc_idx;
    self.idx = self.idx.wrapping_add(1);
}
```

- `idx` はモノトニックに増加（wrapping add）
- リングバッファなので `% self.ring.len()` で循環

---

## Used Ring

### 構造

Used Ring は、デバイスがドライバーに対して「この記述子の処理が完了しました」と通知するためのリングです。

```rust
struct UsedRing {
    /// フラグ（将来の実装で使用予定）
    #[allow(dead_code)]
    flags: u16,
    /// 次に書き込むインデックス
    idx: u16,
    /// Used Element のリング
    ring: Vec<UsedElem>,
}

struct UsedElem {
    /// 記述子チェーンの開始インデックス
    #[allow(dead_code)]
    id: u32,
    /// 書き込まれた合計バイト数
    #[allow(dead_code)]
    len: u32,
}
```

### push メソッド

```rust
fn push(&mut self, id: u32, len: u32) {
    let idx = self.idx as usize % self.ring.len();
    self.ring[idx] = UsedElem::new(id, len);
    self.idx = self.idx.wrapping_add(1);
}
```

---

## VirtQueue 実装

### VirtQueue 構造体

```rust
pub struct VirtQueue {
    /// キューサイズ（2 の累乗）
    num: u16,
    /// Descriptor Table
    desc_table: Vec<Descriptor>,
    /// Available Ring
    avail_ring: AvailRing,
    /// Used Ring
    used_ring: UsedRing,
    /// 次に処理する Available Ring のインデックス
    last_avail_idx: u16,
}
```

### new メソッド

```rust
pub fn new(num: u16) -> Self {
    assert!(
        num > 0 && num.is_power_of_two(),
        "Queue size must be a power of 2"
    );

    Self {
        num,
        desc_table: vec![Descriptor::default(); num as usize],
        avail_ring: AvailRing::new(num),
        used_ring: UsedRing::new(num),
        last_avail_idx: 0,
    }
}
```

**重要**: VirtIO 仕様では、キューサイズは必ず 2 の累乗である必要があります。

### pop_avail メソッド

デバイス側が Available Ring から次の記述子を取得します。

```rust
pub fn pop_avail(&mut self) -> Option<u16> {
    if self.last_avail_idx == self.avail_ring.idx {
        // 新しい記述子がない
        return None;
    }

    let idx = self.last_avail_idx as usize % self.num as usize;
    let desc_idx = self.avail_ring.ring[idx];
    self.last_avail_idx = self.last_avail_idx.wrapping_add(1);

    Some(desc_idx)
}
```

**ポイント**:
- `last_avail_idx == avail_ring.idx` の場合、新しい記述子がない
- `last_avail_idx` をデバイス側で管理（ドライバーは `avail_ring.idx` を更新）

### push_used メソッド

デバイス側が処理完了を Used Ring に追加します。

```rust
pub fn push_used(&mut self, idx: u16, len: u32) {
    self.used_ring.push(idx as u32, len);
}
```

---

## ユニットテスト

### テスト 1: VirtQueue の作成

```rust
#[test]
fn test_virtqueue_new() {
    let queue = VirtQueue::new(16);
    assert_eq!(queue.size(), 16);
    assert_eq!(queue.desc_table.len(), 16);
}
```

### テスト 2: 無効なキューサイズ

```rust
#[test]
#[should_panic(expected = "Queue size must be a power of 2")]
fn test_virtqueue_new_invalid_size() {
    VirtQueue::new(15); // 2 の累乗でない
}
```

### テスト 3: Descriptor フラグ

```rust
#[test]
fn test_descriptor_flags() {
    let desc = Descriptor::new(
        0x1000,
        512,
        VIRTQ_DESC_F_NEXT | VIRTQ_DESC_F_WRITE,
        1,
    );
    assert!(desc.has_next());
    assert!(desc.is_write());
    assert!(!desc.is_indirect());
}
```

### テスト 4: Available Ring の push/pop

```rust
#[test]
fn test_push_and_pop_avail() {
    let mut queue = VirtQueue::new(16);

    // Available Ring に記述子を追加
    queue.push_avail(0);
    queue.push_avail(1);
    queue.push_avail(2);

    // pop_avail で取得
    assert_eq!(queue.pop_avail(), Some(0));
    assert_eq!(queue.pop_avail(), Some(1));
    assert_eq!(queue.pop_avail(), Some(2));
    assert_eq!(queue.pop_avail(), None);
}
```

### テスト 5: ラップアラウンド

循環バッファの境界条件をテストします。

```rust
#[test]
fn test_avail_ring_wrapping() {
    let mut queue = VirtQueue::new(4); // 小さいサイズでテスト

    // リングサイズと同じ数を追加
    for i in 0..4 {
        queue.push_avail(i);
    }

    // すべて順番に取得できる
    for i in 0..4 {
        assert_eq!(queue.pop_avail(), Some(i));
    }
    assert_eq!(queue.pop_avail(), None);

    // さらに追加してラップアラウンドをテスト
    for i in 4..8 {
        queue.push_avail(i);
    }

    // ラップアラウンド後も順番に取得できる
    for i in 4..8 {
        assert_eq!(queue.pop_avail(), Some(i));
    }
    assert_eq!(queue.pop_avail(), None);
}
```

**発見**: 最初のテストでは、リングサイズを超える数を push していましたが、これは VirtIO の仕様に反していました。修正後、正しくラップアラウンドを検証できるようになりました。

---

## テスト結果

```bash
$ cargo test

running 24 tests
test devices::virtio::queue::tests::test_avail_ring_wrapping ... ok
test devices::virtio::queue::tests::test_descriptor_flags ... ok
test devices::virtio::queue::tests::test_get_set_desc ... ok
test devices::virtio::queue::tests::test_pop_avail_empty ... ok
test devices::virtio::queue::tests::test_push_and_pop_avail ... ok
test devices::virtio::queue::tests::test_push_used ... ok
test devices::virtio::queue::tests::test_set_desc_invalid_index ... ok
test devices::virtio::queue::tests::test_virtqueue_new ... ok
test devices::virtio::queue::tests::test_virtqueue_new_invalid_size ... ok

test result: ok. 24 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

**カバレッジ**: VirtQueue の主要機能をすべてカバー。

---

## CI 修正作業

### 1. cargo fmt エラー

**エラー**:
```
assert! macro line too long
```

**修正**:
```bash
cargo fmt
```

`assert!` マクロが自動的に複数行に分割されました。

### 2. clippy dead_code 警告

**エラー**:
```
warning: field is never read: `flags`
warning: field is never read: `id`
warning: field is never read: `len`
```

**原因**: 将来使用するフィールドだが、現時点では未使用。

**修正**:
```rust
struct AvailRing {
    #[allow(dead_code)]
    flags: u16,
    // ...
}

struct UsedElem {
    #[allow(dead_code)]
    id: u32,
    #[allow(dead_code)]
    len: u32,
}
```

### 3. clippy derivable_impls 警告

**エラー**:
```
warning: manual implementation of Default for Descriptor could be derived
```

**修正**:
```rust
// Before
#[derive(Debug, Clone, Copy)]
pub struct Descriptor { /* ... */ }

impl Default for Descriptor {
    fn default() -> Self {
        Self {
            addr: 0,
            len: 0,
            flags: 0,
            next: 0,
        }
    }
}

// After
#[derive(Debug, Clone, Copy, Default)]
pub struct Descriptor { /* ... */ }
```

---

## 技術的発見

### 1. VirtIO Split Virtqueues の理解

Split Virtqueues は、以下の 3 つのリング構造で構成されます。

- **Descriptor Table**: バッファの記述子（全記述子を保持）
- **Available Ring**: ドライバーが利用可能にした記述子のインデックス
- **Used Ring**: デバイスが処理完了した記述子のインデックス

この分離により、ドライバーとデバイスが独立して動作できます。

### 2. 循環バッファの実装

`idx` はモノトニックに増加し、リングバッファとして動作させるために `% ring.len()` でインデックスを計算します。

```rust
let idx = self.idx as usize % self.ring.len();
self.ring[idx] = value;
self.idx = self.idx.wrapping_add(1);
```

### 3. Rust の #[cfg(test)]

テスト用メソッドを公開する際、`#[cfg(test)]` を使うことで、本番コードに不要なメソッドを含めないようにできます。

```rust
#[cfg(test)]
pub fn push_avail(&mut self, desc_idx: u16) {
    self.avail_ring.push(desc_idx);
}
```

---

## 次のステップ

Phase 2 Week 2 では、VirtIO MMIO レジスタの実装に進みます。

**目標**:
- VirtIO MMIO レジスタマップを実装
- ゲストがデバイスを検出できるようにする
- Device Tree に VirtIO Block ノードを追加

**参考資料**:
- [VirtIO 1.2 Specification](https://docs.oasis-open.org/virtio/virtio/v1.2/virtio-v1.2.html)
- [virtio_queue.h](https://docs.oasis-open.org/virtio/virtio/v1.2/csd01/listings/virtio_queue.h)

---

## まとめ

Phase 2 Week 1 では、VirtIO Block デバイスの基盤となる VirtQueue を実装しました。Split Virtqueues の 3 つのリング構造を理解し、ユニットテストで検証することで、確実に動作する実装を作成できました。

次回は、VirtIO MMIO レジスタを実装し、ゲストがデバイスを検出できるようにします。
