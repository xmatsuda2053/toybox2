---
name: refactor-audit
description: TypeScriptコードベースを静的解析（ESLint, jscpd, madge）および文脈調査により診断し、実行可能なリファクタリング計画リスト（.agents/refactor-backlog.json）を安全に生成・更新するスキル。
---

# Refactor Audit Skill

## 目的

TypeScript プロジェクト内の認知的複雑度、長大関数、重複コード、循環参照、型安全性の課題を静的解析ツールと文脈分析によって抽出し、後続のリファクタリング実行ワークフロー（`/refactor-executor`）で安全かつ反復実行可能なバックログ（`.agents/refactor-backlog.json`）を生成・更新する。

---

## 調査・評価の 6 基準

1. **認知的複雑度・肥大化 (Complexity)**:
   - 認知的複雑度（`sonarjs/cognitive-complexity` > 15）
   - 単一関数の最大行数（`max-lines-per-function` > 50行）
   - 過剰なネストや分岐の多さ
2. **重複・共通化 (Duplication)**:
   - 複数ファイルまたは同一ファイル内に散在する同一・類似ロジック（`jscpd` 20トークン以上）
3. **型安全性 (TypeSafety)**:
   - `any` 型の乱用（`@typescript-eslint/no-explicit-any`）
   - 不要・危険な型アサーション、緩いインターフェース定義
4. **依存の歪み (CircularDependency)**:
   - モジュール間の循環参照（`madge`）
5. **テスト担保状況 (TestStatus)**:
   - 対象コードの振る舞いを保証するユニットテストの有無（`covered`: テストあり / `missing`: テストなし）
6. **影響半径・実現性 (Feasibility & Risk)**:
   - 非公開・内部モジュール（`scope: internal`）か、他パッケージ・外部公開API（`scope: public`）か
   - 外部仕様を維持したまま局所的なコード変更で完結できるか（`feasibility: High | Medium | Low`）

---

## 実行手順

### Step 1: 静的解析ツールの実行

付属の監査実行スクリプト（PowerShell）を実行し、静的解析レポートを `.agents/` ディレクトリ配下に出力する。

```powershell
powershell -File .agents/skills/refactor-audit/scripts/run-audit.ps1
```

※ または個別コマンドを実行：
```powershell
# 1. ESLint (認知的複雑度・行数・型安全性)
npx eslint apps packages -f json -o .agents/eslint-report.json

# 2. jscpd (重複コード検出)
npx jscpd apps packages --pattern "**/*.{ts,tsx}" --ignore "**/*.test.ts,**/*.spec.ts,**/node_modules/**,**/dist/**" --min-tokens 20 --reporters json --output .agents

# 3. madge (循環依存検出)
$madgeJson = npx madge --ts-config tsconfig.base.json --circular --json apps/ packages/
[System.IO.File]::WriteAllText(".agents/circular-report.json", ($madgeJson -join "`n"), [System.Text.UTF8Encoding]::new($false))
```

### Step 2: レポート集約と初期バックログ生成

集約スクリプトを実行して各解析レポートを統合し、テストファイルの存在確認と初期バックログを生成する。

```powershell
node .agents/skills/refactor-audit/scripts/aggregate-reports.mjs
```

### Step 3: コードとテストの文脈調査・評価精緻化

抽出された候補について、周辺コードおよびテストコードを精査し、以下の項目を評価・更新する。

- **`test_status` の厳密化**:
  - `findTestFile` でテストファイルが存在していても、該当の関数・クラスの振る舞いが実際に網羅されているかテスト内容を確認する。
  - テストが不十分な場合は `missing` として扱い、後続のリファクタリング着手前にテストガードの先行作成を促す。
- **改善方針（`approach`）の具体化**:
  - 単なる一般論ではなく、「早期リターン（ガード節）によるネスト解消」「プライベートヘルパー関数の切り出し」「共通ユーティリティ（`packages/utils`）への集約」など、具体的な改善案を明記する。
- **優先順位（ROI）の検討**:
  - 認知的複雑度が高く、かつ既存テストが充実している（`test_status: "covered"`）タスクを最優先とする。

### Step 4: バックログの確定と保存

精査したタスクを優先度順にソートし、`.agents/refactor-backlog.json` に保存する。

---

## 出力仕様 (`.agents/refactor-backlog.json`)

```json
[
  {
    "id": "REF-001",
    "target_file": "packages/utils/src/testing/template.utils.ts",
    "target_symbol": "flattenTemplate",
    "category": "Complexity",
    "metrics": {
      "cognitive_complexity": 28,
      "lines": 96
    },
    "issue_summary": "Refactor this function to reduce its Cognitive Complexity from 28 to the 15 allowed.",
    "approach": "Lit ブール属性置換ロジックおよび再帰展開処理を個別プライベート関数に分離し、早期リターンを導入",
    "scope": "internal",
    "test_status": "covered",
    "test_file": "packages/utils/src/testing/template.utils.test.ts",
    "risk_level": "Medium",
    "feasibility": "High",
    "status": "completed",
    "execution": {
      "completed_order": 1,
      "completed_at": "2026-09-24T16:26:11+09:00",
      "issue_number": 51,
      "pr_number": 52,
      "commit_hash": "6d6f496",
      "prompt_turns": 4,
      "regressions_detected": 0,
      "tests_passed": 336,
      "metrics_after": {
        "cognitive_complexity": 14,
        "function_lines": 42
      }
    }
  }
]
```

### フィールド定義

| フィールド | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | `string` | タスクの一意識別子（例: `REF-001`） |
| `target_file` | `string` | リポジトリルートからの相対パス |
| `target_symbol` | `string` | 対象の関数名、メソッド名、または対象行番号 |
| `category` | `string` | 課題種別（`Complexity`, `Duplication`, `TypeSafety`, `CircularDependency`） |
| `metrics` | `object` | 計測値（`cognitive_complexity`, `function_lines`, `tokens`, `duplicated_lines` 等） |
| `issue_summary` | `string` | 静的解析ルールまたは課題の要約 |
| `approach` | `string` | 適用する具体的なリファクタリング方針 |
| `scope` | `string` | スコープ（`internal`: 内部利用のみ / `public`: 外部公開API） |
| `test_status` | `string` | テスト担保状況（`covered`: テスト既存 / `missing`: テスト未作成） |
| `test_file` | `string \| null` | 関連するユニットテストのファイルパス |
| `risk_level` | `string` | リスク度（`Low`, `Medium`, `High`） |
| `feasibility` | `string` | 実現可能性・局所改修容易性（`High`, `Medium`, `Low`） |
| `status` | `string` | 進捗ステータス（`pending`, `in-progress`, `completed`, `skipped`, `failed`） |
| `execution` | `object \| null` | 完了時の実行プロセスおよび結果データ（未着手時は `null`） |

#### `execution` オブジェクトの内部定義（統計解析・プロセス追跡用）

| フィールド | 型 | 説明 |
| :--- | :--- | :--- |
| `completed_order` | `number` | タスクの消化・完了順序（時系列インデックス: 1, 2, 3...） |
| `completed_at` | `string` | 完了日時（ISO 8601 形式: 例 `2026-09-24T16:26:11+09:00`） |
| `issue_number` | `number` | 対応した GitHub Issue 番号 |
| `pr_number` | `number` | マージされた GitHub Pull Request 番号 |
| `commit_hash` | `string` | 該当のコミットハッシュ短縮形 |
| `prompt_turns` | `number` | AIプロンプト修正ターン数（指示・修正往復回数） |
| `regressions_detected` | `number` | リグレッション（既存機能・テスト破壊）検知件数（0件で大域破壊ゼロを証明） |
| `tests_passed` | `number` | PR マージ時点でのユニットテスト通過総件数 |
| `metrics_after` | `object` | リファクタリング適用後の実測メトリクス（複雑度、行数、重複トークン数等） |

---

## 統計解析・機械可読性の設計基準（Python / R 連携）

蓄積されたバックログ（`.agents/refactor-backlog.json`）は、Python（`pandas`）や R 言語（`jsonlite`）で直接読み込み、統計的検定（相関分析、前後比較検定等）や可視化（散布図、推移グラフ）を行うデータセットとして設計されています。

- **数値型の厳密化**: カウント値やメトリクスは文字列ではなく必ず `number` 型として保持する。
- **欠損値の標準化**: 未完了状態や非該当メトリクスは空文字や独自文字列ではなく JSON 標準の `null` を使用する（Python の `NaN`、R の `NA` に自動適合）。
- **ISO 8601 日時**: 時系列解析が容易に行えるよう、日時は常にタイムゾーンを含む ISO 8601 形式とする。

---

## 既存データ保全と台帳蓄積の原則（Historical Data Preservation）

リファクタリングバックログ（`.agents/refactor-backlog.json`）は、一度きりの作業リストではなく、**「開発・リファクタリングプロセスの変遷と効果測定を行うための永続的な蓄積台帳」** です。

1. **既存レコードの永久保護（No Deletions）**:
   - リファクタリングによって課題が解消され、静的解析ツールで検出されなくなった場合でも、該当のアイテムレコードを台帳から**絶対に削除・破棄してはならない**。
   - 解消された課題は `status: "completed"` とし、`execution` オブジェクトに完了実績（PR番号、コミット、完了後メトリクス等）を記録して保存する。
2. **再監査時の蓄積マージ（Append-Only Merging）**:
   - `aggregate-reports.mjs` や手動再監査を行う際は、既存台帳の全アイテムをベースとして保護し、**新規に検出された課題のみを末尾に追記（マージ）** する。
   - 既存の ID（`REF-xxx`）の振り直しや、過去の `execution` 記録の上書き初期化を行ってはならない。
3. **時系列データセットとしての完全性**:
   - 各アイテムの初期計測値（`metrics`）と完了後計測値（`metrics_after`）の対比を永久に保持することで、リファクタリング活動の定量的効果（重複率推移、複雑度削減率、大域破壊ゼロの証明）を継続的に統計解析可能とする。

