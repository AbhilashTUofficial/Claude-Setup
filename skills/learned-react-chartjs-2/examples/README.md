# Examples — react-chartjs-2 5.3.1

The runnable examples live in the working lab, not here (single source of truth):

`C:\Users\jinub\Programming\Personal\react-chartjs-2-lab` — Vite 7 + React 19 + chart.js 4.5.1 + react-chartjs-2 5.3.1.
`npm install && npm run dev` (sidebar: demos + the official sandboxes) · `npm test` (vitest probes).
On another machine, recreate it by following the lab's `README.md` (copy `src/deepdive/`, `tests/`, `vite.config.ts`; deps: `chart.js react-chartjs-2 chartjs-adapter-date-fns chartjs-plugin-annotation`, dev: `vitest happy-dom vitest-canvas-mock @testing-library/react`).

| Lab file | Shows |
|---|---|
| `src/deepdive/d01-live-data.tsx` | rolling window, `updateMode='none'`, one instance across ticks |
| `src/deepdive/d02-dataset-identity.tsx` | `label` vs `datasetIdKey`; reused vs NEW datasets |
| `src/deepdive/d03-stale-options.tsx` | removed option keys are not reset (shallow merge) |
| `src/deepdive/d04-time-and-object-data.tsx` | `parsing` for custom rows, time scale, 2 y-axes, `<Line<Row[]>>` |
| `src/deepdive/d05-plugins.tsx` | per-chart plugin vs global annotation plugin |
| `src/deepdive/d06-responsive-sizing.tsx` | parent-sized canvas, `maintainAspectRatio` |
| `src/deepdive/d07-drilldown-events.tsx` | `getElementAtEvent` → state → 2nd chart, a11y fallback |
| `src/deepdive/d08-type-switch-redraw.tsx` | `type` change / `redraw` rebuild, chart id |
| `tests/registration.test.tsx` | controllers-only registration, error messages, SSR output |
| `tests/update-semantics.test.tsx` | identity, update triggers, options merge, plugins, lifecycle, StrictMode, events |
| `src/official/*.tsx` | the 17 upstream sandboxes, unchanged |
