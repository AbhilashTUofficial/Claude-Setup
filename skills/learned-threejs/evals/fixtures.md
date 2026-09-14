# Eval fixtures — three.js

## Known-answer questions

1. **Q:** Why might my glTF model's albedo texture look washed out even though I set `texture.colorSpace = THREE.SRGBColorSpace`?
   **A:** Check `renderer.outputColorSpace` and `renderer.toneMapping` too — all three settings (texture colorSpace, tone mapping, output color space) have to agree; getting only one right still produces wrong-looking colors. From `references/pitfalls.md`, item 1.

2. **Q:** I want to export a high-resolution transparent PNG from my scene. Should I use `renderer.setPixelRatio()` to bump the resolution?
   **A:** No — the docs explicitly call that "strongly NOT RECOMMENDED" and name screenshots as an affected case. Compute the multiplied width/height yourself and pass it to `renderer.setSize()` instead. From `references/controls-export.md`.

3. **Q:** Do I need `preserveDrawingBuffer: true` to capture a screenshot of my three.js canvas?
   **A:** No — the documented recommended pattern renders synchronously immediately before calling `canvas.toBlob()`, avoiding that flag's ongoing performance cost entirely. From `references/controls-export.md`.

4. **Q:** What's the difference between `MeshStandardMaterial` and `MeshPhysicalMaterial`, and when would I use the latter?
   **A:** `MeshPhysicalMaterial` extends `MeshStandardMaterial` with clearcoat, physically-based transmission, advanced reflectivity, and sheen — use it when a surface needs one of those specific effects (e.g. a lacquered/glass product surface), not as a default for every material. From `references/materials-lighting.md` / `references/decision-guide.md`.

5. **Q:** I redrew my `CanvasTexture`'s underlying canvas but the material still shows the old image. What's wrong?
   **A:** `needsUpdate` only auto-fires once at construction — set `texture.needsUpdate = true` again after every redraw. From `references/pitfalls.md`, item 4.

## Implementation check

**Task:** Set up image-based lighting for a product scene with no external HDR file available.
**Result:** Fully answerable from `references/materials-lighting.md` alone: `new THREE.PMREMGenerator(renderer)`, `.fromScene(new RoomEnvironment(renderer), 0.04).texture`, assign to `scene.environment`.

## When-NOT-to-use check

**Q:** Give a concrete scenario where three.js is the wrong choice.
**A:** An offline-rendered, maximum-fidelity print hero image, or a flat 2D interface — three.js is a real-time browser rasterizer, not an offline renderer or a 2D UI toolkit. Matches `references/decision-guide.md`.
