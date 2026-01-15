#!/bin/bash

# ============================================
# Delivery Process - Script de statut
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

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

check_port() {
    if lsof -i :$1 -t >/dev/null 2>&1; then
        echo -e "${GREEN}●${NC}"
    else
        echo -e "${RED}○${NC}"
    fi
}

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}              ${WHITE}DELIVERY PROCESS - Status${NC}                           ${PURPLE}║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════╝${NC}"
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

echo ""
echo -e "${WHITE}  Tunnels ngrok (accès externe)${NC}"
echo -e "  ┌─────────────────────────┬────────┬─────────────────────────────────────────┐"
echo -e "  │ Service                 │ Status │ URL                                     │"
echo -e "  ├─────────────────────────┼────────┼─────────────────────────────────────────┤"

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

# Summary
LOCAL_RUNNING=0
NGROK_RUNNING=0

for port in $POSTGRES_PORT $GATEWAY_PORT $POINTING_POKER_SERVER_PORT $POINTING_POKER_CLIENT_PORT $DELIVERY_SERVER_PORT $DELIVERY_CLIENT_PORT $PLANIFICATION_PORT; do
    if lsof -i :$port -t >/dev/null 2>&1; then
        LOCAL_RUNNING=$((LOCAL_RUNNING + 1))
    fi
done

NGROK_RUNNING=$(ps aux | grep -c "[n]grok http" || echo "0")

echo ""
echo -e "  ${CYAN}Résumé:${NC} $LOCAL_RUNNING/7 services locaux | $NGROK_RUNNING/4 tunnels ngrok"
echo ""

if [ $LOCAL_RUNNING -eq 7 ]; then
    echo -e "  ${GREEN}✓ Tous les services locaux sont opérationnels${NC}"
else
    echo -e "  ${YELLOW}⚠ Certains services locaux sont arrêtés${NC}"
fi

if [ $NGROK_RUNNING -lt 4 ]; then
    echo -e "  ${YELLOW}⚠ Limite ngrok: max 3 tunnels simultanés (plan gratuit)${NC}"
fi

echo ""
