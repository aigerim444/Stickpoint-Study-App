---
name: Stickpoint build and deploy flow
description: How to get changes in index.html live in production
---

The build script just does `cpSync('public','dist/public',{recursive:true})`. The deployment static handler serves from `artifacts/claude-design/dist/public`. After any change to `artifacts/claude-design/public/index.html`, run:

```
pnpm --filter @workspace/claude-design run build
```

Then the user must redeploy via the Publish button (or SuggestUserAction deploy).

**Why:** The dev workflow serves from `public/` directly, but production serves the `dist/public/` copy. Skipping the build means production gets the old file.

**How to apply:** Always run build + suggest redeploy when finishing a session that touched index.html or stickpoint-content.js.
