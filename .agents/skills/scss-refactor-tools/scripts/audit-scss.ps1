<#
.SYNOPSIS
    SCSSコードベースの重複・アンチパターン・トークン候補を静的解析し、監査レポートを出力するスクリプト。

.DESCRIPTION
    1. jscpd (mode: mild) によるSCSSコード重複ブロックの検出
    2. SCSSアンチパターン（!important, @extend, 3階層以上のネスト, タグ直指定セレクタ）の静的検出
    3. ハードコードされたカラーコード・寸法値の集約（デザイントークン候補の抽出）
    を実行し、コンソールサマリーおよび構造化 JSON レポートを出力します。

.PARAMETER TargetDir
    監査対象のディレクトリ（既定値: "apps/stepnote/src"）

.PARAMETER OutputDir
    レポートの出力先ディレクトリ（既定値: ".agents"）

.PARAMETER MinLines
    jscpd の最小重複行数（既定値: 5）

.PARAMETER MinTokens
    jscpd の最小重複トークン数（既定値: 20）

.PARAMETER JsonOutput
    JSON 文字列のみを標準出力するフラグ
#>

[CmdletBinding()]
param(
    [string]$TargetDir = "apps/stepnote/src",
    [string]$OutputDir = ".agents",
    [int]$MinLines = 5,
    [int]$MinTokens = 20,
    [switch]$JsonOutput
)

$ErrorActionPreference = "Continue"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$startTime = [System.DateTime]::Now
$tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "scss-audit-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # ----------------------------------------------------
    # 1. jscpd による SCSS 重複検出
    # ----------------------------------------------------
    if (-not $JsonOutput) {
        Write-Host "======================================================" -ForegroundColor Cyan
        Write-Host "  SCSS Refactor Audit Tool (scss-refactor-tools)     " -ForegroundColor Cyan
        Write-Host "======================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "[1/3] Running jscpd on SCSS files (mode: mild)..." -ForegroundColor Yellow
    }

    $jscpdTempOut = Join-Path $tempDir "jscpd"
    npx jscpd $TargetDir --pattern "**/*.scss" --mode mild --min-lines $MinLines --min-tokens $MinTokens --reporters json --output $jscpdTempOut 2>&1 | Out-Null

    $jscpdClones = 0
    $jscpdDuplicatedLines = 0
    $jscpdDuplicatedTokens = 0
    $jscpdDetails = @()

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
            if ($jscpdJson.duplicates) {
                foreach ($dup in $jscpdJson.duplicates) {
                    $jscpdDetails += @{
                        format = $dup.format
                        lines = $dup.lines
                        tokens = $dup.tokens
                        firstFile = $dup.firstFile.name
                        firstLine = $dup.firstFile.start
                        secondFile = $dup.secondFile.name
                        secondLine = $dup.secondFile.start
                        fragment = if ($dup.fragment) { $dup.fragment.Trim() } else { "" }
                    }
                }
            }
        } catch {
            # JSON パース失敗時は既定値維持
        }
    }

    # ----------------------------------------------------
    # 2. SCSS アンチパターンの静的走査
    # ----------------------------------------------------
    if (-not $JsonOutput) {
        Write-Host "[2/3] Scanning SCSS anti-patterns and rules..." -ForegroundColor Yellow
    }

    $scssFiles = Get-ChildItem -Path $TargetDir -Filter "*.scss" -Recurse | Where-Object { $_.FullName -notmatch "node_modules|dist" }
    
    $antiPatternIssues = @()
    $hardcodedColors = @{}
    $hardcodedPxValues = @{}

    foreach ($file in $scssFiles) {
        $relPath = $file.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
        $lines = Get-Content -Path $file.FullName -Encoding UTF8
        $currentNesting = 0

        for ($i = 0; $i -lt $lines.Count; $i++) {
            $lineNum = $i + 1
            $line = $lines[$i]
            $trimmed = $line.Trim()

            # コメント行はスキップ
            if ($trimmed.StartsWith("//") -or $trimmed.StartsWith("/*") -or $trimmed.StartsWith("*")) {
                continue
            }

            # 1. !important の検出
            if ($trimmed -match "!important") {
                $antiPatternIssues += @{
                    file = $relPath
                    line = $lineNum
                    type = "important_used"
                    severity = "error"
                    message = "!important declaration detected (specificity conflict risk)"
                    snippet = $trimmed
                }
            }

            # 2. @extend の検出
            if ($trimmed -match "@extend\s+") {
                $antiPatternIssues += @{
                    file = $relPath
                    line = $lineNum
                    type = "extend_used"
                    severity = "error"
                    message = "@extend detected (cascade breakage & Shadow DOM incompatibility)"
                    snippet = $trimmed
                }
            }

            # 3. ネスト深さの簡易追跡
            $openBraces = ([regex]::Matches($line, "\{")).Count
            $closeBraces = ([regex]::Matches($line, "\}")).Count
            $currentNesting += ($openBraces - $closeBraces)

            if ($currentNesting -gt 2 -and $openBraces -gt 0) {
                $antiPatternIssues += @{
                    file = $relPath
                    line = $lineNum
                    type = "deep_nesting"
                    severity = "warning"
                    message = "Deep selector nesting (> 2 levels) detected: nesting depth $currentNesting"
                    snippet = $trimmed
                }
            }

            # 4. タグ直指定セレクタ（button, div, span 等で開始しクラス指定のないブロック開始）
            if ($trimmed -match "^(button|div|span|ul|li|input|select|header|footer|nav|main|section|article|p|h[1-6])\s*\{") {
                $antiPatternIssues += @{
                    file = $relPath
                    line = $lineNum
                    type = "raw_tag_selector"
                    severity = "warning"
                    message = "Raw HTML tag selector without BEM class detected"
                    snippet = $trimmed
                }
            }

            # 5. ハードコードされたカラーリテラルの収集（#ffffff, rgba(...) 等）
            $colorMatches = [regex]::Matches($line, "(#[0-9a-fA-F]{3,8}|rgba?\([^\)]+\)|hsla?\([^\)]+\))")
            foreach ($m in $colorMatches) {
                $col = $m.Value.ToLower()
                if ($hardcodedColors.ContainsKey($col)) {
                    $hardcodedColors[$col]++
                } else {
                    $hardcodedColors[$col] = 1
                }
            }

            # 6. ハードコードされたピクセル寸法の収集（10px 以上を対象）
            $pxMatches = [regex]::Matches($line, "(?<![\w-])(\d{2,})px")
            foreach ($pm in $pxMatches) {
                $px = $pm.Value
                if ($hardcodedPxValues.ContainsKey($px)) {
                    $hardcodedPxValues[$px]++
                } else {
                    $hardcodedPxValues[$px] = 1
                }
            }
        }
    }

    # ----------------------------------------------------
    # 3. 監査レポートの集約と出力
    # ----------------------------------------------------
    if (-not $JsonOutput) {
        Write-Host "[3/3] Generating audit summary and token candidates..." -ForegroundColor Yellow
    }

    $tokenCandidates = @{
        colors = $hardcodedColors
        dimensions = $hardcodedPxValues
    }

    $duration = [Math]::Round(([System.DateTime]::Now - $startTime).TotalSeconds, 2)

    $auditReport = @{
        timestamp = [System.DateTime]::Now.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz")
        targetDir = $TargetDir
        durationSeconds = $duration
        summary = @{
            scannedFiles = $scssFiles.Count
            jscpdClones = $jscpdClones
            duplicatedLines = $jscpdDuplicatedLines
            duplicatedTokens = $jscpdDuplicatedTokens
            antiPatternErrors = ($antiPatternIssues | Where-Object { $_.severity -eq 'error' }).Count
            antiPatternWarnings = ($antiPatternIssues | Where-Object { $_.severity -eq 'warning' }).Count
            uniqueHardcodedColors = $hardcodedColors.Keys.Count
        }
        duplicates = $jscpdDetails
        antiPatterns = $antiPatternIssues
        tokenCandidates = $tokenCandidates
    }

    $outJsonPath = Join-Path $OutputDir "scss-audit-report.json"
    $reportJsonString = $auditReport | ConvertTo-Json -Depth 6
    [System.IO.File]::WriteAllText($outJsonPath, $reportJsonString, [System.Text.UTF8Encoding]::new($false))

    if ($JsonOutput) {
        Write-Output $reportJsonString
    } else {
        Write-Host ""
        Write-Host "======================================================" -ForegroundColor Cyan
        Write-Host "  SCSS Audit Summary Report                           " -ForegroundColor Cyan
        Write-Host "======================================================" -ForegroundColor Cyan
        Write-Host " Scanned Files       : $($scssFiles.Count) SCSS files"
        Write-Host " Code Clones (jscpd) : $jscpdClones clone(s) ($jscpdDuplicatedLines duplicated lines, $jscpdDuplicatedTokens tokens)" -ForegroundColor $(if ($jscpdClones -eq 0) { "Green" } else { "Yellow" })
        Write-Host " Anti-pattern Errors : $(($antiPatternIssues | Where-Object { $_.severity -eq 'error' }).Count) (!important / @extend)" -ForegroundColor $(if (($antiPatternIssues | Where-Object { $_.severity -eq 'error' }).Count -eq 0) { "Green" } else { "Red" })
        Write-Host " Anti-pattern Warns  : $(($antiPatternIssues | Where-Object { $_.severity -eq 'warning' }).Count) (deep nesting / raw tag selectors)" -ForegroundColor $(if (($antiPatternIssues | Where-Object { $_.severity -eq 'warning' }).Count -eq 0) { "Green" } else { "Yellow" })
        Write-Host " Unique Raw Colors   : $($hardcodedColors.Keys.Count) distinct colors found"
        Write-Host "------------------------------------------------------"
        Write-Host " Report File Saved   : $outJsonPath" -ForegroundColor Green
        Write-Host " Total Audit Time    : ${duration}s"
        Write-Host "======================================================" -ForegroundColor Cyan
        Write-Host ""
    }
}
finally {
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
    }
}
