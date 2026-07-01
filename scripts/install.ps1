<#
  Audit Status Portal — Windows installer (PowerShell)

  One-line install (PowerShell, run as your normal user):

    powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Muminur/AuditTIN/claude/beautiful-planck-i1wv3z/scripts/install.ps1 | iex"

  Or, from inside an already-cloned repo:

    powershell -ExecutionPolicy Bypass -File scripts\install.ps1

  What it does:
    1. Checks Git + Node.js (>= 22).
    2. Clones the repo (branch claude/beautiful-planck-i1wv3z) if not already in it.
    3. Runs `npm install`.
    4. Creates .env.local from .env.example and generates a fresh AUTH_SECRET.
    5. Prints how to start the dev server.
#>

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/Muminur/AuditTIN.git"
$Branch  = "claude/beautiful-planck-i1wv3z"
$Dir     = "AuditTIN"

function Info($m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "OK  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "!!  $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "xx  $m" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  Audit Status Portal - installer" -ForegroundColor White
Write-Host "  --------------------------------" -ForegroundColor DarkGray
Write-Host ""

# 1. Prerequisites -----------------------------------------------------------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Die "Git is not installed. Get it from https://git-scm.com/download/win"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Die "Node.js is not installed. Install Node 22+ from https://nodejs.org (or: winget install OpenJS.NodeJS.LTS)"
}

$nodeMajor = [int]((node --version) -replace 'v(\d+)\..*', '$1')
if ($nodeMajor -lt 22) {
  Warn "Node $((node --version)) detected; this project targets Node 22+. Continuing anyway."
} else {
  Ok "Node $((node --version))"
}

# 2. Get the code ------------------------------------------------------------
$inRepo = (Test-Path "package.json") -and
          (Select-String -Path "package.json" -Pattern '"audit-status-portal"' -Quiet -ErrorAction SilentlyContinue)

if ($inRepo) {
  Info "Already inside the repository; installing here."
} elseif (Test-Path $Dir) {
  Info "Folder '$Dir' exists; entering it."
  Set-Location $Dir
} else {
  Info "Cloning $RepoUrl (branch $Branch)..."
  git clone --branch $Branch --single-branch $RepoUrl $Dir
  if ($LASTEXITCODE -ne 0) { Die "git clone failed (is the repo private? sign in to GitHub first)." }
  Set-Location $Dir
}

# 3. Install dependencies ----------------------------------------------------
Info "Installing dependencies (npm install)..."
npm install
if ($LASTEXITCODE -ne 0) { Die "npm install failed." }
Ok "Dependencies installed."

# 4. Environment file --------------------------------------------------------
if (-not (Test-Path ".env.local")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env.local"

    # Generate a strong AUTH_SECRET and write it in.
    $bytes = New-Object 'System.Byte[]' 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    (Get-Content ".env.local") `
      -replace '^AUTH_SECRET=.*', "AUTH_SECRET=`"$secret`"" `
      -replace '^ADMIN_PASSWORD=.*', 'ADMIN_PASSWORD="change-me-please"' |
      Set-Content ".env.local"

    Ok "Created .env.local with a fresh AUTH_SECRET (edit ADMIN_* before using the admin console)."
  } else {
    Warn ".env.example not found; skipping env setup."
  }
} else {
  Info ".env.local already exists; leaving it untouched."
}

# 5. Done --------------------------------------------------------------------
Write-Host ""
Ok "Setup complete."
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    npm run dev      # start on http://localhost:3000" -ForegroundColor Gray
Write-Host "    npm run build    # production build (ingests data first)" -ForegroundColor Gray
Write-Host "    npm run test     # unit tests" -ForegroundColor Gray
Write-Host ""
