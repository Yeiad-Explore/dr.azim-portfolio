// Clinical scope. An indexed editorial list, not a card grid — the page
// already leans on bordered boxes and a fourth one flattens the rhythm.

const COMPETENCIES = [
  {
    code: 'TRM-01',
    title: 'Trauma & Emergency Airway',
    desc: 'Polytrauma stabilization, emergency airway management, and adherence to ATLS/ACLS guidelines.',
  },
  {
    code: 'RES-02',
    title: 'ER Floor & Intensive Care',
    desc: '24/7 triage supervision, rapid resuscitation, and coordinated emergency transfer to the Cath Lab and CCU.',
  },
  {
    code: 'TEL-03',
    title: '12-Lead ECG & Telemetry',
    desc: 'Rapid bedside ECG interpretation during the critical golden hour and continuous hemodynamic monitoring.',
  },
  {
    code: 'CAR-04',
    title: 'Acute Cardiac Emergencies',
    desc: 'Rapid recognition and stabilization of ACS (STEMI/NSTEMI), arrhythmia management, defibrillation, and cardiac arrest resuscitation.',
  },
]

export function Competencies() {
  return (
    <div>
      <h3 className="mb-2 font-mono text-[0.75rem] tracking-[0.16em] text-ink-secondary">
        CLINICAL COMPETENCIES &amp; SCOPE
      </h3>

      <ol className="border-t border-border">
        {COMPETENCIES.map((comp, i) => (
          <li
            key={comp.code}
            className="grid grid-cols-[auto_1fr] items-start gap-x-5 border-b border-border py-6 md:grid-cols-[4.5rem_1fr_auto] md:gap-x-8 md:py-7"
          >
            <span aria-hidden="true" className="comp-index row-span-2 md:row-span-1">
              {String(i + 1).padStart(2, '0')}
            </span>

            <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-accent-deep md:col-start-3 md:row-start-1 md:justify-self-end md:pt-2">
              {comp.code}
            </span>

            <div className="min-w-0 md:col-start-2 md:row-start-1">
              <h4 className="font-display-head text-[1.3rem] leading-snug text-ink">
                {comp.title}
              </h4>
              <p className="mt-1.5 max-w-[56ch] text-[0.95rem] leading-relaxed text-ink-secondary">
                {comp.desc}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
