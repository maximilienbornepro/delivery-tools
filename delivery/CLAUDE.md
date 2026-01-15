# Delivery Board - Suivi des livraisons France TV

Application web de suivi et visualisation des livraisons par sprint avec integration JIRA.

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
| Frontend | React + TypeScript + Vite (port 5175) |
| Backend | Node.js + Express + TypeScript (port 3002) |
| Base de donnees | PostgreSQL (partagee) |
| Integration | JIRA REST API v3 + Agile API |

## Structure du projet

```
delivery/
├── client/                     # Frontend React
│   ├── src/
│   │   ├── components/         # Composants React
│   │   │   ├── DeviceRow.tsx   # Ligne avec timeline
│   │   │   ├── SprintColumn.tsx # Colonne de sprint
│   │   │   └── TaskBlock.tsx   # Carte de tache
│   │   ├── pages/              # Pages principales
│   │   ├── services/           # API calls
│   │   └── types/              # TypeScript interfaces
│   └── package.json
│
└── server/                     # Backend Node.js
    ├── src/
    │   ├── index.ts            # Point d'entree
    │   └── routes/             # API routes
    └── package.json
```

## Composants

### Vues Board (pages)

| Composant | Description | Mode |
|-----------|-------------|------|
| `BoardDelivery` | Vue par projet unique avec timeline editable | Editable |
| `BoardDeliveryAll` | Vue tous projets, une ligne par projet | Read-only |
| `BoardDeliveryChronological` | Vue chronologique, toutes taches melangees | Read-only |

### Composants de structure (obligatoires pour les vues Board)

| Composant | Description | Fichier |
|-----------|-------------|---------|
| `SprintColumn` | En-tete de colonne affichant le nom et les dates du sprint | `SprintColumn.tsx` |
| `DeviceRow` | Ligne complete avec label violet a gauche et timeline a droite | `DeviceRow.tsx` |
| `TaskBlock` | Carte de tache positionnee dans la timeline | `TaskBlock.tsx` |

### Composants de markers (indicateurs visuels)

| Composant | Description | Couleur | Fichier |
|-----------|-------------|---------|---------|
| `MepMarker` | Ligne verticale indiquant une date de MEP (release) | Rouge `#dc2626` | `MepMarker.tsx` |
| `TodayMarker` | Ligne verticale indiquant la date du jour | Bleu `#667eea` | `TodayMarker.tsx` |

**Note:** Les markers ne s'affichent que si la date est comprise dans la plage des sprints affiches.

### Props principales

**DeviceRow:**
```tsx
interface DeviceRowProps {
  label: string;           // Texte dans le label violet
  tasks: Task[];           // Taches a afficher
  totalCols: number;       // Nombre de colonnes (6)
  rowHeight: number;       // Hauteur par ligne (95)
  readOnly?: boolean;      // Mode lecture seule
  onTaskUpdate?: ...       // Callbacks si editable
}
```

**TodayMarker / MepMarker:**
```tsx
interface MarkerProps {
  sprints: Sprint[];       // Liste des sprints pour calculer la position
  totalCols: number;       // Nombre de colonnes (6)
}
```

### Constantes standard

```tsx
const ROW_HEIGHT = 95;   // Hauteur d'une ligne de taches
const TOTAL_COLS = 6;    // Nombre de colonnes (sprints)
```

## Couleurs par projet

| Projet | Couleur |
|--------|---------|
| TVSMART | `#dbeafe` (bleu clair) |
| TVFREE | `#f3f4f6` (gris clair) |
| TVORA | `#ffedd5` (orange clair) |
| TVSFR | `#fee2e2` (rouge clair) |
| TVFIRE | `#fef9c3` (jaune clair) |

## Variables d'environnement

Les variables sont definies dans `../.env` (racine du projet parent):
- `DELIVERY_PORT` - Port du serveur (3002)
- `DELIVERY_CLIENT_PORT` - Port du client (5175)
- `DELIVERY_DATABASE_URL` - URL PostgreSQL
- `JIRA_*` - Configuration JIRA partagee
