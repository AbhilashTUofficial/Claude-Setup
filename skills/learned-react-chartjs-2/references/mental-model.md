# Mental model — react-chartjs-2 5.3.1

## What it is
A ~330-line **imperative-to-declarative adapter**: one `<canvas>` + one live Chart.js instance. It does not render charts; Chart.js does. React props are *diffed by reference* and pushed into the instance via `Object.assign`/`chart.update()`. **Documented + Verified-in-code** (`src/chart.tsx`).

```
props ──► <Chart type data options plugins …>
            │ mount:  new ChartJS(canvas, {type, data: clone, options: {...options}, plugins})
            │ update: Object.assign(chart.options, options)   ← shallow, never deletes
            │         reconcile datasets by dataset[datasetIdKey] ('label')  ← keeps object identity
            │         chart.update(updateMode)
            │ type change / redraw: destroy → setTimeout → new ChartJS   ← ref is null in between
            └ unmount: destroy, ref ← null
```

## Components
- `Chart` — generic, takes `type`. Registers **nothing**.
- `Line, Bar, Radar, Doughnut, PolarArea, Bubble, Pie, Scatter` — `Chart` with `type` fixed; each registers **only its controller** at import time. (Verified: registry has exactly those 8 controllers and no scales/elements/plugins after `import 'react-chartjs-2'`.)
- Helpers: `getDatasetAtEvent` (mode `dataset`), `getElementAtEvent` (`nearest`), `getElementsAtEvent` (`index`).
- Chart.js itself (`chart.js` v4 peer) is where `register`, scales, elements, plugins, options live — most "react-chartjs-2 bugs" are Chart.js config issues (**Judgment**).

## The four rules that explain almost everything
1. **Register what the controller needs.** Scales (`CategoryScale`, `LinearScale`…), elements (`BarElement`, `ArcElement`, `PointElement`, `LineElement`), plugins (`Tooltip`, `Legend`, `Title`, `Filler`) — or `import 'chart.js/auto'` for everything. Missing → thrown error at mount.
2. **Updates are triggered by reference change** of `data.labels`, `data.datasets`, `options`, `updateMode` (React effect deps). Mutating in place does nothing; inline literals update every parent render.
3. **Datasets are matched by key** (`label` by default, or `datasetIdKey`): matched → same object kept (animates old→new); unmatched → new series.
4. **Some props are mount-only:** `type`/`redraw` rebuild the chart; `plugins` is read only at construction (later changes are ignored — Verified). `options` merge is shallow: you can add/override top-level keys but not remove them.

## Canvas facts
`width`/`height` are canvas *attributes* (default 300×150 → 2:1). Extra props (`className`, `onClick`, `aria-*`, `data-*`) go on the `<canvas>`; `role="img"` is set by default; `fallbackContent` renders inside the canvas for a11y.

## Sources
- `src/chart.tsx:22-109`, `src/utils.ts:13-142`, `src/typedCharts.tsx:22-59` @ v5.3.1; research/source-analysis.md; research/examples-run.md §3
