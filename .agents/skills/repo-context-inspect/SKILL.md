---
name: repo-context-inspect
description: "調査対象のキーワードをもとに、リポジトリの直近のコミット履歴、ブランチ情報、重複する可能性がある既存のIssueを調査し、結果をJSON形式で返すアトミックな調査スキル。副作用（書き込みや作成）は一切行わない。"
---

# repo-context-inspect

## Requirements

- `git` および `gh` CLI が利用可能かつ認証済みであること

## Parameters

- `Mode`: 調査モード（`Issue`（既定）または `PR`）
- `BaseBranch`: PR モード時の比較対象ベースブランチ（既定: `main`）
- `Keyword`: 調査対象のキーワード（任意。Issue検索等に使用）
- `FilePath`: 調査したい関連ファイルのパス（任意）

## Execution Steps

### 1. Issue モード（既定）での実行
リポジトリ情報・ラベル・ブランチ・直近コミット・関連Issue・プロジェクト設定を単一の JSON として一括取得する。

```powershell
pwsh -File .agents/skills/repo-context-inspect/scripts/inspect-context.ps1 -Keyword "<キーワード>"
```

### 2. PR モードでの実行
PR 作成に必要なブランチ差分コミット一覧、変更ファイル統計、関連Issue情報、プッシュ状態、既存PRの有無を一括取得する。

```powershell
pwsh -File .agents/skills/repo-context-inspect/scripts/inspect-context.ps1 -Mode PR -BaseBranch "main"
```

### 3. 取得結果（JSON）の確認

- **共通フィールド**:
  - `repo`: 対象リポジトリ（`owner/repo`）
  - `branch`: カレントブランチ名
  - `isGitInstalled`: Git のインストール有無（`false` の場合は処理中断）
  - `isGhInstalled`: GitHub CLI のインストール有無（`false` の場合はインストール案内で処理中断）
  - `isAuthenticated`: GitHub CLI の認証状態（`false` の場合は `errorMessage` に従いログイン案内で処理中断）
  - `errorMessage`: エラー詳細メッセージ（発生時は他フィールドが `null` となるため、このメッセージを元に失敗報告を行って処理中断）
  - `labels`: 使用可能なラベル一覧
  - `projectInfo`: テスト構成やスクリプト名等の技術仕様
- **Issue モード時 (`prContext` は `null`)**:
  - `recentIssues`: 既に同一の Issue が存在しないか（重複防止）
  - `recentCommits`: 直近コミット履歴
  - `fileContext`: 指定ファイルの存在確認
- **PR モード時 (`prContext` に格納)**:
  - `prContext.baseBranch`: 比較元ベースブランチ（`main` 等）
  - `prContext.headBranch`: カレントトピックブランチ
  - `prContext.hasUncommittedChanges`: 作業ツリーに未コミットの変更があるか
  - `prContext.uncommittedFiles`: 未コミット変更のファイル一覧
  - `prContext.commitCount`: Base〜Head 間のコミット件数
  - `prContext.commits`: Base〜Head 間のコミット詳細リスト（hash, author, date, message）
  - `prContext.diffStat`: 差分統計サマリー文字列 (`git diff --stat`)
  - `prContext.changedFiles`: 変更ファイル状態一覧（status, path）
  - `prContext.detectedIssueNumbers`: ブランチ名やコミットから抽出された関連 Issue 番号配列
  - `prContext.relatedIssue`: 自動抽出された関連 Issue の詳細（タイトル、本文、ラベル）
  - `prContext.isUpstreamConfigured`: upstream トラッキングが設定されているか
  - `prContext.unpushedCommitCount`: リモートに未プッシュのコミット数
  - `prContext.existingPr`: 既にオープンしている同一ブランチの PR 情報（存在する場合）
