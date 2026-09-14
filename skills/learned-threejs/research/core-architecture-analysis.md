# Research: core architecture & scene graph

Source: threejs.org docs/manual (r160 / v0.160.0), documentation-only — no local three.js repository was studied this round, so most claims are tagged **Documented** rather than **Verified-in-code**. Method note: threejs.org/docs and /manual are hash-routed SPAs WebFetch can't render directly; content was retrieved via the pinned `r160` GitHub source tag, the same content the live site serves — canonical `threejs.org` URLs are cited throughout.

## Why three.js exists

"WebGL is a very low-level system that only draws points, lines, and triangles... three.js... handles stuff like scenes, lights, shadows, materials, textures, 3d math" (manual/#en/fundamentals). Core mental model: a Mesh = Geometry (shape) + Material (appearance) + a position/orientation/scale in the scene graph, composed under a `Scene` root, rendered via a `Camera` through a `Renderer`.

## Scene graph — `Object3D`, `Scene`, `Group`

`Object3D` (docs/#api/en/core/Object3D) is the base class nearly everything extends: local `position`/`rotation`/`quaternion`/`scale`, a `matrix` (local transform) and `matrixWorld` (global transform — identical to local if no parent), `parent`/`children`, `.add()`/`.remove()`/`.attach()` (the last preserves world transform on reparenting, unlike `.add()` which keeps local values and lets world transform shift), `.traverse()`.

**Derived** (from the documented property semantics): world-transform composition works like a standard scene graph — each node's `matrixWorld` = its own local matrix × its parent's `matrixWorld`, so moving/scaling a parent implicitly moves/scales every descendant without their local values changing. The manual's own example: scaling a "sun" node 5x makes everything added as its child appear 5x larger and 5x farther away.

`Scene` extends `Object3D`, adds scene-wide settings: `background`, `environment` ("environment map for all physical materials"), `fog`, `overrideMaterial`. `Group` is "almost identical to an Object3D... its purpose is to make working with groups of objects syntactically clearer" — behaviorally identical to `Object3D`, purely a naming/organizational convenience for grouping and transforming a bundle of objects as one unit.

## Cameras

A camera "looks down its local, negative z-axis" by default (docs/#api/en/cameras/Camera).

`PerspectiveCamera(fov, aspect, near, far)` — mimics human/photographic vision (foreshortening, distant objects appear smaller); defaults `fov=50`, `aspect=1`, `near=0.1`, `far=2000`. Use for realistic 3D scenes, games, product visualizations.

`OrthographicCamera(left, right, top, bottom, near, far)` — "an object's size in the rendered image stays constant regardless of its distance from the camera." Use for CAD/engineering views, 2D-style games, isometric scenes, UI overlays.

Both require calling `updateProjectionMatrix()` after changing most constructor-set properties.

## Renderer — `WebGLRenderer`

Key constructor options (docs/#api/en/renderers/WebGLRenderer): `alpha` (default `false` — controls default clear alpha), `premultipliedAlpha` (default `true`), `antialias` (default `false`), `powerPreference` (`"high-performance"`/`"low-power"`/`"default"`), `logarithmicDepthBuffer` (for scenes with huge scale differences), `stencil` (default `true`).

Render loop: `requestAnimationFrame(render)` calling `renderer.render(scene, camera)` each frame — or `renderer.setAnimationLoop(callback)`, documented as the modern alternative "for WebXR projects this function must be used."

### `toneMapping`

Default `NoToneMapping`. Options: `LinearToneMapping`, `ReinhardToneMapping`, `CineonToneMapping`, `ACESFilmicToneMapping`, `AgXToneMapping` (new as of r160, per the r160 release notes), `CustomToneMapping`. Purpose: "approximate the appearance of HDR on the low dynamic range medium of a standard... screen."

### `outputColorSpace` — why this and toneMapping must both be set correctly

Default `THREE.SRGBColorSpace`. **Derived** (docs state the properties/defaults but not the causal failure mode in one place — this reasoning synthesizes multiple pages, and a dedicated `manual/en/color-management.html` page 404'd at r160, confirmed independently by two research angles): three.js computes lighting math in **linear** color space internally, but monitors and most standard image files (JPEG/PNG) are **sRGB-encoded**. Two independent knobs bridge this: (1) every color/albedo texture needs `texture.colorSpace = THREE.SRGBColorSpace` so it's decoded to linear before lighting runs — normal/roughness/metalness maps must stay `NoColorSpace` since they store raw numeric data, not perceptual color, and gamma-decoding them would corrupt the values; (2) `renderer.outputColorSpace` re-encodes the final linear render back to sRGB for display. Getting either side wrong produces visibly wrong colors: a color texture missing `SRGBColorSpace` looks washed-out; a normal/data map wrongly tagged sRGB shows corrupted lighting/bumps; a wrong `outputColorSpace` makes the whole image too dark or double-encoded.

## WebGPURenderer (brief; see docs-structure-analysis.md for the primary treatment)

No formal API-reference docs page existed for `WebGPURenderer` at r160 (confirmed by a direct 404) — it lives under `examples/jsm/renderers/webgpu/` as an addon, not core. Source-level confirmation: it auto-falls-back to a WebGL2 backend when the browser lacks WebGPU support, rather than being a hard replacement.

## Coordinate system / units

Default up-axis is `+Y` (`Object3D.up`, default `(0,1,0)`) — the manual notes this is a per-camera/scene convention, not hard-coded (a top-down camera can set `camera.up` to treat `+Z` as up). **Unconfirmed**: no explicit "three.js is right-handed" statement was found in the pages retrieved this round (universally true in practice and implied by the `-Z`-forward camera convention, but not independently confirmed from an official docs sentence — flagged rather than asserted). No explicit real-world unit convention ("1 unit = 1 meter") was found; units are treated as an abstract, application-defined scale.

## Coverage

Read: `manual/#en/fundamentals`, `manual/#en/scenegraph`, `docs/#api/en/core/Object3D`, `.../scenes/Scene`, `.../objects/Group`, `.../cameras/{Camera,PerspectiveCamera,OrthographicCamera}`, `.../renderers/WebGLRenderer`, `.../constants/{Renderer,Textures}`, `.../textures/Texture`. Not found / 404 at r160: `manual/en/creating-a-scene.html`, `manual/en/color-management.html`, `manual/en/matrix-transformations.html`, `manual/en/index.html` (likely merged/restructured in this version's manual).
