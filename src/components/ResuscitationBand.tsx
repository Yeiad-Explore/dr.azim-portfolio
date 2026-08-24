import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EcgTrace } from './EcgTrace'
import { RESUSCITATION_BAND_R_WAVES } from '../lib/ecg'
import type { HeartHandle, SystemId } from './torso/scene'

// Beat 1.5: the WebGL set-piece, and its resolution of the trace. Deliberately
// the whole primary survey — airway, breathing, circulation, neuro, the chest
// wall — not the heart alone. A heart-only set-piece reads as a cardiology
// subspecialty; the sequence itself is what an emergency physician actually
// runs. See CLAUDE.md's 2026-08-22 amendment on this.

function resolveColor(value: string, fallback: string) {
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    const ctx = c.getContext('2d')
    if (!ctx) return fallback
    ctx.fillStyle = fallback
    ctx.fillStyle = value
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `rgb(${r},${g},${b})`
  } catch {
    return fallback
  }
}

interface SystemInfo {
  id: SystemId
  label: string
  tag: string
  desc: string
  relevance: string
}

// Standard primary-survey order (ABCDE). Content is general emergency-medicine
// knowledge, not a claim about a specific case — nothing here is a fact about
// Dr. Bhuiyan beyond "this is the sequence the role runs."
const SYSTEMS: SystemInfo[] = [
  {
    id: 'airway',
    label: 'Airway',
    tag: 'FIRST PRIORITY',
    desc: 'The first thing checked, and the first thing protected.',
    relevance: 'A blocked airway kills faster than anything else in the bay — nothing further matters until air can reach the lungs.',
  },
  {
    id: 'breathing',
    label: 'Breathing',
    tag: 'OXYGENATION & VENTILATION',
    desc: 'The lungs move air; the job is knowing instantly when they stop moving it well.',
    relevance: 'Chest rise, breath sounds, and oxygen saturation are read within seconds of arrival, before any monitor confirms it.',
  },
  {
    id: 'circulation',
    label: 'Circulation',
    tag: 'PERFUSION & PULSE',
    desc: 'The heart and vessels that carry oxygen to everything else.',
    relevance: 'In arrest or shock, restoring a pulse and pressure is the immediate task — every other system depends on it.',
  },
  {
    id: 'neuro',
    label: 'Neuro',
    tag: 'CONSCIOUSNESS & SPINE',
    desc: 'A quick read on the brain, and the spinal cord it depends on.',
    relevance: 'Level of consciousness is checked in seconds; the neck is protected until injury is ruled out.',
  },
  {
    id: 'trauma',
    label: 'Chest Wall',
    tag: 'EXPOSURE',
    desc: 'What protects everything inside it, and what can just as easily be the injury itself.',
    relevance: 'A collapsed lung or bleeding inside the chest is found and treated at the bedside, not the imaging suite.',
  },
]

export function ResuscitationBand() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [live, setLive] = useState(false)
  const [selected, setSelected] = useState<SystemId | null>(null)
  const handleRef = useRef<HeartHandle | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    if (!section || !canvas) return

    let handle: HeartHandle | null = null
    let trigger: ScrollTrigger | null = null
    let cancelled = false

    // Nothing is fetched until the band is within a screen of the viewport,
    // which keeps three.js out of everything the first paint has to do.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()

        import('./torso/scene')
          .then(({ mount }) => {
            if (cancelled) return
            const css = getComputedStyle(document.documentElement)
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

            handle = mount(canvas, {
              rWaves: RESUSCITATION_BAND_R_WAVES,
              reducedMotion,
              lineColor: resolveColor(css.getPropertyValue('--accent').trim(), '#c2452c'),
              shellColor: resolveColor(css.getPropertyValue('--bg').trim(), '#f7f4ee'),
            })
            handleRef.current = handle
            setLive(true)

            if (reducedMotion) return
            trigger = ScrollTrigger.create({
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              onUpdate: (self) => handle?.setProgress(self.progress),
            })
          })
          .catch(() => {
            // No WebGL, or the chunk failed to load. The still stays up.
          })
      },
      { rootMargin: '100% 0px' },
    )

    io.observe(section)

    return () => {
      cancelled = true
      io.disconnect()
      trigger?.kill()
      handle?.destroy()
      handleRef.current = null
    }
  }, [])

  const select = (id: SystemId) => {
    const next = selected === id ? null : id
    setSelected(next)
    handleRef.current?.focusLandmark(next)
  }

  const system = selected ? SYSTEMS.find((s) => s.id === selected) : null

  return (
    <section
      ref={sectionRef}
      aria-labelledby="resuscitation-title"
      data-beat={2}
      data-time="22:26"
      className="relative border-t border-border"
    >
      <div className="relative h-12 border-b border-border md:hidden" aria-hidden="true">
        <EcgTrace index={2} variant="h" />
      </div>

      <div className="mx-auto max-w-6xl px-5 md:grid md:grid-cols-[4rem_1fr] md:px-8">
        <div className="relative hidden md:block" aria-hidden="true">
          <EcgTrace index={2} variant="v" />
        </div>

        <div className="py-20 md:py-28 md:pl-14 lg:grid lg:grid-cols-[1fr_28rem] lg:items-start lg:gap-16 lg:pl-20">
          <div data-reveal className="space-y-6">
            <div>
              <p className="mb-4 font-mono text-[0.8125rem] tracking-[0.2em] text-ink-secondary">
                <span aria-hidden="true">22:26 - </span>RESUSCITATION
              </p>
              <h2
                id="resuscitation-title"
                className="font-display-head text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.08] text-ink"
              >
                The first minutes decide everything.
              </h2>
            </div>

            <p className="max-w-[48ch] text-[1.0625rem] leading-[1.7] text-ink-secondary">
              In the emergency department, the priority is simple: recognize
              what is failing, stabilize it, and buy the patient time. Airway,
              breathing, circulation, neuro status, and exposure — each is
              checked, in order, before anything else.
            </p>

            <div className="rounded-[4px] border border-border bg-bg-raised p-4">
              <span className="mb-3 block font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint">
                THE PRIMARY SURVEY
              </span>
              <div className="flex flex-wrap gap-2">
                {SYSTEMS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => select(s.id)}
                    aria-pressed={selected === s.id}
                    className={`rounded-[4px] px-2.5 py-1 font-mono text-[0.75rem] transition-colors duration-[160ms] ${
                      selected === s.id
                        ? 'bg-accent-deep text-accent-ink font-semibold'
                        : 'border border-border bg-bg text-ink-secondary hover:border-border-strong hover:text-ink'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {system && (
                <div className="mt-4 border-t border-border pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{system.label}</span>
                    <span className="font-mono text-[0.625rem] font-semibold text-accent-deep">
                      {system.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{system.desc}</p>
                  <p className="mt-2 rounded bg-bg-well p-2 text-xs font-medium text-ink">
                    <span className="font-semibold text-accent-deep">Why it matters here:</span>{' '}
                    {system.relevance}
                  </p>
                </div>
              )}
            </div>
          </div>

          <figure data-reveal className="mt-10 lg:mt-0">
            <div className="relative aspect-square w-full max-w-[28rem] border border-border bg-bg-raised">
              {/* Rendered still. Stays put when WebGL is unavailable, the
                  chunk fails, or JS never runs — the box is never empty. */}
              <img
                src="/img/torso-still.webp"
                alt=""
                aria-hidden="true"
                width={832}
                height={832}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-[450ms] ${
                  live ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
            </div>
            <figcaption className="mt-3 max-w-[28rem] font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint">
              PARAMETRIC ANATOMICAL SCHEMATIC · NOT DIAGNOSTIC IMAGING
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
