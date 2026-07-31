---
name: Stickpoint web app nav bar
description: Structure of the bottom nav bar in the Stickpoint web app (public/index.html)
---

The bottom nav has **6 tabs**: TODAY, STUDY, PROGRESS, PLAN, ME, ADD.
Each tab is 16.67% wide (100/6). TUTORIAL_STEPS must use these exact widths.

Nav bar rendered height is ~38px (padding:11px top+bottom + ~16px content).
Do NOT use 54px or 20%-per-tab — these were the original bugs.

**Why:** The original TUTORIAL_STEPS used 5-column 20% widths and 54px height,
causing spotlights to land on the wrong tabs.

**How to apply:** Any time TUTORIAL_STEPS nav tab `hl` values are written,
use `width:16.67%` and left positions: 0%, 16.67%, 33.33%, 50%, 66.67%, 83.33%.
Height should be 38px.
