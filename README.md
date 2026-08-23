# Stickpoint

An AI-powered study app for high schoolers. A short diagnostic quiz finds a
student's "sticking point," matches them to evidence-based study methods, then
coaches them through studying their own material — AI-generated flashcards,
practice tests, graded explanations, and spaced-repetition drilling of what
they miss.

## Repo layout

| Path | What it is |
| --- | --- |
| `packages/core` | **Domain logic** — study methods + citations, quiz scoring, Leitner spaced repetition, progress rules. Pure TypeScript, unit-tested. The one source of truth for product behavior. |
| `artifacts/claude-design` | The current web app (single-file Claude Design export). Being rebuilt; treat as the behavioral reference. |
| `artifacts/api-server` | Express API — hardened Claude proxy (`POST /api/claude`). |
| `artifacts/stickpoint-mobile` | Expo/React Native app — the seed of the future universal (web + iOS + Android) app. |
| `artifacts/stickpoint-professor-deck`, `stickpoint-video`, `mockup-sandbox` | Pitch / marketing artifacts, not product. |
| `lib/*` | API spec, generated clients, DB scaffolding (Drizzle). |

## Getting started

```sh
corepack enable pnpm
pnpm install
pnpm run typecheck   # typecheck everything
pnpm run test        # run packages/core unit tests
```

Run the API server (needs `ANTHROPIC_API_KEY` in the environment):

```sh
pnpm --filter @workspace/api-server run dev
```

Serve the web app:

```sh
pnpm --filter @workspace/claude-design run dev
```

## Deploying to Vercel

The repo is Vercel-ready: the web app is served statically from
`artifacts/claude-design/public` (no build step — no `dist/` copy to forget),
and the Express API runs as a single serverless function via `api/index.ts`.

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
   (framework preset: **Other**; the committed `vercel.json` handles the rest).
2. Add the `ANTHROPIC_API_KEY` environment variable in the project settings —
   use a **freshly created** key, then delete the old one once the previous
   hosting is retired.
3. Deploy. `/` serves the app, `/api/claude` and `/api/healthz` serve the API.

If the deploy complains about `maxDuration`, lower the value in `vercel.json`
to your plan's limit (AI generation calls need at least ~90s).

## Engineering notes

- `replit.md` has the full repo map, deploy flow, and gotchas.
- The rebuild is happening in phases (stabilize → extract core → real backend →
  one universal app → accounts/sync). See the team's rebuild-plan document.
- Users are minors: minimize collected data, keep progress mechanics
  shame-free (no streak penalties, no public scores), and check any
  research-citing copy against the professor fact-check deck.
