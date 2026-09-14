# Research: camera controls & transparent PNG export

Source: threejs.org docs/manual (r160 / v0.160.0), documentation-only.

## OrbitControls and alternatives

`OrbitControls(camera, domElement)` — "allow the camera to orbit around a target." Key properties: `.target` (focus point), `.enableDamping` (default `false`, adds inertia) + `.dampingFactor` (default 0.05), `.minDistance`/`.maxDistance` (dolly limits), `.minPolarAngle`/`.maxPolarAngle` (vertical orbit limits, radians), `.autoRotate` + `.autoRotateSpeed`. **`.update(deltaTime)` must be called every frame if `enableDamping` or `autoRotate` is set** — explicit, documented requirement.

Alternatives, all real and documented:
- **TrackballControls** — "does not maintain a constant camera up vector," so orbiting over the poles doesn't flip upright — free tumble rotation vs. OrbitControls' pole-locked orbit.
- **ArcballControls** — trackball-gizmo interface with full touch support; notably "doesn't require `.update()` to be called externally... when animations are on" — differs from the other two in this respect.
- **FlyControls** — unconstrained 6DOF movement, no orbit target ("similar to fly modes in DCC tools like Blender").
- **PointerLockControls** — browser Pointer Lock API, hides cursor, captures raw mouse deltas — "a perfect choice for first person 3D games," abandons the "target" concept entirely.

**Derived** grouping: OrbitControls/TrackballControls/ArcballControls are all orbit-around-a-target schemes differing in up-axis locking and update requirements; FlyControls/PointerLockControls abandon "target" for free/first-person navigation.

## Transparent PNG export — no single dedicated tutorial exists

The canonical treatment is scattered across the manual's **Tips** page (`manual/#en/tips`) plus `WebGLRenderer`/`Scene` API reference and a resolution caveat on the **Responsive Design** page — confirmed there's no single "how to export a transparent PNG" guide.

**Making the canvas transparent** (Documented, `manual/#en/tips`):
```js
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
```
The manual additionally recommends `premultipliedAlpha: false`, noting a real mismatch: "Three.js defaults to the canvas using `premultipliedAlpha: true` but defaults to materials outputting `premultipliedAlpha: false`" — left at defaults this can cause incorrect edge/alpha blending. **Derived** (connecting `alpha:true` + `Scene.background` docs, not one explicit sentence): `scene.background = null` (the default) lets the canvas's own alpha show through; assigning a `Color` paints an opaque fill every frame regardless of `alpha: true`.

**`preserveDrawingBuffer` — not actually needed for a one-shot export.** The manual explains the underlying problem ("the browser will clear a WebGL canvas's drawing buffer after you've drawn to it") and that `preserveDrawingBuffer: true` prevents this — but explicitly notes the caveat "the browser will still clear the canvas anytime we change its resolution," i.e. it's not a durable persistence guarantee. **The manual's own recommended screenshot pattern does not use this flag at all** — instead: "you need to call your rendering code just before capturing," i.e. render synchronously immediately before capture, in the same tick:
```js
render();
canvas.toBlob((blob) => saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`));
```
**Derived tradeoff**: `preserveDrawingBuffer: true` is a global, ongoing-cost renderer flag (disables a browser optimization every frame of the app's life) that doesn't even fully solve persistence across resizes; the render-then-capture-synchronously pattern is cheaper and more targeted for a one-off export.

**Capture mechanism**: "there are effectively 2 functions... `canvas.toDataURL` [and] the new better one `canvas.toBlob`" — the manual marks `toBlob` as preferred (general web-platform reasoning: avoids the ~33%-larger base64-string memory overhead of `toDataURL`, though this specific justification isn't stated on the three.js page itself).

**Resolution for a high-res export — a real, explicit warning.** `renderer.setPixelRatio(window.devicePixelRatio)` is documented as "strongly NOT RECOMMENDED" (`manual/#en/responsive`), and the stated reasoning **explicitly lists screenshots** as one of the affected cases — `setPixelRatio` makes subsequent `setSize` calls implicitly multiply by the ratio, creating uncertainty about the canvas's true pixel size. The documented alternative: compute the multiplied size yourself and pass it directly to `setSize`:
```js
const pixelRatio = window.devicePixelRatio;
const width = canvas.clientWidth * pixelRatio | 0;
const height = canvas.clientHeight * pixelRatio | 0;
```
"By doing it ourselves we always know the size being used is the size we requested." **This directly applies to producing a deterministic high-resolution export.**

**Gap, explicitly confirmed absent**: no official threejs.org page discusses supersampling (rendering higher than display resolution and downsampling for a crisper export) or MSAA-vs-post-process-AA tradeoffs for export specifically — third-party sources mention this pattern but it's excluded here per the documentation-only scope.

## Coverage

Read: `docs/#examples/en/controls/{OrbitControls,TrackballControls,ArcballControls,FlyControls,PointerLockControls}`, `docs/#api/en/renderers/WebGLRenderer`, `docs/#api/en/scenes/Scene`, `manual/#en/tips`, `manual/#en/responsive`. Not read: `MapControls`, CORS/"tainted canvas" caveats for `toDataURL`/`toBlob` with cross-origin textures (asked for, not found in the fetched excerpt — not confirmed present or absent elsewhere in the docs), the `saveBlob` helper's implementation (standard browser API, not three.js-specific).
