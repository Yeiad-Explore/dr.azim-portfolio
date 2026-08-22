import { EcgTrace } from './EcgTrace'
import { Portrait } from './Portrait'

export function Hero() {
  return (
    <section data-beat={0} data-time="21:47" className="relative">
      <div className="relative h-12 border-b border-border md:hidden" aria-hidden="true">
        <EcgTrace index={0} variant="h" />
      </div>

      <div className="mx-auto max-w-6xl px-5 md:grid md:min-h-svh md:grid-cols-[4rem_1fr] md:px-8 lg:grid-cols-[4rem_minmax(0,1fr)_21rem]">
        <div className="relative hidden md:block" aria-hidden="true">
          <EcgTrace index={0} variant="v" />
        </div>

        <div className="flex min-h-[88svh] flex-col justify-center py-16 md:min-h-0 md:py-20 md:pl-14 lg:pl-16">
          <p
            className="mb-6 font-mono text-[0.8125rem] tracking-[0.2em] text-ink-secondary"
            aria-hidden="true"
          >
            21:47 - INCOMING
          </p>

          <div data-hero-line className="mb-4">
            <span className="inline-flex items-center gap-2 rounded-[4px] border border-border-strong bg-bg-well px-3 py-1 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-accent-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              EMERGENCY MEDICINE &amp; CRITICAL CARE
            </span>
          </div>

          <div data-hero-mask className="overflow-hidden">
            <h1 className="font-display-head text-[clamp(2.8rem,7.5vw,5.5rem)] leading-[1.02] text-ink">
              Dr. Abdul Awal Bhuiyan
            </h1>
          </div>

          <p
            data-hero-line
            className="font-display-head mt-3 text-[clamp(1.25rem,2.8vw,1.9rem)] leading-snug text-ink-secondary"
          >
            Emergency Medical Officer{' '}
            <span className="font-sans text-base font-normal text-ink-faint">
              / Resuscitation &amp; Critical Care
            </span>
          </p>

          <p data-hero-line className="mt-6 max-w-[48ch] text-[1.0625rem] leading-[1.7] text-ink-secondary">
            The kind of doctor you meet on the worst day of your life, and are glad you did. Acute triage, rapid resuscitation, and emergency stabilization, on the emergency floor in Dhaka.
          </p>

          <div
            data-hero-line
            className="mt-8 grid max-w-2xl grid-cols-1 gap-4 border-y border-border py-4 font-mono text-[0.75rem] sm:grid-cols-3"
          >
            <div>
              <span className="block text-ink-faint">DUTY STATION</span>
              <span className="font-medium text-ink">Labaid Cardiac Hospital</span>
            </div>
            <div>
              <span className="block text-ink-faint">LICENSURE</span>
              <span className="font-medium text-ink">BMDC Reg. A-119798</span>
            </div>
            <div>
              <span className="block text-ink-faint">INTERNATIONAL</span>
              <span className="font-medium text-ink">RCEM (UK) · EUSEM</span>
            </div>
          </div>

          <div data-hero-line className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#practice"
              className="inline-flex items-center justify-center rounded-[4px] bg-accent-deep px-5 py-2.5 font-mono text-[0.8125rem] tracking-[0.06em] text-accent-ink transition-opacity duration-[160ms] hover:opacity-90"
            >
              View Clinical Practice ↓
            </a>
            <a
              href="#handover"
              className="inline-flex items-center justify-center rounded-[4px] border border-border-strong bg-bg-raised px-5 py-2.5 font-mono text-[0.8125rem] tracking-[0.06em] text-ink transition-colors duration-[160ms] hover:border-accent hover:text-accent-deep"
            >
              Direct Handover / Contact
            </a>
          </div>
        </div>

        {/* lg: portrait takes the third column beside the copy.
            Below lg it falls to its own row under the CTAs. */}
        <div
          data-hero-line
          className="max-w-[17rem] pb-16 md:col-span-2 md:col-start-2 md:pb-20 md:pl-14 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:max-w-none lg:self-center lg:pb-0 lg:pl-10"
        >
          <Portrait />
        </div>
      </div>
    </section>
  )
}
