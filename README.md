# Mini Web

Interface web pour discuter avec les modèles Mini-LLM (`GautierP/MiniLLM-40M`, `MiniLLM-70M`, `MiniLLM-150M`). Nom provisoire.

Deux projets indépendants dans un seul dépôt git :

- `frontend/` — application SvelteKit (TypeScript, Tailwind 4, Bun), cible de déploiement Cloudflare Workers ;
- `backend/` — API Go qui expose le chat en streaming SSE et route vers le fournisseur d'inférence.

Les conversations restent dans le `localStorage` du navigateur : pas de base de données ni de comptes en v1.

## Prérequis

- [Bun](https://bun.sh) 1.4+
- Go 1.27 (backend, nom de module `github.com/GautierP/web/backend`)

## Lancer en dev

Backend (à la racine du service, port 8080 par défaut) :

```sh
cd backend
INFERENCE_PROVIDER=fake go run .        # mode test : stream simulé, aucune vraie génération
```

Frontend (Bun) :

```sh
cd frontend
bun install
bun run dev   # http://localhost:5173
```

Le CORS du backend accepte par défaut `http://localhost:5173`.

## Vérifications

```sh
cd backend && go test ./... && go vet ./... && go build ./...
cd frontend && bun run check && bun run lint && bun run test && bun run build
```

## Variables d'environnement

Backend (voir `backend/.env.example`) :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PORT` | `8080` | Port d'écoute |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origines autorisées, séparées par des virgules |
| `INFERENCE_PROVIDER` | vide | `fake` pour le mode test ; vide = erreur explicite « non configuré » |
| `RUNPOD_API_KEY` | vide | Secret, jamais exposé au client ni dans les logs |
| `MAX_BODY_BYTES` | 1 Mo | Taille maximale du corps JSON |
| `MAX_MESSAGES` | 64 | Messages max par requête |
| `MAX_MESSAGE_CHARS` | 8000 | Caractères max par message |
| `MAX_TOKENS` | 512 | Bornes de `max_tokens` |
| `REQUEST_TIMEOUT_SECONDS` | 120 | Durée max d'une génération |
| `RATE_LIMIT_BURST` / `RATE_LIMIT_PER_SECOND` | 20 / 0.5 | Rate limiting mémoire par IP |

Frontend (voir `frontend/.env.example`) :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | `http://localhost:8080` | URL de l'API Go |

## Modèles

La liste vient de `GET /api/models` (`minillm-40m`, `minillm-70m`, `minillm-150m`). Les tokenizers et contextes diffèrent (32k/1024, 16k/512, 32k/512) : le modèle utilisé est mémorisé par conversation et changé au début de chaque génération, pas au milieu.

**⚠️ Disponibilité provisoire :** les trois modèles sont marqués `available: true` pour le développement local. Aucun endpoint d'inférence RunPod n'est branché : sans `INFERENCE_PROVIDER=fake`, le backend renvoie un événement SSE `error` (`not_configured`) et l'interface l'affiche proprement. La liste des informations RunPod manquantes figure en bas de ce README.

## Contrat du streaming (`POST /api/chat`)

Format SSE, un seul flux :

```text
event: start
data: {"requestId":"..."}

event: delta
data: {"text":"fragment"}

event: done
data: {"finishReason":"stop"}
```

ou, en cas de problème :

```text
event: error
data: {"code":"not_configured","message":"..."}
```

Codes d'erreur possibles : `not_configured`, `generation_failed`, `invalid_request`, `invalid_messages`, `unknown_model`, `rate_limited` (HTTP 429). Le corps de la requête : `{ "model": "minillm-150m", "messages": [{"role":"user","content":"..."}], "max_tokens": 512, "temperature": 0.7 }` — les rôles acceptés sont `user` et `assistant`, tout le reste est rejeté.

## Limitations connues

- Aucune génération réelle : l'adaptateur d'inférence (RunPod) reste à brancher.
- Rate limiter en mémoire : ne protège pas plusieurs instances.
- Les conversations sont locales au navigateur (peuvent être effacées par l'utilisateur) et ne sont pas chiffrées.
- Le texte envoyé n'est stocké que côté client ; le backend ne conserve aucune conversation.
- Le renforcement anti-abus public (Turnstile, quotas) est à traiter avant une ouverture publique.

## À configurer pour brancher l'inférence réelle

Informations nécessaires (non disponibles aujourd'hui) : protocole du worker RunPod (endpoint, auth, format des requêtes/réponses), mécanisme de streaming réel, paramètres acceptés par le moteur, mode d'annulation côté fournisseur, topologie (un endpoint multi-modèles ou trois endpoints). L'interface Go `internal/inference.InferenceProvider` est prête à recevoir l'adaptateur.
