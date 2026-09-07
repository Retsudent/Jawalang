const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 1. scripts/install.ps1
const installPs1Content = `# install.ps1
# Jawalang Windows Installer V1.1 — Distribution Hardening
# Supports:
#   - Default distribution install into %LOCALAPPDATA%\\Jawalang
#   - In-place / Portable mode via -Portable or -InPlace
#   - Custom target directory via -TargetDir <path>
#   - Automatic Node.js prerequisite verification
#   - Safe, idempotent, case-insensitive User PATH configuration
#   - Quoted Windows Registry file association and context menu

param(
    [string]$TargetDir = "",
    [switch]$Portable,
    [switch]$InPlace
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "========================================="
Write-Host "      JAWALANG WINDOWS INSTALLATION      "
Write-Host "========================================="

# 1. Prerequisite check: Node.js
Write-Host "\`n[1/5] Checking prerequisites..."
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$nodePath = ""
$nodeVer = ""

if ($nodeCmd) {
    $nodePath = $nodeCmd.Source
    try {
        $nodeVer = (& node -v).Trim()
    } catch {
        $nodeVer = "unknown"
    }
} else {
    # Check standard installation locations
    $candidates = @(
        (Join-Path $env:ProgramFiles "nodejs\\node.exe"),
        (Join-Path \${env:ProgramFiles(x86)} "nodejs\\node.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\\node\\node.exe")
    )
    foreach ($cand in $candidates) {
        if (Test-Path $cand) {
            $nodePath = $cand
            try {
                $nodeVer = (& $cand -v).Trim()
            } catch {
                $nodeVer = "unknown"
            }
            break
        }
    }
}

if (-not [string]::IsNullOrEmpty($nodePath)) {
    Write-Host "  Node.js found: $nodeVer ($nodePath)"
} else {
    Write-Host "  WARNING: Node.js was not detected on this system." -ForegroundColor Yellow
    Write-Host "  Jawalang requires Node.js (v14+) to execute its runtime."
    Write-Host "  Please install Node.js from https://nodejs.org before running programs."
}

# 2. Determine installation location
$isPortableMode = $Portable -or $InPlace
$installDir = ""

if ($isPortableMode) {
    $installDir = $projectRoot
    Write-Host "\`n[2/5] Mode: Portable / In-place installation"
    Write-Host "  Installation directory: $installDir"
} elseif (-not [string]::IsNullOrEmpty($TargetDir)) {
    $installDir = [System.IO.Path]::GetFullPath($TargetDir)
    Write-Host "\`n[2/5] Mode: Custom target directory"
    Write-Host "  Installation directory: $installDir"
} else {
    # Default to %LOCALAPPDATA%\\Jawalang
    $installDir = Join-Path $env:LOCALAPPDATA "Jawalang"
    Write-Host "\`n[2/5] Mode: Standard User distribution"
    Write-Host "  Installation directory: $installDir"
}

# 3. Ensure launcher binary exists or compile it
$srcExe = Join-Path $projectRoot "bin\\jawa.exe"
if (-not (Test-Path $srcExe)) {
    Write-Host "\`nCompiling launcher executable..."
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-launcher.ps1")
}

# If not in-place mode and installDir is different from projectRoot, copy files
if ($installDir -ne $projectRoot) {
    Write-Host "\`n[3/5] Deploying files to $installDir ..."
    if (-not (Test-Path $installDir)) {
        New-Item -Path $installDir -ItemType Directory -Force | Out-Null
    }

    $subdirs = @("bin", "src", "assets")
    foreach ($sd in $subdirs) {
        $srcPath = Join-Path $projectRoot $sd
        $dstPath = Join-Path $installDir $sd
        if (Test-Path $srcPath) {
            if (-not (Test-Path $dstPath)) {
                New-Item -Path $dstPath -ItemType Directory -Force | Out-Null
            }
            Copy-Item -Path "$srcPath\\*" -Destination $dstPath -Recurse -Force
        }
    }

    # Copy root metadata files if present
    $metaFiles = @("package.json", "Readme.md", "LICENSE")
    foreach ($mf in $metaFiles) {
        $srcFile = Join-Path $projectRoot $mf
        if (Test-Path $srcFile) {
            Copy-Item -Path $srcFile -Destination $installDir -Force
        }
    }
} else {
    Write-Host "\`n[3/5] Using existing files in $installDir"
}

$binDir = Join-Path $installDir "bin"
$binExe = Join-Path $binDir "jawa.exe"
$iconPath = Join-Path $installDir "assets\\jawalang.ico"

if (-not (Test-Path $binExe)) {
    Write-Error "Launcher executable not found at $binExe!"
    exit 1
}

# 4. Configure User PATH (Case-insensitive, Idempotent)
Write-Host "\`n[4/5] Configuring User PATH..."
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$pathList = if ([string]::IsNullOrEmpty($userPath)) { @() } else { $userPath -split ';' }

$alreadyInPath = $false
foreach ($p in $pathList) {
    if (-not [string]::IsNullOrWhiteSpace($p)) {
        if ($p.Trim().Equals($binDir, [System.StringComparison]::OrdinalIgnoreCase)) {
            $alreadyInPath = $true
            break
        }
    }
}

if (-not $alreadyInPath) {
    $cleanList = @($pathList | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $cleanList += $binDir
    $newPath = $cleanList -join ';'
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "  Added $binDir to User PATH."
} else {
    Write-Host "  $binDir is already present in User PATH."
}

# Update current session PATH
$sessionPathList = $env:PATH -split ';'
$sessionHasPath = $false
foreach ($sp in $sessionPathList) {
    if ($sp.Trim().Equals($binDir, [System.StringComparison]::OrdinalIgnoreCase)) {
        $sessionHasPath = $true
        break
    }
}
if (-not $sessionHasPath) {
    $env:PATH = "$binDir;$env:PATH"
}

# 5. Register Windows File Association and Context Menu in HKCU
Write-Host "\`n[5/5] Registering .jawa file association & context menu in HKCU..."

# 5a. .jawa extension
$extPath = "HKCU:\\Software\\Classes\\.jawa"
if (-not (Test-Path $extPath)) {
    New-Item -Path $extPath -Force | Out-Null
}
Set-ItemProperty -Path $extPath -Name "(Default)" -Value "Jawalang.Source"

# 5b. Jawalang.Source ProgID
$progIdPath = "HKCU:\\Software\\Classes\\Jawalang.Source"
if (-not (Test-Path $progIdPath)) {
    New-Item -Path $progIdPath -Force | Out-Null
}
Set-ItemProperty -Path $progIdPath -Name "(Default)" -Value "Jawalang Source File"

# 5c. DefaultIcon
$iconRegPath = Join-Path $progIdPath "DefaultIcon"
if (-not (Test-Path $iconRegPath)) {
    New-Item -Path $iconRegPath -Force | Out-Null
}
if (Test-Path $iconPath) {
    Set-ItemProperty -Path $iconRegPath -Name "(Default)" -Value "$iconPath,0"
}

# 5d. Open action (Double-Click Execution)
$openCmdPath = Join-Path $progIdPath "shell\\open\\command"
if (-not (Test-Path $openCmdPath)) {
    New-Item -Path $openCmdPath -Force | Out-Null
}
Set-ItemProperty -Path (Join-Path $progIdPath "shell\\open") -Name "(Default)" -Value "Open with Jawalang"
Set-ItemProperty -Path $openCmdPath -Name "(Default)" -Value "\`"$binExe\`" \`"%1\`""

# 5e. Context Menu: "Run with Jawalang"
$runMenuPath = Join-Path $progIdPath "shell\\run_jawa"
if (-not (Test-Path $runMenuPath)) {
    New-Item -Path $runMenuPath -Force | Out-Null
}
Set-ItemProperty -Path $runMenuPath -Name "(Default)" -Value "Run with Jawalang"
if (Test-Path $iconPath) {
    Set-ItemProperty -Path $runMenuPath -Name "Icon" -Value "$iconPath"
}

$runCmdPath = Join-Path $runMenuPath "command"
if (-not (Test-Path $runCmdPath)) {
    New-Item -Path $runCmdPath -Force | Out-Null
}
Set-ItemProperty -Path $runCmdPath -Name "(Default)" -Value "\`"$binExe\`" \`"%1\`""

# 5f. Broadcast Shell Change Notification
try {
    if (-not ([System.Management.Automation.PSTypeName]'ShellHelper').Type) {
        $notifyCode = @'
using System;
using System.Runtime.InteropServices;
public class ShellHelper {
    [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern void SHChangeNotify(uint wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
'@
        Add-Type -TypeDefinition $notifyCode
    }
    [ShellHelper]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
} catch {
    # Ignore broadcast error if environment restricts P/Invoke
}

# Verification
Write-Host "\`n-----------------------------------------"
Write-Host "Verifying Jawalang CLI:"
$ver = & "$binExe" --version
Write-Host "  Version:  $ver"
Write-Host "  Binary:   $binExe"
Write-Host "  Location: $installDir"
Write-Host "-----------------------------------------"
Write-Host "\`nJawalang installation completed successfully!"
Write-Host "You can now run 'jawa <file.jawa>' from any terminal or double-click .jawa files."
`;

// 2. scripts/uninstall.ps1
const uninstallPs1Content = `# uninstall.ps1
# Safe Jawalang Windows Uninstaller V1.1 — Distribution Hardening
# Cleans only Jawalang-related registry keys, removes bin directory from User PATH,
# and optionally deletes the installation directory if located in %LOCALAPPDATA%\\Jawalang.

param(
    [string]$TargetDir = "",
    [switch]$RemoveFiles
)

$ErrorActionPreference = "Continue"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "========================================="
Write-Host "     JAWALANG WINDOWS UNINSTALLATION     "
Write-Host "========================================="

$installDir = if (-not [string]::IsNullOrEmpty($TargetDir)) {
    [System.IO.Path]::GetFullPath($TargetDir)
} else {
    Join-Path $env:LOCALAPPDATA "Jawalang"
}

$binDir = Join-Path $installDir "bin"
$repoBinDir = Join-Path $projectRoot "bin"

# 1. Remove registry associations (HKCU)
Write-Host "\`n[1/3] Removing registry associations..."

$extPath = "HKCU:\\Software\\Classes\\.jawa"
if (Test-Path $extPath) {
    Remove-Item -Path $extPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Removed $extPath"
}

$progIdPath = "HKCU:\\Software\\Classes\\Jawalang.Source"
if (Test-Path $progIdPath) {
    Remove-Item -Path $progIdPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Removed $progIdPath"
}

# Notify Windows Explorer
try {
    if (-not ([System.Management.Automation.PSTypeName]'ShellHelper').Type) {
        $notifyCode = @'
using System;
using System.Runtime.InteropServices;
public class ShellHelper {
    [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern void SHChangeNotify(uint wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
'@
        Add-Type -TypeDefinition $notifyCode
    }
    [ShellHelper]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
} catch {}

# 2. Clean User PATH (Case-insensitive)
Write-Host "\`n[2/3] Cleaning Jawalang entries from User PATH..."
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if (-not [string]::IsNullOrEmpty($userPath)) {
    $parts = $userPath -split ';'
    $filtered = @()
    $removedAny = $false

    foreach ($p in $parts) {
        if ([string]::IsNullOrWhiteSpace($p)) { continue }
        $trimP = $p.Trim()
        $isJawaPath = $trimP.Equals($binDir, [System.StringComparison]::OrdinalIgnoreCase) -or
                      $trimP.Equals($repoBinDir, [System.StringComparison]::OrdinalIgnoreCase)

        if ($isJawaPath) {
            $removedAny = $true
            Write-Host "  Removed from PATH: $trimP"
        } else {
            $filtered += $trimP
        }
    }

    if ($removedAny) {
        $newPath = $filtered -join ';'
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    } else {
        Write-Host "  No Jawalang bin directory found in User PATH."
    }
}

# 3. Optional cleanup of deployed installation folder
Write-Host "\`n[3/3] Checking deployed files..."
if (Test-Path $installDir) {
    # Safety check: Never delete current source/repo root!
    $isRepo = (Test-Path (Join-Path $installDir ".git")) -or ($installDir -eq $projectRoot)
    if (-not $isRepo) {
        try {
            Remove-Item -Path $installDir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  Removed deployed directory: $installDir"
        } catch {
            Write-Warning "Could not delete $installDir: $_"
        }
    } else {
        Write-Host "  Preserved development repository at $installDir"
    }
}

Write-Host "\`nJawalang uninstallation completed successfully."
`;

// 3. scripts/build-windows.ps1
const buildWindowsPs1Content = `# build-windows.ps1
# Standalone alias for building the native Windows launcher
$ErrorActionPreference = "Stop"
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-launcher.ps1")
`;

// 4. scripts/package-release.ps1
const packageReleasePs1Content = `# package-release.ps1
# Builds and creates a clean standalone distribution package in release/

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

# Read package.json version
$pkgJsonPath = Join-Path $projectRoot "package.json"
$pkg = Get-Content $pkgJsonPath | ConvertFrom-Json
$version = $pkg.version

$releaseName = "Jawalang-v$version-windows-x64"
$releaseDir = Join-Path $projectRoot "release\\$releaseName"
$releaseZip = Join-Path $projectRoot "release\\$releaseName.zip"

Write-Host "========================================="
Write-Host "       PACKAGING JAWALANG RELEASE        "
Write-Host "========================================="
Write-Host "Release version: v$version"
Write-Host "Target package:  $releaseDir"

# 1. Rebuild launcher
Write-Host "\`n[1/4] Rebuilding Windows launcher..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-launcher.ps1")

# 2. Prepare release directory
Write-Host "\`n[2/4] Preparing release directory..."
if (Test-Path $releaseDir) {
    Remove-Item -Path $releaseDir -Recurse -Force
}
New-Item -Path $releaseDir -ItemType Directory -Force | Out-Null

# 3. Copy files
Write-Host "\`n[3/4] Copying release payload..."
$dirsToCopy = @("bin", "src", "assets", "scripts", "examples")
foreach ($d in $dirsToCopy) {
    $src = Join-Path $projectRoot $d
    $dst = Join-Path $releaseDir $d
    if (Test-Path $src) {
        New-Item -Path $dst -ItemType Directory -Force | Out-Null
        Copy-Item -Path "$src\\*" -Destination $dst -Recurse -Force
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
Write-Host "\`n[4/4] Creating ZIP archive: $releaseZip ..."
if (Test-Path $releaseZip) {
    Remove-Item -Path $releaseZip -Force
}

try {
    Compress-Archive -Path "$releaseDir\\*" -DestinationPath $releaseZip -Force
    Write-Host "  ZIP created successfully."
} catch {
    Write-Warning "Compress-Archive not available: $_"
}

Write-Host "\`n========================================="
Write-Host "Release package generated:"
Write-Host "  Folder:  $releaseDir"
if (Test-Path $releaseZip) {
    Write-Host "  Archive: $releaseZip"
}
Write-Host "========================================="
`;

fs.writeFileSync(path.join(ROOT, 'scripts', 'install.ps1'), installPs1Content, 'utf8');
fs.writeFileSync(path.join(ROOT, 'scripts', 'uninstall.ps1'), uninstallPs1Content, 'utf8');
fs.writeFileSync(path.join(ROOT, 'scripts', 'build-windows.ps1'), buildWindowsPs1Content, 'utf8');
fs.writeFileSync(path.join(ROOT, 'scripts', 'package-release.ps1'), packageReleasePs1Content, 'utf8');

// Update package.json scripts
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts["build"] = "powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1";
pkg.scripts["package"] = "powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1";
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

console.log('Scripts and package.json successfully updated.');
