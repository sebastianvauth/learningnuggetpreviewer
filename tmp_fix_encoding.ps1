# Re-encode all lesson HTML files to UTF-8 with BOM to fix emoji mojibake

Param(
    [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$ErrorActionPreference = 'Stop'

$courseContentDir = Join-Path $Root 'course_content'

if (!(Test-Path -LiteralPath $courseContentDir)) {
    Write-Error "course_content directory not found at: $courseContentDir"
}

function Test-Mojibake([string]$text) {
    return $text -match "\u00F0\u009F" -or $text -match "ðŸ"
}

$files = Get-ChildItem -Path $courseContentDir -Recurse -Filter '*.html' | Sort-Object FullName

$fixed = 0
foreach ($f in $files) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
        $win1252 = [System.Text.Encoding]::GetEncoding(1252)
        $text = $win1252.GetString($bytes)

        if (Test-Mojibake $text) {
            $utf8bom = New-Object System.Text.UTF8Encoding($true)
            [System.IO.File]::WriteAllText($f.FullName, $text, $utf8bom)
            $fixed++
        }
    } catch {
        Write-Warning "Failed to re-encode $($f.FullName): $($_.Exception.Message)"
    }
}

Write-Host "Re-encoded $fixed files to UTF-8 with BOM."

