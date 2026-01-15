#!/bin/bash

# ============================================
# Delivery Process - Script de démarrage
# ============================================
# Usage: ./start.sh [options]
#   --no-ngrok    Skip ngrok tunnels
#   --help        Show this help
# ============================================

set -e

# Parse arguments
SKIP_NGROK=false
for arg in "$@"; do
    case $arg in
        --no-ngrok)
            SKIP_NGROK=true
            ;;
        --help)
            echo "Usage: ./start.sh [options]"
            echo "  --no-ngrok    Skip ngrok tunnels (local only)"
            echo "  --help        Show this help"
            exit 0
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Ports configuration
GATEWAY_PORT=3005
POINTING_POKER_SERVER_PORT=3001
POINTING_POKER_CLIENT_PORT=5173
DELIVERY_SERVER_PORT=3002
DELIVERY_CLIENT_PORT=5175
PLANIFICATION_PORT=3200
POSTGRES_PORT=5432

# Ngrok domains
NGROK_GATEWAY="francet-tv.ngrok.app"
NGROK_POKER="poker-tv.ngrok.app"
NGROK_DELIVERY="delivery-tv.ngrok.app"
NGROK_PLANIFICATION="planification.ngrok.app"

# Functions
print_header() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${NC}              ${WHITE}DELIVERY PROCESS - France TV${NC}                       ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}              ${CYAN}Suite d'outils de gestion de projet${NC}                 ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_port() {
    if lsof -i :$1 -t >/dev/null 2>&1; then
        echo -e "${GREEN}●${NC}"
    else
        echo -e "${RED}○${NC}"
    fi
}

kill_port() {
    lsof -i :$1 -t 2>/dev/null | xargs kill -9 2>/dev/null || true
}

wait_for_port() {
    local port=$1
    local max_attempts=30
    local attempt=0
    while ! lsof -i :$port -t >/dev/null 2>&1; do
        sleep 0.5
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            return 1
        fi
    done
    return 0
}

# Main script
print_header

# Step 1: Kill existing processes
print_section "Arrêt des processus existants"
echo -e "  ${YELLOW}→${NC} Fermeture des ports..."

kill_port $GATEWAY_PORT
kill_port $POINTING_POKER_SERVER_PORT
kill_port $POINTING_POKER_CLIENT_PORT
kill_port $DELIVERY_SERVER_PORT
kill_port $DELIVERY_CLIENT_PORT
kill_port $PLANIFICATION_PORT
pkill -f ngrok 2>/dev/null || true

sleep 1
echo -e "  ${GREEN}✓${NC} Processus arrêtés"

# Step 2: Start PostgreSQL
print_section "Démarrage de PostgreSQL"
echo -e "  ${YELLOW}→${NC} Vérification de Docker..."

if ! docker info >/dev/null 2>&1; then
    echo -e "  ${RED}✗${NC} Docker n'est pas démarré. Veuillez démarrer Docker Desktop."
    exit 1
fi

cd "$PROJECT_ROOT"
docker-compose up -d >/dev/null 2>&1
sleep 2

if lsof -i :$POSTGRES_PORT -t >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL démarré sur le port $POSTGRES_PORT"
else
    echo -e "  ${RED}✗${NC} Échec du démarrage de PostgreSQL"
    exit 1
fi

# Step 3: Start backend services
print_section "Démarrage des serveurs backend"

echo -e "  ${YELLOW}→${NC} Pointing Poker Server..."
cd "$PROJECT_ROOT/pointing-poker/server" && npm run dev >/dev/null 2>&1 &
sleep 2

echo -e "  ${YELLOW}→${NC} Delivery Server..."
cd "$PROJECT_ROOT/delivery/server" && npm run dev >/dev/null 2>&1 &
sleep 2

echo -e "  ${YELLOW}→${NC} Planification Server..."
cd "$PROJECT_ROOT/planification" && npm run dev >/dev/null 2>&1 &
sleep 1

echo -e "  ${GREEN}✓${NC} Serveurs backend démarrés"

# Step 4: Start frontend services
print_section "Démarrage des clients frontend"

echo -e "  ${YELLOW}→${NC} Pointing Poker Client..."
cd "$PROJECT_ROOT/pointing-poker/client" && npm run dev >/dev/null 2>&1 &
sleep 2

echo -e "  ${YELLOW}→${NC} Delivery Client..."
cd "$PROJECT_ROOT/delivery/client" && npm run dev >/dev/null 2>&1 &
sleep 2

echo -e "  ${GREEN}✓${NC} Clients frontend démarrés"

# Step 5: Start Gateway
print_section "Démarrage de la Gateway"

echo -e "  ${YELLOW}→${NC} Gateway Server..."
cd "$PROJECT_ROOT/gateway" && node server.js >/dev/null 2>&1 &
sleep 2

echo -e "  ${GREEN}✓${NC} Gateway démarrée"

# Step 6: Start ngrok tunnels (optional)
if [ "$SKIP_NGROK" = false ]; then
    print_section "Démarrage des tunnels ngrok"

    echo -e "  ${YELLOW}→${NC} Gateway tunnel..."
    ngrok http --url=$NGROK_GATEWAY $GATEWAY_PORT >/dev/null 2>&1 &
    sleep 1

    echo -e "  ${YELLOW}→${NC} Pointing Poker tunnel..."
    ngrok http --url=$NGROK_POKER $POINTING_POKER_CLIENT_PORT >/dev/null 2>&1 &
    sleep 1

    echo -e "  ${YELLOW}→${NC} Delivery tunnel..."
    ngrok http --url=$NGROK_DELIVERY $DELIVERY_CLIENT_PORT >/dev/null 2>&1 &
    sleep 1

    echo -e "  ${YELLOW}→${NC} Planification tunnel..."
    ngrok http --url=$NGROK_PLANIFICATION $PLANIFICATION_PORT >/dev/null 2>&1 &
    sleep 2

    # Count active ngrok tunnels
    NGROK_COUNT=$(ps aux | grep -c "[n]grok http" || echo "0")
    echo -e "  ${GREEN}✓${NC} $NGROK_COUNT tunnel(s) ngrok actif(s)"

    if [ "$NGROK_COUNT" -lt 4 ]; then
        echo -e "  ${YELLOW}⚠${NC}  Limite ngrok atteinte (3 tunnels max en gratuit)"
    fi
else
    print_section "Tunnels ngrok"
    echo -e "  ${YELLOW}⚠${NC}  Tunnels ngrok désactivés (--no-ngrok)"
fi

# Wait for all services to be ready
sleep 3

# Step 7: Print status
print_section "État des services"

echo ""
echo -e "${WHITE}  Services Locaux${NC}"
echo -e "  ┌─────────────────────────┬────────┬────────┬─────────────────────────────────┐"
echo -e "  │ Service                 │ Port   │ Status │ URL                             │"
echo -e "  ├─────────────────────────┼────────┼────────┼─────────────────────────────────┤"
printf "  │ %-23s │ %-6s │   %b    │ %-31s │\n" "PostgreSQL" "$POSTGRES_PORT" "$(check_port $POSTGRES_PORT)" "localhost:$POSTGRES_PORT"
printf "  │ %-23s │ %-6s │   %b    │ %-31s │\n" "Gateway" "$GATEWAY_PORT" "$(check_port $GATEWAY_PORT)" "http://localhost:$GATEWAY_PORT"
printf "  │ %-23s │ %-6s │   %b    │ %-31s │\n" "Pointing Poker Server" "$POINTING_POKER_SERVER_PORT" "$(check_port $POINTING_POKER_SERVER_PORT)" "http://localhost:$POINTING_POKER_SERVER_PORT"
printf "  │ %-23s │ %-6s │   %b    │ %-31s │\n" "Pointing Poker Client" "$POINTING_POKER_CLIENT_PORT" "$(check_port $POINTING_POKER_CLIENT_PORT)" "http://localhost:$POINTING_POKER_CLIENT_PORT"
printf "  │ %-23s │ %-6s │   %b    │ %-31s │\n" "Delivery Server" "$DELIVERY_SERVER_PORT" "$(check_port $DELIVERY_SERVER_PORT)" "http://localhost:$DELIVERY_SERVER_PORT"
printf "  │ %-23s │ %-6s │   %b    │ %-31s │\n" "Delivery Client" "$DELIVERY_CLIENT_PORT" "$(check_port $DELIVERY_CLIENT_PORT)" "http://localhost:$DELIVERY_CLIENT_PORT"
printf "  │ %-23s │ %-6s │   %b    │ %-31s │\n" "Planification" "$PLANIFICATION_PORT" "$(check_port $PLANIFICATION_PORT)" "http://localhost:$PLANIFICATION_PORT"
echo -e "  └─────────────────────────┴────────┴────────┴─────────────────────────────────┘"

if [ "$SKIP_NGROK" = false ]; then
    echo ""
    echo -e "${WHITE}  Tunnels ngrok (accès externe)${NC}"
    echo -e "  ┌─────────────────────────┬────────┬─────────────────────────────────────────┐"
    echo -e "  │ Service                 │ Status │ URL                                     │"
    echo -e "  ├─────────────────────────┼────────┼─────────────────────────────────────────┤"

    # Check ngrok tunnels
    if ps aux | grep -q "[n]grok.*$NGROK_GATEWAY"; then
        printf "  │ %-23s │   ${GREEN}●${NC}    │ %-39s │\n" "Gateway" "https://$NGROK_GATEWAY"
    else
        printf "  │ %-23s │   ${RED}○${NC}    │ %-39s │\n" "Gateway" "https://$NGROK_GATEWAY"
    fi

    if ps aux | grep -q "[n]grok.*$NGROK_POKER"; then
        printf "  │ %-23s │   ${GREEN}●${NC}    │ %-39s │\n" "Pointing Poker" "https://$NGROK_POKER"
    else
        printf "  │ %-23s │   ${RED}○${NC}    │ %-39s │\n" "Pointing Poker" "https://$NGROK_POKER"
    fi

    if ps aux | grep -q "[n]grok.*$NGROK_DELIVERY"; then
        printf "  │ %-23s │   ${GREEN}●${NC}    │ %-39s │\n" "Delivery" "https://$NGROK_DELIVERY"
    else
        printf "  │ %-23s │   ${RED}○${NC}    │ %-39s │\n" "Delivery" "https://$NGROK_DELIVERY"
    fi

    if ps aux | grep -q "[n]grok.*$NGROK_PLANIFICATION"; then
        printf "  │ %-23s │   ${GREEN}●${NC}    │ %-39s │\n" "Planification" "https://$NGROK_PLANIFICATION"
    else
        printf "  │ %-23s │   ${RED}○${NC}    │ %-39s │\n" "Planification" "https://$NGROK_PLANIFICATION"
    fi

    echo -e "  └─────────────────────────┴────────┴─────────────────────────────────────────┘"
fi

echo ""
echo -e "${GREEN}  ✓ Delivery Process est prêt !${NC}"
echo ""
echo -e "  ${CYAN}Accès principal:${NC}"
echo -e "    Local  → ${WHITE}http://localhost:$GATEWAY_PORT${NC}"
if [ "$SKIP_NGROK" = false ]; then
    echo -e "    Public → ${WHITE}https://$NGROK_GATEWAY${NC}"
fi
echo ""
echo -e "  ${CYAN}Commandes utiles:${NC}"
echo -e "    ./stop.sh       ${YELLOW}# Arrêter tous les services${NC}"
echo -e "    ./status.sh     ${YELLOW}# Voir l'état des services${NC}"
echo ""
