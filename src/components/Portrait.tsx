// Hero portrait. Aspect ratio is reserved in CSS and the intrinsic width/height
// are declared, so the image reserves its box before it decodes — no CLS.

export function Portrait() {
  return (
    <figure className="relative border border-border-strong bg-bg-raised p-1.5">
      <img
        src="/img/portrait-1024.webp"
        srcSet="/img/portrait-560.webp 560w, /img/portrait-1024.webp 1024w"
        sizes="(min-width: 1024px) 18rem, (min-width: 640px) 20rem, 100vw"
        width={1122}
        height={1402}
        alt="Dr. Abdul Awal Bhuiyan in surgical scrubs with a stethoscope."
        className="portrait-img"
        decoding="async"
        fetchPriority="high"
      />
      <figcaption className="flex items-baseline justify-between gap-3 px-1 pt-2.5 pb-1 font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint">
        <span>A. A. BHUIYAN</span>
        <span aria-hidden="true">ON DUTY</span>
      </figcaption>
    </figure>
  )
}
