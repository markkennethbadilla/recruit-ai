# TalentFlow AI — Project Specs

> This document is the single source of truth for project constraints, architecture, and tech stack decisions.
> Agents: read this before making any changes. Follow all rules.

---

## Core Constraints

| Rule | Detail |
|------|--------|
| **Budget** | ~$5/mo max for backend VPS. Minimize cost everywhere else. |
| **Backend Server** | Cheap Linux VPS (~$4-5/mo) running Docker. Hetzner CX22 recommended. |
| **Frontend hosting** | Vercel (free tier). The Next.js app deploys here. |
| **Tunnel** | Cloudflare Tunnel (free) exposes VPS services to the internet. |
| **Domain** | `elunari.uk` — managed via Cloudflare DNS (free). |
| **No localhost** | All service URLs in code/config must point to public `*.elunari.uk` domains, never `localhost`. |
| **No local hosting** | NEVER run backend services on the user's laptops. All backend runs on the VPS. |

---

## Architecture

```
[Vercel]                        [VPS - Linux Docker]
  Next.js app                     n8n (Docker container)
  talentflow-ai.vercel.app        NocoDB (Docker container)
       |                          cloudflared (Docker container)
       |                              |
       +--- HTTPS ----> n8n.elunari.uk (port 5678)
       +--- HTTPS ----> db.elunari.uk  (port 8080)
```

### Public URLs

| Service | URL | Port on VPS |
|---------|-----|-------------|
| n8n | `https://n8n.elunari.uk` | 5678 |
| NocoDB (CRM) | `https://db.elunari.uk` | 8080 |
| App (Vercel) | `https://talentflow-ai.vercel.app` | — |

---

## Tech Stack — WeAssist Mapping

| WeAssist Requires | TalentFlow Uses | Cost | Notes |
|-------------------|-----------------|------|-------|
| **n8n** | n8n Community (Docker on VPS) | ~$5/mo VPS | Runs 24/7 on cheap Linux VPS |
| **AirTable** | NocoDB (Docker on VPS) | included | AirTable-compatible REST API |
| **OpenAI / Claude** | OpenRouter (free models) | Free | Llama 3.3 70B, DeepSeek, Qwen, Gemma — GPT-4o-mini fallback ($0.15/1M tokens) |
| **ElevenLabs** | ElevenLabs (free tier) | Free | 10,000 chars/month for voice outreach demos |
| **HubSpot / CRM** | NocoDB Candidates table | included | Same schema as AirTable was using |
| **Make.com / Zapier** | n8n workflows | included | 5 workflows: intake, outreach, sync, health, report |
| **Google Data Studio** | Built-in dashboard | Free | Automations page with live metrics |
| **Slack / Teams** | n8n webhook notifications | Free | Alert on health failures via webhook |
| **Docker** | Docker on VPS | included | n8n + NocoDB + cloudflared in docker-compose |
| **Python / Node.js** | Node.js (Next.js frontend) | Free | Frontend on Vercel, backend services in Docker |
| **Whisper** | Not yet implemented | — | Planned: voice-to-text in pipeline |

---

## Services Detail

### n8n (Workflow Orchestration)
- **Location**: VPS (Docker container)
- **URL**: `https://n8n.elunari.uk`
- **Setup**: `docker-compose up -d` on VPS
- **Workflows**: 5 (Candidate Intake, Smart Outreach, Data Sync, Health Monitor, Pipeline Report)
- **Data**: SQLite (n8n default), Docker volume

### NocoDB (CRM / AirTable Replacement)
- **Location**: VPS (Docker container)
- **URL**: `https://db.elunari.uk`
- **Setup**: `docker-compose up -d` on VPS
- **Why NocoDB**: Open-source AirTable alternative with REST API. Docker image works perfectly.
- **Tables**: `Candidates` (Name, Email, Phone, Score, Recommendation, Skills, Job Title, Model, Processed At)
- **Data**: SQLite (NocoDB default), Docker volume

### Cloudflare Tunnel
- **Location**: VPS (Docker container)
- **Setup**: `docker-compose up -d` with tunnel token
- **Routes**:
  - `n8n.elunari.uk` → `http://n8n:5678`
  - `db.elunari.uk` → `http://nocodb:8080`
  - `talentflow-ai.elunari.uk` → Vercel (DNS only, not tunneled)

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
| `CONVERSATION-SUMMARY.md` | Summary of prior session for agent context |

---

## Rules for Agents

1. **Keep costs under $5/month.** VPS is the only paid service. Everything else must be free-tier.
2. **Backend runs on the VPS only.** NEVER install or run n8n/NocoDB/backend services on the user's laptops.
3. **Never use `localhost` in config.** All URLs must be `*.elunari.uk` public endpoints.
4. **The frontend deploys to Vercel.** Don't add server-side dependencies that won't work on Vercel's serverless functions.
5. **Docker on the VPS is fine.** Use docker-compose for all backend services.
6. **Read this file first** before making architecture or dependency decisions.
7. **Zero tinkering.** If something doesn't work in 5 minutes, find a simpler alternative.
