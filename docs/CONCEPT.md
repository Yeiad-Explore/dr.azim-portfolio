# Concept — "The Golden Hour"

A portfolio for Dr. Abdul Awal Bhuiyan, Emergency Medical Officer, Labaid Cardiac Hospital, Dhaka.

## The idea

In emergency medicine, the "golden hour" is the window after a cardiac event or trauma when intervention decides everything. The site is structured as **one continuous shift** — the visitor scrolls 21:47 to 23:41 — but the chart is short. Three beats after the prologue: current practice, registration, contact. The ECG still draws. The copy does not recap a full CV. It answers the business question first (who is he, where does he work, how do I reach him) in the register of a handover note.

The reader is placed in the position of a patient's family member, a recruiter, a colleague — someone asking the only question that matters in an ER: *who is this doctor, and can I trust him?* Every section answers a piece of that.

## Why this concept fits him specifically

- He works acute **cardiac** emergencies at a cardiac hospital → the visual language of the ECG is *his* material, not decoration.
- His career is sequential (Mugda → Unity Aid → Labaid) → a short shift timeline is the honest structure, not an imposed one.
- The site ends at handover, still mid-shift: the next patient, not a fake conclusion.

## The signature (one, per fable rules)

**A single continuous ECG trace that draws itself down the entire page, bound to scroll.**

- It starts as a flatline in the hero, jumps into a normal sinus rhythm as the story begins, spikes at moments of intensity (the internship chapter, the cardiac arrest vignette), and settles into a steady rhythm at the contact section.
- Implemented as one SVG path per section segment, `stroke-dashoffset` scrubbed by ScrollTrigger. No WebGL needed — this is the kinetic-type/drawn-line class of signature, cheap, 60fps-safe, and it *is* the narrative spine.
- The trace doubles as the scroll progress indicator. No separate progress bar.
- Everything else on the page stays quiet: flat surfaces, borders, type.

## Chapter structure (sections = beats of a shift)

| Scroll beat | Shift label (mono, small) | Chapter | Real content |
|---|---|---|---|
| 0 | `21:47 — INCOMING` | Prologue | Hero. Name, role, one line, IDs. Flatline → first beat. CTA to practice. |
| 1 | `22:10 — PRACTICE` | Current work | Labaid Cardiac: acute cardiac and trauma emergencies. Unity Aid then Labaid, with dates. ECG spikes here. |
| 2 | `22:40 — CHART` | Registration | BMDC, MRCEM, RCEM, EUSEM, MBBS. Chart-paper well. Not a CV table. |
| 3 | `23:41 — HANDOVER` | Contact | Phone, email, hospital. Trace settles to steady rhythm. |

Timestamps advance as you scroll — a tiny mono clock in the corner ticks forward per section. This is the second-order storytelling detail that makes it feel authored.

## Tone of copy

Calm, specific, unsentimental — the register of a good handover note. Short declaratives. Real numbers (registration IDs, dates, GPA) used as texture. Nothing that sounds like a LinkedIn summary. Banned words apply (no "passionate", "dedicated", "journey" as filler).

## Visual identity (grounded in ECG chart paper)

- **Palette:** the material is ECG paper and ink. Warm paper white `oklch(0.97 0.008 80)`, faint red-pink gridline tint for section wells, near-black ink `oklch(0.20 0.01 40)`, and **one accent: arterial red-orange** `oklch(0.60 0.21 30)` for the trace, links, and focus rings. No green-on-black monitor cliché (banned-adjacent), no purple, no gradients.
- **Type:** one characterful display serif for chapter headlines (e.g. *Instrument Serif* or *Fraunces*), one quiet grotesk for body (*Inter* or *Space Grotesk*), plus a mono (*IBM Plex Mono*) strictly for timestamps, IDs, and vitals — the "machine voice" of the page.
- **Depth:** 1px borders, 2–4% lightness steps, overlap (chapter numbers oversized behind text). Zero shadows.
- **A faint ECG-paper grid** appears only inside the "vitals"/credentials wells — as a content-grounded texture, not a page-wide dotted background.

## Reduced motion / no-JS

Trace renders fully drawn and static. Timestamps render at their final values. The page reads as a clean editorial longform. Story survives without motion — that's the test of the concept.
