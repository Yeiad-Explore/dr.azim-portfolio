# BUILD-PLAN.md — phases for Claude Code

Work the phases in order. Each phase ends with a verifiable checkpoint. Do not start motion before Phase 3 is signed off frozen.

## Phase 0 — Scaffold (≈15 min)
- `npm create vite@latest . -- --template react-ts`, install Tailwind v4, GSAP, @gsap/react, lenis.
- Add `src/styles/tokens.css` with the tokens from CLAUDE.md; wire `@theme`.
- Self-host Fraunces (variable), Space Grotesk (variable), IBM Plex Mono 400 in `/public/fonts`, declare `@font-face`.
- Checkpoint: `npm run dev` renders a token test page — every color/typeface visible, no defaults leaking.

## Phase 1 — Content skeleton
- Build `Chapter.tsx` shell: left gutter (trace column, 64px, reserved), beat label row ([mono] timestamp + chapter label), oversized ghost numeral (aria-hidden) overlapping the headline, content slot.
- Pour ALL copy from CONTENT.md into 8 sections in order. Semantic: `<header>`, `<main>`, `<section aria-labelledby>`, `<footer>`.
- Checkpoint: full page reads top-to-bottom as clean longform. Every fact spot-checked against CONTENT.md.

## Phase 2 — Layout & type system
- Type scale ≥ 1.25 ratio; display serif only on chapter headlines + hero; measure 60–75ch; asymmetric grid (content sits off-center right of the trace gutter).
- Vitals flowsheet: table in the `--bg-well` pink well with a faint SVG grid background *inside the well only* (4px minor / 20px major lines at ~6% opacity — ECG paper).
- References as two-column consult note with 1px dividers.
- Buttons/links: underline offset + accent, square-ish (radius 4px), no fills except the one primary CTA.
- Responsive 360→1920: gutter collapses on mobile, numerals shrink behind text, table becomes stacked rows.
- Checkpoint: screenshots at 360/768/1440. The frozen page must already look finished. **Stop and show the user.**

## Phase 3 — The signature: ECG trace
- One `<svg>` per section in the gutter, paths hand-authored: flatline (hero, pre-load), sinus rhythm (triage, history), sharper complexes + one VT-like burst (the floor), settling rhythm (consult → handover).
- Draw technique: `stroke-dasharray/dashoffset`, each segment scrubbed by its section's ScrollTrigger (`scrub: 0.5`). Cap total path length per segment so interpolation is cheap.
- Hero load sequence (the ONLY timeline animation): page settles → flatline draws → single beat fires → name reveals via masked line, ≤ 1.6s total.
- `ShiftClock.tsx`: fixed bottom-left mono clock; on each section's `onEnter/onEnterBack`, tween displayed time to that beat's timestamp. `aria-hidden`.
- Reduced motion: guard in `lib/motion.ts` — kill Lenis, render all paths at dashoffset 0, clock static at 23:41.
- Checkpoint: scroll the full page — trace draws continuously, no jank in devtools performance trace, reduced-motion verified via emulation.

## Phase 4 — Scroll reveals & micro-interactions
- Reveals: opacity + 16px translateY, once, `--ease-out`, stagger 60ms within a section. That's all.
- Link hover: underline thickens + ink→accent, 160ms. Focus: 2px accent outline offset 2px.
- Checkpoint: no element animates more than once except trace/clock; nothing loops.

## Phase 5 — QA & ship
- Run the CLAUDE.md definition-of-done checklist line by line.
- `npm run build`; Lighthouse mobile (perf ≥ 90, a11y ≥ 95); axe pass; keyboard-only walkthrough.
- Grep the diff for `box-shadow|backdrop|gradient|scale-105` — must be clean (focus-visible outlines excepted).
- Chanel rule: remove one thing.
- Deliver: build output + one-paragraph handover note listing anything unverified.

## Explicitly out of scope
Dark mode, CMS, blog, appointment booking, i18n, Three.js, photo galleries. If asked mid-build, note it and keep going.
