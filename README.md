# Delivery Tools

Suite d'outils de gestion de projet pour France TV - Estimation, suivi des livraisons et planification.

## Applications

| Application | Description | Port |
|-------------|-------------|------|
| **Gateway** | Landing page avec navigation unifiee | 3005 |
| **Pointing Poker** | Estimation collaborative des tickets JIRA | 5173 (client) / 3001 (server) |
| **Delivery Board** | Suivi et visualisation des livraisons par sprint | 5175 (client) / 3002 (server) |
| **Planification** | Outil de planification des sprints | 3200 |

## Demarrage rapide

### Prerequis

- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/products/docker-desktop/) (pour PostgreSQL)
- [ngrok](https://ngrok.com/) (optionnel, pour acces externe)

### Installation

```bash
# Cloner le repo
git clone git@github.com:maximilienbornepro/delivery-tools.git
cd delivery-tools

# Installer les dependances
npm run install:all

# Configurer l'environnement
cp .env.example .env
# Editer .env avec vos credentials JIRA
```

### Demarrage

```bash
# Demarrer tous les services (Docker + apps + ngrok)
./start.sh

# Demarrer sans ngrok (local seulement)
./start.sh --no-ngrok

# Voir l'etat des services
./status.sh

# Arreter tous les services
./stop.sh
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `./start.sh` | Demarre Docker, tous les services et ngrok |
| `./start.sh --no-ngrok` | Demarre sans les tunnels ngrok |
| `./stop.sh` | Arrete tous les services |
| `./status.sh` | Affiche l'etat de tous les services |
| `npm run dev` | Demarre avec concurrently (sans Docker) |
| `npm run db:start` | Demarre PostgreSQL uniquement |
| `npm run db:stop` | Arrete PostgreSQL |
| `npm run db:reset` | Reset la base de donnees |
| `npm run install:all` | Installe toutes les dependances |

## Architecture

```
delivery-tools/
├── gateway/                 # Landing page + navigation
│   ├── server.js           # Express server
│   └── public/             # Static files
│
├── pointing-poker/          # Estimation JIRA
│   ├── client/             # React + Vite
│   └── server/             # Express + Socket.io
│
├── delivery/                # Suivi livraisons
│   ├── client/             # React + Vite
│   └── server/             # Express + API
│
├── planification/           # Planification sprints
│   ├── index.html          # Interface
│   ├── app.js              # Logique
│   └── server.js           # HTTP server
│
├── database/                # Scripts SQL
│   └── init/               # Schemas initiaux
│
├── docs/                    # Documentation
│   └── JIRA-SERVICES.md    # API JIRA utilisees
│
├── docker-compose.yml       # PostgreSQL
├── .env.example            # Template variables
├── start.sh                # Script demarrage
├── stop.sh                 # Script arret
└── status.sh               # Script status
```

## Configuration

### Variables d'environnement

Copier `.env.example` vers `.env` et configurer :

```bash
# JIRA (obligatoire)
JIRA_BASE_URL=https://votre-instance.atlassian.net
JIRA_EMAIL=votre-email@example.com
JIRA_API_TOKEN=votre-token-api
JIRA_PROJECT_KEY=VOTRE_PROJET

# Ports (optionnel, valeurs par defaut)
GATEWAY_PORT=3005
POINTING_POKER_PORT=3001
POINTING_POKER_CLIENT_PORT=5173
DELIVERY_PORT=3002
DELIVERY_CLIENT_PORT=5175
PLANIFICATION_PORT=3200
```

### Obtenir un token JIRA

1. Aller sur https://id.atlassian.com/manage-profile/security/api-tokens
2. Creer un nouveau token
3. Copier le token dans `.env`

## Acces

### Local

| Service | URL |
|---------|-----|
| Gateway (accueil) | http://localhost:3005 |
| Pointing Poker | http://localhost:5173 |
| Delivery Board | http://localhost:5175 |
| Planification | http://localhost:3200 |

### Externe (ngrok)

| Service | URL |
|---------|-----|
| Gateway | https://francet-tv.ngrok.app |
| Pointing Poker | https://poker-tv.ngrok.app |
| Delivery | https://delivery-tv.ngrok.app |
| Planification | https://planification.ngrok.app |

> **Note**: Le plan gratuit ngrok limite a 3 tunnels simultanement.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Temps reel | Socket.io |
| Base de donnees | PostgreSQL |
| Integration | JIRA REST API v3 + Agile API |
| Conteneurs | Docker, Docker Compose |

## Documentation

- [Services JIRA](docs/JIRA-SERVICES.md) - Liste des endpoints JIRA utilises

## Developpement

### Travailler sur un projet specifique

```bash
# Pointing Poker
cd pointing-poker/client && npm run dev
cd pointing-poker/server && npm run dev

# Delivery
cd delivery/client && npm run dev
cd delivery/server && npm run dev

# Planification
cd planification && npm start
```

### Base de donnees

```bash
# Demarrer PostgreSQL
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Reset complet
docker-compose down -v && docker-compose up -d
```

## Licence

Projet prive - France TV
