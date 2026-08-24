// The page's one WebGL set-piece. Code-split — nothing here may be imported
// statically, or three.js lands in the first-paint bundle.
//
// A stylized torso, built from parametric surfaces at runtime — no glTF to
// fetch, license, or version. Drawn as contour lines over an opaque
// paper-coloured shell: a rotating anatomical diagram, not a shaded organ.
//
// The subject is deliberately the whole primary survey — airway, breathing,
// circulation, neuro, the chest wall itself — not the heart alone. An
// emergency physician's job is the sequence, not any one organ in it; a
// heart-only set-piece read as a cardiology subspecialty, which this site
// must not claim. See CLAUDE.md's 2026-08-22 amendment.
//
// Every surface is built through `grid()` so the lines are true parallels and
// meridians. three's `wireframe: true` would draw the triangulation instead,
// which reads as a mesh rather than a drawn contour.

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

export type SystemId = 'airway' | 'breathing' | 'circulation' | 'neuro' | 'trauma'

export interface HeartHandle {
  /** 0–1 scroll progress through the band. Drives rotation. */
  setProgress(p: number): void
  /** Dim every system but this one. Pass null to return to even visibility. */
  focusLandmark(id: SystemId | null): void
  destroy(): void
}

export interface HeartOptions {
  /** R-wave positions (0–1) the embedded heart contracts on. */
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

// Torso wall: an open cylindrical sweep, not a closed sphere — it needs an
// open neck and waist, not sealed poles. Widest at the chest, narrower at
// both ends, flattened front-to-back.
function torsoShell(): Surface {
  const v = new Vector3()
  return grid(
    52,
    30,
    (uu, vv) => {
      const theta = uu * Math.PI * 2
      const t = vv // 0 at the waist, 1 at the neck opening
      const bulge = 0.55 + 0.45 * Math.sin(Math.PI * t)
      const rx = 1.05 * bulge
      const rz = 0.72 * bulge
      v.set(Math.cos(theta) * rx, t * 2.6 - 1.3, Math.sin(theta) * rz)
      return v
    },
    4,
    4,
  )
}

// A lung: a squashed ellipsoid, flattened toward the mediastinum, positioned
// left or right of the airway.
function lung(side: -1 | 1): Surface {
  const v = new Vector3()
  return grid(
    32,
    22,
    (uu, vv) => {
      const u = uu * Math.PI * 2
      const a = vv * Math.PI
      v.set(Math.sin(a) * Math.cos(u), Math.cos(a), Math.sin(a) * Math.sin(u))
      v.x *= 0.4
      // flatten the medial face so the pair doesn't overlap the airway/heart
      if (v.x * side < 0) v.x *= 0.45
      v.y = v.y * 0.95 + 0.15
      v.z *= 0.34
      v.x += side * 0.58
      return v
    },
    4,
    3,
  )
}

// A great vessel or airway branch: a tapered tube swept along a curve.
function tube(points: [number, number, number][], r0: number, r1: number, nu: number): Surface {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)))
  const frames = curve.computeFrenetFrames(nu, false)
  const p = new Vector3()
  const out = new Vector3()

  return grid(
    nu,
    10,
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

// The embedded heart, at torso scale: a sphere drawn down to an apex, with
// the interventricular groove and a heavier left wall. Identical shape to
// the earlier single-organ set-piece, just scaled down to sit inside a body.
function ventricles(): Surface {
  const v = new Vector3()
  return grid(
    44,
    28,
    (uu, vv) => {
      const u = uu * Math.PI * 2
      const a = vv * Math.PI
      v.set(Math.sin(a) * Math.cos(u), Math.cos(a), Math.sin(a) * Math.sin(u))

      const t = (v.y + 1) / 2
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

function scaleAndPlace(s: Surface, scale: number, tx: number, ty: number, tz: number): Surface {
  s.shell.scale(scale, scale, scale)
  s.shell.translate(tx, ty, tz)
  s.lines.scale(scale, scale, scale)
  s.lines.translate(tx, ty, tz)
  return s
}

interface SystemGroup {
  id: SystemId
  shellMeshes: Mesh[]
  lineMeshes: LineSegments[]
}

export function mount(canvas: HTMLCanvasElement, opts: HeartOptions): HeartHandle {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setClearAlpha(0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0, 8.4)

  const accent = new Color(opts.lineColor)
  const dim = new Color(opts.lineColor).lerp(new Color(opts.shellColor), 0.42)
  const shellColor = new Color(opts.shellColor)

  const shellMat = () =>
    new MeshBasicMaterial({ color: shellColor, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
  const lineMat = () => new LineBasicMaterial({ color: dim, transparent: true, opacity: 0.72 })

  const group = new Group()
  const bodyGroup = new Group() // everything except the pulsing heart
  const pulseGroup = new Group() // the embedded heart + its vessels, on its own scale beat
  group.add(bodyGroup)
  bodyGroup.add(pulseGroup)
  scene.add(group)

  const systems: SystemGroup[] = []
  const allDisposables: BufferGeometry[] = []
  const allMaterials: (MeshBasicMaterial | LineBasicMaterial)[] = []

  function addSystem(id: SystemId, surfaces: Surface[], parent: Group) {
    const g: SystemGroup = { id, shellMeshes: [], lineMeshes: [] }
    for (const s of surfaces) {
      const sm = shellMat()
      const lm = lineMat()
      allMaterials.push(sm, lm)
      allDisposables.push(s.shell, s.lines)
      const shellMesh = new Mesh(s.shell, sm)
      const lineMesh = new LineSegments(s.lines, lm)
      parent.add(shellMesh, lineMesh)
      g.shellMeshes.push(shellMesh)
      g.lineMeshes.push(lineMesh)
    }
    systems.push(g)
  }

  // ── torso wall — doubles as the "trauma" landmark (the chest wall itself)
  addSystem('trauma', [torsoShell()], bodyGroup)

  // ── airway — trachea into the two main bronchi
  addSystem(
    'airway',
    [
      tube(
        [
          [0, 1.35, 0.06],
          [0, 0.95, 0.02],
          [0, 0.5, -0.02],
        ],
        0.095,
        0.085,
        20,
      ),
      tube(
        [
          [0, 0.5, -0.02],
          [-0.32, 0.18, 0.04],
          [-0.56, -0.12, 0.1],
        ],
        0.06,
        0.044,
        18,
      ),
      tube(
        [
          [0, 0.5, -0.02],
          [0.28, 0.2, 0.03],
          [0.5, -0.08, 0.08],
        ],
        0.06,
        0.042,
        18,
      ),
    ],
    bodyGroup,
  )

  // ── breathing — the lungs, flanking the airway
  addSystem('breathing', [lung(-1), lung(1)], bodyGroup)

  // ── neuro — the vertebral column, posterior
  addSystem(
    'neuro',
    [
      tube(
        [
          [0, 1.3, -0.66],
          [0, 0.6, -0.63],
          [0, -0.15, -0.58],
          [0, -1.3, -0.5],
        ],
        0.056,
        0.05,
        26,
      ),
    ],
    bodyGroup,
  )

  // ── circulation — the heart and great vessels, scaled down and set
  // left-of-centre. This is the one system that beats: it sits in its own
  // pulseGroup so systole can scale it without touching the rest of the body.
  addSystem(
    'circulation',
    [
      scaleAndPlace(ventricles(), 0.56, -0.28, -0.15, 0.1),
      // aortic arch, curving up out of the heart and down behind it
      scaleAndPlace(
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
          40,
        ),
        0.56,
        -0.28,
        -0.15,
        0.1,
      ),
      // pulmonary trunk
      scaleAndPlace(
        tube(
          [
            [0.34, 0.6, 0.2],
            [0.26, 1.1, 0.12],
            [0.02, 1.36, -0.04],
          ],
          0.21,
          0.15,
          22,
        ),
        0.56,
        -0.28,
        -0.15,
        0.1,
      ),
    ],
    pulseGroup,
  )

  // Anatomical presentation: apex toward the viewer's left, tipped forward.
  group.rotation.z = -0.06
  group.rotation.x = 0.06

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
  let focused: SystemId | null = null
  let running = true
  let frame = 0

  const applyFocus = () => {
    for (const sys of systems) {
      // null: nothing singled out, every system reads at the same even dim.
      // otherwise: the matching system goes to full accent, everything else
      // recedes further than its normal resting opacity.
      const isFocused = focused === sys.id
      const color = focused !== null && isFocused ? accent : dim
      const opacity = focused === null ? 0.72 : isFocused ? 0.95 : 0.16
      for (const m of sys.lineMeshes) {
        const mat = m.material as LineBasicMaterial
        mat.color.copy(color)
        mat.opacity = opacity
      }
    }
  }
  applyFocus()

  const render = () => {
    resize()

    // ~70° across the whole band — enough to read as 3D without spending
    // half the scroll edge-on, where a long torso would foreshorten to a
    // sliver and stop reading as a body.
    group.rotation.y = 2.15 + progress * Math.PI * 0.4

    let squeeze = 0
    if (!opts.reducedMotion) {
      for (const r of opts.rWaves) {
        squeeze = Math.max(squeeze, contraction((progress - r) / 0.09))
      }
    }
    const s = 1 - squeeze * 0.06
    pulseGroup.scale.set(s, 1 - squeeze * 0.09, s)

    renderer.render(scene, camera)
  }

  const loop = () => {
    if (!running) return
    frame = requestAnimationFrame(loop)
    render()
  }

  if (opts.reducedMotion) {
    progress = 0.4
    resize()
    render()
  } else {
    loop()
  }

  return {
    setProgress(p) {
      progress = p
    },
    focusLandmark(id) {
      focused = id
      applyFocus()
      // Under reduced motion the render loop never runs — mount() drew one
      // frame and stopped, on purpose. Selecting a system is a deliberate
      // user action, not an animation, so it still needs its own repaint or
      // the highlight would silently never appear for that audience.
      if (opts.reducedMotion) render()
    },
    destroy() {
      running = false
      cancelAnimationFrame(frame)
      for (const g of allDisposables) g.dispose()
      for (const m of allMaterials) m.dispose()
      renderer.dispose()
    },
  }
}
