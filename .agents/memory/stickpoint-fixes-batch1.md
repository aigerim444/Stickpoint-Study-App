---
name: Stickpoint UX fixes batch 1
description: Key bugs fixed and new features added in a bulk session
---

## Feynman false positive
Strict scoring rubric added to `submitFeynman` prompt. Off-topic or wrong explanations must score 1-2. System prompt changed from "warmly" to "strictly and accurately".

## Practice test grading
- `finishPracticeTest` now runs SA grading and MC/TF explanation in **parallel** (`Promise.all`).
- SA prompt explicitly accepts abbreviations and equivalent approaches.
- Wrong MC/TF questions now get AI-generated explanations via a second call.
- New `ptOverrideCorrect(idx)` method: sets verdict to 'correct', removes from missedBank.
- `ptUI.reviewRows` entries now include `canOverride` (true for wrong SA), `overrideCorrect` fn, `idx`.

## Math popup — preserve quiz results
`closeMathNotice` now saves current `topMethods` (quiz results) as `materialTopMethods` so the math auto-default never overrides the user's choice on this material.

**Why:** `_currentTop3()` falls back to `MATH_METHODS` when `materialTopMethods === null && isMath`. Explicitly setting it on dismiss locks the quiz results in.

## Tutorial before math popup
`startStudying`: only shows math popup if tutorial already seen; otherwise shows it after tutorial.
`appTourNext` / `appTourSkip`: trigger math popup 350ms after tutorial ends if applicable.

## goElsewhereWhileLoading fallback
Changed fallback from `today` tab to first non-current topMethod. Keeps students in study flow.

## Missed items count
Progress drill button now shows `bankCount` (total bank items) instead of `dueCount` (due now). Fixes confusing "0 missed items" when items exist but aren't due yet.

## Elaborative prompt
EI `extractEIFacts` prompt now explicitly instructs: facts/model_answers must be grounded in the student's notes only; connection questions reference these notes specifically.

## Problem sets back button
`← SKILLS` button added to both phaseSolve and phaseMarked UI sections. Uses existing `psBackToSkills` method.
