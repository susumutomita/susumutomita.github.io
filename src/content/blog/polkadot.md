---
title: "Gray Paper Tour: Tokyo with Dr. Gavin Wood"
description: "Gray Paper Tour について講義を聞いてきたのでメモを残しておく"
pubDate: 2024-06-10
category: "intro"
---

## イベントについて

[６/8にGray Paper Tour: Tokyo with Dr. Gavin Woodが開催された](https://haseko-kuma.t.u-tokyo.ac.jp/news/%EF%BC%96-8%E3%81%ABgray-paper-tour-tokyo-with-dr-gavin-wood%E3%81%8C%E9%96%8B%E5%82%AC%E3%81%95%E3%82%8C%E3%81%BE%E3%81%99%E3%80%82/)ので参加してみた。

このイベントは[JAMプロトコルについて書かれたGray Paper](https://graypaper.com/)について作成者である Dr. GavinWood さんが説明してくれるというとても貴重なものです。JAM プロトコルというか[Polkadot](https://polkadot.network/)を触ったことがなかったので、この JAM がどのような課題を解決するかわからない状態での参加だった。

## JAMプロトコルで解決されるもの

基本的には、JAM はパフォーマンスの問題だけでなく、スマートコントラクトやサービス間の非同期通信、データ管理の効率化など、さまざまな問題を解決するものでした。また JAM の普及には、この[Gray Paper](https://graypaper.com/)と資金援助である JAM Prise これは総額 1000 万 DOT トークンを採択されたプログラムに援助するもののようで 100 億円程度と大きな金額に感じられました。しかも何度かステージがあるようで、そのたびに資金提供があるようでした。 [実行環境のJAM Toaster](https://wiki.polkadot.network/docs/learn-jam-chain)の[３つのアプローチ](https://graypaper.com/The_Big_JAM.pdf)を考えているとのこと。特に JAM Toaster は 10Tbps の回線スピードがあるらしく、そんなケーブルあるのだろうかなんておもってしまいました。

### コンセンサスアルゴリズム

Polkadot と同様に、JAM でも BABE (Blind Assignment for Blockchain Extension)と GRANDPA というコンセンサスアルゴリズムが使用されています。GRANDPA は PoS や PoW とは異なり、ブロックの最終性を迅速に達成することを目的としています。また、JAM 独自の SAFROLE というブロック生成アルゴリズムも使用されており、これは SNARK ベースで匿名性とフォークのないブロック生成を提供するもののようです。

### 鍵管理

JAM の鍵管理は、セキュアな非対称鍵暗号を使用して行われます。これにより、ユーザーやスマートコントラクトの公開鍵に基づく安全な取引やメッセージの認証が可能となります。

## JAMの現実世界での応用

[FAQ](https://wiki.polkadot.network/docs/learn-jam-faq)にもあるのですがまだ時期尚早ということで紹介はありませんでした。

## まとめ

生で Dr. Gavin Wood から話を聞けたのはとても良かったです。Polkadot についてもうちょっと触っておこうと思いました。
