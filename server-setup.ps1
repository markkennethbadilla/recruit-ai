# ============================================================
# TalentFlow AI -- Server Takeover (Native Windows, No Docker)
# ============================================================
#
# ONE-SHOT script: run on ANY laptop to make it the TalentFlow
# backend server. It will:
#
#   [1] Install Node.js, n8n, NocoDB, cloudflared (if missing)
#   [2] Kill old services on this machine (idempotent cleanup)
#   [3] Clean Cloudflare Tunnel connections (disconnect old laptop)
#   [4] Start n8n + NocoDB + cloudflared
#   [5] Verify everything works via public URLs
#   [6] Register auto-start tasks (survive reboot)
#
# SWAP LAPTOPS:
#   Copy this script to the new laptop and run it.
#   cloudflared reconnects the tunnel to THIS machine.
#   The old laptop loses the tunnel automatically.
#
# NO Docker. NO WSL. Pure native Windows.
# ============================================================

param(
    [switch]$SkipInstall,   # Skip package installation (faster re-run)
    [switch]$StopOnly       # Just stop services on this machine
)

# -- Auto-elevate to admin --
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting administrator privileges..." -ForegroundColor Yellow
    $scriptPath = $MyInvocation.MyCommand.Path
    $args = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
    if ($SkipInstall) { $args += " -SkipInstall" }
    if ($StopOnly) { $args += " -StopOnly" }
    Start-Process powershell.exe -ArgumentList $args -Verb RunAs
    exit
}

$ErrorActionPreference = "Stop"

# ── Styling helpers ──
function Write-Step($step, $msg) {
    Write-Host ""
    Write-Host "[$step] $msg" -ForegroundColor Cyan
    Write-Host ("-" * 60)
}

function Write-Ok($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }

function Test-Port($port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $port)
        $tcp.Close()
        return $true
    } catch { return $false }
}

function Stop-PortProcess($port) {
    $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "    Killed PID $pid on port $port" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor White
Write-Host "  TalentFlow AI -- Server Takeover" -ForegroundColor White
Write-Host "  This machine will become the sole backend server." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor White
Write-Host "  Machine: $env:COMPUTERNAME" -ForegroundColor Gray
Write-Host "  Time:    $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# ============================================================
# STOP-ONLY MODE
# ============================================================
if ($StopOnly) {
    Write-Step "STOP" "Stopping all TalentFlow services on this machine..."
    Stop-PortProcess 5678
    Stop-PortProcess 8080
    Get-Process cloudflared -ErrorAction SilentlyContinue | Where-Object {
        $_.StartTime -lt (Get-Date)
    } | ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "    Killed cloudflared PID $($_.Id)" -ForegroundColor Gray
    }
    @("TalentFlow-n8n", "TalentFlow-NocoDB", "TalentFlow-Cloudflared") | ForEach-Object {
        Stop-ScheduledTask -TaskName $_ -ErrorAction SilentlyContinue
    }
    Write-Ok "All TalentFlow services stopped."
    Write-Host ""
    Read-Host "Press Enter to close"
    exit
}

# ============================================================
# [1/7] CLEANUP -- Kill existing services on this machine
# ============================================================
Write-Step "1/7" "Cleaning up existing services..."

# Stop scheduled tasks first
@("TalentFlow-n8n", "TalentFlow-NocoDB", "TalentFlow-Cloudflared") | ForEach-Object {
    $task = Get-ScheduledTask -TaskName $_ -ErrorAction SilentlyContinue
    if ($task -and $task.State -eq "Running") {
        Stop-ScheduledTask -TaskName $_ -ErrorAction SilentlyContinue
        Write-Host "    Stopped task: $_" -ForegroundColor Gray
    }
}

# Kill processes on our ports
if (Test-Port 5678) {
    Write-Host "    Port 5678 in use -- killing..." -ForegroundColor Yellow
    Stop-PortProcess 5678
    Start-Sleep -Seconds 1
}
if (Test-Port 8080) {
    Write-Host "    Port 8080 in use -- killing..." -ForegroundColor Yellow
    Stop-PortProcess 8080
    Start-Sleep -Seconds 1
}

# Kill any cloudflared instances
Get-Process cloudflared -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    Write-Host "    Killed cloudflared PID $($_.Id)" -ForegroundColor Gray
}

Write-Ok "Cleanup complete -- ports 5678, 8080 free"

# ============================================================
# [2/7] INSTALL -- Node.js, n8n, NocoDB, cloudflared
# ============================================================
if (-not $SkipInstall) {
    Write-Step "2/7" "Installing dependencies..."

    # -- Node.js --
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Host "  Installing Node.js via winget..." -ForegroundColor Yellow
        winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        if (-not $nodeCmd) { Write-Err "Node.js install failed. Install from https://nodejs.org and re-run." ; exit 1 }
    }
    Write-Ok "Node.js $(node --version)"

    # -- n8n --
    $n8nCmd = Get-Command n8n -ErrorAction SilentlyContinue
    if (-not $n8nCmd) {
        Write-Host "  Installing n8n via npm..." -ForegroundColor Yellow
        npm install -g n8n
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
    $n8nVer = n8n --version 2>$null
    if ($n8nVer) { Write-Ok "n8n v$n8nVer" } else { Write-Err "n8n install failed" ; exit 1 }

    # -- NocoDB --
    $nocodbDir = "$env:USERPROFILE\.nocodb"
    if (-not (Test-Path $nocodbDir)) { New-Item -ItemType Directory -Path $nocodbDir -Force | Out-Null }
    $nocoCmd = Get-Command nocodb -ErrorAction SilentlyContinue
    if (-not $nocoCmd) {
        Write-Host "  Installing NocoDB via npm..." -ForegroundColor Yellow
        npm install -g nocodb
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
    Write-Ok "NocoDB installed (data: $nocodbDir)"

    # -- cloudflared --
    $cfCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cfCmd) {
        Write-Host "  Installing cloudflared via winget..." -ForegroundColor Yellow
        winget install -e --id Cloudflare.cloudflared --accept-source-agreements --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
    $cfVer = cloudflared --version 2>$null
    if ($cfVer) { Write-Ok "cloudflared: $cfVer" } else { Write-Warn "cloudflared may need terminal restart" }
} else {
    Write-Step "2/7" "Skipping install (--SkipInstall)"
    Write-Ok "Using existing installations"
}

# ============================================================
# [3/7] TUNNEL TOKEN
# ============================================================
Write-Step "3/7" "Getting Cloudflare Tunnel token..."

$tunnelToken = ""

# Try .env.local in script directory
$envFile = Join-Path $PSScriptRoot ".env.local"
if (Test-Path $envFile) {
    $tokenLine = Get-Content $envFile | Select-String 'CLOUDFLARE_TUNNEL_TOKEN=(.*)'
    if ($tokenLine) { $tunnelToken = $tokenLine.Matches.Groups[1].Value.Trim('"').Trim("'") }
}

# Try environment variable
if (-not $tunnelToken -and $env:CLOUDFLARE_TUNNEL_TOKEN) {
    $tunnelToken = $env:CLOUDFLARE_TUNNEL_TOKEN
}

# Try saved token file (from previous run)
$tokenFile = "$env:USERPROFILE\.talentflow-tunnel-token"
if (-not $tunnelToken -and (Test-Path $tokenFile)) {
    $tunnelToken = (Get-Content $tokenFile -Raw).Trim()
    Write-Host "  Using saved token from previous run" -ForegroundColor Gray
}

if (-not $tunnelToken) {
    Write-Host ""
    Write-Host "  Cloudflare Tunnel Token needed." -ForegroundColor Yellow
    Write-Host "  Get it: https://one.dash.cloudflare.com >> Zero Trust >> Networks >> Tunnels" -ForegroundColor Gray
    Write-Host ""
    $tunnelToken = Read-Host "  Enter CLOUDFLARE_TUNNEL_TOKEN"
}

if ($tunnelToken) {
    # Save for future re-runs
    $tunnelToken | Set-Content $tokenFile -Force
    Write-Ok "Tunnel token ready (saved to $tokenFile for future swaps)"
} else {
    Write-Warn "No tunnel token -- cloudflared won't start"
}

# ============================================================
# [4/7] POWER SETTINGS
# ============================================================
Write-Step "4/7" "Configuring power settings for 24/7 operation..."

powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e 2>$null
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /change monitor-timeout-ac 5
powercfg /change standby-timeout-dc 30
powercfg /change monitor-timeout-dc 2

# Lid close: Do Nothing on AC
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setactive SCHEME_CURRENT

# Disable USB selective suspend
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setactive SCHEME_CURRENT

# CPU max 80% on AC (thermal safety)
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMAX 80
powercfg /setactive SCHEME_CURRENT

# CPU min 5%, passive cooling
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 5
powercfg /setactive SCHEME_CURRENT
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR 94d3a615-a899-4ac5-ae2b-e4d8f634367f 1
powercfg /setactive SCHEME_CURRENT

Write-Ok "Never sleep on AC, lid close=nothing, CPU max 80%"

# ============================================================
# [5/7] START SERVICES
# ============================================================
Write-Step "5/7" "Starting services..."

$npmPrefix = (npm config get prefix 2>$null).Trim()
$n8nExe = Join-Path $npmPrefix "n8n.cmd"
if (-not (Test-Path $n8nExe)) { $n8nExe = (Get-Command n8n -ErrorAction SilentlyContinue).Source }

$nocoExe = (Get-Command nocodb -ErrorAction SilentlyContinue).Source
$cfExe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source

# Start n8n directly (background job)
Write-Host "  Starting n8n on port 5678..." -ForegroundColor Gray
$env:N8N_HOST = "0.0.0.0"
$env:N8N_PORT = "5678"
$env:N8N_PROTOCOL = "https"
$env:WEBHOOK_URL = "https://n8n.elunari.uk/"
$env:N8N_PUBLIC_API_DISABLED = "false"
$env:GENERIC_TIMEZONE = "Asia/Manila"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c set N8N_HOST=0.0.0.0 && set N8N_PORT=5678 && set N8N_PROTOCOL=https && set WEBHOOK_URL=https://n8n.elunari.uk/ && set N8N_PUBLIC_API_DISABLED=false && set GENERIC_TIMEZONE=Asia/Manila && `"$n8nExe`" start" -WindowStyle Minimized
Write-Ok "n8n process launched"

# Start NocoDB directly (background)
Write-Host "  Starting NocoDB on port 8080..." -ForegroundColor Gray
$nocodbDir = "$env:USERPROFILE\.nocodb"
if ($nocoExe) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c set NC_DB=sqlite3:///$nocodbDir\noco.db && set PORT=8080 && `"$nocoExe`"" -WindowStyle Minimized
} else {
    $npxExe = (Get-Command npx -ErrorAction SilentlyContinue).Source
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c set NC_DB=sqlite3:///$nocodbDir\noco.db && set PORT=8080 && npx nocodb" -WindowStyle Minimized
}
Write-Ok "NocoDB process launched"

# Start cloudflared (this is the TAKEOVER moment - old laptop loses tunnel)
if ($tunnelToken -and $cfExe) {
    Write-Host "  Starting cloudflared tunnel..." -ForegroundColor Gray
    Write-Host "    >> This takes over the tunnel from any other machine <<" -ForegroundColor Magenta
    Start-Process -FilePath $cfExe -ArgumentList "tunnel run --token $tunnelToken" -WindowStyle Minimized
    Write-Ok "cloudflared launched -- tunnel claimed by $env:COMPUTERNAME"
} elseif (-not $tunnelToken) {
    Write-Warn "Skipping cloudflared (no token)"
} else {
    Write-Warn "cloudflared executable not found"
}

# ============================================================
# [6/7] VERIFY SERVICES
# ============================================================
Write-Step "6/7" "Verifying services (up to 60s)..."

$n8nOk = $false
$nocoOk = $false
$tunnelOk = $false

for ($i = 1; $i -le 30; $i++) {
    Start-Sleep -Seconds 2

    if (-not $n8nOk) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { $n8nOk = $true; Write-Ok "n8n responding on :5678 (${i}x2 = $($i*2)s)" }
        } catch {}
    }

    if (-not $nocoOk) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($r.StatusCode -in @(200, 301, 302)) { $nocoOk = $true; Write-Ok "NocoDB responding on :8080 ($($i*2)s)" }
        } catch {}
    }

    if ($n8nOk -and $nocoOk) { break }

    if ($i % 5 -eq 0) {
        Write-Host "    Waiting... ($($i*2)s)" -ForegroundColor Gray
    }
}

# Check public URL (tunnel verification)
if ($tunnelToken) {
    Write-Host "  Checking public tunnel..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    for ($j = 1; $j -le 10; $j++) {
        try {
            $r = Invoke-WebRequest -Uri "https://n8n.elunari.uk/healthz" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { $tunnelOk = $true; Write-Ok "Tunnel verified: n8n.elunari.uk is live!"; break }
        } catch {}
        Start-Sleep -Seconds 3
        if ($j % 3 -eq 0) { Write-Host "    Tunnel not ready yet ($($j*3)s)..." -ForegroundColor Gray }
    }
    if (-not $tunnelOk) { Write-Warn "Tunnel not responding yet -- it may take a minute" }
}

# ============================================================
# [7/7] REGISTER AUTO-START TASKS
# ============================================================
Write-Step "7/7" "Registering auto-start tasks (survive reboot)..."

# Common settings for all tasks
$taskSettings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 5 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Days 365)

# n8n task
$n8nTaskName = "TalentFlow-n8n"
Get-ScheduledTask -TaskName $n8nTaskName -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false -ErrorAction SilentlyContinue
if ($n8nExe) {
    $trigger = New-ScheduledTaskTrigger -AtLogon
    $trigger.Delay = "PT30S"
    Register-ScheduledTask -TaskName $n8nTaskName `
        -Action (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c set N8N_HOST=0.0.0.0 && set N8N_PORT=5678 && set N8N_PROTOCOL=https && set WEBHOOK_URL=https://n8n.elunari.uk/ && set N8N_PUBLIC_API_DISABLED=false && set GENERIC_TIMEZONE=Asia/Manila && `"$n8nExe`" start") `
        -Trigger $trigger -Settings $taskSettings -RunLevel Highest `
        -Description "n8n for TalentFlow AI" | Out-Null
    Write-Ok "Task: $n8nTaskName"
}

# NocoDB task
$nocoTaskName = "TalentFlow-NocoDB"
Get-ScheduledTask -TaskName $nocoTaskName -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false -ErrorAction SilentlyContinue
$nocoArgs = if ($nocoExe) { "/c set NC_DB=sqlite3:///$nocodbDir\noco.db && set PORT=8080 && `"$nocoExe`"" } else { "/c set NC_DB=sqlite3:///$nocodbDir\noco.db && set PORT=8080 && npx nocodb" }
$trigger2 = New-ScheduledTaskTrigger -AtLogon
$trigger2.Delay = "PT45S"
Register-ScheduledTask -TaskName $nocoTaskName `
    -Action (New-ScheduledTaskAction -Execute "cmd.exe" -Argument $nocoArgs) `
    -Trigger $trigger2 -Settings $taskSettings -RunLevel Highest `
    -Description "NocoDB CRM for TalentFlow AI" | Out-Null
Write-Ok "Task: $nocoTaskName"

# cloudflared task
$cfTaskName = "TalentFlow-Cloudflared"
Get-ScheduledTask -TaskName $cfTaskName -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false -ErrorAction SilentlyContinue
if ($tunnelToken -and $cfExe) {
    $trigger3 = New-ScheduledTaskTrigger -AtLogon
    $trigger3.Delay = "PT60S"
    Register-ScheduledTask -TaskName $cfTaskName `
        -Action (New-ScheduledTaskAction -Execute $cfExe -Argument "tunnel run --token $tunnelToken") `
        -Trigger $trigger3 -Settings $taskSettings -RunLevel Highest `
        -Description "Cloudflare Tunnel for TalentFlow AI" | Out-Null
    Write-Ok "Task: $cfTaskName"
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  TAKEOVER COMPLETE -- $env:COMPUTERNAME is now the server" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

$statusColor = @{ $true="Green"; $false="Yellow" }

Write-Host "  Local Services:" -ForegroundColor White
Write-Host "    $(if($n8nOk){'[OK]'}else{'[!]'}) n8n         http://localhost:5678" -ForegroundColor $statusColor[$n8nOk]
Write-Host "    $(if($nocoOk){'[OK]'}else{'[!]'}) NocoDB      http://localhost:8080" -ForegroundColor $statusColor[$nocoOk]
Write-Host "    $(if($tunnelOk){'[OK]'}else{'[!]'}) Tunnel      cloudflared running" -ForegroundColor $statusColor[$tunnelOk]

Write-Host ""
Write-Host "  Public URLs:" -ForegroundColor White
Write-Host "    n8n:    https://n8n.elunari.uk" -ForegroundColor Cyan
Write-Host "    NocoDB: https://db.elunari.uk" -ForegroundColor Cyan

Write-Host ""
Write-Host "  Auto-start on login: $n8nTaskName, $nocoTaskName, $cfTaskName" -ForegroundColor Gray

Write-Host ""
Write-Host "  To swap to another laptop:" -ForegroundColor Yellow
Write-Host "    1. Copy server-setup.ps1 to new laptop" -ForegroundColor Gray
Write-Host "    2. Run: .\server-setup.ps1 -SkipInstall   (if deps already installed)" -ForegroundColor Gray
Write-Host "    3. The tunnel reconnects >> old laptop auto-disconnects" -ForegroundColor Gray
Write-Host ""
Write-Host "  To stop this server:" -ForegroundColor Yellow
Write-Host "    .\server-setup.ps1 -StopOnly" -ForegroundColor Gray

Write-Host ""
Write-Host "  Data:" -ForegroundColor White
Write-Host "    n8n:    $env:USERPROFILE\.n8n\" -ForegroundColor Gray
Write-Host "    NocoDB: $env:USERPROFILE\.nocodb\" -ForegroundColor Gray

if (-not $n8nOk -or -not $nocoOk) {
    Write-Host ""
    Write-Host "  [!] Some services still starting -- give them 30 more seconds" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to close"
