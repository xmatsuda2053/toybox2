---
name: readme-inventory
description: "リポジトリ内のワークスペース（apps/*, packages/*）、npm スクリプト、主要依存、CI、.agents 配下のルール・ワークフロー・スキルを一括収集し、現行の README.md および .agents/README.md との差分ヒントを JSON 形式で返す読み取り専用の調査スキル。"
---

# readme-inventory

`README.md` および `.agents/README.md` の定期更新ワークフロー（`/update-readme`）に向けて、リポジトリの最新実態を機械的に収集するアトミックな調査スキルです。ファイルの書き換えや作成などの副作用は一切行いません。

---

## 前提条件（Requirements）

- PowerShell (`pwsh`) が利用可能であること
- リポジトリルートに `package.json` が存在すること

---

## パラメータ（Parameters）

- `RepoRoot`: 調査対象のリポジトリルートパス（任意。省略時はカレントディレクトリ）
- `Pretty`: 出力 JSON をインデント整形して出力するスイッチ（任意。省略時は 1 行の圧縮 JSON）

---

## 実行手順（Execution Steps）

### 1. リポジトリ資産と差分ヒントの一括取得

```powershell
pwsh -File .agents/skills/readme-inventory/scripts/inspect-readme-inventory.ps1
```

目視確認用に整形 JSON で出力する場合：

```powershell
pwsh -File .agents/skills/readme-inventory/scripts/inspect-readme-inventory.ps1 -Pretty
```

### 2. 取得結果（JSON）のスキーマ確認

- `generatedAt`: 実行日時（ISO 8601）
- `errorMessage`: エラー発生時のメッセージ（正常時は `null`）
- `repository`:
  - `name`: ルート `package.json` の名称
  - `workspaces`: モノレポの `workspaces` 設定一覧
  - `rootReadme` / `agentsReadme`: 各ドキュメントの `path`, `exists`, `lineCount`, `headings`
  - `scripts`: ルート `package.json` の全スクリプト一覧（`{ name, value }`）
  - `dependencies` / `devDependencies`: ルートの依存パッケージ一覧
  - `ciWorkflows`: `.github/workflows/*.yml` の定義一覧
- `apps`: `apps/*` 配下の各アプリケーション情報
  - `dir`, `name`, `version`, `appType`（`standalone-singlefile-web-app` / `browser-extension` / `web-app`）, `titleHint`, `summaryHint`, `scripts`, `internalDependencies`, `distZips`, `hasReadme`, `readmePath`
- `packages`: `packages/*` 配下の各共有パッケージ情報
  - `dir`, `name`, `version`, `description`, `scripts`, `internalDependencies`, `srcEntries`, `hasReadme`, `readmePath`
- `agents`: `.agents/` 配下の開発支援基盤
  - `rules`: `.agents/rules/*.md`（`name`, `path`, `title`）
  - `workflows`: `.agents/workflows/*.md`（`name`, `command`, `path`, `description`）
  - `skills`: `.agents/skills/*/SKILL.md`（`name`, `dir`, `path`, `description`, `scripts`）
- `driftHints`: 現行ドキュメントとのズレ検知ヒント
  - `rootReadme`: `missingApps`, `missingPackages`, `missingScripts`, `unlinkedWorkspaceReadmes`, `missingAgentsReadmeLink`
  - `agentsReadme`: `exists`, `missingRules`, `missingWorkflows`, `missingSkills`
