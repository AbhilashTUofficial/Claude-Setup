# Research: docs structure, animation system, WebGPURenderer, performance, out-of-scope map

Source: threejs.org docs/manual (r160 / v0.160.0), documentation-only.

## Docs site structure

**Manual** (`threejs.org/manual/`) groups: Getting Started (Installation, Creating a Scene, Loading 3D Models, FAQ, ...), Next Steps (Animation System, Color Management, VR content, Object disposal, Post Processing, Matrix Transformations), Basics/Fundamentals (Primitives, Scenegraph, Materials, Textures, Lights, Cameras, Shadows, Fog, Render Targets, Physics), Tips (screenshots, canvas transparency, keyboard input, debugging), Optimization (merging objects, OffscreenCanvas in a Worker), Solutions (loading OBJ/GLTF, skyboxes, transparency, picking, post-processing, voxel geometry), WebGPU (WebGPURenderer, Post-Processing), WebXR (VR basics/interaction).

**Reference/API docs** (`threejs.org/docs/`) — two trees: **Core** (Animation, Audio, Cameras, Core, Extras, Geometries, Helpers, Lights, Loaders, Materials, Math, Nodes, Objects, Renderers, Scenes, Textures) and **Addons** (Controls, Curves, Environments, Exporters, Loaders, Physics, Postprocessing, TSL, Webxr, and more) — loaders/controls/environments/physics all live in Addons, confirming they ship as opt-in modules, not core.

## Animation system

`AnimationClip` (data for one action — walk, jump — composed of `KeyframeTrack`s, one per animated property) → `AnimationMixer` (per-object playback engine, "simulation of a hardware mixer console," manages simultaneous animations/blending) → `AnimationAction` (controls one clip's playback: play/pause/stop/fade/time-scale/crossfade).

Canonical pattern (Documented, from the manual):
```js
const mixer = new THREE.AnimationMixer(mesh);
const clip = THREE.AnimationClip.findByName(clips, 'dance');
const action = mixer.clipAction(clip);
action.play();
// every frame:
mixer.update(deltaSeconds);
```
`gltf.animations` (from `GLTFLoader`) is the typical clip source; `ObjectLoader`, `BVHLoader`, `ColladaLoader`, `FBXLoader` also populate clips. Note: OBJ format doesn't support animation.

**Procedural/manual animation as a simpler alternative** — not covered on the animation-system page itself; the adjacent "How to update Things" page is the documented mechanism: `Object3D`s auto-recompute their world matrix each frame (`matrixAutoUpdate` default `true`), so directly mutating `.position`/`.rotation`/`.scale` inside your own render-loop callback works without any `AnimationMixer` — appropriate when you don't need clip-based animation at all. **Derived** connection between the two pages, individual facts each Documented.

## WebGPURenderer — status

Explicitly **experimental**: "the renderer is still in an experimental state, though its maturity has improved significantly" — the docs recommend the latest three.js version and note `WebGLRenderer` may still perform/support better depending on the app. **Not a drop-in replacement**: separate import (`three/webgpu` vs `three`), automatic fallback to a WebGL2 backend if the browser lacks WebGPU support, a `forceWebGL: true` option to force that fallback for testing. Async initialization gotcha: prefer `renderer.setAnimationLoop(render)` (defers first frame until ready) over a manual loop, or `await renderer.init()` yourself.

**TSL (Three.js Shading Language)** — JS-authored shader code auto-transpiled to WGSL (WebGPU) or GLSL (WebGL2) — documented as the intended eventual replacement for hand-written `ShaderMaterial`/`RawShaderMaterial`. Under WebGPURenderer specifically: custom shaders via `ShaderMaterial`/`RawShaderMaterial`/`Material.onBeforeCompile()` are **not supported** — must be rewritten as TSL node materials. `EffectComposer`-based post-processing also isn't supported — a separate node-based post-processing stack exists instead, with built-in multi-render-target support.

## Performance / tips

No single "Performance" page — split across **Tips** (mostly dev-ergonomics: screenshots, canvas transparency, keyboard input — not performance-focused) and **Optimization** (merging geometry via `BufferGeometryUtils.mergeGeometries` to collapse many draw calls into one — a documented real benchmark went from <20fps to 60fps merging ~19,000 boxes; per-vertex colors via `vertexColors: true` to retain visual variety after merging) and a dedicated **"How to dispose of Objects"** page: removing a mesh from the scene does **not** auto-dispose its geometry/material/textures — three.js can't know your app's object lifetime; `BufferGeometry.dispose()`/`Material.dispose()`/`Texture.dispose()`/`WebGLRenderTarget.dispose()` are manual; shader programs are ref-counted (only freed once all materials using them are disposed); `renderer.info` is the documented tool for monitoring GPU memory usage.

## Out-of-scope items — existence confirmed, not deep-dived

- **Physics**: three.js ships no physics engine of its own — documents three integration tiers (bundled wrapper addons for Ammo/Rapier/Jolt; pure-JS engines like cannon-es; WASM engines) run and synced separately from rendering, typically at a different tick rate.
- **WebXR/VR**: its own manual group + Addons→Webxr reference category (`VRButton`, `ARButton`). Core pattern: `renderer.xr.enabled = true`, `VRButton.createButton(renderer)`, `renderer.setAnimationLoop(render)` (not `requestAnimationFrame`), 1 unit = 1 meter in this context specifically.
- **Audio**: Core→Audio reference category (`Audio`, `AudioAnalyser`, `AudioListener`, `PositionalAudio`) — contents not read.
- **Shader-authoring API**: `ShaderMaterial`/`RawShaderMaterial` confirmed present under Core→Materials — the "old" GLSL-authoring path TSL is meant to eventually replace under WebGPU.

## Coverage

Read: `docs/index.html` (both nav trees), `manual/pages/animation-system.html`, `manual/pages/webgpurenderer.html`, `manual/pages/tips.html`, `manual/pages/optimize-lots-of-objects.html`, `manual/pages/how-to-dispose-of-objects.html`, `manual/pages/physics.html`, `manual/pages/webxr-basics.html`. Not read: individual `AnimationMixer`/`AnimationAction`/`AnimationClip` API reference pages (full method tables), `webgpu-postprocessing.html`, "Optimizing Lots of Objects Animated," "Using OffscreenCanvas in a Web Worker," "Rendering On Demand," Debugging pages, Audio/ShaderMaterial reference page contents.
