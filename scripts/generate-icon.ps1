# generate-icon.ps1
# Generates valid multi-resolution Jawalang.ico
# Sizes: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$outIco = Join-Path $projectRoot "assets\jawalang.ico"
$sizes = @(16, 24, 32, 48, 64, 128, 256)

function Draw-JawalangImage([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $scale = $size / 256.0

    # Draw squircle background
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

    # Gold border
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 245, 158, 11), [Math]::Max(1.0, 6.0 * $scale))
    $g.DrawPath($borderPen, $path)

    # Brackets '<' and '>' (cyan)
    $bracketPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 56, 189, 248), [Math]::Max(1.5, 16.0 * $scale))
    $bracketPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $bracketPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $bracketPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    if ($size -ge 32) {
        # Left '<'
        $leftPoints = @(
            New-Object System.Drawing.PointF(76.0 * $scale, 96.0 * $scale),
            New-Object System.Drawing.PointF(48.0 * $scale, 128.0 * $scale),
            New-Object System.Drawing.PointF(76.0 * $scale, 160.0 * $scale)
        )
        $g.DrawLines($bracketPen, $leftPoints)

        # Right '>'
        $rightPoints = @(
            New-Object System.Drawing.PointF(180.0 * $scale, 96.0 * $scale),
            New-Object System.Drawing.PointF(208.0 * $scale, 128.0 * $scale),
            New-Object System.Drawing.PointF(180.0 * $scale, 160.0 * $scale)
        )
        $g.DrawLines($bracketPen, $rightPoints)
    }

    # Center 'J' (gold/amber)
    $jPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 251, 191, 36), [Math]::Max(2.0, 20.0 * $scale))
    $jPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $jPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $jPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    if ($size -le 24) {
        # High-contrast simplified glyph for 16x16 and 24x24
        $jPoints = @(
            New-Object System.Drawing.PointF(140.0 * $scale, 64.0 * $scale),
            New-Object System.Drawing.PointF(140.0 * $scale, 150.0 * $scale),
            New-Object System.Drawing.PointF(110.0 * $scale, 184.0 * $scale),
            New-Object System.Drawing.PointF(80.0 * $scale, 160.0 * $scale)
        )
        $g.DrawLines($jPen, $jPoints)
    } else {
        # Full smooth curve
        $jPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $jPath.AddLine(148.0 * $scale, 76.0 * $scale, 148.0 * $scale, 144.0 * $scale)
        $jPath.AddBezier(
            148.0 * $scale, 144.0 * $scale,
            148.0 * $scale, 172.0 * $scale,
            124.0 * $scale, 186.0 * $scale,
            98.0 * $scale, 180.0 * $scale
        )
        $jPath.AddBezier(
            98.0 * $scale, 180.0 * $scale,
            82.0 * $scale, 176.0 * $scale,
            72.0 * $scale, 162.0 * $scale,
            70.0 * $scale, 150.0 * $scale
        )
        $g.DrawPath($jPen, $jPath)

        # Top dot
        $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 251, 191, 36))
        $dotR = 10.0 * $scale
        $g.FillEllipse($dotBrush, (148.0 * $scale) - $dotR, (60.0 * $scale) - $dotR, $dotR * 2.0, $dotR * 2.0)
    }

    $g.Dispose()
    return $bmp
}

# Collect PNG bytes for each size
$pngEntries = @()
foreach ($s in $sizes) {
    $bmp = Draw-JawalangImage -size $s
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bytes = $ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()
    $pngEntries += ,@($s, $bytes)
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
