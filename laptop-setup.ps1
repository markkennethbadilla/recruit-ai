# ============================================================
# TalentFlow AI -- Windows Laptop One-Shot Setup
# ============================================================
#
# Run on your spare Windows laptop (i5-8th-gen, 8GB RAM):
#
#   Right-click PowerShell -> Run as Administrator
#   cd E:\recruit-ai
#   .\laptop-setup.ps1
#
# OR just double-click -- it will auto-elevate to admin.
#
# Prerequisites:
#   - Windows 10/11 with Docker Desktop installed
#   - Internet connection
#
# What this script does:
#   [1] Auto-elevates to admin if needed
#   [2] Verifies Docker Desktop is running (starts it if not)
#   [3] Configures Docker resource limits (low-footprint for 8GB RAM)
#   [4] Creates .env.local with pre-filled Cloudflare token
#   [5] Applies Windows power settings for 24/7 operation
#   [6] Builds and starts all services
#   [7] Configures auto-start on boot
#   [8] Prints status + URLs
#
# Domain mapping (pre-configured in Cloudflare):
#   app.elunari.uk  ->  http://talentflow:3000
#   n8n.elunari.uk  ->  http://n8n:5678
#
# ============================================================

# ── Auto-elevate to admin ──
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting administrator privileges..." -ForegroundColor Yellow
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs
    exit
}

$ErrorActionPreference = "Stop"

function Write-Step($step, $msg) {
    Write-Host ""
    Write-Host "[$step] $msg" -ForegroundColor Cyan
    Write-Host ("-" * 50)
}

function Write-Ok($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "  [!] $msg" -ForegroundColor Yellow
}

function Write-Err($msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  TalentFlow AI -- Laptop Setup" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White

# ── [1] Verify Docker ──
Write-Step "1/8" "Checking Docker Desktop..."

$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host "  Docker not found. Attempting to install via winget..." -ForegroundColor Yellow
    $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
    if ($wingetCmd) {
        winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
        Write-Warn "Docker Desktop installed. Please restart your computer, then run this script again."
        Read-Host "Press Enter to exit"
        exit
    } else {
        Write-Err "Docker not found and winget unavailable. Install Docker Desktop manually: https://www.docker.com/products/docker-desktop/"
    }
}

# Check if Docker daemon is running, start if not
$dockerRunning = $false
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
} catch {}

if (-not $dockerRunning) {
    Write-Host "  Docker is not running. Starting Docker Desktop..." -ForegroundColor Yellow

    # Find Docker Desktop executable
    $dockerDesktopPaths = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
    )
    $dockerDesktopExe = $dockerDesktopPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($dockerDesktopExe) {
        Start-Process $dockerDesktopExe
        Write-Host "  Waiting for Docker to start (up to 120 seconds)..." -ForegroundColor Gray

        $timeout = 120
        $elapsed = 0
        while ($elapsed -lt $timeout) {
            Start-Sleep -Seconds 5
            $elapsed += 5
            try {
                docker info 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    $dockerRunning = $true
                    break
                }
            } catch {}
            Write-Host "  ... waiting ($elapsed s)" -ForegroundColor Gray
        }

        if (-not $dockerRunning) {
            Write-Err "Docker Desktop did not start within 120 seconds. Start it manually and re-run."
        }
    } else {
        Write-Err "Docker Desktop executable not found. Start Docker Desktop manually and re-run."
    }
}

Write-Ok "Docker is running"

# Check docker compose
try {
    docker compose version | Out-Null
    Write-Ok "Docker Compose available"
} catch {
    Write-Err "Docker Compose not found. Update Docker Desktop."
}

# ── [2] Configure Docker Resource Limits ──
Write-Step "2/8" "Configuring Docker resource limits (low-footprint for 8GB system)..."

$wslConfigPath = "$env:USERPROFILE\.wslconfig"
$wslConfig = @"
[wsl2]
memory=4GB
processors=2
swap=2GB
"@

if (Test-Path $wslConfigPath) {
    $existing = Get-Content $wslConfigPath -Raw
    if ($existing -match "memory=4GB") {
        Write-Ok "WSL2 already configured for 4GB limit"
    } else {
        Write-Warn "Existing .wslconfig found. Backing up and updating..."
        Copy-Item $wslConfigPath "$wslConfigPath.bak"
        Set-Content $wslConfigPath $wslConfig
        Write-Ok "WSL2 limited to 4GB RAM, 2 CPUs, 2GB swap (backup at .wslconfig.bak)"
        Write-Warn "Restart Docker Desktop for resource limits to take effect"
    }
} else {
    Set-Content $wslConfigPath $wslConfig
    Write-Ok "WSL2 limited to 4GB RAM, 2 CPUs, 2GB swap"
    Write-Warn "Restart Docker Desktop for resource limits to take effect"
}

# ── [3] Create .env.local ──
Write-Step "3/8" "Setting up environment..."

$envLocalPath = Join-Path $PSScriptRoot ".env.local"
$envExamplePath = Join-Path $PSScriptRoot ".env.example"

if (Test-Path $envLocalPath) {
    Write-Warn ".env.local already exists -- skipping (delete it to reconfigure)"
} else {
    if (-not (Test-Path $envExamplePath)) {
        Write-Err ".env.example not found -- are you in the recruit-ai directory?"
    }

    Copy-Item $envExamplePath $envLocalPath

    Write-Host ""
    Write-Host "  ──────────────────────────────────" -ForegroundColor White
    Write-Host "  Enter API keys (press Enter to skip)" -ForegroundColor White
    Write-Host "  ──────────────────────────────────" -ForegroundColor White
    Write-Host ""

    # Cloudflare token is pre-filled in .env.example
    Write-Host "  Cloudflare Tunnel Token: [pre-filled]" -ForegroundColor Green

    # OpenRouter
    $orKey = Read-Host "  OPENROUTER_API_KEY (from openrouter.ai/keys)"
    if ($orKey) {
        (Get-Content $envLocalPath) -replace "OPENROUTER_API_KEY=.*", "OPENROUTER_API_KEY=$orKey" | Set-Content $envLocalPath
    }

    # AirTable
    $atKey = Read-Host "  AIRTABLE_API_KEY (from airtable.com/create/tokens)"
    if ($atKey) {
        (Get-Content $envLocalPath) -replace "AIRTABLE_API_KEY=.*", "AIRTABLE_API_KEY=$atKey" | Set-Content $envLocalPath
    }

    # ElevenLabs
    $elKey = Read-Host "  ELEVENLABS_API_KEY (optional, for voice)"
    if ($elKey) {
        (Get-Content $envLocalPath) -replace "ELEVENLABS_API_KEY=.*", "ELEVENLABS_API_KEY=$elKey" | Set-Content $envLocalPath
    }

    Write-Ok ".env.local created"
}

# ── [4] Windows Power Settings for 24/7 Operation ──
Write-Step "4/8" "Configuring power settings for 24/7 operation..."

Write-Host "  Applying balanced power profile with always-on settings..." -ForegroundColor Gray

# Set to Balanced power plan (not High Performance -- saves heat)
powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e 2>$null

# Never sleep on AC power
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /change monitor-timeout-ac 5

# On battery: sleep after 30 min (safety)
powercfg /change standby-timeout-dc 30
powercfg /change monitor-timeout-dc 2

# Lid close action: Do Nothing when plugged in (already set per user)
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setactive SCHEME_CURRENT

# Disable USB selective suspend (prevents Docker issues)
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setactive SCHEME_CURRENT

# Set processor max to 80% on AC to reduce heat
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMAX 80
powercfg /setactive SCHEME_CURRENT

# Set processor min to 5% (allows deep idle)
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 5
powercfg /setactive SCHEME_CURRENT

# Cooling policy: passive (quieter, less heat)
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR 94d3a615-a899-4ac5-ae2b-e4d8f634367f 1
powercfg /setactive SCHEME_CURRENT

Write-Ok "Power settings applied:"
Write-Host "    - Balanced plan (not max performance -- reduces heat)" -ForegroundColor Gray
Write-Host "    - Never sleep when plugged in" -ForegroundColor Gray
Write-Host "    - Lid close: do nothing (stays awake)" -ForegroundColor Gray
Write-Host "    - CPU max 80% when charging (thermal safety)" -ForegroundColor Gray
Write-Host "    - CPU min 5% (deep idle when not busy)" -ForegroundColor Gray
Write-Host "    - Passive cooling (fan spins down faster)" -ForegroundColor Gray
Write-Host "    - Monitor off after 5 min (saves power)" -ForegroundColor Gray

# ── [5] Build & Start Services ──
Write-Step "5/8" "Building and starting Docker services..."

Set-Location $PSScriptRoot

Write-Host "  Pulling images..." -ForegroundColor Gray
docker compose pull n8n cloudflared 2>$null

Write-Host "  Building TalentFlow..." -ForegroundColor Gray
docker compose build talentflow

Write-Host "  Starting all services..." -ForegroundColor Gray
docker compose up -d

Write-Ok "All services starting"

# ── [6] Configure Docker Desktop Auto-Start ──
Write-Step "6/8" "Configuring Docker Desktop auto-start..."

# Create a scheduled task to run docker compose up -d on login
$taskName = "TalentFlowAutoStart"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Ok "Scheduled task '$taskName' already exists"
} else {
    $action = New-ScheduledTaskAction `
        -Execute "docker" `
        -Argument "compose -f `"$PSScriptRoot\docker-compose.yml`" up -d" `
        -WorkingDirectory $PSScriptRoot

    $trigger = New-ScheduledTaskTrigger -AtLogon
    $trigger.Delay = "PT90S"  # Wait 90 seconds after login for Docker Desktop to start
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1)

    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -RunLevel Highest `
        -Description "Auto-start TalentFlow AI Docker services on login" | Out-Null

    Write-Ok "Scheduled task created: services auto-start on login"
}

# ── [7] Auto-Start Services on Boot ──
Write-Step "7/8" "Configuring service auto-start..."

# Enable Docker Desktop to start on login
$dockerStartup = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Docker Desktop.lnk"
if (-not (Test-Path $dockerStartup)) {
    $dockerDesktopPaths = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
    )
    $dockerExe = $dockerDesktopPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($dockerExe) {
        $WshShell = New-Object -ComObject WScript.Shell
        $shortcut = $WshShell.CreateShortcut($dockerStartup)
        $shortcut.TargetPath = $dockerExe
        $shortcut.Save()
        Write-Ok "Docker Desktop will start on login"
    } else {
        Write-Warn "Could not find Docker Desktop exe -- enable 'Start Docker Desktop when you sign in' manually in Docker settings"
    }
} else {
    Write-Ok "Docker Desktop already set to start on login"
}

# ── [8] Status ──
Write-Step "8/8" "Checking service status..."

# Wait for containers to start
Start-Sleep -Seconds 5
docker compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  TalentFlow AI -- Setup Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Services:" -ForegroundColor White
Write-Host "    Next.js:     http://localhost:3003" -ForegroundColor Gray
Write-Host "    n8n:         http://localhost:5678" -ForegroundColor Gray
Write-Host "    cloudflared: Tunnel to Cloudflare" -ForegroundColor Gray
Write-Host ""
Write-Host "  Public URLs (once tunnel connects):" -ForegroundColor White
Write-Host "    App:  https://app.elunari.uk" -ForegroundColor Cyan
Write-Host "    n8n:  https://n8n.elunari.uk" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Thermal profile:" -ForegroundColor White
Write-Host "    CPU capped at 80%, passive cooling" -ForegroundColor Gray
Write-Host "    Docker limited to 4GB RAM, 2 CPUs" -ForegroundColor Gray
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "    1. Visit https://n8n.elunari.uk -> create admin account" -ForegroundColor Gray
Write-Host "    2. Settings -> API -> generate API key" -ForegroundColor Gray
Write-Host "    3. Add N8N_API_KEY to .env.local" -ForegroundColor Gray
Write-Host "    4. Run: docker compose restart talentflow" -ForegroundColor Gray
Write-Host "    5. Verify: https://app.elunari.uk" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to close"
