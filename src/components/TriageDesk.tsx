import { useCallback, useEffect, useRef, useState } from 'react'

// The assistant, docked bottom-right opposite the shift clock.
//
// Turns are labelled in mono and separated by rules rather than drawn as
// bubbles: the page already carries a flowsheet, a rail and an indexed list,
// and chat bubbles would be a fifth visual language for no gain.
//
// Safety posture: the 999 line is markup, not model output. It is on screen
// before the first message, it stays while the assistant streams, and it is
// still there if the API is down — the one path that must never depend on a
// network call succeeding.

const EMERGENCY_NUMBER = '999'

const OPENING =
  'I am an automated assistant on Dr. Bhuiyan’s site, not a doctor and not him. ' +
  'I cannot diagnose or tell you how serious something is. ' +
  `If someone is in danger now, call ${EMERGENCY_NUMBER}. ` +
  'Otherwise, ask me what to do while help is on the way, or about his practice.'

const UNAVAILABLE =
  `The assistant is unavailable. If this is an emergency, call ${EMERGENCY_NUMBER} now ` +
  'or go to your nearest emergency department.'

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

export function TriageDesk() {
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const close = useCallback(() => {
    abortRef.current?.abort()
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  // Keep the newest text in view as it streams.
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [turns])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function send() {
    const text = draft.trim()
    if (!text || busy) return

    const next: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns([...next, { role: 'assistant', content: '' }])
    setDraft('')
    setBusy(true)

    const controller = new AbortController()
    abortRef.current = controller

    const settle = (message: string) =>
      setTurns((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: message }
        return copy
      })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        settle(res.status === 429 ? 'Too many messages. Wait a moment.' : UNAVAILABLE)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        settle(acc)
      }

      if (!acc.trim()) settle(UNAVAILABLE)
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') settle(UNAVAILABLE)
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="triage-panel"
        className="fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 rounded-[4px] border border-border-strong bg-bg-raised px-3.5 py-2 font-mono text-[0.75rem] tracking-[0.1em] text-ink transition-colors duration-[160ms] hover:border-accent hover:text-accent-deep"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        {open ? 'CLOSE' : 'ASK'}
      </button>

      <div
        id="triage-panel"
        ref={panelRef}
        role="dialog"
        aria-label="Assistant"
        hidden={!open}
        className="fixed right-4 bottom-16 z-50 flex max-h-[min(34rem,72svh)] w-[calc(100vw-2rem)] max-w-[24rem] flex-col rounded-[6px] border border-border-strong bg-bg"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="font-mono text-[0.6875rem] tracking-[0.16em] text-ink-secondary">
            AUTOMATED ASSISTANT
          </p>
          <button
            type="button"
            onClick={close}
            className="font-mono text-[0.6875rem] tracking-[0.1em] text-ink-secondary transition-colors duration-[160ms] hover:text-accent-deep"
          >
            CLOSE
          </button>
        </div>

        {/* Markup, not model output. This must survive the API being down. */}
        <p className="border-b border-border bg-bg-well px-4 py-2.5 font-mono text-[0.6875rem] leading-relaxed tracking-[0.06em] text-accent-deep">
          EMERGENCY?{' '}
          <a href={`tel:${EMERGENCY_NUMBER}`} className="underline underline-offset-2">
            CALL {EMERGENCY_NUMBER} NOW
          </a>{' '}
          — DO NOT WAIT FOR A REPLY HERE
        </p>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-atomic="false"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        >
          <p className="text-[0.875rem] leading-relaxed text-ink-secondary">{OPENING}</p>

          {turns.map((turn, i) => (
            <div key={i} className="mt-5 border-t border-border pt-4">
              <p className="mb-1.5 font-mono text-[0.625rem] tracking-[0.16em] text-ink-faint">
                {turn.role === 'user' ? 'YOU' : 'ASSISTANT'}
              </p>
              <p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ink">
                {turn.content ||
                  (busy && i === turns.length - 1 ? (
                    <span className="text-ink-faint">…</span>
                  ) : null)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <label htmlFor="triage-input" className="sr-only">
              Message the assistant
            </label>
            <textarea
              id="triage-input"
              ref={inputRef}
              rows={2}
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
              placeholder="What is happening?"
              className="min-h-[3rem] flex-1 resize-none rounded-[4px] border border-border bg-bg-raised px-2.5 py-2 text-[0.9375rem] text-ink placeholder:text-ink-faint focus-visible:border-accent focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || !draft.trim()}
              className="rounded-[4px] bg-accent-deep px-3.5 py-2.5 font-mono text-[0.75rem] tracking-[0.06em] text-accent-ink transition-opacity duration-[160ms] hover:opacity-90 disabled:opacity-40"
            >
              SEND
            </button>
          </div>
          <p className="mt-2 font-mono text-[0.625rem] leading-relaxed text-ink-faint">
            Automated. Not medical advice, not a diagnosis, and not monitored by
            Dr. Bhuiyan.
          </p>
        </div>
      </div>
    </>
  )
}
