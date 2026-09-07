# register-jawa.ps1
# Registers .jawa file association, custom icon, and context menu in HKCU (No Admin Required)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$binExe = Join-Path $projectRoot "bin\jawa.exe"
$iconPath = Join-Path $projectRoot "assets\jawalang.ico"

if (-not (Test-Path $binExe)) {
    Write-Host "Building launcher first..."
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-launcher.ps1")
}

if (-not (Test-Path $iconPath)) {
    Write-Host "Generating icon assets first..."
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "generate-icon.ps1")
}

Write-Host "Registering Jawalang file association for current user (HKCU)..."

# 1. Register .jawa extension
$extPath = "HKCU:\Software\Classes\.jawa"
if (-not (Test-Path $extPath)) {
    New-Item -Path $extPath -Force | Out-Null
}
Set-ItemProperty -Path $extPath -Name "(Default)" -Value "Jawalang.Source"

# 2. Register Jawalang.Source ProgID
$progIdPath = "HKCU:\Software\Classes\Jawalang.Source"
if (-not (Test-Path $progIdPath)) {
    New-Item -Path $progIdPath -Force | Out-Null
}
Set-ItemProperty -Path $progIdPath -Name "(Default)" -Value "Jawalang Source File"

# 3. DefaultIcon
$iconRegPath = Join-Path $progIdPath "DefaultIcon"
if (-not (Test-Path $iconRegPath)) {
    New-Item -Path $iconRegPath -Force | Out-Null
}
Set-ItemProperty -Path $iconRegPath -Name "(Default)" -Value "$iconPath,0"

# 4. Open action (double-click execution)
$openCmdPath = Join-Path $progIdPath "shell\open\command"
if (-not (Test-Path $openCmdPath)) {
    New-Item -Path $openCmdPath -Force | Out-Null
}
Set-ItemProperty -Path (Join-Path $progIdPath "shell\open") -Name "(Default)" -Value "Open with Jawalang"
Set-ItemProperty -Path $openCmdPath -Name "(Default)" -Value "`"$binExe`" `"%1`" %*"

# 5. Context menu item: "Run with Jawalang"
$runMenuPath = Join-Path $progIdPath "shell\run_jawa"
if (-not (Test-Path $runMenuPath)) {
    New-Item -Path $runMenuPath -Force | Out-Null
}
Set-ItemProperty -Path $runMenuPath -Name "(Default)" -Value "Run with Jawalang"
Set-ItemProperty -Path $runMenuPath -Name "Icon" -Value "$iconPath"

$runCmdPath = Join-Path $runMenuPath "command"
if (-not (Test-Path $runCmdPath)) {
    New-Item -Path $runCmdPath -Force | Out-Null
}
Set-ItemProperty -Path $runCmdPath -Name "(Default)" -Value "`"$binExe`" `"%1`" %*"

# 6. Notify Windows Explorer of association changes
Write-Host "Notifying Windows Explorer of file association changes..."
try {
    $notifyCode = @'
using System;
using System.Runtime.InteropServices;
public class ShellHelper {
    [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern void SHChangeNotify(uint wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
'@
    if (-not ([System.Management.Automation.PSTypeName]'ShellHelper').Type) {
        Add-Type -TypeDefinition $notifyCode
    }
    [ShellHelper]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero) # SHCNE_ASSOCCHANGED
} catch {
    Write-Warning "Could not send SHChangeNotify broadcast: $_"
}

Write-Host "Successfully registered .jawa association!"
Write-Host "  Extension: .jawa -> Jawalang.Source"
Write-Host "  Icon:      $iconPath"
Write-Host "  Action:    Run with Jawalang ($binExe)"
