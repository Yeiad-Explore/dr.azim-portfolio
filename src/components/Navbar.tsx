export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="font-medium tracking-tight whitespace-nowrap text-ink transition-colors duration-[160ms] hover:text-accent-deep"
          >
            {/* the full name overruns the 14px bar at 360px — initials below sm */}
            <span className="sm:hidden">Dr. A. A. Bhuiyan</span>
            <span className="hidden sm:inline">Dr. Abdul Awal Bhuiyan,</span>{' '}
            <span className="text-xs font-normal text-ink-secondary">MBBS</span>
          </a>
          <span className="hidden h-3 w-px bg-border sm:inline-block" aria-hidden="true" />
          <div className="hidden items-center gap-1.5 font-mono text-[0.75rem] text-ink-secondary md:flex">
            <span>BMDC A-119798</span>
            <span>·</span>
            <span>Labaid Cardiac Hospital</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden items-center gap-1.5 rounded-[4px] border border-border bg-bg-raised px-2.5 py-1 font-mono text-[0.6875rem] text-ink-secondary sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span>ER Floor / Active</span>
          </div>

          <nav aria-label="Clinical sections" className="flex items-center gap-3 sm:gap-5 font-mono text-[0.75rem] tracking-[0.04em]">
            {/* At 360px the full row overruns the header. The page is one
                continuous scroll, so the two in-page anchors drop and the
                Handover CTA — the only one that is a destination — stays. */}
            <a
              href="#practice"
              className="hidden text-ink-secondary transition-colors duration-[160ms] hover:text-ink sm:inline"
            >
              Practice
            </a>
            <a
              href="#chart"
              className="hidden text-ink-secondary transition-colors duration-[160ms] hover:text-ink sm:inline"
            >
              Credentials
            </a>
            <a
              href="#handover"
              className="rounded-[4px] border border-border-strong px-2.5 py-1 text-ink transition-colors duration-[160ms] hover:border-accent hover:text-accent-deep"
            >
              Handover
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
