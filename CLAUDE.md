# CLAUDE.md — Dr. Abdul Awal Bhuiyan portfolio ("The Golden Hour")

You are building a story-driven portfolio site for an emergency physician. This file is law. Read `docs/CONCEPT.md`, `docs/CONTENT.md`, and `docs/BUILD-PLAN.md` before writing any code.

## What this site is

One page. One continuous scroll. The visitor moves through a short emergency shift (21:47 → 23:41): prologue, current practice, registration, contact. The signature element is a single ECG trace, drawn by scroll, running the full height of the page. Nothing else on the page is loud. This is a lite professional chart, not a full CV.

## Stack (fixed — do not substitute)

- Vite + React 19, TypeScript
- Tailwind CSS v4 — all tokens as CSS custom properties in `:root`, consumed via `@theme`
- GSAP 3 + ScrollTrigger for all scroll-bound motion; Lenis for smooth scroll, wired into ScrollTrigger's ticker
- Three.js for exactly one WebGL set-piece: the anatomical heart band between *Practice* and *Chart*. Imported **dynamically** behind an IntersectionObserver so it contributes 0KB to first paint; tree-shaken core only, no `examples/jsm` grab-bag. This supersedes the earlier blanket 3D ban (owner decision, 2026-08-22) and licenses no other 3D anywhere on the page
- Fonts self-hosted via `@font-face`, `font-display: swap`: display serif (Fraunces variable), body grotesk (Space Grotesk variable), mono (IBM Plex Mono, 400 only)

## Design tokens (define once in `src/styles/tokens.css`)

```css
:root {
  --bg: oklch(0.97 0.008 80);          /* paper */
  --bg-raised: oklch(0.99 0.006 80);
  --bg-well: oklch(0.955 0.015 25);    /* faint ECG-paper pink, section wells only */
  --border: oklch(0.88 0.012 60);
  --border-strong: oklch(0.74 0.015 60);
  --ink: oklch(0.20 0.01 40);
  --ink-secondary: oklch(0.44 0.012 40);
  --ink-faint: oklch(0.60 0.01 40);
  --accent: oklch(0.60 0.21 30);       /* arterial red — trace, links, focus */
  --accent-ink: oklch(0.985 0.005 80);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 160ms; --dur-base: 450ms; --dur-slow: 900ms;
}
```

Dark mode: not in scope. One theme, done excellently.

## Hard rules (non-negotiable)

1. **Banned everywhere:** box-shadows/drop-shadows (focus rings excepted), backdrop-blur, any gradient, emoji, icon-grid "feature" rows, hover:scale, infinite float/pulse loops, blob or dotted-grid backgrounds, pill gradient buttons, border-radius > 8px, lorem ipsum, and the words "passionate", "dedicated", "seamless", "journey" (as filler), "empower".
2. **One signature, one satellite.** The ECG trace is the signature. The WebGL heart is permitted as its resolution, not its rival: it lives in its own beat, is driven by the same scroll progress as the QRS spike, and renders as contour lines in ink and accent — never a photoreal glossy organ. Nothing else animated joins them.
3. **Copy comes from `docs/CONTENT.md` verbatim.** Do not invent facts, do not embellish medical claims, do not add testimonials. Real registration numbers, real dates only.
4. **Static first.** Build the entire page with zero animation and get sign-off on the frozen layout before any GSAP import. The page must read as excellent editorial longform with JS disabled.
5. **Motion budget:** animate only `transform`, `opacity`, `stroke-dashoffset`. One load sequence (hero). Scroll reveals travel 8–24px, fire once, ease-out only. The trace and timestamp clock are the only scrubbed elements.
6. **`prefers-reduced-motion`:** trace renders fully drawn, clock shows final values, reveals become plain fades or nothing. Implement from the first animation commit, not as a patch.
7. **Accessibility:** semantic landmarks, h1→h2 order matching chapters, visible 2px accent focus outlines, contrast ≥ 4.5:1 body, keyboard reaches everything. The timestamps are `aria-hidden` (decorative); real dates live in visible text.
8. **Performance:** ≤ 200KB gz JS at first paint — the Three.js chunk is lazy and sits outside that figure, but must itself stay ≤ 160KB gz — zero CLS from animation or imagery (pre-reserve trace column width and every image's aspect ratio), 60fps scrub (the trace path is split per-section so dashoffset interpolation stays cheap).
9. Mobile 360px first-class: trace moves from left gutter to a thin top-of-section rule variant; chapters stack; timestamps stay.

## Component map

```
src/
  components/
    EcgTrace.tsx        // the signature: per-section SVG segments, scrubbed
    ShiftClock.tsx      // fixed mono timestamp, updates per section
    Chapter.tsx         // section shell: beat label, oversized chapter numeral, content slot
    Hero.tsx            // prologue, load sequence, flatline→first beat
    Competencies.tsx    // clinical scope as an indexed list — never a card grid
    PostingRail.tsx     // appointment history on a rail: vertical → horizontal
    Vitals.tsx          // registration flowsheet (chart-paper well)
    Handover.tsx        // contact, on the inverted ink band
    Portrait.tsx        // hero portrait, warm-mono treated, aspect-ratio reserved
    HeartBand.tsx       // beat 1.5: lazy WebGL mount + static fallback still
    heart/scene.ts      // three.js scene — code-split, never statically imported
  styles/tokens.css
  lib/motion.ts         // Lenis + ScrollTrigger setup, reduced-motion guard
```

## Definition of done

- Frozen page looks intentional; nothing from the banned list in the diff
- Trace draws smoothly across all 4 beats; clock ticks per section; reduced-motion honored
- `npm run build` passes; Lighthouse perf ≥ 90 mobile; no console errors
- Every fact on the page matches `docs/CONTENT.md`

## Working style

Proceed without asking permission section by section. Pause only for: choice of the two display-font candidates, and anything destructive. Verify claims against an actual `npm run dev` / `npm run build` before saying done. Simplest version that achieves the concept — no CMS, no i18n, no extra pages.
