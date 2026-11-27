# inspect-readme-inventory.ps1
# ルート README.md および .agents/README.md の定期更新に向けて、
# リポジトリ内のワークスペース・スクリプト・依存関係・CI・.agents 資産を一括収集し、
# 現行ドキュメントとのズレ（driftHints）を JSON 形式で出力する読み取り専用スクリプト。

param (
    [Parameter(Mandatory = $false)]
    [string]$RepoRoot = (Get-Location).Path,

    [Parameter(Mandatory = $false)]
    [switch]$Pretty
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function ConvertTo-RelativeUnixPath {
    param (
        [string]$BasePath,
        [string]$FullPath
    )
    $normalizedBase = [System.IO.Path]::GetFullPath($BasePath).TrimEnd('\', '/')
    $normalizedFull = [System.IO.Path]::GetFullPath($FullPath)
    if ($normalizedFull.StartsWith($normalizedBase, [System.StringComparison]::OrdinalIgnoreCase)) {
        $rel = $normalizedFull.Substring($normalizedBase.Length).TrimStart('\', '/')
        return $rel.Replace('\', '/')
    }
    return $normalizedFull.Replace('\', '/')
}

function Get-FrontmatterFields {
    param (
        [string]$Content
    )
    $fields = @{}
    if ([string]::IsNullOrEmpty($Content)) {
        return $fields
    }
    $match = [regex]::Match($Content, '\A---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|\z)')
    if (-not $match.Success) {
        return $fields
    }
    $lines = $match.Groups[1].Value -split '\r?\n'
    foreach ($line in $lines) {
        if ($line -match '^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim()
            if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
                if ($val.Length -ge 2) {
                    $val = $val.Substring(1, $val.Length - 2)
                }
            }
            $fields[$key] = $val
        }
    }
    return $fields
}

function Get-MarkdownMeta {
    param (
        [string]$FullPath,
        [string]$RelativePath
    )
    if (-not (Test-Path -LiteralPath $FullPath -PathType Leaf)) {
        return [PSCustomObject]@{
            path      = $RelativePath
            exists    = $false
            lineCount = 0
            headings  = @()
            content   = ""
        }
    }
    $raw = Get-Content -LiteralPath $FullPath -Raw -Encoding UTF8
    if ($null -eq $raw) { $raw = "" }
    $lines = if ($raw.Length -eq 0) { @() } else { @($raw -split '\r?\n') }
    $headings = New-Object System.Collections.Generic.List[string]
    foreach ($line in $lines) {
        if ($line -match '^(#{1,3})\s+(.+?)\s*$') {
            $headings.Add("$($Matches[1]) $($Matches[2].Trim())")
        }
    }
    return [PSCustomObject]@{
        path      = $RelativePath
        exists    = $true
        lineCount = $lines.Count
        headings  = @($headings.ToArray())
        content   = $raw
    }
}

function Get-FirstH1Title {
    param (
        [string]$Content
    )
    if ([string]::IsNullOrEmpty($Content)) { return $null }
    $lines = $Content -split '\r?\n'
    foreach ($line in $lines) {
        if ($line -match '^#\s+(.+?)\s*$') {
            return $Matches[1].Trim()
        }
    }
    return $null
}

function Get-JsonPropertyMap {
    param (
        [object]$Obj
    )
    $list = New-Object System.Collections.Generic.List[object]
    if ($null -eq $Obj) { return @() }
    foreach ($prop in $Obj.PSObject.Properties) {
        $list.Add([PSCustomObject]@{
            name  = $prop.Name
            value = [string]$prop.Value
        })
    }
    return @($list.ToArray())
}

function Get-InternalDependencies {
    param (
        [object]$Pkg
    )
    $deps = New-Object System.Collections.Generic.List[string]
    if ($null -ne $Pkg -and $null -ne $Pkg.dependencies) {
        foreach ($prop in $Pkg.dependencies.PSObject.Properties) {
            if ($prop.Name -like '@shared/*' -or [string]$prop.Value -eq '*') {
                $deps.Add($prop.Name)
            }
        }
    }
    return @($deps.ToArray())
}

function Test-ContentContainsAny {
    param (
        [string]$Content,
        [string[]]$Candidates
    )
    if ([string]::IsNullOrEmpty($Content)) { return $false }
    foreach ($c in $Candidates) {
        if ([string]::IsNullOrWhiteSpace($c)) { continue }
        if ($Content.IndexOf($c, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
            return $true
        }
    }
    return $false
}

$resolvedRoot = [System.IO.Path]::GetFullPath($RepoRoot)
$errorMessage = $null

if (-not (Test-Path -LiteralPath $resolvedRoot -PathType Container)) {
    $errorMessage = "指定されたリポジトリルートが存在しません: $resolvedRoot"
}

$rootPkgPath = Join-Path $resolvedRoot "package.json"
if ($null -eq $errorMessage -and -not (Test-Path -LiteralPath $rootPkgPath -PathType Leaf)) {
    $errorMessage = "ルート package.json が見つかりません: $rootPkgPath"
}

if ($null -ne $errorMessage) {
    $errObj = [PSCustomObject]@{
        generatedAt  = (Get-Date).ToString("o")
        errorMessage = $errorMessage
        repository   = $null
        apps         = @()
        packages     = @()
        agents       = $null
        driftHints   = $null
    }
    if ($Pretty) {
        $errObj | ConvertTo-Json -Depth 10
    } else {
        $errObj | ConvertTo-Json -Depth 10 -Compress
    }
    exit 0
}

# 1. ルート package.json と既存ドキュメントの読み込み
$rootPkg = Get-Content -LiteralPath $rootPkgPath -Raw -Encoding UTF8 | ConvertFrom-Json -ErrorAction Stop
$rootReadmeMeta = Get-MarkdownMeta -FullPath (Join-Path $resolvedRoot "README.md") -RelativePath "README.md"
$agentsReadmeMeta = Get-MarkdownMeta -FullPath (Join-Path $resolvedRoot ".agents\README.md") -RelativePath ".agents/README.md"

$rootScripts = @(Get-JsonPropertyMap -Obj $rootPkg.scripts)
$rootDependencies = @(Get-JsonPropertyMap -Obj $rootPkg.dependencies)
$rootDevDependencies = @(Get-JsonPropertyMap -Obj $rootPkg.devDependencies)
$workspacesConfig = if ($null -ne $rootPkg.workspaces) { @($rootPkg.workspaces) } else { @() }

# 2. CI ワークフロー（.github/workflows）の収集
$ciWorkflows = New-Object System.Collections.Generic.List[object]
$ciDir = Join-Path $resolvedRoot ".github\workflows"
if (Test-Path -LiteralPath $ciDir -PathType Container) {
    $ciFiles = Get-ChildItem -LiteralPath $ciDir -File | Where-Object { $_.Extension -in @(".yml", ".yaml") } | Sort-Object Name
    foreach ($file in $ciFiles) {
        $rawCi = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
        $wfName = $null
        if ($rawCi -match '(?m)^name\s*:\s*(.+?)\s*$') {
            $wfName = $Matches[1].Trim().Trim('"', "'")
        }
        $ciWorkflows.Add([PSCustomObject]@{
            file = $file.Name
            path = ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $file.FullName
            name = $wfName
        })
    }
}

# 3. apps/* の収集
$appsList = New-Object System.Collections.Generic.List[object]
$appsDir = Join-Path $resolvedRoot "apps"
if (Test-Path -LiteralPath $appsDir -PathType Container) {
    $appDirs = Get-ChildItem -LiteralPath $appsDir -Directory | Sort-Object Name
    foreach ($dir in $appDirs) {
        $pkgFile = Join-Path $dir.FullName "package.json"
        if (-not (Test-Path -LiteralPath $pkgFile -PathType Leaf)) { continue }
        $pkg = Get-Content -LiteralPath $pkgFile -Raw -Encoding UTF8 | ConvertFrom-Json -ErrorAction Stop
        $relDir = ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $dir.FullName

        $readmeFile = Join-Path $dir.FullName "README.md"
        $hasReadme = Test-Path -LiteralPath $readmeFile -PathType Leaf
        $readmeRelPath = if ($hasReadme) { ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $readmeFile } else { $null }

        $appType = "web-app"
        $summaryHint = if ($null -ne $pkg.description -and -not [string]::IsNullOrWhiteSpace([string]$pkg.description)) { [string]$pkg.description } else { $null }
        $titleHint = $null

        $manifestFile = Join-Path $dir.FullName "public\manifest.json"
        if (Test-Path -LiteralPath $manifestFile -PathType Leaf) {
            $appType = "browser-extension"
            try {
                $manifest = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json -ErrorAction Stop
                if ($null -ne $manifest.name) { $titleHint = [string]$manifest.name }
                if ([string]::IsNullOrWhiteSpace($summaryHint) -and $null -ne $manifest.description) {
                    $summaryHint = [string]$manifest.description
                }
            } catch {}
        } else {
            $viteConfig = Join-Path $dir.FullName "vite.config.ts"
            if (Test-Path -LiteralPath $viteConfig -PathType Leaf) {
                $viteRaw = Get-Content -LiteralPath $viteConfig -Raw -Encoding UTF8
                if ($viteRaw -match 'viteSingleFile') {
                    $appType = "standalone-singlefile-web-app"
                }
            }
            $indexHtml = Join-Path $dir.FullName "index.html"
            if (Test-Path -LiteralPath $indexHtml -PathType Leaf) {
                $htmlRaw = Get-Content -LiteralPath $indexHtml -Raw -Encoding UTF8
                if ($htmlRaw -match '<title>(.*?)</title>') {
                    $titleHint = $Matches[1].Trim()
                }
            }
        }

        $distZips = New-Object System.Collections.Generic.List[string]
        $distZipDir = Join-Path $dir.FullName "dist-zip"
        if (Test-Path -LiteralPath $distZipDir -PathType Container) {
            foreach ($zf in (Get-ChildItem -LiteralPath $distZipDir -Filter "*.zip" -File | Sort-Object Name)) {
                $distZips.Add((ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $zf.FullName))
            }
        }

        $scriptNames = @()
        if ($null -ne $pkg.scripts) {
            $scriptNames = @($pkg.scripts.PSObject.Properties | ForEach-Object { $_.Name })
        }

        $appsList.Add([PSCustomObject]@{
            dir                  = $relDir
            name                 = [string]$pkg.name
            version              = [string]$pkg.version
            appType              = $appType
            titleHint            = $titleHint
            summaryHint          = $summaryHint
            scripts              = $scriptNames
            internalDependencies = @(Get-InternalDependencies -Pkg $pkg)
            distZips             = @($distZips.ToArray())
            hasReadme            = $hasReadme
            readmePath           = $readmeRelPath
        })
    }
}

# 4. packages/* の収集
$packagesList = New-Object System.Collections.Generic.List[object]
$packagesDir = Join-Path $resolvedRoot "packages"
if (Test-Path -LiteralPath $packagesDir -PathType Container) {
    $pkgDirs = Get-ChildItem -LiteralPath $packagesDir -Directory | Sort-Object Name
    foreach ($dir in $pkgDirs) {
        $pkgFile = Join-Path $dir.FullName "package.json"
        if (-not (Test-Path -LiteralPath $pkgFile -PathType Leaf)) { continue }
        $pkg = Get-Content -LiteralPath $pkgFile -Raw -Encoding UTF8 | ConvertFrom-Json -ErrorAction Stop
        $relDir = ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $dir.FullName

        $readmeFile = Join-Path $dir.FullName "README.md"
        $hasReadme = Test-Path -LiteralPath $readmeFile -PathType Leaf
        $readmeRelPath = if ($hasReadme) { ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $readmeFile } else { $null }

        $srcEntries = New-Object System.Collections.Generic.List[string]
        $srcDir = Join-Path $dir.FullName "src"
        if (Test-Path -LiteralPath $srcDir -PathType Container) {
            $subDirs = Get-ChildItem -LiteralPath $srcDir -Directory | Sort-Object Name
            foreach ($sd in $subDirs) {
                $srcEntries.Add($sd.Name)
            }
            if ($srcEntries.Count -eq 0) {
                $tsFiles = Get-ChildItem -LiteralPath $srcDir -File -Filter "*.ts" |
                    Where-Object { $_.Name -notlike '*.test.ts' -and $_.Name -ne 'vite-env.d.ts' -and $_.Name -ne 'index.ts' } |
                    Sort-Object Name
                foreach ($tf in $tsFiles) {
                    $srcEntries.Add($tf.BaseName)
                }
            }
        }

        $scriptNames = @()
        if ($null -ne $pkg.scripts) {
            $scriptNames = @($pkg.scripts.PSObject.Properties | ForEach-Object { $_.Name })
        }

        $packagesList.Add([PSCustomObject]@{
            dir                  = $relDir
            name                 = [string]$pkg.name
            version              = [string]$pkg.version
            description          = if ($null -ne $pkg.description) { [string]$pkg.description } else { $null }
            scripts              = $scriptNames
            internalDependencies = @(Get-InternalDependencies -Pkg $pkg)
            srcEntries           = @($srcEntries.ToArray())
            hasReadme            = $hasReadme
            readmePath           = $readmeRelPath
        })
    }
}

# 5. .agents 資産（rules / workflows / skills）の収集
$rulesList = New-Object System.Collections.Generic.List[object]
$rulesDir = Join-Path $resolvedRoot ".agents\rules"
if (Test-Path -LiteralPath $rulesDir -PathType Container) {
    foreach ($rf in (Get-ChildItem -LiteralPath $rulesDir -File -Filter "*.md" | Sort-Object Name)) {
        $rawRule = Get-Content -LiteralPath $rf.FullName -Raw -Encoding UTF8
        $rulesList.Add([PSCustomObject]@{
            name  = $rf.Name
            path  = ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $rf.FullName
            title = Get-FirstH1Title -Content $rawRule
        })
    }
}

$workflowsList = New-Object System.Collections.Generic.List[object]
$workflowsDir = Join-Path $resolvedRoot ".agents\workflows"
if (Test-Path -LiteralPath $workflowsDir -PathType Container) {
    foreach ($wf in (Get-ChildItem -LiteralPath $workflowsDir -File -Filter "*.md" | Sort-Object Name)) {
        $rawWf = Get-Content -LiteralPath $wf.FullName -Raw -Encoding UTF8
        $fm = Get-FrontmatterFields -Content $rawWf
        $workflowsList.Add([PSCustomObject]@{
            name        = $wf.BaseName
            command     = "/$($wf.BaseName)"
            path        = ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $wf.FullName
            description = if ($fm.ContainsKey("description")) { $fm["description"] } else { $null }
        })
    }
}

$skillsList = New-Object System.Collections.Generic.List[object]
$skillsDir = Join-Path $resolvedRoot ".agents\skills"
if (Test-Path -LiteralPath $skillsDir -PathType Container) {
    foreach ($sd in (Get-ChildItem -LiteralPath $skillsDir -Directory | Sort-Object Name)) {
        $skillMd = Join-Path $sd.FullName "SKILL.md"
        if (-not (Test-Path -LiteralPath $skillMd -PathType Leaf)) { continue }
        $rawSkill = Get-Content -LiteralPath $skillMd -Raw -Encoding UTF8
        $fm = Get-FrontmatterFields -Content $rawSkill
        $skillName = if ($fm.ContainsKey("name") -and -not [string]::IsNullOrWhiteSpace($fm["name"])) { $fm["name"] } else { $sd.Name }

        $scriptFiles = New-Object System.Collections.Generic.List[string]
        $skillScriptsDir = Join-Path $sd.FullName "scripts"
        if (Test-Path -LiteralPath $skillScriptsDir -PathType Container) {
            foreach ($sf in (Get-ChildItem -LiteralPath $skillScriptsDir -File | Sort-Object Name)) {
                $scriptFiles.Add((ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $sf.FullName))
            }
        }

        $skillsList.Add([PSCustomObject]@{
            name        = $skillName
            dir         = ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $sd.FullName
            path        = ConvertTo-RelativeUnixPath -BasePath $resolvedRoot -FullPath $skillMd
            description = if ($fm.ContainsKey("description")) { $fm["description"] } else { $null }
            scripts     = @($scriptFiles.ToArray())
        })
    }
}

# 6. 現行ドキュメントとのズレ（driftHints）を算出
$missingApps = New-Object System.Collections.Generic.List[string]
$unlinkedWorkspaceReadmes = New-Object System.Collections.Generic.List[string]
foreach ($app in $appsList) {
    if (-not (Test-ContentContainsAny -Content $rootReadmeMeta.content -Candidates @($app.dir, $app.name))) {
        $missingApps.Add($app.dir)
    }
    if ($app.hasReadme -and -not (Test-ContentContainsAny -Content $rootReadmeMeta.content -Candidates @($app.readmePath))) {
        $unlinkedWorkspaceReadmes.Add($app.readmePath)
    }
}

$missingPackages = New-Object System.Collections.Generic.List[string]
foreach ($pkg in $packagesList) {
    if (-not (Test-ContentContainsAny -Content $rootReadmeMeta.content -Candidates @($pkg.dir, $pkg.name))) {
        $missingPackages.Add($pkg.dir)
    }
    if ($pkg.hasReadme -and -not (Test-ContentContainsAny -Content $rootReadmeMeta.content -Candidates @($pkg.readmePath))) {
        $unlinkedWorkspaceReadmes.Add($pkg.readmePath)
    }
}

$missingScripts = New-Object System.Collections.Generic.List[string]
foreach ($sc in $rootScripts) {
    if (-not (Test-ContentContainsAny -Content $rootReadmeMeta.content -Candidates @($sc.name))) {
        $missingScripts.Add($sc.name)
    }
}

$missingAgentsReadmeLink = -not (Test-ContentContainsAny -Content $rootReadmeMeta.content -Candidates @(".agents/README.md"))

$missingRules = New-Object System.Collections.Generic.List[string]
foreach ($r in $rulesList) {
    if (-not (Test-ContentContainsAny -Content $agentsReadmeMeta.content -Candidates @($r.name))) {
        $missingRules.Add($r.name)
    }
}

$missingWorkflows = New-Object System.Collections.Generic.List[string]
foreach ($w in $workflowsList) {
    if (-not (Test-ContentContainsAny -Content $agentsReadmeMeta.content -Candidates @($w.name, $w.command))) {
        $missingWorkflows.Add($w.name)
    }
}

$missingSkills = New-Object System.Collections.Generic.List[string]
foreach ($s in $skillsList) {
    if (-not (Test-ContentContainsAny -Content $agentsReadmeMeta.content -Candidates @($s.name))) {
        $missingSkills.Add($s.name)
    }
}

$result = [PSCustomObject]@{
    generatedAt  = (Get-Date).ToString("o")
    errorMessage = $null
    repository   = [PSCustomObject]@{
        name            = [string]$rootPkg.name
        workspaces      = $workspacesConfig
        rootReadme      = [PSCustomObject]@{
            path      = $rootReadmeMeta.path
            exists    = $rootReadmeMeta.exists
            lineCount = $rootReadmeMeta.lineCount
            headings  = $rootReadmeMeta.headings
        }
        agentsReadme    = [PSCustomObject]@{
            path      = $agentsReadmeMeta.path
            exists    = $agentsReadmeMeta.exists
            lineCount = $agentsReadmeMeta.lineCount
            headings  = $agentsReadmeMeta.headings
        }
        scripts         = $rootScripts
        dependencies    = $rootDependencies
        devDependencies = $rootDevDependencies
        ciWorkflows     = @($ciWorkflows.ToArray())
    }
    apps         = @($appsList.ToArray())
    packages     = @($packagesList.ToArray())
    agents       = [PSCustomObject]@{
        rules     = @($rulesList.ToArray())
        workflows = @($workflowsList.ToArray())
        skills    = @($skillsList.ToArray())
    }
    driftHints   = [PSCustomObject]@{
        rootReadme   = [PSCustomObject]@{
            missingApps              = @($missingApps.ToArray())
            missingPackages          = @($missingPackages.ToArray())
            missingScripts           = @($missingScripts.ToArray())
            unlinkedWorkspaceReadmes = @($unlinkedWorkspaceReadmes.ToArray())
            missingAgentsReadmeLink  = $missingAgentsReadmeLink
        }
        agentsReadme = [PSCustomObject]@{
            exists           = $agentsReadmeMeta.exists
            missingRules     = @($missingRules.ToArray())
            missingWorkflows = @($missingWorkflows.ToArray())
            missingSkills    = @($missingSkills.ToArray())
        }
    }
}

if ($Pretty) {
    $result | ConvertTo-Json -Depth 10
} else {
    $result | ConvertTo-Json -Depth 10 -Compress
}
