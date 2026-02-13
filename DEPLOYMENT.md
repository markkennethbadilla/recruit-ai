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

## Option C: Cloud VPS (Cheapest Production Grade)

If you need real uptime guarantees:

| Provider | Specs | Cost/mo |
|----------|-------|---------|
| **Oracle Cloud** (FREE tier) | 4 ARM cores, 24GB RAM | $0 |
| **Hetzner** | 2 vCPU, 4GB RAM | ~$4 |
| **DigitalOcean** | 1 vCPU, 1GB RAM | $6 |
| **Railway** | Usage-based | ~$5 |

### Oracle Cloud (FREE — best option)
Oracle offers **Always Free** ARM instances: 4 Ampere cores, 24GB RAM, 200GB storage.

```bash
# On Oracle Cloud VM
sudo apt update && sudo apt install -y docker.io docker-compose
git clone <your-repo>
cd recruit-ai
docker compose up -d
```

---

## Recommendation

For your interview demo: **Option A** — Vercel + Docker on other laptop with Cloudflare Tunnel.

For long-term: **Option C with Oracle Cloud FREE tier** — 24/7 uptime, zero cost, real production environment.

---

## Environment Variables Reference

```env
# AI
OPENROUTER_API_KEY=sk-or-v1-...

# n8n (update URL based on hosting)
N8N_URL=http://localhost:5678      # local
# N8N_URL=https://xxx.trycloudflare.com  # production
N8N_API_KEY=...
NEXT_PUBLIC_N8N_URL=... # same as N8N_URL

# AirTable
AIRTABLE_API_KEY=patOMR...
AIRTABLE_BASE_ID=app2lpCZhjtXKxFzo
AIRTABLE_TABLE_NAME=Candidates

# ElevenLabs
ELEVENLABS_API_KEY=sk_443...
```

## Docker Compose (for self-hosted)

See `docker-compose.yml` in project root.
