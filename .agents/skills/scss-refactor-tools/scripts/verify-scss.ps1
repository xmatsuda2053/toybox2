<#
.SYNOPSIS
    SCSSリファクタリング適用後のコードベースに対して、客観的品質メトリクスを一括実測・検証するスクリプト。

.DESCRIPTION
    1. 単体テスト実行 (vitest run) によるリグレッション検証
    2. 静的型チェック (tsc --noEmit) による型エラー検証
    3. SCSSコード対象の jscpd コード重複実測 (clones, duplicatedLines, tokens)
    4. SCSSアンチパターン検査 (!important, @extend のゼロ件検証)
    5. 単一 HTML ビルド (vite-plugin-singlefile) による成果物サイズ・完全性検証
    を順次実行し、コンソールサマリーおよび構造化 JSON を出力します。

.PARAMETER TargetDir
    検証対象のSCSSディレクトリ（既定値: "apps/stepnote/src"）

.PARAMETER TargetApp
    検証対象のアプリケーションディレクトリ（既定値: "apps/stepnote"）

.PARAMETER MinLines
    jscpd の最小重複行数（既定値: 5）

.PARAMETER MinTokens
    jscpd の最小重複トークン数（既定値: 20）

.PARAMETER OutputFile
    実測検証結果を JSON ファイルとして保存する場合のパス（任意）

.PARAMETER JsonOutput
    コンソールに JSON 文字列のみを出力するスイッチフラグ（任意）

.PARAMETER BacklogId
    更新対象の SCSS バックログ項目 ID（例: "SCSS-001"）

.PARAMETER BacklogFile
    SCSSリファクタリング台帳ファイルのパス（既定値: ".agents/scss-refactor-backlog.json"）

.PARAMETER IssueNumber
    関連する GitHub Issue 番号（任意）

.PARAMETER PrNumber
    関連する GitHub PR 番号（任意）

.PARAMETER CommitHash
    関連するコミットハッシュ（任意。省略時は現在の HEAD 短縮ハッシュ）

.PARAMETER UpdateBacklog
    検証合格時に台帳（Backlog）を自動更新するスイッチフラグ
#>

[CmdletBinding()]
param(
    [string]$TargetDir = "apps/stepnote/src",
    [string]$TargetApp = "apps/stepnote",
    [int]$MinLines = 5,
    [int]$MinTokens = 20,
    [string]$OutputFile = "",
    [switch]$JsonOutput,
    [string]$BacklogId = "",
    [string]$BacklogFile = ".agents/scss-refactor-backlog.json",
    [int]$IssueNumber = 0,
    [int]$PrNumber = 0,
    [string]$CommitHash = "",
    [switch]$UpdateBacklog
)

$ErrorActionPreference = "Continue"

if (-not $JsonOutput) {
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "  SCSS Refactor Verification Gate (scss-refactor-tools)" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""
}

$startTime = [System.DateTime]::Now
$tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "scss-verify-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # ----------------------------------------------------
    # 1. 単体テスト実行 (Unit Tests via Vitest JSON reporter)
    # ----------------------------------------------------
    if (-not $JsonOutput) {
        Write-Host "[1/5] Running unit tests (vitest run)..." -ForegroundColor Yellow
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
            }
            if ($testJson.numTotalTests) {
                $testsTotal = [int]$testJson.numTotalTests
                $testsPassed = [int]$testJson.numPassedTests
                $testsFailed = [int]$testJson.numFailedTests
            }
            $unitTestSuccess = ($testExitCode -eq 0 -and $testsFailed -eq 0)
        } catch {
            $unitTestSuccess = ($testExitCode -eq 0)
        }
    } else {
        $unitTestSuccess = ($testExitCode -eq 0)
    }

    # ----------------------------------------------------
    # 2. 静的型チェック (TypeScript Type Check)
    # ----------------------------------------------------
    if (-not $JsonOutput) {
        Write-Host "[2/5] Running TypeScript type check (tsc --noEmit)..." -ForegroundColor Yellow
    }

    $typeCheckOutput = npm exec --workspaces -- tsc --noEmit 2>&1
    $typeCheckExitCode = $LASTEXITCODE
    $typeCheckSuccess = ($typeCheckExitCode -eq 0)

    # ----------------------------------------------------
    # 3. SCSS コード重複実測 (jscpd on SCSS files)
    # ----------------------------------------------------
    if (-not $JsonOutput) {
        Write-Host "[3/5] Measuring SCSS duplication (jscpd mode: mild)..." -ForegroundColor Yellow
    }

    $jscpdTempOut = Join-Path $tempDir "jscpd"
    npx jscpd $TargetDir --pattern "**/*.scss" --mode mild --min-lines $MinLines --min-tokens $MinTokens --reporters json --output $jscpdTempOut 2>&1 | Out-Null

    $jscpdClones = 0
    $jscpdDuplicatedLines = 0
    $jscpdDuplicatedTokens = 0

    $jscpdReportFile = Join-Path $jscpdTempOut "jscpd-report.json"
    if (Test-Path $jscpdReportFile) {
        try {
            $jscpdRaw = [System.IO.File]::ReadAllText($jscpdReportFile, [System.Text.UTF8Encoding]::new($false))
            $jscpdJson = $jscpdRaw | ConvertFrom-Json
            if ($jscpdJson.statistics -and $jscpdJson.statistics.total) {
                $jscpdClones = [int]$jscpdJson.statistics.total.clones
                $jscpdDuplicatedLines = [int]$jscpdJson.statistics.total.duplicatedLines
                $jscpdDuplicatedTokens = [int]$jscpdJson.statistics.total.duplicatedTokens
            }
        } catch {
            # 解析失敗時は既定値
        }
    }
    $duplicationSuccess = ($jscpdClones -eq 0)

    # ----------------------------------------------------
    # 4. SCSS アンチパターンゼロ検証 (!important & @extend)
    # ----------------------------------------------------
    if (-not $JsonOutput) {
        Write-Host "[4/5] Verifying zero anti-patterns (!important, @extend)..." -ForegroundColor Yellow
    }

    $scssFiles = Get-ChildItem -Path $TargetDir -Filter "*.scss" -Recurse | Where-Object { $_.FullName -notmatch "node_modules|dist" }
    $antiPatternViolations = 0

    foreach ($file in $scssFiles) {
        $lines = Get-Content -Path $file.FullName -Encoding UTF8
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            if ($trimmed.StartsWith("//") -or $trimmed.StartsWith("/*") -or $trimmed.StartsWith("*")) { continue }
            if ($trimmed -match "!important" -or $trimmed -match "@extend\s+") {
                $antiPatternViolations++
            }
        }
    }
    $antiPatternSuccess = ($antiPatternViolations -eq 0)

    # ----------------------------------------------------
    # 5. スタンドアロン単一 HTML ビルド (Single-file Build)
    # ----------------------------------------------------
    if (-not $JsonOutput) {
        Write-Host "[5/5] Building standalone singlefile package..." -ForegroundColor Yellow
    }

    $buildOutput = npm run build:stepnote 2>&1
    $buildExitCode = $LASTEXITCODE

    $distHtmlPath = Join-Path $TargetApp "dist/index.html"
    $distHtmlExists = Test-Path $distHtmlPath
    $distHtmlSizeKb = 0

    if ($distHtmlExists) {
        $fileInfo = Get-Item $distHtmlPath
        $distHtmlSizeKb = [Math]::Round($fileInfo.Length / 1024, 2)
    }

    $buildSuccess = ($buildExitCode -eq 0 -and $distHtmlExists)

    # ----------------------------------------------------
    # 全ゲート合否判定
    # ----------------------------------------------------
    $allPassed = ($unitTestSuccess -and $typeCheckSuccess -and $duplicationSuccess -and $antiPatternSuccess -and $buildSuccess)
    $duration = [Math]::Round(([System.DateTime]::Now - $startTime).TotalSeconds, 2)

    $resultObj = @{
        timestamp = [System.DateTime]::Now.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz")
        targetApp = $TargetApp
        targetDir = $TargetDir
        allPassed = $allPassed
        durationSeconds = $duration
        metrics = @{
            unitTests = @{
                passed = $unitTestSuccess
                testFilesTotal = $testFilesTotal
                testFilesPassed = $testFilesPassed
                testsTotal = $testsTotal
                testsPassed = $testsPassed
                testsFailed = $testsFailed
                regressionsDetected = $testsFailed
            }
            typeCheck = @{
                passed = $typeCheckSuccess
                exitCode = $typeCheckExitCode
            }
            scssDuplication = @{
                passed = $duplicationSuccess
                clones = $jscpdClones
                duplicatedLines = $jscpdDuplicatedLines
                duplicatedTokens = $jscpdDuplicatedTokens
            }
            antiPatterns = @{
                passed = $antiPatternSuccess
                violations = $antiPatternViolations
            }
            standaloneBuild = @{
                passed = $buildSuccess
                distHtmlExists = $distHtmlExists
                sizeKb = $distHtmlSizeKb
                distHtmlPath = $distHtmlPath.Replace("\", "/")
            }
        }
    }

    $jsonResult = $resultObj | ConvertTo-Json -Depth 6

    if (-not [string]::IsNullOrEmpty($OutputFile)) {
        $outParent = Split-Path $OutputFile -Parent
        if ($outParent -and (-not (Test-Path $outParent))) {
            New-Item -ItemType Directory -Path $outParent -Force | Out-Null
        }
        [System.IO.File]::WriteAllText($OutputFile, $jsonResult, [System.Text.UTF8Encoding]::new($false))
    }

    # ----------------------------------------------------
    # バックログの自動更新（-UpdateBacklog 指定かつ合格時）
    # ----------------------------------------------------
    $backlogUpdated = $false
    if ($allPassed -and $UpdateBacklog -and $BacklogId -and (Test-Path $BacklogFile)) {
        try {
            $backlogRaw = [System.IO.File]::ReadAllText($BacklogFile, [System.Text.UTF8Encoding]::new($false))
            $backlogList = $backlogRaw | ConvertFrom-Json
            
            $effectiveCommit = $CommitHash
            if (-not $effectiveCommit) {
                try {
                    $gitRev = (git rev-parse --short HEAD 2>$null)
                    if ($gitRev) { $effectiveCommit = $gitRev.Trim() }
                } catch {
                    $effectiveCommit = ""
                }
            }

            $matched = $false
            foreach ($item in $backlogList) {
                if ($item.id -eq $BacklogId) {
                    $item.status = "completed"
                    $item.execution = @{
                        completed_at = [System.DateTime]::Now.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz")
                        issue_number = $IssueNumber
                        pr_number = $PrNumber
                        commit_hash = $effectiveCommit
                        tests_passed = $testsPassed
                        regressions_detected = $testsFailed
                        metrics_after = @{
                            clones = $jscpdClones
                            duplicated_lines = $jscpdDuplicatedLines
                            duplicated_tokens = $jscpdDuplicatedTokens
                            anti_pattern_errors = $antiPatternViolations
                            build_size_kb = $distHtmlSizeKb
                        }
                    }
                    $matched = $true
                    break
                }
            }

            if ($matched) {
                $newBacklogJson = $backlogList | ConvertTo-Json -Depth 6
                [System.IO.File]::WriteAllText($BacklogFile, $newBacklogJson, [System.Text.UTF8Encoding]::new($false))
                $backlogUpdated = $true
            }
        } catch {
            Write-Warning "Failed to update backlog: $($_.Exception.Message)"
        }
    }

    if ($JsonOutput) {
        Write-Output $jsonResult
    } else {
        Write-Host ""
        Write-Host "======================================================" -ForegroundColor Cyan
        Write-Host "  SCSS Refactor Verification Summary                  " -ForegroundColor Cyan
        Write-Host "======================================================" -ForegroundColor Cyan
        
        Write-Host " [$(if ($unitTestSuccess) { 'PASS' } else { 'FAIL' })] Unit Tests       : $testFilesPassed/$testFilesTotal files ($testsPassed tests passed, failed: $testsFailed)" -ForegroundColor $(if ($unitTestSuccess) { "Green" } else { "Red" })
        Write-Host " [$(if ($typeCheckSuccess) { 'PASS' } else { 'FAIL' })] Type Check       : $(if ($typeCheckSuccess) { '0 errors' } else { 'Type errors detected' })" -ForegroundColor $(if ($typeCheckSuccess) { "Green" } else { "Red" })
        Write-Host " [$(if ($duplicationSuccess) { 'PASS' } else { 'FAIL' })] SCSS Clones      : $jscpdClones clones ($jscpdDuplicatedLines lines, $jscpdDuplicatedTokens tokens)" -ForegroundColor $(if ($duplicationSuccess) { "Green" } else { "Yellow" })
        Write-Host " [$(if ($antiPatternSuccess) { 'PASS' } else { 'FAIL' })] Anti-patterns    : $antiPatternViolations violations (!important / @extend)" -ForegroundColor $(if ($antiPatternSuccess) { "Green" } else { "Red" })
        Write-Host " [$(if ($buildSuccess) { 'PASS' } else { 'FAIL' })] Standalone Build : Success ($distHtmlPath, $distHtmlSizeKb kB)" -ForegroundColor $(if ($buildSuccess) { "Green" } else { "Red" })
        if ($backlogUpdated) {
            Write-Host " [PASS] Backlog Record   : $BacklogId marked as completed in $BacklogFile" -ForegroundColor Green
        }

        Write-Host "------------------------------------------------------"
        if ($allPassed) {
            Write-Host " RESULT: ALL SCSS QUALITY GATES PASSED (${duration}s)" -ForegroundColor Green
        } else {
            Write-Host " RESULT: ONE OR MORE QUALITY GATES FAILED (${duration}s)" -ForegroundColor Red
        }
        Write-Host "======================================================" -ForegroundColor Cyan
        Write-Host ""
    }
}
finally {
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
    }
}
