# Changelog (Step-Note Migrator)

本ファイルは Step-Note Migrator のリリース履歴を記録します。

## [v1.0.1] - 2026-11-27

### 不具合修正

- **移行データ出力時の主キー `id` を数値型へ正規化** ([#584](https://github.com/xmatsuda2053/toybox2/issues/584))
  - 旧 Step-Note（SnDB）のバックアップ JSON で文字列型の連番（`"1"`, `"10"` 等）として保持されていた各テーブル（`tasks`, `logs`, `notes`, `labels`, `quickAccess`, `scratches`）の主キー `id` を、新 Step-Note のスキーマ仕様に合わせて数値型へ変換して出力するよう修正しました。

## [v1.0.0] - 2026-11-27

### 初回正式リリース（v1.0.0）

旧 Step-Note（SnDB）のバックアップ JSON を新 Step-Note 形式（Dexie v4）へオフライン変換するデータ移行ツール **Step-Note Migrator** の初回正式リリースです。

### 主な機能

- **ブラウザ完結・単一 HTML 動作**: 外部サーバーへ一切通信せず、ローカル環境で安全にバックアップ JSON を変換
- **ドラッグ＆ドロップ／ファイル選択による一括変換**: タスク・作業ログ・メモ・分類ラベル・共通メモ（スクラッチ）・クイックアクセス設定を新形式へ自動マッピングし、空メモ・空関係者をクリーンアップ（`statusCode` 数値正規化を含む）
- **変換サマリー表示と自動ダウンロード**: 移行対象件数・除外件数のサマリーテーブル表示、新形式バックアップ JSON（`stepnote_backup_YYYYMMDD_HHmmss.json`）の自動ダウンロードおよび再ダウンロード機能
- **フッターへのバージョン表示**: ビルド時埋め込みによるバージョン表記（`Step-Note Migrator v1.0.0`）に対応
