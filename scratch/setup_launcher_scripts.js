const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\Jawascript';

// 1. src/launcher/jawa.cs
const jawaCsContent = `using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;

namespace Jawalang
{
    class Program
    {
        [DllImport("kernel32.dll", SetLastError = true)]
        static extern uint GetConsoleProcessList(uint[] processList, uint count);

        static int Main(string[] args)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;

            // Find launcher script (jawa.js or cli.js)
            string[] candidates = new string[] {
                Path.Combine(baseDir, "jawa.js"),
                Path.Combine(baseDir, "cli.js"),
                Path.Combine(baseDir, "..", "bin", "jawa.js"),
                Path.Combine(baseDir, "..", "bin", "cli.js"),
                Path.Combine(baseDir, "bin", "jawa.js"),
                Path.Combine(baseDir, "bin", "cli.js"),
            };

            string cliScript = null;
            foreach (string c in candidates)
            {
                if (File.Exists(c))
                {
                    cliScript = c;
                    break;
                }
            }

            if (cliScript == null)
            {
                Console.Error.WriteLine("[Error Jawalang]: File CLI 'jawa.js' ora ditemokake ing: " + baseDir);
                return 1;
            }

            // Find node.exe
            string nodePath = FindNode();
            if (string.IsNullOrEmpty(nodePath))
            {
                Console.Error.WriteLine("[Error Jawalang]: Node.js ora ditemokake. Mangga instal Node.js dhisik (https://nodejs.org).");
                return 1;
            }

            // Build arguments
            List<string> argList = new List<string>();
            argList.Add(QuoteArgument(Path.GetFullPath(cliScript)));
            foreach (string arg in args)
            {
                argList.Add(QuoteArgument(arg));
            }

            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = nodePath;
            psi.Arguments = string.Join(" ", argList.ToArray());
            psi.UseShellExecute = false;
            psi.CreateNoWindow = false;

            int exitCode = 1;
            try
            {
                using (Process proc = Process.Start(psi))
                {
                    proc.WaitForExit();
                    exitCode = proc.ExitCode;
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[Error Jawalang]: Gagal nglakokake runtime: " + ex.Message);
                exitCode = 1;
            }

            // If launched from Explorer (double-click), console process count is 1
            try
            {
                uint[] procList = new uint[2];
                uint count = GetConsoleProcessList(procList, 2);
                if (count <= 1)
                {
                    Console.WriteLine();
                    Console.Write("Program wis rampung. Pencet Enter kanggo nutup...");
                    Console.ReadLine();
                }
            }
            catch
            {
                // Ignore console check errors
            }

            return exitCode;
        }

        static string FindNode()
        {
            // Check PATH first
            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                string[] paths = pathEnv.Split(';');
                foreach (string p in paths)
                {
                    try
                    {
                        string candidate = Path.Combine(p.Trim(), "node.exe");
                        if (File.Exists(candidate))
                        {
                            return candidate;
                        }
                    }
                    catch { }
                }
            }

            // Check standard program files
            string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            string pfCandidate = Path.Combine(pf, "nodejs", "node.exe");
            if (File.Exists(pfCandidate)) return pfCandidate;

            string pfx86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            string pfx86Candidate = Path.Combine(pfx86, "nodejs", "node.exe");
            if (File.Exists(pfx86Candidate)) return pfx86Candidate;

            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string localCandidate = Path.Combine(localApp, "Programs", "node", "node.exe");
            if (File.Exists(localCandidate)) return localCandidate;

            // Fallback to "node"
            return "node";
        }

        static string QuoteArgument(string arg)
        {
            if (string.IsNullOrEmpty(arg)) return "\\"\\"";
            if (arg.Contains(" ") || arg.Contains("\\t") || arg.Contains("\\""))
            {
                return "\\"" + arg.Replace("\\"", "\\\\\\"") + "\\"";
            }
            return arg;
        }
    }
}
`;

// 2. scripts/install.ps1
const installPs1Content = `# install.ps1
# Complete Jawalang Windows installation (Per-User / HKCU, Idempotent)
# 1. Determines installation location
# 2. Ensures executable (bin/jawa.exe) is built
# 3. Adds bin directory to User PATH
# 4. Registers .jawa file association
# 5. Registers custom icon
# 6. Registers context menu ("Run with Jawalang")
# 7. Displays verification results

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $projectRoot "bin"
$binExe = Join-Path $binDir "jawa.exe"
$iconPath = Join-Path $projectRoot "assets\\jawalang.ico"

Write-Host "========================================="
Write-Host "      JAWALANG WINDOWS INSTALLATION      "
Write-Host "========================================="
Write-Host "Installation location: $projectRoot"

# 1. Build launcher executable
Write-Host "\`n[1/4] Ensuring Jawalang launcher is built..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-launcher.ps1")
if (-not (Test-Path $binExe)) {
    Write-Error "Executable $binExe could not be built!"
    exit 1
}

# 2. Configure User PATH (HKCU Environment)
Write-Host "\`n[2/4] Configuring User PATH..."
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

# 3. Register file association, icon, and context menu in HKCU
Write-Host "\`n[3/4] Registering .jawa association & context menu in HKCU..."

# 3a. Register .jawa extension
$extPath = "HKCU:\\Software\\Classes\\.jawa"
if (-not (Test-Path $extPath)) {
    New-Item -Path $extPath -Force | Out-Null
}
Set-ItemProperty -Path $extPath -Name "(Default)" -Value "Jawalang.Source"

# 3b. Register Jawalang.Source ProgID
$progIdPath = "HKCU:\\Software\\Classes\\Jawalang.Source"
if (-not (Test-Path $progIdPath)) {
    New-Item -Path $progIdPath -Force | Out-Null
}
Set-ItemProperty -Path $progIdPath -Name "(Default)" -Value "Jawalang Source File"

# 3c. DefaultIcon
$iconRegPath = Join-Path $progIdPath "DefaultIcon"
if (-not (Test-Path $iconRegPath)) {
    New-Item -Path $iconRegPath -Force | Out-Null
}
Set-ItemProperty -Path $iconRegPath -Name "(Default)" -Value "$iconPath,0"

# 3d. Open action (double-click execution)
$openCmdPath = Join-Path $progIdPath "shell\\open\\command"
if (-not (Test-Path $openCmdPath)) {
    New-Item -Path $openCmdPath -Force | Out-Null
}
Set-ItemProperty -Path (Join-Path $progIdPath "shell\\open") -Name "(Default)" -Value "Open with Jawalang"
Set-ItemProperty -Path $openCmdPath -Name "(Default)" -Value "\`"$binExe\`" \`"%1\`" %*"

# 3e. Context menu: "Run with Jawalang"
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

# 3f. Notify Windows Explorer of association changes
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

# 4. Verify installation
Write-Host "\`n[4/4] Verifying Jawalang CLI:"
Write-Host "-----------------------------------------"
$ver = & "$binDir\\jawa.exe" --version
Write-Host "  Version: $ver"
Write-Host "  Binary:  $binExe"
Write-Host "  Icon:    $iconPath"
Write-Host "-----------------------------------------"
Write-Host "\`nJawalang installation completed successfully!"
Write-Host "You can now run 'jawa <file.jawa>' from any terminal."
`;

// 3. scripts/uninstall.ps1
const uninstallPs1Content = `# uninstall.ps1
# Clean Jawalang Windows Uninstallation
# Removes .jawa file association, context menu, icon association, and cleans User PATH.

$ErrorActionPreference = "Continue"
$projectRoot = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $projectRoot "bin"

Write-Host "========================================="
Write-Host "     JAWALANG WINDOWS UNINSTALLATION     "
Write-Host "========================================="

# 1. Remove registry keys (HKCU)
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

# 2. Remove bin directory from User PATH
Write-Host "\`n[2/2] Cleaning bin directory from User PATH..."
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

// 4. Update install-windows.ps1 & uninstall-windows.ps1 to invoke install.ps1 & uninstall.ps1
const installWindowsContent = `& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "install.ps1")
`;
const uninstallWindowsContent = `& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "uninstall.ps1")
`;

fs.writeFileSync(path.join(ROOT, 'src', 'launcher', 'jawa.cs'), jawaCsContent, 'utf8');
fs.writeFileSync(path.join(ROOT, 'scripts', 'install.ps1'), installPs1Content, 'utf8');
fs.writeFileSync(path.join(ROOT, 'scripts', 'uninstall.ps1'), uninstallPs1Content, 'utf8');
fs.writeFileSync(path.join(ROOT, 'scripts', 'install-windows.ps1'), installWindowsContent, 'utf8');
fs.writeFileSync(path.join(ROOT, 'scripts', 'uninstall-windows.ps1'), uninstallWindowsContent, 'utf8');

console.log('Scripts and launcher sources updated.');
