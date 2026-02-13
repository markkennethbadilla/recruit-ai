# TalentFlow AI - Local Development Startup Script
# Starts Docker, n8n, and the Next.js dev server

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "=== TalentFlow AI - Local Startup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Ensure Docker is running
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Starting Docker Desktop..." -ForegroundColor Gray
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    $attempts = 0
    do {
        Start-Sleep -Seconds 3
        $attempts++
        docker info 2>&1 | Out-Null
        Write-Host "  Waiting for Docker... ($attempts)" -ForegroundColor Gray
    } while ($LASTEXITCODE -ne 0 -and $attempts -lt 30)
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] Docker did not start in time." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  [OK] Docker is running" -ForegroundColor Green

# Step 2: Start n8n container
Write-Host "[2/4] Starting n8n..." -ForegroundColor Yellow
$n8nRunning = docker ps --filter "name=n8n" --format "{{.Names}}" 2>&1
if ($n8nRunning -eq "n8n") {
    Write-Host "  [OK] n8n already running" -ForegroundColor Green
} else {
    docker start n8n 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Creating n8n container..." -ForegroundColor Gray
        docker run -d `
            --name n8n `
            --restart always `
            -p 5678:5678 `
            -v n8n_data:/home/node/.n8n `
            -e GENERIC_TIMEZONE="Asia/Manila" `
            -e TZ="Asia/Manila" `
            -e N8N_PUBLIC_API_DISABLED=false `
            n8nio/n8n:latest 2>&1 | Out-Null
    }
    Start-Sleep -Seconds 3
    Write-Host "  [OK] n8n started at http://localhost:5678" -ForegroundColor Green
}

# Step 3: Verify n8n health
Write-Host "[3/4] Verifying n8n API..." -ForegroundColor Yellow
$attempts = 0
do {
    Start-Sleep -Seconds 2
    $attempts++
    try {
        $apiKey = (Get-Content "$PSScriptRoot\.env.local" | Select-String 'N8N_API_KEY="(.+)"').Matches.Groups[1].Value
        $response = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" -Headers @{ "X-N8N-API-KEY" = $apiKey } -TimeoutSec 5
        break
    } catch {
        Write-Host "  Waiting for n8n API... ($attempts)" -ForegroundColor Gray
    }
} while ($attempts -lt 15)

if ($attempts -ge 15) {
    Write-Host "  [!] n8n API not responding - workflows may need re-provisioning" -ForegroundColor Yellow
    Write-Host "  Run: node n8n/provision.mjs" -ForegroundColor Yellow
} else {
    $activeCount = ($response.data | Where-Object { $_.active }).Count
    Write-Host "  [OK] n8n API connected - $activeCount active workflows" -ForegroundColor Green
}

# Step 4: Start Next.js
Write-Host "[4/4] Starting Next.js dev server..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "  [OK] Port 3003 already in use - dev server may be running" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== TalentFlow AI Ready ===" -ForegroundColor Green
    Write-Host "  App:  http://localhost:3003" -ForegroundColor Cyan
    Write-Host "  n8n:  http://localhost:5678" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=== TalentFlow AI Ready ===" -ForegroundColor Green
    Write-Host "  n8n:  http://localhost:5678" -ForegroundColor Cyan
    Write-Host "  App:  http://localhost:3003 (starting...)" -ForegroundColor Cyan
    Write-Host ""
    Set-Location $PSScriptRoot
    npx next dev --port 3003
}
