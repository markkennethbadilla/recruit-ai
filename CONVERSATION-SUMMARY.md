# TalentFlow AI — Conversation Summary

> Created: 2025-01-07
> Purpose: Context for the next agent session. Read this before doing anything.

---

## What Happened This Session

### Phase 1: AirTable → NocoDB Migration (COMPLETED)
- Migrated all 13+ files from AirTable cloud API to NocoDB self-hosted API
- Created `lib/nocodb.ts` as the new CRM client (replaces `lib/airtable.ts` which was deleted)
- Updated all API routes to use NocoDB instead of AirTable
- Created `SPECS.md` as the single source of truth for architecture
- Fixed responsive architecture graph, offline cards, and other UI issues

### Phase 2: PR #1 Merged to Master (COMPLETED)
- Created PR #1 with all migration changes
- Merged to master branch (commit `fb94e1b`)
- Vercel auto-deployed to production at `talentflow-ai.elunari.uk`
- Production verified working

### Phase 3: Git Guard Master Protection Removed (COMPLETED)
- Removed master branch push protection from 4 layers:
  1. `Powershell-Config.ps1` — SECTION 10 git push guard
  2. `git.cmd` — batch file wrapper
  3. `GitGuard.cs` / compiled `git.exe` — C# guard binary
  4. Bash `git` script — shell-level guard
- Master branch is now pushable directly (no more blocking)

### Phase 4: Local Self-Hosting Test (FAILED — ABANDONED)
- **Goal**: Test `server-setup.ps1` on this machine before deploying to spare laptop
- **n8n**: Installed v2.7.5 via npm/bun. Started on port 5678 — **WORKS PERFECTLY** (HTTP 200)
- **cloudflared**: Installed v2025.8.1 via winget — **WORKS**
- **NocoDB**: **TOTAL FAILURE** after 1+ hour of debugging:
  - `npm install -g nocodb` installs Node middleware with NO executable binary (no `bin` field in package.json)
  - `npx nocodb` → "could not determine executable to run"
  - Downloaded standalone binary (378 MB) — crashed with `ERR_MODULE_NOT_FOUND: ipaddr.js` (Node v24.13.0 incompatibility)
  - Express wrapper approach: NocoDB Nest app initialized but bound to random ports (56518, 55539) ignoring PORT env var
  - Multiple approaches attempted, all failed
- **Decision**: **SELF-HOSTING IS ABANDONED. Moving to cheap cloud VPS.**

### Phase 5: Agent Guidelines Update (COMPLETED)
- Updated `E:\AGENTS.md` with new philosophy:
  - Zero tinkering policy: 5-minute rule — if it doesn't work in 5 min, wrong approach
  - Managed/hosted services over self-hosted
  - Convenience first, cost-effective (ideally free) path
  - User has limited time and money
- Added "hosting & infrastructure" section
- Synced to all 4 child AGENTS.md files via `sync-agents.ps1`

---

## Current State of the Codebase

### What's Deployed and Working
- **Frontend**: Next.js 16.1.6 + React 19 + Tailwind 4 on Vercel
- **Production URL**: `https://talentflow-ai.elunari.uk`
- **Git**: GitHub `markkennethbadilla/talentflow-ai.git`, master branch, commit `fb94e1b`
- **All frontend features work**: candidate parsing, scoring, pipeline, automations page, architecture graph

### What's NOT Working (Backend Services)
- **n8n**: Not running anywhere. Code references `https://n8n.elunari.uk` but nothing is serving it.
- **NocoDB**: Not running anywhere. Code references `https://db.elunari.uk` but nothing is serving it.
- **Cloudflare Tunnel**: Not connected. No tunnel token configured.
- **Result**: The app works as a frontend demo but automations/CRM features return errors when called.

### Key Files in recruit-ai/
| File | Status | Purpose |
|------|--------|---------|
| `lib/nocodb.ts` | KEEP | NocoDB API client — used by frontend API routes |
| `lib/n8n.ts` | KEEP | n8n webhook client |
| `n8n/provision.mjs` | KEEP | Creates 5 n8n workflows via API |
| `app/api/airtable/route.ts` | KEEP | CRM API route (now backed by NocoDB) |
| `SPECS.md` | NEEDS UPDATE | References "spare laptop" self-hosting — needs to reflect VPS |
| `server-setup.ps1` | DELETED | Was for native Windows self-hosting — doesn't work |
| `laptop-setup.ps1` | DELETED | Legacy Docker-based setup on laptop |
| `oracle-setup.sh` | DELETED | Was for Oracle Cloud — user rejected it |
| `start-local.ps1` | DELETED | Was for local Docker startup |
| `docker-compose.yml` | DELETED | Docker compose for self-hosting |
| `Dockerfile` | DELETED | Docker image for self-hosting |
| `.dockerignore` | DELETED | Docker ignore file |
| `DEPLOYMENT.md` | DELETED | Deployment guide for self-hosting |

### Environment Variables (.env.local)
```
OPENROUTER_API_KEY=sk-or-v1-...        # SET
N8N_URL=https://n8n.elunari.uk          # SET (but nothing serving it yet)
NOCODB_URL=https://db.elunari.uk        # SET (but nothing serving it yet)
N8N_API_KEY=                            # EMPTY — needs to be set after n8n is running
NOCODB_API_TOKEN=                       # EMPTY — needs to be set after NocoDB is running
ELEVENLABS_API_KEY=sk_...              # SET
CLOUDFLARE_TUNNEL_TOKEN=              # MISSING — needs Cloudflare Zero Trust tunnel
```

---

## Installed on This Machine (E:\ drive, main workstation)

| Tool | Version | Status |
|------|---------|--------|
| Node.js | v24.13.0 | Working (npm aliased to bun) |
| Bun | latest | Working, used as npm replacement |
| n8n | v2.7.5 | Installed globally via bun (`C:\Users\Mark\.bun\bin\n8n`). Not running. |
| NocoDB npm | v0.301.2 | Installed globally but USELESS (no executable) |
| NocoDB binary | v0.301.2 | Downloaded to `C:\Users\Mark\.nocodb\nocodb.exe` (378MB). Crashes with Node v24. |
| cloudflared | v2025.8.1 | Installed via winget. Working but no tunnel configured. |

---

## Next Steps for New Session

### CRITICAL DECISION: Hosting Backend ($5/month budget)

The user rejected:
- **Local self-hosting** — too complex, NocoDB doesn't work natively on Windows
- **Oracle Cloud Free Tier** — too hard to get a VM (have to fight for availability like Hunger Games)
- **Docker on T480** — 8GB RAM too weak, doesn't want Linux as daily driver

The user is willing to pay **$5/month** for a reliable VPS.

**Best options at ~$5/month:**
| Provider | Plan | vCPU | RAM | Storage | Price | Notes |
|----------|------|------|-----|---------|-------|-------|
| **Hetzner** | CX22 | 2 AMD | 4GB | 40GB SSD | €3.79/mo (~$4.15) | Best value, EU/US DCs, instant setup |
| **Contabo** | VPS S | 4 | 8GB | 50GB SSD | €4.99/mo (~$5.50) | Incredible spec, slower support |
| **DigitalOcean** | Basic | 1 | 1GB | 25GB SSD | $6/mo | Simple UI, good docs |
| **Vultr** | Cloud Compute | 1 | 1GB | 25GB SSD | $5/mo | Singapore DC available |
| **Linode** | Nanode | 1 | 1GB | 25GB | $5/mo | Akamai-backed, reliable |

**Recommendation**: Hetzner CX22 (€3.79/mo) — best specs for price. Docker runs perfectly on 4GB RAM with n8n + NocoDB + cloudflared.

### What the New Session Should Do
1. **User picks a VPS provider** and creates an account
2. **Agent writes a VPS setup script** (bash, Docker-based) that:
   - Installs Docker + Docker Compose
   - Creates docker-compose.yml with NocoDB + n8n + cloudflared
   - Starts everything with `docker compose up -d`
   - Provisions n8n workflows
3. **User creates Cloudflare tunnel** in Zero Trust dashboard → gets tunnel token
4. **User SSHs into VPS** and runs the setup script
5. **Agent updates `.env.local`** with API keys from running services
6. **Agent verifies** all endpoints work (`n8n.elunari.uk`, `db.elunari.uk`)

### Domain Setup (Already Done)
- `elunari.uk` managed via Cloudflare DNS (free)
- `talentflow-ai.elunari.uk` → Vercel (CNAME, working)
- `n8n.elunari.uk` → will point to VPS via Cloudflare Tunnel
- `db.elunari.uk` → will point to VPS via Cloudflare Tunnel

---

## User Constraints (Read These!)

1. **Budget**: ~$5/month max for hosting. Frontend stays on Vercel free tier.
2. **Time**: Very limited — wants one-shot working solutions, no tinkering.
3. **Expertise**: Not a DevOps person. Scripts should be copy-paste.
4. **T480 spare laptop**: Stays on Windows as a backup machine. NOT for hosting.
5. **Main machine**: Windows daily driver, 8GB RAM. Used for development only.
6. **Docker**: Fine on a VPS (Linux). NOT wanted on the laptops.
7. **Tinkering tolerance**: ZERO. If it doesn't work in 5 minutes, find another approach.

---

## Files Changed This Session (for git reference)

### In recruit-ai/
- `lib/nocodb.ts` — NEW (NocoDB client)
- `lib/airtable.ts` — DELETED (replaced by nocodb.ts)
- `app/api/airtable/route.ts` — MODIFIED (uses NocoDB now)
- `SPECS.md` — NEW (architecture spec)
- `components/ArchitectureFlow.tsx` — MODIFIED (responsive graph)
- Multiple other component files modified for NocoDB migration
- `server-setup.ps1` — DELETED (self-hosting abandoned)
- `laptop-setup.ps1` — DELETED (self-hosting abandoned)
- `oracle-setup.sh` — DELETED (Oracle Cloud rejected)
- `start-local.ps1` — DELETED (self-hosting abandoned)
- `docker-compose.yml` — DELETED (self-hosting abandoned)
- `Dockerfile` — DELETED (self-hosting abandoned)
- `.dockerignore` — DELETED (self-hosting abandoned)
- `DEPLOYMENT.md` — DELETED (self-hosting abandoned)

### In root E:\
- `AGENTS.md` — UPDATED (zero-tinkering philosophy, hosting guidelines)
- Synced to 4 children via `sync-agents.ps1`

---

## Git Status

- **Branch**: master
- **Last commit**: `fb94e1b` (PR #1 merge — AirTable→NocoDB migration)
- **Uncommitted changes**: The self-hosting file deletions + SPECS.md update need to be committed
- **Remote**: `origin` → `github.com/markkennethbadilla/talentflow-ai.git`
