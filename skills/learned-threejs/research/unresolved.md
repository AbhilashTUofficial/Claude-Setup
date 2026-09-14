# Unresolved — three.js

## Scope boundary (recorded before research began)

This ingestion covers three.js from the **practical 3D-rendering builder perspective** — scene graph fundamentals, PBR materials/lighting/IBL, asset & texture loading, camera controls, and canvas-to-image export — grounded partly by real usage independently confirmed in a local project (`phone-mockup-studio`, three.js v0.160.0). Deliberately out of scope: WebXR/VR, physics engine integrations, the full shader-authoring API (`ShaderMaterial`/TSL in depth), and the audio system. Their *existence* was confirmed during research (see `docs-structure-analysis.md`) but not researched in depth — add via a future targeted `/knowledge-forge refresh threejs` pass if a project actually needs them.

## Source-type caveat

**No local three.js repository/source code was studied this round** — this is a documentation-website-only ingestion. Nearly every claim in `references/` is tagged Documented (from `threejs.org`) rather than Verified-in-code. The one exception: several canonical patterns were independently cross-checked against real, working code in `phone-mockup-studio` (renderer setup, `PMREMGenerator`+`RoomEnvironment`, the directional+hemisphere+ambient light combo, `ACESFilmicToneMapping`, `GLTFLoader`, `TextureLoader`, `CanvasTexture` with `needsUpdate`, `Box3().setFromObject()` framing, `OrbitControls`) — these are noted inline in `references/` as "matches real usage." A future refresh pointed at the actual `mrdoob/three.js` GitHub repository (source + tests) would upgrade the rest of this skill's claims to Verified-in-code and is a reasonable next step given the library's central importance to product-photorealism work.

## Methodology note (affects how to read citations)

`threejs.org/docs` and `threejs.org/manual` are hash-routed single-page apps that WebFetch cannot render directly. All five research angles retrieved actual page content via the `r160` tag of the official `mrdoob/three.js` GitHub repository (`raw.githubusercontent.com/mrdoob/three.js/r160/...`), which is the literal source the live site builds from, then cited the canonical `threejs.org` URL. This is a sound substitution (same content, verified byte-for-byte source), not a downgrade in evidence quality — but it means URLs in `references/`/`research/` point at the canonical site while the actual fetch happened via GitHub; worth knowing if a refresh needs to re-verify against a newer version.

## Coverage by research angle (condensed — see each research/*.md for full detail)

- **Core architecture**: scene graph, cameras, renderer, tone mapping/color space, coordinate conventions. Gaps: no explicit "right-handed" statement found (Unconfirmed, not asserted); several manual pages 404'd at r160 (`creating-a-scene.html`, `color-management.html`, `matrix-transformations.html`, `index.html` — likely merged/restructured in this docs version).
- **Materials/lighting/PBR**: MeshStandardMaterial/MeshPhysicalMaterial, all 5 core light types, PMREMGenerator+RoomEnvironment, tone mapping for realism, texture colorSpace for PBR maps. Gap: the dedicated color-management explainer page wasn't retrievable (confirmed independently by two research angles — a real gap in what's accessible at r160, not a research shortfall). Not verified: whether GLTFLoader/TextureLoader set colorSpace automatically per glTF conventions; `RectAreaLight`; `physicallyCorrectLights`/`useLegacyLights`.
- **Loaders/textures**: GLTFLoader (+Draco/KTX2), TextureLoader, CanvasTexture, LoadingManager, Box3 framing. Not confirmed: `gltf.parser`/`gltf.userData` on the load result, `setMeshoptDecoder`, `renderer.capabilities.getMaxAnisotropy()`.
- **Controls/export**: OrbitControls + 4 alternatives, the full transparent-PNG-export mechanics (no single dedicated tutorial exists — synthesized across `tips.html`/API reference/`responsive.html`). Confirmed-absent: any official supersampling/MSAA-for-export guidance (flagged as a gap, not fabricated from third-party sources per the ingestion's own discipline).
- **Docs structure/animation/WebGPU**: full docs nav map, the `AnimationMixer`/`clipAction`/`.play()`/`mixer.update()` pattern, WebGPURenderer's experimental status and TSL, performance/disposal guidance, confirmed-existing-but-unresearched areas (physics, WebXR, audio, ShaderMaterial).

## Genuinely unresolved / needs a follow-up pass if it matters

1. Whether three.js is formally documented as right-handed anywhere on the official site (near-certainly true in practice; not independently confirmed from docs prose this round).
2. The dedicated color-management manual page's exact current location/name, if one exists in a version newer than r160 — worth checking on a refresh.
3. Supersampling/high-resolution-export technique — not covered by official docs at all; would need a different kind of source (community/third-party) if this becomes a real product need, and should be clearly tagged as such rather than folded into "Documented" three.js guidance.
4. Loader-default `colorSpace` behavior for glTF color vs. data textures — not independently verified.

## Weak-evidence areas

Everything tagged **Unconfirmed** or **Derived** throughout the five `research/*.md` files falls into this bucket by construction.
