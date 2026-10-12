# packages/icons フォルダを基準としたパス
$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
}
$baseDir = Split-Path -Parent $scriptDir
$iconDir = Join-Path $baseDir "src\assets\icons"
$outputFile = Join-Path $baseDir "src\icons.ts"

if (-not (Test-Path $iconDir)) {
    Write-Error "Directory not found: $iconDir"
    return
}

$files = Get-ChildItem $iconDir -Filter *.svg
$imports = @()
$mapping = @()

foreach ($file in $files) {
    $name = $file.BaseName
    $varName = $name -replace '-', '_'
    $imports += "import $varName from `"./assets/icons/$($file.Name)?raw`";"
    $mapping += "  `"$name`": $varName,"
}

$aliases = @{
    "circle-plus" = "circle_plus_solid_full"
    "compress"    = "compress_solid_full"
    "expand"      = "expand_solid_full"
}

foreach ($alias in $aliases.Keys | Sort-Object) {
    $targetVar = $aliases[$alias]
    $mapping += "  `"$alias`": $targetVar,"
}

# ソートして一貫性を保持
$mapping = $mapping | Sort-Object

$finalContent = @(
    $imports
    ""
    "export const icons: Record<string, string> = {"
    $mapping
    "};"
)

$finalContent | Out-File -FilePath $outputFile -Encoding utf8
Write-Host "Successfully generated $outputFile" -ForegroundColor Green
