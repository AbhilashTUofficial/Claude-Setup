# Research: loading assets — GLTFLoader, textures

Source: threejs.org docs (r160 / v0.160.0), documentation-only. **Cross-check**: GLTFLoader, TextureLoader, CanvasTexture, and Box3-based framing are all confirmed used in phone-mockup-studio's real, working code.

## GLTFLoader — the primary model format

An addon (`import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'`), not core. Usage: `loader.load(url, onLoad, onProgress, onError)` (callback) or `loader.loadAsync(url, onProgress)` (Promise-returning, inherited from the base `Loader` class — "equivalent to `.load`, but returns a Promise"). The `onLoad` result (`gltf`) has documented properties `.scene` (Group), `.scenes`, `.cameras`, `.animations` (AnimationClip array), `.asset` (metadata).

Supported glTF extensions include `KHR_draco_mesh_compression`, `KHR_materials_clearcoat`, `KHR_materials_transmission`, `KHR_materials_ior`, `KHR_lights_punctual`, `KHR_texture_basisu`, `KHR_texture_transform`, and more.

**Draco compression** — `setDRACOLoader(dracoLoader)`, wired via `dracoLoader.setDecoderPath('/examples/jsm/libs/draco/')` then `loader.setDRACOLoader(dracoLoader)`. Once wired, GLTFLoader handles decoding transparently — no separate manual step per load. Standalone `.drc` files lack materials/animations/hierarchy; Draco is normally embedded inside a glTF, not used bare.

**KTX2 compressed textures** — `setKTX2Loader(ktx2Loader)`; `KTX2Loader` itself needs `.setTranscoderPath(path)` and `.detectSupport(renderer)` ("must be called before loading a texture") to pick the GPU-supported compressed format at runtime.

**Documented performance gotcha**: from the official "Loading 3D Models" getting-started page — "Scaling is bad for real time 3D apps. It causes all kinds of issues," illustrated with a real example of cars scaled at 0.01 with incorrect pivot origins causing runtime manipulation headaches. The recommendation for asset authors is to never scale in the DCC tool, bake transforms into vertices, and export with a single root node at identity transform.

## TextureLoader and Texture properties

`TextureLoader` uses `ImageLoader` internally; `.load(url, onLoad, onProgress, onError)` returns a `Texture` immediately (usable right away, updates once loaded). Note: progress events for `TextureLoader` were dropped in three.js r84 — `onProgress` is effectively non-functional here.

Key `Texture` properties: `wrapS`/`wrapT` (default `ClampToEdgeWrapping`; `RepeatWrapping`/`MirroredRepeatWrapping` — "tiling only functions if image dimensions are powers of two... a limitation of WebGL, not three.js"), `repeat`, `colorSpace` (default `NoColorSpace`), `flipY` (default `true`), `anisotropy` (default 1), `needsUpdate` (must set `true` to apply changes, "particularly important for setting the wrap mode").

## CanvasTexture — procedural textures

Extends `Texture`; "sets `needsUpdate` to `true` immediately" on construction (unlike plain `Texture`). Canonical pattern: draw onto an off-DOM `<canvas>` via the 2D context API, wrap it in `new THREE.CanvasTexture(canvas)`, assign as a material map. **Every subsequent redraw of the canvas requires manually setting `texture.needsUpdate = true` again** before the next render — the automatic flag only fires once, at construction. For non-power-of-2 canvas sizes, the manual recommends `minFilter = THREE.LinearFilter` + `ClampToEdgeWrapping`. Distinct from render-to-texture (`RenderTarget`) — CanvasTexture is for content drawn via the 2D canvas API, not three.js's own WebGL/WebGPU render pipeline. **Matches real usage**: phone-mockup-studio generates a `CanvasTexture` for procedural normal/roughness maps this exact way.

## LoadingManager and async patterns

`LoadingManager(onLoad, onProgress, onError)` — tracks progress across multiple concurrent loads; a global `THREE.DefaultLoadingManager` exists, separate instances are documented as useful "for distinct loading bars." `onProgress(url, itemsLoaded, itemsTotal)` lets you compute a combined percentage across several textures/models. `addHandler(regex, loader)` lets you register custom loaders per file-extension pattern; `setURLModifier(callback)` lets you rewrite resource URLs (e.g. CDN prefixing, caching) during loading.

Error handling pattern, from the docs' own example: pass an `onError` callback (4th arg to `.load()`) that logs/handles the failure — no other formal error-handling convention documented beyond this.

## Framing an arbitrarily-scaled loaded model

`Box3.setFromObject(object, precise=false)` — "computes the world-axis-aligned bounding box of an Object3D (including its children), accounting for the object's, and children's, world transforms." Canonical pattern for handling a model of unknown scale/origin (glTF/OBJ files carry no scale guarantee):
```js
const box = new THREE.Box3().setFromObject(root);
const size = box.getSize(new THREE.Vector3());
const center = box.getCenter(new THREE.Vector3());
```
then reposition the model/camera/OrbitControls-target based on the computed size/center. **Matches real usage**: phone-mockup-studio's `index.html` uses `new THREE.Box3().setFromObject(root)` for exactly this purpose.

Other documented loading gotchas: Y-up vs. Z-up coordinate mismatches between source DCC tools; missing/incompatible materials from `.mtl` (OBJ) files; oversized textures inflating file size dramatically (a real docs example: `.tga`→`.jpg` conversion cut a model from 36MB to under 1MB); forgetting `renderer.shadowMap.enabled = true` — shadows require explicit renderer setup even when a model's meshes are shadow-capable.

## Coverage

Read: `docs/examples/en/loaders/{GLTFLoader,DRACOLoader,KTX2Loader}`, `docs/api/en/loaders/{TextureLoader,Loader,managers/LoadingManager}`, `docs/api/en/textures/{Texture,CanvasTexture}`, `docs/api/en/math/Box3`, manual `{load-obj,load-gltf,textures,canvas-textures}.html`, docs-embedded `Loading-3D-models.html`. Not confirmed: `gltf.parser`/`gltf.userData` on the loader result, `setMeshoptDecoder`, `ImageBitmapLoader`/`FileLoader`/`ObjectLoader`/`Cache`, `renderer.capabilities.getMaxAnisotropy()`, the manual's dedicated object-disposal page (`how-to-dispose-of-objects.html` — related but not fetched this pass).
