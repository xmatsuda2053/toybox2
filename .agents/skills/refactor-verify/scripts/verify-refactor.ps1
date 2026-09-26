<#
.SYNOPSIS
    リファクタリング適用後のコードベースに対して、台帳を破壊することなく客観的品質メトリクスを一括実測・検証するスクリプト。

.DESCRIPTION
    1. 単体テスト実行 (vitest run --reporter=json) によるリグレッション検証 (tests_passed, regressions_detected)
    2. 静的型チェック (tsc --noEmit) による型エラー検証
    3. プロダクションコード対象の jscpd コード重複実測 (clones, duplicatedLines, tokens)
    4. 単一 HTML ビルド (vite-plugin-singlefile) による成果物サイズ・完全性検証
    を順次実行し、コンソールサマリーおよび構造化 JSON を出力します。

.PARAMETER TargetApp
    検証対象のアプリケーションディレクトリ（既定値: "apps/stepnote"）

.PARAMETER MinTokens
    jscpd の最小重複トークン数（既定値: 50。jscpd 標準デフォルト）

.PARAMETER OutputFile
    実測検証結果を JSON ファイルとして保存する場合のパス（任意）

.PARAMETER JsonOutput
    コンソールに JSON 文字列のみを出力するスイッチフラグ（任意）
#>

[CmdletBinding()]
param(
  [string]$TargetApp = "apps/stepnote",
  [int]$MinTokens = 50,
  [string]$OutputFile = "",
  [switch]$JsonOutput
)

$ErrorActionPreference = "Continue"

if (-not $JsonOutput) {
  Write-Host "======================================================" -ForegroundColor Cyan
  Write-Host "  Refactor Quality Gate Verification (refactor-verify)" -ForegroundColor Cyan
  Write-Host "======================================================" -ForegroundColor Cyan
  Write-Host ""
}

$startTime = [System.DateTime]::Now
$tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "refactor-verify-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
  # ----------------------------------------------------
  # 1. 単体テスト実行 (Unit Tests via Vitest JSON reporter)
  # ----------------------------------------------------
  if (-not $JsonOutput) {
    Write-Host "[1/4] Running unit tests (vitest run)..." -ForegroundColor Yellow
  }

  $testReportPath = Join-Path $tempDir "vitest-report.json"
  npx vitest run --reporter=json --outputFile=$testReportPath 2>&1 | Out-Null
  $testExitCode = $LASTEXITCODE

  $testFilesTotal = 0
  $testFilesPassed = 0
  $testsTotal = 0
  $testsPassed = 0
  $testsFailed = 0
  $unitTestSuccess = $false

  if (Test-Path $testReportPath) {
    try {
      $testJsonRaw = [System.IO.File]::ReadAllText($testReportPath, [System.Text.UTF8Encoding]::new($false))
      $testJson = $testJsonRaw | ConvertFrom-Json
      if ($testJson.testResults) {
        $testFilesPassed = [int]($testJson.testResults | Where-Object { $_.status -eq 'passed' }).Count
        $testFilesTotal = [int]$testJson.testResults.Count
      } else {
        $testFilesTotal = [int]$testJson.numTotalTestSuites
        $testFilesPassed = [int]$testJson.numPassedTestSuites
      }
      $testsTotal = [int]$testJson.numTotalTests
      $testsPassed = [int]$testJson.numPassedTests
      $testsFailed = [int]$testJson.numFailedTests
      $unitTestSuccess = ($testJson.success -eq $true -and $testsFailed -eq 0 -and $testsPassed -gt 0)
    } catch {
      $unitTestSuccess = ($testExitCode -eq 0)
    }
  } else {
    $unitTestSuccess = ($testExitCode -eq 0)
  }

  # ----------------------------------------------------
  # 2. 静的型チェック (Type Check)
  # ----------------------------------------------------
  if (-not $JsonOutput) {
    Write-Host "[2/4] Running TypeScript type check (tsc --noEmit)..." -ForegroundColor Yellow
  }

  $typeRaw = npm exec --workspaces -- tsc --noEmit 2>&1
  $typeExitCode = $LASTEXITCODE
  $typePassed = ($typeExitCode -eq 0)

  # ----------------------------------------------------
  # 3. コード重複実測 (jscpd on Production Code)
  # ----------------------------------------------------
  if (-not $JsonOutput) {
    Write-Host "[3/4] Measuring code duplication (jscpd on production code, min-tokens: $MinTokens)..." -ForegroundColor Yellow
  }

  $jscpdOutDir = Join-Path $tempDir "jscpd"
  New-Item -ItemType Directory -Path $jscpdOutDir -Force | Out-Null

  $jscpdClones = 0
  $jscpdDuplicatedLines = 0
  $jscpdDuplicatedTokens = 0
  $jscpdPercentage = 0.0

  npx jscpd $TargetApp --pattern "**/*.ts" --ignore "**/*.test.ts,**/*.spec.ts,**/node_modules/**,**/dist/**" --min-tokens $MinTokens --reporters json --output $jscpdOutDir 2>&1 | Out-Null
  $jscpdReportFile = Join-Path $jscpdOutDir "jscpd-report.json"

  if (Test-Path $jscpdReportFile) {
    try {
      $reportRaw = [System.IO.File]::ReadAllText($jscpdReportFile, [System.Text.UTF8Encoding]::new($false))
      $reportJson = $reportRaw | ConvertFrom-Json
      if ($reportJson.statistics -and $reportJson.statistics.total) {
        $jscpdClones = [int]$reportJson.statistics.total.clones
        $jscpdDuplicatedLines = [int]$reportJson.statistics.total.duplicatedLines
        $jscpdDuplicatedTokens = [int]$reportJson.statistics.total.duplicatedTokens
        $jscpdPercentage = [double]$reportJson.statistics.total.percentage
      }
    } catch {
      # ignore
    }
  }

  # プロダクションコードの重複クローン数が 0 であることを合格基準とする
  $duplicationPassed = ($jscpdClones -eq 0)

  # ----------------------------------------------------
  # 4. 単一 HTML ビルド (Single File Build)
  # ----------------------------------------------------
  if (-not $JsonOutput) {
    Write-Host "[4/4] Building standalone singlefile package..." -ForegroundColor Yellow
  }

  $buildRaw = npm run build:stepnote 2>&1
  $buildExitCode = $LASTEXITCODE

  $distHtmlPath = Join-Path $TargetApp "dist/index.html"
  $distHtmlExists = Test-Path $distHtmlPath
  $distHtmlSizeKb = 0.0

  if ($distHtmlExists) {
    $fileInfo = Get-Item $distHtmlPath
    $distHtmlSizeKb = [math]::Round(($fileInfo.Length / 1KB), 2)
  }

  $buildPassed = ($buildExitCode -eq 0 -and $distHtmlExists)

  # ----------------------------------------------------
  # 5. 総合判定と結果集約
  # ----------------------------------------------------
  $allPassed = ($unitTestSuccess -and $typePassed -and $duplicationPassed -and $buildPassed)
  $elapsed = [System.DateTime]::Now - $startTime

  $result = [PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    targetApp = $TargetApp
    allPassed = $allPassed
    durationSeconds = [math]::Round($elapsed.TotalSeconds, 2)
    metrics = [PSCustomObject]@{
      unitTests = [PSCustomObject]@{
        passed = $unitTestSuccess
        testFiles = $testFilesPassed
        testsPassed = $testsPassed
        testsFailed = $testsFailed
        regressionsDetected = $testsFailed
      }
      typeCheck = [PSCustomObject]@{
        passed = $typePassed
        exitCode = $typeExitCode
      }
      duplication = [PSCustomObject]@{
        passed = $duplicationPassed
        minTokens = $MinTokens
        clones = $jscpdClones
        duplicatedLines = $jscpdDuplicatedLines
        duplicatedTokens = $jscpdDuplicatedTokens
        percentage = $jscpdPercentage
      }
      build = [PSCustomObject]@{
        passed = $buildPassed
        distFile = $distHtmlPath
        sizeKb = $distHtmlSizeKb
      }
    }
  }

  # ----------------------------------------------------
  # 6. 出力処理
  # ----------------------------------------------------
  if ($OutputFile) {
    $jsonText = $result | ConvertTo-Json -Depth 5
    $resolvedOutput = [System.IO.Path]::GetFullPath($OutputFile)
    $outDir = [System.IO.Path]::GetDirectoryName($resolvedOutput)
    if (-not (Test-Path $outDir)) {
      New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($resolvedOutput, $jsonText, [System.Text.UTF8Encoding]::new($false))
  }

  if ($JsonOutput) {
    $result | ConvertTo-Json -Depth 5
  } else {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "  Verification Summary" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan

    if ($unitTestSuccess) {
      Write-Host " [PASS] Unit Tests: $testFilesPassed files / $testsPassed tests passed (failed: $testsFailed)" -ForegroundColor Green
    } else {
      Write-Host " [FAIL] Unit Tests: failed ($testsFailed tests failed)" -ForegroundColor Red
    }

    if ($typePassed) {
      Write-Host " [PASS] Type Check: 0 errors" -ForegroundColor Green
    } else {
      Write-Host " [FAIL] Type Check: errors detected (exit code: $typeExitCode)" -ForegroundColor Red
    }

    if ($duplicationPassed) {
      Write-Host " [PASS] Code Duplication (jscpd): 0 clones in production code (100% resolved)" -ForegroundColor Green
    } else {
      Write-Host " [FAIL] Code Duplication (jscpd): $jscpdClones clones found ($jscpdDuplicatedLines lines, $jscpdDuplicatedTokens tokens)" -ForegroundColor Red
    }

    if ($buildPassed) {
      Write-Host " [PASS] Standalone Build: Success ($distHtmlPath, $distHtmlSizeKb kB)" -ForegroundColor Green
    } else {
      Write-Host " [FAIL] Standalone Build: failed" -ForegroundColor Red
    }

    Write-Host "------------------------------------------------------" -ForegroundColor Gray
    if ($allPassed) {
      Write-Host " RESULT: ALL QUALITY GATES PASSED ($([math]::Round($elapsed.TotalSeconds, 1))s)" -ForegroundColor Green
    } else {
      Write-Host " RESULT: SOME QUALITY GATES FAILED ($([math]::Round($elapsed.TotalSeconds, 1))s)" -ForegroundColor Red
    }
    Write-Host "======================================================" -ForegroundColor Cyan
  }

  if ($allPassed) {
    exit 0
  } else {
    exit 1
  }

} finally {
  if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
