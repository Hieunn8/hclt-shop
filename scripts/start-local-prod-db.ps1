param(
  [switch]$Restart,
  [switch]$SkipCmsBuild
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$CmsEnvPath = Join-Path $RepoRoot "deploy\env\cms.env"
$FrontendEnvPath = Join-Path $RepoRoot "deploy\env\frontend.env"
$LogDir = Join-Path $RepoRoot ".local\logs"
$RunDir = Join-Path $RepoRoot ".local\run"
$CmsDir = Join-Path $RepoRoot "apps\cms"
$WebDir = Join-Path $RepoRoot "apps\web"

New-Item -ItemType Directory -Force -Path $LogDir, $RunDir | Out-Null

function Read-DotEnv([string]$Path) {
  $values = @{}
  if (!(Test-Path $Path)) {
    return $values
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (!$line -or $line.StartsWith("#") -or !$line.Contains("=")) {
      return
    }

    $index = $line.IndexOf("=")
    $key = $line.Substring(0, $index).Trim()
    $value = $line.Substring($index + 1).Trim()
    $values[$key] = $value
  }

  return $values
}

function Write-EnvBlock([hashtable]$Env) {
  $lines = @()
  foreach ($key in $Env.Keys) {
    $escapedKey = $key.Replace("'", "''")
    $escapedValue = [string]$Env[$key]
    $escapedValue = $escapedValue.Replace("'", "''")
    $lines += "[Environment]::SetEnvironmentVariable('$escapedKey', '$escapedValue', 'Process')"
  }
  return ($lines -join "`r`n")
}

function Stop-PortOwner([int]$Port) {
  $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
  foreach ($connection in $connections) {
    if ($connection.OwningProcess -and $connection.OwningProcess -ne $PID) {
      Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
}

function Start-LocalProcess([string]$Name, [string]$WorkingDirectory, [string]$Command, [hashtable]$Env) {
  $runnerPath = Join-Path $RunDir "$Name.ps1"
  $stdoutPath = Join-Path $LogDir "$Name.out.log"
  $stderrPath = Join-Path $LogDir "$Name.err.log"
  $envBlock = Write-EnvBlock $Env

  @"
`$ErrorActionPreference = "Stop"
Set-Location '$WorkingDirectory'
$envBlock
$Command
"@ | Set-Content -Path $runnerPath -Encoding UTF8

  $process = Start-Process `
    -FilePath powershell.exe `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $runnerPath `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -PassThru

  return [pscustomobject]@{
    Name = $Name
    ProcessId = $process.Id
    Stdout = $stdoutPath
    Stderr = $stderrPath
  }
}

function Wait-HttpOk([string]$Url, [int]$TimeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $lastError = $null
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 8
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        return $response
      }
    } catch {
      $lastError = $_.Exception.Message
    }
    Start-Sleep -Seconds 3
  }

  throw "Timed out waiting for $Url. Last error: $lastError"
}

if (!(Test-Path $CmsEnvPath)) {
  throw "Missing $CmsEnvPath. Create it from deploy/env/cms.env.example and set DB credentials first."
}

if ($Restart) {
  Stop-PortOwner 1337
  Stop-PortOwner 3000
  Start-Sleep -Seconds 2
}

if (!$SkipCmsBuild -and !(Test-Path (Join-Path $CmsDir "dist"))) {
  Push-Location $RepoRoot
  try {
    pnpm --filter "@aivisionary/cms" build
  } finally {
    Pop-Location
  }
}

$cmsEnv = Read-DotEnv $CmsEnvPath
$cmsEnv["NODE_ENV"] = "production"
$cmsEnv["PUBLIC_URL"] = "http://localhost:1337"
$cmsEnv["FRONTEND_URL"] = "http://localhost:3000"
$cmsEnv["FRONTEND_REVALIDATE_URL"] = ""
$cmsEnv["REVALIDATE_SECRET"] = ""
$cmsEnv["CONFIGURE_PUBLIC_PERMISSIONS"] = "false"

$frontendEnv = Read-DotEnv $FrontendEnvPath
$frontendEnv["NODE_ENV"] = "development"
$frontendEnv["NEXT_PUBLIC_SITE_URL"] = "http://localhost:3000"
$frontendEnv["NEXT_PUBLIC_STRAPI_URL"] = "http://localhost:1337"
$frontendEnv["STRAPI_INTERNAL_URL"] = "http://localhost:1337"
$frontendEnv["REVALIDATE_SECRET"] = ""
if (!$frontendEnv.ContainsKey("REDIS_URL") -or !$frontendEnv["REDIS_URL"]) {
  $frontendEnv["REDIS_URL"] = "redis://13.140.130.137:6379"
}
if (!$frontendEnv.ContainsKey("REDIS_CACHE_DISABLED") -or !$frontendEnv["REDIS_CACHE_DISABLED"]) {
  $frontendEnv["REDIS_CACHE_DISABLED"] = "false"
}

$started = @()

if (!(Get-NetTCPConnection -LocalPort 1337 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" })) {
  $started += Start-LocalProcess `
    -Name "cms-local-prod-db" `
    -WorkingDirectory $CmsDir `
    -Command "node node_modules/@strapi/strapi/bin/strapi.js start" `
    -Env $cmsEnv
}

if (!(Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" })) {
  $started += Start-LocalProcess `
    -Name "web-local-prod-db" `
    -WorkingDirectory $WebDir `
    -Command "pnpm dev --hostname 0.0.0.0 --port 3000" `
    -Env $frontendEnv
}

$cmsHealth = Wait-HttpOk "http://localhost:1337/api/health" 120
$webHealth = Wait-HttpOk "http://localhost:3000/api/health" 120
$products = Wait-HttpOk "http://localhost:1337/api/products?populate=*" 60
$homeResponse = Wait-HttpOk "http://localhost:3000" 60

$productCount = 0
try {
  $productPayload = $products.Content | ConvertFrom-Json
  $productCount = $productPayload.data.Count
} catch {
  $productCount = -1
}

[pscustomobject]@{
  CmsUrl = "http://localhost:1337"
  WebUrl = "http://localhost:3000"
  CmsHealth = $cmsHealth.StatusCode
  WebHealth = $webHealth.StatusCode
  ProductApiStatus = $products.StatusCode
  ProductCount = $productCount
  HomeStatus = $homeResponse.StatusCode
  Started = $started
  Logs = $LogDir
} | ConvertTo-Json -Depth 5
