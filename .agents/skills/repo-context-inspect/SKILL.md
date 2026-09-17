---
name: repo-context-inspect
description: "調査対象のキーワードをもとに、リポジトリの直近のコミット履歴、ブランチ情報、重複する可能性がある既存のIssueを調査し、結果をJSON形式で返すアトミックな調査スキル。副作用（書き込みや作成）は一切行わない。"
---

# repo-context-inspect

## Requirements

- `git` および `gh` CLI が利用可能かつ認証済みであること

## Parameters

- `keyword`: 調査対象のキーワード（任意。Issue検索等に使用）
- `file_path`: 調査したい関連ファイルのパス（任意）

## Execution Steps

1. 以下のスクリプトを実行して、リポジトリ情報・ラベル・ブランチ・プロジェクト設定を単一の JSON として一括取得する

```powershell
pwsh -File .agents/skills/repo-context-inspect/scripts/inspect-context.ps1
```

2. 取得結果（JSON）から以下を確認する

- `repo`: 対象リポジトリ（`owner/repo`）
- `isGitInstalled`: Git のインストール有無（`false` の場合は処理中断）
- `isGhInstalled`: GitHub CLI のインストール有無（`false` の場合はインストール案内で処理中断）
- `isAuthenticated`: GitHub CLI の認証状態（`false` の場合は `errorMessage` に従いログイン案内で処理中断）
- `errorMessage`: エラー詳細メッセージ（発生時は他フィールドが `null` となるため、このメッセージを元に失敗報告を行って処理中断）
- `labels`: 使用可能なラベル一覧
- `recentIssues`: 既に同一の Issue が存在しないか（重複防止）
- `projectInfo`: テスト構成やスクリプト名等の技術仕様

3. 取得した情報を整理し、コンテキスト概要として呼び出し元に出力して終了する
