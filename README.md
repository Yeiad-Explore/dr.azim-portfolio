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

## Appointment booking

`src/components/BookingDesk.tsx` is a stepped booking form, not a chat. A date
is the one value in this flow that must not be guessed — "next Tuesday evening"
parsed slightly wrong books the wrong slot and nobody notices until the patient
arrives — so it collects structured values and no model is involved. The
assistant answers questions; this books.

`api/booking.ts` proxies to the n8n webhook. The browser never sees the webhook
URL or its token, which matters here because the payload carries a patient's
name, phone, email, and what they want to be seen for.

### The contract

Both halves agree on exactly this; the types are exported from `api/booking.ts`.

Request (POST to the n8n webhook):

```json
{
  "requestId": "uuid",
  "patient": { "name": "...", "phone": "01712345678", "email": "..." },
  "service": "Cardiac consultation",
  "preferred": { "start": "2026-09-01T18:00:00+06:00", "durationMinutes": 30 },
  "notes": "optional, <=1000 chars",
  "locale": "en"
}
```

Response n8n must return:

```json
{
  "status": "confirmed" | "unavailable" | "error",
  "details": {
    "appointmentId": "...", "doctor": "...", "service": "...",
    "start": "ISO+06:00", "end": "ISO+06:00", "location": "...",
    "calendarEventId": "...",
    "notifications": { "email": "sent|failed|skipped", "sms": "sent|failed|skipped" }
  },
  "alternate_slots": [{ "start": "ISO+06:00", "end": "ISO+06:00" }],
  "message": "optional human-readable"
}
```

All times carry the `+06:00` Dhaka offset. `datetime-local` has no offset, so
the widget stamps it; n8n must not re-interpret the value as UTC.

### Mock mode

With `N8N_BOOKING_WEBHOOK_URL` unset, `/api/booking` answers from a fenced mock
in the same file: clinic hours 17:00–21:00 Dhaka, and 19:00 is always treated as
taken so the "unavailable" path is reproducible. Every mock response carries
`message: "MOCK RESPONSE — n8n webhook is not configured."`, which the UI
displays — so a mock can never be mistaken for a real booking.

### Before going to production

1. Set `N8N_BOOKING_TOKEN` and make the n8n workflow reject requests without it.
2. Only then switch `N8N_BOOKING_WEBHOOK_URL` from the test URL to production.
3. Validation is duplicated in the browser and in `api/booking.ts`. The server
   copy is the real one — the client's can be bypassed.

### The n8n workflow

Built in the connected instance, **not active** (webhook is test-mode only).

- Workflow: `Appointment Booking - Dr. Abdul Awal Bhuiyan`
- ID: `yoytmEEov218RG0g`
- Editor: https://aurokit-build-one.app.n8n.cloud/workflow/yoytmEEov218RG0g
- Test URL: `https://aurokit-build-one.app.n8n.cloud/webhook-test/booking`
- Production URL (inert until activated): `https://aurokit-build-one.app.n8n.cloud/webhook/booking`

Shape: `Booking Webhook -> Validate Request -> Input Valid?`
- false -> `Build Invalid Response -> Respond Invalid` (HTTP 422, carries `field`)
- true -> `Get Booked Slots -> Decide Slot -> Slot Free?`
  - true -> `Book Slot -> Email Confirmation -> Build Confirmed Response -> Respond Confirmed`
  - false -> `Build Unavailable Response -> Respond Unavailable`

One Google Calendar free/busy call serves both jobs: the availability check and
the next-three-slots search. `Decide Slot` parses the busy list defensively —
Google returns more than one shape depending on calendar count, and that shape
has not yet been seen against a real calendar.

`Email Confirmation` is set to `onError: continueRegularOutput` on purpose: by
that point the slot is already booked, and a mail failure must not turn a
successful booking into an error the patient never hears about. The response
reports it as `notifications.email: "failed"` instead.

### Blocked on: Google credentials

The workflow cannot run past `Get Booked Slots` until these exist. Nothing in
the n8n instance is Google-connected yet (only Supabase, LinkedIn, Azure OpenAI).

1. n8n -> **Credentials -> New -> Google Calendar OAuth2 API**, sign in as the
   account that owns the doctor's calendar. Open the workflow and attach it to
   both `Get Booked Slots` and `Book Slot`.
2. n8n -> **Credentials -> New -> Gmail OAuth2**, same account. Attach it to
   `Email Confirmation`.
3. Replace the calendar ID on **both** Google Calendar nodes. They currently
   read `REPLACE-WITH-REAL-ID@group.calendar.google.com`, which is a deliberate
   placeholder — it is shape-valid so the graph passes n8n's pre-flight check,
   and cannot resolve to a real calendar. (n8n rejects the literal `primary`.)
4. Clinic hours are hard-coded as 17:00-21:00 Asia/Dhaka in `Decide Slot`.
   Change `OPEN` / `CLOSE` there if that is wrong.

### Going live

In this order, not any other:

1. Attach credentials, set the real calendar ID.
2. Point `N8N_BOOKING_WEBHOOK_URL` at the **test** URL, click "Test workflow" in
   n8n, and run one booking from the site. Confirm the event lands on the right
   calendar and the email arrives.
3. Set `N8N_BOOKING_TOKEN` in Vercel, and add a matching check in the workflow
   (Webhook node -> Authentication -> Header Auth) so unauthenticated calls are
   rejected. The proxy already sends `Authorization: Bearer <token>` whenever
   that variable is set.
4. Only then activate the workflow and switch `N8N_BOOKING_WEBHOOK_URL` to the
   production URL.
