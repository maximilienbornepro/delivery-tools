# Planification - Outil de planification des sprints

Application web simple pour la planification des sprints Dotscreen.

## Projet Parent

Ce projet fait partie de la suite **Delivery Process**. Les variables d'environnement sont gerees au niveau racine.

**Commandes depuis la racine du projet parent:**
```bash
# Demarrer toutes les applications
cd .. && npm run dev
```

**Commandes locales (developpement independant):**
```bash
# Demarrer le serveur
npm start
```

## Stack Technique

| Couche | Technologies |
|--------|-------------|
| Frontend | HTML + CSS + JavaScript vanilla |
| Backend | Node.js HTTP Server (port 3200) |

## Structure du projet

```
planification/
├── index.html          # Page principale
├── app.js              # Logique JavaScript
├── styles.css          # Styles CSS
├── server.js           # Serveur HTTP Node.js
├── specification.txt   # Specifications du projet
├── static/             # Fichiers statiques
└── templates/          # Templates HTML
```

## Fichiers cles

| Fichier | Description |
|---------|-------------|
| `index.html` | Interface utilisateur principale |
| `app.js` | Logique applicative JavaScript |
| `styles.css` | Styles de l'application |
| `server.js` | Serveur HTTP simple |

## Variables d'environnement

Les variables sont definies dans `../.env` (racine du projet parent):
- `PLANIFICATION_PORT` - Port du serveur (3200)

## Developpement

Cette application est une application statique simple servie par un serveur HTTP Node.js.
Elle ne necessite pas de base de donnees.

Pour modifier l'application:
1. Editer `index.html` pour la structure
2. Editer `app.js` pour la logique
3. Editer `styles.css` pour les styles
