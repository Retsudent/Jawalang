using System;
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
                Path.Combine(baseDir, "..", "src", "cli.js")
            };

            string cliScript = null;
            foreach (string c in candidates)
            {
                try
                {
                    if (File.Exists(c))
                    {
                        cliScript = Path.GetFullPath(c);
                        break;
                    }
                }
                catch { }
            }

            if (cliScript == null)
            {
                Console.Error.WriteLine("[Error Jawalang]: File launcher 'jawa.js' ora ditemokake ing sekitar: " + baseDir);
                return 1;
            }

            // Find node.exe
            string nodePath = FindNode(baseDir);
            if (string.IsNullOrEmpty(nodePath))
            {
                Console.Error.WriteLine("[Error Jawalang]: Node.js ora ditemokake ing sistem panjenengan.");
                Console.Error.WriteLine("Jawalang mbutuhake Node.js (v14+) kanggo nglakokake runtime.");
                Console.Error.WriteLine("Mangga undhuh lan pasang Node.js dhisik saka: https://nodejs.org");
                return 1;
            }

            // Build arguments
            List<string> argList = new List<string>();
            argList.Add(QuoteArgument(cliScript));
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

        static string FindNode(string baseDir)
        {
            // 1. Check local/bundled node.exe in installation directory
            string[] localCandidates = new string[] {
                Path.Combine(baseDir, "node.exe"),
                Path.Combine(baseDir, "..", "node", "node.exe"),
                Path.Combine(baseDir, "..", "bin", "node.exe")
            };
            foreach (string cand in localCandidates)
            {
                try
                {
                    if (File.Exists(cand)) return Path.GetFullPath(cand);
                }
                catch { }
            }

            // 2. Check system PATH
            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                string[] paths = pathEnv.Split(';');
                foreach (string p in paths)
                {
                    if (string.IsNullOrWhiteSpace(p)) continue;
                    try
                    {
                        string candidate = Path.Combine(p.Trim(), "node.exe");
                        if (File.Exists(candidate))
                        {
                            return Path.GetFullPath(candidate);
                        }
                    }
                    catch { }
                }
            }

            // 3. Check standard Windows Program Files directories
            string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            if (!string.IsNullOrEmpty(pf))
            {
                string pfCandidate = Path.Combine(pf, "nodejs", "node.exe");
                if (File.Exists(pfCandidate)) return pfCandidate;
            }

            string pfx86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            if (!string.IsNullOrEmpty(pfx86))
            {
                string pfx86Candidate = Path.Combine(pfx86, "nodejs", "node.exe");
                if (File.Exists(pfx86Candidate)) return pfx86Candidate;
            }

            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            if (!string.IsNullOrEmpty(localApp))
            {
                string localCandidate = Path.Combine(localApp, "Programs", "node", "node.exe");
                if (File.Exists(localCandidate)) return localCandidate;
            }

            return null;
        }

        static string QuoteArgument(string arg)
        {
            if (string.IsNullOrEmpty(arg)) return "\"\"";
            if (arg.Contains(" ") || arg.Contains("\t") || arg.Contains("\""))
            {
                return "\"" + arg.Replace("\"", "\\\"") + "\"";
            }
            return arg;
        }
    }
}
