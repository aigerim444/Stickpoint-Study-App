---
name: Stickpoint architecture
description: Core structure of the Stickpoint app — where code lives, how the AI call chain works, key patterns.
---

Single-file frontend: `artifacts/claude-design/public/index.html` (~5080 lines).
API server: `artifacts/api-server` proxies to claude-sonnet-4-5 (hardcoded, supports vision).
Build: `pnpm --filter @workspace/claude-design run build` (copies public → dist/public).

## Key patterns
- `this.update(patch)` = setState + setTimeout persist. Does NOT accept a callback.
- `this.setState(patch, cb)` when a callback is needed after state change.
- `appRenderVals()` returns all template bindings. Every new state key + method needs an entry here.
- `addXp(n)` now also sets `xpAnimKey` + `xpAnimVal` for the floating +⭐ animation; clears after 1.4s.
- `playSound(type)` uses Web Audio API — types: `'correct'` (2-tone), `'complete'` (4-tone fanfare), `'star'` (3-tone sparkle). Gated by `soundOn` state.
- Per-material progress keys: `missedBank`, `ptHistory`, `materialTopMethods`, `savedTopMethods` — saved/restored in `saveToLibrary` / `switchMaterial`.
- `mathNoticeSeen` still in state but not the primary gate — `materialTopMethods === null` controls math popup.

## Tabs (6 total)
TODAY | STUDY | PROGRESS | PLAN | 👤 ME | ➕ ADD
- "ME" tab (`profile`) holds: name/age edit, sound toggle, daily reminder email, replay tour, share.
- Progress tab was decluttered — email/replay/share moved to ME tab.

## Overlays (absolute-positioned, z-index order)
- Tutorial: z-50
- Math notice: z-22
- Age prompt: z-24
- PT Celebration: z-65 (score ≥ 80% after practice test)
- Restart confirm: z-70
