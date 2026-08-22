import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const CLOCK_FINAL = '23:41'

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(total: number) {
  const t = Math.round(total)
  const h = Math.floor(t / 60) % 24
  const m = t % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Kick off all scroll-bound motion. Returns a cleanup function.
// With prefers-reduced-motion the page stays exactly as server-rendered
// (trace fully drawn, no reveals) and the clock parks at end of shift.
export function initMotion(): () => void {
  const clockEl = document.querySelector<HTMLElement>('[data-clock-time]')

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (clockEl) clockEl.textContent = CLOCK_FINAL
    return () => {}
  }

  // Lenis smooth scroll, driven by GSAP's ticker
  const lenis = new Lenis({ autoRaf: false })
  lenis.on('scroll', ScrollTrigger.update)
  const raf = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  const sections = gsap.utils.toArray<HTMLElement>('[data-beat]')
  const clock = { minutes: toMinutes('21:47') }
  let clockTween: gsap.core.Tween | null = null
  let heroPlayed = false

  const tickClockTo = (time: string) => {
    if (!clockEl) return
    clockTween?.kill()
    clockTween = gsap.to(clock, {
      minutes: toMinutes(time),
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        clockEl.textContent = fromMinutes(clock.minutes)
      },
    })
  }

  const mm = gsap.matchMedia()
  const revealBySection = new Map<HTMLElement, (instant?: boolean) => void>()

  // Keyboard users can tab into a section the scroll hasn't reached yet.
  // Show it immediately rather than leaving focus on invisible content.
  const onFocusIn = (e: FocusEvent) => {
    const section = (e.target as HTMLElement)?.closest?.<HTMLElement>('[data-beat]')
    if (section) revealBySection.get(section)?.(true)
  }
  document.addEventListener('focusin', onFocusIn)

  const setup = (variant: 'v' | 'h') => () => {
    for (const section of sections) {
      const beat = Number(section.dataset.beat)
      const time = section.dataset.time
      const path = section.querySelector<SVGPathElement>(
        `[data-ecg-variant="${variant}"] .ecg-path`,
      )
      const isLast = beat === sections.length - 1

      // ── trace segments ─────────────────────────────────────────────
      if (path) {
        const len = path.getTotalLength()
        if (beat === 0) {
          // Hero: drawn by the load timeline, not by scroll.
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: heroPlayed ? 0 : len })
          if (!heroPlayed) {
            heroPlayed = true
            gsap.set('[data-hero-mask] > *', { yPercent: 105 })
            gsap.set('[data-hero-line]', { opacity: 0, y: 14 })
            const tl = gsap.timeline()
            // flatline draws, the single beat fires as the pen crosses it
            tl.to(path, { strokeDashoffset: 0, duration: 1.05, ease: 'power2.inOut' })
            tl.to(
              '[data-hero-mask] > *',
              { yPercent: 0, duration: 0.55, ease: 'power3.out' },
              0.55,
            )
            tl.to(
              '[data-hero-line]',
              { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.07 },
              0.75,
            )
          }
        } else {
          // One pen at the viewport's center line: each segment draws
          // exactly while its section crosses it, so the trace is
          // continuous across section boundaries.
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top center',
              end: isLast ? 'bottom bottom' : 'bottom center',
              scrub: 0.5,
            },
          })
        }
      }

      // ── shift clock (one trigger per section, not per variant) ─────
      if (variant === 'v' || window.innerWidth < 768) {
        if (time) {
          ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => tickClockTo(time),
            onEnterBack: () => tickClockTo(time),
          })
        }
      }

      // ── scroll reveals: 16px rise, once, staggered within a section ─
      // Opacity, never autoAlpha: `visibility: hidden` would drop the
      // links in un-revealed sections out of the tab order.
      if (variant === 'v' || window.innerWidth < 768) {
        const targets = section.querySelectorAll('[data-reveal]')
        if (targets.length && beat !== 0) {
          gsap.set(targets, { opacity: 0, y: 16 })
          const reveal = (instant = false) =>
            gsap.to(targets, {
              opacity: 1,
              y: 0,
              duration: instant ? 0 : 0.45,
              ease: 'power3.out',
              stagger: instant ? 0 : 0.06,
              overwrite: 'auto',
            })
          ScrollTrigger.create({
            trigger: section,
            start: 'top 78%',
            once: true,
            onEnter: () => reveal(),
          })
          revealBySection.set(section, reveal)
        }
      }
    }
  }

  mm.add('(min-width: 768px)', setup('v'))
  mm.add('(max-width: 767px)', setup('h'))

  // Self-hosted fonts swap in after first layout; re-measure triggers.
  document.fonts?.ready.then(() => ScrollTrigger.refresh())

  return () => {
    document.removeEventListener('focusin', onFocusIn)
    clockTween?.kill()
    mm.revert()
    gsap.ticker.remove(raf)
    lenis.destroy()
  }
}
