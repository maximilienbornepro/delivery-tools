# Pointing Poker - France TV

Application web de Planning Poker pour estimer les tâches JIRA en équipe, avec synchronisation temps réel.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/Node.js-18-green) ![Stack](https://img.shields.io/badge/Socket.io-4-yellow) ![Stack](https://img.shields.io/badge/PostgreSQL-15-blue)

---

## Table des matières

1. [Fonctionnalités](#fonctionnalités)
2. [Architecture](#architecture)
3. [Sécurité](#sécurité)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Lancement](#lancement)
7. [Structure du projet](#structure-du-projet)
8. [Base de données](#base-de-données)
9. [API REST](#api-rest)
10. [WebSocket Events](#websocket-events)
11. [Intégration JIRA](#intégration-jira)
12. [Composants React](#composants-react)
13. [Flux utilisateur](#flux-utilisateur)

---

## Fonctionnalités

### Estimation en équipe
- Création de rooms avec code unique
- Votes avec la suite Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, 34, ?)
- Révélation simultanée des votes
- Calcul automatique de la moyenne et médiane

### Gestion des participants
- Modérateur avec droits spéciaux
- Mode spectateur (observe sans voter)
- Expulsion des participants déconnectés
- Gestion automatique des doublons

### Intégration JIRA
- Liste automatique des tickets à estimer (sprints "Refinement")
- Synchronisation des Story Points vers JIRA
- Synchronisation du Time Estimate
- Déplacement automatique vers sprint "A planifier"
- Marquage "à retravailler" avec commentaire et déplacement vers "Cadrage"

### Interface
- Thème sombre
- Temps réel (WebSocket)
- Responsive design
- Logo France TV

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                 │  SQL    │                 │
│  React Client   │◄───────►│  Express Server │◄───────►│   PostgreSQL    │
│  (Vite + TS)    │         │  (Node.js + TS) │         │                 │
│                 │  WS     │                 │         │                 │
│  Port 5173      │◄═══════►│  Port 3001      │         │  Port 5435      │
└─────────────────┘         └────────┬────────┘         └─────────────────┘
                                     │
                                     │ HTTPS
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │   JIRA Cloud    │
                            │   REST API v3   │
                            │                 │
                            └─────────────────┘
```

### Stack technique

| Couche | Technologies |
|--------|--------------|
| Frontend | React 18, TypeScript, Vite, CSS Modules |
| Backend | Node.js 18, Express, TypeScript |
| Temps réel | Socket.io 4 |
| Base de données | PostgreSQL 15 |
| Containerisation | Docker Compose |

---

## Sécurité

### Mesures implémentées

| Mesure | Description |
|--------|-------------|
| **Helmet** | Headers HTTP de sécurité (XSS, clickjacking, sniffing) |
| **Rate Limiting** | 100 requêtes max par IP / 15 minutes |
| **Données sensibles** | Tokens JIRA jamais envoyés au client |
| **CORS** | Origine contrôlée via configuration |

### Headers de sécurité (Helmet)

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=15552000
Content-Security-Policy: default-src 'self'
```

### Rate Limiting

```typescript
// Configuration actuelle
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requêtes par fenêtre
  message: { error: 'Too many requests, please try again later' }
}
```

### Protection des données

- `jiraApiToken` et `jiraEmail` ne sont **jamais** envoyés aux clients
- Type `RoomPublic` utilisé pour toutes les réponses API et WebSocket
- Credentials JIRA stockés côté serveur uniquement

### Améliorations futures recommandées

- [ ] Authentification JWT
- [ ] Chiffrement des tokens JIRA en base de données
- [ ] Validation des entrées avec Zod
- [ ] Vérification du participantId côté serveur
- [ ] HTTPS obligatoire en production

---

## Installation

### Prérequis

- Node.js 18+
- npm 9+
- Docker et Docker Compose
- Compte JIRA avec API Token

### Étapes

```bash
# 1. Cloner le projet
git clone <repo-url>
cd pointing-poker

# 2. Installer les dépendances du serveur
cd server
npm install

# 3. Installer les dépendances du client
cd ../client
npm install

# 4. Configurer les variables d'environnement
cd ../server
cp .env.example .env
# Éditer .env avec vos valeurs

# 5. Démarrer PostgreSQL
cd ..
docker-compose up -d

# 6. Créer les tables (si première installation)
cd server
npm run db:migrate
```

---

## Configuration

### Variables d'environnement (server/.env)

```env
# Base de données
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/pointing_poker

# Serveur
PORT=3001
NODE_ENV=development

# JIRA
JIRA_BASE_URL=https://votre-instance.atlassian.net
JIRA_EMAIL=votre-email@francetv.fr
JIRA_API_TOKEN=votre-api-token
```

### Obtenir un API Token JIRA

1. Aller sur https://id.atlassian.com/manage-profile/security/api-tokens
2. Cliquer "Create API token"
3. Donner un nom (ex: "Pointing Poker")
4. Copier le token généré

---

## Lancement

### Développement

```bash
# Terminal 1 - Base de données
docker-compose up -d

# Terminal 2 - Serveur (depuis /server)
npm run dev

# Terminal 3 - Client (depuis /client)
npm run dev
```

Accéder à http://localhost:5173

### Production

```bash
# Build
cd client && npm run build
cd ../server && npm run build

# Lancer
cd server && npm start
```

---

## Structure du projet

```
pointing-poker/
├── client/                         # Frontend React
│   ├── public/
│   │   └── francetv-logo.svg       # Logo France TV
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── Notification.tsx    # Notifications toast
│   │   │   ├── home/
│   │   │   │   ├── CreateRoomForm.tsx  # Formulaire création room
│   │   │   │   └── JoinRoomForm.tsx    # Formulaire rejoindre room
│   │   │   └── room/
│   │   │       ├── ActionBar.tsx       # Boutons révéler/revoter
│   │   │       ├── JiraPanel.tsx       # Liste tickets + estimation
│   │   │       ├── ParticipantsList.tsx # Liste participants
│   │   │       ├── PokerCard.tsx       # Carte de vote
│   │   │       ├── VoteResults.tsx     # Résultats après révélation
│   │   │       └── VotingArea.tsx      # Zone de vote
│   │   ├── context/
│   │   │   ├── RoomContext.tsx         # État global room
│   │   │   └── SocketContext.tsx       # Connexion WebSocket
│   │   ├── pages/
│   │   │   ├── HomePage.tsx            # Page d'accueil
│   │   │   └── RoomPage.tsx            # Page de la room
│   │   ├── services/
│   │   │   └── api.ts                  # Appels API REST
│   │   ├── types/
│   │   │   └── index.ts                # Types TypeScript
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                         # Backend Node.js
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts                  # Configuration environnement
│   │   ├── controllers/
│   │   │   ├── roomController.ts       # Routes rooms
│   │   │   └── jiraController.ts       # Routes JIRA
│   │   ├── services/
│   │   │   ├── roomService.ts          # Logique rooms/participants
│   │   │   ├── voteService.ts          # Logique votes
│   │   │   └── jiraService.ts          # Appels API JIRA
│   │   ├── socket/
│   │   │   └── handlers.ts             # Handlers WebSocket
│   │   ├── routes/
│   │   │   └── index.ts                # Définition routes
│   │   └── index.ts                    # Point d'entrée
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml              # PostgreSQL
├── CLAUDE.md                       # Instructions pour Claude
└── README.md                       # Cette documentation
```

---

## Base de données

### Schéma

```sql
-- Rooms de vote
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    jira_base_url VARCHAR(500),
    jira_email VARCHAR(255),
    jira_api_token VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Participants
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_moderator BOOLEAN DEFAULT false,
    is_spectator BOOLEAN DEFAULT false,
    socket_id VARCHAR(255),
    is_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions de vote (1 session = 1 ticket)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    jira_ticket_key VARCHAR(50),
    jira_ticket_summary TEXT,
    status VARCHAR(20) DEFAULT 'voting',  -- voting, revealed, finalized
    final_estimate VARCHAR(10),
    time_estimate VARCHAR(50),
    synced_to_jira BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    value VARCHAR(10) NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, participant_id)
);
```

### Relations

```
rooms (1) ──── (N) participants
rooms (1) ──── (N) sessions
sessions (1) ──── (N) votes
participants (1) ──── (N) votes
```

---

## API REST

### Rooms

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/rooms` | Créer une room |
| GET | `/api/v1/rooms/:code` | Obtenir une room par code |
| POST | `/api/v1/rooms/:code/join` | Rejoindre une room |

#### POST /api/v1/rooms

```json
// Request
{
    "name": "Sprint 42 Planning",
    "moderatorName": "Jean",
    "isSpectator": false
}

// Response
{
    "room": {
        "id": "uuid",
        "code": "ABC123",
        "name": "Sprint 42 Planning"
    },
    "participant": {
        "id": "uuid",
        "name": "Jean",
        "isModerator": true,
        "isSpectator": false
    }
}
```

#### POST /api/v1/rooms/:code/join

```json
// Request
{
    "name": "Marie",
    "isSpectator": false
}

// Response
{
    "room": { ... },
    "participant": { ... }
}
```

### Configuration

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/config` | Obtenir la config (JIRA actif ?) |

### JIRA

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/jira/search` | Rechercher tickets à estimer |
| GET | `/api/v1/jira/ticket/:key` | Détails d'un ticket |

---

## WebSocket Events

### Connexion

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');
```

### Client → Serveur

| Event | Payload | Description |
|-------|---------|-------------|
| `room:join` | `{ roomCode, participantId }` | Rejoindre une room |
| `vote:submit` | `{ sessionId, participantId, value, roomCode, roomId }` | Soumettre un vote |
| `vote:clear` | `{ sessionId, participantId, roomCode }` | Annuler son vote |
| `session:reveal` | `{ sessionId, roomId, roomCode }` | Révéler les votes |
| `session:reset` | `{ sessionId, roomId, roomCode }` | Réinitialiser |
| `session:new` | `{ roomId, roomCode, jiraTicketKey?, jiraTicketSummary? }` | Nouvelle session |
| `session:finalize` | `{ sessionId, roomCode, finalEstimate, timeEstimate, syncToJira }` | Finaliser |
| `ticket:needs_rework` | `{ ticketKey, roomCode, comment }` | Marquer à retravailler |
| `participant:kick` | `{ participantId, roomCode, kickedBy }` | Expulser participant |

### Serveur → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room:joined` | `{ room, participants, currentSession }` | Confirmation connexion |
| `room:participant_joined` | `{ participant }` | Nouveau participant |
| `room:participant_left` | `{ participantId }` | Participant déconnecté |
| `room:participant_removed` | `{ participantId }` | Participant expulsé |
| `vote:submitted` | `{ participantId, hasVoted }` | Vote reçu |
| `vote:cleared` | `{ participantId }` | Vote annulé |
| `vote:all_submitted` | - | Tous ont voté |
| `session:votes_revealed` | `{ votes, participants }` | Votes révélés |
| `session:reset` | `{ sessionId }` | Session réinitialisée |
| `session:new` | `{ session }` | Nouvelle session créée |
| `session:finalized` | `{ sessionId, finalEstimate, timeEstimate, jiraSynced }` | Session finalisée |
| `jira:sync_result` | `{ success, ticketKey, message, details? }` | Résultat sync JIRA |
| `ticket:marked_rework` | `{ ticketKey }` | Ticket marqué à retravailler |
| `participant:kicked` | `{ kickedBy, message }` | Notification expulsion |
| `error` | `{ message }` | Erreur |

### Exemple d'utilisation

```typescript
// Écouter les événements
socket.on('room:joined', (data) => {
    console.log('Connecté à la room:', data.room.name);
    setParticipants(data.participants);
});

socket.on('vote:submitted', ({ participantId }) => {
    setParticipants(prev =>
        prev.map(p => p.id === participantId ? { ...p, hasVoted: true } : p)
    );
});

// Émettre des événements
socket.emit('vote:submit', {
    sessionId: session.id,
    participantId: currentUser.id,
    value: '5',
    roomCode: room.code,
    roomId: room.id,
});
```

---

## Intégration JIRA

### Fonctionnalités

#### 1. Recherche de tickets
- Requête JQL : tickets sans Story Points dans sprints "Refinement"
- Projets : TVSMART, TVORA, TVFREE, TVSFR
- Types : Story, Task (exclut Bug/Anomalie)

```typescript
// JQL utilisée
`project in (TVSMART, TVORA, TVFREE, TVSFR)
 AND sprint ~ "Refinement"
 AND "Story Points" is EMPTY
 AND issuetype in (Story, Task)
 ORDER BY project, key`
```

#### 2. Mise à jour estimation
- Story Points : champ personnalisé (customfield_10016)
- Time Estimate : champ timetracking.originalEstimate
- Format temps : "2d", "4h", "1d 2h"

#### 3. Déplacement après estimation
- Sprint cible : "A planifier" ou "À planifier"
- Recherche automatique du sprint par projet

#### 4. Marquage "à retravailler"
- Préfixe titre : `(à retravailler suite au Refinement)`
- Ajout commentaire explicatif
- Déplacement vers sprint "Cadrage" ou "En cadrage"

### API JIRA utilisées

| Endpoint | Méthode | Usage |
|----------|---------|-------|
| `/rest/api/3/issue/{key}` | GET | Détails ticket |
| `/rest/api/3/issue/{key}` | PUT | Mise à jour ticket |
| `/rest/api/3/issue/{key}/comment` | POST | Ajouter commentaire |
| `/rest/api/3/search/jql` | POST | Recherche JQL |
| `/rest/api/3/field` | GET | Liste des champs |
| `/rest/agile/1.0/board` | GET | Liste des boards |
| `/rest/agile/1.0/board/{id}/sprint` | GET | Sprints d'un board |
| `/rest/agile/1.0/sprint/{id}/issue` | POST | Déplacer ticket |

### Format commentaire JIRA (ADF)

```json
{
    "body": {
        "type": "doc",
        "version": 1,
        "content": [{
            "type": "paragraph",
            "content": [{
                "type": "text",
                "text": "Le commentaire ici"
            }]
        }]
    }
}
```

---

## Composants React

### Hiérarchie

```
App
├── HomePage
│   ├── CreateRoomForm      # Créer une room (modérateur)
│   └── JoinRoomForm        # Rejoindre une room
│
└── RoomPage
    ├── Header              # Logo + info room + code
    ├── ParticipantsList    # Liste participants + kick
    ├── VotingArea          # Cartes de vote
    │   └── PokerCard       # Carte individuelle
    ├── ActionBar           # Boutons révéler/revoter
    ├── VoteResults         # Statistiques après révélation
    ├── JiraPanel           # Liste tickets + finalisation
    │   └── Modal           # "Pas prêt ?" popup
    └── Notification        # Toasts succès/erreur
```

### Contexts

#### SocketContext
```typescript
interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}
```

#### RoomContext
```typescript
interface RoomContextType {
    room: Room | null;
    session: Session | null;
    participants: ParticipantWithVote[];
    currentParticipant: ParticipantWithVote | null;
    selectedVote: string | null;
    notifications: NotificationData[];
    kickedInfo: KickedInfo | null;
    shouldRefreshTickets: boolean;

    // Actions
    submitVote: (value: string) => void;
    clearVote: () => void;
    revealVotes: () => void;
    resetVotes: () => void;
    newSession: (jiraTicketKey?: string, jiraTicketSummary?: string) => void;
    finalizeSession: (finalEstimate: string, timeEstimate: string, syncToJira: boolean) => void;
    markTicketNeedsRework: (ticketKey: string, comment: string) => void;
    kickParticipant: (participantId: string) => void;
}
```

---

## Flux utilisateur

### 1. Création de room (Modérateur)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  HomePage   │────►│ POST /rooms │────►│  RoomPage   │
│  Formulaire │     │  Création   │     │  Connecté   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 2. Rejoindre une room (Participant)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  HomePage   │────►│ POST /join  │────►│  room:join  │────►│  RoomPage   │
│  Code room  │     │  REST API   │     │  WebSocket  │     │  Connecté   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 3. Session de vote

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Sélection  │────►│    Votes     │────►│  Révélation  │────►│ Finalisation │
│    Ticket    │     │  (cachés)    │     │   (visibles) │     │  + Sync JIRA │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
   session:new         vote:submit        session:reveal      session:finalize
```

### 4. Statuts de session

```
voting ──────► revealed ──────► finalized
   │              │
   │              ▼
   │          resetVotes()
   │              │
   └──────────────┘
```

---

## Troubleshooting

### Le serveur ne démarre pas
```bash
# Vérifier que PostgreSQL tourne
docker-compose ps

# Vérifier les logs
docker-compose logs postgres
```

### Erreur JIRA "401 Unauthorized"
- Vérifier `JIRA_EMAIL` et `JIRA_API_TOKEN` dans `.env`
- Régénérer l'API token si nécessaire

### Les tickets ne s'affichent pas
- Vérifier que les tickets sont dans un sprint contenant "Refinement"
- Vérifier que les tickets n'ont pas de Story Points
- Vérifier les projets configurés dans la requête JQL

### WebSocket se déconnecte
- Vérifier les logs du serveur pour les erreurs
- Vérifier que le client pointe vers le bon port (3001)

---

## Licence

Propriétaire - France Télévisions

---

*Documentation générée pour le projet Pointing Poker - France TV*
