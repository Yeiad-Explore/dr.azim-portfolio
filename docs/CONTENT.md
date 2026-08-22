# CONTENT.md — every word on the site

Copy is design material. Use these exactly. Mono-voice lines (timestamps, IDs, vitals) are marked `[mono]`. The page is a short professional chart, not a full CV: current practice, registration, contact.

---

## 0 · Prologue — 21:47 INCOMING

[mono] 21:47 — INCOMING

# Abdul Awal Bhuiyan
Emergency physician, Dhaka.

The kind of doctor you meet on the worst day of your life, and are glad you did.

[mono] BMDC A-119798 · MRCEM (SBA) · Labaid Cardiac Hospital

CTA: **View practice**

---

## 1 · Practice — 22:10 · Current work

Chapter label: PRACTICE

**On the emergency floor.**

Cases at Labaid Cardiac Hospital arrive mid-crisis, not mid-checkup. Dr. Abdul Awal Bhuiyan works critical medical emergencies and trauma, resuscitation, and critical care.

Note for the builder: he is an emergency physician, not a cardiologist. Copy should lead with resuscitation, triage, and stabilization — cardiac cases are one category of emergency he handles, not his specialty. Never phrase his work as if he performs cardiology procedures (e.g. angioplasty, stenting) himself.

Two and a half years at Unity Aid Hospital first. Labaid Cardiac Hospital from September 2025.

[mono] 05.01.2023 → 13.09.2025 · Emergency Medical Officer, Unity Aid Hospital
[mono] 14.09.2025 → present · Emergency Medical Officer, Labaid Cardiac Hospital

---

## 1.5 · Circulation — 22:26 · The heart band

No chapter numeral — this beat carries the WebGL set-piece, not a chapter.

Chapter label: CIRCULATION

**The organ the whole shift is organized around.**

Every beat below the trace is a contraction. In an arrest, the job is to buy back the ones the patient can no longer make.

[mono] SCHEMATIC · NOT A DIAGNOSTIC IMAGE

The caption is not decoration. The model is a generated schematic, not imaging, and a physician's site must not imply otherwise.

---

## 2 · Chart — 22:40 · Registration

Chapter label: CHART

**Registration.** (rendered as a flowsheet in the ECG-paper well)

| Field | Value |
|---|---|
| BMDC | A-119798 |
| MRCEM | Primary 2024 · SBA 2026 |
| RCEM | Associate Member 65948 |
| EUSEM | Member M-06873 |
| MBBS | Mugda Medical College, University of Dhaka, 2021 |

---

## 3 · Handover — 23:41 · Contact

Chapter label: HANDOVER

**The shift never really ends.**

For appointments, referrals, or opportunities in emergency medicine, reach him between patients.

[mono] CALL — 01878 800 520
[mono] WRITE — awalabdul38@gmail.com
[mono] FIND — Labaid Cardiac Hospital, Dhaka

Footer: oversized outlined wordmark "A.A.B" · © 2026 Dr. Abdul Awal Bhuiyan · [mono] END OF SHIFT — 23:41

---

## Assistant — the docked panel

Fixed strings. These are markup, not model output, and must render even when the
API is down. Changing them changes a safety surface.

Trigger: **ASK** / **CLOSE**
Panel label: [mono] AUTOMATED ASSISTANT
Standing banner: [mono] EMERGENCY? CALL 999 NOW — DO NOT WAIT FOR A REPLY HERE

Opening line: I am an automated assistant on Dr. Bhuiyan's site, not a doctor and
not him. I cannot diagnose or tell you how serious something is. If someone is in
danger now, call 999. Otherwise, ask me what to do while help is on the way, or
about his practice.

Failure line: The assistant is unavailable. If this is an emergency, call 999 now
or go to your nearest emergency department.

Footer: [mono] Automated. Not medical advice, not a diagnosis, and not monitored
by Dr. Bhuiyan.

Hotlines the agent may give live in `api/_prompt.ts` → `HOTLINES`. Verify them
against the current published numbers before launch; a stale emergency number is
worse than none.

---

## Off the page (kept on file, not rendered)

School history, internship, short courses, exams in preparation, and referee names/numbers live in the source CV. They are not published on this site.

---

## Notes for the builder

- Never call him "Azim bhaia" on the site — that's the file name, not his name.
- Phone/email/IDs must match exactly what's above.
- No stock photos, no stethoscope clip-art. His own portrait runs in the hero (`public/img/portrait-*.webp`, warm-mono treated); any further imagery must likewise be his, not stock.
- Portrait alt text describes what is in the frame and claims no location — the photo's setting is not a fact on file.
