#!/bin/bash

# ============================================
# Delivery Process - Script d'arrêt
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'

# Ports
PORTS=(3005 3001 5173 3002 5175 3200)

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}              ${WHITE}DELIVERY PROCESS - Arrêt${NC}                            ${PURPLE}║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}→${NC} Arrêt des tunnels ngrok..."
pkill -f ngrok 2>/dev/null || true

echo -e "${YELLOW}→${NC} Arrêt des services..."
for port in "${PORTS[@]}"; do
    lsof -i :$port -t 2>/dev/null | xargs kill -9 2>/dev/null || true
done

echo -e "${YELLOW}→${NC} Arrêt de PostgreSQL..."
docker-compose down 2>/dev/null || true

sleep 1

echo ""
echo -e "${GREEN}✓ Tous les services ont été arrêtés${NC}"
echo ""
