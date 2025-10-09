# Repair mojibake by reversing CP1252-decoded UTF-8 sequences repeatedly, then save as UTF-8 with BOM

Param(
    [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$ErrorActionPreference = 'Stop'

$courseContentDir = Join-Path $Root 'course_content'
if (!(Test-Path -LiteralPath $courseContentDir)) {
    Write-Error "course_content directory not found: $courseContentDir"
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$utf8bom = New-Object System.Text.UTF8Encoding($true)
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)

function LooksMojibake([string]$s) {
    return $s -match 'Ã.' -or $s -match 'ðŸ' -or $s -match '\u00C3' -or $s -match '\u00F0'
}

function FixMojibake([string]$s) {
    $prev = $s
    for ($i = 0; $i -lt 4; $i++) {
        $bytes = $cp1252.GetBytes($prev)
        $next = $utf8.GetString($bytes)
        if ($next -eq $prev) { break }
        $prev = $next
    }
    return $prev
}

$files = Get-ChildItem -Path $courseContentDir -Recurse -Filter '*.html' | Sort-Object FullName
$repaired = 0
foreach ($f in $files) {
    try {
        $text = [System.IO.File]::ReadAllText($f.FullName, $utf8)
        if (LooksMojibake $text) {
            $fixed = FixMojibake $text
            if ($fixed -ne $text) {
                [System.IO.File]::WriteAllText($f.FullName, $fixed, $utf8bom)
                $repaired++
            }
        }
    } catch {
        Write-Warning "Failed to repair $($f.FullName): $($_.Exception.Message)"
    }
}

Write-Host "Repaired mojibake in $repaired files."

