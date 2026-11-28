# Build and publish to GitHub Pages (gh-pages branch).
# Run: powershell -ExecutionPolicy Bypass -File .\deploy.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

npm run build -- --mode ghpages
if ($LASTEXITCODE -ne 0) { throw 'build failed' }

$tmp = Join-Path $env:TEMP 'foren-jons-pages'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory -Path $tmp | Out-Null
Copy-Item 'dist\*' $tmp -Recurse -Force
New-Item -ItemType File -Path (Join-Path $tmp '.nojekyll') -Force | Out-Null

Push-Location $tmp
try {
  git init -b gh-pages 2>&1 | Out-Null
  git config user.name 'legusiano'
  git config user.email 'legusiano@users.noreply.github.com'
  git add -A
  git commit -m 'Deploy ROVEN JONS' 2>&1 | Out-Null
  git remote add origin https://github.com/legusiano/foren-jons.git
  git push -f origin gh-pages
} finally {
  Pop-Location
}

Write-Host 'Done: https://legusiano.github.io/foren-jons/'
