# build-windows.ps1
# Standalone alias for building the native Windows launcher
$ErrorActionPreference = "Stop"
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-launcher.ps1")
