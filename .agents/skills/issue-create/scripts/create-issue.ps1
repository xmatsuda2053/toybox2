# create-issue.ps1
# タイトル・本文を安全に受け取り、gh issue create を実行するスクリプト

param (
    [Parameter(Mandatory = $false)]
    [string]$Title,

    [Parameter(Mandatory = $false)]
    [string]$TitleFile,

    [Parameter(Mandatory = $true)]
    [string]$BodyFile,

    [Parameter(Mandatory = $false)]
    [string[]]$Labels = @(),

    [Parameter(Mandatory = $false)]
    [string]$Repo,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$errorMessage = $null

# 1. 入力値の検証
$resolvedTitle = $null
if (-not [string]::IsNullOrWhiteSpace($TitleFile)) {
    if (Test-Path $TitleFile) {
        $resolvedTitle = (Get-Content $TitleFile -Raw -Encoding UTF8).Trim()
    } else {
        $errorMessage = "指定されたタイトルファイルが見つかりません: $TitleFile"
    }
} elseif (-not [string]::IsNullOrWhiteSpace($Title)) {
    $resolvedTitle = $Title.Trim()
} else {
    $errorMessage = "タイトルが指定されていません（Title または TitleFile を指定してください）。"
}

if ([string]::IsNullOrEmpty($errorMessage)) {
    if (-not (Test-Path $BodyFile)) {
        $errorMessage = "指定された本文ファイルが見つかりません: $BodyFile"
    }
}

# 2. gh コマンドの存在と認証チェック
if ([string]::IsNullOrEmpty($errorMessage)) {
    $isGhInstalled = ($null -ne (Get-Command gh -ErrorAction SilentlyContinue))
    if (-not $isGhInstalled) {
        $errorMessage = "GitHub CLI (gh) がインストールされていないか、PATH に通っていません。"
    } else {
        gh auth status 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            $errorMessage = "GitHub CLI が認証されていません。'gh auth login' を実行してください。"
        }
    }
}

# 3. 対象リポジトリの解決
$targetRepo = $Repo
if ([string]::IsNullOrEmpty($errorMessage) -and [string]::IsNullOrWhiteSpace($targetRepo)) {
    $remoteUrl = git remote get-url origin 2>$null
    if ($LASTEXITCODE -eq 0 -and (-not [string]::IsNullOrWhiteSpace($remoteUrl))) {
        $cleanUrl = $remoteUrl.Trim()
        if ($cleanUrl -match 'github\.com[:/]([^/]+/[^/]+?)(?:\.git)?/?$') {
            $targetRepo = $Matches[1]
        }
    }
    if ([string]::IsNullOrWhiteSpace($targetRepo)) {
        $errorMessage = "リポジトリが指定されておらず、リモート 'origin' からも取得できませんでした。"
    }
}

# エラー時の即時 JSON 返却
if (-not [string]::IsNullOrEmpty($errorMessage)) {
    $errorResult = [PSCustomObject]@{
        success      = $false
        issueNumber  = $null
        url          = $null
        title        = $resolvedTitle
        labels       = $Labels
        errorMessage = $errorMessage
    }
    $errorResult | ConvertTo-Json -Depth 5 -Compress
    exit 0
}

# 4. gh issue create の実行（引数スプラッティングで安全に実行）
$ghArgs = @("issue", "create", "--repo", $targetRepo, "--title", $resolvedTitle, "--body-file", $BodyFile)
$cleanLabels = @()
foreach ($label in $Labels) {
    if (-not [string]::IsNullOrWhiteSpace($label)) {
        $subLabels = $label -split ","
        foreach ($sub in $subLabels) {
            $trimmedSub = $sub.Trim("`"","'"," ")
            if (-not [string]::IsNullOrWhiteSpace($trimmedSub)) {
                $ghArgs += @("--label", $trimmedSub)
                $cleanLabels += $trimmedSub
            }
        }
    }
}

if ($DryRun) {
    $result = [PSCustomObject]@{
        success      = $true
        isDryRun     = $true
        issueNumber  = $null
        url          = "https://github.com/$targetRepo/issues/DRY_RUN"
        title        = $resolvedTitle
        labels       = $cleanLabels
        commandArgs  = $ghArgs
        errorMessage = $null
    }
    $result | ConvertTo-Json -Depth 5 -Compress
    exit 0
}

$output = gh @ghArgs 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0 -and (-not [string]::IsNullOrWhiteSpace($output))) {
    $issueUrl = ($output | Select-Object -Last 1).Trim()
    $issueNumber = $null
    if ($issueUrl -match '/issues/(\d+)$') {
        $issueNumber = [int]$Matches[1]
    }

    $result = [PSCustomObject]@{
        success      = $true
        issueNumber  = $issueNumber
        url          = $issueUrl
        title        = $resolvedTitle
        labels       = $cleanLabels
        errorMessage = $null
    }
    $result | ConvertTo-Json -Depth 5 -Compress
} else {
    $errorMsg = ($output -join "`n").Trim()
    $result = [PSCustomObject]@{
        success      = $false
        issueNumber  = $null
        url          = $null
        title        = $resolvedTitle
        labels       = $cleanLabels
        errorMessage = $errorMsg
    }
    $result | ConvertTo-Json -Depth 5 -Compress
}
