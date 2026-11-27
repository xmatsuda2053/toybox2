# Changelog (HubOffice)

本ファイルは HubOffice のリリース履歴を記録します。

## [v0.1.0] - 2026-11-27

### 初回運用テストリリース（v0.1.0）

事務作業で役立つオフラインツールをブラウザのサイドパネルで一元管理・切り替え利用できる Chrome / Edge 向け拡張機能 **HubOffice** の初回運用テスト版リリースです。

### 主な機能

- **西暦・和暦相互変換ツール** ([#590](https://github.com/xmatsuda2053/toybox2/issues/590), [#591](https://github.com/xmatsuda2053/toybox2/issues/591))
  - 西暦カレンダー選択および和暦入力（漢字フル表記・1 文字略記・英字略記・連続数字・年/年月のみ等）による双方向変換とワンクリックコピーに対応。
  - カレンダー選択（`datepicker-input`）では「日 ⇄ 月 ⇄ 年」ビュー切替・元号クイックジャンプ（令和〜明治）・西暦年直接入力に対応し、昭和・平成初期・明治等の日付も素早く選択可能。
- **QR コード生成ツール** ([#590](https://github.com/xmatsuda2053/toybox2/issues/590))
  - URL やテキストからオフラインで QR コードを即時生成し、複数サイズでの PNG ダウンロード・コピーに対応。
- **サイドパネル操作性とカスタマイズ** ([#590](https://github.com/xmatsuda2053/toybox2/issues/590), [#594](https://github.com/xmatsuda2053/toybox2/issues/594), [#595](https://github.com/xmatsuda2053/toybox2/issues/595))
  - ツール一覧ホーム画面、よく使うツールのピン留め機能、ショートカット（`Alt+Shift+O`）による Side Panel 開閉トグル、ライト／ダーク／システムテーマ切替を搭載。
