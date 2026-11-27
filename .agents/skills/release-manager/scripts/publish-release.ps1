# publish-release.ps1
# main ブランチ上で対象アプリをビルドし、独立リリースタグ (<scope>@v<version>) と GitHub Release（配布成果物付き）を作成するスクリプト

param (
    [Parameter(Mandatory = $true)]
    [string]$AppId,

    [Parameter(Mandatory = $false)]
    [string]$Version,

    [Parameter(Mandatory = $false)]
    [string]$NotesFile,

    [Parameter(Mandatory = $false)]
    [string]$Repo,

    [Parameter(Mandatory = $false)]
    [switch]$AllowNonMain,

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

function Extract-ChangelogSection {
    param (
        [string]$ChangelogPath,
        [string]$TargetVersion
    )
    if (-not (Test-Path $ChangelogPath)) {
        return $null
    }
    $text = [System.IO.File]::ReadAllText($ChangelogPath, [System.Text.Encoding]::UTF8)
    $escaped = [regex]::Escape($TargetVersion)
    $pattern = "(?ms)^## \[v$escaped\][^\r\n]*\r?\n(.*?)(?=^## \[|\z)"
    $m = [regex]::Match($text, $pattern)
    if ($m.Success) {
        return $m.Groups[1].Value.Trim()
    }
    return $null
}

$resolvedRoot = if ([string]::IsNullOrWhiteSpace($RepoRoot)) { (Get-Location).Path } else { (Resolve-Path $RepoRoot).Path }
$configPath = Join-Path $resolvedRoot ".agents/skills/release-manager/config/release-apps.json"

if (-not (Test-Path $configPath)) {
    Emit-Result ([PSCustomObject]@{
        success      = $false
        errorMessage = "設定ファイルが見つかりません: $configPath"
    })
}

$config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$app = $config.apps | Where-Object { $_.id -eq $AppId } | Select-Object -First 1

if ($null -eq $app) {
    $validIds = ($config.apps | ForEach-Object { $_.id }) -join ", "
    Emit-Result ([PSCustomObject]@{
        success      = $false
        errorMessage = "指定された AppId '$AppId' は設定カタログに存在しません。利用可能: $validIds"
    })
}

Push-Location $resolvedRoot
$tempDir = $null
try {
    # 1. 前提コマンド・認証確認
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

    # 2. リポジトリ解決
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

    # 3. ブランチ・作業ツリー・同期ガード
    $currentBranch = (git branch --show-current 2>$null).Trim()
    if (-not $AllowNonMain -and $currentBranch -ne "main") {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            branch       = $currentBranch
            errorMessage = "リリース公開は main ブランチ上で実行してください（現在: '$currentBranch'）。"
        })
    }

    $dirty = @(git status --porcelain 2>$null)
    if (-not $DryRun -and $dirty.Count -gt 0) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            errorMessage = "作業ツリーに未コミットの変更があります。コミットまたは退避してから再実行してください。"
        })
    }

    if (-not $DryRun -and $currentBranch -eq "main") {
        git fetch origin main 2>&1 | Out-Null
        $localHead = (git rev-parse HEAD 2>$null).Trim()
        $remoteHead = (git rev-parse origin/main 2>$null).Trim()
        if ($localHead -ne $remoteHead) {
            Emit-Result ([PSCustomObject]@{
                success      = $false
                appId        = $AppId
                errorMessage = "ローカルの main ブランチが origin/main と一致していません。'git pull --ff-only origin main' で同期してください。"
            })
        }
    }

    # 4. バージョン整合性検証
    $pkgPath = Join-Path $resolvedRoot $app.versionFiles[0].path
    $pkgVersion = [string](Get-Content $pkgPath -Raw -Encoding UTF8 | ConvertFrom-Json).version
    $resolvedVersion = if ([string]::IsNullOrWhiteSpace($Version)) { $pkgVersion } else { $Version.Trim() }

    if ($resolvedVersion -notmatch '^\d+\.\d+\.\d+$') {
        Emit-Result ([PSCustomObject]@{ success = $false; errorMessage = "不正なバージョン形式です: $resolvedVersion" })
    }

    foreach ($vf in $app.versionFiles) {
        $vfPath = Join-Path $resolvedRoot $vf.path
        $vfVer = [string](Get-Content $vfPath -Raw -Encoding UTF8 | ConvertFrom-Json).version
        if ($vfVer -ne $resolvedVersion) {
            Emit-Result ([PSCustomObject]@{
                success      = $false
                appId        = $AppId
                version      = $resolvedVersion
                errorMessage = "$($vf.path) のバージョン ('$vfVer') が指定バージョン ('$resolvedVersion') と一致しません。"
            })
        }
    }

    # 5. タグ重複検証（ローカル＆リモート）
    $tagName = "$($app.tagPrefix)@v$resolvedVersion"
    $localTag = git tag -l $tagName 2>$null
    if (-not [string]::IsNullOrWhiteSpace($localTag)) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            tag          = $tagName
            errorMessage = "ローカルにタグ '$tagName' が既に存在します。"
        })
    }
    $remoteTag = git ls-remote --tags origin "refs/tags/$tagName" 2>$null
    if (-not [string]::IsNullOrWhiteSpace($remoteTag)) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            tag          = $tagName
            errorMessage = "リモートにタグ '$tagName' が既に存在します。"
        })
    }

    # 6. リリースノート解決
    $resolvedNotesText = $null
    if (-not [string]::IsNullOrWhiteSpace($NotesFile)) {
        if (-not (Test-Path $NotesFile)) {
            Emit-Result ([PSCustomObject]@{ success = $false; errorMessage = "指定された NotesFile が見つかりません: $NotesFile" })
        }
        $resolvedNotesText = (Get-Content $NotesFile -Raw -Encoding UTF8).Trim()
    } else {
        $changelogFullPath = Join-Path $resolvedRoot $app.changelogPath
        $resolvedNotesText = Extract-ChangelogSection -ChangelogPath $changelogFullPath -TargetVersion $resolvedVersion
        if ([string]::IsNullOrWhiteSpace($resolvedNotesText)) {
            $resolvedNotesText = "$($app.displayName) v$resolvedVersion をリリースしました。"
        }
    }

    $assetName = $app.artifactNameTemplate -replace '\{\{version\}\}', $resolvedVersion
    $releaseTitle = "$($app.displayName) v$resolvedVersion"
    $expectedAssetUrl = "https://github.com/$targetRepo/releases/download/$tagName/$assetName"

    if ($DryRun) {
        Emit-Result ([PSCustomObject]@{
            success          = $true
            isDryRun         = $true
            appId            = $AppId
            displayName      = $app.displayName
            version          = $resolvedVersion
            tag              = $tagName
            releaseTitle     = $releaseTitle
            assetName        = $assetName
            expectedAssetUrl = $expectedAssetUrl
            notesPreview     = $resolvedNotesText
            buildCommand     = $app.buildCommand
            errorMessage     = $null
        })
    }

    # 7. クリーンビルドとアセットのステージング
    $buildOut = pwsh -NoProfile -Command $app.buildCommand 2>&1
    if ($LASTEXITCODE -ne 0) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            tag          = $tagName
            errorMessage = "ビルドに失敗しました: $(($buildOut | Select-Object -Last 10) -join ' ')"
        })
    }

    $artifactFullSource = Join-Path $resolvedRoot $app.artifactSource
    if (-not (Test-Path $artifactFullSource)) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            tag          = $tagName
            errorMessage = "ビルド成果物が見つかりません: $($app.artifactSource)"
        })
    }

    $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("toybox2-release-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    $stagedAssetPath = Join-Path $tempDir $assetName
    Copy-Item -Path $artifactFullSource -Destination $stagedAssetPath -Force

    $stagedNotesPath = Join-Path $tempDir "release-notes.md"
    [System.IO.File]::WriteAllText($stagedNotesPath, $resolvedNotesText, $utf8NoBom)

    # 8. 注釈付きタグ作成 & push
    $tagOut = git tag -a $tagName -m $releaseTitle 2>&1
    if ($LASTEXITCODE -ne 0) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            tag          = $tagName
            errorMessage = "タグ作成に失敗しました: $($tagOut -join ' ')"
        })
    }

    $pushOut = git push origin $tagName 2>&1
    if ($LASTEXITCODE -ne 0) {
        git tag -d $tagName 2>&1 | Out-Null
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            tag          = $tagName
            errorMessage = "タグの push に失敗しました（ローカルタグは巻き戻しました）: $($pushOut -join ' ')"
        })
    }

    # 9. GitHub Release 作成 & アセット添付
    $ghArgs = @(
        "release", "create", $tagName, $stagedAssetPath,
        "--repo", $targetRepo,
        "--title", $releaseTitle,
        "--notes-file", $stagedNotesPath
    )
    $relOut = gh @ghArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            tag          = $tagName
            errorMessage = "GitHub Release 作成に失敗しました: $($relOut -join ' ')"
        })
    }

    $releaseUrl = ($relOut | Select-Object -Last 1).Trim()

    Emit-Result ([PSCustomObject]@{
        success          = $true
        isDryRun         = $false
        appId            = $AppId
        displayName      = $app.displayName
        version          = $resolvedVersion
        tag              = $tagName
        releaseTitle     = $releaseTitle
        releaseUrl       = $releaseUrl
        assetName        = $assetName
        assetDownloadUrl = $expectedAssetUrl
        errorMessage     = $null
    })
} finally {
    if ($null -ne $tempDir -and (Test-Path $tempDir)) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    Pop-Location
}
