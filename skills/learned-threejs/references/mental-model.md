# Mental model — three.js

three.js is a scene-graph abstraction over raw WebGL (and, experimentally, WebGPU) — it gives you objects, transforms, materials, lights, and cameras instead of buffers, shaders, and draw calls. Core building block: a **Mesh** = Geometry (shape) + Material (appearance), placed in the scene graph.

## Scene graph

Nearly everything extends `Object3D`: local `position`/`rotation`/`quaternion`/`scale`, a `matrix` (local transform) and `matrixWorld` (global transform = local matrix × parent's `matrixWorld`). Transforms compose recursively down the tree — moving/rotating a parent implicitly moves every descendant without their own local values changing. `.add(child)` keeps the child's local transform (its world transform shifts); `.attach(child)` preserves the child's world transform instead (its local values get recomputed).

`Scene` extends `Object3D` and is where you set scene-wide state: `background`, `environment` (the IBL source for all physical materials — see `references/materials-lighting.md`), `fog`. `Group` is behaviorally identical to `Object3D` — it exists purely so grouping/organizing a bundle of objects reads clearly in code (e.g. rotate a "car" group and its wheel children inherit that rotation automatically).

## Cameras

`PerspectiveCamera(fov, aspect, near, far)` — mimics human vision, distant objects shrink. Use for realistic scenes, product shots, games. `OrthographicCamera(left, right, top, bottom, near, far)` — object size stays constant regardless of distance. Use for CAD/isometric/UI-overlay work. Both need `.updateProjectionMatrix()` called after changing most properties. A camera looks down its own local `-Z` axis by default.

## Renderer & render loop

`WebGLRenderer({ antialias, alpha, powerPreference, ... })`. Render loop: `requestAnimationFrame(render)` calling `renderer.render(scene, camera)` each frame, or the newer `renderer.setAnimationLoop(callback)` (required for WebXR).

**The two settings that control final image correctness, and must be set together**: `renderer.toneMapping` (default `NoToneMapping`; use `ACESFilmicToneMapping` or the newer `AgXToneMapping` for PBR-realistic output) compresses HDR lighting results to displayable range; `renderer.outputColorSpace` (default `SRGBColorSpace`) re-encodes the final linear-space render for display. three.js computes lighting in linear space internally — every color/albedo texture needs `texture.colorSpace = THREE.SRGBColorSpace` to be decoded correctly on the way in; normal/roughness/metalness maps must stay linear (`NoColorSpace`) since they store raw numeric data, not perceptual color. Getting any one of these three settings wrong (wrong-tagged texture, wrong renderer output space, mismatched tone mapping) is the classic source of "washed out" or "too dark" three.js scenes. Full detail: `references/materials-lighting.md`.

## Coordinate conventions

Default up-axis is `+Y` (`Object3D.up`), configurable per-camera. Right-handedness is universal in practice but wasn't found stated explicitly in the retrievable docs this round (see `research/unresolved.md`). No fixed real-world unit — "1 unit" is whatever scale the scene author chooses (WebXR is the one context where 1 unit = 1 meter is meaningful, since it must match real physical space).

## WebGPURenderer — not yet a replacement

An experimental, actively-developed alternative renderer (addon, not core at this version), auto-falling-back to WebGL2 when unsupported. Custom shaders and `EffectComposer` post-processing don't carry over — see `references/animation-and-webgpu.md`. Default to `WebGLRenderer` unless you have a specific reason to experiment with the newer path.
