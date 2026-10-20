# Eval fixtures — react-chartjs-2

Answered **using only `references/`** (2026-10-20). All answerable; no gaps found.

## Known-answer questions

1. **Q:** `<Bar>` throws `"category" is not a registered scale` on a fresh app. Why, and what's the minimal fix?
   **A:** Typed components register only `BarController`; register `CategoryScale, LinearScale, BarElement` (+ plugins wanted) via `ChartJS.register(...)`, or `import 'chart.js/auto'`. — `api.md` (Registration recipes table), `pitfalls.md` §1.

2. **Q:** You `delete` `indexAxis` from the options object you pass to `<Bar>` after it was `'y'`. What does the chart do?
   **A:** Stays horizontal: updates are a shallow `Object.assign(chart.options, options)` and never remove keys. Set `indexAxis: 'x'` explicitly. — `pitfalls.md` §2, `mental-model.md` rule 4.

3. **Q:** You `push()` a point onto `dataset.data` and re-render with the same `data` object. Does the chart update? Why?
   **A:** No — effects depend on reference identity of `data.datasets`/`data.labels`/`options`; use immutable updates. — `pitfalls.md` §3.

4. **Q:** What default key identifies datasets between renders, and how do you change it?
   **A:** `label`; pass `datasetIdKey="id"` (with an `id` on each dataset). — `api.md` Props table, `patterns.md` Stable series identity.

5. **Q:** After `setType('line')` the `ref.current` is `null` in the same handler. Why?
   **A:** Type change destroys the chart (ref ← null) and rebuilds in `setTimeout`; read the ref later and null-check. — `pitfalls.md` §7.

6. **Q:** Does swapping the `plugins` prop after mount change behaviour? What to do instead?
   **A:** No (read at construction only); use `options.plugins.<id>`, global register, or force a rebuild (`redraw`/`key`). — `pitfalls.md` §6, `patterns.md` Plugins.

7. **Q:** Which Next.js-specific step is needed to use it in the App Router?
   **A:** Put the chart in a file with `'use client'` (dist has no directive); SSR output is only an empty `<canvas>`. — `pitfalls.md` §10, `patterns.md` Next.js.

## Implementation check

**Task:** Build a streaming line chart of the last 30 `{x,y}` points that doesn't animate and keeps one Chart.js instance.
**Result:** Doable from `patterns.md` "Live / rolling data" (new arrays per tick, `updateMode="none"`, `parsing`/linear scale) + `api.md` registration table for `Line` (`CategoryScale/LinearScale/PointElement/LineElement`, or `chart.js/auto`) and the lab's `src/deepdive/d01-live-data.tsx` (indexed in `examples/README.md`) as the full code. Nothing outside `references/` + the lab was needed.

## When-NOT-to-use check

**Q:** Give a concrete scenario where react-chartjs-2 is the wrong choice.
**A:** Rendering charts server-side to an image (email/PDF) — it only draws on a browser `<canvas>`, SSR emits an empty canvas; or needing DOM/SVG-accessible, CSS-styleable charts, or 10⁵+ point/60fps charts. — `decision-guide.md` "Do NOT use it when" #1–#3, consistent.
