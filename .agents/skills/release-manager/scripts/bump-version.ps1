# bump-version.ps1
# 指定アプリのバージョン定義ファイル・package-lock.json・CHANGELOG.md・README.md を同期更新し、品質検証を実行するスクリプト

param (
    [Parameter(Mandatory = $true)]
    [string]$AppId,

    [Parameter(Mandatory = $true)]
    [string]$Version,

    [Parameter(Mandatory = $false)]
    [string]$NotesFile,

    [Parameter(Mandatory = $false)]
    [string]$ReleaseDate,

    [Parameter(Mandatory = $false)]
    [switch]$SkipVerify,

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

$resolvedRoot = if ([string]::IsNullOrWhiteSpace($RepoRoot)) { (Get-Location).Path } else { (Resolve-Path $RepoRoot).Path }
$configPath = Join-Path $resolvedRoot ".agents/skills/release-manager/config/release-apps.json"

if (-not (Test-Path $configPath)) {
    Emit-Result ([PSCustomObject]@{
        success      = $false
        errorMessage = "設定ファイルが見つかりません: $configPath"
    })
}

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Emit-Result ([PSCustomObject]@{
        success      = $false
        errorMessage = "バージョンは SemVer（MAJOR.MINOR.PATCH 形式、例: 1.0.0）で指定してください: $Version"
    })
}

$resolvedDate = if ([string]::IsNullOrWhiteSpace($ReleaseDate)) { (Get-Date).ToString("yyyy-MM-dd") } else { $ReleaseDate.Trim() }
$config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$app = $config.apps | Where-Object { $_.id -eq $AppId } | Select-Object -First 1

if ($null -eq $app) {
    $validIds = ($config.apps | ForEach-Object { $_.id }) -join ", "
    Emit-Result ([PSCustomObject]@{
        success      = $false
        errorMessage = "指定された AppId '$AppId' は設定カタログに存在しません。利用可能: $validIds"
    })
}

$notesContent = $null
if (-not [string]::IsNullOrWhiteSpace($NotesFile)) {
    if (-not (Test-Path $NotesFile)) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            errorMessage = "指定されたリリースノートファイルが見つかりません: $NotesFile"
        })
    }
    $notesContent = (Get-Content $NotesFile -Raw -Encoding UTF8).Trim()
}

Push-Location $resolvedRoot
try {
    # 既存タグ重複チェック
    $expectedTag = "$($app.tagPrefix)@v$Version"
    $existingTag = git tag -l $expectedTag 2>$null
    if (-not [string]::IsNullOrWhiteSpace($existingTag)) {
        Emit-Result ([PSCustomObject]@{
            success      = $false
            appId        = $AppId
            version      = $Version
            tag          = $expectedTag
            errorMessage = "タグ '$expectedTag' は既に存在します。別のバージョンを指定してください。"
        })
    }

    $updatedFiles = @()

    # 1. versionFiles の更新（最小差分の正規表現置換でフォーマット保持）
    foreach ($vf in $app.versionFiles) {
        $fullPath = Join-Path $resolvedRoot $vf.path
        if (-not (Test-Path $fullPath)) {
            Emit-Result ([PSCustomObject]@{
                success      = $false
                appId        = $AppId
                version      = $Version
                errorMessage = "バージョン定義ファイルが見つかりません: $($vf.path)"
            })
        }

        $rawText = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
        $regex = [regex]'(?m)^(\s*"version"\s*:\s*")([^"]+)(")'
        if (-not $regex.IsMatch($rawText)) {
            Emit-Result ([PSCustomObject]@{
                success      = $false
                appId        = $AppId
                version      = $Version
                errorMessage = "バージョンフィールドが見つかりません: $($vf.path)"
            })
        }

        $newText = $regex.Replace($rawText, "`${1}$Version`${3}", 1)
        if (-not $DryRun -and ($newText -ne $rawText)) {
            [System.IO.File]::WriteAllText($fullPath, $newText, $utf8NoBom)
        }
        $updatedFiles += $vf.path
    }

    # 2. ルート package-lock.json 内の該当ワークスペースバージョン同期（オフライン・最小差分）
    $lockPath = Join-Path $resolvedRoot "package-lock.json"
    if (Test-Path $lockPath) {
        $wsKey = $app.workspaceDir.Replace('\', '/')
        $nodeScript = @"
const fs = require('fs');
const lockPath = process.argv[1];
const wsKey = process.argv[2];
const nextVer = process.argv[3];
const isDryRun = process.argv[4] === '1';
const raw = fs.readFileSync(lockPath, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const data = JSON.parse(raw);
let changed = false;
if (data.packages && data.packages[wsKey] && data.packages[wsKey].version !== nextVer) {
  data.packages[wsKey].version = nextVer;
  changed = true;
}
if (changed && !isDryRun) {
  const out = JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol;
  fs.writeFileSync(lockPath, out, 'utf8');
}
process.stdout.write(changed ? 'UPDATED' : 'UNCHANGED');
"@
        $lockSyncOut = node -e $nodeScript $lockPath $wsKey $Version $(if ($DryRun) { "1" } else { "0" }) 2>&1
        if ($LASTEXITCODE -ne 0) {
            Emit-Result ([PSCustomObject]@{
                success      = $false
                appId        = $AppId
                version      = $Version
                errorMessage = "package-lock.json の同期に失敗しました: $($lockSyncOut -join ' ')"
            })
        }
        if (($lockSyncOut -join '').Trim() -eq 'UPDATED') {
            $updatedFiles += "package-lock.json"
        }
    }

    # 3. CHANGELOG.md の更新
    $changelogFullPath = Join-Path $resolvedRoot $app.changelogPath
    $entryBody = if (-not [string]::IsNullOrWhiteSpace($notesContent)) {
        $notesContent
    } else {
        "- リリース v$Version"
    }
    $entryBlock = "## [v$Version] - $resolvedDate`n`n$entryBody"

    if (Test-Path $changelogFullPath) {
        $existingChangelog = [System.IO.File]::ReadAllText($changelogFullPath, [System.Text.Encoding]::UTF8)
        $headingPattern = "(?m)^## \[v$([regex]::Escape($Version))\]"
        if ($existingChangelog -match $headingPattern) {
            Emit-Result ([PSCustomObject]@{
                success      = $false
                appId        = $AppId
                version      = $Version
                errorMessage = "$($app.changelogPath) に既に v$Version のエントリが存在します。"
            })
        }

        $firstSectionMatch = [regex]::Match($existingChangelog, '(?m)^## \[')
        if ($firstSectionMatch.Success) {
            $newChangelog = $existingChangelog.Insert($firstSectionMatch.Index, "$entryBlock`n`n")
        } else {
            $newChangelog = $existingChangelog.TrimEnd() + "`n`n$entryBlock`n"
        }
    } else {
        $newChangelog = "# Changelog ($($app.displayName))`n`n本ファイルは $($app.displayName) のリリース履歴を記録します。`n`n$entryBlock`n"
    }

    if (-not $DryRun) {
        [System.IO.File]::WriteAllText($changelogFullPath, $newChangelog, $utf8NoBom)
    }
    $updatedFiles += $app.changelogPath

    # 3.5. ルート README.md 内の該当アプリバージョン表記を同期更新（差異がある場合のみ）
    $readmePath = Join-Path $resolvedRoot "README.md"
    if (Test-Path $readmePath) {
        $wsDir = $app.workspaceDir.Replace('\', '/')
        $escapedWsDir = [regex]::Escape($wsDir)
        $bt = [char]96
        $readmePattern = '(?m)^(\|[^\r\n]*' + $bt + $escapedWsDir + $bt + '\s*\|\s*' + $bt + ')(\d+\.\d+\.\d+)(' + $bt + '\s*\|)'
        $readmeRegex = [regex]$readmePattern
        $readmeRaw = [System.IO.File]::ReadAllText($readmePath, [System.Text.Encoding]::UTF8)

        if ($readmeRegex.IsMatch($readmeRaw)) {
            $readmeMatch = $readmeRegex.Match($readmeRaw)
            $currentReadmeVersion = $readmeMatch.Groups[2].Value
            if ($currentReadmeVersion -ne $Version) {
                $newReadme = $readmeRegex.Replace($readmeRaw, "`${1}$Version`${3}", 1)
                if (-not $DryRun) {
                    [System.IO.File]::WriteAllText($readmePath, $newReadme, $utf8NoBom)
                    $prettierPkg = Join-Path $resolvedRoot "node_modules/prettier/package.json"
                    if (Test-Path $prettierPkg) {
                        $prettierOut = npx --no-install prettier --write $readmePath 2>&1
                        if ($LASTEXITCODE -ne 0) {
                            Emit-Result ([PSCustomObject]@{
                                success      = $false
                                appId        = $AppId
                                version      = $Version
                                errorMessage = "README.md の Prettier 整形に失敗しました: $($prettierOut -join ' ')"
                            })
                        }
                    }
                }
                $updatedFiles += "README.md"
            }
        }
    }

    # 4. 品質検証（テスト・型チェック・ビルド）
    $verification = [PSCustomObject]@{
        skipped = [bool]($SkipVerify -or $DryRun)
        steps   = @()
    }

    if (-not $SkipVerify -and -not $DryRun) {
        $commands = @(
            @{ name = "test"; cmd = $app.testCommand },
            @{ name = "type-check"; cmd = "npm run type-check" },
            @{ name = "build"; cmd = $app.buildCommand }
        )

        foreach ($step in $commands) {
            if ([string]::IsNullOrWhiteSpace($step.cmd)) { continue }
            $out = pwsh -NoProfile -Command $step.cmd 2>&1
            $code = $LASTEXITCODE
            $verification.steps += [PSCustomObject]@{
                name     = $step.name
                command  = $step.cmd
                passed   = ($code -eq 0)
                exitCode = $code
                tail     = (($out | Select-Object -Last 10) -join "`n").Trim()
            }
            if ($code -ne 0) {
                Emit-Result ([PSCustomObject]@{
                    success      = $false
                    appId        = $AppId
                    version      = $Version
                    tag          = $expectedTag
                    updatedFiles = $updatedFiles
                    verification = $verification
                    errorMessage = "品質検証ステップ '$($step.name)' が失敗しました（終了コード: $code）。"
                })
            }
        }
    }

    Emit-Result ([PSCustomObject]@{
        success      = $true
        isDryRun     = [bool]$DryRun
        appId        = $AppId
        displayName  = $app.displayName
        version      = $Version
        tag          = $expectedTag
        releaseDate  = $resolvedDate
        updatedFiles = $updatedFiles
        verification = $verification
        errorMessage = $null
    })
} finally {
    Pop-Location
}
