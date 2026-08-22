// ECG trace geometry — one segment per section beat.
// Paths are authored in a normalized space: `along` runs 0→1000 down the
// section, `deflect` is the excursion off the baseline. The same command
// list is serialized twice: vertical (desktop left gutter, 64 wide) and
// horizontal (mobile top-of-section rule, 64 tall).

type Cmd =
  | { c: 'M' | 'L'; p: [number, number] }
  | { c: 'Q'; p: [number, number, number, number] }

const BASE = 36 // baseline offset inside the 64-unit cross axis

function flat(s: number, len: number, cmds: Cmd[]) {
  cmds.push({ c: 'L', p: [s + len, 0] })
}

// One sinus beat: P wave, QRS complex, T wave, then baseline.
function beat(s: number, len: number, amp: number, cmds: Cmd[]) {
  const f = (t: number) => s + t * len
  cmds.push({ c: 'L', p: [f(0.18), 0] })
  cmds.push({ c: 'Q', p: [f(0.24), 5, f(0.3), 0] }) // P
  cmds.push({ c: 'L', p: [f(0.36), 0] })
  cmds.push({ c: 'L', p: [f(0.385), -4] }) // q
  cmds.push({ c: 'L', p: [f(0.42), amp] }) // R
  cmds.push({ c: 'L', p: [f(0.455), -7] }) // s
  cmds.push({ c: 'L', p: [f(0.48), 0] })
  cmds.push({ c: 'L', p: [f(0.56), 0] })
  cmds.push({ c: 'Q', p: [f(0.67), 8, f(0.78), 0] }) // T
  cmds.push({ c: 'L', p: [f(1), 0] })
}

// VT-like run: rapid wide complexes, no P or T.
function vtBurst(s: number, len: number, n: number, cmds: Cmd[]) {
  const step = len / n
  for (let i = 0; i < n; i++) {
    const a = s + i * step
    cmds.push({ c: 'L', p: [a + step * 0.3, 16] })
    cmds.push({ c: 'L', p: [a + step * 0.7, -12] })
    cmds.push({ c: 'L', p: [a + step, 0] })
  }
}

function sinusRun(start: number, count: number, len: number, amp: number, cmds: Cmd[]) {
  for (let i = 0; i < count; i++) beat(start + i * len, len, amp, cmds)
  return start + count * len
}

type Builder = (cmds: Cmd[]) => void

// Section 0 — hero: flatline, one beat near the end, flat out.
// Section 1 — practice (the floor): sharper complexes with a VT-like burst.
// Section 2 — heart band: the burst resolves into a slow, deliberate rhythm.
//             Its four R waves are what the WebGL heart contracts on.
// Section 3 — chart: settling sinus.
// Section 4 — handover: steady rhythm.
const SECTIONS: Builder[] = [
  (c) => {
    flat(0, 700, c)
    beat(700, 220, 24, c)
    flat(920, 80, c)
  },
  (c) => {
    flat(0, 30, c)
    sinusRun(30, 2, 180, 26, c)
    vtBurst(390, 240, 7, c)
    beat(630, 180, 28, c)
    beat(810, 170, 26, c)
    flat(980, 20, c)
  },
  (c) => {
    flat(0, 90, c)
    const e = sinusRun(90, 4, 200, 30, c)
    flat(e, 1000 - e, c)
  },
  (c) => {
    flat(0, 50, c)
    const e = sinusRun(50, 4, 220, 18, c)
    flat(e, 1000 - e, c)
  },
  (c) => {
    flat(0, 40, c)
    const e = sinusRun(40, 4, 220, 16, c)
    flat(e, 1000 - e, c)
  },
]

const r = (n: number) => Math.round(n * 10) / 10

function serialize(cmds: Cmd[], map: (along: number, deflect: number) => [number, number]) {
  return cmds
    .map((cmd) => {
      if (cmd.c === 'Q') {
        const [a1, d1] = map(cmd.p[0], cmd.p[1])
        const [a2, d2] = map(cmd.p[2], cmd.p[3])
        return `Q${r(a1)} ${r(d1)} ${r(a2)} ${r(d2)}`
      }
      const [x, y] = map(cmd.p[0], cmd.p[1])
      return `${cmd.c}${r(x)} ${r(y)}`
    })
    .join(' ')
}

// R-wave positions (0–1 along section 2), derived from the same numbers that
// draw it, so the WebGL heart contracts on exactly the spikes you can see.
export const HEART_BAND_R_WAVES = [0, 1, 2, 3].map((i) => (90 + i * 200 + 200 * 0.42) / 1000)

export interface TraceSegment {
  v: string // vertical, viewBox 0 0 64 1000
  h: string // horizontal, viewBox 0 0 1000 64
}

export const TRACES: TraceSegment[] = SECTIONS.map((build) => {
  const cmds: Cmd[] = [{ c: 'M', p: [0, 0] }]
  build(cmds)
  return {
    v: serialize(cmds, (along, d) => [BASE - d, along]),
    h: serialize(cmds, (along, d) => [along, BASE - d]),
  }
})
