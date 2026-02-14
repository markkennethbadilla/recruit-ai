# TalentFlow AI

AI-powered candidate screening pipeline with n8n workflow orchestration. Upload a resume, paste a job description, and get instant AI analysis — then let automated workflows handle outreach, data sync, and monitoring.

**Live:** [talentflow-ai.elunari.uk](https://talentflow-ai.elunari.uk)

## Features

- **Resume Parsing** — Extracts structured data (contact, skills, experience, education) from PDF/TXT
- **6-Axis Scoring** — Evaluates candidate fit against a job description across multiple dimensions
- **Interview Questions** — Generates tailored screening questions based on gaps and strengths
- **Summary View** — Combined overview of score + questions with clickable navigation
- **Auto-Pilot** — One-click full pipeline execution with JD templates
- **History** — Local storage of past analyses with instant reload
- **PDF Export** — Download complete analysis reports
- **Mobile-First** — Responsive design with descriptive step icons
- **n8n Automations Dashboard** — Live workflow status, test buttons, architecture diagram

## n8n Workflow Orchestration

5 modular workflows orchestrate the post-pipeline automation:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **WF1: Candidate Intake** | Webhook (POST) | Routes candidates by score, builds Slack/email alerts |
| **WF2: Smart Outreach** | Webhook (POST) | Generates personalized emails + Kokoro voice scripts |
| **WF3: Data Sync** | Webhook (POST) | Pushes candidate data to NocoDB/CRM in flat records |
| **WF4: Health Monitor** | Cron (5 min) | Checks /api/health, evaluates AI metrics, alerts on failure |
| **WF5: Pipeline Report** | Webhook (POST) | Weekly analytics: top skills, gaps, qualification rates |

### Architecture

```
TalentFlow (Vercel)                   ThinkPad T480 (Ubuntu + Docker)
+---------------------------+        +----------------------------+
| /pipeline                 | -----> | WF1: Candidate Intake      |
| /api/health               | <----- | WF4: Health Monitor        |
| /api/n8n/outreach         | -----> | WF2: Smart Outreach        |
| /api/n8n/sync             | -----> | WF3: Data Sync             |
| /api/n8n/report           | -----> | WF5: Pipeline Report       |
| /automations              |        | n8n @ n8n.elunari.uk       |
+---------------------------+        | NocoDB @ db.elunari.uk     |
                                     | Kokoro TTS @ tts.elunari.uk|
                                     | PostgreSQL (shared DB)     |
                                     | Cloudflare Tunnel          |
                                     +----------------------------+
```

## Tech Stack

- Next.js 16, React 19, TypeScript
- Framer Motion (animations)
- OpenRouter (LLM API — Llama 3.3 70B, Gemma 3 27B, Mistral Small 3.1)
- Tailwind CSS 4
- n8n (workflow orchestration, Docker on ThinkPad T480)
- NocoDB (self-hosted CRM, replaces AirTable, Docker on T480)
- PostgreSQL 16 (shared database for n8n + NocoDB, Docker on T480)
- Cloudflare Tunnel (routes n8n.elunari.uk / db.elunari.uk / tts.elunari.uk)
- Kokoro-82M TTS (self-hosted voice AI, replaces ElevenLabs, Docker on T480)
- Vercel (frontend hosting)
- Cloudflare (DNS)
- **Total monthly cost: $0** (self-hosted on spare hardware + free tiers)

## Getting Started

### Quick Start (Server Setup)

```bash
# On the ThinkPad T480 (Ubuntu 24.04)
# All services run in Docker at /opt/elunari/
ssh mkb@192.168.1.35
cd /opt/elunari
docker compose up -d
```

### Quick Start (Local Dev)

```powershell
# Start Next.js dev server (frontend calls remote n8n/NocoDB)
npm run dev
```

### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up the ThinkPad T480 server (n8n + NocoDB + PostgreSQL + Cloudflare Tunnel)
# SSH into the T480 and run docker compose up -d at /opt/elunari/

# 3. Provision n8n workflows
node n8n/provision.mjs

# 4. Start the dev server
npm run dev
```

### Environment Variables

```env
OPENROUTER_API_KEY=...          # Required: OpenRouter LLM API key
N8N_URL=https://n8n.elunari.uk  # n8n on server laptop
N8N_API_KEY=...                 # n8n API key (from Settings > API)
NEXT_PUBLIC_N8N_URL=https://n8n.elunari.uk
NOCODB_URL=https://db.elunari.uk  # NocoDB on server laptop
NOCODB_API_TOKEN=...              # NocoDB API token
NOCODB_TABLE_ID=...               # NocoDB table ID
KOKORO_TTS_URL=https://tts.elunari.uk  # Kokoro TTS on server laptop
```

Open [http://localhost:3003](http://localhost:3003).
