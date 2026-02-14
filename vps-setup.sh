#!/bin/bash
# ============================================================
# VPS-SETUP.SH — One-shot VPS setup for elunari.uk
# ============================================================
# Run as root on a fresh Ubuntu 24.04 VPS.
# Sets up: Docker, NocoDB, n8n, cloudflared tunnel
#
# Usage: ssh root@YOUR_IP 'bash -s' < vps-setup.sh
# Or:    ssh into VPS, paste this script, run it
# ============================================================

set -euo pipefail

echo "============================================"
echo "  ELUNARI VPS SETUP — $(date)"
echo "============================================"

# ============================================================
# 1. SYSTEM UPDATE + DOCKER INSTALL
# ============================================================
echo ""
echo "=== [1/4] Installing Docker ==="

apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg lsb-release

# Docker official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Docker repo
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify Docker
docker --version
echo "[OK] Docker installed"

# ============================================================
# 2. CREATE APP DIRECTORY + DOCKER COMPOSE
# ============================================================
echo ""
echo "=== [2/4] Creating docker-compose ==="

mkdir -p /opt/elunari
cd /opt/elunari

# Generate secure passwords
NOCODB_PASSWORD=$(openssl rand -hex 16)
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

cat > docker-compose.yml << 'COMPOSE_EOF'
version: "3.8"

services:
  # ============================================
  # PostgreSQL — shared database for n8n + NocoDB
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: elunari-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: elunari
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U elunari"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # n8n — workflow automation
  # ============================================
  n8n:
    image: n8nio/n8n:latest
    container_name: elunari-n8n
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: elunari
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_HOST: n8n.elunari.uk
      N8N_PORT: 5678
      N8N_PROTOCOL: https
      WEBHOOK_URL: https://n8n.elunari.uk/
      N8N_EDITOR_BASE_URL: https://n8n.elunari.uk/
      GENERIC_TIMEZONE: Asia/Manila
      N8N_DIAGNOSTICS_ENABLED: "false"
      N8N_PERSONALIZATION_ENABLED: "false"
    volumes:
      - n8n_data:/home/node/.n8n
    ports:
      - "5678:5678"

  # ============================================
  # NocoDB — database/CRM UI
  # ============================================
  nocodb:
    image: nocodb/nocodb:latest
    container_name: elunari-nocodb
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NC_DB: "pg://postgres:5432?u=elunari&p=${POSTGRES_PASSWORD}&d=nocodb"
      NC_AUTH_JWT_SECRET: ${N8N_ENCRYPTION_KEY}
      NC_PUBLIC_URL: https://db.elunari.uk
      NC_DISABLE_TELE: "true"
    volumes:
      - nocodb_data:/usr/app/data
    ports:
      - "8080:8080"

  # ============================================
  # Cloudflare Tunnel — exposes services to internet
  # ============================================
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: elunari-tunnel
    restart: unless-stopped
    command: tunnel run
    environment:
      TUNNEL_TOKEN: ${TUNNEL_TOKEN}
    depends_on:
      - n8n
      - nocodb

volumes:
  postgres_data:
  n8n_data:
  nocodb_data:
COMPOSE_EOF

# Create init SQL for NocoDB database
cat > init-db.sql << 'SQL_EOF'
CREATE DATABASE nocodb;
SQL_EOF

echo "[OK] docker-compose.yml created"

# ============================================================
# 3. CREATE .env FILE
# ============================================================
echo ""
echo "=== [3/4] Creating environment file ==="

cat > .env << ENV_EOF
# Generated on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}

# Cloudflare Tunnel Token — fill this in!
TUNNEL_TOKEN=REPLACE_ME
ENV_EOF

echo "[OK] .env created with generated passwords"
echo ""
echo "============================================"
echo "  IMPORTANT: Passwords (save these!)"
echo "============================================"
echo "  PostgreSQL password: ${POSTGRES_PASSWORD}"
echo "  n8n encryption key:  ${N8N_ENCRYPTION_KEY}"
echo "============================================"

# ============================================================
# 4. FIREWALL (only SSH + tunnel needed)
# ============================================================
echo ""
echo "=== [4/4] Configuring firewall ==="

ufw allow OpenSSH
ufw --force enable
# No need to open 5678/8080 — cloudflared tunnel handles it
echo "[OK] Firewall configured (SSH only, services via tunnel)"

# ============================================================
# DONE — NOT starting yet (need tunnel token)
# ============================================================
echo ""
echo "============================================"
echo "  SETUP COMPLETE"
echo "============================================"
echo ""
echo "  Next steps:"
echo "  1. Go to https://one.dash.cloudflare.com"
echo "  2. Networks > Tunnels > Create a tunnel"
echo "  3. Name: elunari-vps"
echo "  4. Copy the tunnel token"
echo "  5. Edit /opt/elunari/.env and replace TUNNEL_TOKEN"
echo "  6. Add public hostnames in Cloudflare dashboard:"
echo "     - n8n.elunari.uk  -> http://n8n:5678"
echo "     - db.elunari.uk   -> http://nocodb:8080"
echo "  7. Run: cd /opt/elunari && docker compose up -d"
echo ""
echo "  After starting, create accounts at:"
echo "     - https://n8n.elunari.uk (n8n admin)"
echo "     - https://db.elunari.uk  (NocoDB admin)"
echo ""
