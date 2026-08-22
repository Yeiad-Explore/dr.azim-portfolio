import { useCallback, useEffect, useRef, useState } from 'react'

// Appointment booking, deliberately a stepped form rather than a chat.
//
// A date is the one thing in this flow that must not be guessed: "next Tuesday
// evening" parsed slightly wrong books the wrong slot and nobody notices until
// the patient arrives. So the widget collects structured values and the LLM
// stays out of it — the assistant in TriageDesk answers questions, this books.
//
// The 999 line is markup for the same reason it is in TriageDesk: this is an
// emergency physician's site, and someone in trouble may reach for the booking
// form instead of a phone.

const EMERGENCY_NUMBER = '999'
const PRACTICE_PHONE = '+880 1878 800 520'

const SERVICES = [
  'Cardiac consultation',
  'Follow-up review',
  'ECG / telemetry review',
  'General emergency medicine query',
] as const

type Step = 'service' | 'patient' | 'when' | 'review' | 'result'

interface Slot {
  start: string
  end: string
}

interface BookingResponse {
  status: 'confirmed' | 'unavailable' | 'error'
  details: {
    appointmentId?: string
    doctor?: string
    service?: string
    start?: string
    end?: string
    location?: string
  }
  alternate_slots: Slot[]
  message?: string
  field?: string
}

const DHAKA = 'Asia/Dhaka'

function formatSlot(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DHAKA,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

// <input type="datetime-local"> has no offset. The clinic is in Dhaka, so the
// value the patient picks is Dhaka wall-clock time and is stamped +06:00.
function toDhakaIso(local: string) {
  return local ? `${local}:00+06:00` : ''
}

export function BookingDesk() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('service')
  const [service, setService] = useState<string>(SERVICES[0])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [when, setWhen] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<BookingResponse | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLParagraphElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const close = useCallback(() => {
    abortRef.current?.abort()
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  // Move focus to the new step's heading so a screen reader announces it.
  useEffect(() => {
    if (open) headingRef.current?.focus()
  }, [open, step])

  useEffect(() => () => abortRef.current?.abort(), [])

  function reset() {
    setStep('service')
    setResult(null)
    setError(null)
    setWhen('')
    setNotes('')
  }

  function validateLocally(): string | null {
    if (step === 'patient') {
      if (name.trim().length < 2) return 'Enter the patient’s full name.'
      if (!/^(?:\+?880|0)1[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, '')))
        return 'Enter a valid mobile number, e.g. 01712 345678.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
        return 'Enter a valid email address for the confirmation.'
    }
    if (step === 'when') {
      if (!when) return 'Choose a date and time.'
      if (Date.parse(toDhakaIso(when)) < Date.now()) return 'That time is in the past. Choose a later slot.'
    }
    return null
  }

  function advance() {
    const problem = validateLocally()
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setStep(step === 'service' ? 'patient' : step === 'patient' ? 'when' : 'review')
  }

  async function submit(startIso?: string) {
    setBusy(true)
    setError(null)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          patient: { name: name.trim(), phone: phone.replace(/[\s-]/g, ''), email: email.trim() },
          service,
          preferred: { start: startIso ?? toDhakaIso(when), durationMinutes: 30 },
          notes: notes.trim() || undefined,
          locale: 'en',
        }),
      })

      const data = (await res.json()) as BookingResponse

      // A validation rejection belongs on the field it came from, not on the
      // result screen — the patient needs to be able to fix it.
      if (res.status === 422) {
        setError(data.message ?? 'Please check the details.')
        setStep(data.field === 'start' ? 'when' : 'patient')
        return
      }

      setResult(data)
      setStep('result')
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      setResult({
        status: 'error',
        details: {},
        alternate_slots: [],
        message: `Could not reach the booking system. Nothing was booked — please call ${PRACTICE_PHONE}.`,
      })
      setStep('result')
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const stepIndex = { service: 1, patient: 2, when: 3, review: 4, result: 4 }[step]

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="booking-panel"
        className="fixed right-4 bottom-16 z-50 inline-flex items-center gap-2 rounded-[4px] border border-border-strong bg-accent-deep px-3.5 py-2 font-mono text-[0.75rem] tracking-[0.1em] text-accent-ink transition-opacity duration-[160ms] hover:opacity-90"
      >
        {open ? 'CLOSE' : 'BOOK'}
      </button>

      <div
        id="booking-panel"
        role="dialog"
        aria-label="Book an appointment"
        hidden={!open}
        className="fixed right-4 bottom-28 z-50 flex max-h-[min(36rem,74svh)] w-[calc(100vw-2rem)] max-w-[24rem] flex-col rounded-[6px] border border-border-strong bg-bg"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p
            ref={headingRef}
            tabIndex={-1}
            className="font-mono text-[0.6875rem] tracking-[0.16em] text-ink-secondary focus-visible:outline-none"
          >
            APPOINTMENT — STEP {stepIndex} / 4
          </p>
          <button
            type="button"
            onClick={close}
            className="font-mono text-[0.6875rem] tracking-[0.1em] text-ink-secondary transition-colors duration-[160ms] hover:text-accent-deep"
          >
            CLOSE
          </button>
        </div>

        <p className="border-b border-border bg-bg-well px-4 py-2.5 font-mono text-[0.6875rem] leading-relaxed tracking-[0.06em] text-accent-deep">
          THIS IS NOT FOR EMERGENCIES.{' '}
          <a href={`tel:${EMERGENCY_NUMBER}`} className="underline underline-offset-2">
            CALL {EMERGENCY_NUMBER}
          </a>{' '}
          IF SOMEONE NEEDS HELP NOW.
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {error && (
            <p role="alert" className="mb-4 border-l-2 border-accent-deep pl-3 text-[0.875rem] text-accent-deep">
              {error}
            </p>
          )}

          {step === 'service' && (
            <fieldset>
              <legend className="mb-3 text-[0.9375rem] text-ink">What is the appointment for?</legend>
              <div className="space-y-2">
                {SERVICES.map((s) => (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-[4px] border px-3 py-2.5 text-[0.9375rem] ${
                      service === s ? 'border-accent-deep text-ink' : 'border-border text-ink-secondary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      value={s}
                      checked={service === s}
                      onChange={() => setService(s)}
                      className="accent-[var(--accent-deep)]"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 'patient' && (
            <div className="space-y-3">
              <Field label="Patient's full name" id="bk-name" value={name} onChange={setName} autoComplete="name" />
              <Field
                label="Mobile number"
                id="bk-phone"
                value={phone}
                onChange={setPhone}
                type="tel"
                autoComplete="tel"
                hint="e.g. 01712 345678"
              />
              <Field
                label="Email for the confirmation"
                id="bk-email"
                value={email}
                onChange={setEmail}
                type="email"
                autoComplete="email"
              />
            </div>
          )}

          {step === 'when' && (
            <div className="space-y-3">
              <Field
                label="Preferred date and time"
                id="bk-when"
                value={when}
                onChange={setWhen}
                type="datetime-local"
                hint="Dhaka time. Clinic hours are 17:00–21:00."
              />
              <div>
                <label htmlFor="bk-notes" className="mb-1 block font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint">
                  ANYTHING THE DOCTOR SHOULD KNOW (OPTIONAL)
                </label>
                <textarea
                  id="bk-notes"
                  rows={3}
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full resize-none rounded-[4px] border border-border bg-bg-raised px-2.5 py-2 text-[0.9375rem] text-ink focus-visible:border-accent focus-visible:outline-none"
                />
              </div>
            </div>
          )}

          {step === 'review' && (
            <dl className="space-y-2.5 font-mono text-[0.8125rem]">
              <Row label="FOR" value={service} />
              <Row label="PATIENT" value={name} />
              <Row label="MOBILE" value={phone} />
              <Row label="EMAIL" value={email} />
              <Row label="REQUESTED" value={formatSlot(toDhakaIso(when))} />
              {notes && <Row label="NOTES" value={notes} />}
            </dl>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              {result.status === 'confirmed' && (
                <>
                  <p className="font-mono text-[0.6875rem] tracking-[0.16em] text-accent-deep">CONFIRMED</p>
                  <dl className="space-y-2.5 font-mono text-[0.8125rem]">
                    <Row label="REF" value={result.details.appointmentId ?? '—'} />
                    <Row label="WITH" value={result.details.doctor ?? '—'} />
                    <Row label="WHEN" value={result.details.start ? formatSlot(result.details.start) : '—'} />
                    <Row label="WHERE" value={result.details.location ?? '—'} />
                  </dl>
                  <p className="text-[0.875rem] leading-relaxed text-ink-secondary">
                    A confirmation has been sent to {email}.
                  </p>
                </>
              )}

              {result.status === 'unavailable' && (
                <>
                  <p className="font-mono text-[0.6875rem] tracking-[0.16em] text-ink-secondary">SLOT UNAVAILABLE</p>
                  <p className="text-[0.9375rem] leading-relaxed text-ink">
                    That time is already taken. The next open slots are:
                  </p>
                  <div className="space-y-2">
                    {result.alternate_slots.map((slot) => (
                      <button
                        key={slot.start}
                        type="button"
                        disabled={busy}
                        onClick={() => void submit(slot.start)}
                        className="w-full rounded-[4px] border border-border-strong px-3 py-2.5 text-left font-mono text-[0.8125rem] text-ink transition-colors duration-[160ms] hover:border-accent hover:text-accent-deep disabled:opacity-40"
                      >
                        {formatSlot(slot.start)}
                      </button>
                    ))}
                    {result.alternate_slots.length === 0 && (
                      <p className="text-[0.875rem] text-ink-secondary">
                        No open slots were returned. Please call {PRACTICE_PHONE}.
                      </p>
                    )}
                  </div>
                </>
              )}

              {result.status === 'error' && (
                <>
                  <p className="font-mono text-[0.6875rem] tracking-[0.16em] text-accent-deep">NOT BOOKED</p>
                  <p className="text-[0.9375rem] leading-relaxed text-ink">{result.message}</p>
                  <p className="font-mono text-[0.8125rem]">
                    <a href={`tel:${PRACTICE_PHONE.replace(/\s/g, '')}`} className="text-link">
                      {PRACTICE_PHONE}
                    </a>
                  </p>
                </>
              )}

              {result.message?.startsWith('MOCK RESPONSE') && (
                <p className="border-t border-border pt-3 font-mono text-[0.625rem] text-ink-faint">
                  {result.message}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border p-3">
          {step !== 'service' && step !== 'result' && (
            <button
              type="button"
              onClick={() => {
                setError(null)
                setStep(step === 'patient' ? 'service' : step === 'when' ? 'patient' : 'when')
              }}
              className="rounded-[4px] border border-border-strong px-3 py-2 font-mono text-[0.75rem] text-ink transition-colors duration-[160ms] hover:border-accent"
            >
              BACK
            </button>
          )}

          {step !== 'review' && step !== 'result' && (
            <button
              type="button"
              onClick={advance}
              className="ml-auto rounded-[4px] bg-accent-deep px-4 py-2 font-mono text-[0.75rem] tracking-[0.06em] text-accent-ink transition-opacity duration-[160ms] hover:opacity-90"
            >
              NEXT
            </button>
          )}

          {step === 'review' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="ml-auto rounded-[4px] bg-accent-deep px-4 py-2 font-mono text-[0.75rem] tracking-[0.06em] text-accent-ink transition-opacity duration-[160ms] hover:opacity-90 disabled:opacity-40"
            >
              {busy ? 'BOOKING…' : 'CONFIRM BOOKING'}
            </button>
          )}

          {step === 'result' && (
            <button
              type="button"
              onClick={reset}
              className="ml-auto rounded-[4px] border border-border-strong px-4 py-2 font-mono text-[0.75rem] text-ink transition-colors duration-[160ms] hover:border-accent"
            >
              NEW BOOKING
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  hint,
  autoComplete,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  type?: string
  hint?: string
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint">
        {label.toUpperCase()}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[4px] border border-border bg-bg-raised px-2.5 py-2 text-[0.9375rem] text-ink focus-visible:border-accent focus-visible:outline-none"
      />
      {hint && <p className="mt-1 font-mono text-[0.625rem] text-ink-faint">{hint}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border pb-2">
      <dt className="shrink-0 text-ink-faint">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  )
}
