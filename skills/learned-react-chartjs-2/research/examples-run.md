# Examples run — evidence from execution

Lab: `C:\Users\jinub\Programming\Personal\react-chartjs-2-lab` (Vite 7, React 19.3, react-chartjs-2 5.3.1 from npm, chart.js 4.5.1, vitest 4 + happy-dom + vitest-canvas-mock, Playwright for the browser). Everything below was actually executed on 2026-10-20.

## 1. Upstream test suite
`source/test/chart.test.tsx` (19 tests) run in the lab: 17 pass; 2 fail only because my lab lacks `@testing-library/jest-dom` matchers (`toHaveClass`, `toContainElement`) — not a library problem. (Verified.)

## 2. Official sandboxes (17) in a real browser
All 17 `sandboxes/**/App.tsx` copied to `src/official/` and loaded under `<StrictMode>`: each renders ≥1 sized `<canvas>`, **0 page errors**. (Verified via Playwright.) Includes `chart/events`, `chart/ref`, `chart/canvas` (gradient via ref + state), `chart/multitype`.

## 3. Behaviour probes (vitest, 27 tests, all pass) — lab `tests/`
`registration.test.tsx` (6) and `update-semantics.test.tsx` (21). Confirmed:
- Importing the package registers exactly 8 controllers (bar, bubble, doughnut, line, pie, polarArea, radar, scatter) and **no** scales/elements/plugins.
- `<Bar>` with nothing else registered throws `"category" is not a registered scale`; after scales, `"bar" is not a registered element`; `<Doughnut>` → `"arc" is not a registered element`. They throw synchronously out of `render()` (error raised in the mount effect). After registering `CategoryScale, LinearScale, BarElement` it works.
- `renderToString(<Line …/>)` = `<canvas role="img" height="150" width="300" class="c">…fallback…</canvas>` — SSR-safe, no Chart.js access.
- Same `label` → same dataset object (mutated in place); renamed label → new object; duplicate labels → values correct, only first match reused; the chart's dataset is a shallow copy whose `data` array **is shared** with the prop.
- Update triggers: in-place mutation + same object → `chart.update` **not** called; fresh `datasets` array → called; inline `options={{}}` literal → called every parent render; stable refs → not called; `updateMode` forwarded verbatim.
- Options: new top-level key applied; **removed key stays** (`indexAxis:'y'` survived `options={{}}`); nested object replaced wholesale (dropping `legend.display:false` re-enables legend).
- `plugins` prop swapped after mount → new plugin never runs; old keeps running.
- Ref: instance after mount, `null` after unmount; `type` change destroys immediately, ref is `null` until next macrotask, then a new instance; `redraw` → new `chart.id` each change; without redraw `chart.id` stable.
- StrictMode: exactly one live chart bound to the canvas (`Chart.getChart(canvas) === ref.current`).
- Canvas defaults width 300 / height 150 / role img; extra props (aria-label, data-*) forwarded.
- `getElementAtEvent` calls `getElementsAtEventForMode(native, 'nearest', {intersect:true}, false)`.

## 4. Deep-dive demos in a real browser (Playwright, Chromium, StrictMode)
- d01 live data: after 24 ticks → **1** distinct chart instance (id never changed), `updateMode='none'`.
- d02 identity: New values / Reverse → all `reused`; Rename #1 with label key → `NEW`; with `datasetIdKey="id"` → `reused`.
- d03 stale options: `y` → chart y; options `{}` → **still y** (prop says no key); `x` → x.
- d08: re-render → same id; `type` bar→line → new id; `redraw` + re-render → new id.
- d05: annotation plugin box+line render; per-chart `afterDraw` watermark renders. Incidentally: editing the `plugins` array via Vite HMR did **not** change the live chart until a full reload (consistent with construction-time plugins).
- d04 (time scale + object rows via `parsing`) renders without errors and type-checks with `<Line<Row[]>>`.
- d07 drill-down (re-verified after review, synthetic `MouseEvent` clicks with clientX/Y): sweeping clicks along the bars picks North/South/East → text "Mix for <region>" and a 2nd `<canvas>` (doughnut) appears; a click at the empty top-left corner → "Click a bar" (empty hit array handled). The bar canvas has `aria-label="Sales by region"` and its `fallbackContent` text is present in the DOM.
- d06 sizing (box = relative parent with fixed height): with `maintainAspectRatio:false` the canvas tracks the container exactly (900×240, 900×400, 900×480, 900×160 CSS px for boxes 240/400/480/160). With `maintainAspectRatio:true` it does **not** track: boxes 300 and 480 both gave 900×240, box 160 gave 600×160 (ratio 3.75, inherited from the size at toggle time — toggling the option on a live chart reuses the last measured ratio; not studied further, **Unconfirmed** beyond "does not follow container height").
- d02 re-run after refactor: New values/Reverse → all reused; Rename #1 → NEW with label key, reused with `datasetIdKey="id"`.

## Not run
See unresolved.md (React 16–18, Next.js App Router build, perf/size, mobile touch, chartjs-plugin-zoom).
