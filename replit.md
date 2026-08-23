# Stickpoint

An AI-powered study app for high schoolers: a diagnostic quiz finds a student's
"sticking point," matches them to evidence-based study methods (active recall,
blurting, practice testing, Feynman, self-explanation, elaborative
interrogation, Pomodoro, problem sets), then coaches them through studying
their own material with AI-generated cards, tests, and grading.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/claude-design run dev` — serve the web app (static, from `public/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/stickpoint-mobile run dev` — Expo dev server for the mobile app
- Required env: `ANTHROPIC_API_KEY` (Replit Secrets). Optional: `ALLOWED_ORIGINS`
  (comma-separated) to allow cross-origin browser access to the API — unset means
  same-origin only.

## Where things live

- **Web app (the real product):** `artifacts/claude-design/public/index.html` —
  a single ~5,100-line file (Claude Design export). One `Component` class holds all
  state, logic, and templates. `public/stickpoint-content.js` has offline helpers;
  `public/support.js` is the Claude Design runtime.
- **API server:** `artifacts/api-server` — Express 5. One real route,
  `POST /api/claude`, proxies to the Anthropic API with rate limiting, body
  validation, a model allowlist (`haiku`/`sonnet`), and a `max_tokens` cap.
- **Mobile app:** `artifacts/stickpoint-mobile` — Expo/React Native reimplementation
  of the same product. Currently a *separate parallel implementation* — behavior can
  drift from the web app.
- **Pitch/marketing artifacts (not product):** `stickpoint-professor-deck`,
  `stickpoint-video`, `mockup-sandbox`, `stickpoint-pitch.html`.
- **Scaffolding, mostly empty:** `lib/db` (Drizzle, no tables yet), `lib/api-spec`
  (OpenAPI, only `/healthz`), `lib/api-zod`, `lib/api-client-react`.
- All user data is client-side: `localStorage` key `stickpoint_v1` (web),
  AsyncStorage `stickpoint_mobile_v1` (mobile). No database, no accounts.

## Build & deploy (web app)

The build script just copies `public/` → `dist/public/`, and production serves the
`dist/public/` copy. **After any change to `public/index.html` or
`public/stickpoint-content.js`:**

```
pnpm --filter @workspace/claude-design run build
```

then redeploy via the Publish button. Dev serves `public/` directly, so skipping
the build means production keeps the old file.

## Architecture decisions

- The web app is intentionally a single file (Claude Design export) until the
  planned rebuild consolidates web + mobile into one Expo codebase.
- AI calls: `callAI(prompt, system, model, maxTokens)` requests `'haiku'` for
  grading (cheap) and `'sonnet'` for generation. The server maps these aliases to
  real model IDs and ignores anything else.
- The API is path-routed on the same origin as the web app, so the API sends no
  CORS headers by default — cross-origin access is opt-in via `ALLOWED_ORIGINS`.
- Client-side offline fallbacks (`stickpoint-content.js`) only activate via the
  explicit `forceOfflineGrading` flag, never silently on API failure.
- Spaced repetition is Leitner-style: `SR_DAYS = [1, 2, 4, 7, 14]`, a miss drops
  the item back to box 0. Same constants in web and mobile.

## Gotchas

- **`renderVals()` vs `appRenderVals()` are separate scopes.** Variables defined in
  one are not visible in the other. Helpers used by study-screen UI objects must be
  defined in `appRenderVals()`; shared helpers should be class methods.
- `this.update(patch)` = setState + deferred persist; it does NOT accept a
  callback. Use `this.setState(patch, cb)` when you need one.
- Any new persisted state key must be added to the `toSave` whitelist in
  `persist()` — keys not listed silently reset on reload.
- Bottom nav has **6 tabs** at 16.67% width each; `TUTORIAL_STEPS` spotlight
  positions must use those widths and ~38px height.
- Per-material progress (`missedBank`, `ptHistory`, `materialTopMethods`) is
  saved/restored in `saveToLibrary` / `switchMaterial` — new per-material state
  needs wiring in both.
- `pnpm-workspace.yaml` enforces `minimumReleaseAge: 1440` for npm packages
  (supply-chain defense). Do not disable it.

## Product notes

- Target users are **minors** (high schoolers): minimize collected data, no shame
  mechanics (no streak penalties, no public scores), deliberately *not* an
  infinite-scroll feed.
- Research citations in app copy must match the professor fact-check deck.

## Pointers

- Rebuild plan (phases 0–5): see the team's rebuild-plan document.
- `.agents/memory/` holds session-to-session engineering notes — keep adding to it.
- See the `pnpm-workspace` skill for workspace structure and TypeScript setup.
