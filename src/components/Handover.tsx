import { useState } from 'react'

export function Handover() {
  const [showSbar, setShowSbar] = useState(false)
  const [copied, setCopied] = useState(false)

  // SBAR form fields
  const [situation, setSituation] = useState(
    'Acute chest pain lasting 45 mins with diaphoresis and border-zone hypotension.',
  )
  const [background, setBackground] = useState(
    'Known hypertensive, non-diabetic. No previous PCI/CABG on record.',
  )
  const [assessment, setAssessment] = useState(
    'Suspected Acute Coronary Syndrome (STEMI/NSTEMI). Initial 12-lead ECG shows ST changes.',
  )
  const [recommendation, setRecommendation] = useState(
    'Urgent transfer to Emergency Dept / Cath Lab at Labaid Cardiac Hospital for primary evaluation.',
  )

  const sbarFormattedText = `[SBAR CLINICAL HANDOVER MEMO]
To: Dr. Abdul Awal Bhuiyan, Emergency Medical Officer (Labaid Cardiac Hospital)
BMDC Reg: A-119798 · Phone: +880 1878 800 520

SITUATION:
${situation}

BACKGROUND:
${background}

ASSESSMENT:
${assessment}

RECOMMENDATION:
${recommendation}`

  const handleDownloadVCard = () => {
    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Bhuiyan;Abdul Awal;Dr.;;',
      'FN:Dr. Abdul Awal Bhuiyan, MBBS',
      'ORG:Labaid Cardiac Hospital, Dhaka;Emergency Department',
      'TITLE:Emergency Medical Officer',
      'TEL;TYPE=CELL,VOICE:+8801878800520',
      'EMAIL;TYPE=PREF,INTERNET:awalabdul38@gmail.com',
      'NOTE:BMDC Reg. A-119798 | RCEM ID 65948 | EUSEM ID M-06873',
      'URL:https://dr-abdul-awal.com',
      'END:VCARD',
    ].join('\r\n')

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Dr_Abdul_Awal_Bhuiyan.vcf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleCopySbar = () => {
    navigator.clipboard.writeText(sbarFormattedText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const whatsappUrl = `https://wa.me/8801878800520?text=${encodeURIComponent(sbarFormattedText)}`
  const mailtoUrl = `mailto:awalabdul38@gmail.com?subject=Clinical%20SBAR%20Referral%20Handover&body=${encodeURIComponent(
    sbarFormattedText,
  )}`

  return (
    <div className="space-y-8 max-w-[65ch]">
      <p className="text-[1.0625rem] leading-[1.7] text-ink-secondary">
        For urgent patient handovers, acute cardiac referrals, hospital appointments, or professional opportunities in emergency medicine:
      </p>

      {/* Physician Direct Desk Box */}
      <div className="rounded-[4px] border border-border bg-bg-raised p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-[0.75rem] tracking-[0.16em] text-ink-secondary">
            DIRECT PHYSICIAN CONTACT
          </h3>
          <button
            type="button"
            onClick={handleDownloadVCard}
            className="rounded border border-border-strong bg-bg px-2.5 py-1 font-mono text-[0.6875rem] text-accent-deep transition-colors duration-[160ms] hover:border-accent hover:text-ink"
            title="Download vCard contact for iOS & Android"
          >
            ↓ SAVE DIGITAL VCARD
          </button>
        </div>

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

      {/* SBAR Referral Generator Toggle */}
      <div className="rounded-[4px] border border-border bg-bg-raised p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-ink">
              Clinical SBAR Referral Generator
            </h4>
            <p className="text-xs text-ink-secondary mt-0.5">
              Standardized hospital-to-hospital handover memo builder for referring doctors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSbar(!showSbar)}
            className="shrink-0 rounded-[4px] border border-border bg-bg px-3 py-1.5 font-mono text-xs text-ink transition-colors duration-[160ms] hover:border-accent hover:text-accent-deep"
          >
            {showSbar ? 'HIDE SBAR MEMO' : 'BUILD SBAR MEMO'}
          </button>
        </div>

        {showSbar && (
          <div className="mt-6 space-y-4 border-t border-border pt-4 text-sm">
            <div>
              <label className="block font-mono text-[0.6875rem] text-ink-secondary">
                S — SITUATION (Immediate complaint &amp; vitals)
              </label>
              <input
                type="text"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-bg p-2 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[0.6875rem] text-ink-secondary">
                B — BACKGROUND (Medical history &amp; medications)
              </label>
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-bg p-2 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[0.6875rem] text-ink-secondary">
                A — ASSESSMENT (Clinical impression &amp; ECG findings)
              </label>
              <input
                type="text"
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-bg p-2 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[0.6875rem] text-ink-secondary">
                R — RECOMMENDATION (Requested action / Transfer)
              </label>
              <input
                type="text"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-bg p-2 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-accent-deep px-3.5 py-1.5 font-mono text-xs font-medium text-accent-ink transition-opacity hover:opacity-90"
              >
                Send via WhatsApp →
              </a>
              <a
                href={mailtoUrl}
                className="rounded border border-border bg-bg px-3.5 py-1.5 font-mono text-xs text-ink transition-colors hover:border-accent"
              >
                Send via Email →
              </a>
              <button
                type="button"
                onClick={handleCopySbar}
                className="rounded border border-border bg-bg px-3.5 py-1.5 font-mono text-xs text-ink-secondary hover:text-ink"
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-l-2 border-accent-deep pl-4 py-1">
        <p className="font-mono text-xs text-ink-secondary">
          Clinical Handover Protocol: For emergency cardiac admissions, immediate bedside notification is prioritized on arrival.
        </p>
      </div>
    </div>
  )
}
