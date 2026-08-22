# The Golden Hour

Portfolio for Dr. Abdul Awal Bhuiyan, Emergency Medical Officer, Labaid Cardiac
Hospital, Dhaka. One page, one continuous scroll through an emergency shift
(21:47 → 23:41); a single scroll-drawn ECG trace is the spine.

Concept, copy, and phase plan live in [`docs/`](docs/). `docs/CONTENT.md` is the
source of truth for every fact on the page — change copy there first.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck → client bundle → SSR pass → prerender into dist/
npm run preview
```

## Notes

- `npm run build` renders the app to static HTML at build time and injects it
  into `dist/index.html`; the client hydrates. The page is complete editorial
  longform with JavaScript disabled.
- Tailwind scans `src/` only (`source(none)` + `@source` in
  `src/styles/tokens.css`). Left on auto-detect it reads the banned-list prose
  in `CLAUDE.md` as class candidates and emits shadow/blur/gradient utilities.
- Trace geometry is generated in `src/lib/ecg.ts` — one segment per beat,
  serialized for both the desktop gutter and the mobile top-of-section rule.
- All scroll motion is in `src/lib/motion.ts` and no-ops under
  `prefers-reduced-motion`.
