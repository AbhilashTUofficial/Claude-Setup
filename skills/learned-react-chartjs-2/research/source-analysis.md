# Source analysis — react-chartjs-2 5.3.1

Repo `reactchartjs/react-chartjs-2`, tag `v5.3.1` = commit `2df1f08f41ad56c256903b0def68a99272a701dd` (2025-10-27). Default-branch HEAD at retrieval was `7c7be48ae5b585f45bc6aef718cc8d4b51f34d0a` (2026-05-26, "docs: switch banner"; docs-only after the tag). Library source is 4 files, ~330 lines: `src/chart.tsx`, `src/typedCharts.tsx`, `src/utils.ts`, `src/types.ts` (+ `index.ts`). Chart.js resolved in the lab: 4.5.1 (peer range `^4.1.1`).

## `<Chart>` (src/chart.tsx) — all **Verified-in-code**

- Props destructured: `height=150`, `width=300`, `redraw=false`, `datasetIdKey`, `type`, `data`, `options`, `plugins=[]`, `fallbackContent`, `updateMode`; **everything else is spread on `<canvas>`** (chart.tsx:22-34, 103-109). Canvas gets `role='img'` unless overridden (chart.tsx:105).
- `renderChart` builds `new ChartJS(canvas, { type, data: cloneData(data, datasetIdKey), options: options && {...options}, plugins })` then writes the instance to the forwarded ref (chart.tsx:40-50). So `plugins`, `type`, and the initial `data/options` are read **at construction**.
- Effects (chart.tsx:60-103):
  1. `[redraw, options]` → if not redraw: `setOptions` = `Object.assign(chart.options, options)` (utils.ts:31) — **shallow, never deletes keys**.
  2. `[redraw, data.labels]` → `setLabels` (assigns `config.data.labels`).
  3. `[redraw, data.datasets]` → `setDatasets` (reconcile by `datasetIdKey`).
  4. `[redraw, options, data.labels, data.datasets, updateMode]` → if redraw: `destroyChart(); setTimeout(renderChart)` else `chart.update(updateMode)`.
  5. `[type]` → `destroyChart(); setTimeout(renderChart)` (guarded by `chartRef.current`; see note below for why it is a no-op on mount).
  6. `[]` mount: `renderChart()`; cleanup `destroyChart()`.
- Effect dependencies are **reference identity** of `options`, `data.labels`, `data.datasets` — in-place mutation does not trigger anything. (**Verified-in-code**, and by test, see examples-run.md.)
- `destroyChart` first sets the ref to `null`, then destroys; `renderChart` re-sets the ref. On rebuild paths the ref is therefore `null` until the `setTimeout` fires.
- Note on effect 5: on mount, effects run in order 1…6; effect 5 guards on `chartRef.current` which is still null at that time (renderChart runs last, effect 6). So no double-build on mount. **Derived** (empirically: StrictMode test leaves exactly one live chart on the canvas).

## `setDatasets` / `cloneData` (src/utils.ts)

- Key = `dataset[datasetIdKey]`, default `'label'` (utils.ts:13). For each next dataset it finds the *first* current dataset with the same key. If none, or the next dataset has no `data`, or that current dataset was already claimed (`addedDatasets`) → returns a **shallow copy** `{...nextDataset}`. Otherwise `Object.assign(currentDataset, nextDataset)` and keeps the **same object** (utils.ts:55-79). Consequence: Chart.js per-dataset meta/animation state is preserved for matched series.
- Consequence for duplicate/blank labels: only the first duplicate is reused; the others are recreated each update (still correct values).
- `cloneData` seeds `{labels: [], datasets: []}` then runs `setLabels` + `setDatasets` (props are not mutated at the top level). The dataset's `data` **array is shared** with the prop (shallow copy), so mutating it in place edits chart data without an update.

## Typed components (src/typedCharts.tsx)

- `createTypedChart(type, controller)` calls `ChartJS.register(controller)` at **module load** and returns `forwardRef` wrapper passing `type`. Exports: `Line, Bar, Radar, Doughnut, PolarArea, Bubble, Pie, Scatter` (typedCharts.tsx:33-59). Only the *controller* is registered — not scales, elements, or plugins.
- `/* #__PURE__ */` + `"sideEffects": false` → tree-shakable; unused typed charts can be dropped by bundlers.

## Event helpers (src/utils.ts:99-142)

`getDatasetAtEvent` → mode `'dataset'`, `getElementAtEvent` → `'nearest'`, `getElementsAtEvent` → `'index'`; all `{ intersect: true }`, `useFinalPosition=false`, called as `chart.getElementsAtEventForMode(event.nativeEvent, mode, opts, false)`.

## Types (src/types.ts)

`ChartProps<TType, TData, TLabel> extends CanvasHTMLAttributes<HTMLCanvasElement>`; `ForwardedRef<T>` = callback | `MutableRefObject<T|null>` | null; component ref type is `Chart<...> | undefined`-flavoured (`ChartJSOrUndefined`, with a `@todo` to switch to `null`). `fallbackContent` carries a `@todo` to become `children`. Typed components omit `type` and take generics `<TData, TLabel>`.

## Package (package.json @ v5.3.1; npm 5.3.1 dist inspected in lab)

- `type: module`, `sideEffects: false`; published exports: `import → dist/index.js`, `require → dist/index.cjs`, types `dist/index.d.ts`. peerDependencies `chart.js ^4.1.1`, `react ^16.8 || ^17 || ^18 || ^19`. MIT. Uses `react/jsx-runtime` (changelog 5.3.1 "use jsx-runtime").
- npm dist contains **no `"use client"` directive** (grep of `dist/index.js`) → in Next.js App Router, files that use it need their own `'use client'`. (**Verified-in-code**.)
- Versions: 5.0.0 (2022-11) chart.js v4 + ESM-only; 5.1.0 CJS restored; 5.2.0 webpack 4 compat; 5.3.0 (2025-01) React 19; 5.3.1 (2025-10-27) jsx-runtime + dep bumps. (CHANGELOG.md)

## Sources
- `source/src/{chart.tsx,utils.ts,typedCharts.tsx,types.ts,index.ts}` @ v5.3.1
- `source/package.json`, `source/CHANGELOG.md`
- `node_modules/react-chartjs-2/dist/index.js` (npm 5.3.1)
