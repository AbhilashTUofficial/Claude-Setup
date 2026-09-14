# Camera controls & transparent PNG export

Full evidence and citations: `research/controls-export-analysis.md`.

## OrbitControls

`new OrbitControls(camera, domElement)` — orbit around `.target` with mouse/touch. **If `enableDamping` or `autoRotate` is set, `.update(deltaTime)` must be called every frame** — this is a documented, explicit requirement, not optional polish. Key limits: `.minDistance`/`.maxDistance` (zoom), `.minPolarAngle`/`.maxPolarAngle` (vertical orbit range).

Alternatives: `TrackballControls` (free tumble, no locked up-axis), `ArcballControls` (trackball-gizmo UI, doesn't need manual `.update()` when its own animations are on), `FlyControls`/`PointerLockControls` (free 6DOF / first-person, no orbit target concept at all). Pick based on whether you want orbit-around-an-object (OrbitControls/TrackballControls/ArcballControls) or free navigation (FlyControls/PointerLockControls).

## Exporting a transparent PNG — the actual recipe

There's no single official tutorial for this; it's assembled from the renderer/scene API plus the manual's Tips page. The **recommended** pattern:

1. **Transparent canvas**: `new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: false })` — the docs flag a real default mismatch (canvas defaults to `premultipliedAlpha: true`, materials output `premultipliedAlpha: false`) that can cause bad edge blending if left unset. Leave `scene.background = null` (the default) — assigning a `Color` paints an opaque fill every frame regardless of `alpha: true`.

2. **Don't reach for `preserveDrawingBuffer: true`.** It has an ongoing per-frame performance cost (disables a browser optimization for the app's whole lifetime) and — per the docs' own caveat — doesn't even survive a canvas resize. The manual's own recommended pattern sidesteps it entirely: **render synchronously immediately before capturing**, in the same tick:
   ```js
   render();
   canvas.toBlob((blob) => saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`));
   ```
3. **Use `canvas.toBlob()`, not `canvas.toDataURL()`** — the docs mark `toBlob` as "the new better one," more memory-efficient for larger images.

4. **For a high-resolution export, don't use `renderer.setPixelRatio()`.** The docs call it "strongly NOT RECOMMENDED" and **explicitly name screenshots** as one of the affected cases — it makes subsequent `setSize()` calls implicitly multiply by the ratio, so the canvas's true pixel size becomes unpredictable. Compute the size yourself instead:
   ```js
   const pixelRatio = window.devicePixelRatio;
   const width = canvas.clientWidth * pixelRatio | 0;
   const height = canvas.clientHeight * pixelRatio | 0;
   renderer.setSize(width, height);
   ```
   This gives a deterministic export resolution instead of implicit magic multiplication.

**Known gap**: official docs don't cover supersampling (render-bigger-then-downsample) for a crisper export — if that's needed, it requires a separate, non-official source, clearly distinguished from the documented guidance above.
