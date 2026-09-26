# Refactor Executor Workflow (`/refactor-executor`)

## 目的

`.agents/refactor-backlog.json` から未着手タスク（`status: "pending"`）を1件ずつ選定し、**テスト駆動による振る舞いの固定・局所改善・品質ゲート検証（TypeCheck / Lint / Test）・アトミックコミット** のサイクルを安全かつ確実に反復実行する。

---

## 実行前提

1. **作業ツリーの確認**:
   - `git status` を実行し、未コミットの変更が存在しないクリーンな状態であること。
2. **既存テストの健全性確認**:
   - リファクタリング着手前に `npm test` を実行し、既存テストがすべてパス（Green）していることを確認する。

---

## ワークフロー手順

### Step 1: タスク選定と着手宣言

1. `.agents/refactor-backlog.json` を読み込む。
2. 以下の優先度基準に基づき、着手する未完了タスク（`status: "pending"`）を1件選定する：
   - **最優先**: `category: "Complexity"` かつ `test_status: "covered"` かつ `feasibility: "High"`
   - **次点**: `category: "Duplication"` または `category: "TypeSafety"` でテストあり
   - **後回し**: `test_status: "missing"` または `risk_level: "High"`
3. 対象タスクの内容（ID, 対象ファイル, 指摘内容, 改善アプローチ）をユーザーへ提示し、タスクの `status` を `"in-progress"` に更新する。

---

### Step 2: テストガードの確認・先行作成（TDD）

- **`test_status === "covered"` の場合**:
  - 対象テストファイルを単独実行し、既存テストが Green であることを確認する。
    ```powershell
    npm test -- <test_file>
    ```
- **`test_status === "missing"` の場合**:
  - **重要**: プロダクションコードを変更する前に、現状の対象コードの振る舞いを固定・検証するユニットテスト（`*.test.ts`）を作成する。
  - テスト作成後、`npm test -- <test_file>` を実行して Green（既存挙動が正常にテストされていること）を確認する。

---

### Step 3: リファクタリングの適用（局所改善制約）

選定タスクの `approach` に基づき、対象コードを改善する。以下の **局所改善制約** を厳格に遵守すること：

1. **公開インターフェースの不変性**:
   - 関数・クラス・メソッドの公開シグネチャ、引数、戻り値の型、例外発生条件を変更しない。
2. **差分の最小化**:
   - 課題と直接関係のないフォーマット整形や不要なリファクタリングを行わない。
   - 既存コードをコメントアウト（`// 省略` 等）で削らない。
3. **外部依存の制限**:
   - 新規の外部ライブラリや CDN を無断で追加しない。
4. **モノレポ共通化の原則**:
   - 重複コードの共通化を行う場合は、アプリ内に閉じず `packages/utils` 等の共通パッケージへの抽出を検討する。

---

### Step 4: 品質ゲート検証（自己修復ループ: 最大3回）

以下の検証コマンドを順次実行し、デグレードや型不整合が発生していないことを検証する。

```powershell
# 1. 静的型チェック
npm run type-check

# 2. 静的解析（ESLint）
npx eslint <target_file>

# 3. ユニットテスト実行
npm test -- <test_file>
```

- **エラー発生時（修復ループ）**:
  - 出力されたエラーログを分析し、修正を施して再検証する（最大3回までループ試行）。
- **3回試行しても解決しない場合（ロールバック）**:
  - 作業ブランチを破壊しないため、直ちに対象ファイルの変更をロールバックする。
    ```powershell
    git restore <target_file>
    ```
  - `.agents/refactor-backlog.json` の該当タスクの `status` を `"failed"` に更新し、原因をユーザーへ報告する。

---

### Step 5: アトミックコミットとステータス更新

品質ゲートの全検証が Green で通過した場合に実行する。

1. **バックログの安全な更新（台帳保全と実行メタデータの記録）**:
   - **台帳保全原則**: バックログ全体の再生成や過去アイテムの削除は**厳禁**とし、該当タスクのみをインプレースで安全に更新する。
   - 該当タスクの `status` を `"completed"` に更新する。
   - 統計解析および効果測定のため、以下の `execution` メタデータを必ず記録する：
     ```json
     "execution": {
       "completed_order": 3,
       "completed_at": "2026-09-26T14:00:00+09:00",
       "issue_number": 63,
       "pr_number": 64,
       "commit_hash": "1a979a2",
       "prompt_turns": 4,
       "regressions_detected": 0,
       "tests_passed": 383,
       "metrics_after": {
         "duplicated_lines": 0,
         "tokens": 0
       }
     }
     ```
2. **変更のステージング**:
   ```powershell
   git add <target_file> <test_file> .agents/refactor-backlog.json
   ```
3. **コミットの作成**:
   - 標準ワークフロー `/git-commit` に従い、Why（改善理由・得られた効果）を明記したコミットメッセージを作成してコミットする。
   - コミットメッセージ例:
     ```text
     refactor(utils): template.utils の認知複雑度を低減し早期リターンを導入 (#REF-001)

     flattenTemplate 内の属性置換ロジックを独立したヘルパー関数へ抽出し、ネストの深い条件分岐を早期リターン化することで認知複雑度を 28 から 15 以下へ低減しました。
     ```
4. **次タスクへの継続**:
   - 未着手の `pending` タスクが存在する場合、ユーザーへ継続するか確認の上、Step 1 へ戻る。

