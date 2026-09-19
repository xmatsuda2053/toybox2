# inspect-context.ps1
# リポジトリのコンテキスト（環境、ブランチ、ラベル、直近コミット、関連Issue、プロジェクト情報）を一括収集するスクリプト

param (
    [Parameter(Mandatory = $false)]
    [ValidateSet("Issue", "PR")]
    [string]$Mode = "Issue",

    [Parameter(Mandatory = $false)]
    [string]$BaseBranch = "main",

    [Parameter(Mandatory = $false)]
    [string]$Keyword,

    [Parameter(Mandatory = $false)]
    [string]$FilePath,

    [Parameter(Mandatory = $false)]
    [int]$CommitLimit = 5,

    [Parameter(Mandatory = $false)]
    [int]$IssueLimit = 10
)

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
        recentCommits   = $null
        fileContext     = $null
        projectInfo     = $null
        prContext       = $null
    }
    $errorResult | ConvertTo-Json -Depth 10 -Compress
    exit 0
}

# 4. ブランチ名の取得
$branchRaw = git branch --show-current 2>$null
$branch = if (-not [string]::IsNullOrWhiteSpace($branchRaw)) { $branchRaw.Trim() } else { $null }

# PRモード時のブランチ前提チェック
if ($Mode -eq "PR" -and $branch -eq $BaseBranch) {
    $errorResult = [PSCustomObject]@{
        repo            = $repo
        branch          = $branch
        isGitInstalled  = $isGitInstalled
        isGhInstalled   = $isGhInstalled
        isAuthenticated = $isAuthenticated
        errorMessage    = "カレントブランチがベースブランチ ('$BaseBranch') と同一です。PRを作成するにはトピックブランチで実行してください。"
        labels          = $null
        recentIssues    = $null
        recentCommits   = $null
        fileContext     = $null
        projectInfo     = $null
        prContext       = $null
    }
    $errorResult | ConvertTo-Json -Depth 10 -Compress
    exit 0
}

# 5. ラベル一覧の取得（常に配列を保証）
$labels = @()
$labelsJson = gh label list --repo $repo --json name,description,color 2>$null
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

# 6. package.json の情報取得（プロパティの安全アクセス）
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

# モードごとのコンテキスト取得
$recentIssues = @()
$recentCommits = @()
$fileContext = $null
$prContext = $null

if ($Mode -eq "Issue") {
    # Issue モード固有のコンテキスト収集
    if (-not [string]::IsNullOrWhiteSpace($Keyword)) {
        $issuesJson = gh issue list --repo $repo --search "$Keyword" --limit $IssueLimit --json number,title,state,url 2>$null
    } else {
        $issuesJson = gh issue list --repo $repo --state open --limit $IssueLimit --json number,title,state,url 2>$null
    }

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

    $gitLogArgs = @("log", "-n", "$CommitLimit", "--pretty=format:%h`t%an`t%ad`t%s", "--date=iso")
    if (-not [string]::IsNullOrWhiteSpace($FilePath)) {
        $gitLogArgs += @("--", $FilePath)
    }

    $commitLines = git @gitLogArgs 2>$null
    if ($null -ne $commitLines) {
        foreach ($line in $commitLines) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            $parts = $line -split "`t", 4
            if ($parts.Length -ge 4) {
                $recentCommits += [PSCustomObject]@{
                    hash    = $parts[0]
                    author  = $parts[1]
                    date    = $parts[2]
                    message = $parts[3]
                }
            }
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($FilePath)) {
        $fileContext = [PSCustomObject]@{
            path   = $FilePath
            exists = (Test-Path $FilePath)
        }
    }
} elseif ($Mode -eq "PR") {
    # PR モード固有のコンテキスト収集
    # 1. 未コミット変更の取得
    $statusLines = git status --porcelain 2>$null
    $uncommittedFiles = @()
    if ($null -ne $statusLines) {
        foreach ($sLine in $statusLines) {
            if (-not [string]::IsNullOrWhiteSpace($sLine)) {
                $uncommittedFiles += $sLine.Trim()
            }
        }
    }

    # 2. Base〜Head 間のコミット履歴一覧
    $prCommits = @()
    $prLogLines = git log "$BaseBranch..HEAD" --pretty=format:"%h`t%an`t%ad`t%s" --date=iso 2>$null
    if ($null -ne $prLogLines) {
        foreach ($line in $prLogLines) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            $parts = $line -split "`t", 4
            if ($parts.Length -ge 4) {
                $prCommits += [PSCustomObject]@{
                    hash    = $parts[0]
                    author  = $parts[1]
                    date    = $parts[2]
                    message = $parts[3]
                }
            }
        }
    }

    # 3. 差分統計および変更ファイル一覧
    $diffStatRaw = git diff --stat "$BaseBranch...HEAD" 2>$null
    $diffStat = if ($null -ne $diffStatRaw) { ($diffStatRaw -join "`n").Trim() } else { "" }

    $changedFiles = @()
    $nameStatusLines = git diff --name-status "$BaseBranch...HEAD" 2>$null
    if ($null -ne $nameStatusLines) {
        foreach ($ns in $nameStatusLines) {
            if ([string]::IsNullOrWhiteSpace($ns)) { continue }
            $nsParts = $ns -split "`t", 2
            if ($nsParts.Length -ge 2) {
                $changedFiles += [PSCustomObject]@{
                    status = $nsParts[0].Trim()
                    path   = $nsParts[1].Trim()
                }
            }
        }
    }

    # 4. 関連 Issue 番号の自動抽出
    $detectedIssueNumbers = @()
    if ($branch -match '(?:^|/)(?:issue-?)?(\d+)(?:-|$|\b)') {
        $detectedIssueNumbers += [int]$Matches[1]
    }
    foreach ($c in $prCommits) {
        if ($c.message -match '(?:#|Closes |Fixes )(\d+)') {
            $detectedIssueNumbers += [int]$Matches[1]
        }
    }
    $detectedIssueNumbers = @($detectedIssueNumbers | Select-Object -Unique)

    $relatedIssue = $null
    if ($detectedIssueNumbers.Count -gt 0) {
        $primaryIssueId = $detectedIssueNumbers[0]
        $issueJson = gh issue view $primaryIssueId --repo $repo --json number,title,body,labels,url 2>$null
        if (-not [string]::IsNullOrWhiteSpace($issueJson)) {
            try {
                $relatedIssue = $issueJson | ConvertFrom-Json -ErrorAction SilentlyContinue
            } catch {
                $relatedIssue = $null
            }
        }
    }

    # 5. プッシュ状態・リモート追跡ブランチの確認
    $upstream = git rev-parse --abbrev-ref "@{upstream}" 2>$null
    $isUpstreamConfigured = ($LASTEXITCODE -eq 0 -and (-not [string]::IsNullOrWhiteSpace($upstream)))
    $unpushedCommitCount = 0
    if ($isUpstreamConfigured) {
        $cherryLines = git cherry -v 2>$null
        if ($null -ne $cherryLines) {
            $unpushed = @($cherryLines | Where-Object { $_ -match '^\+' })
            $unpushedCommitCount = $unpushed.Count
        }
    } else {
        $unpushedCommitCount = $prCommits.Count
    }

    # 6. 既存 PR の確認
    $existingPr = $null
    $prListJson = gh pr list --repo $repo --head "$branch" --json number,title,url,state,isDraft 2>$null
    if (-not [string]::IsNullOrWhiteSpace($prListJson)) {
        try {
            $prs = $prListJson | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($null -ne $prs -and $prs.Count -gt 0) {
                $existingPr = $prs[0]
            }
        } catch {
            $existingPr = $null
        }
    }

    $prContext = [PSCustomObject]@{
        baseBranch            = $BaseBranch
        headBranch            = $branch
        hasUncommittedChanges = ($uncommittedFiles.Count -gt 0)
        uncommittedFiles      = $uncommittedFiles
        commitCount           = $prCommits.Count
        commits               = $prCommits
        diffStat              = $diffStat
        changedFiles          = $changedFiles
        detectedIssueNumbers  = $detectedIssueNumbers
        relatedIssue          = $relatedIssue
        isUpstreamConfigured  = $isUpstreamConfigured
        unpushedCommitCount   = $unpushedCommitCount
        existingPr            = $existingPr
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
    recentCommits   = $recentCommits
    fileContext     = $fileContext
    projectInfo     = $projectInfo
    prContext       = $prContext
}

$result | ConvertTo-Json -Depth 10 -Compress
