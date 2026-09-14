# Research: materials, lighting, PBR, image-based lighting

Source: threejs.org docs (r160 / v0.160.0), documentation-only. **Cross-check bonus**: several patterns below were independently confirmed to match the real, working code in `phone-mockup-studio` (`index.html`, three.js v0.160.0) — noted inline as "matches real usage."

## MeshStandardMaterial vs MeshPhysicalMaterial

`MeshStandardMaterial` — "a standard physically based material, using Metallic-Roughness workflow." Key properties: `color` (albedo, default white), `roughness` (0=mirror, 1=fully diffuse, default 1), `metalness` (0=non-metal, 1=metal, default 0), `map` (albedo texture), `normalMap`+`normalScale`, `roughnessMap` (green channel), `metalnessMap` (blue channel), `envMap` (reflection/IBL source — "should only add environment maps which were preprocessed by PMREMGenerator"), `envMapIntensity`, `emissive`/`emissiveMap`, `aoMap`, `bumpMap`, `displacementMap` (actually moves vertices, unlike normal/bump), `alphaMap`.

`MeshPhysicalMaterial` **extends** `MeshStandardMaterial` with four additional effect categories:
1. **Clearcoat** (`clearcoat`, `clearcoatRoughness`, `clearcoatNormalMap`) — "a clear, reflective layer on top of another layer" — car paint, lacquer, wet surfaces. **Directly relevant to a glossy phone body/screen.**
2. **Physically-based transparency** (`transmission`, `thickness`, `attenuationDistance`/`Color`, `ior`) — real glass/thin transparent surfaces, not simple alpha blending.
3. **Advanced reflectivity** (`reflectivity`, `specularIntensity`, `specularColor`) — more flexible non-metal reflectance.
4. **Sheen** (`sheen`, `sheenRoughness`, `sheenColor`) — cloth/fabric.
Also `iridescence` — thin-film RGB shift effects.

**Derived**: for a photorealistic phone render, `MeshPhysicalMaterial` (not plain `MeshStandardMaterial`) is the right choice since a real device combines several of these layers — glass screen (`transmission`/`ior`), lacquered frame (`clearcoat`), metallic edges (`metalness`) — none representable by `MeshStandardMaterial` alone.

## Light types

- **DirectionalLight** — parallel rays, "as though infinitely far away" (sunlight). Aims from `position` toward a `target`. The natural **key light** for a product shot.
- **PointLight** — omnidirectional from one point (bare bulb). Photometric units (`intensity` candela / `power` lumens), `decay` default 2 ("recommended for physically-accurate rendering" = inverse-square falloff). Good for accent/rim highlights.
- **SpotLight** — like PointLight but "along a cone" (`angle`, `penumbra` for soft edges). Good for an isolating hero light against a dark backdrop.
- **HemisphereLight** — "color fading from the sky color to the ground color," based on surface normal direction. Cannot cast shadows. The documented **fill light** — "works best combined with other lights."
- **AmbientLight** — flat, directionless, multiplies every material's color equally. The docs are blunt: "other than changing the color of everything in the scene it doesn't look much like lighting" — its real purpose per docs is just "to eliminate pure black shadows," not to simulate real bounce light.

**Derived** (why directional-key + hemisphere-fill is the standard pattern, and — matches real usage: phone-mockup-studio's `index.html` combines exactly `DirectionalLight` × several + `HemisphereLight` + `AmbientLight`): a DirectionalLight gives the strong directional shading/specular highlights that define form; HemisphereLight (preferred over flat AmbientLight per the docs' own critique) fills the shadow side with a plausible gradient instead of pure black — the three.js-native analog of studio key+fill lighting.

## Image-based lighting: PMREMGenerator + RoomEnvironment

**PMREMGenerator** (docs/#api/en/extras/PMREMGenerator) — "generates a Prefiltered, Mipmapped Radiance Environment Map (PMREM) from a cubeMap environment texture," giving "quick access to different blur levels based on material roughness." Methods: `.fromScene(scene, sigma, near, far)` (used for a synthetic lighting rig — faster than a network HDR fetch), `.fromEquirectangular(texture)` (a loaded HDR panorama), `.fromCubemap(texture)`, `.dispose()` (must be called when no longer needed — GPU resource).

**RoomEnvironment** (`three/addons/environments/RoomEnvironment.js`, based on Google's `model-viewer` studio-lighting rig) — a `Scene` subclass procedurally building an enclosed room with emissive "area light" boxes — a **built-in synthetic studio environment requiring no external HDR file**.

**Canonical usage pattern (Documented, from official examples — matches real usage: phone-mockup-studio's `index.html` uses this exact pattern):**
```js
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;
```
Every `MeshStandardMaterial`/`MeshPhysicalMaterial` in the scene picks up `scene.environment` automatically as its IBL/reflection source without needing `envMap` set per-material.

For a loaded HDR instead: `RGBELoader` → `texture.mapping = THREE.EquirectangularReflectionMapping` → assign to `scene.background`/`scene.environment` directly (the renderer performs PMREM conversion internally in this path — **Derived**, inferred from example code style, not an explicit doc statement).

## Tone mapping + color space, restated with the PBR-realism angle

Same mechanism as `core-architecture-analysis.md`'s renderer section, restated for why it matters specifically for realism: PBR lighting + IBL can produce radiance values exceeding `[0,1]` (an arbitrarily bright highlight off glossy plastic/glass). Tone mapping compresses that HDR result to displayable range while preserving shape/contrast — `ACESFilmicToneMapping` (film-industry-derived curve) or the newer `AgXToneMapping` (more neutral, less saturating) are the documented options suited to photorealistic PBR output, vs. `NoToneMapping` (default, clips) or the simpler Linear/Reinhard/Cineon curves. `toneMappingExposure` (default 1) is the practical brightness dial. **Matches real usage**: phone-mockup-studio's `index.html` sets `renderer.toneMapping = THREE.ACESFilmicToneMapping` exactly.

## Texture colorSpace for PBR maps specifically

Color/albedo textures (`map`, `emissiveMap`) need `texture.colorSpace = THREE.SRGBColorSpace`. Data maps (`normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`) should stay at the default `NoColorSpace` — applying sRGB decode to raw numeric data would corrupt it. **Unconfirmed**: whether `GLTFLoader`/`TextureLoader` set this automatically per glTF's spec conventions wasn't independently verified this round.

## Coverage

Read: `docs/#api/en/materials/{MeshStandardMaterial,MeshPhysicalMaterial}`, `.../lights/{DirectionalLight,PointLight,SpotLight,HemisphereLight,AmbientLight}`, `manual/#en/lights`, `.../extras/PMREMGenerator`, `.../renderers/WebGLRenderer`, `.../constants/{Renderer,Textures}`, `.../textures/{Texture,CanvasTexture}`, plus three official examples (`webgl_animation_keyframes`, `webgl_loader_gltf`, `webgl_materials_physical_clearcoat`) and the `RoomEnvironment` addon source. Not found: `manual/en/color-management.html` (404 at r160, confirmed independently by two research angles — a real gap in what's retrievable at this docs version, not a research failure). Not verified: loader-default colorSpace behavior, `RectAreaLight`, `physicallyCorrectLights`/`useLegacyLights`.
