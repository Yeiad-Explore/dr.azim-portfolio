import { useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Chapter } from './components/Chapter'
import { Competencies } from './components/Competencies'
import { RhythmStrip } from './components/RhythmStrip'
import { GoldenHourCase } from './components/GoldenHourCase'
import { HeartBand } from './components/HeartBand'
import { PostingRail } from './components/PostingRail'
import { Vitals } from './components/Vitals'
import { Handover } from './components/Handover'
import { ShiftClock } from './components/ShiftClock'
import { TriageDesk } from './components/TriageDesk'
import { BookingDesk } from './components/BookingDesk'
import { initMotion } from './lib/motion'

function App() {
  useEffect(() => initMotion(), [])

  return (
    <>
      <Navbar />
      <ShiftClock />
      <TriageDesk />
      <BookingDesk />
      <Hero />

      <main>
        <Chapter
          index={1}
          beatIndex={1}
          id="practice"
          time="22:10"
          beat="PRACTICE"
          title="On the emergency floor."
          wide
        >
          <div className="max-w-[65ch] space-y-4">
            <p>
              Cases at Labaid Cardiac Hospital arrive mid-crisis, not
              mid-checkup. Dr. Abdul Awal Bhuiyan manages critical medical emergencies,
              trauma, bedside resuscitation, and immediate intensive care.
            </p>
            <p>
              Trained across high-volume emergency floors in Dhaka, providing rapid clinical decision-making during the critical golden hour.
            </p>
          </div>

          <div className="!mt-12">
            <Competencies />
          </div>

          <div className="!mt-12">
            <RhythmStrip />
          </div>

          <div className="!mt-12">
            <GoldenHourCase />
          </div>

          <div className="!mt-12">
            <PostingRail />
          </div>
        </Chapter>

        <HeartBand />

        <Chapter index={2} beatIndex={3} id="chart" time="22:40" beat="CHART" title="Registration &amp; Registry." wide>
          <Vitals />
        </Chapter>

        <Chapter
          index={3}
          beatIndex={4}
          id="handover"
          time="23:41"
          beat="HANDOVER"
          title="The shift never really ends."
          invert
        >
          <Handover />
        </Chapter>
      </main>

      <footer className="band-ink border-t border-border">
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
