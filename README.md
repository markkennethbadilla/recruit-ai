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
| **WF2: Smart Outreach** | Webhook (POST) | Generates personalized emails + ElevenLabs voice scripts |
| **WF3: Data Sync** | Webhook (POST) | Pushes candidate data to AirTable/CRM in flat records |
| **WF4: Health Monitor** | Cron (5 min) | Checks /api/health, evaluates AI metrics, alerts on failure |
| **WF5: Pipeline Report** | Webhook (POST) | Weekly analytics: top skills, gaps, qualification rates |

### Architecture

```
TalentFlow (Next.js 16)              n8n (Docker)
+---------------------------+        +----------------------------+
| /pipeline                 | -----> | WF1: Candidate Intake      |
| /api/health               | <----- | WF4: Health Monitor        |
| /api/n8n/outreach         | -----> | WF2: Smart Outreach        |
| /api/n8n/sync             | -----> | WF3: Data Sync             |
| /api/n8n/report           | -----> | WF5: Pipeline Report       |
| /automations              |        | Dashboard shows all above  |
+---------------------------+        +----------------------------+
```

## Tech Stack

- Next.js 16, React 19, TypeScript
- Framer Motion (animations)
- OpenRouter (LLM API — Llama 3.3 70B, Gemma 3 27B, Mistral Small 3.1)
- Tailwind CSS 4
- n8n (workflow orchestration, Docker)
- Vercel (hosting)
- Cloudflare (DNS)

## Getting Started

### Quick Start (Local with n8n)

```powershell
# One command starts everything: Docker, n8n, and Next.js
.\start-local.ps1
```

### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Start n8n via Docker
docker run -d --name n8n --restart always -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_PUBLIC_API_DISABLED=false \
  n8nio/n8n:latest

# 3. Provision n8n workflows
node n8n/provision.mjs

# 4. Start the dev server
npm run dev
```

### Environment Variables

```env
OPENROUTER_API_KEY=...          # Required: OpenRouter LLM API key
N8N_URL=http://localhost:5678   # n8n instance URL
N8N_API_KEY=...                 # n8n API key (from Settings > API)
NEXT_PUBLIC_N8N_URL=http://localhost:5678
```

Open [http://localhost:3003](http://localhost:3003).
