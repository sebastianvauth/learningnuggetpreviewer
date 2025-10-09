$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$jsonPath = Join-Path $root 'content.json'
if (-not (Test-Path $jsonPath)) { Write-Error "content.json not found" }

$data = Get-Content -Raw -Path $jsonPath | ConvertFrom-Json

foreach ($course in $data.courses) {
    $paths = @($course.learningPaths)
    $pathCount = ($paths | Measure-Object).Count
    $moduleCount = 0
    $lessonCount = 0

    foreach ($p in $paths) {
        $mods = @($p.modules)
        $moduleCount += ($mods | Measure-Object).Count
        foreach ($m in $mods) {
            $less = @($m.lessons)
            $lessonCount += ($less | Measure-Object).Count
        }
    }

    Write-Output ("COURSE|" + $course.id + "|" + $course.title + "|paths=" + $pathCount + "|modules=" + $moduleCount + "|lessons=" + $lessonCount)

    foreach ($p in $paths) {
        $mods = @($p.modules)
        $mcount = ($mods | Measure-Object).Count
        $lcount = 0
        foreach ($m in $mods) { $lcount += (@($m.lessons) | Measure-Object).Count }
        Write-Output ("PATH|" + $course.id + "|" + $p.id + "|" + $p.title + "|modules=" + $mcount + "|lessons=" + $lcount)
    }
}




