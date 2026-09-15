# inspect-context.ps1
# GitHub Issue 作成のためのプロジェクト情報および GitHub 情報を一括収集するスクリプト

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 1. 外部コマンド（git, gh）の存在チェック
$isGitInstalled = ($null -ne (Get-Command git -ErrorAction SilentlyContinue))
$isGhInstalled  = ($null -ne (Get-Command gh -ErrorAction SilentlyContinue))
$isAuthenticated = $false
$errorMessage   = $null

if (-not $isGitInstalled) {
    $errorMessage = "Git がインストールされていないか、PATH に通っていません。"
} elseif (-not $isGhInstalled) {
    $errorMessage = "GitHub CLI (gh) がインストールされていないか、PATH に通っていません。"
} else {
    # 2. gh 認証状態の確認
    gh auth status 2>&1 | Out-Null
    $isAuthenticated = ($LASTEXITCODE -eq 0)
    if (-not $isAuthenticated) {
        $errorMessage = "GitHub CLI が認証されていません。'gh auth login' を実行してください。"
    }
}

# 3. Git リポジトリおよびリモート URL の検証
$repo = $null
$branch = $null
if ($isGitInstalled -and [string]::IsNullOrEmpty($errorMessage)) {
    $isGitRepo = git rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0 -or $isGitRepo -ne "true") {
        $errorMessage = "現在のディレクトリは Git リポジトリではありません。"
    } else {
        $remoteUrl = git remote get-url origin 2>$null
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($remoteUrl)) {
            $errorMessage = "Git リモート 'origin' が見つかりません。"
        } else {
            $cleanUrl = $remoteUrl.Trim()
            if ($cleanUrl -match 'github\.com[:/]([^/]+/[^/]+?)(?:\.git)?/?$') {
                $repo = $Matches[1]
            } else {
                $errorMessage = "GitHub リポジトリ URL の形式を解析できませんでした: $cleanUrl"
            }
        }
    }
}

# エラーが存在する場合は、他のフィールドを null にして即時返却
if (-not [string]::IsNullOrEmpty($errorMessage)) {
    $errorResult = [PSCustomObject]@{
        repo            = $null
        branch          = $null
        isGitInstalled  = $isGitInstalled
        isGhInstalled   = $isGhInstalled
        isAuthenticated = $isAuthenticated
        errorMessage    = $errorMessage
        labels          = $null
        recentIssues    = $null
        projectInfo     = $null
    }
    $errorResult | ConvertTo-Json -Depth 10 -Compress
    exit 0
}

# 4. ブランチ名の取得
$branchRaw = git branch --show-current 2>$null
$branch = if (-not [string]::IsNullOrWhiteSpace($branchRaw)) { $branchRaw.Trim() } else { $null }

# 5. ラベル一覧の取得（常に配列を保証）
$labels = @()
$labelsJson = gh label list --repo $repo --json name,description 2>$null
if (-not [string]::IsNullOrWhiteSpace($labelsJson)) {
    try {
        $parsedLabels = $labelsJson | ConvertFrom-Json -ErrorAction Stop
        if ($null -ne $parsedLabels) {
            $labels = @($parsedLabels)
        }
    } catch {
        $labels = @()
    }
}

# 6. 直近のオープンな Issue 一覧（常に配列を保証）
$recentIssues = @()
$issuesJson = gh issue list --repo $repo --state open --limit 10 --json number,title 2>$null
if (-not [string]::IsNullOrWhiteSpace($issuesJson)) {
    try {
        $parsedIssues = $issuesJson | ConvertFrom-Json -ErrorAction Stop
        if ($null -ne $parsedIssues) {
            $recentIssues = @($parsedIssues)
        }
    } catch {
        $recentIssues = @()
    }
}

# 7. package.json の情報取得（プロパティの安全アクセス）
$projectInfo = $null
if (Test-Path "package.json") {
    try {
        $pkg = Get-Content "package.json" -Raw -Encoding UTF8 | ConvertFrom-Json -ErrorAction Stop
        if ($null -ne $pkg) {
            $hasScripts = ($null -ne $pkg.scripts)
            $hasDevDeps = ($null -ne $pkg.devDependencies)
            $hasDeps    = ($null -ne $pkg.dependencies)

            $projectInfo = [PSCustomObject]@{
                name        = $pkg.name
                scripts     = $pkg.scripts
                workspaces  = $pkg.workspaces
                hasTests    = ($hasScripts -and ($null -ne $pkg.scripts.test))
                hasVitest   = (($hasDevDeps -and ($null -ne $pkg.devDependencies.vitest)) -or ($hasDeps -and ($null -ne $pkg.dependencies.vitest)))
            }
        }
    } catch {
        $projectInfo = $null
    }
}

# 正常時の JSON 出力（Depth 10）
$result = [PSCustomObject]@{
    repo            = $repo
    branch          = $branch
    isGitInstalled  = $isGitInstalled
    isGhInstalled   = $isGhInstalled
    isAuthenticated = $isAuthenticated
    errorMessage    = $null
    labels          = $labels
    recentIssues    = $recentIssues
    projectInfo     = $projectInfo
}

$result | ConvertTo-Json -Depth 10 -Compress
