const fs = require('fs');
const path = require('path');

const PROJECT = 'D:\\Jawascript';

// 1. scripts/register-jawa.ps1
const registerScript = `# register-jawa.ps1
# Registers .jawa file association, custom icon, and context menu in HKCU (No Admin Required)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$binExe = Join-Path $projectRoot "bin\\jawa.exe"
$iconPath = Join-Path $projectRoot "assets\\jawalang.ico"

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
$extPath = "HKCU:\\Software\\Classes\\.jawa"
if (-not (Test-Path $extPath)) {
    New-Item -Path $extPath -Force | Out-Null
}
Set-ItemProperty -Path $extPath -Name "(Default)" -Value "Jawalang.Source"

# 2. Register Jawalang.Source ProgID
$progIdPath = "HKCU:\\Software\\Classes\\Jawalang.Source"
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
$openCmdPath = Join-Path $progIdPath "shell\\open\\command"
if (-not (Test-Path $openCmdPath)) {
    New-Item -Path $openCmdPath -Force | Out-Null
}
Set-ItemProperty -Path (Join-Path $progIdPath "shell\\open") -Name "(Default)" -Value "Open with Jawalang"
Set-ItemProperty -Path $openCmdPath -Name "(Default)" -Value "\`"$binExe\`" \`"%1\`" %*"

# 5. Context menu item: "Run with Jawalang"
$runMenuPath = Join-Path $progIdPath "shell\\run_jawa"
if (-not (Test-Path $runMenuPath)) {
    New-Item -Path $runMenuPath -Force | Out-Null
}
Set-ItemProperty -Path $runMenuPath -Name "(Default)" -Value "Run with Jawalang"
Set-ItemProperty -Path $runMenuPath -Name "Icon" -Value "$iconPath"

$runCmdPath = Join-Path $runMenuPath "command"
if (-not (Test-Path $runCmdPath)) {
    New-Item -Path $runCmdPath -Force | Out-Null
}
Set-ItemProperty -Path $runCmdPath -Name "(Default)" -Value "\`"$binExe\`" \`"%1\`" %*"

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
`;

// 2. scripts/install-windows.ps1
const installScript = `# install-windows.ps1
# Complete Jawalang Windows installation:
# 1. Builds launcher (bin/jawa.exe)
# 2. Adds bin directory to User PATH
# 3. Registers file association, icon, and context menu

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $projectRoot "bin"

Write-Host "========================================="
Write-Host "      JAWALANG WINDOWS INSTALLATION      "
Write-Host "========================================="

# 1. Build launcher
Write-Host "\`n[1/3] Building Jawalang launcher..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-launcher.ps1")

# 2. Add to User PATH
Write-Host "\`n[2/3] Configuring User PATH..."
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$binDir*") {
    $newPath = if ([string]::IsNullOrEmpty($userPath)) { $binDir } else { "$userPath;$binDir" }
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "Added $binDir to User PATH."
} else {
    Write-Host "$binDir is already present in User PATH."
}

# Also update current session PATH
if ($env:PATH -notlike "*$binDir*") {
    $env:PATH = "$binDir;$env:PATH"
}

# 3. Register file association & context menu
Write-Host "\`n[3/3] Registering Windows file association..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "register-jawa.ps1")

# 4. Verify installation
Write-Host "\`n-----------------------------------------"
Write-Host "Verifying Jawalang CLI:"
$ver = & "$binDir\\jawa.exe" --version
Write-Host "  $ver"
Write-Host "-----------------------------------------"
Write-Host "\`nJawalang installation completed successfully!"
Write-Host "You can now run 'jawa <file.jawa>' from any terminal."
`;

// 3. scripts/uninstall-windows.ps1
const uninstallScript = `# uninstall-windows.ps1
# Cleans up Jawalang file association, context menu, and removes from User PATH

$ErrorActionPreference = "Continue"
$projectRoot = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $projectRoot "bin"

Write-Host "========================================="
Write-Host "     JAWALANG WINDOWS UNINSTALLATION     "
Write-Host "========================================="

# 1. Remove registry keys
Write-Host "\`n[1/2] Removing registry associations..."

$extPath = "HKCU:\\Software\\Classes\\.jawa"
if (Test-Path $extPath) {
    Remove-Item -Path $extPath -Recurse -Force
    Write-Host "Removed $extPath"
}

$progIdPath = "HKCU:\\Software\\Classes\\Jawalang.Source"
if (Test-Path $progIdPath) {
    Remove-Item -Path $progIdPath -Recurse -Force
    Write-Host "Removed $progIdPath"
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

# 2. Remove from User PATH
Write-Host "\`n[2/2] Removing bin directory from User PATH..."
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -like "*$binDir*") {
    $parts = $userPath -split ';' | Where-Object { $_ -ne $binDir -and $_ -ne "" }
    $newPath = $parts -join ';'
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "Removed $binDir from User PATH."
} else {
    Write-Host "$binDir was not found in User PATH."
}

Write-Host "\`nJawalang uninstallation completed successfully."
`;

fs.writeFileSync(path.join(PROJECT, 'scripts', 'register-jawa.ps1'), registerScript, 'utf8');
console.log('Created scripts/register-jawa.ps1');

fs.writeFileSync(path.join(PROJECT, 'scripts', 'install-windows.ps1'), installScript, 'utf8');
console.log('Created scripts/install-windows.ps1');

fs.writeFileSync(path.join(PROJECT, 'scripts', 'uninstall-windows.ps1'), uninstallScript, 'utf8');
console.log('Created scripts/uninstall-windows.ps1');
