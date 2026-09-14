# Loading assets — models & textures

Full evidence and citations: `research/loaders-textures-analysis.md`.

## GLTFLoader — the default model format

An addon, not core: `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'`. `loader.load(url, onLoad, onProgress, onError)` or `await loader.loadAsync(url)`. Result: `gltf.scene` (a Group), `gltf.scenes`, `gltf.cameras`, `gltf.animations` (see `references/animation-and-webgpu.md`).

For compressed assets: wire `DRACOLoader` (mesh compression, `setDecoderPath(...)` then `gltfLoader.setDRACOLoader(dracoLoader)`) and/or `KTX2Loader` (compressed textures, `setTranscoderPath(...)` + `detectSupport(renderer)` before use, then `gltfLoader.setKTX2Loader(...)`) — once wired, GLTFLoader handles decoding transparently.

**A loaded model's scale/origin is never guaranteed.** Always frame it explicitly rather than assuming it's centered/normalized:
```js
const box = new THREE.Box3().setFromObject(root);
const size = box.getSize(new THREE.Vector3());
const center = box.getCenter(new THREE.Vector3());
```
then reposition the model/camera/`OrbitControls.target` from that. This is the documented, standard fix for models of unknown scale — and matches real working code.

## TextureLoader & Texture properties

`new THREE.TextureLoader().load(url)` returns a `Texture` immediately (updates visually once loaded — no need to wait for a callback before using it in a material). `onProgress` doesn't work for this loader (dropped since r84). Set `texture.colorSpace = THREE.SRGBColorSpace` on color maps (see `references/materials-lighting.md`). `wrapS`/`wrapT` = `RepeatWrapping` for tiling (only works with power-of-2 image dimensions — a WebGL limitation, not three.js's). Any property change after the texture is in use requires `texture.needsUpdate = true`.

## CanvasTexture — procedural textures

`new THREE.CanvasTexture(canvasElement)` — draw with the 2D canvas API, wrap the canvas as a texture. Sets `needsUpdate = true` once automatically at construction — but **every subsequent redraw of the canvas requires manually setting `needsUpdate = true` again** before the next render, or the GPU won't see the change. Good for procedurally-generated normal/roughness maps, labels, or any content that doesn't need to be a static file. Not for render-to-texture (use a `RenderTarget` for that — CanvasTexture is specifically 2D-canvas-API content).

## LoadingManager — tracking multiple loads

`new THREE.LoadingManager(onLoad, onProgress, onError)`, pass it into a loader's constructor to share progress tracking across several concurrent loads. `onProgress(url, itemsLoaded, itemsTotal)` gives you a combined percentage.

## Common gotchas worth checking early

- **Never scale a model in the export/DCC tool.** "Scaling is bad for real time 3D apps" per the docs — bake transforms into vertices before export instead; a scaled-down model with an off-center pivot causes real runtime headaches (documented real example: cars scaled at 0.01 with bad pivots).
- Shadows require explicit renderer setup (`renderer.shadowMap.enabled = true`) — a model having shadow-capable meshes doesn't turn shadows on by itself.
- Y-up vs. Z-up mismatches between source DCC tools are a real, documented source of "why is my model sideways" bugs.
- Oversized source textures inflate file size dramatically — a documented real example converted `.tga`→`.jpg` and cut a model from 36MB to under 1MB.
