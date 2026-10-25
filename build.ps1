# Crown & Co. - build script
# Inlines styles.css + app.js into index.src.html to produce the self-contained deliverable index.html
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File build.ps1
$ErrorActionPreference = 'Stop'
$enc = New-Object System.Text.UTF8Encoding($false)
$dir = $PSScriptRoot

$raw = [System.IO.File]::ReadAllText("$dir\index.src.html")
$css = [System.IO.File]::ReadAllText("$dir\styles.css")
$js  = [System.IO.File]::ReadAllText("$dir\app.js")

$linkTag = '<link rel="stylesheet" href="./styles.css">'
if (-not $raw.Contains($linkTag)) { throw 'link tag not found in index.src.html' }
$raw = $raw.Replace($linkTag, "<style>`n$css`n</style>")

$srcTag = '<script src="./app.js" defer></script>'
if (-not $raw.Contains($srcTag)) { throw 'app.js script tag not found in index.src.html' }
$raw = $raw.Replace($srcTag, "<script>`n$js`n</script>")

[System.IO.File]::WriteAllText("$dir\index.html", $raw, $enc)

# verification: embedded JS and CSS must still be the same bytes
$idx = [System.IO.File]::ReadAllText("$dir\index.html")
if (-not $idx.Contains($js))  { throw 'app.js content mismatch after embed' }
if (-not $idx.Contains($css)) { throw 'styles.css content mismatch after embed' }
$kb = [math]::Round((Get-Item "$dir\index.html").Length / 1KB, 1)
"BUILD OK - index.html is self-contained ($kb KB)"
