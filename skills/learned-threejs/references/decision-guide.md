# Decision guide — three.js

## Use three.js when

- You need interactive, real-time 3D in a browser — product visualizers/configurators, data visualization, games, generative art, AR/VR (WebXR) — without hand-writing raw WebGL buffer/shader management.
- You want photorealistic-leaning rendering (PBR materials + image-based lighting) with a manageable API rather than a full game-engine's learning curve.
- The target is the web platform specifically — no native app, no separate renderer to ship.

## Do NOT use three.js when

- **You need a native, high-fidelity offline-rendered product shot** (e.g. a ray-traced hero image for print) — three.js is a real-time rasterizer; for the absolute highest fidelity, a dedicated offline renderer (or baking with a DCC tool) will outperform it, though real-time PBR + tone mapping gets remarkably close for most web use cases.
- **You're building a 2D-only interface** — reach for Canvas 2D/SVG/CSS directly; standing up a 3D scene graph for flat UI is overkill.
- **You need true native-app performance/fidelity** (AAA-game-quality, massive scenes) — three.js runs inside a browser's WebGL/WebGPU sandbox; a native engine (Unity, Unreal, a custom native renderer) will out-perform and out-scale it.
- **The task is authoring/creating 3D assets**, not rendering them — three.js loads and renders models, it isn't a modeling tool; use Blender/Maya/etc. and export to glTF.

## PerspectiveCamera vs. OrthographicCamera

Default to `PerspectiveCamera` for anything meant to look photographic/realistic (product shots, games, general scenes). Use `OrthographicCamera` specifically when distance-independent, scale-accurate rendering matters — CAD, isometric games, architectural elevations, 2D-style overlays.

## MeshStandardMaterial vs. MeshPhysicalMaterial

Default to `MeshStandardMaterial` for ordinary PBR surfaces (plastic, painted metal, most everyday materials — roughness/metalness workflow). Reach for `MeshPhysicalMaterial` specifically when the surface needs clearcoat (car paint, lacquer, glossy device screens/bodies), physically-based transmission (real glass, not just alpha blending), advanced non-metal reflectivity, or sheen (fabric) — it costs more to render, so don't default to it for every material in a scene, only where those specific effects are visually load-bearing.

## WebGLRenderer vs. WebGPURenderer

Default to `WebGLRenderer` — it's the stable, fully-documented, default path. Only reach for `WebGPURenderer` if you specifically need its newer capabilities (compute shaders via TSL, the node-based post-processing/MRT stack) and can accept an experimental renderer, including rewriting any custom `ShaderMaterial`/`onBeforeCompile()` shaders as TSL node materials, since they don't carry over.

## OrbitControls vs. alternatives

Default to `OrbitControls` for "let the user look around an object" (product viewers, model inspectors) — it's the most common, well-documented choice. Use `TrackballControls`/`ArcballControls` specifically when you want free tumble rotation with no locked up-axis (e.g. inspecting an object from any angle including upside-down). Use `FlyControls`/`PointerLockControls` only for free 6DOF or first-person navigation — not for an object-inspection UI.
