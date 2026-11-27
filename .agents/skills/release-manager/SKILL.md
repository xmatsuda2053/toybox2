---
name: release-manager
description: "モノレポ内の各アプリケーション（apps/*）ごとに独立したバージョン管理、CHANGELOG 更新、GitHub Releases（配布成果物付き）公開、および GitHub Wiki ダウンロードポータル自動同期を実行するリリース管理スキル。"
---

# release-manager

モノレポ内の各アプリケーション（`apps/stepnote`, `apps/stepnote-migrator`, `apps/extension-hubaddress`、および将来追加されるアプリ）に対し、独立リリースタグ規約（`<scope>@v<version>`）に基づいたリリース準備・公開・Wiki 配布を安全に実行するスキルです。

**読み取り専用（調査）** と **副作用を伴う実行** をスクリプト単位で明確に分離しています。

---

## 厳格な制約事項（CRITICAL CONSTRAINTS）

1. **調査の必須実行**:
   - リリース準備・公開の前に、必ず `inspect-release-state.ps1` を実行し、現在バージョン・`manifest.json` 整合性・未リリースコミット・Git/Wiki 状態を実測 JSON で把握すること。
2. **ユーザー承認なしの副作用実行禁止**:
   - `bump-version.ps1`、`publish-release.ps1`、`sync-wiki.ps1`（`-DryRun` を除く）は、必ずユーザーへプレビューを提示して明示的な承認を得た後に実行すること。
3. **`main` ブランチ保護の厳守**:
   - `publish-release.ps1` はバージョン更新 PR が `main` へマージされた後、最新のクリーンな `main` ブランチ上で実行すること（`-AllowNonMain` は通常運用で使用しない）。
4. **安全なファイル経由のリリースノート受け渡し**:
   - 複数行のリリースノートは必ず UTF-8 の一時ファイル（`<artifactDir>/scratch/release_notes.md` 等）へ保存し、`-NotesFile` で渡すこと。

---

## 設定カタログ（`config/release-apps.json`）

対象アプリは `.agents/skills/release-manager/config/release-apps.json` で宣言的に管理します。
新しいアプリを `apps/*` に追加した場合、`inspect-release-state.ps1` の `unregisteredApps` で自動検知されるため、同 JSON の `apps` 配列へエントリを 1 件追加するだけでリリース運用へ組み込めます。

| アプリ ID (`id`) | 表示名 | タグ形式 | バージョン同期対象 | 配布アセット名 | Wiki ページ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `stepnote` | Step-Note | `stepnote@v<x.y.z>` | `apps/stepnote/package.json` | `stepnote-v<x.y.z>.html` | `Step-Note.md` |
| `stepnote-migrator` | Step-Note Migrator | `stepnote-migrator@v<x.y.z>` | `apps/stepnote-migrator/package.json` | `stepnote-migrator-v<x.y.z>.html` | `Step-Note-Migrator.md` |
| `ext-hubaddress` | HubAddress | `ext-hubaddress@v<x.y.z>` | `apps/extension-hubaddress/package.json`, `public/manifest.json` | `hubaddress-extension-v<x.y.z>.zip` | `HubAddress.md` |

---

## 提供スクリプト一覧

### 1. 状態調査（読み取り専用）: `scripts/inspect-release-state.ps1`

各アプリの現在バージョン・整合性・前回タグ以降のコミット履歴・SemVer 推奨バンプ・Git/Wiki 状態を JSON で一括収集します。副作用はありません。

```powershell
# 全アプリの状態を取得
pwsh -File .agents/skills/release-manager/scripts/inspect-release-state.ps1

# 特定アプリのみ整形出力
pwsh -File .agents/skills/release-manager/scripts/inspect-release-state.ps1 -AppId stepnote -Pretty
```

- **主な出力フィールド**:
  - `repository`: `repoSlug`, `branch`, `isMainBranch`, `isWorkingTreeClean`, `isMainUpToDate`, `isGhAuthenticated`, `wikiInitialized`, `wikiUrl`
  - `unregisteredApps`: `apps/*` 配下で `release-apps.json` 未登録のディレクトリ一覧
  - `apps[]`: `id`, `currentVersion`, `isVersionConsistent`, `latestTag`, `isCurrentVersionTagged`, `readyToPublishCurrent`, `commitsSinceLastTag`, `recommendedBump`, `suggestedNextVersion`, `nextVersionCandidates`

---

### 2. バージョン更新・CHANGELOG 追記・品質検証: `scripts/bump-version.ps1`

指定アプリの `versionFiles`（`package.json` / `public/manifest.json`）、ルート `package-lock.json` の該当ワークスペースバージョン、`apps/<dir>/CHANGELOG.md`、およびルート `README.md` の該当アプリバージョン表記（記載があり値が異なる場合）を同期更新し、テスト・型チェック・ビルド（拡張機能は ZIP パッケージ含む）を実行します。

```powershell
# DryRun で変更対象を事前確認
pwsh -File .agents/skills/release-manager/scripts/bump-version.ps1 -AppId ext-hubaddress -Version 0.2.0 -NotesFile "<notes_path>" -DryRun

# 本実行（バージョン更新 + CHANGELOG追記 + テスト・型チェック・ビルド検証）
pwsh -File .agents/skills/release-manager/scripts/bump-version.ps1 -AppId ext-hubaddress -Version 0.2.0 -NotesFile "<notes_path>"
```

- **パラメータ**:
  - `-AppId`（必須）: `release-apps.json` の `id`
  - `-Version`（必須）: SemVer（`MAJOR.MINOR.PATCH`、例: `1.0.0`）
  - `-NotesFile`（任意）: UTF-8 リリースノート Markdown ファイルパス
  - `-ReleaseDate`（任意）: リリース日（省略時は当日 `yyyy-MM-dd`）
  - `-SkipVerify`（任意スイッチ）: テスト・型・ビルド検証をスキップ
  - `-DryRun`（任意スイッチ）: ファイル変更せず検証のみ実施

---

### 3. タグ作成 ＆ GitHub Release 公開: `scripts/publish-release.ps1`

`main` ブランチ上で対象アプリをクリーンビルドし、注釈付きタグ `<tagPrefix>@v<version>` の作成・push、および配布成果物を添付した GitHub Release の公開を行います。

```powershell
# DryRun で公開内容を確認
pwsh -File .agents/skills/release-manager/scripts/publish-release.ps1 -AppId stepnote -DryRun

# 本実行（main ブランチ・クリーン状態・origin/main 同期済みが必須）
pwsh -File .agents/skills/release-manager/scripts/publish-release.ps1 -AppId stepnote
```

- **パラメータ**:
  - `-AppId`（必須）: `release-apps.json` の `id`
  - `-Version`（任意）: 省略時は対象アプリの `package.json` の `version` を採用
  - `-NotesFile`（任意）: 省略時は対象アプリの `CHANGELOG.md` から該当バージョン節を自動抽出
  - `-Repo`（任意）: `owner/repo`（省略時は `origin` から解決）
  - `-DryRun`（任意スイッチ）: ビルド・タグ・Release 作成を行わずプレビュー JSON を返却

---

### 4. GitHub Wiki ダウンロードポータル同期: `scripts/sync-wiki.ps1`

GitHub Releases の公開情報を REST API（`gh api`）で一括取得し、Wiki 用の `Home.md`（全アプリの最新ダウンロード一覧）、`_Sidebar.md`、および各アプリ別ページ（導入手順・最新 DL リンク・過去履歴）を自動生成して `<repo>.wiki.git` へ同期します。

```powershell
# DryRun（＋任意でローカルフォルダへ生成 Markdown プレビュー出力）
pwsh -File .agents/skills/release-manager/scripts/sync-wiki.ps1 -DryRun -PreviewDir "<scratch_dir>/wiki-preview"

# 本実行（Wiki リポジトリへコミット＆push）
pwsh -File .agents/skills/release-manager/scripts/sync-wiki.ps1
```

> [!NOTE]
> GitHub Wiki が未初期化（ページが 0 件）の場合は `wikiInitialized: false` となり安全に中断します。初回のみ GitHub のリポジトリ画面「Wiki」タブから 1 ページ目を作成（「Create the first page」）した後に再実行してください。
