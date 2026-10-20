# Decision guide — react-chartjs-2

## Use it when
- You are in React (peer range 16.8–19 is **Documented**; only 19 was run here) and want standard business charts (line/bar/pie/doughnut/radar/polar/bubble/scatter, mixed types) with Chart.js's canvas rendering, animation, tooltips and plugin ecosystem (annotation, zoom, datalabels, date adapters).
- You want a thin wrapper: all Chart.js options/plugins work as documented by Chart.js; you hold the instance via `ref` for imperative needs (gradients, `toBase64Image()`, `getElementsAtEventForMode`).
- Charts are moderately sized (hundreds–low thousands of points) and updates are infrequent-to-frequent but not per-frame.

## Do NOT use it when (concrete scenarios)
1. **Server-rendered static charts / image export from Node/email/PDF.** It renders to a `<canvas>` in the browser; SSR emits only an empty `<canvas>` (Verified: `renderToString` output). Use `chartjs-node-canvas`/QuickChart server-side, or SVG charts.
2. **You need accessible, selectable, stylable chart DOM** (per-bar focus, CSS theming, text search). Canvas is opaque; `fallbackContent`/`aria-label` only give a summary. Prefer an SVG library (Recharts, visx, Nivo-SVG). (**Judgment**)
3. **Very large or per-frame data (≥10⁵ points, 60fps streaming, many simultaneous charts).** Every update goes through `chart.update()` on the 2D canvas; use Chart.js decimation or a WebGL/canvas-specialised library (uPlot, ECharts, WebGL charts). (Performance at scale not benchmarked — **Judgment**.)
4. **Heavy bespoke visuals (Sankey, treemap, maps, force graphs).** Not Chart.js core territory; use D3/ECharts/dedicated plugins. (**Judgment**)
5. **You can't or won't register Chart.js pieces and your bundle is tiny-budget.** `chart.js/auto` pulls everything; tree-shaking requires hand-registration (see pitfalls). If that overhead is unacceptable consider a smaller lib. (**Judgment**; bundle size not measured)
6. **Next.js App Router server components:** it can't run there (no `'use client'` in dist); wrap in a client component. Not a blocker, but the chart must be a client island.

## Alternatives at a glance (**Judgment**)
| Need | Better fit |
|---|---|
| Declarative SVG React charts | Recharts, visx, Nivo, Victory |
| Maximum features/perf, any framework | Apache ECharts (`echarts-for-react`) |
| Time-series at high frequency | uPlot |
| Chart.js without React wrapper | use `new Chart()` in an effect yourself (the wrapper is only ~330 lines) |

## Project health (Documented)
MIT; 5.3.1 released 2025-10-27 (React 19 support in 5.3.0, 2025-01); peer `chart.js ^4.1.1`. Release cadence after 5.3.1 not assessed (see research/unresolved.md).

## Sources
- research/source-analysis.md; research/examples-run.md §3 (SSR output); `package.json` @ v5.3.1; docs: https://react-chartjs-2.js.org/
