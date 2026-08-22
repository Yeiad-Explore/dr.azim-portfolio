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

## The assistant

`src/components/TriageDesk.tsx` is a docked assistant backed by Azure OpenAI
through `api/chat.ts`, a Vercel function.

```bash
cp .env.example .env    # add the real key
npm run dev             # serves the site AND /api/chat
```

Vite has no serverless functions of its own, so `vite.config.ts` mounts the real
`api/chat.ts` on the dev server (`apply: 'serve'`, never in a build). Dev and
production therefore run the same handler. `npx vercel dev` also works if you
want Vercel's own routing.

**Restart the dev server after changing `.env` or `vite.config.ts`** — env vars
are read once at startup. An assistant that reports itself unavailable is
almost always a dev server started before the key existed.

### Deploying

Set these in Vercel → Project → Settings → Environment Variables. They are read
only inside the function; none of them is a `VITE_` variable and none reaches
the browser.

| Variable | Value |
|---|---|
| `AZURE_OPENAI_API_KEY` | the key — never commit it, never prefix it `VITE_` |
| `AZURE_OPENAI_ENDPOINT` | `https://studynet-ai-agent.openai.azure.com/` |
| `AZURE_OPENAI_API_VERSION` | `2025-01-01-preview` |
| `CHAT_MODEL_DEPLOYMENT` | `chat-heavy` |

To move to Netlify instead, the handler body is unchanged — it is already a
Web-standard `Request → Response`. Move the file to `netlify/functions/chat.ts`,
drop the `config` export, and add a redirect from `/api/chat`.

### Safety design

This publishes generated guidance under a named physician's registration. The
constraints below are load-bearing, not decoration — read `api/_prompt.ts`
before changing any of them.

- **The 999 line is markup, not model output.** It renders above the transcript
  before the first message and survives the API being down. When the function
  fails, the UI's error text still routes to emergency services — the assistant
  degrades to the correct answer rather than to silence.
- **The prompt never diagnoses, never grades severity, and never tells anyone to
  wait.** It routes first and asks questions afterwards, because questions cost
  minutes.
- **Every phone number the agent may say is in `HOTLINES` in `api/_prompt.ts`.**
  One block, one place to verify. The model is told it may not produce a number
  that is not in it, because a wrong emergency number is worse than none.
- **The system prompt is server-side only.** Never import `api/_prompt.ts` from
  `src/` — that would ship the whole prompt in the client bundle.
- Client-supplied `system` turns are rejected outright (400) before any upstream
  call, so a crafted request cannot sit a second instruction next to the real one.
- `temperature` is 0.3. The wording of "call 999 now" should not vary per run.
- **Azure's content filter rejects some prompts before the model runs.** A
  self-harm message is one of them, and a generic error is the worst possible
  reply to it. `filteredReply()` in `api/_prompt.ts` maps those rejections onto
  fixed replies returned as ordinary assistant turns: the crisis response is
  hard-coded in English and Bangla and cannot fail, because no model call is
  involved. Genuine upstream failures still surface as 502 — the mapping returns
  null for anything that is not a filter rejection, so real outages are not
  papered over.

### Known limits

- Rate limiting in `api/chat.ts` is an in-memory per-instance counter. It blunts
  casual abuse; it is **not** a quota, and it resets on cold start. Put Vercel's
  firewall or a shared store in front of it before this takes real traffic.
- History is capped at the last 12 turns and 2000 characters per message.
