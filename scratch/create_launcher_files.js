const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');

// 1. src/launcher/jawa.cs
const csLauncher = `using System;
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

            // Find cli.js
            string cliScript = Path.Combine(baseDir, "cli.js");
            if (!File.Exists(cliScript))
            {
                cliScript = Path.Combine(baseDir, "..", "bin", "cli.js");
                if (!File.Exists(cliScript))
                {
                    cliScript = Path.Combine(baseDir, "bin", "cli.js");
                }
            }

            if (!File.Exists(cliScript))
            {
                Console.Error.WriteLine("[Error Jawalang]: File CLI 'cli.js' ora ditemokake ing: " + baseDir);
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

            // If launched from Explorer (double-click), console count is 1
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

// 2. scripts/build-launcher.ps1
const ps1Build = `# build-launcher.ps1
# Compiles src/launcher/jawa.cs into bin/jawa.exe with embedded jawalang.ico

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$srcFile = Join-Path $projectRoot "src\\launcher\\jawa.cs"
$outFile = Join-Path $projectRoot "bin\\jawa.exe"
$iconFile = Join-Path $projectRoot "assets\\jawalang.ico"

# Check icon
if (-not (Test-Path $iconFile)) {
    Write-Host "Generating icon assets..."
    & powershell -ExecutionPolicy Bypass -File (Join-Path $projectRoot "scripts\\generate-icon.ps1")
}

$csc = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = "C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
}

if (-not (Test-Path $csc)) {
    Write-Error "Microsoft .NET C# Compiler (csc.exe) not found!"
    exit 1
}

Write-Host "Compiling $srcFile -> $outFile ..."
& $csc /nologo /target:exe /optimize+ "/win32icon:$iconFile" "/out:$outFile" $srcFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Compilation failed with code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Build success: $outFile"
`;

fs.writeFileSync(path.join(PROJECT, 'src', 'launcher', 'jawa.cs'), csLauncher, 'utf8');
console.log('Created src/launcher/jawa.cs');

fs.writeFileSync(path.join(PROJECT, 'scripts', 'build-launcher.ps1'), ps1Build, 'utf8');
console.log('Created scripts/build-launcher.ps1');
