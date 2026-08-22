// Fixed mono clock, bottom-left. Decorative — real dates live in the copy.
// GSAP updates the time per section; without JS it reads the opening beat.
export function ShiftClock() {
  return (
    <div
      aria-hidden="true"
      className="fixed bottom-4 left-4 z-50 bg-bg px-1.5 py-0.5 font-mono text-[0.8125rem] tracking-[0.15em] text-ink-secondary"
      data-shift-clock
    >
      <span data-clock-time>21:47</span>
    </div>
  )
}
