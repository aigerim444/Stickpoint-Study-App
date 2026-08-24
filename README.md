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

### Cutting the web app over to the Expo build

The deploy above serves the **legacy** single-file web app. The Expo app also
runs on web (`pnpm --filter @workspace/stickpoint-mobile run export:web`) and
is the long-term web app. Once you've used it enough to trust it, flip
`vercel.json`:

```jsonc
"installCommand": "corepack enable pnpm && pnpm install",
"buildCommand": "pnpm --filter @workspace/stickpoint-mobile run export:web",
"outputDirectory": "artifacts/stickpoint-mobile/dist",
```

Everything else (the `/api` function, rewrites) stays the same. Keep the
legacy app's files in the repo — they're the behavioral reference — just
stop serving them. Note: legacy-app users' progress lives in their
browser's localStorage under a different key, so testers start fresh on the
new web app (accounts in Phase 4 fix this class of problem for good).

## Accounts & sync (Phase 4)

Accounts are optional at every layer — with none of the env vars below set,
the app runs local-only and every accounts surface disappears.

Setup (~15 min, one time):

1. Create a free project at [supabase.com](https://supabase.com) (used for
   **auth only** — email one-time codes; we never store passwords).
   In Authentication → Providers, leave Email enabled; no other providers
   needed.
2. Get a Postgres database. Easiest: use the same Supabase project's
   database (Settings → Database → connection string, use the *pooler* URI
   for serverless hosts).
3. Push the schema: `DATABASE_URL=... pnpm --filter @workspace/db run push`
4. Set the environment variables:

| Variable | Where | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | API server | AI features |
| `DATABASE_URL` | API server | sync, analytics, quotas |
| `SUPABASE_URL` | API server | verifying sign-in tokens |
| `SUPABASE_ANON_KEY` | API server | verifying sign-in tokens |
| `SUPABASE_SERVICE_ROLE_KEY` | API server | deleting auth users on account deletion (optional but recommended) |
| `AI_DAILY_CALL_CAP` | API server | per-user daily AI budget (default 300) |
| `EXPO_PUBLIC_SUPABASE_URL` | app build | enables the accounts UI |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | app build | enables the accounts UI |
| `EXPO_PUBLIC_API_URL` | app build | API origin (omit when same-origin) |

How it behaves: students sign in with a 6-digit email code, their progress
snapshot syncs to the server (last-write-wins across devices), and the
Progress tab gains **Export my data** and **Delete my account** (deletion is
immediate, cascades through all rows, and removes the auth identity when the
service-role key is present). Signed-in users also get a durable daily AI
call budget on top of the per-IP rate limit.

The privacy policy lives in the app at `/privacy` — **review it and add a
contact email before public launch.**

## Engineering notes

- `replit.md` has the full repo map, deploy flow, and gotchas.
- The rebuild is happening in phases (stabilize → extract core → real backend →
  one universal app → accounts/sync). See the team's rebuild-plan document.
- Users are minors: minimize collected data, keep progress mechanics
  shame-free (no streak penalties, no public scores), and check any
  research-citing copy against the professor fact-check deck.
