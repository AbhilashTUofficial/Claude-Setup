# Patterns — react-chartjs-2 5.3.1

Runnable versions live in the lab described in `examples/README.md` (deep-dive demos d01–d08 and the behaviour tests). Tags: **Verified** = executed in the lab; **Judgment** = opinion.

## Contents
- [Stable props (memoize)](#stable-props-memoize)
- [Live / rolling data](#live--rolling-data)
- [Stable series identity](#stable-series-identity)
- [Gradients via ref + state](#gradients-via-ref--state)
- [Responsive container](#responsive-container)
- [Click → drill-down](#click--drill-down)
- [Plugins (inline, global, third-party)](#plugins-inline-global-third-party)
- [Custom row shapes and time axes](#custom-row-shapes-and-time-axes)
- [Next.js / SSR](#nextjs--ssr)
- [Accessibility](#accessibility)
- [Testing](#testing)

## Stable props (memoize)
Define `options` at module scope (or `useMemo`) and build `data` with `useMemo` keyed on the source data. Inline `options={{…}}` or `data={{…}}` re-runs `chart.update()` on **every** parent render (Verified). Cheap for static charts, wasteful when the parent re-renders at high frequency.
```tsx
const options: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' as const } } };
const data = useMemo(() => ({ labels, datasets: [{ label: 'Sales', data: values }] }), [labels, values]);
```

## Live / rolling data
Create **new arrays** each tick (`[...prev, p].slice(-N)`), set `updateMode="none"` (or `options.animation=false`) for smooth streaming. Same chart instance survives (Verified: 1 instance over 24 ticks). Mutating `dataset.data.push()` without changing refs will *not* redraw. For `{x,y}` points set `parsing`/use numeric `x` and a linear/time scale.

## Stable series identity
Datasets match by `label`. If labels can change or repeat, give each dataset an `id` and pass `datasetIdKey="id"` so reorder/rename animates instead of re-growing from zero (Verified in d02). Blank labels (`''`) on several datasets are all keyed alike → only the first is reused.

## Gradients via ref + state
`data` can't be a function (v3 pattern gone). Build the gradient after the chart exists, then `setState`:
```tsx
const ref = useRef<ChartJS<'line'>>(null);
const [data, setData] = useState<ChartData<'line'>>({ datasets: [] });
useEffect(() => {
  const c = ref.current; if (!c) return;
  const g = c.ctx.createLinearGradient(0, c.chartArea.bottom, 0, c.chartArea.top);
  g.addColorStop(0, 'red'); g.addColorStop(1, 'blue');
  setData({ labels, datasets: [{ label: 'x', data: values, borderColor: g }] });
}, []);
```
(Official sandbox `chart/canvas`, Verified.) The gradient is bound to the chart-area geometry at creation — **Judgment:** if the chart resizes substantially, recompute (e.g. in a `scriptable` color function `(ctx) => …ctx.chart.chartArea…`, Chart.js feature).

## Responsive container
`responsive: true` (Chart.js default) sizes to the **parent**. Give the parent a definite height and `position: relative`, and set `maintainAspectRatio: false`; otherwise `width/height` props (300×150) only set the aspect ratio. (Verified d06 in the browser: with `maintainAspectRatio:false` the canvas followed the container height exactly; with `true` it did not follow it. Documented: faq/maintain-aspect-ratio.)

## Click → drill-down
`ref` + `onClick` + `getElementAtEvent` → `setState`; render a second chart from state (Verified d07). Guard `ref.current` and handle empty hits (`[]`).

## Plugins (inline, global, third-party)
- **Per chart:** `plugins={[myPlugin]}` — array read only at mount (Verified). Hoist to module scope; don't expect swaps to apply.
- **Global:** `ChartJS.register(plugin)` — applies to all charts; configure per chart in `options.plugins.<id>`. Third-party (e.g. `chartjs-plugin-annotation`) are used this way (Verified d05: line+box annotations).
- To enable/disable a plugin dynamically, drive it through **options** (`plugins.<id>.display`/own flag), not the `plugins` prop.

## Custom row shapes and time axes
Pass your own rows and tell Chart.js how to read them: `dataset.parsing = { xAxisKey: 'when', yAxisKey: 'revenue' }`; type with `<Line<Row[]>>`. Time axis: `import 'chartjs-adapter-date-fns'` + `scales.x.type = 'time'` (Verified d04 renders; two datasets sharing one rows array on separate y axes via `yAxisID`).

## Next.js / SSR
`dist` has no `'use client'`; put charts in a file starting with `'use client'` (App Router) or (**Judgment**, not run) load with `next/dynamic(..., {ssr:false})` if your own module touches `window` at import time. `renderToString` alone is safe and emits `<canvas role="img" width=300 height=150>` (Verified), so Pages-router SSR works; the chart appears after hydration. (App Router build itself not run — see unresolved.md.)

## Accessibility
`<Bar aria-label="Sales by region" fallbackContent={<p>text summary</p>} />` — `role="img"` is already set; the fallback is real DOM inside `<canvas>` for AT/no-canvas browsers (Verified: d07 canvas has the `aria-label` and the fallback text in the DOM; unit tests confirm `aria-*`/`data-*` are forwarded).

## Testing
Vitest/Jest + `happy-dom`/`jsdom` + `vitest-canvas-mock` (the repo's own setup). Render with `ref` to grab the instance and assert `chart.config.data`, spy `chart.update`/`destroy`. `import 'chart.js/auto'` in the test to skip registration. (Verified: lab `tests/`.) **Judgment:** don't assert pixels in unit tests; use Playwright screenshots for visual checks.

## Sources
- examples/README.md → lab demos d01–d08 and tests; research/examples-run.md; official sandboxes `chart/canvas`, `chart/events`, `chart/ref`, `chart/multitype`; docs migration-to-v4 (gradients, events)
