---
name: refactor-verify
description: "リファクタリング後のコードベースに対し、台帳への副作用（上書き・削除）なく単体テスト・型チェック・コード重複・単一HTMLビルドを一括実測・検証するスキル。"
---

# Refactor Verify Skill (`refactor-verify`)

## 目的

リファクタリング適用後のコードベースに対して、バックログ台帳（`.agents/refactor-backlog.json`）を上書き・破壊することなく、客観的な品質メトリクス（単体テスト、型安全性、コード重複、スタンドアロンビルド）を**副作用ゼロ（Read-Only）**で一括実測・検証します。

実測結果はコンソールに整形サマリーとして表示されるほか、機械可読な JSON 形式で出力できるため、**Pull Request の「## 検証結果」セクションへの明記** や **バックログの `execution.metrics_after` への記録** にそのまま再利用できます。

---

## 4大品質ゲート基準

| ゲート項目 | 実行ツール | 抽出メトリクス | 合格基準 |
| :--- | :--- | :--- | :--- |
| **1. 単体テスト** | `vitest run` | `testsPassed`, `testsFailed`, `regressionsDetected` | 全件パス、失敗 0 件 (`regressions_detected: 0`) |
| **2. 静的型チェック** | `tsc --noEmit` | `exitCode` | エラー 0 件 |
| **3. コード重複実測** | `jscpd` (プロダクションコード) | `clones`, `duplicatedLines`, `duplicatedTokens` | プロダクション重複 0 件 (`clones: 0`) |
| **4. スタンドアロンビルド** | `npm run build:stepnote` | `distHtmlExists`, `sizeKb` | ビルド成功、単一 HTML 生成 |

---

## 実行方法

### 1. 標準実行（コンソールサマリー表示）

```powershell
pwsh -File .agents/skills/refactor-verify/scripts/verify-refactor.ps1
```

### 2. 対象アプリケーションの指定

```powershell
pwsh -File .agents/skills/refactor-verify/scripts/verify-refactor.ps1 -TargetApp "apps/stepnote"
```

### 3. JSON 出力（パイプライン・自動化用）

```powershell
pwsh -File .agents/skills/refactor-verify/scripts/verify-refactor.ps1 -JsonOutput
```

### 4. 結果をファイルに保存

```powershell
pwsh -File .agents/skills/refactor-verify/scripts/verify-refactor.ps1 -OutputFile ".agents/verify-results.json"
```

---

## 出力例

### コンソールサマリー

```text
======================================================
  Refactor Quality Gate Verification (refactor-verify)
======================================================

[1/4] Running unit tests (vitest run)...
[2/4] Running TypeScript type check (tsc --noEmit)...
[3/4] Measuring code duplication (jscpd on production code)...
[4/4] Building standalone singlefile package...

======================================================
  Verification Summary
======================================================
 [PASS] Unit Tests: 32 files / 383 tests passed (failed: 0)
 [PASS] Type Check: 0 errors
 [PASS] Code Duplication (jscpd): 0 clones in production code (100% resolved)
 [PASS] Standalone Build: Success (apps/stepnote/dist/index.html, 583.49 kB)
------------------------------------------------------
 RESULT: ALL QUALITY GATES PASSED (11.2s)
======================================================
```

### JSON 出力仕様

```json
{
  "timestamp": "2026-09-26T14:30:00.000+09:00",
  "targetApp": "apps/stepnote",
  "allPassed": true,
  "durationSeconds": 11.2,
  "metrics": {
    "unitTests": {
      "passed": true,
      "testFiles": 32,
      "testsPassed": 383,
      "testsFailed": 0,
      "regressionsDetected": 0
    },
    "typeCheck": {
      "passed": true,
      "exitCode": 0
    },
    "duplication": {
      "passed": true,
      "clones": 0,
      "duplicatedLines": 0,
      "duplicatedTokens": 0,
      "percentage": 0.0
    },
    "build": {
      "passed": true,
      "distFile": "apps/stepnote/dist/index.html",
      "sizeKb": 583.49
    }
  }
}
```

---

## 活用プロトコル

1. **Pull Request 作成時の活用**:
   - `verify-refactor.ps1` を実行し、出力された数値（テスト件数、型チェック成否、重複クローン数、成果物サイズ）を PR の「## 検証結果」に転記する。
2. **バックログの `execution` 記録時の活用**:
   - `metrics.duplication` および `metrics.unitTests` の数値を、そのまま台帳の `execution.tests_passed`、`execution.regressions_detected`、`execution.metrics_after` に代入・記録する。
