# package-release.ps1
# Builds and creates a clean standalone distribution package in release/

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

# Read package.json version
$pkgJsonPath = Join-Path $projectRoot "package.json"
$pkg = Get-Content $pkgJsonPath | ConvertFrom-Json
$version = $pkg.version

$releaseName = "Jawalang-v$version-windows-x64"
$releaseDir = Join-Path $projectRoot "release\$releaseName"
$releaseZip = Join-Path $projectRoot "release\$releaseName.zip"

Write-Host "========================================="
Write-Host "       PACKAGING JAWALANG RELEASE        "
Write-Host "========================================="
Write-Host "Release version: v$version"
Write-Host "Target package:  $releaseDir"

# 1. Rebuild launcher
Write-Host "`n[1/4] Rebuilding Windows launcher..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-launcher.ps1")

# 2. Prepare release directory
Write-Host "`n[2/4] Preparing release directory..."
if (Test-Path $releaseDir) {
    Remove-Item -Path $releaseDir -Recurse -Force
}
New-Item -Path $releaseDir -ItemType Directory -Force | Out-Null

# 3. Copy files
Write-Host "`n[3/4] Copying release payload..."
$dirsToCopy = @("bin", "src", "assets", "scripts", "examples")
foreach ($d in $dirsToCopy) {
    $src = Join-Path $projectRoot $d
    $dst = Join-Path $releaseDir $d
    if (Test-Path $src) {
        New-Item -Path $dst -ItemType Directory -Force | Out-Null
        Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
    }
}

$filesToCopy = @("package.json", "Readme.md", "LICENSE")
foreach ($f in $filesToCopy) {
    $src = Join-Path $projectRoot $f
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $releaseDir -Force
    }
}

# 4. Create ZIP archive
Write-Host "`n[4/4] Creating ZIP archive: $releaseZip ..."
if (Test-Path $releaseZip) {
    Remove-Item -Path $releaseZip -Force
}

try {
    Compress-Archive -Path "$releaseDir\*" -DestinationPath $releaseZip -Force
    Write-Host "  ZIP created successfully."
} catch {
    Write-Warning "Compress-Archive not available: $_"
}

Write-Host "`n========================================="
Write-Host "Release package generated:"
Write-Host "  Folder:  $releaseDir"
if (Test-Path $releaseZip) {
    Write-Host "  Archive: $releaseZip"
}
Write-Host "========================================="
