---
name: learned-threejs
description: "How to build with three.js (v0.160.0): the scene graph/camera/renderer model, PBR materials and image-based lighting for photorealistic rendering, loading glTF models and textures, camera controls, exporting a transparent PNG from the canvas, and the animation system. Use when building, debugging, or rendering 3D scenes with three.js in the browser, especially photorealistic product-style visualization."
metadata:
  knowledge_schema_version: 1
  learned_skill: true
---

# three.js

A scene-graph abstraction over WebGL/WebGPU: Mesh = Geometry + Material, composed in a graph under a Scene, rendered through a Camera by a Renderer. Its physically-based materials plus image-based lighting (`PMREMGenerator` + an environment map) are what get a rendered scene to look like a real photograph rather than a flat 3D render — see `references/materials-lighting.md`.

Studied at `0.160.0` as of 2026-09-24, from `threejs.org`'s docs and manual (documentation-only — no local three.js source was read this round). Several canonical patterns below were independently cross-checked against real, working code in a local project using this exact version, noted inline as "matches real usage." See `metadata.yaml` for full provenance and `research/unresolved.md` for scope boundaries (WebXR, physics, the shader-authoring API, and the audio system were deliberately excluded this round) and known gaps.

## When to use this / when not to

Real-time interactive 3D in the browser — visualizers, configurators, product shots, games, WebXR. Not a fit for offline-rendered maximum-fidelity stills, flat 2D UI, or AAA-scale native rendering. Full reasoning in `references/decision-guide.md`.

## Reference files

Read only what the current task actually needs.

- `references/mental-model.md` — scene graph, cameras, renderer, render loop, color management basics
- `references/decision-guide.md` — when to use three.js / when not to, material and camera/control choices
- `references/materials-lighting.md` — PBR materials, lighting, `PMREMGenerator`/`RoomEnvironment` (IBL), tone mapping/color space
- `references/loading-assets.md` — `GLTFLoader` (+Draco/KTX2), textures, `CanvasTexture`, framing a loaded model
- `references/controls-export.md` — `OrbitControls` and alternatives, the actual recipe for exporting a transparent PNG
- `references/animation-and-webgpu.md` — `AnimationMixer` playback, `WebGPURenderer` status, disposal/performance
- `references/pitfalls.md` — eleven specific, verified gotchas worth knowing before you hit them

Do not read `research/` for ordinary questions — it's the raw, cited evidence behind the files above, useful only when `references/` doesn't answer the question at hand.

## If this feels stale

Check `metadata.yaml`'s `freshness` field. This is a docs-only ingestion (`coverage_status: partial`) — a future `/knowledge-forge refresh threejs` against the actual `mrdoob/three.js` GitHub source would strengthen it to source-verified and could extend coverage to WebXR/physics/shaders if a project needs them.
