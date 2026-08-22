// Official Medical Registry & Credentials flowsheet in the ECG-paper well.

interface RegistryItem {
  authority: string
  title: string
  credential: string
  status: string
  statusType: 'verified' | 'license' | 'active'
}

const REGISTRY: RegistryItem[] = [
  {
    authority: 'BMDC',
    title: 'National Medical Licensure',
    credential: 'Reg. No. A-119798 · Bangladesh Medical & Dental Council',
    status: 'Full License',
    statusType: 'license',
  },
  {
    authority: 'RCEM (UK)',
    title: 'Membership of Royal College of Emergency Medicine',
    credential: 'MRCEM Primary (2024 - Pass) · MRCEM SBA (2026 - Pass)',
    status: 'Pass / Verified',
    statusType: 'verified',
  },
  {
    authority: 'RCEM & EUSEM',
    title: 'International Emergency Societies',
    credential: 'RCEM Associate Member (ID 65948) · EUSEM Member (ID M-06873)',
    status: 'Active Member',
    statusType: 'active',
  },
  {
    authority: 'DGME / DU',
    title: 'Primary Medical Qualification',
    credential: 'MBBS · Mugda Medical College, University of Dhaka (2021)',
    status: 'Verified MBBS',
    statusType: 'verified',
  },
]

export function Vitals() {
  return (
    <div className="space-y-6 md:pr-8">
      <div className="ecg-well rounded-[6px] border border-border-strong bg-bg-well p-5 md:p-8">
        <div className="mb-6 flex flex-col justify-between gap-2 border-b border-border-strong pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-mono text-[0.75rem] tracking-[0.16em] text-accent-deep">
              OFFICIAL CLINICAL REGISTRY
            </h3>
            <p className="font-display-head mt-1 text-lg text-ink">
              Medical Licensure &amp; Post-Graduate Status
            </p>
          </div>
          <div className="font-mono text-[0.6875rem] text-ink-secondary">
            DOC-ID: AAB-EM-2026
          </div>
        </div>

        <div className="divide-y divide-border">
          {REGISTRY.map((item) => (
            <div
              key={item.authority + item.title}
              className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.6875rem] font-semibold tracking-wider text-accent-deep">
                    {item.authority}
                  </span>
                  <span className="text-border-strong">|</span>
                  <span className="font-medium text-ink text-[0.9375rem]">{item.title}</span>
                </div>
                <p className="font-mono text-[0.8125rem] text-ink-secondary">
                  {item.credential}
                </p>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-border-strong bg-bg-raised px-2.5 py-1 font-mono text-[0.6875rem] font-medium text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
