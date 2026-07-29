---
name: Stickpoint architecture overview
description: Key architectural facts not derivable from a quick scan
---

- **Frontend:** `artifacts/claude-design/public/index.html` — one self-contained file, ~4500 lines, custom DCLogic/StreamableLogic template system with `{{ }}` bindings, `<sc-if>`, `<sc-for>`.
- **Content/quiz data:** `artifacts/claude-design/public/stickpoint-content.js` — METHODS, MATH_METHODS, quiz scoring.
- **API backend:** `artifacts/api-server/src/routes/claude.ts` — POST /api/claude → **claude-sonnet-4-5 hardcoded**, max_tokens 8000. The model param is ignored; server always uses claude-sonnet-4-5 which supports vision (image content in messages).
- **Vision:** Pass `messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } }, { type: 'text', text: prompt }] }]` — same API, no server changes needed.
- **Persistence:** `localStorage` key `stickpoint_v1`; `persist()` is called via `update()`. Session state is intentionally NOT persisted to localStorage (ephemeral), but `savedSession`/`savedActiveMethod` on library entries are persisted.
- **Template system refs:** To get a DOM element from JS, use `document.querySelector('[data-attr]')` — no ref system exists.
- **Canvas drawing:** `_psDrawing`, `_psLastX`, `_psLastY` are class instance vars (not React state) for PS canvas.

**Why:** None of this is obvious from a code scan, and getting it wrong (e.g. assuming model can be changed, or trying to persist session) wastes time.
