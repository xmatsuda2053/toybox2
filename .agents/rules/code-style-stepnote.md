---
trigger: always_on
---

# プロジェクト固有開発ルール（Project Rules: Step-Note）

## 適用スコープ（Scope）
- **対象**: 本ルールは `apps/stepnote/` 配下のアプリケーションコード、画面設計、および関連する実装作業にのみ適用する。
- **除外**: モノレポ直下の共通パッケージ（`packages/*`）や、今後追加される他の独立アプリケーション（`apps/other-app/` 等）の個別設計には、本ルールのレイアウト規約や特定モデル仕様を適用しないこと。

---

## 1. プロジェクト概要・基本設計思想
- **完全スタンドアロン・オフライン前提**:
  - 外部ネットワークへの通信、オンライン前提の外部依存ライブラリ、外部CDN（`<script src="https://...">` 等）を一切追加しないこと。
  - ビルド成果物は `vite-plugin-singlefile` による単一HTML（Single File）出力とし、ローカル環境で自立動作することを前提とする。
- **モノレポ構成の遵守**:
  - 共通処理・純粋関数（日付、文字列、数値操作等）は `packages/utils` 等の共通パッケージへ集約し、特定アプリ（`apps/stepnote`）内に閉じた重複実装を作らないこと。
- **UIフォント指定**:
  - 欧文と数字には Windows 標準の `Segoe UI` を優先し、日本語には視認性の高い `BIZ UD Gothic`（または一覧性に優れた `Yu Gothic UI`）を適用すること。
  - 推奨指定: `font-family: 'Segoe UI', 'BIZ UD Gothic', 'Yu Gothic UI', Meiryo, sans-serif;`

## 2. 画面レイアウト・ペイン構成方針（4ペイン）
画面全体は左から **「Navigation」「Task List」「Task」「Journal」** の4ペインで構成する。

- **1. Navigation（最左ペイン）**:
  - `width` は固定サイズとする。
  - 内部を上下2分割で構成する。
    - **上部（Quick Access）**: 制御ボタンによる開閉（トグル折りたたみ）が可能。
    - **下部（Labels）**: `overflow` 発生時は垂直スクロール。
  - 制御ボタンにより、Navigation エリア全体の表示・非表示を切り替え可能とする。
- **2. Task List（第2ペイン）**:
  - `width` は固定サイズとする。
  - `overflow` 発生時は垂直スクロール。
  - 制御ボタンにより、Task List エリアの表示・非表示を切り替え可能とする。
- **3. Task ＆ 4. Journal（第3・第4ペイン）**:
  - Navigation および Task List を配置した**残りの横幅を均等（1:1）に分割**して表示する（例: `flex: 1` 同士、または `grid-template-columns: 1fr 1fr`）。
  - 各エリア内部は独立して `overflow` 時にスクロール可能とする。
  - Task, Journal エリアは常時表示とする（ドロワー開閉等の非表示化は行わない）。

## 3. 開閉状態管理（LayoutUIController）
- Navigation Area および Task List Area の表示・非表示、ならびに Quick Access の上下開閉状態は `LayoutUIController`（`apps/stepnote/src/controllers/layout-ui.controller.ts`）で一元管理する。
- Lit コンポーネント側に直接開閉フラグを持たせず、`LayoutState`（`isNavigationAreaOpen`, `isNavigationListAreaOpen`, `isQuickAccessOpen`）を通じて制御すること。

## 4. アーキテクチャ・層の責務分離（Pure Lit ＋ Dexie）
- **UIとビジネスロジックの分離**:
  - Web Components（`LitElement`）内に直接 IndexedDB アクセスや非同期通信処理を書かないこと。
  - ビジネスロジック・データ操作・状態管理はすべて **`Reactive Controller`** にカプセル化すること。
  - アプリ全体およびコンポーネントツリーを跨ぐ状態共有には **`@lit/context`** を使用すること。
- **データベース層の責務**:
  - `src/db/repositories/`: 単一テーブルに対する基本的なCRUD（Create, Read, Update, Delete）および単一テーブル内の状態更新のみを担当させる。
  - `src/db/queries/`: 複数テーブルの結合（JOIN）や複雑なフィルタリング・抽出条件をまとめる。
  - 予測可能性とTDDの容易性を高めるため、過度な自動監視（`liveQuery`）に依存せず明示的なクエリ・データフェッチを優先すること。

## 5. 型定義・モデル・定数（Types / Models / Constants）
- **ディレクトリ配置規則**:
  - `src/types/view/`: 画面表示・Props受け渡し専用の型（例: `TaskSummary`, `TaskProperty`, `LayoutState`）。
  - `src/types/domain/`: DBモデルとUIで共有される基本型・コード値型（例: `TaskStatusCode`, `Contact`, `CurrentStatus`）。
  - `src/db/models/`: IndexedDB（Dexie）のテーブルレコードに対応する永続化エンティティ型（例: `TaskRecord`, `LogRecord`, `NoteRecord`, `QuickAccessRecord`, `LabelRecord`）。
  - `src/constants/`: マジックナンバーや文字列リテラルの直書きを避け、マスタオブジェクトとして定義する。
- **過度なマイクロファイル化の禁止**:
  - 1つの型定義や1つのヘルパー関数ごとにファイルを細分化せず、関連するドメイン・カテゴリ単位で集約すること。

## 6. 単体テスト・TDD 方針（Vitest）
- **TDD サイクルの徹底**:
  - 原則として、プロダクションコードを書く前に仕様を表すテストコード（🔴 Red）を作成すること。
- **Node.js 標準環境の維持**:
  - `jsdom` などの重いDOMシミュレータに依存せず、Node.js 標準環境（`environment: 'node'`）で動作する軽量・高速なテストを優先すること。
  - カスタムイベントのテストには Node.js 標準の `EventTarget` / `CustomEvent` を活用すること。
- **テスト仕様の明記**:
  - テストファイル冒頭または `describe` の直前に、テスト仕様一覧をコメントとして箇条書きで明記してからテストを構築すること。
  - `it` のテストケース説明文は、仕様が直感的に把握できるよう**日本語**（「〜すること」形式）で統一すること。

## 7. スタイル・UI実装方針
- **コンポーネントとSCSSのペア構成**:
  - コンポーネント固有のスタイルは `.ts` と同階層に `.scss` を配置し、`?inline` でインポートして `unsafeCSS` または `css` タグで組み込むこと。
- **レイアウトの overflow 制御**:
  - 全体画面（ビューポート）のスクロールは抑止し、4つの各ペイン（またはスクロール領域）内で独立してスクロールバーを表示させる構造（`height: 100vh` / `overflow: hidden` を基底とし、ペイン内部に `overflow-y: auto`）とすること。