# sync-wiki.ps1
# 公開済み GitHub Releases から GitHub Wiki のダウンロードポータル（Home / _Sidebar / アプリ別ページ）を自動生成・同期するスクリプト

param (
    [Parameter(Mandatory = $false)]
    [string]$Repo,

    [Parameter(Mandatory = $false)]
    [string]$PreviewDir,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun,

    [Parameter(Mandatory = $false)]
    [string]$RepoRoot
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Emit-Result {
    param ([object]$Result)
    $Result | ConvertTo-Json -Depth 10 -Compress
    exit 0
}

function Parse-SemVerKey {
    param ([string]$VersionText)
    if ($VersionText -match '^(\d+)\.(\d+)\.(\d+)$') {
        return ([int]$Matches[1] * 1000000) + ([int]$Matches[2] * 1000) + [int]$Matches[3]
    }
    return -1
}

function Format-DateShort {
    param ([string]$IsoDate)
    if ([string]::IsNullOrWhiteSpace($IsoDate)) { return "-" }
    try {
        return ([datetimeoffset]::Parse($IsoDate)).ToLocalTime().ToString("yyyy-MM-dd")
    } catch {
        return $IsoDate.Substring(0, [Math]::Min(10, $IsoDate.Length))
    }
}

function Format-AppTypeLabel {
    param ([string]$AppType)
    switch ($AppType) {
        "standalone-singlefile-web-app" { return "単一 HTML アプリ" }
        "browser-extension"             { return "ブラウザ拡張機能 (ZIP)" }
        default                         { return $AppType }
    }
}

function Build-HomeMarkdown {
    param (
        [object]$Config,
        [object[]]$AppSummaries
    )
    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine("# $($Config.wiki.homeTitle)")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine($Config.wiki.homeIntro)
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("## アプリ一覧・最新ダウンロード")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("| アプリ名 | 種別 | 最新バージョン | 公開日 | ダウンロード | 詳細・履歴 |")
    [void]$sb.AppendLine("| :--- | :--- | :--- | :--- | :--- | :--- |")

    foreach ($item in $AppSummaries) {
        $typeLabel = Format-AppTypeLabel -AppType $item.app.appType
        if ($null -ne $item.latest) {
            $verCell = "``v$($item.latest.version)``"
            $dateCell = $item.latest.publishedDate
            $dlCell = if ($null -ne $item.latest.assetUrl) {
                "[$($item.latest.assetName)]($($item.latest.assetUrl))"
            } else {
                "[Release ページ]($($item.latest.releaseUrl))"
            }
        } else {
            $verCell = "未リリース"
            $dateCell = "-"
            $dlCell = "-"
        }
        $detailCell = "[$($item.app.displayName)]($($item.app.wikiPage))"
        [void]$sb.AppendLine("| **$($item.app.displayName)** | $typeLabel | $verCell | $dateCell | $dlCell | $detailCell |")
    }

    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("## 各アプリの概要")
    [void]$sb.AppendLine("")
    foreach ($item in $AppSummaries) {
        [void]$sb.AppendLine("- **[$($item.app.displayName)]($($item.app.wikiPage))**: $($item.app.summary)")
    }

    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("---")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("_最終自動同期: $((Get-Date).ToString('yyyy-MM-dd HH:mm'))_")
    return $sb.ToString()
}

function Build-SidebarMarkdown {
    param ([object[]]$AppSummaries)
    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine("### ナビゲーション")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("- [Home（ダウンロード一覧）](Home)")
    foreach ($item in $AppSummaries) {
        [void]$sb.AppendLine("- [$($item.app.displayName)]($($item.app.wikiPage))")
    }
    return $sb.ToString()
}

function Build-AppPageMarkdown {
    param ([object]$AppSummary)
    $app = $AppSummary.app
    $releases = @($AppSummary.releases)
    $latest = $AppSummary.latest
    $typeLabel = Format-AppTypeLabel -AppType $app.appType

    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine("# $($app.displayName)")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine($app.summary)
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("- **配布形態**: $typeLabel")
    [void]$sb.AppendLine("- **タグ規約**: ``$($app.tagPrefix)@v<version>``")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("## 最新バージョン ダウンロード")
    [void]$sb.AppendLine("")

    if ($null -ne $latest) {
        [void]$sb.AppendLine("- **最新バージョン**: ``v$($latest.version)``（公開日: $($latest.publishedDate)）")
        if ($null -ne $latest.assetUrl) {
            [void]$sb.AppendLine("- **配布ファイル**: [$($latest.assetName)]($($latest.assetUrl))")
        }
        [void]$sb.AppendLine("- **GitHub Release**: [$($latest.tag)]($($latest.releaseUrl))")
    } else {
        [void]$sb.AppendLine("現在、公開済みのリリースはありません。")
    }

    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("## インストール・利用手順")
    [void]$sb.AppendLine("")
    $stepNum = 1
    foreach ($step in $app.installSteps) {
        [void]$sb.AppendLine("$stepNum. $step")
        $stepNum++
    }

    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("## リリース履歴")
    [void]$sb.AppendLine("")

    if ($releases.Count -eq 0) {
        [void]$sb.AppendLine("まだリリース履歴はありません。")
        [void]$sb.AppendLine("")
    } else {
        [void]$sb.AppendLine("| バージョン | 公開日 | ダウンロード | Release ページ |")
        [void]$sb.AppendLine("| :--- | :--- | :--- | :--- |")
        foreach ($rel in $releases) {
            $dl = if ($null -ne $rel.assetUrl) { "[$($rel.assetName)]($($rel.assetUrl))" } else { "-" }
            [void]$sb.AppendLine("| ``v$($rel.version)`` | $($rel.publishedDate) | $dl | [$($rel.tag)]($($rel.releaseUrl)) |")
        }

        [void]$sb.AppendLine("")
        [void]$sb.AppendLine("### 各バージョンの変更内容")
        [void]$sb.AppendLine("")
        foreach ($rel in $releases) {
            [void]$sb.AppendLine("#### v$($rel.version) ($($rel.publishedDate))")
            [void]$sb.AppendLine("")
            $bodyText = if ([string]::IsNullOrWhiteSpace($rel.body)) { "_変更内容の記載なし_" } else { $rel.body.Trim() }
            [void]$sb.AppendLine($bodyText)
            [void]$sb.AppendLine("")
        }
    }

    [void]$sb.AppendLine("---")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("[← Home（全アプリ一覧）へ戻る](Home)")
    return $sb.ToString()
}

$resolvedRoot = if ([string]::IsNullOrWhiteSpace($RepoRoot)) { (Get-Location).Path } else { (Resolve-Path $RepoRoot).Path }
$configPath = Join-Path $resolvedRoot ".agents/skills/release-manager/config/release-apps.json"

if (-not (Test-Path $configPath)) {
    Emit-Result ([PSCustomObject]@{ success = $false; errorMessage = "設定ファイルが見つかりません: $configPath" })
}

$config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json

Push-Location $resolvedRoot
$tempWikiDir = $null
try {
    if ($null -eq (Get-Command git -ErrorAction SilentlyContinue)) {
        Emit-Result ([PSCustomObject]@{ success = $false; errorMessage = "Git が見つかりません。" })
    }
    if ($null -eq (Get-Command gh -ErrorAction SilentlyContinue)) {
        Emit-Result ([PSCustomObject]@{ success = $false; errorMessage = "GitHub CLI (gh) が見つかりません。" })
    }
    gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Emit-Result ([PSCustomObject]@{ success = $false; errorMessage = "GitHub CLI が認証されていません。'gh auth login' を実行してください。" })
    }

    $targetRepo = $Repo
    if ([string]::IsNullOrWhiteSpace($targetRepo)) {
        $remoteUrl = git remote get-url origin 2>$null
        if ($LASTEXITCODE -eq 0 -and $remoteUrl.Trim() -match 'github\.com[:/]([^/]+/[^/]+?)(?:\.git)?/?$') {
            $targetRepo = $Matches[1]
        }
    }
    if ([string]::IsNullOrWhiteSpace($targetRepo)) {
        Emit-Result ([PSCustomObject]@{ success = $false; errorMessage = "対象リポジトリを特定できませんでした。" })
    }

    # 全公開リリースを一括取得（GitHub REST API）
    $apiOut = gh api "repos/$targetRepo/releases?per_page=100" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            errorMessage = "GitHub Releases の取得に失敗しました: $($apiOut -join ' ')"
        })
    }

    $rawReleases = @()
    $joinedApi = ($apiOut -join "`n").Trim()
    if (-not [string]::IsNullOrWhiteSpace($joinedApi)) {
        $parsed = $joinedApi | ConvertFrom-Json
        if ($null -ne $parsed) {
            $rawReleases = @($parsed | Where-Object { -not $_.draft })
        }
    }

    # アプリ別にリリースを分類・整列
    $appSummaries = @()
    foreach ($app in $config.apps) {
        $prefix = "$($app.tagPrefix)@v"
        $matched = @(
            $rawReleases |
            Where-Object { $_.tag_name -like "$prefix*" } |
            ForEach-Object {
                $ver = $_.tag_name.Substring($prefix.Length)
                $primaryAsset = if ($_.assets -and $_.assets.Count -gt 0) { $_.assets[0] } else { $null }
                [PSCustomObject]@{
                    tag           = $_.tag_name
                    version       = $ver
                    semVerKey     = (Parse-SemVerKey -VersionText $ver)
                    publishedAt   = $_.published_at
                    publishedDate = (Format-DateShort -IsoDate $_.published_at)
                    releaseUrl    = $_.html_url
                    assetName     = if ($null -ne $primaryAsset) { $primaryAsset.name } else { $null }
                    assetUrl      = if ($null -ne $primaryAsset) { $primaryAsset.browser_download_url } else { $null }
                    body          = [string]$_.body
                }
            } |
            Sort-Object -Property semVerKey, publishedAt -Descending
        )

        $appSummaries += [PSCustomObject]@{
            app      = $app
            releases = $matched
            latest   = if ($matched.Count -gt 0) { $matched[0] } else { $null }
        }
    }

    # 生成する Wiki ページマップ構築
    $generatedPages = [ordered]@{}
    $generatedPages["Home.md"] = Build-HomeMarkdown -Config $config -AppSummaries $appSummaries
    $generatedPages["_Sidebar.md"] = Build-SidebarMarkdown -AppSummaries $appSummaries
    foreach ($summary in $appSummaries) {
        $pageFile = "$($summary.app.wikiPage).md"
        $generatedPages[$pageFile] = Build-AppPageMarkdown -AppSummary $summary
    }

    if (-not [string]::IsNullOrWhiteSpace($PreviewDir)) {
        New-Item -ItemType Directory -Path $PreviewDir -Force | Out-Null
        foreach ($key in $generatedPages.Keys) {
            [System.IO.File]::WriteAllText((Join-Path $PreviewDir $key), $generatedPages[$key], $utf8NoBom)
        }
    }

    $wikiGitUrl = "https://github.com/$targetRepo.wiki.git"
    $wikiWebUrl = "https://github.com/$targetRepo/wiki"

    if ($DryRun) {
        Emit-Result ([PSCustomObject]@{
            success      = $true
            isDryRun     = $true
            wikiUrl      = $wikiWebUrl
            pages        = @($generatedPages.Keys)
            releaseCount = $rawReleases.Count
            previewDir   = $PreviewDir
            errorMessage = $null
        })
    }

    # Wiki リポジトリの初期化確認・クローン
    git ls-remote $wikiGitUrl 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            wikiUrl      = $wikiWebUrl
            errorMessage = "GitHub Wiki リポジトリが未初期化です。ブラウザで $wikiWebUrl を開き、「Create the first page」から初回ページを 1 ページ作成した後、再度 sync-wiki.ps1 を実行してください。"
        })
    }

    $tempWikiDir = Join-Path ([System.IO.Path]::GetTempPath()) ("toybox2-wiki-" + [guid]::NewGuid().ToString("N"))
    $cloneOut = git clone $wikiGitUrl $tempWikiDir 2>&1
    if ($LASTEXITCODE -ne 0) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            wikiUrl      = $wikiWebUrl
            errorMessage = "Wiki リポジトリのクローンに失敗しました: $($cloneOut -join ' ')"
        })
    }

    foreach ($key in $generatedPages.Keys) {
        [System.IO.File]::WriteAllText((Join-Path $tempWikiDir $key), $generatedPages[$key], $utf8NoBom)
    }

    Push-Location $tempWikiDir
    try {
        $wikiStatus = @(git status --porcelain 2>$null)
        if ($wikiStatus.Count -eq 0) {
            Emit-Result ([PSCustomObject]@{
                success      = $true
                changed      = $false
                wikiUrl      = $wikiWebUrl
                pages        = @($generatedPages.Keys)
                releaseCount = $rawReleases.Count
                errorMessage = $null
            })
        }

        git add -A 2>&1 | Out-Null
        $commitMsg = "docs(wiki): sync app release download portal ($((Get-Date).ToString('yyyy-MM-dd HH:mm')))"
        $commitOut = git commit -m $commitMsg 2>&1
        if ($LASTEXITCODE -ne 0) {
            Emit-Result ([PSCustomObject]@{
                success      = $false
                wikiUrl      = $wikiWebUrl
                errorMessage = "Wiki のコミットに失敗しました: $($commitOut -join ' ')"
            })
        }

        $pushOut = git push origin HEAD 2>&1
        if ($LASTEXITCODE -ne 0) {
            Emit-Result ([PSCustomObject]@{
                success      = $false
                wikiUrl      = $wikiWebUrl
                errorMessage = "Wiki への push に失敗しました: $($pushOut -join ' ')"
            })
        }
    } finally {
        Pop-Location
    }

    Emit-Result ([PSCustomObject]@{
        success      = $true
        changed      = $true
        wikiUrl      = $wikiWebUrl
        pages        = @($generatedPages.Keys)
        releaseCount = $rawReleases.Count
        errorMessage = $null
    })
} finally {
    if ($null -ne $tempWikiDir -and (Test-Path $tempWikiDir)) {
        Remove-Item -Path $tempWikiDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    Pop-Location
}
