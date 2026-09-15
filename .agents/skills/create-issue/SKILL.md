---
name: create-issue
description: GitHub CLI (gh) を使用して、リポジトリのコンテキストを自動調査し、4大必須項目（概要・目的/背景・実装内容/タスク・完了条件）を満たした Issue を安全に作成するスキル。タスクの Issue 化や GitHub Issue 作成の指示時に使用します。
---

# GitHub Issue Creator

GitHub CLI (`gh`) を活用し、プロジェクトコンテキストに即した高品質な GitHub Issue を自動作成・登録するスキルです。

---

## 厳格な制約事項（CRITICAL CONSTRAINTS）

1. **4大必須項目の網羅（必須フォーマット）**:
   - 生成するすべての Issue に、以下の4セクションを必ず含めること。いずれか1つでも欠けてはならない。
     - `## 概要`
     - `## 目的 / 背景`
     - `## 実装内容 / タスク`（`- [ ]` チェックボックス形式）
     - `## 完了条件`（`- [ ]` チェックボックスまたは判定基準）

2. **途中経過・スクリプトの非開示（最終結果のみ報告）**:
   - 実行中に生成・使用したスクリプトや一時ファイル、調査の途中ログをユーザーに見せてはならない。
   - 処理完了後は、**最終結果（成功 or 失敗）のみ**を端的に報告すること。

3. **安全な Issue 登録（`--body-file` の利用）**:
   - Windows PowerShell 環境における特殊文字・改行のエスケープ崩れを防ぐため、Issue 本文はスクラッチ領域の一時ファイル（`.md`）に保存し、必ず `--body-file` オプションを用いて `gh issue create` を実行すること。

---

## 実行手順（Workflow Steps）

### 1. コンテキストの一括収集
以下のスクリプトを実行して、リポジトリ情報・ラベル・ブランチ・プロジェクト設定を単一の JSON として一括取得する。

```powershell
pwsh -File .agents/skills/create-issue/scripts/inspect-context.ps1
```

- 取得結果（JSON）から以下を確認する:
  - `repo`: 対象リポジトリ（`owner/repo`）
  - `isGitInstalled`: Git のインストール有無（`false` の場合は処理中断）
  - `isGhInstalled`: GitHub CLI のインストール有無（`false` の場合はインストール案内で処理中断）
  - `isAuthenticated`: GitHub CLI の認証状態（`false` の場合は `errorMessage` に従いログイン案内で処理中断）
  - `errorMessage`: エラー詳細メッセージ（発生時は他フィールドが `null` となるため、このメッセージを元に失敗報告を行って処理中断）
  - `labels`: 使用可能なラベル一覧
  - `recentIssues`: 既に同一の Issue が存在しないか（重複防止）
  - `projectInfo`: テスト構成やスクリプト名等の技術仕様

### 2. Issue 本文（Markdown）の生成
指示されたタスク内容と収集したコンテキストを統合し、以下のテンプレートに沿って本文を構成する。

```markdown
## 概要
<対応内容の簡潔な要約>

## 目的 / 背景
<なぜこの作業が必要なのか、現状の課題や導入メリット>

## 実装内容 / タスク
- [ ] <具体的な作業項目1>
- [ ] <具体的な作業項目2>
- [ ] <具体的な作業項目3>

## 完了条件
- [ ] <Issueをクローズするための判定基準>
```

- 本文をスクラッチディレクトリ等の一時ファイル（例: `<artifactDir>/scratch/issue_body.md`）に書き出す。
- 適切なラベル（例: `enhancement`, `bug`, `documentation` 等）を `labels` 一覧から選定する。

### 3. Issue の作成
一時ファイルを指定して `gh issue create` を実行する。

```powershell
gh issue create --repo <repo> --title "<タイトル>" --body-file "<一時ファイルの絶対パス>" --label "<選定ラベル>"
```

### 4. 最終結果の検証と報告
作成された Issue の URL が正しく出力されたことを確認し、**ユーザーへは最終結果のみ**を以下の形式で報告する。

#### 成功時の出力フォーマット:
```markdown
### Issue 作成結果: 成功
- **Issue**: [#<番号>] <タイトル>
- **URL**: <Issue URL>
- **ラベル**: `<付与したラベル名>`
```

#### 失敗時の出力フォーマット:
```markdown
### Issue 作成結果: 失敗
- **エラー原因**: <認証失敗 / コマンドエラー等の原因>
- **対処方法**: <ユーザー側で必要なアクション（例: gh auth login 等）>
```
