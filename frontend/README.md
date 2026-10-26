# frontend

Application SvelteKit de chat (TypeScript strict, Tailwind 4, Bun), orientée Cloudflare Workers (`@sveltejs/adapter-cloudflare`).

```sh
bun install
bun run dev          # serveur de dev
bun run build        # build production (adapter-cloudflare)
bun run check        # svelte-check
bun run lint         # prettier + eslint
bun run test         # vitest
bun run format       # prettier --write
```

L'API est atteinte via `PUBLIC_API_BASE_URL` (défaut `http://localhost:8080`). Les conversations sont persistées dans `localStorage` (clé `miniweb:conversations`, version `miniweb:schema-version`).

Voir le README racine pour le contrat SSE et les variables backend.
