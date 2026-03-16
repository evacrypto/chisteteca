$ErrorActionPreference = 'Stop'

$roots = @(
  'c:\chisteteca\backend\src',
  'c:\chisteteca\frontend\src'
)
$outFile = 'c:\chisteteca\backend\qa\results\legacy-author-scan.log'
"== Legacy scan $(Get-Date -Format s) ==" | Out-File -FilePath $outFile -Encoding utf8

$patterns = @(
  '/api/authors',
  '/author/',
  'authorsAPI',
  'followAuthor',
  'unfollowAuthor',
  'Author.model',
  'author.routes'
)

$include = @('*.js','*.jsx','*.ts','*.tsx','*.json')
$excludeSegments = @('\node_modules\','\dist\','.git\\')

foreach ($scanRoot in $roots) {
  Get-ChildItem -Path $scanRoot -Recurse -File -Include $include | ForEach-Object {
    $path = $_.FullName
    $skip = $false
    foreach ($seg in $excludeSegments) {
      if ($path -like "*$seg*") {
        $skip = $true
        break
      }
    }
    if ($skip) { return }

    $content = Get-Content -Path $path -Raw -ErrorAction SilentlyContinue
    if (-not $content) { return }

    foreach ($p in $patterns) {
      if ($content -like "*$p*") {
        "HIT|$p|$path" | Out-File -FilePath $outFile -Append -Encoding utf8
      }
    }
  }
}

if (-not (Select-String -Path $outFile -Pattern '^HIT\|' -Quiet)) {
  'OK|No legacy author refs found outside dist/node_modules' | Out-File -FilePath $outFile -Append -Encoding utf8
}
