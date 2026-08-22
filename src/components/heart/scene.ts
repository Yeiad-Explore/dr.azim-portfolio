// The page's one WebGL set-piece. Code-split — nothing here may be imported
// statically, or three.js lands in the first-paint bundle.
//
// Deliberately model-free: the form is generated from parametric surfaces at
// runtime, so there is no glTF to fetch, license, or version. It is drawn as
// contour lines over an opaque paper-coloured shell — a rotating medical
// engraving, not a shaded organ. Shading would need lights and a gradient-like
// falloff, both of which fight the flat printed surface the rest of the page keeps.
//
// Every surface is built through `grid()` so the lines are true parallels and
// meridians. three's `wireframe: true` would draw the triangulation instead,
// which reads as a mesh rather than as a drawn contour.

import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'

export interface HeartHandle {
  /** 0–1 scroll progress through the band. Drives rotation. */
  setProgress(p: number): void
  destroy(): void
}

export interface HeartOptions {
  /** R-wave positions (0–1) the contraction fires on. */
  rWaves: number[]
  /** Skip the pulse and park the model at one readable angle. */
  reducedMotion: boolean
  lineColor: string
  shellColor: string
}

interface Surface {
  shell: BufferGeometry
  lines: BufferGeometry
}

/**
 * Tessellate a parametric patch and return both the solid shell and the
 * contour lines, off one shared vertex grid.
 *
 * @param stepU draw a meridian every N columns
 * @param stepV draw a parallel every N rows
 */
function grid(
  nu: number,
  nv: number,
  point: (u: number, v: number) => Vector3,
  stepU: number,
  stepV: number,
  closedU = true,
): Surface {
  const cols = nu + 1
  const rows = nv + 1
  const pos = new Float32Array(cols * rows * 3)

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const p = point(i / nu, j / nv)
      const o = (i * rows + j) * 3
      pos[o] = p.x
      pos[o + 1] = p.y
      pos[o + 2] = p.z
    }
  }

  const attr = new BufferAttribute(pos, 3)
  const at = (i: number, j: number) => (i % cols) * rows + j

  const tris: number[] = []
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = at(i, j)
      const b = at(i + 1, j)
      const c = at(i + 1, j + 1)
      const d = at(i, j + 1)
      tris.push(a, b, c, a, c, d)
    }
  }

  const segs: number[] = []
  for (let i = 0; i < cols; i += stepU) {
    if (!closedU && i === nu) continue
    for (let j = 0; j < nv; j++) segs.push(at(i, j), at(i, j + 1))
  }
  for (let j = 0; j <= nv; j += stepV) {
    for (let i = 0; i < nu; i++) segs.push(at(i, j), at(i + 1, j))
  }

  const shell = new BufferGeometry()
  shell.setAttribute('position', attr)
  shell.setIndex(tris)

  const lines = new BufferGeometry()
  lines.setAttribute('position', attr)
  lines.setIndex(segs)

  return { shell, lines }
}

// Ventricular mass: a sphere drawn down to an apex, broad at the base, with
// the interventricular groove and a heavier left wall.
function ventricles(): Surface {
  const v = new Vector3()
  return grid(
    56,
    36,
    (uu, vv) => {
      const u = uu * Math.PI * 2
      const a = vv * Math.PI
      v.set(Math.sin(a) * Math.cos(u), Math.cos(a), Math.sin(a) * Math.sin(u))

      const t = (v.y + 1) / 2 // 1 at base, 0 at apex
      // Fills out fast and closes cleanly to zero at the apex. A non-zero
      // constant here leaves a degenerate ring around the pole that renders
      // as a crumple, so the taper has to actually reach 0.
      const taper = 1.04 * Math.pow(t, 0.55)

      v.x *= taper * 1.12
      v.z *= taper * 0.92
      v.y = v.y * 1.08 - 0.16

      const groove = Math.exp(-Math.pow((v.x + 0.16) / 0.3, 2)) * 0.14 * (1 - t)
      v.z -= Math.sign(v.z) * groove
      if (v.x < 0) v.x *= 1.14

      v.z += (1 - t) * 0.3
      v.x -= (1 - t) * 0.18
      return v
    },
    4,
    4,
  )
}

// A great vessel: a tapered tube swept along a curve, gridded the same way so
// its rings and seams match the contour language of the ventricles.
function tube(points: [number, number, number][], r0: number, r1: number, nu: number): Surface {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)))
  const frames = curve.computeFrenetFrames(nu, false)
  const p = new Vector3()
  const out = new Vector3()

  return grid(
    nu,
    12,
    (uu, vv) => {
      const i = Math.round(uu * nu)
      const r = r0 + (r1 - r0) * uu
      const theta = vv * Math.PI * 2
      curve.getPointAt(uu, p)
      const n = frames.normals[i]
      const b = frames.binormals[i]
      out.set(
        p.x + r * (Math.cos(theta) * n.x + Math.sin(theta) * b.x),
        p.y + r * (Math.cos(theta) * n.y + Math.sin(theta) * b.y),
        p.z + r * (Math.cos(theta) * n.z + Math.sin(theta) * b.z),
      )
      return out
    },
    3,
    3,
    false,
  )
}

export function mount(canvas: HTMLCanvasElement, opts: HeartOptions): HeartHandle {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setClearAlpha(0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(32, 1, 0.1, 100)
  camera.position.set(0, 0, 6.5)

  const lineMat = new LineBasicMaterial({
    color: new Color(opts.lineColor),
    transparent: true,
    opacity: 0.9,
  })
  // Opaque and very slightly inset: it writes depth, so contour lines on the
  // far side are occluded. That reads as solid without a single light.
  const shellMat = new MeshBasicMaterial({ color: new Color(opts.shellColor), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })

  const surfaces: Surface[] = [
    ventricles(),
    // aortic arch — up out of the base, over, then down and *into* the mass.
    // Ending inside the silhouette means the descending limb is occluded at
    // every angle instead of stopping in mid air on some of them.
    tube(
      [
        [-0.06, 0.62, 0.02],
        [-0.02, 1.24, -0.06],
        [0.22, 1.54, -0.28],
        [0.56, 1.4, -0.52],
        [0.52, 0.72, -0.52],
        [0.2, -0.1, -0.3],
      ],
      0.23,
      0.15,
      48,
    ),
    // pulmonary trunk — shorter, forward of the aorta, leaning the other way
    tube(
      [
        [0.34, 0.6, 0.2],
        [0.26, 1.1, 0.12],
        [0.02, 1.36, -0.04],
      ],
      0.21,
      0.15,
      26,
    ),
    // superior vena cava — near-vertical, off the right shoulder
    tube(
      [
        [-0.56, 0.55, -0.12],
        [-0.6, 1.1, -0.16],
        [-0.58, 1.5, -0.18],
      ],
      0.16,
      0.13,
      22,
    ),
  ]

  const group = new Group()
  const pulseGroup = new Group()
  group.add(pulseGroup)

  for (const s of surfaces) {
    pulseGroup.add(new Mesh(s.shell, shellMat))
    pulseGroup.add(new LineSegments(s.lines, lineMat))
  }

  // Presentation: apex toward the viewer's left, tipped forward, sitting a
  // little low in frame so the arch has room at the top.
  group.rotation.z = -0.14
  group.rotation.x = 0.08
  group.position.y = -0.24
  scene.add(group)

  let width = 0
  let height = 0

  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h || (w === width && h === height)) return
    width = w
    height = h
    // Capped so a 3x phone doesn't render nine times the pixels for no gain.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  // Systole is fast, diastole is slow — an even sine would read as a throb,
  // which is the "infinite pulse loop" this project bans on purpose.
  const contraction = (phase: number) => {
    if (phase < 0 || phase > 1) return 0
    if (phase < 0.22) return Math.sin((phase / 0.22) * Math.PI * 0.5)
    return Math.pow(1 - (phase - 0.22) / 0.78, 2)
  }

  let progress = 0
  let running = true
  let frame = 0

  const render = () => {
    resize()

    // ~75° across the whole band, so the rotation belongs to the scroll —
    // nothing spins on its own while the reader sits still. The window is
    // picked so the aortic arch stays legible end to end; a full revolution
    // spends half its time edge-on, where the model reads as stubs.
    group.rotation.y = 2.15 + progress * Math.PI * 0.42

    let squeeze = 0
    if (!opts.reducedMotion) {
      for (const r of opts.rWaves) {
        // each contraction occupies the 9% of the band following its R wave
        squeeze = Math.max(squeeze, contraction((progress - r) / 0.09))
      }
    }
    const s = 1 - squeeze * 0.055
    pulseGroup.scale.set(s, 1 - squeeze * 0.08, s)

    renderer.render(scene, camera)
  }

  const loop = () => {
    if (!running) return
    frame = requestAnimationFrame(loop)
    render()
  }

  if (opts.reducedMotion) {
    // One frame, at a readable angle, and never again.
    progress = 0.5
    resize()
    render()
  } else {
    loop()
  }

  return {
    setProgress(p) {
      progress = p
    },
    destroy() {
      running = false
      cancelAnimationFrame(frame)
      for (const s of surfaces) {
        s.shell.dispose()
        s.lines.dispose()
      }
      lineMat.dispose()
      shellMat.dispose()
      renderer.dispose()
    },
  }
}
