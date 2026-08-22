import { useState } from 'react'

interface CaseMilestone {
  time: string
  phase: string
  title: string
  vitals: {
    bp: string
    hr: string
    spo2: string
    ecg: string
  }
  findings: string
  action: string
  protocol: string
}

const MILESTONES: CaseMilestone[] = [
  {
    time: 'T+00 min',
    phase: 'ARRIVAL & TRIAGE',
    title: 'Emergency Bay Red Alert Entry',
    vitals: {
      bp: '88/54 mmHg',
      hr: '112 bpm',
      spo2: '91% (Room Air)',
      ecg: 'Acquisition in progress',
    },
    findings: '58-year-old male presenting with 45 minutes of acute crushing retrosternal chest pain radiating to left arm and jaw, accompanied by profuse cold diaphoresis and impending doom.',
    action: 'Direct triage to Resuscitation Bay 1. High-flow oxygen titrated via nasal cannula, bilateral large-bore IV cannulae (18G), attached to multi-lead cardiac monitor.',
    protocol: 'RCEM Priority 1 Red Triage Protocol',
  },
  {
    time: 'T+03 min',
    phase: 'DIAGNOSTIC CONVERGENCE',
    title: 'Bedside 12-Lead ECG Analysis',
    vitals: {
      bp: '85/52 mmHg',
      hr: '108 bpm',
      spo2: '96% (2L O2)',
      ecg: '>3mm ST-Elevation V1–V4',
    },
    findings: 'Immediate 12-lead ECG demonstrates hyperacute ST-segment elevation in Leads V1–V4 with reciprocal ST depression in inferior leads (II, III, aVF). Immediate diagnosis: Extensive Acute Anterior STEMI (LAD Occlusion).',
    action: 'Rapid confirmation within 3 minutes of arrival. Immediate zero-delay order issued to activate cardiac catheterization team.',
    protocol: 'ACC/AHA Golden Hour Diagnostic Standard (<10m ECG target achieved in 3m)',
  },
  {
    time: 'T+07 min',
    phase: 'ACUTE PHARMACOTHERAPY',
    title: 'Emergency Antiplatelet & Anticoagulant Loading',
    vitals: {
      bp: '92/58 mmHg',
      hr: '98 bpm',
      spo2: '98%',
      ecg: 'Persistent ST elevation',
    },
    findings: 'Patient remains hemodynamically tenuous with border-zone cardiogenic shock. Fluid challenge initiated while avoiding pulmonary overload.',
    action: 'Oral loading of Aspirin 300 mg chewable + Ticagrelor 180 mg administered. IV Unfractionated Heparin 5000 IU bolus delivered. IV Morphine 3 mg with antiemetic for pain relief.',
    protocol: 'ESC Guideline for Acute Myocardial Infarction',
  },
  {
    time: 'T+12 min',
    phase: 'CODE STEMI ACTIVATION',
    title: 'Interventional Cardiology Coordination',
    vitals: {
      bp: '96/60 mmHg',
      hr: '92 bpm',
      spo2: '98%',
      ecg: 'Telemetry monitored',
    },
    findings: 'Direct physician-to-physician communication with Senior Interventional Cardiologist on call. Cath Lab table prepared, interventional team mobilized in-house.',
    action: 'Formal clinical SBAR structured handover communicated. Consent documented and emergency lab draws (Cardiac Troponin I, CK-MB, electrolytes, cross-match) sent stat.',
    protocol: 'Hospital Fast-Track STEMI Pathway',
  },
  {
    time: 'T+22 min',
    phase: 'CATH LAB HANDOVER',
    title: 'Primary Percutaneous Coronary Intervention (pPCI)',
    vitals: {
      bp: '102/64 mmHg',
      hr: '84 bpm',
      spo2: '99%',
      ecg: 'Transfer monitor active',
    },
    findings: 'Patient escorted directly by Dr. Bhuiyan from the ER bay into the adjacent Cath Lab without floor delays. 100% proximal LAD occlusion identified.',
    action: 'Successful coronary wire cross and balloon angioplasty with drug-eluting stent (DES) placement. Door-to-Balloon time: 48 minutes total (Target <90m).',
    protocol: 'Myocardial Salvage & Golden Hour Success',
  },
]

export function GoldenHourCase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const current = MILESTONES[activeIndex]

  return (
    <div className="rounded-[6px] border border-border-strong bg-bg-raised p-5 md:p-8">
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.75rem] font-semibold tracking-[0.16em] text-accent-deep">
            EMERGENCY CASE STUDY
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        </div>
        <h3 className="font-display-head mt-1 text-xl text-ink md:text-2xl">
          The Golden Hour: Acute Code STEMI Resuscitation
        </h3>
        <p className="mt-1 text-sm text-ink-secondary">
          Step-by-step clinical protocol demonstrating rapid decision-making from ER bay arrival to Cath Lab revascularization.
        </p>
      </div>

      {/* Timeline Step Selector */}
      <div className="mt-6 flex overflow-x-auto pb-2 gap-2 scrollbar-thin">
        {MILESTONES.map((step, idx) => (
          <button
            key={step.time}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`shrink-0 rounded-[4px] px-3 py-2 text-left transition-all duration-[160ms] ${
              activeIndex === idx
                ? 'bg-accent-deep text-accent-ink shadow-sm'
                : 'border border-border bg-bg text-ink-secondary hover:border-border-strong hover:text-ink'
            }`}
          >
            <span className="block font-mono text-[0.6875rem] font-bold">
              {step.time}
            </span>
            <span className="block text-xs font-medium truncate max-w-[9rem]">
              {step.phase}
            </span>
          </button>
        ))}
      </div>

      {/* Active Milestone Display */}
      <div className="mt-6 grid gap-6 md:grid-cols-12">
        {/* Clinical Narrative */}
        <div className="space-y-4 md:col-span-8">
          <div>
            <span className="font-mono text-xs font-semibold text-accent-deep">
              {current.time} · {current.phase}
            </span>
            <h4 className="font-display-head mt-1 text-xl text-ink">
              {current.title}
            </h4>
          </div>

          <div className="space-y-3 text-sm leading-relaxed text-ink-secondary">
            <div>
              <span className="block font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint">
                CLINICAL PRESENTATION
              </span>
              <p className="mt-1 text-ink">{current.findings}</p>
            </div>

            <div className="rounded border border-border-strong bg-bg-well p-3">
              <span className="block font-mono text-[0.6875rem] tracking-[0.14em] text-accent-deep font-semibold">
                PHYSICIAN ACTION &amp; INTERVENTION
              </span>
              <p className="mt-1 text-ink font-medium">{current.action}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-xs text-ink-faint">
            <span>Protocol: {current.protocol}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                className="rounded border border-border bg-bg px-2.5 py-1 text-ink-secondary disabled:opacity-40 hover:text-ink"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={activeIndex === MILESTONES.length - 1}
                onClick={() => setActiveIndex((prev) => Math.min(MILESTONES.length - 1, prev + 1))}
                className="rounded border border-border bg-bg px-2.5 py-1 text-ink-secondary disabled:opacity-40 hover:text-ink"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry HUD Card */}
        <div className="space-y-3 rounded border border-border bg-bg p-4 md:col-span-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-mono text-[0.6875rem] font-semibold text-ink-secondary">
              BAY 1 TELEMETRY HUD
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" aria-hidden="true" />
          </div>

          <dl className="space-y-2.5 font-mono text-[0.75rem]">
            <div className="flex items-center justify-between">
              <dt className="text-ink-faint">NIBP (BP):</dt>
              <dd className="font-bold text-ink">{current.vitals.bp}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-faint">PULSE (HR):</dt>
              <dd className="font-bold text-accent-deep">{current.vitals.hr}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-faint">SpO2 SAT:</dt>
              <dd className="font-bold text-ink">{current.vitals.spo2}</dd>
            </div>
            <div className="border-t border-border pt-2">
              <dt className="text-ink-faint text-[0.625rem]">12-LEAD RHYTHM:</dt>
              <dd className="mt-0.5 font-bold text-ink leading-tight text-xs">
                {current.vitals.ecg}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
