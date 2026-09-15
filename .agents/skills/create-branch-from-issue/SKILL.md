---
name: create-branch-from-issue
description: GitHub Issueの番号を受け取り、Issue情報（タイトル・ラベル）から標準化されたブランチ名を自動生成して作業用ブランチを作成・チェックアウトするスキル。Issueに基づくブランチ作成や作業開始の指示時に使用します。
---

# GitHub Issue Branch Creator

GitHub Issue の情報（タイトル・ラベル）を取得し、命名規則に従ったローカル作業用ブランチを自動生成・チェックアウトするスキルです。

---

## 前提条件（Requirements）

- GitHub CLI (`gh`) がインストールされ、認証済みであること
- Git 作業ツリーが利用可能であること

## パラメータ（Parameters）

- `issue_id`: 対象の GitHub Issue 番号（必須。例: `42`, `#42`）
- `base_branch`: 分岐元ブランチ（任意。省略時は現在のチェックアウト中ブランチから分岐）

---

## 実行手順（Workflow Steps）

### 1. Issue 情報の取得と正規化
1. `issue_id` に先頭の `#` が含まれている場合は除去し、数字のみを抽出する。
2. 以下のコマンドで Issue のタイトルとラベルを取得する。
   ```powershell
   gh issue view <issue_id> --json number,title,labels
   ```
3. Issue が存在しない、または権限エラーが発生した場合は、その旨を報告して処理を中断する。

### 2. ブランチ名の生成ルール
- **プレフィックスの選定**（ラベルまたはタイトルから判定）:
  - `bug`, `fix` 等 → `fix/`
  - `feature`, `enhancement` 等 → `feature/`
  - `docs`, `documentation` 等 → `docs/`
  - `refactor` 等 → `refactor/`
  - 不明・その他 → `task/`
- **スラッグ（識別名）の正規化**:
  - タイトルに含まれる英単語を抽出し、小文字（kebab-case）に変換。
  - 日本語等の非ASCII文字は、内容を表す簡潔な英語（2〜4単語程度）に要約・英訳する。
  - 記号や不要なスペースはハイフン `-` に置換し、連続するハイフンは1つにまとめる。
- **ブランチ名フォーマット**:
  `<prefix>/<issue_id>-<slug>`
  （例: Issue #105「ログイン画面のバリデーション修正」 → `fix/105-login-validation`）

### 3. 作業ブランチの作成とチェックアウト
1. リモートの最新情報を取得する。
   ```powershell
   git fetch origin
   ```
2. 同名のローカルブランチが既に存在するか確認する。
   ```powershell
   git branch --list "<branch_name>"
   ```
3. **存在しない場合**:
   - `base_branch` が指定されている場合:
     ```powershell
     git checkout -b <branch_name> <base_branch>
     ```
   - `base_branch` が指定されていない場合:
     ```powershell
     git checkout -b <branch_name>
     ```
4. **既に存在する場合**:
   - 新規作成をスキップし、既存ブランチへ切り替える。
     ```powershell
     git checkout <branch_name>
     ```

### 4. 最終結果の報告
実行結果を以下のフォーマットでユーザーに報告する。

#### 成功時の出力フォーマット:
```markdown
### ブランチ作成結果: 成功
- **作業ブランチ**: `<branch_name>`
- **対象 Issue**: [#<issue_id>] <タイトル>
- **分岐元**: `<base_branch または 現在のブランチ>`
- **ステータス**: 作成およびチェックアウト完了
```

#### 失敗時の出力フォーマット:
```markdown
### ブランチ作成結果: 失敗
- **エラー原因**: <Issue未検出 / 認証エラー / Git競合等の原因>
- **対処方法**: <ユーザー側で必要なアクション>
```
