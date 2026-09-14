# Pitfalls

Full evidence and citations: see the relevant `research/*.md` file for each item.

1. **Color/tone-mapping settings are three independent knobs that must all agree**: color-texture `colorSpace` (→ `SRGBColorSpace`), data-texture `colorSpace` (→ stay linear/`NoColorSpace`), `renderer.toneMapping`, and `renderer.outputColorSpace`. Getting one wrong while the others are right is the standard cause of a washed-out, too-dark, or bump-corrupted-looking scene. (`materials-lighting-analysis.md`, `core-architecture-analysis.md`)

2. **`renderer.setPixelRatio()` is documented as "strongly NOT RECOMMENDED," and screenshots are explicitly named as an affected case.** It makes `setSize()` implicitly multiply, so your canvas's true pixel dimensions become unpredictable — compute the multiplied size yourself for anything export-related. (`controls-export-analysis.md`)

3. **`preserveDrawingBuffer: true` is not the recommended way to capture a screenshot/export**, despite being the obvious-looking flag for it — it has an ongoing per-frame performance cost and still doesn't survive a canvas resize. Render synchronously right before capturing instead.

4. **`CanvasTexture.needsUpdate` only auto-fires once, at construction.** Every subsequent redraw of the underlying canvas needs `texture.needsUpdate = true` set again manually, or the GPU won't see the change.

5. **Only assign environment maps that went through `PMREMGenerator`.** The material docs are explicit: an unprocessed env map breaks physical correctness of `envMap`/`scene.environment`.

6. **Never scale a model in the DCC/export tool.** "Scaling is bad for real time 3D apps" — bake transforms into vertices before export; a scaled-down model with an off-center pivot causes real runtime pain later.

7. **Shadows need explicit opt-in** (`renderer.shadowMap.enabled = true`) — a model's meshes being shadow-capable doesn't turn shadows on by itself. A common source of "why aren't my shadows showing" confusion.

8. **`AmbientLight` does not look like real lighting** — per the docs' own words, it "doesn't look much like lighting," its real purpose is just avoiding pure-black shadow areas. Use `HemisphereLight` as your fill light for anything meant to look realistic.

9. **`WebGPURenderer` is not a drop-in swap for `WebGLRenderer`** at this library version — custom shaders and `EffectComposer` post-processing don't carry over; both need rewriting for the WebGPU path.

10. **Removing a mesh from the scene does not free its GPU memory.** Geometry/material/texture disposal is always manual (`.dispose()`) — three.js has no way to know when your app is actually done with an object.

11. **`docs.threejs.org`'s live SPA can't be fetched directly by automated tools** — if a future refresh hits the same wall, the `mrdoob/three.js` GitHub repo at the matching version tag (e.g. `r160` for v0.160.x) serves the identical content and is a reliable substitute.
