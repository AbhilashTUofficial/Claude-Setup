# Animation system & WebGPURenderer

Full evidence and citations: `research/docs-structure-analysis.md`.

## Clip-based animation

`AnimationClip` (data for one action, composed of `KeyframeTrack`s) → `AnimationMixer` (per-object playback engine) → `AnimationAction` (controls one clip's playback):
```js
const mixer = new THREE.AnimationMixer(mesh);
const action = mixer.clipAction(THREE.AnimationClip.findByName(clips, 'dance'));
action.play();
// every frame:
mixer.update(deltaSeconds);
```
`gltf.animations` (from `GLTFLoader`) is the typical clip source — OBJ format has no animation support.

## Manual/procedural animation — the simpler alternative

If you don't need baked clips, just mutate `.position`/`.rotation`/`.scale` directly inside your own render-loop callback — `Object3D`s auto-recompute their world matrix each frame (`matrixAutoUpdate`, default `true`). No `AnimationMixer` needed for this case; reach for the clip system only when you have actual authored animation data to play back.

## WebGPURenderer — experimental, not a drop-in swap

Explicitly documented as experimental (maturity improving, but `WebGLRenderer` may still perform/support better depending on the app). Different import path (`three/webgpu`), auto-falls-back to WebGL2 when unsupported. If migrating: custom shaders (`ShaderMaterial`/`RawShaderMaterial`/`onBeforeCompile()`) aren't supported under WebGPURenderer — must be rewritten as **TSL** (Three.js Shading Language, JS-authored, transpiles to WGSL/GLSL automatically); `EffectComposer` post-processing isn't supported either — a separate node-based post-processing stack exists instead. Default to `WebGLRenderer` unless you specifically need WebGPU's newer capabilities and can accept these rewrites.

## Disposal — avoiding memory leaks

Removing a mesh from the scene does **not** auto-dispose its geometry/material/textures — three.js can't know your app's object lifetime. Call `.dispose()` manually on `BufferGeometry`, `Material`, `Texture`, `WebGLRenderTarget` when an object is genuinely done (e.g. on a scene/model switch), not proactively on every temporary object. Shader programs are ref-counted — only freed once every material using them is disposed. Use `renderer.info` to monitor GPU memory and confirm disposal is actually working.

## Performance — the one documented lever that matters most at scale

Merge geometry (`BufferGeometryUtils.mergeGeometries`) to collapse many draw calls into one when rendering large numbers of similar objects — a documented real benchmark went from <20fps to 60fps merging ~19,000 boxes. Use per-vertex colors to retain visual variety once objects share one merged material.
