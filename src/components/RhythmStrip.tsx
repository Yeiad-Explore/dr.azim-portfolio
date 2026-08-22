import { useEffect, useRef, useState } from 'react'

export type RhythmType = 'NSR' | 'STEMI' | 'VT' | 'VFIB'

interface RhythmMeta {
  id: RhythmType
  name: string
  lead: string
  rate: string
  pr: string
  qrs: string
  qtc: string
  urgency: string
  action: string
  criteria: string
}

const RHYTHMS: Record<RhythmType, RhythmMeta> = {
  NSR: {
    id: 'NSR',
    name: 'Normal Sinus Rhythm',
    lead: 'Lead II (25mm/s, 10mm/mV)',
    rate: '72 BPM',
    pr: '150 ms',
    qrs: '82 ms',
    qtc: '405 ms',
    urgency: 'STABLE / BASELINE',
    action: 'Routine hemodynamic monitoring and baseline vitals assessment.',
    criteria: 'Upright P waves in Lead II, uniform PR interval, narrow QRS complexes.',
  },
  STEMI: {
    id: 'STEMI',
    name: 'Acute Anterior STEMI (Hyperacute ST-Elevation)',
    lead: 'Lead V2–V4 (25mm/s, 10mm/mV)',
    rate: '94 BPM',
    pr: '160 ms',
    qrs: '98 ms',
    qtc: '470 ms',
    urgency: 'CRITICAL / CODE STEMI',
    action: 'Activate emergency Cath Lab (<90 min Door-to-Balloon), load dual antiplatelets, heparin, emergent transfer.',
    criteria: '>2mm ST-segment elevation with reciprocal inferior depression (LAD occlusion).',
  },
  VT: {
    id: 'VT',
    name: 'Monomorphic Ventricular Tachycardia',
    lead: 'Lead II (25mm/s, 10mm/mV)',
    rate: '175 BPM',
    pr: 'Unmeasurable',
    qrs: '168 ms',
    qtc: 'Prolonged',
    urgency: 'EMERGENCY / SHOCKABLE',
    action: 'Assess pulse immediately. Synchronized cardioversion if unstable; ACLS amiodarone/procainamide if stable.',
    criteria: 'Wide QRS (>140ms), extreme axis deviation, AV dissociation, capture/fusion beats.',
  },
  VFIB: {
    id: 'VFIB',
    name: 'Coarse Ventricular Fibrillation (Cardiac Arrest)',
    lead: 'Lead II (25mm/s, 10mm/mV)',
    rate: '~320 BPM (Erratic)',
    pr: 'None',
    qrs: 'Chaotic',
    qtc: 'None',
    urgency: 'ARREST / IMMEDIATE DEFIB',
    action: 'High-quality CPR, immediate unsynchronized defibrillation (200J Biphasic), Epinephrine 1mg IV every 3-5 min.',
    criteria: 'No identifiable P waves, QRS complexes, or T waves. Disorganized electrical activity.',
  },
}

export function RhythmStrip() {
  const [activeRhythm, setActiveRhythm] = useState<RhythmType>('NSR')
  const [isPlaying, setIsPlaying] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const scanXRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const pointsRef = useRef<{ x: number; y: number }[]>([])

  const current = RHYTHMS[activeRhythm]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = canvas.clientWidth
    let height = canvas.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    pointsRef.current = []
    scanXRef.current = 0

    const getWaveY = (t: number, rhythm: RhythmType, baseline: number, amp: number): number => {
      // t in seconds
      if (rhythm === 'NSR') {
        const period = 60 / 72 // ~0.833s
        const phase = (t % period) / period
        if (phase < 0.12) return baseline // isoelectric
        if (phase < 0.22) {
          // P wave
          const pP = (phase - 0.12) / 0.1
          return baseline - Math.sin(pP * Math.PI) * (amp * 0.14)
        }
        if (phase < 0.32) return baseline // PR segment
        if (phase < 0.35) {
          // Q wave
          return baseline + ((phase - 0.32) / 0.03) * (amp * 0.12)
        }
        if (phase < 0.40) {
          // R wave peak
          const rP = (phase - 0.35) / 0.05
          return baseline + (amp * 0.12) - rP * (amp * 1.12)
        }
        if (phase < 0.45) {
          // S wave
          const sP = (phase - 0.40) / 0.05
          return baseline - (amp * 1.0) + sP * (amp * 1.25)
        }
        if (phase < 0.52) {
          // ST isoelectric
          return baseline + (amp * 0.25) - ((phase - 0.45) / 0.07) * (amp * 0.25)
        }
        if (phase < 0.72) {
          // T wave
          const tP = (phase - 0.52) / 0.2
          return baseline - Math.sin(tP * Math.PI) * (amp * 0.28)
        }
        return baseline
      }

      if (rhythm === 'STEMI') {
        const period = 60 / 94
        const phase = (t % period) / period
        if (phase < 0.10) return baseline
        if (phase < 0.20) {
          const pP = (phase - 0.10) / 0.1
          return baseline - Math.sin(pP * Math.PI) * (amp * 0.12)
        }
        if (phase < 0.28) return baseline
        if (phase < 0.31) {
          return baseline + ((phase - 0.28) / 0.03) * (amp * 0.1)
        }
        if (phase < 0.36) {
          // High R wave
          const rP = (phase - 0.31) / 0.05
          return baseline + (amp * 0.1) - rP * (amp * 1.0)
        }
        if (phase < 0.41) {
          // Does not return to baseline: massive Tombstone ST elevation!
          const sP = (phase - 0.36) / 0.05
          return baseline - (amp * 0.9) + sP * (amp * 0.45)
        }
        if (phase < 0.68) {
          // High plateau ST elevation merging with hyperacute T wave
          const stP = (phase - 0.41) / 0.27
          return baseline - (amp * 0.45) - Math.sin(stP * Math.PI) * (amp * 0.35)
        }
        if (phase < 0.80) {
          const backP = (phase - 0.68) / 0.12
          return baseline - (amp * 0.45) * (1 - backP)
        }
        return baseline
      }

      if (rhythm === 'VT') {
        const period = 60 / 175 // ~0.342s
        const phase = (t % period) / period
        // Wide notched monomorphic complex
        const angle = phase * Math.PI * 2
        const fundamental = Math.sin(angle - Math.PI / 2)
        const secondHarmonic = Math.sin(angle * 2) * 0.3
        return baseline - (fundamental + secondHarmonic) * (amp * 0.75)
      }

      // VFIB: Chaotic disorganized micro-waves
      const f1 = Math.sin(t * 18.2) * 0.45
      const f2 = Math.sin(t * 31.7) * 0.3
      const f3 = Math.cos(t * 9.4) * 0.25
      const f4 = Math.sin(t * 47.1) * 0.15
      return baseline - (f1 + f2 + f3 + f4) * (amp * 0.8)
    }

    let t = 0
    const speed = 140 // pixels per second

    const drawGrid = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.strokeStyle = '#c8452a'
      ctx.lineWidth = 0.5

      // Minor grid 10px
      ctx.globalAlpha = 0.08
      ctx.beginPath()
      for (let x = 0; x < width; x += 10) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = 0; y < height; y += 10) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()

      // Major grid 50px
      ctx.globalAlpha = 0.18
      ctx.beginPath()
      for (let x = 0; x < width; x += 50) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = 0; y < height; y += 50) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()
      ctx.restore()
    }

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = time

      if (isPlaying) {
        t += dt
        const dx = speed * dt
        scanXRef.current = (scanXRef.current + dx) % width

        const baseline = height * 0.52
        const amp = height * 0.36
        const y = getWaveY(t, activeRhythm, baseline, amp)

        // Remove points in the erasure sweep zone (15px ahead)
        const eraseStart = scanXRef.current
        const eraseEnd = (scanXRef.current + 25) % width

        if (eraseStart < eraseEnd) {
          pointsRef.current = pointsRef.current.filter(
            (p) => p.x < eraseStart || p.x > eraseEnd,
          )
        } else {
          pointsRef.current = pointsRef.current.filter(
            (p) => p.x < eraseStart && p.x > eraseEnd,
          )
        }

        pointsRef.current.push({ x: scanXRef.current, y })
        pointsRef.current.sort((a, b) => a.x - b.x)
      }

      drawGrid()

      // Draw ECG trace
      if (pointsRef.current.length > 1) {
        ctx.save()
        ctx.strokeStyle = '#b8381e'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // Draw segments respecting the scan gap
        ctx.beginPath()
        for (let i = 0; i < pointsRef.current.length; i++) {
          const pt = pointsRef.current[i]
          const prev = pointsRef.current[i - 1]

          if (!prev || Math.abs(pt.x - prev.x) > 10) {
            ctx.moveTo(pt.x, pt.y)
          } else {
            ctx.lineTo(pt.x, pt.y)
          }
        }
        ctx.stroke()

        // Draw sweep head cursor
        ctx.fillStyle = '#d94f2b'
        ctx.beginPath()
        const headPt = pointsRef.current[pointsRef.current.length - 1]
        if (headPt) {
          ctx.arc(headPt.x, headPt.y, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [activeRhythm, isPlaying])

  return (
    <div className="rounded-[6px] border border-border-strong bg-bg-raised p-5 md:p-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-baseline">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.75rem] font-semibold tracking-[0.16em] text-accent-deep">
              CLINICAL TELEMETRY SIMULATOR
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          </div>
          <h3 className="font-display-head mt-1 text-xl text-ink md:text-2xl">
            Live 12-Lead Rhythm Diagnostic Strip
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-[4px] border border-border bg-bg px-3 py-1 font-mono text-[0.75rem] text-ink transition-colors duration-[160ms] hover:border-accent hover:text-accent-deep"
          >
            {isPlaying ? 'PAUSE SWEEP' : 'RESUME SWEEP'}
          </button>
        </div>
      </div>

      {/* Rhythm Switcher Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(RHYTHMS) as RhythmType[]).map((key) => {
          const isSelected = activeRhythm === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveRhythm(key)}
              className={`rounded-[4px] px-3.5 py-1.5 font-mono text-[0.75rem] font-medium transition-all duration-[160ms] ${
                isSelected
                  ? 'bg-accent-deep text-accent-ink shadow-sm'
                  : 'border border-border bg-bg text-ink-secondary hover:border-border-strong hover:text-ink'
              }`}
            >
              <span className="font-semibold">{key}</span>{' '}
              <span className="hidden sm:inline opacity-80">
                — {key === 'NSR' ? 'Sinus' : key === 'STEMI' ? 'Code STEMI' : key === 'VT' ? 'V-Tach' : 'V-Fib'}
              </span>
            </button>
          )
        })}
      </div>

      {/* ECG Canvas Screen */}
      <div className="relative mt-6 overflow-hidden rounded-[4px] border border-border-strong bg-bg-well">
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-3 font-mono text-[0.6875rem] text-ink-secondary">
          <span className="rounded bg-bg/80 px-2 py-0.5 font-semibold text-ink">
            {current.lead}
          </span>
          <span className="rounded bg-bg/80 px-2 py-0.5">
            SPEED: 25 mm/s
          </span>
          <span className="rounded bg-bg/80 px-2 py-0.5">
            CAL: 10 mm/mV
          </span>
        </div>

        <canvas
          ref={canvasRef}
          className="h-44 w-full cursor-crosshair md:h-52"
          title="Interactive ECG Telemetry Strip"
        />

        <div className="absolute right-3 bottom-3 z-10 flex items-center gap-2">
          <span className="rounded bg-bg/90 px-2.5 py-1 font-mono text-[0.75rem] font-bold text-accent-deep">
            HR: {current.rate}
          </span>
        </div>
      </div>

      {/* Telemetry Metrics & Physician Clinical Action Matrix */}
      <div className="mt-6 grid gap-6 border-t border-border pt-6 md:grid-cols-3">
        <div className="space-y-2">
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint">
            ELECTROPHYSIOLOGY INTERVALS
          </span>
          <dl className="grid grid-cols-3 gap-2 font-mono text-[0.75rem]">
            <div className="rounded border border-border bg-bg p-2">
              <dt className="text-ink-secondary text-[0.625rem]">PR INT</dt>
              <dd className="font-semibold text-ink">{current.pr}</dd>
            </div>
            <div className="rounded border border-border bg-bg p-2">
              <dt className="text-ink-secondary text-[0.625rem]">QRS DUR</dt>
              <dd className="font-semibold text-ink">{current.qrs}</dd>
            </div>
            <div className="rounded border border-border bg-bg p-2">
              <dt className="text-ink-secondary text-[0.625rem]">QTc</dt>
              <dd className="font-semibold text-ink">{current.qtc}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-2">
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint">
            DIAGNOSTIC CRITERIA
          </span>
          <p className="rounded border border-border bg-bg p-2.5 text-xs leading-relaxed text-ink-secondary">
            {current.criteria}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint">
              EMERGENCY FLOOR PROTOCOL
            </span>
            <span className="font-mono text-[0.625rem] font-semibold text-accent-deep">
              {current.urgency}
            </span>
          </div>
          <p className="rounded border border-border-strong bg-bg-well p-2.5 text-xs font-medium leading-relaxed text-ink">
            {current.action}
          </p>
        </div>
      </div>
    </div>
  )
}
