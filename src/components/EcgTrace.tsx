import { TRACES } from '../lib/ecg'

interface EcgTraceProps {
  index: number
  variant: 'v' | 'h'
}

// One segment of the page-long trace. Rendered fully drawn by default so the
// no-JS / reduced-motion page is complete; GSAP takes over dashoffset later.
export function EcgTrace({ index, variant }: EcgTraceProps) {
  const d = TRACES[index][variant]
  const viewBox = variant === 'v' ? '0 0 64 1000' : '0 0 1000 64'
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      data-ecg-index={index}
      data-ecg-variant={variant}
    >
      <path
        d={d}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="ecg-path"
      />
    </svg>
  )
}
