// Appointment history as a rail keyed to the trace: vertical when stacked,
// horizontal from sm up. Chronological — earliest posting first.

interface Posting {
  role: string
  hospital: string
  dates: string
  status: string
  active: boolean
}

const POSTINGS: Posting[] = [
  {
    role: 'Emergency Medical Officer',
    hospital: 'Unity Aid Hospital, Dhaka',
    dates: '05.01.2023 → 13.09.2025',
    status: 'Completed',
    active: false,
  },
  {
    role: 'Emergency Medical Officer',
    hospital: 'Labaid Cardiac Hospital, Dhaka',
    dates: '14.09.2025 → Present',
    status: 'Active',
    active: true,
  },
]

export function PostingRail() {
  return (
    <div>
      <h3 className="mb-6 font-mono text-[0.75rem] tracking-[0.16em] text-ink-secondary">
        OFFICIAL APPOINTMENT LOG
      </h3>

      <div className="relative">
        <div
          aria-hidden="true"
          className="rail-line top-2 bottom-2 left-[3px] w-px sm:top-[3px] sm:right-1 sm:bottom-auto sm:left-1 sm:h-px sm:w-auto"
        />

        <ol className="relative grid gap-9 sm:grid-cols-2 sm:gap-10">
          {POSTINGS.map((p) => (
            <li key={p.hospital} className="relative pl-7 sm:pl-0">
              <span
                aria-hidden="true"
                data-active={p.active}
                className="rail-node absolute top-[7px] left-0 block sm:static sm:mb-5"
              />
              <p className="font-mono text-[0.8125rem] text-ink-secondary">
                {p.dates}{' '}
                <span className={p.active ? 'text-accent-deep' : 'text-ink-faint'}>
                  ({p.status})
                </span>
              </p>
              <p className="font-display-head mt-1.5 text-[1.15rem] leading-snug text-ink">
                {p.role}
              </p>
              <p className="mt-0.5 text-[0.95rem] text-ink-secondary">{p.hospital}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
