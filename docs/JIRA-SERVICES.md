# Services JIRA - Documentation

Ce document liste tous les services JIRA utilises dans la suite Delivery Process.

## Configuration

### Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `JIRA_BASE_URL` | URL de base de l'instance JIRA | `https://francetv.atlassian.net` |
| `JIRA_EMAIL` | Email du compte de service | `user@francetv.fr` |
| `JIRA_API_TOKEN` | Token API JIRA | `ATATT3xFfGF0...` |
| `JIRA_PROJECT_KEY` | Projet par defaut | `TVSMART` |

### Authentification

Toutes les requetes utilisent l'authentification **Basic Auth** :
```
Authorization: Basic base64(email:apiToken)
```

---

## API REST v3 (`/rest/api/3/`)

### GET `/rest/api/3/issue/{ticketKey}`

**Application** : Pointing Poker

**Description** : Recuperer les details d'un ticket JIRA.

**Champs retournes** :
- `key` : Cle du ticket (ex: TVSMART-123)
- `fields.summary` : Titre du ticket
- `fields.customfield_10016` : Story Points
- `fields.timeoriginalestimate` : Estimation temps (secondes)

**Exemple** :
```bash
GET /rest/api/3/issue/TVSMART-123
```

---

### PUT `/rest/api/3/issue/{ticketKey}`

**Applications** : Pointing Poker, Delivery

**Description** : Mettre a jour un ticket JIRA.

**Champs modifiables** :
- `customfield_10016` : Story Points
- `timetracking.originalEstimate` : Estimation temps (format: "2d", "4h", "1d 2h")
- `summary` : Titre du ticket

**Exemple** :
```json
PUT /rest/api/3/issue/TVSMART-123
{
  "fields": {
    "customfield_10016": 5,
    "timetracking": {
      "originalEstimate": "2d"
    }
  }
}
```

---

### POST `/rest/api/3/issue/{ticketKey}/comment`

**Application** : Pointing Poker

**Description** : Ajouter un commentaire a un ticket.

**Format du body** (Atlassian Document Format) :
```json
{
  "body": {
    "type": "doc",
    "version": 1,
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Commentaire ici"
          }
        ]
      }
    ]
  }
}
```

---

### GET `/rest/api/3/search/jql`

**Application** : Delivery

**Description** : Rechercher des tickets via JQL (query string).

**Parametres** :
| Parametre | Description |
|-----------|-------------|
| `jql` | Requete JQL |
| `fields` | Champs a retourner (separes par virgule) |
| `maxResults` | Nombre max de resultats |

**Exemple** :
```bash
GET /rest/api/3/search/jql?jql=project=TVSMART&fields=summary,status&maxResults=100
```

---

### POST `/rest/api/3/search/jql`

**Application** : Pointing Poker

**Description** : Rechercher des tickets via JQL (body JSON).

**Body** :
```json
{
  "jql": "project in (TVSMART, TVORA) AND sprint ~ \"Refinement\"",
  "fields": ["key", "summary", "customfield_10016"],
  "maxResults": 100
}
```

---

### GET `/rest/api/3/field`

**Application** : Pointing Poker

**Description** : Lister tous les champs JIRA disponibles.

**Usage** : Trouver l'ID du champ Story Points (peut varier selon l'instance).

---

## API Agile v1 (`/rest/agile/1.0/`)

### GET `/rest/agile/1.0/board`

**Application** : Delivery

**Description** : Lister tous les boards Scrum/Kanban.

**Parametres optionnels** :
| Parametre | Description |
|-----------|-------------|
| `name` | Filtrer par nom de board |
| `projectKeyOrId` | Filtrer par projet |

**Exemples** :
```bash
GET /rest/agile/1.0/board
GET /rest/agile/1.0/board?name=TVSMART
GET /rest/agile/1.0/board?projectKeyOrId=TVSMART
```

---

### GET `/rest/agile/1.0/board/{boardId}/sprint`

**Applications** : Delivery, Pointing Poker

**Description** : Lister les sprints d'un board.

**Parametres** :
| Parametre | Description |
|-----------|-------------|
| `state` | Filtre par etat : `active`, `future`, `closed` |

**Exemple** :
```bash
GET /rest/agile/1.0/board/123/sprint?state=active,future
```

---

### GET `/rest/agile/1.0/sprint/{sprintId}/issue`

**Application** : Delivery

**Description** : Recuperer tous les tickets d'un sprint.

**Parametres** :
| Parametre | Description |
|-----------|-------------|
| `fields` | Champs a retourner |

**Exemple** :
```bash
GET /rest/agile/1.0/sprint/456/issue?fields=summary,status,customfield_10016
```

---

### POST `/rest/agile/1.0/sprint/{sprintId}/issue`

**Application** : Pointing Poker

**Description** : Deplacer un ou plusieurs tickets vers un sprint.

**Body** :
```json
{
  "issues": ["TVSMART-123", "TVSMART-124"]
}
```

**Usage** : Deplacer vers sprint "A planifier" ou "Cadrage" apres estimation.

---

## Champs personnalises JIRA

| Champ | ID | Type | Description |
|-------|-----|------|-------------|
| Story Points | `customfield_10016` | Number | Points d'estimation Scrum |
| Sprint | `customfield_10020` | Array | Liste des sprints assignes |
| Time Tracking | `timetracking` | Object | Estimation et temps passe |
| Fix Versions | `fixVersions` | Array | Versions de release |

### Structure du champ Sprint (`customfield_10020`)

```json
[
  {
    "id": 123,
    "name": "Sprint 2026-01",
    "state": "active"
  }
]
```

### Structure du champ Time Tracking

```json
{
  "originalEstimate": "2d",
  "originalEstimateSeconds": 57600,
  "remainingEstimate": "1d",
  "remainingEstimateSeconds": 28800,
  "timeSpent": "4h",
  "timeSpentSeconds": 14400
}
```

---

## Requetes JQL utilisees

### Delivery Board

**Tickets des sprints actifs** :
```sql
project = {projectKey}
AND sprint in openSprints()
AND statusCategory != Done
AND issuetype NOT IN ("Test Set", "Test", "Test Execution", "Anomalie", "Bug")
ORDER BY rank
```

**Tickets des sprints speciaux** (Refinement, Cadrage, A planifier) :
```sql
project = {projectKey}
AND sprint is not EMPTY
AND statusCategory != Done
AND issuetype NOT IN ("Test Set", "Test", "Test Execution", "Anomalie", "Bug")
ORDER BY rank
```
Puis filtrage cote serveur sur le nom du sprint.

**Versions avec issues** :
```sql
project = {projectKey}
AND fixVersion IS NOT EMPTY
AND issuetype in (Story, Recit)
ORDER BY fixVersion DESC
```

### Pointing Poker

**Tickets a estimer** (sprint Refinement, sans Story Points) :
```sql
project in (TVSMART, TVORA, TVFREE, TVSFR)
AND sprint ~ "Refinement"
AND "Story Points" is EMPTY
AND issuetype in (Story, Task)
ORDER BY project, key
```

---

## Fonctionnalites par application

### Delivery Board

| Fonctionnalite | Endpoints utilises |
|----------------|-------------------|
| Afficher tickets du sprint | `GET /board`, `GET /board/{id}/sprint`, `GET /sprint/{id}/issue` |
| Recherche JQL | `GET /search/jql` |
| Recuperer versions | `GET /search/jql` avec filtre fixVersion |

### Pointing Poker

| Fonctionnalite | Endpoints utilises |
|----------------|-------------------|
| Charger ticket | `GET /issue/{key}` |
| Sauvegarder estimation | `PUT /issue/{key}` |
| Rechercher tickets a estimer | `POST /search/jql` |
| Marquer "a retravailler" | `PUT /issue/{key}`, `POST /issue/{key}/comment` |
| Deplacer vers sprint | `POST /sprint/{id}/issue` |
| Trouver sprint Cadrage/A planifier | `GET /board`, `GET /board/{id}/sprint` |

---

## Gestion des erreurs

### Codes HTTP courants

| Code | Description | Action |
|------|-------------|--------|
| 200 | Succes | - |
| 204 | Succes (sans contenu) | PUT reussi |
| 400 | Requete invalide | Verifier JQL ou body |
| 401 | Non authentifie | Verifier credentials |
| 403 | Acces refuse | Verifier permissions |
| 404 | Ressource non trouvee | Ticket/Board/Sprint inexistant |
| 429 | Rate limit | Attendre et reessayer |

### Exemple de gestion d'erreur

```typescript
if (!response.ok) {
  const error = await response.text();
  throw new Error(`JIRA API Error: ${response.status} - ${error}`);
}
```

---

## Limites et bonnes pratiques

1. **Rate limiting** : JIRA Cloud limite a ~100 requetes/minute
2. **Pagination** : Utiliser `startAt` et `maxResults` pour les grandes listes
3. **Champs** : Toujours specifier les champs necessaires pour optimiser les performances
4. **Cache** : Mettre en cache les donnees statiques (boards, sprints)

---

## References

- [JIRA Cloud REST API v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [JIRA Software Cloud REST API (Agile)](https://developer.atlassian.com/cloud/jira/software/rest/)
- [JQL Reference](https://support.atlassian.com/jira-software-cloud/docs/advanced-search-reference-jql-fields/)
- [Atlassian Document Format](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/)
