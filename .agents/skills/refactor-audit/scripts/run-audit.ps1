[CmdletBinding()]
param(
    [string]$OutputDir = ".agents"
)

$ErrorActionPreference = "Continue"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "=== [1/3] Running ESLint ===" -ForegroundColor Cyan
$eslintOut = Join-Path $OutputDir "eslint-report.json"
# eslint returns exit code 1 if errors or warnings are found; do not abort execution
npx eslint apps packages -f json -o $eslintOut
Write-Host "ESLint report generated: $eslintOut" -ForegroundColor Green

Write-Host "=== [2/3] Running jscpd ===" -ForegroundColor Cyan
$jscpdOut = Join-Path $OutputDir "jscpd-report.json"
npx jscpd apps packages --pattern "**/*.{ts,tsx}" --ignore "**/*.test.ts,**/*.spec.ts,**/node_modules/**,**/dist/**" --min-tokens 20 --reporters json --output $OutputDir
Write-Host "jscpd report generated: $jscpdOut" -ForegroundColor Green

Write-Host "=== [3/3] Running madge ===" -ForegroundColor Cyan
$circularOut = Join-Path $OutputDir "circular-report.json"
$madgeJson = npx madge --ts-config tsconfig.base.json --circular --json apps/ packages/
[System.IO.File]::WriteAllText($circularOut, ($madgeJson -join "`n"), [System.Text.UTF8Encoding]::new($false))
Write-Host "Madge circular report generated: $circularOut" -ForegroundColor Green

Write-Host "`nAll static analysis audits completed successfully!" -ForegroundColor Green
