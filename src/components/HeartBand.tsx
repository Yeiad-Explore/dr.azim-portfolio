import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EcgTrace } from './EcgTrace'
import { HEART_BAND_R_WAVES } from '../lib/ecg'
import type { HeartHandle } from './heart/scene'

// oklch() is fine for CSS and unknown to three's colour parser. Painting one
// pixel is the only resolver that is guaranteed to agree with what the rest
// of the page actually renders.
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

export function HeartBand() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [live, setLive] = useState(false)

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
    }
  }, [])

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

        <div className="py-20 md:py-28 md:pl-14 lg:grid lg:grid-cols-[1fr_26rem] lg:items-center lg:gap-16 lg:pl-20">
          <div data-reveal className="max-w-[42ch]">
            <p className="mb-6 font-mono text-[0.8125rem] tracking-[0.2em] text-ink-secondary">
              <span aria-hidden="true">22:26 — </span>CIRCULATION
            </p>
            <h2
              id="perfusion-title"
              className="font-display-head mb-6 text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.08] text-ink"
            >
              The organ the whole shift is organized around.
            </h2>
            <p className="text-[1.0625rem] leading-[1.7] text-ink-secondary">
              Every beat below the trace is a contraction. In an arrest, the job is to
              buy back the ones the patient can no longer make.
            </p>
          </div>

          <figure data-reveal className="mt-12 lg:mt-0">
            <div className="relative aspect-square w-full max-w-[26rem] border border-border bg-bg-raised">
              {/* Rendered still. Stays put when WebGL is unavailable, the
                  chunk fails, or JS never runs — the box is never empty. */}
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
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <figcaption className="mt-3 max-w-[26rem] font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint">
              SCHEMATIC · NOT A DIAGNOSTIC IMAGE
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
