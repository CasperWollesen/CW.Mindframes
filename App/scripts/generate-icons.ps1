# Draws the Mindframes icon (a sunrise photo with a line of text) as PNGs. Mirrors public/favicon.svg.
Add-Type -AssemblyName System.Drawing
$iconDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public/icons'))
[IO.Directory]::CreateDirectory($iconDirectory) | Out-Null
function New-RoundedRect([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
    $path = New-Object Drawing.Drawing2D.GraphicsPath
    $path.AddArc($x, $y, 2 * $r, 2 * $r, 180, 90)
    $path.AddArc($x + $w - 2 * $r, $y, 2 * $r, 2 * $r, 270, 90)
    $path.AddArc($x + $w - 2 * $r, $y + $h - 2 * $r, 2 * $r, 2 * $r, 0, 90)
    $path.AddArc($x, $y + $h - 2 * $r, 2 * $r, 2 * $r, 90, 90)
    $path.CloseFigure()
    return $path
}
function Color([string]$hex) { return [Drawing.ColorTranslator]::FromHtml($hex) }
foreach ($spec in @(@('icon-192.png', 192, 1.0), @('icon-512.png', 512, 1.0), @('maskable-512.png', 512, 0.8), @('apple-touch-icon.png', 180, 1.0))) {
    $size = [int]$spec[1]
    $bitmap = New-Object Drawing.Bitmap $size, $size
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear((Color '#0d0e12'))
    # Maskable icons keep everything inside the central safe zone.
    $scale = $size / 100.0 * [double]$spec[2]
    $offset = ($size - 100 * $scale) / 2
    $graphics.TranslateTransform($offset, $offset)
    $graphics.ScaleTransform($scale, $scale)
    $card = New-RoundedRect 26 14 48 72 9
    $gradient = New-Object Drawing.Drawing2D.LinearGradientBrush ([Drawing.PointF]::new(0, 14)), ([Drawing.PointF]::new(0, 86)), (Color '#ffcf7a'), (Color '#c4527a')
    $blend = New-Object Drawing.Drawing2D.ColorBlend 3
    $blend.Colors = @((Color '#ffcf7a'), (Color '#ff8a6b'), (Color '#c4527a'))
    $blend.Positions = @(0.0, 0.55, 1.0)
    $gradient.InterpolationColors = $blend
    $graphics.FillPath($gradient, $card)
    $graphics.SetClip($card)
    $sun = New-Object Drawing.SolidBrush (Color '#fff3d6')
    $graphics.FillEllipse($sun, 39, 34, 22, 22)
    $hill = New-Object Drawing.Drawing2D.GraphicsPath
    $hill.AddBezier(20, 66, 34, 53, 44, 55, 54, 61)
    $hill.AddBezier(54, 61, 61, 65, 68, 56, 80, 57)
    $hill.AddLine(80, 57, 80, 90)
    $hill.AddLine(80, 90, 20, 90)
    $hill.CloseFigure()
    $plum = New-Object Drawing.SolidBrush (Color '#2a1630')
    $graphics.FillPath($plum, $hill)
    $white = New-Object Drawing.SolidBrush ([Drawing.Color]::White)
    $line = New-RoundedRect 36 71 28 3.6 1.8
    $graphics.FillPath($white, $line)
    $faint = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(153, 255, 255, 255))
    $line2 = New-RoundedRect 41 77.5 18 2.6 1.3
    $graphics.FillPath($faint, $line2)
    $bitmap.Save((Join-Path $iconDirectory $spec[0]), [Drawing.Imaging.ImageFormat]::Png)
    foreach ($item in @($line2, $faint, $line, $white, $plum, $hill, $sun, $gradient, $card, $graphics, $bitmap)) { $item.Dispose() }
}
