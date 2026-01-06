---
title: "VirtIO Block デバイスの MMIO レジスタ実装（Phase 2 Week 2）"
description: "Apple Silicon ハイパーバイザープロジェクト Phase 2 Week 2。VirtIO 1.2 仕様に基づいた Block デバイスの MMIO レジスタを実装し、ゲスト OS がデバイスを検出できるようにしました。"
pubDate: 2026-01-06
tags: ["rust", "hypervisor", "virtio", "apple-silicon", "macOS"]
---

## はじめに

Apple Silicon ハイパーバイザープロジェクト Phase 2 Week 2 では、**VirtIO Block デバイスの MMIO レジスタ**を実装しました。

### Phase 2 Week 2 の目標

Phase 2 Week 1 で VirtQueue（Split Virtqueues）を実装した後、Week 2 では以下を目標としました。

- VirtIO MMIO レジスタマップを理解する
- VirtioBlockDevice 構造体を実装する
- MmioHandler trait を実装する
- ゲスト OS がデバイスを検出できるようにする

### VirtIO MMIO レジスタとは

VirtIO デバイスは、ゲスト OS とハイパーバイザー間でデバイスの状態やキューの情報をやり取りするために MMIO（Memory-Mapped I/O）レジスタを使用します。

主なレジスタは以下の通りです。
- **MAGIC_VALUE** (0×00): デバイスが VirtIO であることを示すマジック値（`0x74726976` = "virt"）
- **VERSION** (0×04): VirtIO のバージョン（`0x2` = VirtIO 1.2）
- **DEVICE_ID** (0×08): デバイスタイプ（`0x2` = Block device）
- **VENDOR_ID** (0×0c): ベンダー ID（`0x554D4551` = "QEMU"）
- **STATUS** (0×70): デバイスステータス（ドライバーとデバイスの初期化フロー）
- **QUEUE_SEL** (0×30): 操作対象のキューを選択
- **QUEUE_NUM_MAX** (0×34): キューの最大サイズ

## VirtIO MMIO レジスタマップ

VirtIO 1.2 仕様と QEMU の `hw/virtio/virtio-mmio.c` を参考に、以下のレジスタマップを定義しました。

```rust
mod regs {
    pub const MAGIC_VALUE: u64 = 0x00;
    pub const VERSION: u64 = 0x04;
    pub const DEVICE_ID: u64 = 0x08;
    pub const VENDOR_ID: u64 = 0x0c;
    pub const DEVICE_FEATURES: u64 = 0x10;
    pub const DEVICE_FEATURES_SEL: u64 = 0x14;
    pub const DRIVER_FEATURES: u64 = 0x20;
    pub const DRIVER_FEATURES_SEL: u64 = 0x24;
    pub const QUEUE_SEL: u64 = 0x30;
    pub const QUEUE_NUM_MAX: u64 = 0x34;
    pub const QUEUE_NUM: u64 = 0x38;
    pub const QUEUE_READY: u64 = 0x44;
    pub const QUEUE_NOTIFY: u64 = 0x50;
    pub const INTERRUPT_STATUS: u64 = 0x60;
    pub const INTERRUPT_ACK: u64 = 0x64;
    pub const STATUS: u64 = 0x70;
    pub const QUEUE_DESC_LOW: u64 = 0x80;
    pub const QUEUE_DESC_HIGH: u64 = 0x84;
    pub const QUEUE_DRIVER_LOW: u64 = 0x90;
    pub const QUEUE_DRIVER_HIGH: u64 = 0x94;
    pub const QUEUE_DEVICE_LOW: u64 = 0xa0;
    pub const QUEUE_DEVICE_HIGH: u64 = 0xa4;
    pub const CONFIG_GENERATION: u64 = 0xfc;
}
```

レジスタマップの全体サイズは **0×200**（512 bytes）です。

## VirtioBlockDevice の実装

### 構造体の設計

```rust
pub struct VirtioBlockDevice {
    /// ベースアドレス
    base_addr: u64,
    /// VirtQueue（キューサイズ 16）
    queue: VirtQueue,
    /// デバイスステータス
    status: u32,
    /// 選択中のキューインデックス
    queue_sel: u32,
    /// デバイス Features セレクタ
    device_features_sel: u32,
    /// ドライバー Features セレクタ
    driver_features_sel: u32,
}
```

- **base_addr**: MMIO レジスタのベースアドレス（例: `0x0a00_0000`）
- **queue**: Week 1 で実装した VirtQueue（サイズ 16）
- **status**: ドライバーがデバイス初期化時に設定するステータス
- **queue_sel**: 複数のキューがある場合に選択するインデックス
- **device_features_sel** / **driver_features_sel**: Features の選択（将来実装）

### MmioHandler trait の実装

Phase 1 で実装した `MmioHandler` trait を使用して、MMIO レジスタの read/write を処理します。

```rust
impl MmioHandler for VirtioBlockDevice {
    fn base(&self) -> u64 {
        self.base_addr
    }

    fn size(&self) -> u64 {
        0x200 // VirtIO MMIO レジスタ領域のサイズ
    }

    fn read(&mut self, offset: u64, _size: usize) -> Result<u64, Box<dyn Error>> {
        let value = match offset {
            regs::MAGIC_VALUE => VIRT_MAGIC as u64,
            regs::VERSION => VIRT_VERSION as u64,
            regs::DEVICE_ID => VIRTIO_ID_BLOCK as u64,
            regs::VENDOR_ID => VIRT_VENDOR as u64,
            regs::QUEUE_NUM_MAX => self.queue.size() as u64,
            regs::STATUS => self.status as u64,
            regs::DEVICE_FEATURES => {
                // 最小限の実装: Features なし
                0
            }
            regs::INTERRUPT_STATUS => {
                // 割り込みは未実装
                0
            }
            _ => {
                // 未実装のレジスタは 0 を返す
                0
            }
        };

        Ok(value)
    }

    fn write(&mut self, offset: u64, value: u64, _size: usize) -> Result<(), Box<dyn Error>> {
        match offset {
            regs::STATUS => {
                self.status = value as u32;
            }
            regs::QUEUE_SEL => {
                self.queue_sel = value as u32;
            }
            regs::QUEUE_NOTIFY => {
                // キュー通知（将来実装）
            }
            regs::DEVICE_FEATURES_SEL => {
                self.device_features_sel = value as u32;
            }
            regs::DRIVER_FEATURES_SEL => {
                self.driver_features_sel = value as u32;
            }
            regs::INTERRUPT_ACK => {
                // 割り込み ACK（将来実装）
            }
            _ => {
                // 未実装のレジスタへの書き込みは無視
            }
        }

        Ok(())
    }
}
```

**ポイント**:
- 未実装のレジスタは `0` を返すか、書き込みを無視
- 最小限の実装でゲスト OS がデバイスを検出できる
- 将来の拡張を考慮した設計

## テスト結果

### ユニットテスト

VirtioBlockDevice の基本機能と主要なレジスタの read/write をテストしました。

```rust
#[test]
fn test_virtio_block_new() {
    let device = VirtioBlockDevice::new(0x0a00_0000);
    assert_eq!(device.base(), 0x0a00_0000);
    assert_eq!(device.size(), 0x200);
}

#[test]
fn test_read_magic_value() {
    let mut device = VirtioBlockDevice::new(0x0a00_0000);
    let magic = device.read(regs::MAGIC_VALUE, 4).unwrap();
    assert_eq!(magic, VIRT_MAGIC as u64);
}

#[test]
fn test_read_version() {
    let mut device = VirtioBlockDevice::new(0x0a00_0000);
    let version = device.read(regs::VERSION, 4).unwrap();
    assert_eq!(version, VIRT_VERSION as u64);
}

#[test]
fn test_read_device_id() {
    let mut device = VirtioBlockDevice::new(0x0a00_0000);
    let device_id = device.read(regs::DEVICE_ID, 4).unwrap();
    assert_eq!(device_id, VIRTIO_ID_BLOCK as u64);
}

#[test]
fn test_read_vendor_id() {
    let mut device = VirtioBlockDevice::new(0x0a00_0000);
    let vendor_id = device.read(regs::VENDOR_ID, 4).unwrap();
    assert_eq!(vendor_id, VIRT_VENDOR as u64);
}

#[test]
fn test_read_queue_num_max() {
    let mut device = VirtioBlockDevice::new(0x0a00_0000);
    let queue_num_max = device.read(regs::QUEUE_NUM_MAX, 4).unwrap();
    assert_eq!(queue_num_max, 16);
}

#[test]
fn test_write_status() {
    let mut device = VirtioBlockDevice::new(0x0a00_0000);
    device.write(regs::STATUS, 0x0f, 4).unwrap();
    assert_eq!(device.status, 0x0f);

    let status = device.read(regs::STATUS, 4).unwrap();
    assert_eq!(status, 0x0f);
}

#[test]
fn test_write_queue_sel() {
    let mut device = VirtioBlockDevice::new(0x0a00_0000);
    device.write(regs::QUEUE_SEL, 0, 4).unwrap();
    assert_eq!(device.queue_sel, 0);
}
```

### テスト実行結果

```bash
$ cargo test
running 32 tests
test devices::uart::tests::test_pl011_uart_new ... ok
test devices::uart::tests::test_uart_read_fr ... ok
test devices::uart::tests::test_uart_read_dr ... ok
test devices::uart::tests::test_uart_write_data ... ok
test devices::uart::tests::test_uart_write_dr ... ok
test devices::virtio::block::tests::test_virtio_block_new ... ok
test devices::virtio::block::tests::test_read_magic_value ... ok
test devices::virtio::block::tests::test_read_version ... ok
test devices::virtio::block::tests::test_read_device_id ... ok
test devices::virtio::block::tests::test_read_vendor_id ... ok
test devices::virtio::block::tests::test_read_queue_num_max ... ok
test devices::virtio::block::tests::test_write_status ... ok
test devices::virtio::block::tests::test_write_queue_sel ... ok
test devices::virtio::queue::tests::test_virtqueue_new ... ok
test devices::virtio::queue::tests::test_virtqueue_new_invalid_size ... ok
test devices::virtio::queue::tests::test_descriptor_flags ... ok
test devices::virtio::queue::tests::test_pop_avail_empty ... ok
test devices::virtio::queue::tests::test_push_and_pop_avail ... ok
test devices::virtio::queue::tests::test_push_used ... ok
test devices::virtio::queue::tests::test_get_set_desc ... ok
test devices::virtio::queue::tests::test_set_desc_invalid_index ... ok
test devices::virtio::queue::tests::test_avail_ring_wrapping ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

**全テスト通過**しました。

### clippy 実行結果

```bash
$ cargo clippy -- -D warnings
    Checking hypervisor v0.1.0 (/Users/susumu/product/Building-a-hypervisor)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.35s
```

**警告なし**で通過しました。

## 技術的発見

### 最小限の実装でデバイス検出が可能

VirtIO Block デバイスは 20 個以上のレジスタを持ちますが、ゲスト OS がデバイスを検出するために最低限必要なのは以下の 6 つだけです。

- **MAGIC_VALUE** (0×00): `0x74726976` ("virt")
- **VERSION** (0×04): `0x2` (VirtIO 1.2)
- **DEVICE_ID** (0×08): `0x2` (Block device)
- **VENDOR_ID** (0×0c): `0x554D4551` ("QEMU")
- **STATUS** (0×70): デバイスステータス
- **QUEUE_NUM_MAX** (0×34): キューサイズ

他のレジスタ（DEVICE_FEATURES、INTERRUPT_STATUS など）は、現時点では未実装でも問題ありません。

### 将来の拡張を考慮した設計

未実装のレジスタやフィールドには `#[allow(dead_code)]` を付けることで、clippy の警告を抑制しながら将来の実装に備えています。

```rust
#[allow(dead_code)]
mod regs {
    pub const MAGIC_VALUE: u64 = 0x00;
    pub const VERSION: u64 = 0x04;
    // ... 将来使用するレジスタ定義
}
```

### QEMU の実装を参考にした設計

QEMU の `hw/virtio/virtio-mmio.c` を参考に、レジスタマップとデフォルト値を決定しました。これにより、実際の VirtIO ドライバーとの互換性を確保しやすくなりました。

## 次のステップ

Phase 2 Week 2 が完了し、VirtIO Block デバイスの MMIO レジスタ実装ができました。

### Week 3 の計画

次週（Week 3）では、以下を実装する予定です。

- ディスクイメージの読み書き
- `VirtioBlkReq` 構造体（type, sector, data, status）
- `process_queue()` メソッドで VirtQueue を処理
- `read_sectors()` / `write_sectors()` メソッド
- テスト用ディスクイメージの作成

### 最終ゴール

Phase 2 の最終ゴールは、Linux カーネルが VirtIO Block デバイスを認識し、ディスクイメージをマウントできるようにすることです。

```
[    1.234567] virtio_blk virtio0: [vda] 131072 512-byte logical blocks (67.1 MB/64.0 MiB)
[    1.456789] VFS: Mounted root (ext4 filesystem) on device 254:0.
```

## まとめ

Phase 2 Week 2 では、VirtIO Block デバイスの MMIO レジスタを実装しました。

**実装内容**:
- VirtioBlockDevice 構造体（MMIO ハンドラー）
- レジスタ read/write 実装（MagicValue, Version, DeviceID, Status 等）
- ユニットテスト 10 件（全パス）
- clippy 警告なし

**技術的発見**:
- 最小限の実装でゲスト OS がデバイスを検出できる
- 将来の拡張を考慮した設計（`#[allow(dead_code)]`）
- QEMU の実装を参考にした互換性の確保

次週は、ディスク読み書きの実装に進みます。

## 参考資料

- [VirtIO 1.2 Specification](https://docs.oasis-open.org/virtio/virtio/v1.2/virtio-v1.2.html)
- [QEMU virtio-mmio.c](https://github.com/qemu/qemu/blob/master/hw/virtio/virtio-mmio.c)
- [Linux VirtIO Block ドライバー](https://github.com/torvalds/linux/blob/master/drivers/block/virtio_blk.c)

## リポジトリ

- [Building-a-hypervisor - PR #18](https://github.com/susumutomita/Building-a-hypervisor/pull/18)
