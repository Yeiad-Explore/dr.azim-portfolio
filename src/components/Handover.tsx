// Handover — Physician Direct Desk for referrals, clinical handovers, and inquiries.

export function Handover() {
  return (
    <div className="space-y-8 max-w-[65ch]">
      <p className="text-[1.0625rem] leading-[1.7] text-ink-secondary">
        For urgent patient handovers, acute cardiac referrals, hospital appointments, or professional opportunities in emergency medicine:
      </p>

      <div className="rounded-[4px] border border-border bg-bg-raised p-5 md:p-6">
        <h3 className="mb-4 font-mono text-[0.75rem] tracking-[0.16em] text-ink-secondary">
          DIRECT PHYSICIAN CONTACT
        </h3>
        <dl className="space-y-4 font-mono text-[0.875rem]">
          <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-xs text-ink-secondary">URGENT / DIRECT LINE</dt>
            <dd>
              <a
                href="tel:+8801878800520"
                className="font-medium text-ink transition-colors duration-[160ms] hover:text-accent-deep"
              >
                +880 1878 800 520
              </a>
            </dd>
          </div>

          <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-xs text-ink-secondary">OFFICIAL EMAIL</dt>
            <dd>
              <a
                href="mailto:awalabdul38@gmail.com"
                className="font-medium text-ink transition-colors duration-[160ms] hover:text-accent-deep"
              >
                awalabdul38@gmail.com
              </a>
            </dd>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <dt className="text-xs text-ink-secondary">DUTY LOCATION</dt>
            <dd className="font-sans text-sm font-medium text-ink sm:text-right">
              Emergency Department, Labaid Cardiac Hospital, Dhaka
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-l-2 border-accent-deep pl-4 py-1">
        <p className="font-mono text-xs text-ink-secondary">
          Clinical Handover Protocol: For emergency cardiac admissions, immediate bedside notification is prioritized on arrival.
        </p>
      </div>
    </div>
  )
}
