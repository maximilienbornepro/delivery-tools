# Pointing Poker - Planning Poker pour France TV

Application web de Planning Poker pour estimer les taches JIRA en equipe, avec synchronisation temps reel via WebSocket.

## Projet Parent

Ce projet fait partie de la suite **Delivery Process**. La configuration Docker et les variables d'environnement sont gerees au niveau racine.

**Commandes depuis la racine du projet parent:**
```bash
# Demarrer la base de donnees
cd .. && docker-compose up -d

# Demarrer toutes les applications
cd .. && npm run dev
```

**Commandes locales (developpement independant):**
```bash
# Le serveur
cd server && npm run dev

# Le client (dans un autre terminal)
cd client && npm run dev
```

## Stack Technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React + TypeScript + Vite (port 5173) |
| Backend | Node.js + Express + TypeScript (port 3001) |
| Temps reel | Socket.io |
| Base de donnees | PostgreSQL (partagee) |
| Integration | JIRA REST API v3 + Agile API |

## Structure du projet

```
pointing-poker/
├── client/                     # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Card, Input, Modal, Notification
│   │   │   ├── room/           # VotingArea, PokerCard, ParticipantsList, JiraPanel
│   │   │   └── home/           # CreateRoomForm, JoinRoomForm
│   │   ├── pages/              # HomePage, RoomPage
│   │   ├── context/            # SocketContext, RoomContext
│   │   ├── services/           # api.ts, socket.ts
│   │   └── types/              # TypeScript interfaces
│   └── package.json
│
└── server/                     # Backend Node.js
    ├── src/
    │   ├── controllers/        # roomController, voteController, jiraController
    │   ├── services/           # roomService, voteService, jiraService
    │   ├── socket/             # handlers.ts
    │   ├── models/             # Room, Participant, Vote, Session
    │   └── routes/             # API routes
    └── package.json
```

## Fichiers cles

| Fichier | Description |
|---------|-------------|
| `server/src/socket/handlers.ts` | Tous les handlers WebSocket |
| `server/src/services/jiraService.ts` | Integration JIRA (API calls) |
| `server/src/services/roomService.ts` | Gestion rooms/participants/sessions |
| `client/src/context/RoomContext.tsx` | Etat global de la room |
| `client/src/components/room/JiraPanel.tsx` | Liste tickets + formulaire estimation |

## Evenements WebSocket

### Client -> Serveur
| Event | Description |
|-------|-------------|
| `room:join` | Rejoindre une room |
| `vote:submit` | Soumettre un vote |
| `vote:clear` | Annuler son vote |
| `session:reveal` | Reveler les votes |
| `session:reset` | Reinitialiser les votes |
| `session:finalize` | Valider estimation + sync JIRA |
| `ticket:needs_rework` | Marquer ticket a retravailler |

### Serveur -> Client
| Event | Description |
|-------|-------------|
| `room:joined` | Confirmation connexion |
| `room:participant_joined` | Nouveau participant |
| `vote:submitted` | Quelqu'un a vote |
| `session:votes_revealed` | Votes reveles |
| `session:finalized` | Estimation validee |

## Variables d'environnement

Les variables sont definies dans `../.env` (racine du projet parent):
- `POINTING_POKER_PORT` - Port du serveur (3001)
- `POINTING_POKER_CLIENT_PORT` - Port du client (5173)
- `POINTING_POKER_DATABASE_URL` - URL PostgreSQL
- `JIRA_*` - Configuration JIRA partagee

## Fonctionnalites JIRA

1. **Recherche tickets**: Tickets sans Story Points dans sprints "Refinement"
2. **Estimation**: Mise a jour Story Points + Time Estimate
3. **Deplacement sprint**: Vers "A planifier" apres estimation
4. **A retravailler**: Prefixe titre + commentaire + deplacement vers "Cadrage"
