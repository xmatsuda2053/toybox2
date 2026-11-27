# toybox2

オフライン・スタンドアロン志向の Web アプリケーション、ブラウザ拡張機能、および再利用可能な共通パッケージを集約管理する npm Workspaces ベースのモノレポです。

## 概要（Overview）

- **スタンドアロン動作重視**: Web アプリは `vite-plugin-singlefile` により単一 HTML ファイルとしてビルドでき、外部ネットワーク依存なしでローカル運用できます。
- **資産の共通化**: UI コンポーネント・アイコン・純粋関数ユーティリティを `packages/*` に集約し、複数アプリから `@shared/*` として再利用します。
- **品質と運用の標準化**: TypeScript・Vitest・ESLint・Prettier による品質ゲートと、`.agents/` 配下の開発規約・ワークフロー・スキルを組み合わせて継続的に保守します。

## リポジトリ構成（Repository Structure）

```text
toybox2/
├── apps/                        # アプリケーション群
│   ├── stepnote/                # タスク管理・作業記録アプリ（単一 HTML ビルド）
│   ├── stepnote-migrator/       # Step-Note 向けデータ移行ツール（単一 HTML ビルド）
│   └── extension-hubaddress/    # Chrome / Edge 向けブラウザ拡張機能「HubAddress」
├── packages/                    # 共有パッケージ群（@shared/*）
│   ├── components/              # 共通 UI Web Components（@shared/components）
│   ├── icons/                   # 共通アイコン資産・登録ユーティリティ（@shared/icons）
│   └── utils/                   # 共通純粋関数ユーティリティ（@shared/utils）
├── .agents/                     # AI エージェント開発基盤（ルール・ワークフロー・スキル）
└── .github/workflows/           # GitHub Actions CI 定義
```

## 資産一覧（Workspaces）

### アプリケーション（`apps/*`）

| アプリ名               | ディレクトリ                | バージョン | 形態                    | 概要                                                                           | 内部依存                                               | 備考 / 成果物                                                           |
| :--------------------- | :-------------------------- | :--------- | :---------------------- | :----------------------------------------------------------------------------- | :----------------------------------------------------- | :---------------------------------------------------------------------- |
| `stepnote`             | `apps/stepnote`             | `0.1.0`    | 単一 HTML Web アプリ    | スタンドアロン動作するタスク管理・作業記録アプリ（StepNote）                   | `@shared/components`, `@shared/icons`, `@shared/utils` | `vite-plugin-singlefile` 出力                                           |
| `stepnote-migrator`    | `apps/stepnote-migrator`    | `0.1.0`    | 単一 HTML Web アプリ    | Step-Note データ移行ツール（SnDB to StepNote）                                 | `@shared/components`, `@shared/utils`                  | `vite-plugin-singlefile` 出力                                           |
| `extension-hubaddress` | `apps/extension-hubaddress` | `0.1.0`    | ブラウザ拡張機能（MV3） | 職員情報・組織情報をサイドパネルで素早く検索・参照できる拡張機能「HubAddress」 | `@shared/components`, `@shared/icons`, `@shared/utils` | 配布 ZIP: `apps/extension-hubaddress/dist-zip/hubaddress-extension.zip` |

### 共有パッケージ（`packages/*`）

| パッケージ名         | ディレクトリ          | バージョン | 概要                                                            | 主なモジュール構成（`src/`）                            | 内部依存                         |
| :------------------- | :-------------------- | :--------- | :-------------------------------------------------------------- | :------------------------------------------------------ | :------------------------------- |
| `@shared/components` | `packages/components` | `1.0.0`    | アプリ横断で利用する共通 Web Components UI 群                   | `datepicker-input`, `markdown`, `search-input`, `utils` | `@shared/icons`, `@shared/utils` |
| `@shared/icons`      | `packages/icons`      | `1.0.0`    | 共通 SVG アイコン資産およびアイコンライブラリ登録ユーティリティ | `assets`（`register.ts`, `icons.ts`）                   | なし                             |
| `@shared/utils`      | `packages/utils`      | `1.0.0`    | DOM 非依存の純粋関数・テスト支援ユーティリティ群                | `async`, `date`, `event`, `number`, `string`, `testing` | なし                             |

## 技術スタック（Tech Stack）

| カテゴリ                  | 主な技術・ライブラリ                                                                                                                                    |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **言語・型チェック**      | TypeScript 6 (`@typescript/typescript6`)                                                                                                                |
| **UI / Web Components**   | Lit 3, `@lit/context`, `@lit-labs/virtualizer`, Web Awesome (`@awesome.me/webawesome`)                                                                  |
| **エディタ / Markdown**   | CodeMirror 6, unified (`remark-parse`, `remark-gfm`, `remark-rehype`, `remark-stringify`, `rehype-sanitize`, `rehype-stringify`), `github-markdown-css` |
| **データ永続化 / パース** | Dexie 4 (`dexie-export-import`), PapaParse                                                                                                              |
| **ビルド・スタイル**      | Vite 8, `vite-plugin-singlefile`, `vite-tsconfig-paths`, Sass (`sass-embedded`)                                                                         |
| **テスト・静的解析**      | Vitest 4 (`@vitest/ui`, `fake-indexeddb`), ESLint 10 (`typescript-eslint`, `eslint-plugin-sonarjs`), Prettier 3, jscpd, madge                           |

## セットアップ・開発コマンド（Getting Started / Scripts）

### 前提環境・インストール

- **Node.js**: CI 環境基準は Node.js 25（npm Workspaces 利用）
- 依存関係のインストール（リポジトリルートで実行）:

```powershell
npm install
```

> CI 環境（GitHub Actions）ではロックファイル整合性を厳格に検証するため `npm ci --legacy-peer-deps` を使用しています。ワークスペース追加時は必ずルートで `npm install` を実行し、`package-lock.json` を同期してください。

### 主要 npm スクリプト一覧

#### 開発サーバー

| コマンド                 | 内容                                                                 |
| :----------------------- | :------------------------------------------------------------------- |
| `npm run dev:stepnote`   | `apps/stepnote` の開発サーバーを起動                                 |
| `npm run dev:migrator`   | `apps/stepnote-migrator` の開発サーバーを起動                        |
| `npm run dev:components` | `packages/components` のコンポーネントプレビュー用開発サーバーを起動 |

#### ビルド・パッケージング

| コマンド                         | 内容                                                                                            |
| :------------------------------- | :---------------------------------------------------------------------------------------------- |
| `npm run build:stepnote`         | `apps/stepnote` の型チェックおよび単一 HTML ビルドを実行                                        |
| `npm run build:migrator`         | `apps/stepnote-migrator` の型チェックおよび単一 HTML ビルドを実行                               |
| `npm run build:ext-hubaddress`   | `apps/extension-hubaddress` の型チェックおよび拡張機能ビルド（`dist/`）を実行                   |
| `npm run package:ext-hubaddress` | `apps/extension-hubaddress` をビルドし、配布用 ZIP（`dist-zip/hubaddress-extension.zip`）を生成 |
| `npm run build:all`              | 全ワークスペースのビルドを一括実行                                                              |

#### テスト・静的解析・フォーマット

| コマンド                         | 内容                                                                 |
| :------------------------------- | :------------------------------------------------------------------- |
| `npm test`                       | 全ワークスペースの単体テスト（Vitest）を一括実行                     |
| `npm run test:ext`               | `apps/extension-hubaddress` の単体テストを実行（短縮エイリアス）     |
| `npm run test:ext-hubaddress`    | `apps/extension-hubaddress` の単体テストを実行                       |
| `npm run test:watch`             | Vitest UI モードでテストを対話実行                                   |
| `npm run type-check`             | 全ワークスペースの TypeScript 型チェック（`tsc --noEmit`）を一括実行 |
| `npm run lint`                   | `apps/` および `packages/` に対して ESLint を実行                    |
| `npm run format -- <path>`       | 指定ファイルに Prettier フォーマットを適用                           |
| `npm run format:check -- <path>` | 指定ファイルの Prettier フォーマット整合性を検証                     |

## CI・品質検証（CI & Quality Gates）

- **GitHub Actions（[`.github/workflows/test.yml`](.github/workflows/test.yml)）**: `main` ブランチへの push / Pull Request 時に `npm ci --legacy-peer-deps`、`npm run type-check`、`npm run test` を自動実行します。
- **ローカル品質ゲート**: 実装・改修完了時は `npm run format`、`npm test`、`npm run type-check`、`npm run lint`、および対象アプリのビルド通過を確認します。

## 開発運用・AI エージェント開発基盤（Development）

- **ブランチ運用（GitHub Flow）**:
  - 本線は `main` のみとし、機能開発・修正・ドキュメント更新は短命なトピックブランチから PR を経てマージします。
  - ブランチ命名規則: `<prefix>/<scope>-<issue_id>-<slug>`（例: `feat/stepnote-120-task-filter`, `fix/ext-45-popup-ui`, `docs/repo-569-readme-update-workflow`）
  - 独立リリースタグ: `<scope>@v<version>`（例: `stepnote@v1.2.0`）
- **開発ルール・ワークフロー・スキル一覧**:
  - モノレポ共通規約、Step-Note 固有設計ルール、Issue / Commit / PR 作成やリファクタリング、本 `README.md` の定期更新ワークフロー（`/update-readme`）の詳細は [**AI エージェント開発基盤ガイド（`.agents/README.md`）**](.agents/README.md) を参照してください。
