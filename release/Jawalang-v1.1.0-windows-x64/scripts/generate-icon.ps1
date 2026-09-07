# generate-icon.ps1
# Generates valid multi-resolution Jawalang.ico from source photo or procedural vector
# Sizes: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $projectRoot "assets"
$outIco = Join-Path $assetsDir "jawalang.ico"
$outPng = Join-Path $assetsDir "jawalang.png"
$vsCodeIcon = Join-Path $projectRoot "vscode-extension\icons\jawalang.png"
$sizes = @(16, 24, 32, 48, 64, 128, 256)

# Look for user-provided source image first
$userImageCandidates = @(
    (Join-Path $assetsDir "ChatGPT Image Sep 7, 2026, 09_06_54 PM.png"),
    (Join-Path $assetsDir "logo.png"),
    (Join-Path $assetsDir "source.png")
)

$sourceImageFile = $null
foreach ($cand in $userImageCandidates) {
    if (Test-Path $cand) {
        $sourceImageFile = $cand
        break
    }
}

$pngEntries = @()

if ($sourceImageFile) {
    Write-Host "Generating icon from source image: $sourceImageFile"
    $sourceBmp = [System.Drawing.Bitmap]::FromFile($sourceImageFile)

    function Resize-Image([System.Drawing.Bitmap]$src, [int]$size) {
        $dest = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($dest)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.DrawImage($src, 0, 0, $size, $size)
        $g.Dispose()
        return $dest
    }

    foreach ($s in $sizes) {
        $bmp = Resize-Image -src $sourceBmp -size $s
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $ms.ToArray()
        $ms.Dispose()
        $bmp.Dispose()
        $pngEntries += ,@($s, $bytes)
    }

    # Also update assets/jawalang.png and vscode-extension/icons/jawalang.png with 256x256
    $stdPng = Resize-Image -src $sourceBmp -size 256
    $stdPng.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
    if (Test-Path (Split-Path -Parent $vsCodeIcon)) {
        $stdPng.Save($vsCodeIcon, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    $stdPng.Dispose()
    $sourceBmp.Dispose()
} else {
    Write-Host "No custom source image found, falling back to procedural generation."

    function Draw-JawalangImage([int]$size) {
        $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)

        $scale = $size / 256.0

        $rectX = 16.0 * $scale
        $rectY = 16.0 * $scale
        $rectW = 224.0 * $scale
        $rectH = 224.0 * $scale
        $radius = 48.0 * $scale

        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $diameter = $radius * 2.0
        $path.AddArc($rectX, $rectY, $diameter, $diameter, 180, 90)
        $path.AddArc($rectX + $rectW - $diameter, $rectY, $diameter, $diameter, 270, 90)
        $path.AddArc($rectX + $rectW - $diameter, $rectY + $rectH - $diameter, $diameter, $diameter, 0, 90)
        $path.AddArc($rectX, $rectY + $rectH - $diameter, $diameter, $diameter, 90, 90)
        $path.CloseFigure()

        $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 26, 30, 50))
        $g.FillPath($bgBrush, $path)

        $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 245, 158, 11), [Math]::Max(1.0, 6.0 * $scale))
        $g.DrawPath($borderPen, $path)

        $jPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 251, 191, 36), [Math]::Max(2.0, 20.0 * $scale))
        $jPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $jPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $jPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

        $jPoints = @(
            New-Object System.Drawing.PointF(140.0 * $scale, 64.0 * $scale),
            New-Object System.Drawing.PointF(140.0 * $scale, 150.0 * $scale),
            New-Object System.Drawing.PointF(110.0 * $scale, 184.0 * $scale),
            New-Object System.Drawing.PointF(80.0 * $scale, 160.0 * $scale)
        )
        $g.DrawLines($jPen, $jPoints)

        $g.Dispose()
        return $bmp
    }

    foreach ($s in $sizes) {
        $bmp = Draw-JawalangImage -size $s
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $ms.ToArray()
        $ms.Dispose()
        $bmp.Dispose()
        $pngEntries += ,@($s, $bytes)
    }
}

# Build binary ICO file
$fileStream = New-Object System.IO.FileStream($outIco, [System.IO.FileMode]::Create)
$writer = New-Object System.IO.BinaryWriter($fileStream)

# 1. ICONDIR Header (6 bytes)
$writer.Write([uint16]0) # Reserved
$writer.Write([uint16]1) # Type: 1 = ICO
$writer.Write([uint16]$sizes.Length) # Image count

# 2. ICONDIRENTRY (16 bytes per image)
$offset = 6 + (16 * $sizes.Length)
for ($i = 0; $i -lt $pngEntries.Length; $i++) {
    $size = $pngEntries[$i][0]
    $data = $pngEntries[$i][1]

    $w = if ($size -ge 256) { [byte]0 } else { [byte]$size }
    $h = if ($size -ge 256) { [byte]0 } else { [byte]$size }

    $writer.Write([byte]$w)
    $writer.Write([byte]$h)
    $writer.Write([byte]0)   # ColorCount (0 = >=8bpp)
    $writer.Write([byte]0)   # Reserved
    $writer.Write([uint16]1) # Planes
    $writer.Write([uint16]32)# BitCount
    $writer.Write([uint32]$data.Length) # BytesInRes
    $writer.Write([uint32]$offset)      # ImageOffset

    $offset += $data.Length
}

# 3. Image Data (PNG streams)
for ($i = 0; $i -lt $pngEntries.Length; $i++) {
    $data = $pngEntries[$i][1]
    $writer.Write($data)
}

$writer.Flush()
$writer.Close()
$fileStream.Close()

Write-Host "Successfully generated valid multi-resolution ICO at: $outIco"
Write-Host "Contains resolutions: $($sizes -join ', ')"
