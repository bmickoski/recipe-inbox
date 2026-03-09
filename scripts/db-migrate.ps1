param(
  [switch]$SkipGenerate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-EnvValueFromFile {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string]$Key
  )

  foreach ($line in Get-Content -Path $FilePath) {
    if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
      $raw = $Matches[1].Trim()
      if (($raw.StartsWith('"') -and $raw.EndsWith('"')) -or ($raw.StartsWith("'") -and $raw.EndsWith("'"))) {
        return $raw.Substring(1, $raw.Length - 2)
      }
      return $raw
    }
  }

  return $null
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$envFile = Join-Path $projectRoot '.env'

if (-not (Test-Path $envFile)) {
  throw ".env not found at $envFile"
}

$directUrl = Get-EnvValueFromFile -FilePath $envFile -Key 'DIRECT_URL'
if ([string]::IsNullOrWhiteSpace($directUrl)) {
  throw "DIRECT_URL is missing in .env. Add DIRECT_URL and rerun."
}

$env:DATABASE_URL = $directUrl

Write-Host "Using DIRECT_URL for migration deploy..."

Push-Location $projectRoot
try {
  & npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) {
    throw "prisma migrate deploy failed."
  }

  if (-not $SkipGenerate) {
    & npx prisma generate
    if ($LASTEXITCODE -ne 0) {
      throw "prisma generate failed."
    }
  }
}
finally {
  Pop-Location
}

Write-Host "Database migration flow completed."
