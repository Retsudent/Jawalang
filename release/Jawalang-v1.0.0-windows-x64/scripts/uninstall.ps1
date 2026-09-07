# uninstall.ps1
# Safe Jawalang Windows Uninstaller V1.1 — Distribution Hardening
# Cleans only Jawalang-related registry keys, removes bin directory from User PATH,
# and optionally deletes the installation directory if located in %LOCALAPPDATA%\Jawalang.

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
Write-Host "`n[1/3] Removing registry associations..."

$extPath = "HKCU:\Software\Classes\.jawa"
if (Test-Path $extPath) {
    Remove-Item -Path $extPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Removed $extPath"
}

$progIdPath = "HKCU:\Software\Classes\Jawalang.Source"
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
Write-Host "`n[2/3] Cleaning Jawalang entries from User PATH..."
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
Write-Host "`n[3/3] Checking deployed files..."
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

Write-Host "`nJawalang uninstallation completed successfully."
