# TalentFlow AI — Project Specs

> This document is the single source of truth for project constraints, architecture, and tech stack decisions.
> Agents: read this before making any changes. Follow all rules.

---

## Core Constraints

| Rule | Detail |
|------|--------|
| **Budget** | $0/mo. Every service must be free-tier or self-hosted. Never introduce paid dependencies. |
| **Server** | Spare Windows laptop (i5-8th gen, 8GB RAM). No Docker/WSL — native Windows only. |
| **Frontend hosting** | Vercel (free tier). The Next.js app deploys here. |
| **Tunnel** | Cloudflare Tunnel (free) exposes server services to the internet. |
| **Domain** | `elunari.uk` — managed via Cloudflare DNS (free). |
| **No localhost** | All service URLs in code/config must point to public `*.elunari.uk` domains, never `localhost`. |

---

## Architecture

```
[Vercel]                        [Server Laptop]
  Next.js app                     n8n (native Node.js)
  talentflow-ai.vercel.app        NocoDB (native Node.js)
       |                          cloudflared tunnel
       |                              |
       +--- HTTPS ----> n8n.elunari.uk (port 5678)
       +--- HTTPS ----> db.elunari.uk  (port 8080)
```

### Public URLs

| Service | URL | Port on server |
|---------|-----|----------------|
| n8n | `https://n8n.elunari.uk` | 5678 |
| NocoDB (CRM) | `https://db.elunari.uk` | 8080 |
| App (Vercel) | `https://talentflow-ai.vercel.app` | — |

---

## Tech Stack — WeAssist Mapping

This project demonstrates competency in the WeAssist AI Engineer tech stack using **free alternatives only**.

| WeAssist Requires | TalentFlow Uses | Cost | Notes |
|-------------------|-----------------|------|-------|
| **n8n** | n8n Community (self-hosted) | Free | Native Windows on server laptop |
| **AirTable** | NocoDB (self-hosted) | Free | AirTable-compatible REST API, runs on Node.js |
| **OpenAI / Claude** | OpenRouter (free models) | Free | Llama 3.3 70B, DeepSeek, Qwen, Gemma — GPT-4o-mini fallback ($0.15/1M tokens) |
| **ElevenLabs** | ElevenLabs (free tier) | Free | 10,000 chars/month for voice outreach demos |
| **HubSpot / CRM** | NocoDB Candidates table | Free | Same schema as AirTable was using |
| **Make.com / Zapier** | n8n workflows | Free | 5 workflows: intake, outreach, sync, health, report |
| **Google Data Studio** | Built-in dashboard | Free | Automations page with live metrics |
| **Slack / Teams** | n8n webhook notifications | Free | Alert on health failures via webhook |
| **Docker** | Not used on server | — | User requires native Windows, no Docker/WSL overhead |
| **Python / Node.js** | Node.js (Next.js + n8n + NocoDB) | Free | Everything runs on Node.js |
| **Whisper** | Not yet implemented | — | Planned: voice-to-text in pipeline |

---

## Services Detail

### n8n (Workflow Orchestration)
- **Location**: Server laptop, native Windows
- **URL**: `https://n8n.elunari.uk`
- **Setup**: `server-setup.ps1` installs via npm, configures as Windows Service
- **Workflows**: 5 (Candidate Intake, Smart Outreach, Data Sync, Health Monitor, Pipeline Report)
- **Data**: SQLite (n8n default), stored in `%USERPROFILE%\.n8n`

### NocoDB (CRM / AirTable Replacement)
- **Location**: Server laptop, native Windows
- **URL**: `https://db.elunari.uk`
- **Setup**: `server-setup.ps1` installs via npm, configures as Windows Service
- **Why NocoDB**: Open-source AirTable alternative with REST API. Free, self-hosted, Node.js-native.
- **Tables**: `Candidates` (Name, Email, Phone, Score, Recommendation, Skills, Job Title, Model, Processed At)
- **Data**: SQLite (NocoDB default), stored in `nocodb/` directory

### Cloudflare Tunnel
- **Location**: Server laptop, native Windows
- **Setup**: `server-setup.ps1` installs `cloudflared` via winget, configures as Windows Service
- **Tunnel ID**: `e9835e55-f3e7-4b78-b84f-81b6de1aa463`
- **Routes**:
  - `n8n.elunari.uk` → `http://localhost:5678`
  - `db.elunari.uk` → `http://localhost:8080`
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

# n8n (remote server)
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
| `server-setup.ps1` | One-shot script to run on server laptop. Installs n8n + NocoDB + cloudflared natively. |
| `laptop-setup.ps1` | Legacy Docker-based setup (deprecated — use `server-setup.ps1` instead) |
| `n8n/provision.mjs` | Creates all 5 n8n workflows via API |
| `lib/nocodb.ts` | NocoDB client (replaces `lib/airtable.ts`) |
| `lib/n8n.ts` | n8n webhook client |
| `app/api/airtable/route.ts` | API route for CRM operations (now backed by NocoDB) |
| `app/automations/page.tsx` | Dashboard showing all integrations |
| `components/ArchitectureFlow.tsx` | System architecture diagram |
| `SPECS.md` | This file |

---

## Rules for Agents

1. **Never introduce paid services.** If a feature needs an external service, find a free self-hosted alternative.
2. **Never use Docker/WSL on the server laptop.** Everything must run natively on Windows.
3. **Never use `localhost` in config.** All URLs must be `*.elunari.uk` public endpoints.
4. **The frontend deploys to Vercel.** Don't add server-side dependencies that won't work on Vercel's serverless functions.
5. **Keep the server lightweight.** The laptop has 8GB RAM — services must be frugal.
6. **Read this file first** before making architecture or dependency decisions.
