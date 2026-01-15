# Delivery Board - Multi-Projets JIRA

Application de visualisation et gestion du board de delivery pour les projets JIRA France TV.

## Projets supportes

- **TVSMART** - Application Smart TV
- **TVFREE** - Application Free
- **TVORA** - Application Orange
- **TVSFR** - Application SFR
- **TVFIRE** - Application Fire TV

## Architecture

```
delivery/
├── client/                    # Frontend React + TypeScript + Vite
│   ├── src/
│   │   ├── components/        # Composants React
│   │   │   ├── BoardDelivery.tsx    # Grille principale des sprints
│   │   │   ├── BurgerMenu.tsx       # Menu lateral PI selection
│   │   │   ├── ConfidenceIndex.tsx  # Indice de confiance
│   │   │   ├── DeviceRow.tsx        # Ligne device (SMARTTV)
│   │   │   ├── ProjectSelector.tsx  # Dropdown selection projet
│   │   │   ├── ReleaseBoard.tsx     # Board des releases
│   │   │   ├── RestoreModal.tsx     # Modal restauration tickets masques
│   │   │   ├── SprintColumn.tsx     # Colonne sprint (dates + nom)
│   │   │   └── TaskBlock.tsx        # Bloc tache (drag & drop, resize)
│   │   ├── services/
│   │   │   ├── jiraService.ts       # Client API JIRA
│   │   │   ├── mepService.ts        # Client API versions/MEP
│   │   │   ├── positionsService.ts  # Client API positions
│   │   │   ├── confidenceService.ts # Client API indice de confiance
│   │   │   └── piStateService.ts    # Client API etat PI (freeze/hide)
│   │   ├── data/
│   │   │   └── mockData.ts          # Donnees statiques (releases, confidence)
│   │   ├── types/
│   │   │   └── index.ts             # Types TypeScript
│   │   ├── App.tsx                  # Composant principal
│   │   └── App.css                  # Styles globaux
│   ├── vite.config.ts         # Configuration Vite (proxy, host)
│   └── package.json
│
├── server/                    # Backend Node.js + Express + TypeScript
│   ├── src/
│   │   ├── services/
│   │   │   ├── jiraService.ts       # Integration API JIRA
│   │   │   └── dbService.ts         # Service PostgreSQL
│   │   ├── routes/
│   │   │   ├── jiraRoutes.ts        # Routes /api/jira/*
│   │   │   ├── mepRoutes.ts         # Routes /api/mep/*
│   │   │   ├── positionsRoutes.ts   # Routes /api/positions/*
│   │   │   ├── confidenceRoutes.ts  # Routes /api/confidence/*
│   │   │   └── piStateRoutes.ts     # Routes /api/pi-state/*
│   │   └── index.ts                 # Point d'entree serveur
│   ├── init.sql               # Script initialisation DB
│   ├── .env                   # Variables d'environnement
│   └── package.json
│
└── docker-compose.yml         # PostgreSQL container
```

## Stack Technique

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool et dev server
- **CSS Modules** - Styling scope

### Backend
- **Node.js** + **Express 5**
- **TypeScript**
- **pg** - Client PostgreSQL

### Base de donnees
- **PostgreSQL 16** (Docker)

### Integration
- **JIRA REST API v3** - Recuperation des tickets
- **JIRA Agile API** - Sprints et boards

## Installation

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Acces JIRA (email + API token)

### 1. Cloner le repository
```bash
git clone git@github.com:maximilienborneext/delivery.git
cd delivery
```

### 2. Demarrer PostgreSQL
```bash
docker-compose up -d
```

### 3. Configurer le serveur
```bash
cd server
cp .env.example .env
# Editer .env avec vos credentials JIRA
npm install
```

Variables d'environnement requises:
```env
JIRA_BASE_URL=https://votre-instance.atlassian.net
JIRA_EMAIL=votre.email@example.com
JIRA_API_TOKEN=votre_api_token
JIRA_PROJECT_KEY=TVSMART
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/delivery
```

### 4. Demarrer le serveur
```bash
npm run dev
```

### 5. Configurer et demarrer le client
```bash
cd ../client
npm install
npm run dev
```

L'application est accessible sur http://localhost:5175

## Docker Compose

Le fichier `docker-compose.yml` configure PostgreSQL:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: delivery-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: delivery
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/init.sql:/docker-entrypoint-initdb.d/init.sql
```

### Commandes utiles
```bash
# Demarrer PostgreSQL
docker-compose up -d

# Voir les logs
docker-compose logs -f postgres

# Arreter
docker-compose down

# Supprimer les donnees
docker-compose down -v
```

## API Endpoints

### JIRA
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/jira/boards` | Liste des boards JIRA |
| GET | `/api/jira/sprints/:projectKey` | Sprints d'un projet |
| GET | `/api/jira/issues/:projectKey` | Tickets du projet |

### Positions
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/positions/:projectId/:piId` | Positions des taches pour un projet + PI |
| POST | `/api/positions` | Sauvegarder une position (body: `{taskId, piId, projectId, startCol, endCol, row}`) |
| DELETE | `/api/positions/:projectId/:piId/:taskId` | Supprimer une position |

### Versions/MEP
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/mep/:projectId` | Toutes les versions d'un projet |
| GET | `/api/mep/:projectId/range?startDate=&endDate=` | Versions filtrees par date de release |

### Indice de Confiance
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/confidence/:projectId/:piId` | Donnees de confiance pour un projet + PI |
| PUT | `/api/confidence/:projectId/:piId/score` | Modifier le score |
| POST | `/api/confidence/:projectId/:piId/questions` | Ajouter une question/risque |
| PUT | `/api/confidence/questions/:id` | Modifier une question |
| DELETE | `/api/confidence/questions/:id` | Supprimer une question |
| POST | `/api/confidence/:projectId/:piId/improvements` | Ajouter une amelioration |
| PUT | `/api/confidence/improvements/:id` | Modifier une amelioration |
| DELETE | `/api/confidence/improvements/:id` | Supprimer une amelioration |

### Etat PI (Freeze/Hide)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/pi-state/:projectId/:piId` | Etat du PI (frozen, hidden tickets) |
| PUT | `/api/pi-state/:projectId/:piId/freeze` | Toggle figer/defiger le PI |
| POST | `/api/pi-state/:projectId/:piId/hide` | Masquer un ticket (body: `{jiraKey}`) |
| DELETE | `/api/pi-state/:projectId/:piId/hide/:jiraKey` | Restaurer un ticket masque |
| POST | `/api/pi-state/:projectId/:piId/restore` | Restaurer plusieurs tickets (body: `{jiraKeys[]}`) |

## Fonctionnalites

### Support Multi-Projets
- **Dropdown projet** dans le header (en haut a droite)
- **Isolation des donnees** : chaque projet a ses propres positions, confiance et etat freeze par PI
- **PIs partages** : tous les projets utilisent la meme serie de PIs (PI 1, PI 2, etc.)
- **URL persistante** : le projet et PI selectionnes sont sauvegardes dans l'URL (`?project=TVSMART&pi=pi1`)
- **Board des releases** independant par projet

### Board de Delivery
- Affichage des tickets JIRA par sprint
- **Drag & Drop** des taches avec snap sur grille
- **Resize** des taches (largeur ajustable)
- **Edition** du titre (double-clic)
- **Suppression** des taches (masque localement, ne supprime pas de JIRA)
- Sauvegarde automatique des positions par projet + PI

### Burger Menu
- Selection du PI (Program Increment)
- 8 PIs generes pour 2026
- Chaque PI contient 3 sprints de 2 semaines

### TaskBlock
- Label JIRA cliquable (lien vers le ticket)
- Badge version (fixVersion JIRA)
- **Badge statut** en haut a droite (Cadrage, Refinement, En cours, Bloque, A faire, Backlog, Done)
- Indicateur de statut (done, in_progress, todo)

### Board de Release
- Affichage des versions JIRA filtrees par dates du PI
- Liste des **recits uniquement** (pas les bugs, taches ou tests)
- Liens cliquables vers les tickets JIRA
- Date et numero de version pour chaque release
- **Independant par projet** : chaque projet affiche ses propres releases

### Indice de Confiance
- **Score editable** (cliquer pour modifier, valeur de 0 a 5)
- **Risques/Questions** : liste editable (double-clic pour modifier, bouton + pour ajouter, bouton x pour supprimer)
- **Ameliorations** : liste editable des pistes d'amelioration
- **Persistance en base** par projet + PI (chaque combinaison a ses propres donnees)
- Couleur du score adaptative (vert >= 4, orange >= 3, rouge < 3)

### Gestion des PI (Freeze/Hide)
Permet de conserver l'etat d'un PI meme apres la fin des sprints JIRA.

| Etat | Refresh JIRA | Comportement |
|------|--------------|--------------|
| **Defige** | Actif | MERGE : ajoute les nouveaux tickets, ne supprime jamais les existants |
| **Fige** | Desactive (bouton grise) | Board fige, edition toujours possible |

- **Figer un PI** : Bouton "Figer" dans la toolbar, desactive le refresh JIRA
- **Defiger un PI** : Bouton "Defiger", reactive le refresh en mode merge (ajoute sans supprimer)
- **Masquer un ticket** : Suppression locale (ne supprime pas de JIRA), le ticket n'apparait plus au refresh
- **Restaurer des tickets** : Bouton "Restaurer (N)" ouvre une modal pour recuperer les tickets masques
- **Independant par projet** : chaque projet a son propre etat freeze et ses propres tickets masques par PI

## Acces distant (ngrok)

Pour exposer l'application via ngrok:

```bash
# Terminal 1: ngrok vers le client
ngrok http 5175
```

La configuration Vite inclut:
- `host: '0.0.0.0'` - Ecoute sur toutes les interfaces
- `allowedHosts` - Autorise le domaine ngrok
- `proxy` - Redirige `/api` vers le serveur local

## Schema de la base de donnees

```sql
-- Positions des taches (par projet + PI)
CREATE TABLE task_positions (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    pi_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
    start_col INTEGER NOT NULL DEFAULT 0,
    end_col INTEGER NOT NULL DEFAULT 1,
    row_index INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, pi_id, project_id)
);

-- Indice de confiance (score par projet + PI)
CREATE TABLE confidence_data (
    id SERIAL PRIMARY KEY,
    pi_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
    score DECIMAL(3,1) NOT NULL DEFAULT 3.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pi_id, project_id)
);

-- Questions/risques de l'indice de confiance
CREATE TABLE confidence_questions (
    id SERIAL PRIMARY KEY,
    pi_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
    label VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ameliorations de l'indice de confiance
CREATE TABLE confidence_improvements (
    id SERIAL PRIMARY KEY,
    pi_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
    label VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Etat des PI (freeze/hidden tickets par projet)
CREATE TABLE pi_state (
    id SERIAL PRIMARY KEY,
    pi_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    hidden_jira_keys TEXT[] DEFAULT ARRAY[]::TEXT[],
    frozen_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pi_id, project_id)
);
```

### Migration base existante

Si vous avez une base existante sans `project_id`, executez cette migration :

```sql
-- Add project_id to all tables
ALTER TABLE task_positions ADD COLUMN IF NOT EXISTS project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART';
ALTER TABLE task_positions DROP CONSTRAINT IF EXISTS task_positions_task_id_pi_id_key;
ALTER TABLE task_positions ADD CONSTRAINT task_positions_unique UNIQUE(task_id, pi_id, project_id);

ALTER TABLE confidence_data ADD COLUMN IF NOT EXISTS project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART';
ALTER TABLE confidence_data DROP CONSTRAINT IF EXISTS confidence_data_pi_id_key;
ALTER TABLE confidence_data ADD CONSTRAINT confidence_data_unique UNIQUE(pi_id, project_id);

ALTER TABLE confidence_questions ADD COLUMN IF NOT EXISTS project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART';
ALTER TABLE confidence_improvements ADD COLUMN IF NOT EXISTS project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART';

ALTER TABLE pi_state ADD COLUMN IF NOT EXISTS project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART';
ALTER TABLE pi_state DROP CONSTRAINT IF EXISTS pi_state_pi_id_key;
ALTER TABLE pi_state ADD CONSTRAINT pi_state_unique UNIQUE(pi_id, project_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_positions_project ON task_positions(project_id);
CREATE INDEX IF NOT EXISTS idx_confidence_questions_project ON confidence_questions(project_id);
CREATE INDEX IF NOT EXISTS idx_confidence_improvements_project ON confidence_improvements(project_id);
CREATE INDEX IF NOT EXISTS idx_pi_state_project ON pi_state(project_id);
```

## Developpement

### Scripts disponibles

**Client:**
```bash
npm run dev      # Serveur de dev
npm run build    # Build production
npm run preview  # Preview du build
```

**Server:**
```bash
npm run dev      # Serveur de dev (ts-node)
npm run build    # Compile TypeScript
npm start        # Lance le build compile
```

## Licence

Projet interne France TV.
