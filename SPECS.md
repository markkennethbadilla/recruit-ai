# TalentFlow AI — Project Specs

> This document is the single source of truth for project constraints, architecture, and tech stack decisions.
> Agents: read this before making any changes. Follow all rules.

---

## Core Constraints

| Rule | Detail |
|------|--------|
| **Budget** | $0/mo target. Self-hosting on spare hardware eliminates hosting costs. |
| **Backend Server** | ThinkPad T480 (spare laptop) running Ubuntu 24.04 + Docker. $0/month. |
| **Frontend hosting** | Vercel (free tier). The Next.js app deploys here. |
| **Tunnel** | Cloudflare Tunnel (free) exposes self-hosted services to the internet. |
| **Domain** | `elunari.uk` — managed via Cloudflare DNS (free). |
| **No localhost** | All service URLs in code/config must point to public `*.elunari.uk` domains, never `localhost`. |
| **Self-hosting preferred** | Self-host on spare hardware when available ($0/mo). VPS ($4-5/mo) only if no spare hardware. |

---

## Architecture

```
[Vercel]                        [ThinkPad T480 - Ubuntu 24.04 + Docker]
  Next.js app                     n8n (Docker container)
  talentflow-ai.vercel.app        NocoDB (Docker container)
       |                          PostgreSQL (Docker container)
       |                          cloudflared (Docker container)
       |                              |
       +--- HTTPS ----> n8n.elunari.uk (port 5678)
       +--- HTTPS ----> db.elunari.uk  (port 8080)
```

### Public URLs

| Service | URL | Port on T480 |
|---------|-----|--------------|
| n8n | `https://n8n.elunari.uk` | 5678 |
| NocoDB (CRM) | `https://db.elunari.uk` | 8080 |
| App (Vercel) | `https://talentflow-ai.vercel.app` | — |

---

## Tech Stack — WeAssist Mapping

| WeAssist Requires | TalentFlow Uses | Cost | Notes |
|-------------------|-----------------|------|-------|
| **n8n** | n8n Community (Docker on T480) | $0/mo | Self-hosted on spare ThinkPad T480 |
| **AirTable** | NocoDB (Docker on T480) | $0/mo | Open-source AirTable alternative, self-hosted |
| **OpenAI / Claude** | OpenRouter (free models) | $0/mo | Llama 3.3 70B, DeepSeek, Qwen, Gemma — GPT-4o-mini fallback ($0.15/1M tokens) |
| **ElevenLabs** | ElevenLabs (free tier) | $0/mo | 10,000 chars/month for voice outreach demos |
| **HubSpot / CRM** | NocoDB Candidates table | $0/mo | Same schema as AirTable was using |
| **Make.com / Zapier** | n8n workflows | $0/mo | 5 workflows: intake, outreach, sync, health, report |
| **Google Data Studio** | Built-in dashboard | $0/mo | Automations page with live metrics |
| **Slack / Teams** | n8n webhook notifications | $0/mo | Alert on health failures via webhook |
| **Docker** | Docker on T480 | $0/mo | n8n + NocoDB + PostgreSQL + cloudflared in docker-compose |
| **Python / Node.js** | Node.js (Next.js frontend) | $0/mo | Frontend on Vercel, backend services in Docker |
| **Whisper** | Not yet implemented | — | Planned: voice-to-text in pipeline |

**Total monthly cost: $0** (self-hosted on spare hardware + free tiers)

---

## Why These Tools? (Detailed Comparisons)

### n8n vs Make.com vs Zapier

| Factor | n8n (Our Choice) | Make.com | Zapier |
|--------|-------------------|----------|--------|
| **Cost** | $0 (self-hosted) | $9/mo (free: 1K ops) | $20/mo (free: 100 tasks) |
| **Self-hosting** | Yes (Docker) | No | No |
| **Workflows** | Unlimited | Limited by plan | Limited by plan |
| **Complexity** | Code nodes + visual | Visual only | Visual only |
| **API Access** | Full REST API | Limited | Limited |
| **Custom Code** | JavaScript/Python nodes | Limited Code module | Limited Code step |
| **Data Privacy** | Full control (our server) | Their servers (US/EU) | Their servers (US) |
| **Verdict** | Best for self-hosting, unlimited free workflows, full code control |

### NocoDB vs AirTable vs Supabase

| Factor | NocoDB (Our Choice) | AirTable | Supabase |
|--------|---------------------|----------|----------|
| **Cost** | $0 (self-hosted) | Free: 1K records | Free: 500MB, 50K rows |
| **Self-hosting** | Yes (Docker) | No | Yes but complex |
| **API** | REST (AirTable-compatible) | REST + GraphQL | REST + Realtime |
| **Record limits** | Unlimited | 1,000 (free) | 50,000 (free) |
| **UI** | Spreadsheet-like (AirTable clone) | Native spreadsheet | SQL-first, less visual |
| **Migration** | Drop-in AirTable replacement | N/A | Different API |
| **Verdict** | Best AirTable replacement — same API patterns, unlimited records, $0/mo |

### OpenRouter vs OpenAI Direct vs Anthropic Direct

| Factor | OpenRouter (Our Choice) | OpenAI Direct | Anthropic Direct |
|--------|------------------------|---------------|------------------|
| **Cost** | Free models available | $0.15-60/1M tokens | $3-75/1M tokens |
| **Model variety** | 100+ models | GPT-4o, o1 only | Claude only |
| **Free models** | Llama 3.3, Gemma 3, etc. | None | None |
| **Fallback** | Automatic model routing | Single provider | Single provider |
| **Verdict** | Best value — free models for most tasks, paid fallback only when needed |

### Self-Hosting (T480) vs VPS vs Cloud Managed Services

| Factor | Self-Host T480 (Our Choice) | VPS (Hetzner) | Cloud Managed |
|--------|----------------------------|---------------|---------------|
| **Cost** | $0/mo | $4-5/mo | $0-50/mo (limits) |
| **Hardware** | i5-8350U, 8GB, 256GB SSD | 2 vCPU, 4GB, 40GB | Shared |
| **Control** | Full root access | Full root access | Limited |
| **Data privacy** | 100% on-premises | Data center | Their servers |
| **Uptime** | Depends on power/internet | 99.9% SLA | 99.9%+ SLA |
| **Setup** | Docker Compose + CF Tunnel | Docker Compose + CF Tunnel | Click-to-deploy |
| **Verdict** | Best when spare hardware available — $0/mo, full control, Docker makes it enterprise-grade |

---

## Services Detail

### n8n (Workflow Orchestration)
- **Location**: ThinkPad T480 (Docker container)
- **URL**: `https://n8n.elunari.uk`
- **Setup**: `docker compose up -d` on T480 (Ubuntu 24.04)
- **Workflows**: 5 (Candidate Intake, Smart Outreach, Data Sync, Health Monitor, Pipeline Report)
- **Data**: PostgreSQL (shared Docker container), Docker volume

### NocoDB (CRM / AirTable Replacement)
- **Location**: ThinkPad T480 (Docker container)
- **URL**: `https://db.elunari.uk`
- **Setup**: `docker compose up -d` on T480
- **Why NocoDB**: Open-source AirTable alternative with REST API. Docker image works perfectly. Unlimited records free (AirTable caps at 1,000 on free tier).
- **API Auth**: Uses `xc-token` header for API tokens (NOT `xc-auth` which is for JWT session tokens)
- **Tables**: `Candidates` (Name, Email, Phone, Score, Recommendation, Skills, Job Title, Model, Processed At)
- **Data**: PostgreSQL (shared Docker container), Docker volume

### PostgreSQL
- **Location**: ThinkPad T480 (Docker container)
- **Version**: 16
- **Used by**: n8n (workflow data), NocoDB (table data)
- **Data**: Docker volume (`postgres_data`)

### Cloudflare Tunnel
- **Location**: ThinkPad T480 (Docker container)
- **Setup**: `docker compose up -d` with tunnel token
- **Routes**:
  - `n8n.elunari.uk` → `http://n8n:5678`
  - `db.elunari.uk` → `http://nocodb:8080`
  - `talentflow-ai.elunari.uk` → Vercel (DNS CNAME, not tunneled)

### Next.js App (Frontend + API)
- **Hosting**: Vercel (free tier)
- **Framework**: Next.js 16, React 19, Tailwind 4
- **API Routes**: 12 endpoints (parse, score, questions, apply, n8n/*, airtable, elevenlabs, health, models)
- **The `/api/airtable` route** → now calls NocoDB API instead of AirTable cloud

---

## Environment Variables

```env
# AI
OPENROUTER_API_KEY=sk-or-v1-...

# n8n (remote VPS)
N8N_URL=https://n8n.elunari.uk
NEXT_PUBLIC_N8N_URL=https://n8n.elunari.uk
N8N_API_KEY=...                          # Generated in n8n Settings → API

# NocoDB (replaces AirTable)
NOCODB_URL=https://db.elunari.uk
NOCODB_API_TOKEN=...                     # Generated in NocoDB Settings → API Tokens
NOCODB_TABLE_ID=...                      # Candidates table ID

# ElevenLabs
ELEVENLABS_API_KEY=sk_...

# Cloudflare
CLOUDFLARE_TUNNEL_TOKEN=...

# App
APP_URL=https://talentflow-ai.vercel.app
```

---

## File Map

| File | Purpose |
|------|---------|
| `n8n/provision.mjs` | Creates all 5 n8n workflows via API |
| `lib/nocodb.ts` | NocoDB client (replaces `lib/airtable.ts`) |
| `lib/n8n.ts` | n8n webhook client |
| `app/api/airtable/route.ts` | API route for CRM operations (now backed by NocoDB) |
| `app/automations/page.tsx` | Dashboard showing all integrations |
| `components/ArchitectureFlow.tsx` | System architecture diagram |
| `SPECS.md` | This file |

---

## Rules for Agents

1. **Keep costs at $0/month.** Self-hosted on spare hardware. Everything else must be free-tier.
2. **Backend runs on the T480 only.** All backend services (n8n, NocoDB, PostgreSQL) run in Docker on the ThinkPad T480.
3. **Never use `localhost` in config.** All URLs must be `*.elunari.uk` public endpoints.
4. **The frontend deploys to Vercel.** Don't add server-side dependencies that won't work on Vercel's serverless functions.
5. **Docker Compose for all backend services.** All containers managed via `/opt/elunari/docker-compose.yml` on T480.
6. **Read this file first** before making architecture or dependency decisions.
7. **Zero tinkering.** If something doesn't work in 5 minutes, find a simpler alternative.
8. **Auto-reconnect.** The app polls every 30s and auto-reconnects when self-hosted services come back online.
