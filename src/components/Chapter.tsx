import type { ReactNode } from 'react'
import { EcgTrace } from './EcgTrace'

interface ChapterProps {
  index: number // 1–3, the ghost numeral the reader sees
  // Which segment of the page-long trace this section carries. Distinct from
  // `index` because the heart band takes a beat without taking a numeral.
  beatIndex: number
  id: string
  time: string // shift-clock beat, e.g. "21:52" (decorative)
  beat: string // chapter label, e.g. "TRIAGE"
  title: string
  wide?: boolean // drop the 65ch measure for table / two-column content
  invert?: boolean // the page's one dark passage — see .band-ink in tokens.css
  children: ReactNode
}

export function Chapter({ index, beatIndex, id, time, beat, title, wide, invert, children }: ChapterProps) {
  const numeral = String(index).padStart(2, '0')
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      data-beat={beatIndex}
      data-time={time}
      className={
        invert
          ? 'band-ink relative'
          : 'relative border-t border-border'
      }
    >
      {/* mobile: trace collapses to a thin rule at the top of the section */}
      <div className="relative h-12 border-b border-border md:hidden" aria-hidden="true">
        <EcgTrace index={beatIndex} variant="h" />
      </div>

      <div className="mx-auto max-w-6xl px-5 md:grid md:grid-cols-[4rem_1fr] md:px-8">
        {/* desktop: reserved trace gutter, full section height */}
        <div className="relative hidden md:block" aria-hidden="true">
          <EcgTrace index={beatIndex} variant="v" />
        </div>

        <div className="relative py-20 md:py-32 md:pl-14 lg:pl-20">
          <div aria-hidden="true" className="ghost-numeral select-none">
            {numeral}
          </div>

          <div className="relative">
            <p data-reveal className="mb-6 font-mono text-[0.8125rem] tracking-[0.2em] text-ink-secondary">
              <span aria-hidden="true">{time} — </span>
              {beat}
            </p>
            <h2
              id={`${id}-title`}
              data-reveal
              className="font-display-head mb-10 text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.05] text-ink"
            >
              {title}
            </h2>
            <div
              data-reveal
              className={`${wide ? '' : 'max-w-[65ch] '}space-y-6 text-[1.0625rem] leading-[1.7] text-ink-secondary`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
