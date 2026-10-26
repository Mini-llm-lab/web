# backend

API Go du chat (bibliothèque standard, streaming SSE).

```sh
go run .                 # écoute sur PORT (défaut 8080), fournisseurs non configurés
INFERENCE_PROVIDER=fake go run .   # mode test : stream simulé token par token
go test ./... && go vet ./...
go build -o backend .
```

Structure :

- `internal/config` — configuration par variables d'environnement ;
- `internal/httpapi` — routes `/api/health`, `/api/models`, `/api/chat` + écriture SSE ;
- `internal/inference` — interface `Provider` + `Unconfigured` (erreur explicite) + `Fake` (mode test) ;
- `internal/models` — registre des trois Mini-LLM ;
- `internal/middleware` — CORS, rate limiter mémoire, recovery de panique.

Voir le README racine pour les variables d'environnement, le contrat SSE et l'état réel de l'intégration RunPod.
