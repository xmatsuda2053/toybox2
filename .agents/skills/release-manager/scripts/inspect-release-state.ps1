# inspect-release-state.ps1
# 各アプリの現在バージョン・整合性・前回タグ以降のコミット履歴・推奨次バージョン・Git/Wiki 状態を一括収集する読み取り専用スクリプト

param (
    [Parameter(Mandatory = $false)]
    [string]$AppId,

    [Parameter(Mandatory = $false)]
    [string]$RepoRoot,

    [Parameter(Mandatory = $false)]
    [switch]$Pretty
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function ConvertTo-OutputJson {
    param (
        [Parameter(Mandatory = $true)]
        [object]$Object,
        [switch]$PrettyPrint
    )
    if ($PrettyPrint) {
        return ($Object | ConvertTo-Json -Depth 10)
    }
    return ($Object | ConvertTo-Json -Depth 10 -Compress)
}

function Parse-SemVer {
    param ([string]$VersionText)
    if ($VersionText -match '^(\d+)\.(\d+)\.(\d+)$') {
        return [PSCustomObject]@{
            major = [int]$Matches[1]
            minor = [int]$Matches[2]
            patch = [int]$Matches[3]
            raw   = $VersionText
        }
    }
    return $null
}

function Get-NextVersionCandidates {
    param ([string]$BaseVersion)
    $sv = Parse-SemVer -VersionText $BaseVersion
    if ($null -eq $sv) {
        return $null
    }
    return [PSCustomObject]@{
        patch = "$($sv.major).$($sv.minor).$($sv.patch + 1)"
        minor = "$($sv.major).$($sv.minor + 1).0"
        major = "$($sv.major + 1).0.0"
    }
}

function Determine-BumpType {
    param ([object[]]$Commits)
    if ($null -eq $Commits -or $Commits.Count -eq 0) {
        return "none"
    }
    $hasBreaking = $false
    $hasFeat = $false
    foreach ($c in $Commits) {
        $msg = [string]$c.subject
        if ($msg -match '^[a-z]+(\([^)]+\))?!:' -or $msg -match 'BREAKING CHANGE') {
            $hasBreaking = $true
        } elseif ($msg -match '^feat(\([^)]+\))?:') {
            $hasFeat = $true
        }
    }
    if ($hasBreaking) { return "major" }
    if ($hasFeat) { return "minor" }
    return "patch"
}

$resolvedRoot = if ([string]::IsNullOrWhiteSpace($RepoRoot)) { (Get-Location).Path } else { (Resolve-Path $RepoRoot).Path }
$configPath = Join-Path $resolvedRoot ".agents/skills/release-manager/config/release-apps.json"

if (-not (Test-Path $configPath)) {
    $err = [PSCustomObject]@{
        generatedAt  = (Get-Date).ToString("o")
        errorMessage = "設定ファイルが見つかりません: $configPath"
    }
    ConvertTo-OutputJson -Object $err -PrettyPrint:$Pretty
    exit 0
}

$config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json

Push-Location $resolvedRoot
try {
    $isGitInstalled = ($null -ne (Get-Command git -ErrorAction SilentlyContinue))
    $isGhInstalled = ($null -ne (Get-Command gh -ErrorAction SilentlyContinue))
    $isGhAuthenticated = $false
    if ($isGhInstalled) {
        gh auth status 2>&1 | Out-Null
        $isGhAuthenticated = ($LASTEXITCODE -eq 0)
    }

    $branch = ""
    $isWorkingTreeClean = $false
    $repoSlug = $null
    $isMainUpToDate = $null
    $wikiInitialized = $false
    $wikiUrl = $null

    if ($isGitInstalled) {
        $branchRaw = git branch --show-current 2>$null
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($branchRaw)) {
            $branch = $branchRaw.Trim()
        }

        $statusRaw = @(git status --porcelain 2>$null)
        $isWorkingTreeClean = ($statusRaw.Count -eq 0)

        $remoteUrl = git remote get-url origin 2>$null
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($remoteUrl)) {
            if ($remoteUrl.Trim() -match 'github\.com[:/]([^/]+/[^/]+?)(?:\.git)?/?$') {
                $repoSlug = $Matches[1]
            }
        }

        $localMain = git rev-parse main 2>$null
        $remoteMain = git rev-parse origin/main 2>$null
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($localMain) -and -not [string]::IsNullOrWhiteSpace($remoteMain)) {
            $isMainUpToDate = ($localMain.Trim() -eq $remoteMain.Trim())
        }

        if (-not [string]::IsNullOrWhiteSpace($repoSlug)) {
            $wikiGitUrl = "https://github.com/$repoSlug.wiki.git"
            $wikiUrl = "https://github.com/$repoSlug/wiki"
            git ls-remote $wikiGitUrl 2>&1 | Out-Null
            $wikiInitialized = ($LASTEXITCODE -eq 0)
        }
    }

    # 未登録アプリの自動検知
    $configuredDirs = @($config.apps | ForEach-Object { $_.workspaceDir.Replace('\', '/') })
    $unregisteredApps = @()
    $appsDir = Join-Path $resolvedRoot "apps"
    if (Test-Path $appsDir) {
        foreach ($dir in (Get-ChildItem -Path $appsDir -Directory)) {
            $rel = "apps/$($dir.Name)"
            if ($configuredDirs -notcontains $rel) {
                $unregisteredApps += $rel
            }
        }
    }

    # 既存 GitHub Releases の一括取得
    $allReleases = @()
    if ($isGhInstalled -and $isGhAuthenticated -and -not [string]::IsNullOrWhiteSpace($repoSlug)) {
        $relJson = gh release list --repo $repoSlug --limit 100 --json tagName,name,publishedAt,isDraft,isPrerelease 2>$null
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($relJson)) {
            $parsed = $relJson | ConvertFrom-Json
            if ($null -ne $parsed) {
                $allReleases = @($parsed)
            }
        }
    }

    # 対象アプリ絞り込み
    $targetApps = @($config.apps)
    if (-not [string]::IsNullOrWhiteSpace($AppId)) {
        $targetApps = @($config.apps | Where-Object { $_.id -eq $AppId })
        if ($targetApps.Count -eq 0) {
            $validIds = ($config.apps | ForEach-Object { $_.id }) -join ", "
            $err = [PSCustomObject]@{
                generatedAt  = (Get-Date).ToString("o")
                errorMessage = "指定された AppId '$AppId' は設定カタログに存在しません。利用可能: $validIds"
            }
            ConvertTo-OutputJson -Object $err -PrettyPrint:$Pretty
            exit 0
        }
    }

    $appStates = @()
    foreach ($app in $targetApps) {
        $versionDetails = @()
        $uniqueVersions = @()
        foreach ($vf in $app.versionFiles) {
            $fullPath = Join-Path $resolvedRoot $vf.path
            $ver = $null
            $exists = Test-Path $fullPath
            if ($exists) {
                $jsonObj = Get-Content $fullPath -Raw -Encoding UTF8 | ConvertFrom-Json
                $ver = [string]$jsonObj.version
                if ($uniqueVersions -notcontains $ver) {
                    $uniqueVersions += $ver
                }
            }
            $versionDetails += [PSCustomObject]@{
                path    = $vf.path
                exists  = $exists
                version = $ver
            }
        }

        $currentVersion = if ($versionDetails.Count -gt 0) { $versionDetails[0].version } else { $null }
        $isVersionConsistent = ($uniqueVersions.Count -eq 1)

        # タグ一覧（SemVer降順）
        $tagPattern = "$($app.tagPrefix)@v*"
        $rawTags = @(git tag -l $tagPattern 2>$null | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
        $sortedTags = @(
            $rawTags |
            ForEach-Object {
                $t = $_.Trim()
                $verPart = $t -replace "^$([regex]::Escape($app.tagPrefix))@v", ""
                $sv = Parse-SemVer -VersionText $verPart
                [PSCustomObject]@{
                    tag     = $t
                    version = $verPart
                    major   = if ($sv) { $sv.major } else { -1 }
                    minor   = if ($sv) { $sv.minor } else { -1 }
                    patch   = if ($sv) { $sv.patch } else { -1 }
                }
            } |
            Sort-Object -Property major, minor, patch -Descending
        )

        $latestTag = if ($sortedTags.Count -gt 0) { $sortedTags[0].tag } else { $null }
        $latestTagVersion = if ($sortedTags.Count -gt 0) { $sortedTags[0].version } else { $null }

        $appReleases = @($allReleases | Where-Object { $_.tagName -like "$($app.tagPrefix)@v*" })
        $latestRelease = if ($appReleases.Count -gt 0) { $appReleases[0] } else { $null }

        # 前回タグ以降のコミット一覧
        $rangeArg = if ($null -ne $latestTag) { "$latestTag..HEAD" } else { "HEAD" }
        $watchArgs = @($app.watchPaths)
        $gitLogArgs = @("log", $rangeArg, "--no-merges", "--pretty=format:%h`t%ad`t%s", "--date=short", "-n", "50", "--") + $watchArgs
        $logLines = @(git @gitLogArgs 2>$null | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

        $commitsSinceLastTag = @()
        foreach ($line in $logLines) {
            $parts = $line -split "`t", 3
            if ($parts.Count -eq 3) {
                $commitsSinceLastTag += [PSCustomObject]@{
                    hash    = $parts[0]
                    date    = $parts[1]
                    subject = $parts[2]
                }
            }
        }

        $recommendedBump = Determine-BumpType -Commits $commitsSinceLastTag
        $baseForCandidates = if ($null -ne $latestTagVersion) { $latestTagVersion } else { $currentVersion }
        $candidates = Get-NextVersionCandidates -BaseVersion $baseForCandidates

        $suggestedNextVersion = $null
        if ($null -eq $latestTag) {
            # 初回リリース時は現在バージョン（0.1.0等）または推奨バンプ案を提示
            $suggestedNextVersion = $currentVersion
        } elseif ($null -ne $candidates) {
            switch ($recommendedBump) {
                "major" { $suggestedNextVersion = $candidates.major }
                "minor" { $suggestedNextVersion = $candidates.minor }
                "patch" { $suggestedNextVersion = $candidates.patch }
                default { $suggestedNextVersion = $candidates.patch }
            }
        }

        $expectedTagForCurrent = "$($app.tagPrefix)@v$currentVersion"
        $isCurrentVersionTagged = ($rawTags -contains $expectedTagForCurrent)
        $changelogFullPath = Join-Path $resolvedRoot $app.changelogPath

        $appStates += [PSCustomObject]@{
            id                     = $app.id
            displayName            = $app.displayName
            workspaceDir           = $app.workspaceDir
            appType                = $app.appType
            tagPrefix              = $app.tagPrefix
            wikiPage               = $app.wikiPage
            currentVersion         = $currentVersion
            isVersionConsistent    = $isVersionConsistent
            versionFiles           = $versionDetails
            hasChangelog           = (Test-Path $changelogFullPath)
            changelogPath          = $app.changelogPath
            latestTag              = $latestTag
            latestTagVersion       = $latestTagVersion
            isCurrentVersionTagged = $isCurrentVersionTagged
            readyToPublishCurrent  = ($isVersionConsistent -and (-not $isCurrentVersionTagged))
            publishedReleaseCount  = $appReleases.Count
            latestRelease          = $latestRelease
            commitsSinceLastTagCount = $commitsSinceLastTag.Count
            commitsSinceLastTag    = $commitsSinceLastTag
            recommendedBump        = $recommendedBump
            suggestedNextVersion   = $suggestedNextVersion
            nextVersionCandidates  = $candidates
            expectedAssetName      = ($app.artifactNameTemplate -replace '\{\{version\}\}', $currentVersion)
        }
    }

    $result = [PSCustomObject]@{
        generatedAt      = (Get-Date).ToString("o")
        errorMessage     = $null
        repository       = [PSCustomObject]@{
            repoSlug           = $repoSlug
            branch             = $branch
            isMainBranch       = ($branch -eq "main")
            isWorkingTreeClean = $isWorkingTreeClean
            isMainUpToDate     = $isMainUpToDate
            isGitInstalled     = $isGitInstalled
            isGhInstalled      = $isGhInstalled
            isGhAuthenticated  = $isGhAuthenticated
            wikiInitialized    = $wikiInitialized
            wikiUrl            = $wikiUrl
        }
        unregisteredApps = $unregisteredApps
        apps             = $appStates
    }

    ConvertTo-OutputJson -Object $result -PrettyPrint:$Pretty
} finally {
    Pop-Location
}
