# Delivery Client - Instructions Claude

## Structure obligatoire pour les nouvelles vues Board

Lors de la creation d'une nouvelle vue de type board (timeline), les composants suivants sont **OBLIGATOIRES** :

### 1. Structure JSX

```tsx
import { DeviceRow } from './DeviceRow';
import { SprintColumn } from './SprintColumn';
import { TodayMarker } from './TodayMarker';
import styles from './BoardDelivery.module.css';

export function NewBoardView({ sprints, tasks, ... }) {
  return (
    <div className={styles.board}>
      {/* Header avec colonnes de sprint */}
      <div className={styles.sprintHeader}>
        <div className={styles.platformLabel}></div>
        {sprints.map((sprint) => (
          <SprintColumn key={sprint.id} sprint={sprint} />
        ))}
      </div>

      {/* Contenu du board */}
      <div className={styles.boardContent}>
        {/* Markers (Today, MEP) */}
        <div className={styles.mepLayer}>
          <TodayMarker sprints={sprints} totalCols={6} />
        </div>

        <DeviceRow
          label="NomDuLabel"
          tasks={tasks}
          totalCols={6}
          rowHeight={95}
          readOnly={true}  // ou false si editable
        />
      </div>
    </div>
  );
}
```

### 2. Composants obligatoires (structure)

| Composant | Role | Fichier |
|-----------|------|---------|
| `SprintColumn` | Affiche une colonne de sprint (dates + nom) | `SprintColumn.tsx` |
| `DeviceRow` | Ligne avec label violet + timeline + tasks | `DeviceRow.tsx` |
| `TaskBlock` | Carte de tache (utilise par DeviceRow) | `TaskBlock.tsx` |

### 3. Composants de markers (indicateurs visuels)

| Composant | Role | Couleur | Fichier |
|-----------|------|---------|---------|
| `TodayMarker` | Ligne verticale indiquant la date du jour | Bleu `#667eea` | `TodayMarker.tsx` |
| `MepMarker` | Ligne verticale indiquant une date de MEP | Rouge `#dc2626` | `MepMarker.tsx` |

**Note:** Les markers ne s'affichent que si la date est dans la plage des sprints.

### 4. Styles obligatoires (BoardDelivery.module.css)

- `.board` - Conteneur principal blanc avec border-radius
- `.sprintHeader` - Flex container pour l'en-tete
- `.platformLabel` - Espace vide aligne avec deviceLabel (100px)
- `.boardContent` - Conteneur relatif pour le contenu

### 5. Styles DeviceRow (DeviceRow.module.css)

- `.deviceRow` - Flex container pour la ligne
- `.deviceLabel` - Label violet gradient (100px)
- `.timeline` - Zone relative pour positionner les tasks
- `.sprintDivider` - Lignes verticales de separation

### 6. Constantes standard

```tsx
const ROW_HEIGHT = 95;   // Hauteur d'une ligne de taches
const TOTAL_COLS = 6;    // Nombre de colonnes (sprints)
```

### 7. Props DeviceRow

```tsx
interface DeviceRowProps {
  label: string;           // Texte dans le label violet
  tasks: Task[];           // Taches a afficher
  totalCols: number;       // Nombre de colonnes (6)
  rowHeight: number;       // Hauteur par ligne (95)
  readOnly?: boolean;      // Mode lecture seule
  onTaskUpdate?: ...       // Callbacks si editable
  onTaskDelete?: ...
  onTaskResize?: ...
  onTaskMove?: ...
}
```

## Couleurs par projet (vue chronologique)

Quand une tache a un `projectId`, TaskBlock applique automatiquement la couleur :

| Projet | Couleur |
|--------|---------|
| TVSMART | `#dbeafe` (bleu clair) |
| TVFREE | `#f3f4f6` (gris clair) |
| TVORA | `#ffedd5` (orange clair) |
| TVSFR | `#fee2e2` (rouge clair) |
| TVFIRE | `#fef9c3` (jaune clair) |

## Vues existantes

- `BoardDelivery.tsx` - Vue par projet unique (editable)
- `BoardDeliveryAll.tsx` - Vue tous projets (read-only, par projet)
- `BoardDeliveryChronological.tsx` - Vue chronologique (read-only, melange)
