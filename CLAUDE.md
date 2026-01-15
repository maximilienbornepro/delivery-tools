# Delivery Process - Suite d'outils France TV

Suite integree d'outils de gestion de projet pour la planification, l'estimation et le suivi des livraisons.

## Applications

| Application | Description | Ports |
|-------------|-------------|-------|
| **Pointing Poker** | Estimation collaborative des tickets JIRA en equipe | Client: 5173, Server: 3001 |
| **Delivery Board** | Suivi et visualisation des livraisons par sprint | Client: 5175, Server: 3002 |
| **Planification** | Outil de planification des sprints | Server: 3200 |
| **Gateway** | Landing page avec menu d'acces aux applications | Port: 3005 |

## Structure du projet

```
delivery-process/
├── .claude/                    # Agents et skills Claude Code
│   ├── agents/                 # Agents personnalises
│   └── skills/                 # Skills personnalises
├── gateway/                    # Landing page + routing
│   ├── server.js               # Serveur Express
│   └── public/                 # Assets statiques
├── pointing-poker/             # Application Pointing Poker
│   ├── client/                 # Frontend React
│   └── server/                 # Backend Node.js + Socket.io
├── delivery/                   # Application Delivery Board
│   ├── client/                 # Frontend React
│   └── server/                 # Backend Node.js
├── planification/              # Application Planification
├── database/                   # Scripts d'initialisation DB
│   └── init/                   # SQL migrations
├── docker-compose.yml          # PostgreSQL unifiee
├── .env                        # Variables d'environnement
└── package.json                # Scripts d'orchestration
```

## Demarrage rapide

```bash
# 1. Installer les dependances
npm run install:all

# 2. Demarrer la base de donnees PostgreSQL
npm run db:start

# 3. Demarrer toutes les applications
npm run dev
```

Acceder a la landing page: http://localhost:3005

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Demarre toutes les applications en parallele |
| `npm run dev:gateway` | Demarre uniquement le gateway |
| `npm run dev:poker:server` | Demarre le serveur Pointing Poker |
| `npm run dev:poker:client` | Demarre le client Pointing Poker |
| `npm run dev:delivery:server` | Demarre le serveur Delivery |
| `npm run dev:delivery:client` | Demarre le client Delivery |
| `npm run dev:planification` | Demarre Planification |
| `npm run db:start` | Demarre PostgreSQL via Docker |
| `npm run db:stop` | Arrete PostgreSQL |
| `npm run db:reset` | Reinitialise la base de donnees |
| `npm run install:all` | Installe les dependances de tous les projets |

## Stack technique

### Frontend
- React + TypeScript + Vite
- CSS Modules pour le styling
- Context API pour l'etat global
- Socket.io-client pour le temps reel (Pointing Poker)

### Backend
- Node.js + Express + TypeScript
- Socket.io pour WebSocket (Pointing Poker)
- PostgreSQL pour la base de donnees

### Integration
- JIRA REST API v3 + Agile API
- Authentification: Basic Auth (email + API token)

## Variables d'environnement

Toutes les variables sont definies dans `.env` a la racine:

```env
# Base de donnees
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# JIRA (partage)
JIRA_BASE_URL=https://xxx.atlassian.net
JIRA_EMAIL=xxx@domain.com
JIRA_API_TOKEN=xxx
JIRA_PROJECT_KEY=PROJECT

# Pointing Poker
POINTING_POKER_PORT=3001
POINTING_POKER_CLIENT_PORT=5173
POINTING_POKER_DATABASE_URL=postgresql://...

# Delivery Board
DELIVERY_PORT=3002
DELIVERY_CLIENT_PORT=5175
DELIVERY_DATABASE_URL=postgresql://...

# Planification
PLANIFICATION_PORT=3200

# Gateway
GATEWAY_PORT=3005
```

## Travailler sur un sous-projet

Chaque sous-projet peut etre developpe independamment:

```bash
# Aller dans le sous-projet
cd pointing-poker

# Lancer Claude Code
claude

# Le CLAUDE.md du sous-projet contient les instructions specifiques
```

## Conventions de code

### Langue
- Interface utilisateur: Francais
- Code et commentaires: Anglais
- Messages de commit: Anglais

### Naming
- Composants React: PascalCase (ex: `JiraPanel.tsx`)
- Fichiers CSS modules: `ComponentName.module.css`
- Services: camelCase (ex: `jiraService.ts`)
- Socket events: `namespace:action` (ex: `session:finalize`)

## Theme UI

| Element | Couleur |
|---------|---------|
| Background sombre | `#0a0a0a` |
| Header | `#1a1a1a` |
| Accent principal | `#667eea` |
| Succes | `#059669` |
| Warning | `#f59e0b` |
| Erreur | `#dc2626` |
