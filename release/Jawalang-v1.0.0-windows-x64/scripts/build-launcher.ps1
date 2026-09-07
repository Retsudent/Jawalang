# build-launcher.ps1
# Compiles src/launcher/jawa.cs into bin/jawa.exe with embedded jawalang.ico

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$srcFile = Join-Path $projectRoot "src\launcher\jawa.cs"
$outFile = Join-Path $projectRoot "bin\jawa.exe"
$iconFile = Join-Path $projectRoot "assets\jawalang.ico"

# Check icon
if (-not (Test-Path $iconFile)) {
    Write-Host "Generating icon assets..."
    & powershell -ExecutionPolicy Bypass -File (Join-Path $projectRoot "scripts\generate-icon.ps1")
}

$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
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
