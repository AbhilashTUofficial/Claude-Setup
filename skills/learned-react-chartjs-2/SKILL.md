---
name: learned-react-chartjs-2
description: "Compiled knowledge of react-chartjs-2 5.3.1 (npm `react-chartjs-2`, React wrapper for Chart.js 4): <Chart>/<Line>/<Bar>/… components, registration of scales/elements, update/redraw semantics, dataset identity, refs, event helpers, SSR/Next.js. Use when evaluating, integrating or debugging react-chartjs-2, or when a task involves Chart.js charts in React."
metadata:
  knowledge_schema_version: 1
  learned_skill: true
---

# react-chartjs-2

A ~330-line adapter that owns one `<canvas>` and one live Chart.js instance. `<Chart type=…>` (or the typed `Line`, `Bar`, `Pie`, `Doughnut`, `Radar`, `PolarArea`, `Bubble`, `Scatter`) builds `new Chart(canvas, …)` on mount, then on re-render pushes props into it: `options` via a **shallow** `Object.assign`, `data.datasets` reconciled by key (`label` by default → same object reused, so it animates), then `chart.update(updateMode)`. `type` or `redraw` destroy and rebuild (ref is `null` until the next tick); `plugins` is read only at mount. Typed components register **only their controller** — you must register scales, elements and plugins yourself (or `import 'chart.js/auto'`). Updates fire on **reference** change of `data.labels`/`data.datasets`/`options`.

Studied at `5.3.1` (tag `v5.3.1`, commit `2df1f08f`) as of 2026-10-20, against Chart.js 4.5.1 + React 19. See `metadata.yaml` for provenance and `research/unresolved.md` for what is *not* covered (React <19, Next App Router build, performance, other plugins).

## When to use this / when not to

Use for standard business charts (line/bar/pie/…/mixed) in React backed by Chart.js and its plugins. Not for server-side image export, DOM/SVG-accessible charts, very large or per-frame data, or exotic chart types — full reasoning and concrete scenarios are in `references/decision-guide.md`.

## Reference files

Read only what the current task actually needs — these are not meant to be loaded together.

- `references/mental-model.md` — how props map onto the Chart.js instance; the four rules that explain most behaviour
- `references/decision-guide.md` — when to use / when NOT (with concrete scenarios), alternatives
- `references/api.md` — props table with defaults, per-chart registration table, ref/event helpers, TypeScript
- `references/patterns.md` — memoizing props, live data, dataset ids, gradients, responsive sizing, drill-down, plugins, time axes, Next.js, a11y, testing
- `references/pitfalls.md` — 13 symptom → cause → fix entries (unregistered scale, stale options, no redraw on mutation, null ref, …)
- `examples/README.md` — index of the runnable lab (demos d01–d08, vitest probes) and where it lives; the code is not duplicated here

Do not read `research/` for ordinary questions — it's the raw, cited evidence behind the files above (WARM tier), useful only when `references/` genuinely doesn't answer the question at hand.

## If this feels stale

Check `metadata.yaml`'s `freshness` field. If it says `aging` or `stale`, say so before answering and suggest `/knowledge-forge refresh react-chartjs-2`.
