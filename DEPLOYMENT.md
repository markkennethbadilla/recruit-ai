# TalentFlow AI — Production Deployment Guide

## Architecture Split

TalentFlow runs as a **split architecture**:

| Component | Hosting | Cost |
|-----------|---------|------|
| Next.js Frontend + API | Vercel (Free Hobby tier) | $0/mo |
| n8n Orchestration | Docker on local machine | $0 (electricity only) |
| AirTable CRM | AirTable Cloud (Free tier) | $0/mo (1,200 records) |
| ElevenLabs Voice | ElevenLabs Cloud (Free tier) | $0/mo (10K chars) |
| OpenRouter LLM | OpenRouter Cloud (Free tier) | $0/mo (free models) |

**Total cost: $0/month** (free-tier everything)

---

## Option A: Current Setup (Recommended for Demo)

**Vercel (frontend) + Local Docker laptop (n8n)**

### Pros
- Zero cost
- Fast iteration with `vercel dev`
- n8n workflows editable locally
- Full free-tier access everywhere

### Cons
- n8n only works when laptop is on
- No redundancy

### Steps

1. **Deploy frontend to Vercel:**
```powershell
cd e:\recruit-ai
npx vercel --prod
```

2. **Set environment variables on Vercel:**
```powershell
npx vercel env add OPENROUTER_API_KEY
npx vercel env add AIRTABLE_API_KEY
npx vercel env add AIRTABLE_BASE_ID
npx vercel env add AIRTABLE_TABLE_NAME
npx vercel env add ELEVENLABS_API_KEY
npx vercel env add N8N_URL       # Point to your laptop's public URL
npx vercel env add N8N_API_KEY
```

3. **Expose n8n on your other laptop:**
```powershell
# On the other laptop
docker run -d --name n8n --restart unless-stopped -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

# Expose via Cloudflare Tunnel (FREE, no port forwarding needed):
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:5678
```
This gives you a public `https://xxx.trycloudflare.com` URL — set that as N8N_URL on Vercel.

4. **For 24/7 operation on other laptop:**
```powershell
# Create a scheduled task to auto-start Docker + n8n on boot
$action = New-ScheduledTaskAction -Execute "docker" -Argument "start n8n"
$trigger = New-ScheduledTaskTrigger -AtLogon
Register-ScheduledTask -TaskName "Start n8n" -Action $action -Trigger $trigger -RunLevel Highest
```

---

## Option B: Fully Self-Hosted (Most Cost-Effective for 24/7)

**Both frontend + n8n on the same laptop**

### Pros
- Single machine, no network hops
- Fastest response times
- Complete control

### Cons
- Must keep laptop on 24/7
- Need to handle SSL termination

### Steps

1. **Dockerize the Next.js app too:**
```dockerfile
# Already provided in Dockerfile
docker build -t talentflow .
docker run -d --name talentflow -p 3003:3000 --env-file .env.local talentflow
```

2. **Run both with Docker Compose:**
```powershell
docker compose up -d
```

3. **Expose with Cloudflare Tunnel:**
```powershell
cloudflared tunnel --url http://localhost:3003
# This gives you HTTPS for free, no domain needed
```

---

## Option C: Spare Laptop Server (Recommended — 24/7 Free)

**Windows laptop running Docker Desktop with Cloudflare Tunnel**

Target specs: i5-8th-gen, 8GB RAM, Windows 10/11

### Pros
- Truly zero cost (just electricity)
- Full-featured n8n with unlimited workflows
- Cloudflare tunnel already configured for `elunari.uk`
- Auto-starts on boot
- Thermal-optimized for 24/7 operation

### One-Shot Setup

```powershell
# Prerequisites: Docker Desktop installed, sleep=never, lid close=stay awake
cd E:\recruit-ai
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\laptop-setup.ps1
```

The script handles everything:
- Verifies Docker Desktop is running
- Configures WSL2 resource limits (4GB RAM, 2 CPUs)
- Creates `.env.local` from template (tunnel token pre-filled)
- Applies thermal-safe power settings (CPU capped 80%, passive cooling)
- Builds & starts all Docker services
- Creates scheduled task for auto-start on login

### Cloudflare Tunnel (Already Configured)

Tunnel `elunari-server` is already created with both routes:

| Subdomain | Domain     | Service                    |
|-----------|------------|----------------------------|
| `app`     | elunari.uk | `http://talentflow:3000`   |
| `n8n`     | elunari.uk | `http://n8n:5678`          |

The tunnel token is pre-filled in `.env.example`. Just run `laptop-setup.ps1` and press Enter when prompted.

### Docker Resource Limits (8GB System)

| Service      | RAM Limit | CPU Limit | Reserved RAM |
|-------------|-----------|-----------|--------------|
| talentflow  | 1536 MB   | 1.0 core  | 512 MB       |
| n8n         | 1024 MB   | 1.0 core  | 256 MB       |
| cloudflared | 256 MB    | 0.25 core | 64 MB        |
| **WSL2 VM** | **4096 MB** | **2 cores** | —          |

Remaining ~4GB stays for Windows + Docker Desktop overhead.

### Thermal Configuration

The setup script applies these power settings:
- **Balanced** power plan (not high performance)
- CPU max throttle: **80%** (prevents thermal throttling loop)
- CPU min throttle: **5%** (allows deep idle)
- Cooling policy: **Passive** (quieter, less heat)
- Monitor off after 5 minutes
- USB selective suspend disabled (prevents Docker disconnects)

### After Setup

1. Visit `https://n8n.elunari.uk` → create admin account
2. Go to Settings → API → generate API key
3. Add `N8N_API_KEY=...` to `.env.local`
4. Provision workflows:
   ```powershell
   cd E:\recruit-ai
   node n8n/provision.mjs
   ```
5. Verify at `https://app.elunari.uk`

### Linux VPS Alternative

For cloud hosting later, a setup script for Linux is also available:
```bash
bash oracle-setup.sh   # Works on Ubuntu, Debian, RHEL, Oracle Linux
```

---

## Recommendation

**Primary: Option C — Spare Windows laptop** with `elunari.uk` via Cloudflare Tunnel.
- 24/7 uptime, zero cost, real production environment
- One-shot `laptop-setup.ps1` handles everything (Docker + power + thermal + auto-start)
- Cloudflare tunnel `elunari-server` already configured with routes:
  - `app.elunari.uk` → `http://talentflow:3000`
  - `n8n.elunari.uk` → `http://n8n:5678`
- Tunnel token pre-filled in .env.example — just run and go
- Docker resource limits tuned for 8GB RAM i5 laptop

**Fallback: Option A** — Vercel (frontend) + local Docker laptop (n8n) for dev/demo.

---

## Environment Variables Reference

See `.env.example` for the full template. Key variables:

```env
# Cloudflare Tunnel (from Zero Trust dashboard)
CLOUDFLARE_TUNNEL_TOKEN=eyJ...

# AI
OPENROUTER_API_KEY=sk-or-v1-...

# n8n
N8N_URL=https://n8n.elunari.uk
N8N_API_KEY=...
NEXT_PUBLIC_N8N_URL=https://n8n.elunari.uk

# AirTable
AIRTABLE_API_KEY=patOMR...
AIRTABLE_BASE_ID=app2lpCZhjtXKxFzo
AIRTABLE_TABLE_NAME=Candidates

# ElevenLabs
ELEVENLABS_API_KEY=sk_443...

# App
APP_URL=https://app.elunari.uk
```

## Docker Compose (for self-hosted)

See `docker-compose.yml` in project root — includes Next.js, n8n, and cloudflared services.
