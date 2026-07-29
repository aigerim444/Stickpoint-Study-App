---
name: Stickpoint renderVals scope bug pattern
description: Variables in renderVals() are not visible in appRenderVals()
---

The component has two separate render methods: `renderVals()` and `appRenderVals()` (called via spread `...this.appRenderVals()`). Variables defined inside `renderVals()` are NOT accessible inside `appRenderVals()`.

**Past incident:** `genVals` and `nullGenVals` were defined in `renderVals()` but used only in `appRenderVals()`. Everything in renderVals worked fine (welcome screen etc.), but any study screen crashed with "nullGenVals is not defined". Fix: move definitions to `appRenderVals()`.

**Why:** Two separate JS function scopes. `appRenderVals` is a method, not a closure over `renderVals`.

**How to apply:** When adding new helpers used only by study-screen UI objects (psUI, seUI, etc.), define them inside `appRenderVals()`, not `renderVals()`. Helpers used by both screens should be class methods or computed in the shared state object.
