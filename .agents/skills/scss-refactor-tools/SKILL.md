---
name: scss-refactor-tools
description: SCSSコードベースの監査・重複検出・アンチパターン検出、およびリファクタリング後の品質ゲート（テスト・型・重複・ビルド）を一括実測・検証する統合ツールスキル。
---

# SCSS Refactor Tools Skill (`scss-refactor-tools`)

## 目的

フロントエンド開発（Web Components / Lit アプリケーション）において、SCSSコードの重複、無効コード、アンチパターン（`!important`, `@extend`, 深すぎるネスト, タグ直指定）を客観的数値で診断し、リファクタリング後の品質ゲート（単体テスト、型安全性、SCSS重複ゼロ、単一HTMLビルド）を一括実測・検証するための統合ツールスキルです。

本スキルは、**Phase 0 の「現状監査（Audit）」** と **Phase 1〜3 の「品質検証（Verify）」** の2つの独立した実行モードを提供します。

---

## 2大機能と品質ゲート基準

### 1. 監査機能（Audit Mode: `audit-scss.ps1`）
リファクタリング着手前の現状把握、重複コードの特定、およびデザイントークン候補の抽出を行います。

| 検査項目 | 検出ツール / 手法 | 抽出対象 | トリアージ分類 |
| :--- | :--- | :--- | :--- |
| **コード重複** | `jscpd` (mode: mild, SCSS直接解析) | クローン数、重複行数、重複トークン数 | P2（共通Mixin候補） |
| **禁止構文** | 静的AST走査 | `!important`, `@extend` の使用箇所 | P1 / Error（即時是正） |
| **詳細度インフレ** | ネスト深さ追跡 | 3階層以上のセレクタネスト | P3（簡易BEM移行） |
| **タグ直指定** | 要素セレクタ走査 | BEMクラスのない `button`, `div` 等 | P3（簡易BEM移行） |
| **トークン候補** | リテラル値集約 | ハードコードされたカラー、余白寸法 | P1（トークン化先行） |

### 2. 品質検証機能（Verify Mode: `verify-scss.ps1`）
リファクタリング適用後、画面崩壊やリグレッションが生じていないかを副作用ゼロで一括実測します。

| 品質ゲート項目 | 実行コマンド | 合格基準 |
| :--- | :--- | :--- |
| **1. 単体テスト** | `vitest run` | 全件パス、失敗 0 件 (`regressionsDetected: 0`) |
| **2. 静的型チェック** | `tsc --noEmit` | エラー 0 件 (`exitCode: 0`) |
| **3. SCSS重複実測** | `jscpd` (mode: mild, SCSS対象) | 重複クローン 0 件 (`clones: 0`) |
| **4. アンチパターン** | 静的ゼロ検証 | `!important`, `@extend` が 0 件 |
| **5. 単一HTMLビルド** | `npm run build:stepnote` | ビルド成功、単一 HTML 生成 |

---

## 実行方法（Windows PowerShell）

### 1. 現状監査の実行（Audit Mode）

#### 標準実行（コンソールサマリー表示）
```powershell
pwsh -File .agents/skills/scss-refactor-tools/scripts/audit-scss.ps1
```

#### JSON 出力（自動化・レポート保存）
```powershell
pwsh -File .agents/skills/scss-refactor-tools/scripts/audit-scss.ps1 -OutputDir ".agents"
```

---

### 2. 品質ゲートの検証実行（Verify Mode）

#### 標準実行（コンソールサマリー表示）
```powershell
pwsh -File .agents/skills/scss-refactor-tools/scripts/verify-scss.ps1
```

#### 検証結果を JSON ファイルに保存（PR記録用）
```powershell
pwsh -File .agents/skills/scss-refactor-tools/scripts/verify-scss.ps1 -OutputFile ".agents/scss-verify-results.json"
```

#### JSON 文字列のみを出力（パイプライン連携用）
```powershell
pwsh -File .agents/skills/scss-refactor-tools/scripts/verify-scss.ps1 -JsonOutput
```

---

## 出力例

### 1. 監査サマリー表示（Audit）
```text
======================================================
  SCSS Refactor Audit Tool (scss-refactor-tools)     
======================================================

[1/3] Running jscpd on SCSS files (mode: mild)...
[2/3] Scanning SCSS anti-patterns and rules...
[3/3] Generating audit summary and token candidates...

======================================================
  SCSS Audit Summary Report                           
======================================================
 Scanned Files       : 12 SCSS files
 Code Clones (jscpd) : 3 clone(s) (42 duplicated lines, 128 tokens)
 Anti-pattern Errors : 0 (!important / @extend)
 Anti-pattern Warns  : 2 (deep nesting / raw tag selectors)
 Unique Raw Colors   : 14 distinct colors found
------------------------------------------------------
 Report File Saved   : .agents/scss-audit-report.json
 Total Audit Time    : 1.84s
======================================================
```

### 2. 品質検証サマリー表示（Verify）
```text
======================================================
  SCSS Refactor Verification Gate (scss-refactor-tools)
======================================================

[1/5] Running unit tests (vitest run)...
[2/5] Running TypeScript type check (tsc --noEmit)...
[3/5] Measuring SCSS duplication (jscpd mode: mild)...
[4/5] Verifying zero anti-patterns (!important, @extend)...
[5/5] Building standalone singlefile package...

======================================================
  SCSS Refactor Verification Summary                  
======================================================
 [PASS] Unit Tests       : 32/32 files (383 tests passed, failed: 0)
 [PASS] Type Check       : 0 errors
 [PASS] SCSS Clones      : 0 clones (0 lines, 0 tokens)
 [PASS] Anti-patterns    : 0 violations (!important / @extend)
 [PASS] Standalone Build : Success (apps/stepnote/dist/index.html, 583.49 kB)
------------------------------------------------------
 RESULT: ALL SCSS QUALITY GATES PASSED (12.1s)
======================================================
```
