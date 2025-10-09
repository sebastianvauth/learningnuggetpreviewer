# Bulk-fix common broken symbols (check marks) across lesson HTML files

Param(
    [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$ErrorActionPreference = 'Stop'

$courseContentDir = Join-Path $Root 'course_content'
if (!(Test-Path -LiteralPath $courseContentDir)) {
    Write-Error "course_content directory not found at: $courseContentDir"
}

$files = Get-ChildItem -Path $courseContentDir -Recurse -Filter '*.html'
$fixed = 0
foreach ($f in $files) {
    try {
        $original = Get-Content -LiteralPath $f.FullName -Raw
        $text = $original

        # Replace static button content: > ? Mark as Completed -> > &#10003; Mark as Completed
        $text = [regex]::Replace($text, '>\s*\?\s*Mark as Completed', '> &#10003; Mark as Completed')

        # Replace JS innerHTML assignments with a safe check emoji entity
        $text = [regex]::Replace($text, 'innerHTML\s*=\s*''\?\s*Completed!''', "innerHTML = '&#9989; Completed!'")
        $text = [regex]::Replace($text, 'innerHTML\s*=\s*"\?\s*Completed!"', 'innerHTML = "&#9989; Completed!"')

        if ($text -ne $original) {
            Set-Content -LiteralPath $f.FullName -Value $text -Encoding UTF8
            $fixed++
        }
    } catch {
        Write-Warning "Failed to update $($f.FullName): $($_.Exception.Message)"
    }
}

Write-Host "Updated $fixed files with checkmark fixes."
