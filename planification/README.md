# Planification Dotscreen

Application web de gestion de planification de charge d'une equipe de developpement.

## Description

Cette application permet de :
- Gerer plusieurs planifications d'equipe
- Estimer les taches avec des T-Shirt sizes (XXS a XXL)
- Calculer automatiquement les jours disponibles et la capacite
- Visualiser la charge avec une jauge de capacite
- Importer/exporter des planifications (JSON, CSV)

## Stack Technique

- **Frontend** : HTML5, CSS3, JavaScript ES6+ (vanilla, sans framework)
- **Persistance** : localStorage (`planification-dotscreen-v2`)
- **Serveur** : Node.js statique minimal (port 3200)

## Installation

```bash
# Cloner le repository
git clone git@github.com:maximilienborneext/planification.git
cd planification

# Demarrer le serveur
npm start
```

L'application sera accessible sur [http://localhost:3200](http://localhost:3200)

## Structure du Projet

```
planification/
├── index.html          # Page principale
├── app.js              # Logique applicative
├── styles.css          # Styles CSS
├── server.js           # Serveur Node.js statique
├── package.json        # Configuration npm
├── specification.txt   # Specifications detaillees
├── .claude/            # Configuration Claude Code
│   ├── agents/         # Agents specialises
│   ├── skills/         # Skills disponibles
│   └── settings.local.json
└── README.md
```

## Configuration Claude Code

Ce projet est configure avec Claude Code pour faciliter le developpement.

### Agents Disponibles

| Agent | Description |
|-------|-------------|
| `frontend-developer` | Specialiste React/frontend, composants UI, accessibilite |
| `fullstack-developer` | Developpement full-stack, API, base de donnees |
| `javascript-pro` | Expert JavaScript ES6+, async, Node.js |
| `documentation-expert` | Creation et maintenance de documentation |

### Skills Disponibles

| Skill | Description |
|-------|-------------|
| `senior-backend` | Developpement backend scalable, API REST, securite |

Le skill `senior-backend` inclut :
- Scripts Python pour scaffolding API, migrations DB, load testing
- Documentation de reference (API patterns, securite, optimisation DB)

## Fonctionnalites

### Gestion des Planifications
- Creation, renommage et suppression de planifications
- Sauvegarde automatique dans localStorage
- Export/import JSON pour backup

### Configuration
- Duree de planification (1 ou 2 mois)
- Ressources de developpement disponibles
- Taux Lead et Archi (%)
- Jours de reunion, gestion projet, QA

### Taches
- Edition inline directement dans le tableau
- T-Shirt sizes avec codes couleur
- Filtrage par application
- Import depuis CSV ou autre planification

### Calculs Automatiques
- Jours dev disponibles
- Jours Lead et Archi
- Capacite utilisee (%)
- Jauge visuelle (bleu/orange/rouge selon charge)

## T-Shirt Sizes

| Size | Min (jours) | Max (jours) |
|------|-------------|-------------|
| N/A  | 0           | 0           |
| XXS  | 2           | 5           |
| XS   | 5           | 10          |
| S    | 10          | 20          |
| M    | 20          | 30          |
| L    | 30          | 50          |
| XL   | 50          | 100         |
| XXL  | 100         | 200         |

## Raccourcis Clavier

- `Escape` : Fermer les modales

## Licence

Projet interne Dotscreen / France TV.
