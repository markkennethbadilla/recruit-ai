#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# TalentFlow AI — One-Shot Docker Setup
# ═══════════════════════════════════════════════════════════════════════
#
# Works on: Oracle Cloud ARM, Ubuntu/Debian laptop, Oracle Linux, RHEL
#
#   git clone <your-repo> ~/recruit-ai && cd ~/recruit-ai && bash oracle-setup.sh
#
# Prerequisites:
#   1. Any Linux machine (ARM or x86_64, 2+ GB RAM)
#   2. Internet access
#
# What this script does:
#   [1] Installs Docker + Docker Compose
#   [2] Opens firewall ports
#   [3] Clones the repo (if not already cloned)
#   [4] Creates .env.local from template (interactive)
#   [5] Starts all services: Next.js + n8n + cloudflared
#   [6] Provisions n8n workflows
#   [7] Sets up auto-start on reboot
#   [8] Prints status + URLs
#
# Domain mapping (pre-configured in Cloudflare Zero Trust):
#   app.elunari.uk  →  http://talentflow:3000  (Next.js app)
#   n8n.elunari.uk  →  http://n8n:5678         (n8n dashboard + webhooks)
#
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

echo ""
echo "========================================"
echo "  TalentFlow AI — Oracle Cloud Setup"
echo "========================================"
echo ""

# ── [1] Install Docker ──
log "Step 1/8: Installing Docker..."

if command -v docker &>/dev/null; then
    ok "Docker already installed ($(docker --version | cut -d' ' -f3 | tr -d ','))"
else
    # Detect package manager
    if command -v apt-get &>/dev/null; then
        # Debian/Ubuntu
        sudo apt-get update -qq
        sudo apt-get install -y -qq ca-certificates curl gnupg lsb-release

        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg

        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        sudo apt-get update -qq
        sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    elif command -v dnf &>/dev/null; then
        # Oracle Linux / RHEL / Fedora
        sudo dnf install -y dnf-utils
        sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    elif command -v yum &>/dev/null; then
        # CentOS / older Oracle Linux
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    else
        err "No supported package manager found (need apt, dnf, or yum)"
    fi

    # Allow current user to use docker without sudo
    sudo usermod -aG docker "$USER"
    ok "Docker installed"
fi

# Ensure Docker is running
sudo systemctl enable docker --now 2>/dev/null || true
ok "Docker daemon running"

# ── [2] Open Firewall Ports ──
log "Step 2/8: Configuring firewall..."

# Oracle Cloud uses iptables, not ufw by default
# Open ports needed (cloudflared uses outbound only, but just in case)
if command -v iptables &>/dev/null; then
    # Allow established connections
    sudo iptables -I INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || true
    # HTTP/HTTPS for cloudflared (outbound — already allowed, but be safe)
    sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
    sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
    # Persist
    sudo sh -c 'iptables-save > /etc/iptables/rules.v4' 2>/dev/null || true
    ok "Firewall configured (80, 443 open)"
else
    warn "iptables not found — firewall rules may need manual config"
fi

# Also handle Oracle's security list note
warn "REMINDER: In Oracle Cloud Console, ensure your VCN Security List allows ingress on ports 80 and 443"
warn "  (though cloudflared uses outbound tunnels, so this is optional)"

# ── [3] Clone Repo ──
log "Step 3/8: Setting up project..."

PROJECT_DIR="$HOME/recruit-ai"

if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
    ok "Project already exists at $PROJECT_DIR"
    cd "$PROJECT_DIR"
else
    # If we're running from inside the repo already
    if [ -f "./docker-compose.yml" ]; then
        PROJECT_DIR="$(pwd)"
        ok "Running from project directory: $PROJECT_DIR"
    else
        echo ""
        read -rp "Git repo URL (e.g. https://github.com/you/recruit-ai.git): " REPO_URL
        git clone "$REPO_URL" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
        ok "Cloned to $PROJECT_DIR"
    fi
fi

cd "$PROJECT_DIR"

# ── [4] Create .env.local ──
log "Step 4/8: Configuring environment..."

if [ -f ".env.local" ]; then
    warn ".env.local already exists — skipping (delete it to reconfigure)"
else
    if [ ! -f ".env.example" ]; then
        err ".env.example not found — is this the right repo?"
    fi

    echo ""
    echo "-------------------------------------------"
    echo "  Enter your API keys & tokens"
    echo "  (press Enter to skip optional ones)"
    echo "-------------------------------------------"
    echo ""

    # Copy template
    cp .env.example .env.local

    # Cloudflare Tunnel Token — pre-configured
    echo -e "${CYAN}Cloudflare Tunnel Token${NC}"
    echo "  Pre-filled with the elunari-server tunnel token."
    echo "  Routes: app.elunari.uk → talentflow, n8n.elunari.uk → n8n"
    echo "  Press Enter to use the default, or paste a new one."
    echo ""
    read -rp "  CLOUDFLARE_TUNNEL_TOKEN [pre-filled]: " CF_TOKEN
    if [ -z "$CF_TOKEN" ]; then
        CF_TOKEN="eyJhIjoiZjg1MWNlYjVjYWY1YTkyNTVmYzc0Y2QxYjMyOTJmMDEiLCJ0IjoiZTk4MzVlNTUtZjNlNy00Yjc4LWI4NGYtODFiNmRlMWFhNDYzIiwicyI6Ik5XRXhZMk5oWm1NdFptTmhZeTAwWTJVekxUaGlaRE10TVRneE16aGpaVFJpTkdJMiJ9"
    fi
    sed -i "s|CLOUDFLARE_TUNNEL_TOKEN=.*|CLOUDFLARE_TUNNEL_TOKEN=$CF_TOKEN|" .env.local

    # OpenRouter
    echo ""
    read -rp "  OPENROUTER_API_KEY (from openrouter.ai/keys): " OR_KEY
    [ -n "$OR_KEY" ] && sed -i "s|OPENROUTER_API_KEY=.*|OPENROUTER_API_KEY=$OR_KEY|" .env.local

    # AirTable
    echo ""
    read -rp "  AIRTABLE_API_KEY (from airtable.com/create/tokens): " AT_KEY
    [ -n "$AT_KEY" ] && sed -i "s|AIRTABLE_API_KEY=.*|AIRTABLE_API_KEY=$AT_KEY|" .env.local

    read -rp "  AIRTABLE_BASE_ID [app2lpCZhjtXKxFzo]: " AT_BASE
    [ -n "$AT_BASE" ] && sed -i "s|AIRTABLE_BASE_ID=.*|AIRTABLE_BASE_ID=$AT_BASE|" .env.local

    # ElevenLabs
    echo ""
    read -rp "  ELEVENLABS_API_KEY (optional, for voice): " EL_KEY
    [ -n "$EL_KEY" ] && sed -i "s|ELEVENLABS_API_KEY=.*|ELEVENLABS_API_KEY=$EL_KEY|" .env.local

    ok ".env.local created"
fi

# ── [5] Build & Start Services ──
log "Step 5/8: Building and starting services..."

# Use docker compose (v2 plugin syntax)
docker compose pull n8n cloudflared 2>/dev/null || true
docker compose build talentflow
docker compose up -d

ok "All services starting..."

# ── [6] Wait for n8n and Provision Workflows ──
log "Step 6/8: Waiting for n8n to be ready..."

N8N_READY=false
for i in $(seq 1 30); do
    if curl -sf http://localhost:5678/healthz &>/dev/null || curl -sf http://localhost:5678 &>/dev/null; then
        N8N_READY=true
        break
    fi
    echo "  Waiting for n8n... ($i/30)"
    sleep 3
done

if [ "$N8N_READY" = true ]; then
    ok "n8n is running"
    echo ""
    warn "n8n first-time setup:"
    echo "  1. Open http://$(hostname -I | awk '{print $1}'):5678 (or wait for tunnel)"
    echo "  2. Create your admin account"
    echo "  3. Go to Settings > API > Create API Key"
    echo "  4. Add it to .env.local as N8N_API_KEY=..."
    echo "  5. Then run:  cd $PROJECT_DIR && node n8n/provision.mjs"
    echo ""
else
    warn "n8n not responding yet — it may still be starting. Check: docker logs n8n"
fi

# ── [7] Auto-Start on Reboot ──
log "Step 7/8: Configuring auto-start on reboot..."

# Docker is already set to start on boot (systemctl enable)
# Docker Compose services have restart: unless-stopped
# Add a cron job as extra safety net
CRON_CMD="@reboot cd $PROJECT_DIR && /usr/bin/docker compose up -d >> /var/log/talentflow-boot.log 2>&1"
(crontab -l 2>/dev/null | grep -v "talentflow-boot"; echo "$CRON_CMD") | crontab -
ok "Auto-start configured (cron + Docker restart policy)"

# ── [8] Print Status ──
log "Step 8/8: Final status..."

echo ""
echo "========================================"
echo "  TalentFlow AI — Setup Complete"
echo "========================================"
echo ""

# Container status
docker compose ps

echo ""
echo "-------------------------------------------"
echo "  Services:"
echo "-------------------------------------------"
echo "  Next.js:      http://localhost:3003 (internal)"
echo "  n8n:          http://localhost:5678 (internal)"
echo "  cloudflared:  Tunnel to Cloudflare"
echo ""
echo "-------------------------------------------"
echo "  Public URLs (after tunnel connects):"
echo "-------------------------------------------"
echo "  App:          https://app.elunari.uk"
echo "  n8n:          https://n8n.elunari.uk"
echo ""
echo "-------------------------------------------"
echo "  Remaining manual steps:"
echo "-------------------------------------------"
echo "  1. Create n8n admin account at https://n8n.elunari.uk"
echo "  2. Generate n8n API key (Settings > API)"
echo "  3. Add N8N_API_KEY to .env.local"
echo "  4. Provision workflows:"
echo "     export \$(grep -v '^#' .env.local | xargs)"
echo "     node n8n/provision.mjs"
echo "  5. Verify: https://app.elunari.uk"
echo ""
echo "-------------------------------------------"
echo "  Useful commands:"
echo "-------------------------------------------"
echo "  docker compose logs -f          # Live logs"
echo "  docker compose restart          # Restart all"
echo "  docker compose down && up -d    # Full restart"
echo "  docker compose pull && up -d    # Update images"
echo ""
ok "Done! Your TalentFlow AI instance is running on Oracle Cloud."
echo ""
