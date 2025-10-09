$ErrorActionPreference = 'Stop'

function Get-SafeFileName {
    param(
        [Parameter(Mandatory=$true)][string]$Name,
        [int]$MaxBaseLength = 100
    )
    # Keep extension if present
    $ext = [System.IO.Path]::GetExtension($Name)
    if ([string]::IsNullOrWhiteSpace($ext)) { $ext = '.html' }
    $base = [System.IO.Path]::GetFileNameWithoutExtension($Name)

    # Replace illegal characters: < > : " / \ | ? * and control chars
    $base = ($base -replace "[<>:\\""/\\|\?\*]", '-')
    # Replace non-printable/control
    $base = ($base -replace "[\x00-\x1F]", '-')
    # Collapse whitespace and hyphens
    $base = ($base -replace "\s+", '-')
    $base = ($base -replace "-+", '-')
    # Trim hyphens/dots/spaces
    $base = $base.Trim('-','.',' ')
    if ([string]::IsNullOrWhiteSpace($base)) { $base = 'lesson' }

    # Truncate base to limit total filename length
    $max = [Math]::Max(10, $MaxBaseLength)
    if ($base.Length -gt $max) { $base = $base.Substring(0, $max).Trim('-') }

    # Ensure extension sane
    if ($ext -notmatch '^\.[A-Za-z0-9]+$') { $ext = '.html' }

    return ($base + $ext)
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$baseDir = Join-Path $root 'course_content'
$jsonPath = Join-Path $root 'content.json'

if (-not (Test-Path $jsonPath)) { Write-Error "content.json not found at $jsonPath" }

$jsonText = Get-Content -Raw -Path $jsonPath
$data = $jsonText | ConvertFrom-Json

$changes = @()
$created = 0
$renamed = 0
$skipped = 0

# Track uniqueness per module
$moduleNameSets = @{}

foreach ($course in $data.courses) {
    foreach ($path in $course.learningPaths) {
        $pathFolder = $path.folder
        if ([string]::IsNullOrWhiteSpace($pathFolder)) { continue }
        $pathRel = ($pathFolder -replace '/', [System.IO.Path]::DirectorySeparatorChar)
        $pathDir = Join-Path $baseDir $pathRel
        $lpPathDir = "\\\\?\$pathDir"
        if (-not [System.IO.Directory]::Exists($lpPathDir)) { [System.IO.Directory]::CreateDirectory($lpPathDir) | Out-Null }

        foreach ($module in $path.modules) {
            $moduleFolder = $module.folder
            if ([string]::IsNullOrWhiteSpace($moduleFolder)) { continue }
            $moduleRel = ($moduleFolder -replace '/', [System.IO.Path]::DirectorySeparatorChar)
            $moduleDir = Join-Path $pathDir $moduleRel
            $lpModuleDir = "\\\\?\$moduleDir"
            if (-not [System.IO.Directory]::Exists($lpModuleDir)) { [System.IO.Directory]::CreateDirectory($lpModuleDir) | Out-Null }

            $moduleKey = "$($pathFolder)|$($moduleFolder)"
            if (-not $moduleNameSets.ContainsKey($moduleKey)) { $moduleNameSets[$moduleKey] = @{} }
            $nameSet = $moduleNameSets[$moduleKey]

            foreach ($lesson in $module.lessons) {
                if ($null -eq $lesson.file -or [string]::IsNullOrWhiteSpace([string]$lesson.file)) { continue }
                $oldName = [string]$lesson.file
                $safe = Get-SafeFileName -Name $oldName -MaxBaseLength 100

                # Ensure uniqueness within module by adding numeric suffix
                $base = [System.IO.Path]::GetFileNameWithoutExtension($safe)
                $ext = [System.IO.Path]::GetExtension($safe)
                $candidate = $safe
                $i = 1
                while ($nameSet.ContainsKey($candidate)) {
                    $suffix = "-$i"
                    $maxBase = [Math]::Max(10, 100 - $suffix.Length)
                    $newBase = $base
                    if ($newBase.Length -gt $maxBase) { $newBase = $newBase.Substring(0, $maxBase) }
                    $candidate = $newBase + $suffix + $ext
                    $i++
                }
                $nameSet[$candidate] = $true

                $newName = $candidate
                if ($newName -ne $oldName) {
                    $changes += "$oldName => $newName"
                    # Rename existing file if present; otherwise create placeholder
                    $oldPath = Join-Path $moduleDir $oldName
                    $newPath = Join-Path $moduleDir $newName
                    $lpOld = "\\\\?\$oldPath"
                    $lpNew = "\\\\?\$newPath"
                    if ([System.IO.File]::Exists($lpOld) -and -not [System.IO.File]::Exists($lpNew)) {
                        try { [System.IO.File]::Move($lpOld, $lpNew); $renamed++ } catch { $skipped++ }
                    }
                    if (-not [System.IO.File]::Exists($lpNew)) {
                        $title = if ($lesson.title) { [string]$lesson.title } elseif ($lesson.id) { [string]$lesson.id } else { 'Lesson' }
                        $html = @" 
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>$title</title>
</head>
<body>
  <h1>$title</h1>
  <p>Placeholder for $($lesson.id)</p>
  <script>window.initializeCompletion = function(){};</script>
</body>
</html>
"@
                        # Ensure parent dir exists and write using long path
                        [System.IO.Directory]::CreateDirectory($lpModuleDir) | Out-Null
                        [System.IO.File]::WriteAllText($lpNew, $html, [System.Text.Encoding]::UTF8)
                        $created++
                    }
                    $lesson.file = $newName
                } else {
                    # Names equal, ensure file exists
                    $target = Join-Path $moduleDir $newName
                    $lpTarget = "\\\\?\$target"
                    if (-not [System.IO.File]::Exists($lpTarget)) {
                        $title = if ($lesson.title) { [string]$lesson.title } elseif ($lesson.id) { [string]$lesson.id } else { 'Lesson' }
                        $html = @" 
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>$title</title>
</head>
<body>
  <h1>$title</h1>
  <p>Placeholder for $($lesson.id)</p>
  <script>window.initializeCompletion = function(){};</script>
</body>
</html>
"@
                        [System.IO.Directory]::CreateDirectory($lpModuleDir) | Out-Null
                        [System.IO.File]::WriteAllText($lpTarget, $html, [System.Text.Encoding]::UTF8)
                        $created++
                    }
                }
            }
        }
    }
}

# Write updated JSON back with 2-space indentation
$outJson = $data | ConvertTo-Json -Depth 100
Set-Content -Path $jsonPath -Value $outJson -Encoding UTF8

Write-Output ("Sanitized entries: " + $changes.Count)
if ($changes.Count -gt 0) { $changes | Select-Object -First 50 | ForEach-Object { Write-Output $_ } }
Write-Output ("Renamed=$renamed Created=$created Skipped=$skipped")


