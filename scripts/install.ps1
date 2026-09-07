# install.ps1
# Jawalang Windows Installer V1.1 — Distribution Hardening
# Supports:
#   - Default distribution install into %LOCALAPPDATA%\Jawalang
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
Write-Host "`n[1/5] Checking prerequisites..."
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
        (Join-Path $env:ProgramFiles "nodejs\node.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "nodejs\node.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\node\node.exe")
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
    Write-Host "`n[2/5] Mode: Portable / In-place installation"
    Write-Host "  Installation directory: $installDir"
} elseif (-not [string]::IsNullOrEmpty($TargetDir)) {
    $installDir = [System.IO.Path]::GetFullPath($TargetDir)
    Write-Host "`n[2/5] Mode: Custom target directory"
    Write-Host "  Installation directory: $installDir"
} else {
    # Default to %LOCALAPPDATA%\Jawalang
    $installDir = Join-Path $env:LOCALAPPDATA "Jawalang"
    Write-Host "`n[2/5] Mode: Standard User distribution"
    Write-Host "  Installation directory: $installDir"
}

# 3. Ensure launcher binary exists or compile it
$srcExe = Join-Path $projectRoot "bin\jawa.exe"
if (-not (Test-Path $srcExe)) {
    Write-Host "`nCompiling launcher executable..."
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-launcher.ps1")
}

# If not in-place mode and installDir is different from projectRoot, copy files
if ($installDir -ne $projectRoot) {
    Write-Host "`n[3/5] Deploying files to $installDir ..."
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
            Copy-Item -Path "$srcPath\*" -Destination $dstPath -Recurse -Force
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
    Write-Host "`n[3/5] Using existing files in $installDir"
}

$binDir = Join-Path $installDir "bin"
$binExe = Join-Path $binDir "jawa.exe"
$iconPath = Join-Path $installDir "assets\jawalang.ico"

if (-not (Test-Path $binExe)) {
    Write-Error "Launcher executable not found at $binExe!"
    exit 1
}

# 4. Configure User PATH (Case-insensitive, Idempotent)
Write-Host "`n[4/5] Configuring User PATH..."
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
Write-Host "`n[5/5] Registering .jawa file association & context menu in HKCU..."

# 5a. .jawa extension
$extPath = "HKCU:\Software\Classes\.jawa"
if (-not (Test-Path $extPath)) {
    New-Item -Path $extPath -Force | Out-Null
}
Set-ItemProperty -Path $extPath -Name "(Default)" -Value "Jawalang.Source"

# 5b. Jawalang.Source ProgID
$progIdPath = "HKCU:\Software\Classes\Jawalang.Source"
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
$openCmdPath = Join-Path $progIdPath "shell\open\command"
if (-not (Test-Path $openCmdPath)) {
    New-Item -Path $openCmdPath -Force | Out-Null
}
Set-ItemProperty -Path (Join-Path $progIdPath "shell\open") -Name "(Default)" -Value "Open with Jawalang"
Set-ItemProperty -Path $openCmdPath -Name "(Default)" -Value "`"$binExe`" `"%1`""

# 5e. Context Menu: "Run with Jawalang"
$runMenuPath = Join-Path $progIdPath "shell\run_jawa"
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
Set-ItemProperty -Path $runCmdPath -Name "(Default)" -Value "`"$binExe`" `"%1`""

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
Write-Host "`n-----------------------------------------"
Write-Host "Verifying Jawalang CLI:"
$ver = & "$binExe" --version
Write-Host "  Version:  $ver"
Write-Host "  Binary:   $binExe"
Write-Host "  Location: $installDir"
Write-Host "-----------------------------------------"
Write-Host "`nJawalang installation completed successfully!"
Write-Host "You can now run 'jawa <file.jawa>' from any terminal or double-click .jawa files."
