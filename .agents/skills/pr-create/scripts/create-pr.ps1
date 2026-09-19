# create-pr.ps1
# タイトル・本文を安全に受け取り、事前検証およびリモート push を行い、gh pr create を実行するスクリプト

param (
    [Parameter(Mandatory = $false)]
    [string]$Title,

    [Parameter(Mandatory = $false)]
    [string]$TitleFile,

    [Parameter(Mandatory = $true)]
    [string]$BodyFile,

    [Parameter(Mandatory = $false)]
    [string]$Base = "main",

    [Parameter(Mandatory = $false)]
    [string]$Head,

    [Parameter(Mandatory = $false)]
    [switch]$Draft,

    [Parameter(Mandatory = $false)]
    [switch]$AutoPush,

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

# 2. git, gh コマンドの存在と認証チェック
if ([string]::IsNullOrEmpty($errorMessage)) {
    $isGitInstalled = ($null -ne (Get-Command git -ErrorAction SilentlyContinue))
    $isGhInstalled  = ($null -ne (Get-Command gh -ErrorAction SilentlyContinue))

    if (-not $isGitInstalled) {
        $errorMessage = "Git がインストールされていないか、PATH に通っていません。"
    } elseif (-not $isGhInstalled) {
        $errorMessage = "GitHub CLI (gh) がインストールされていないか、PATH に通っていません。"
    } else {
        gh auth status 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            $errorMessage = "GitHub CLI が認証されていません。'gh auth login' を実行してください。"
        }
    }
}

# 3. 対象リポジトリおよびブランチの解決
$targetRepo = $Repo
$resolvedHead = $Head

if ([string]::IsNullOrEmpty($errorMessage)) {
    if ([string]::IsNullOrWhiteSpace($resolvedHead)) {
        $currentBranchRaw = git branch --show-current 2>$null
        if ($LASTEXITCODE -eq 0 -and (-not [string]::IsNullOrWhiteSpace($currentBranchRaw))) {
            $resolvedHead = $currentBranchRaw.Trim()
        } else {
            $errorMessage = "現在のブランチ名を取得できませんでした。"
        }
    }

    if ([string]::IsNullOrEmpty($errorMessage)) {
        if ($resolvedHead -eq $Base) {
            $errorMessage = "ベースブランチ ('$Base') 上から PR を作成することはできません。トピックブランチを指定してください。"
        }
    }
}

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
        prNumber     = $null
        url          = $null
        title        = $resolvedTitle
        baseBranch   = $Base
        headBranch   = $resolvedHead
        isDraft      = [bool]$Draft
        errorMessage = $errorMessage
    }
    $errorResult | ConvertTo-Json -Depth 5 -Compress
    exit 0
}

# 4. リモートプッシュ状態の確認および AutoPush 処理
$upstream = git rev-parse --abbrev-ref "@{upstream}" 2>$null
$isUpstreamConfigured = ($LASTEXITCODE -eq 0 -and (-not [string]::IsNullOrWhiteSpace($upstream)))

$needsPush = $false
if (-not $isUpstreamConfigured) {
    $needsPush = $true
} else {
    $cherryLines = git cherry -v 2>$null
    if ($null -ne $cherryLines) {
        $unpushed = @($cherryLines | Where-Object { $_ -match '^\+' })
        if ($unpushed.Count -gt 0) {
            $needsPush = $true
        }
    }
}

if ($needsPush) {
    if ($AutoPush) {
        if (-not $DryRun) {
            $pushOutput = git push -u origin $resolvedHead 2>&1
            if ($LASTEXITCODE -ne 0) {
                $errorResult = [PSCustomObject]@{
                    success      = $false
                    prNumber     = $null
                    url          = $null
                    title        = $resolvedTitle
                    baseBranch   = $Base
                    headBranch   = $resolvedHead
                    isDraft      = [bool]$Draft
                    errorMessage = "リモートへのプッシュに失敗しました: $($pushOutput -join ' ')"
                }
                $errorResult | ConvertTo-Json -Depth 5 -Compress
                exit 0
            }
        }
    } else {
        $errorResult = [PSCustomObject]@{
            success      = $false
            prNumber     = $null
            url          = $null
            title        = $resolvedTitle
            baseBranch   = $Base
            headBranch   = $resolvedHead
            isDraft      = [bool]$Draft
            errorMessage = "ブランチ '$resolvedHead' はリモートにプッシュされていないか、未プッシュのコミットがあります。先に push を実行するか、-AutoPush を指定してください。"
        }
        $errorResult | ConvertTo-Json -Depth 5 -Compress
        exit 0
    }
}

# 5. gh pr create の引数構築（スプラッティング）
$ghArgs = @("pr", "create", "--repo", $targetRepo, "--base", $Base, "--head", $resolvedHead, "--title", $resolvedTitle, "--body-file", $BodyFile)
if ($Draft) {
    $ghArgs += "--draft"
}

if ($DryRun) {
    $result = [PSCustomObject]@{
        success      = $true
        isDryRun     = $true
        prNumber     = $null
        url          = "https://github.com/$targetRepo/pull/DRY_RUN"
        title        = $resolvedTitle
        baseBranch   = $Base
        headBranch   = $resolvedHead
        isDraft      = [bool]$Draft
        commandArgs  = $ghArgs
        errorMessage = $null
    }
    $result | ConvertTo-Json -Depth 5 -Compress
    exit 0
}

# 6. gh pr create の実行
$output = gh @ghArgs 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0 -and (-not [string]::IsNullOrWhiteSpace($output))) {
    $prUrl = ($output | Select-Object -Last 1).Trim()
    $prNumber = $null
    if ($prUrl -match '/pull/(\d+)$') {
        $prNumber = [int]$Matches[1]
    }

    $result = [PSCustomObject]@{
        success      = $true
        prNumber     = $prNumber
        url          = $prUrl
        title        = $resolvedTitle
        baseBranch   = $Base
        headBranch   = $resolvedHead
        isDraft      = [bool]$Draft
        errorMessage = $null
    }
    $result | ConvertTo-Json -Depth 5 -Compress
} else {
    $errorMsg = ($output -join "`n").Trim()
    $result = [PSCustomObject]@{
        success      = $false
        prNumber     = $null
        url          = $null
        title        = $resolvedTitle
        baseBranch   = $Base
        headBranch   = $resolvedHead
        isDraft      = [bool]$Draft
        errorMessage = $errorMsg
    }
    $result | ConvertTo-Json -Depth 5 -Compress
}
