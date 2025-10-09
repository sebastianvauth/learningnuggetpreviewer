$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$jsonPath = Join-Path $root 'content.json'
if (-not (Test-Path $jsonPath)) { Write-Error "content.json not found" }

$data = Get-Content -Raw -Path $jsonPath | ConvertFrom-Json

foreach ($course in $data.courses) {
    Write-Output ('- ' + $course.title + ' (' + $course.id + ')')
    foreach ($p in $course.learningPaths) {
        Write-Output ('  - ' + $p.title + ' (' + $p.id + ')')
        foreach ($m in $p.modules) {
            Write-Output ('    - ' + $m.title + ' (' + $m.id + ')')
            foreach ($l in $m.lessons) {
                Write-Output ('      - ' + $l.title + ' (' + $l.id + ')')
            }
        }
    }
}




