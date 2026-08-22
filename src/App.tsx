import { useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Chapter } from './components/Chapter'
import { Vitals } from './components/Vitals'
import { Handover } from './components/Handover'
import { ShiftClock } from './components/ShiftClock'
import { initMotion } from './lib/motion'

const COMPETENCIES = [
  {
    code: 'CAR-01',
    title: 'Acute Cardiac Emergencies',
    desc: 'ACS (STEMI/NSTEMI), acute arrhythmias, defibrillation, and cardiac arrest resuscitation protocols.',
  },
  {
    code: 'TRM-02',
    title: 'Trauma & Emergency Airway',
    desc: 'Polytrauma stabilization, emergency airway management, and adherence to ATLS/ACLS guidelines.',
  },
  {
    code: 'TEL-03',
    title: '12-Lead ECG & Telemetry',
    desc: 'Rapid bedside ECG interpretation during the critical golden hour and continuous hemodynamic monitoring.',
  },
  {
    code: 'CCU-04',
    title: 'ER Floor & Intensive Care',
    desc: '24/7 triage supervision, rapid resuscitation, and coordinated emergency transfer to the Cath Lab and CCU.',
  },
]

function App() {
  useEffect(() => initMotion(), [])

  return (
    <>
      <Navbar />
      <ShiftClock />
      <Hero />

      <main>
        <Chapter
          index={1}
          id="practice"
          time="22:10"
          beat="PRACTICE"
          title="On the emergency floor."
          wide
        >
          <div className="max-w-[65ch] space-y-4">
            <p>
              Cases at Labaid Cardiac Hospital arrive mid-heart-attack, not
              mid-checkup. Dr. Abdul Awal Bhuiyan manages acute cardiac crises,
              trauma emergencies, bedside resuscitation, and immediate intensive care.
            </p>
            <p>
              Trained across high-volume emergency floors in Dhaka, providing rapid clinical decision-making during the critical golden hour.
            </p>
          </div>

          <div className="!mt-10">
            <h3 className="mb-4 font-mono text-[0.75rem] tracking-[0.16em] text-ink-secondary">
              CLINICAL COMPETENCIES &amp; SCOPE
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {COMPETENCIES.map((comp) => (
                <div
                  key={comp.code}
                  className="rounded-[4px] border border-border bg-bg-raised p-4 transition-colors duration-[160ms] hover:border-border-strong"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[0.6875rem] text-accent-deep">
                      {comp.code}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-border-strong" aria-hidden="true" />
                  </div>
                  <h4 className="font-medium text-ink">{comp.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{comp.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="!mt-8 rounded-[4px] border border-border bg-bg-well p-5 md:p-6">
            <h3 className="mb-4 font-mono text-[0.75rem] tracking-[0.16em] text-ink-secondary">
              OFFICIAL APPOINTMENT LOG
            </h3>
            <div className="space-y-4 font-mono text-[0.8125rem]">
              <div className="flex flex-col justify-between gap-1 border-b border-border pb-3 sm:flex-row sm:items-baseline">
                <div>
                  <span className="font-medium text-ink">Emergency Medical Officer</span>
                  <span className="block font-sans text-sm text-ink-secondary">
                    Labaid Cardiac Hospital, Dhaka
                  </span>
                </div>
                <span className="text-accent-deep">14.09.2025 → Present (Active)</span>
              </div>
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                <div>
                  <span className="font-medium text-ink">Emergency Medical Officer</span>
                  <span className="block font-sans text-sm text-ink-secondary">
                    Unity Aid Hospital, Dhaka
                  </span>
                </div>
                <span className="text-ink-faint">05.01.2023 → 13.09.2025 (Completed)</span>
              </div>
            </div>
          </div>
        </Chapter>

        <Chapter index={2} id="chart" time="22:40" beat="CHART" title="Registration &amp; Registry." wide>
          <Vitals />
        </Chapter>

        <Chapter
          index={3}
          id="handover"
          time="23:41"
          beat="HANDOVER"
          title="The shift never really ends."
        >
          <Handover />
        </Chapter>
      </main>

      <footer className="border-t border-border bg-bg-raised">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div aria-hidden="true" className="wordmark">
            A.A.B
          </div>
          <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <p className="font-medium text-ink">Dr. Abdul Awal Bhuiyan, MBBS</p>
              <p className="font-mono text-xs text-ink-secondary">
                BMDC Reg. A-119798 · Emergency Medical Officer, Labaid Cardiac Hospital
              </p>
            </div>
            <p
              aria-hidden="true"
              className="font-mono text-[0.8125rem] tracking-[0.2em] text-ink-secondary"
            >
              END OF SHIFT - 23:41
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App
