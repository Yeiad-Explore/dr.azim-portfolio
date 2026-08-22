import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EcgTrace } from './EcgTrace'
import { HEART_BAND_R_WAVES } from '../lib/ecg'
import type { HeartHandle } from './heart/scene'

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

interface LandmarkInfo {
  id: string
  name: string
  tag: string
  desc: string
  relevance: string
}

const LANDMARKS: Record<string, LandmarkInfo> = {
  LAD: {
    id: 'LAD',
    name: 'Left Anterior Descending (LAD)',
    tag: 'ANTERIOR WALL PERFUSION',
    desc: 'Passes down the anterior interventricular groove towards the apex.',
    relevance: 'Acute occlusion causes Anterior STEMI ("The Widowmaker"). Highest risk for cardiogenic shock and malignant ventricular arrhythmias.',
  },
  RCA: {
    id: 'RCA',
    name: 'Right Coronary Artery (RCA)',
    tag: 'INFERIOR & RV PERFUSION',
    desc: 'Runs in the right coronary sulcus, perfusing the right ventricle, SA node, and AV node.',
    relevance: 'Occlusion causes Inferior STEMI (Leads II, III, aVF) frequently complicated by complete heart block and bradyarrhythmias.',
  },
  AORTA: {
    id: 'AORTA',
    name: 'Ascending Aorta & Root',
    tag: 'GREAT ARTERIAL TRUNK',
    desc: 'Origin of systemic circulation and coronary artery ostia at the aortic sinuses.',
    relevance: 'Site of critical acute aortic dissection (Stanford Type A), aortic valve rupture, and primary cannulation in resuscitation.',
  },
  APEX: {
    id: 'APEX',
    name: 'Left Ventricular Apex',
    tag: 'APICAL MYOCARDIUM',
    desc: 'Formed entirely by the left ventricle at the 5th left intercostal space.',
    relevance: 'Point of maximal impulse (PMI); sensitive to apical ballooning (Takotsubo) and ventricular aneurysm formation post-infarction.',
  },
}

export function HeartBand() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [live, setLive] = useState(false)
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>('LAD')
  const handleRef = useRef<HeartHandle | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    if (!section || !canvas) return

    let handle: HeartHandle | null = null
    let trigger: ScrollTrigger | null = null
    let cancelled = false

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()

        import('./heart/scene')
          .then(({ mount }) => {
            if (cancelled) return
            const css = getComputedStyle(document.documentElement)
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

            handle = mount(canvas, {
              rWaves: HEART_BAND_R_WAVES,
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
          .catch(() => {})
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

  const handleSelect = (id: string) => {
    setSelectedLandmark(id)
    handleRef.current?.focusLandmark(id)
  }

  const handleReset = () => {
    setSelectedLandmark(null)
    handleRef.current?.resetView()
  }

  const landmark = selectedLandmark ? LANDMARKS[selectedLandmark] : null

  return (
    <section
      ref={sectionRef}
      aria-labelledby="perfusion-title"
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
                <span aria-hidden="true">22:26 - </span>CIRCULATION
              </p>
              <h2
                id="perfusion-title"
                className="font-display-head text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.08] text-ink"
              >
                The organ the whole shift is organized around.
              </h2>
            </div>

            <p className="max-w-[48ch] text-[1.0625rem] leading-[1.7] text-ink-secondary">
              Every beat below the trace is a contraction. In acute myocardial infarction or arrest, the emergency physician's job is to buy back the coronary perfusion the patient can no longer sustain.
            </p>

            {/* Interactive Coronary & Landmark Buttons */}
            <div className="rounded-[4px] border border-border bg-bg-raised p-4">
              <span className="mb-3 block font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint">
                INTERACTIVE CORONARY ARTERY &amp; ANATOMICAL FOCUS
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.values(LANDMARKS).map((lm) => (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => handleSelect(lm.id)}
                    className={`rounded-[4px] px-2.5 py-1 font-mono text-[0.75rem] transition-all duration-[160ms] ${
                      selectedLandmark === lm.id
                        ? 'bg-accent-deep text-accent-ink font-semibold'
                        : 'border border-border bg-bg text-ink-secondary hover:border-border-strong hover:text-ink'
                    }`}
                  >
                    {lm.id}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-[4px] border border-border bg-bg px-2.5 py-1 font-mono text-[0.75rem] text-ink-faint transition-colors duration-[160ms] hover:border-accent hover:text-accent-deep"
                >
                  Scroll Sync
                </button>
              </div>

              {landmark && (
                <div className="mt-4 border-t border-border pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink text-sm">{landmark.name}</span>
                    <span className="font-mono text-[0.625rem] text-accent-deep font-semibold">
                      {landmark.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
                    {landmark.desc}
                  </p>
                  <p className="mt-2 rounded bg-bg-well p-2 text-xs font-medium text-ink">
                    <span className="font-semibold text-accent-deep">ER Significance:</span> {landmark.relevance}
                  </p>
                </div>
              )}
            </div>
          </div>

          <figure data-reveal className="mt-10 lg:mt-0">
            <div className="relative aspect-square w-full max-w-[28rem] rounded-[6px] border border-border bg-bg-raised shadow-inner">
              <img
                src="/img/heart-still.webp"
                alt=""
                aria-hidden="true"
                width={832}
                height={832}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-[450ms] ${
                  live ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
              />

              <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-bg/80 px-2 py-1 font-mono text-[0.625rem] text-ink-secondary">
                Drag to rotate 3D anatomy
              </div>
            </div>
            <figcaption className="mt-3 max-w-[28rem] font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint">
              PARAMETRIC CORONARY &amp; CARDIAC SCHEMATIC · NOT DIAGNOSTIC IMAGING
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
