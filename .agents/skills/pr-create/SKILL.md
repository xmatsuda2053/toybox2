---
name: pr-create
description: "タイトルや複数行の本文ファイルを安全に受け取り、事前検証およびリモート push を行いながら gh pr create を確実に実行するスキル。"
---

# pr-create

GitHub CLI (`gh`) を利用し、特殊文字のエスケープ漏れや複数行本文によるシェル破損を防止しながら、リモートへの push 状態を確認して安全に Pull Request を作成・登録するスキルです。

---

## 厳格な制約事項（CRITICAL CONSTRAINTS）

1. **ユーザー承認後の実行（CRITICAL）**:
   - ワークフロー経由でユーザーから明示的な承認（「OK」「作成して」等）を得た場合のみ本スキルを実行すること。
2. **ベースブランチ（`main`）からの直接作成禁止**:
   - カレントブランチ（または指定された Head ブランチ）が Base ブランチと同一である場合、PR 作成はできません。必ずトピックブランチから作成してください。
3. **安全なファイル経由の受け渡し**:
   - 複数行の PR 本文は必ずスクラッチ領域の一時 Markdown ファイル（UTF-8）に保存し、`-BodyFile` で渡してください。
   - タイトルに記号（`"`, `$`, `[]`, `&` など）が含まれる場合は、タイトルも一時ファイルに保存して `-TitleFile` で渡すことを推奨します。

---

## パラメータ（Parameters）

- `Title`: PR のタイトル文字列（`TitleFile` を指定しない場合は必須）
- `TitleFile`: タイトルが記載された一時ファイルのパス（記号混在時に推奨）
- `BodyFile`: PR 本文が記載された Markdown ファイルのパス（**必須**）
- `Base`: マージ先ブランチ（任意。既定値: `main`）
- `Head`: 作成元ブランチ（任意。省略時は現在のチェックアウト中ブランチ）
- `Draft`: 下書き（Draft）PR として作成するスイッチフラグ（任意）
- `AutoPush`: リモートに未プッシュのコミットがある場合、事前に `git push -u origin <head>` を実行するスイッチフラグ（任意）
- `Repo`: 対象リポジトリ（`owner/repo`。任意。省略時は `origin` から自動検出）
- `DryRun`: 実際の作成や push を行わず引数検証のみ行うスイッチフラグ（任意）

---

## 実行手順（Execution Steps）

### 1. 一時ファイルの準備
本文（および必要に応じてタイトル）をスクラッチ領域（UTF-8）に書き出します。

```powershell
# 本文ファイル: <artifactDir>/scratch/pr_body.md
# タイトルファイル: <artifactDir>/scratch/pr_title.txt
```

### 2. スクリプトの実行

```powershell
pwsh -File .agents/skills/pr-create/scripts/create-pr.ps1 `
  -TitleFile "<タイトルファイルの絶対パス>" `
  -BodyFile "<本文ファイルの絶対パス>" `
  -Base "main" `
  -AutoPush
```

### 3. 返却 JSON の確認

#### 成功時:
```json
{
  "success": true,
  "prNumber": 35,
  "url": "https://github.com/xmatsuda2053/toybox2/pull/35",
  "title": "feat(workflow): PR作成ワークフローの新設 (#34)",
  "baseBranch": "main",
  "headBranch": "feature/34-structured-pr-workflow",
  "isDraft": false,
  "errorMessage": null
}
```

#### 失敗時:
```json
{
  "success": false,
  "prNumber": null,
  "url": null,
  "title": "feat(workflow): PR作成ワークフローの新設 (#34)",
  "baseBranch": "main",
  "headBranch": "feature/34-structured-pr-workflow",
  "isDraft": false,
  "errorMessage": "エラーの詳細メッセージ"
}
```
