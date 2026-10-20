# Pitfalls — react-chartjs-2 5.3.1

Each item: symptom → cause → fix. Tags: **Verified** = executed (test or browser); **Documented** = stated by official docs/changelog only, not run here.

## Contents
1. [`"x" is not a registered scale/element/controller/plugin`](#1-x-is-not-a-registered-)
2. [Removed option still applies (stale options)](#2-removed-option-still-applies)
3. [Data mutated but chart doesn't redraw](#3-data-mutated-but-chart-doesnt-redraw)
4. [Chart re-animates / redraws on every parent render](#4-chart-redrawsre-animates-on-every-parent-render)
5. [Dataset animates from zero after rename/reorder](#5-dataset-animates-from-zero)
6. [Swapped `plugins` prop has no effect](#6-swapped-plugins-prop-has-no-effect)
7. [`ref.current` is null right after changing `type`](#7-refcurrent-is-null-after-type-change)
8. [Chart ignores `width`/`height`](#8-chart-ignores-widthheight)
9. [Area fill not showing](#9-area-fill-not-showing)
10. [Next.js: hooks/`window` errors](#10-nextjs-errors)
11. [Gradient / `data` as function](#11-gradient--data-as-function)
12. [Test env gaps](#12-test-environment-gaps)
13. [Mixed-version cruft](#13-version-cruft)

## 1. `"x" is not a registered …`
Typed components register **only** their controller. Register scales/elements/plugins (see api.md table) or `import 'chart.js/auto'`. The error is thrown from the mount effect, i.e. out of `render()`/React's commit — an error boundary catches it, `try/catch` around JSX does not. Order of discovery for a bare `<Bar>`: `category` scale → then `bar` element.

## 2. Removed option still applies
Updates do `Object.assign(chart.options, options)`. A key present before and absent now **stays** (`indexAxis:'y'` → `{}` stays horizontal); nested objects are replaced wholesale (dropping `plugins.legend.display:false` while sending a new `plugins` object resets legend to default). **Fix:** set values explicitly (`indexAxis: horizontal ? 'y' : 'x'`) instead of omitting keys; or use `redraw`/a `key` to remount.

## 3. Data mutated but chart doesn't redraw
Effects depend on `data.labels`/`data.datasets`/`options` **reference** identity. `dataset.data.push(x)` + same `data` object → no `update()`. Note the chart's dataset is a shallow copy but shares your `data` array, so the chart *holds* the new value yet doesn't repaint until something else triggers `update()`. **Fix:** immutable updates (`[...prev, x]`, new `datasets` array).

## 4. Chart redraws/re-animates on every parent render
New `datasets` array or new `options` object each render ⇒ `chart.update()` each render (identical content doesn't matter). **Fix:** `useMemo`/module-scope; `updateMode="none"` for high-frequency data. Not a rebuild (instance id unchanged) — only an update.

## 5. Dataset animates from zero
Match key = `label` (first match). Renaming changes identity → new series. Duplicate/blank labels → only the first gets reused. **Fix:** `datasetIdKey="id"` with stable ids. (The docs' "first dataset copied over to others" symptom did not reproduce in 5.3.1 — see unresolved.md.)

## 6. Swapped `plugins` prop has no effect
`plugins` is read in `renderChart` only. **Fix:** configure behaviour through `options.plugins.<id>`, register globally, or force a rebuild (`redraw`, `key`). Also bites during Vite HMR: editing the plugin array doesn't affect a mounted chart until reload.

## 7. `ref.current` is null after type change
`type` change and `redraw` run `destroy()` (ref ← null) then `setTimeout(renderChart)`. Reading `ref.current` synchronously in the same effect/handler after toggling `type` gives `null`. **Fix:** read the ref in a later tick/effect, null-check always (`const c = ref.current; if (!c) return;`).

## 8. Chart ignores `width`/`height`
Those are canvas attributes; with `responsive:true` Chart.js sizes from the parent. **Fix:** give the parent a height + `position:relative` and `options.maintainAspectRatio=false`. (**Documented**: faq/maintain-aspect-ratio; behaviour checked in the browser, see research/examples-run.md §4.)

## 9. Area fill not showing
`fill: true` needs `Filler` registered. `ChartJS.register(Filler)`. (**Documented**: faq/fill-property.md; not run here.)

## 10. Next.js errors
`'use client'` is absent from the package; in App Router a server file importing `Line` can't use hooks → add `'use client'` to the chart component file. Charts only mount after hydration (canvas SSR output is empty). *(Derived from dist contents; full Next build not run.)*

## 11. Gradient / `data` as function
v3 allowed `data={canvas => …}`; since v4 it's an object. Use `ref.current.ctx` in an effect, build the gradient from `chart.chartArea`, then `setState` the new data. (**Documented** migration-to-v4; **Verified** by the `chart/canvas` sandbox rendering.)

## 12. Test environment gaps
jsdom/happy-dom have no real canvas: the repo's own `test/setup.ts` loads `vitest-canvas-mock`, and the lab did the same (**Derived**: without a 2D context Chart.js cannot create the chart; `jest-canvas-mock` is the Jest equivalent). Set `options.animation=false` and `responsive=false` in tests to avoid timers/ResizeObserver reliance. **Judgment** for the options; mock requirement is from the repo's own `test/setup.ts`.

## 13. Version cruft
- `import Chart from 'react-chartjs-2'` (default export) and `getElementAtEvent` *props* are v3-era; v4+ uses named exports and helper functions.
- Docs/blogs for Chart.js v2 (`Chart.defaults.global`, `legend:{}` at top-level) don't apply to v4.
- v5.0 was ESM-only; 5.1+ ships CJS again (`Cannot find module 'react-chartjs-2'` → upgrade). (**Documented**: CHANGELOG 5.0.0/5.1.0, migration-to-v5, faq/esm-only.)

## Sources
- research/examples-run.md §3–4; `src/chart.tsx`, `src/utils.ts`; docs faq/*, migration-to-v4/v5
