# Materials, lighting, PBR & image-based lighting

Full evidence and citations: `research/materials-lighting-analysis.md`, `research/core-architecture-analysis.md`.

## Materials

`MeshStandardMaterial` — the standard metallic-roughness PBR material: `color` (albedo), `roughness` (0=mirror, 1=diffuse), `metalness` (0=non-metal, 1=metal), `map`/`normalMap`/`roughnessMap`/`metalnessMap`/`aoMap`, `envMap` + `envMapIntensity` (IBL reflection source — see below), `emissive`/`emissiveMap`.

`MeshPhysicalMaterial` extends it with: **clearcoat** (`clearcoat`, `clearcoatRoughness` — glossy lacquer/glass-over-body layer), **transmission** (`transmission`, `thickness`, `ior` — real glass, not alpha blending), advanced reflectivity (`reflectivity`, `specularIntensity`/`Color`), **sheen** (fabric), and `iridescence` (thin-film color shift). For anything combining multiple of these — a phone's glass screen + lacquered frame + metal trim — use `MeshPhysicalMaterial`, not plain `MeshStandardMaterial`.

## Lighting — key + fill is the standard pattern

- **DirectionalLight** — parallel rays (sunlight). Use as the **key light** — defines form and specular highlight lines.
- **HemisphereLight** — sky-to-ground color gradient by surface normal, no shadows. Use as the **fill light** — the docs explicitly prefer it over flat `AmbientLight` for this role.
- **AmbientLight** — flat, directionless; per the docs its real purpose is just "eliminate pure black shadows," not simulate real light — don't rely on it alone for realism.
- **PointLight**/**SpotLight** — omnidirectional / coned, from one point. Use for accent/rim highlights or an isolating hero light.

## Image-based lighting — this is what sells "real photo"

Direct lights alone can't produce the soft, environment-colored reflections a metal or glass surface shows in real photography. The pattern:
```js
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;
```
`RoomEnvironment` (`three/addons/environments/RoomEnvironment.js`) is a **built-in synthetic studio-lighting rig** — no external HDR file needed. Every `MeshStandardMaterial`/`MeshPhysicalMaterial` in the scene automatically picks up `scene.environment` as its IBL source. For a loaded HDR instead: `RGBELoader` → `texture.mapping = THREE.EquirectangularReflectionMapping` → assign to `scene.environment`/`scene.background`.

Always call `pmremGenerator.dispose()` when no longer needed — it holds GPU resources. **Only assign environment maps that went through `PMREMGenerator`** — the material docs are explicit that unprocessed env maps break physical correctness.

## Tone mapping & color space — set both correctly, together

PBR + IBL lighting produces HDR values that exceed what a display can show. `renderer.toneMapping = THREE.ACESFilmicToneMapping` (or the newer `AgXToneMapping`, less color-shifting on saturated highlights) compresses this to displayable range while preserving contrast; `toneMappingExposure` (default 1) is the brightness dial. `renderer.outputColorSpace` (default `SRGBColorSpace`) must correctly re-encode the final image for the display.

On the input side: color/albedo textures need `texture.colorSpace = THREE.SRGBColorSpace`; normal/roughness/metalness maps must stay `NoColorSpace` (linear) — they're raw numeric data, and sRGB-decoding them would corrupt the values. Mismatching any of these three settings (texture tagging, tone mapping, output color space) is the standard cause of a three.js scene looking washed-out, too dark, or having visibly broken bump/normal detail.

## Quick recipe for a photorealistic product render

1. `MeshPhysicalMaterial` with correctly-tagged textures (color maps → `SRGBColorSpace`, data maps → linear).
2. `DirectionalLight` (key) + `HemisphereLight` (fill), optionally a `PointLight`/`SpotLight` accent.
3. `PMREMGenerator` + `RoomEnvironment` (or a loaded HDR) → `scene.environment`.
4. `renderer.toneMapping = THREE.ACESFilmicToneMapping`, correct `renderer.outputColorSpace`.
