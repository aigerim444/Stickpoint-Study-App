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

## Engineering notes

- `replit.md` has the full repo map, deploy flow, and gotchas.
- The rebuild is happening in phases (stabilize → extract core → real backend →
  one universal app → accounts/sync). See the team's rebuild-plan document.
- Users are minors: minimize collected data, keep progress mechanics
  shame-free (no streak penalties, no public scores), and check any
  research-citing copy against the professor fact-check deck.
