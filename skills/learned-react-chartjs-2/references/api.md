# API cheat-sheet — react-chartjs-2 5.3.1

## Contents
- [Install & imports](#install--imports)
- [Props](#props)
- [Registration recipes](#registration-recipes)
- [Ref & instance](#ref--instance)
- [Event helpers](#event-helpers)
- [TypeScript](#typescript)

## Install & imports
```bash
npm i chart.js react-chartjs-2      # chart.js ^4.1.1 is a peer dep
```
```ts
import { Chart, Line, Bar, Radar, Doughnut, PolarArea, Bubble, Pie, Scatter,
         getDatasetAtEvent, getElementAtEvent, getElementsAtEvent } from 'react-chartjs-2';
import type { ChartProps } from 'react-chartjs-2';
```
There is **no** re-export of Chart.js (removed in v4) and **no default export** — import `Chart`, `registerables`, scales etc. from `chart.js`. (Documented: migration-to-v4.) ESM package with CJS build (`dist/index.cjs`). No `'use client'` in dist.

## Props
`ChartProps<TType, TData, TLabel>` = Chart.js-typed props **+ every `<canvas>` attribute** (`className`, `style`, `onClick`, `aria-label`, `data-*`, `id`…). Typed components (`Line` …) omit `type`.

| Prop | Default | Behaviour |
|---|---|---|
| `type` | required on `Chart` | Change → destroy + rebuild on next macrotask |
| `data` | required | `{labels?, datasets[]}`; plain object (function form removed in v4) |
| `options` | undefined | shallow-merged on update; dropped keys are **not** reset |
| `plugins` | `[]` | per-chart inline plugins; **read at construction only** |
| `redraw` | `false` | `true` = destroy + rebuild (new `chart.id`) on every data/options change |
| `datasetIdKey` | `'label'` | key used to match datasets between renders |
| `updateMode` | undefined | passed to `chart.update(mode)` — `'none'` skips animation (Verified: forwarded verbatim); other strings are Chart.js's `UpdateMode` values, see the Chart.js docs |
| `fallbackContent` | undefined | ReactNode rendered inside `<canvas>` (a11y fallback) |
| `width` / `height` | 300 / 150 | canvas attributes (2:1 unless container/`maintainAspectRatio` says otherwise) |

All **Verified-in-code** (`types.ts`, defaults at `chart.tsx:23-30`).

## Registration recipes
```ts
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement,
         ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);   // <Bar>
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend); // <Line>
ChartJS.register(ArcElement, Tooltip, Legend);                                          // <Pie>/<Doughnut>
ChartJS.register(Filler);                      // needed for `fill: true/'origin'` on lines
import 'chart.js/auto';                         // lazy way: registers everything (bigger bundle)
```
Error → fix: `"category" is not a registered scale` → `CategoryScale`; `"linear"` → `LinearScale`; `"time"` → `TimeScale` + a date adapter; `"bar"/"arc"/"point"/"line" is not a registered element` → `BarElement/ArcElement/PointElement/LineElement`. (Tested: registration.test.tsx; Documented: faq/registered-*.md.) Minimum sets the official sandboxes register (Verified — each of the 17 runs clean in the browser):

| Component | Register (besides its auto-registered controller) |
|---|---|
| `Bar` | `CategoryScale, LinearScale, BarElement` (+ `Tooltip, Legend, Title` as wanted) |
| `Line` | `CategoryScale, LinearScale, PointElement, LineElement` (+ `Filler` for area fill) |
| `Scatter` | `LinearScale, PointElement, LineElement` |
| `Bubble` | `LinearScale, PointElement` |
| `Pie`, `Doughnut` | `ArcElement` |
| `PolarArea` | `RadialLinearScale, ArcElement` |
| `Radar` | `RadialLinearScale, PointElement, LineElement` (+ `Filler`) |
| time x-axis | `TimeScale` + adapter import, e.g. `chartjs-adapter-date-fns` |

## Ref & instance
`ref` gives the Chart.js instance (`ChartJS<TType, TData, TLabel>`), set after mount; `null` before mount, after unmount, and during `type`/`redraw` rebuilds.
```tsx
const ref = useRef<ChartJS<'line'>>(null);
useEffect(() => { const c = ref.current; if (c) console.log(c.ctx, c.canvas, c.chartArea); }, []);
```
Callback refs also work (`reforwardRef` handles function or object refs; **Verified**: upstream `test/chart.test.tsx` uses a callback ref).

## Event helpers
```tsx
const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const chart = ref.current; if (!chart) return;
  const [hit] = getElementAtEvent(chart, e);     // {datasetIndex, index, element}
  getElementsAtEvent(chart, e);                   // all datasets at that index
  getDatasetAtEvent(chart, e);                    // whole dataset
};
<Bar ref={ref} onClick={onClick} … />
```
Each is `chart.getElementsAtEventForMode(e.nativeEvent, mode, {intersect:true}, false)` with modes `nearest` / `index` / `dataset`. Return `InteractionItem[]` (empty when nothing hit).

## TypeScript
```ts
import type { ChartData, ChartOptions } from 'chart.js';
const options: ChartOptions<'bar'> = { … };
const data: ChartData<'bar'> = { … };
<Line<MyRow[]> data={{ datasets: [{ data: rows, parsing: { xAxisKey: 'when', yAxisKey: 'y' } }] }} />
```
Typed components are generic `<TData, TLabel>`; `Chart` is generic `<TType, TData, TLabel>`. Use `as const` on literals like `mode: 'index' as const` (as the official sandboxes do) so option strings narrow.
`useRef<ChartJS>(null)` type-checks although the lib types the ref as `Chart | undefined` (cosmetic `@todo` in types.ts).

## Sources
- `src/types.ts`, `src/chart.tsx`, `src/utils.ts`, `src/typedCharts.tsx` @ v5.3.1; docs migration-to-v4, faq/*; research/examples-run.md
