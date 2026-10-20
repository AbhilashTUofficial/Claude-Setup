# Docs analysis — react-chartjs-2.js.org

The live site is a Docusaurus build of `website/docs/**` in the same repo; docs were read from the repo at `v5.3.1` and the live landing page was spot-checked (2026-10-20: nav = FAQ, Components, Examples; sidebar = Quickstart, Migration to v5, Migration to v4, Working with datasets, Working with events, Using with Chart.js v3, Using with Chart.js v2). The component pages' prop tables are generated (`<PropsTable>`), examples are StackBlitz iframes of `sandboxes/**` (also copied and run in the lab).

## Documented claims (and how they were checked)

| Claim | Source | Status |
|---|---|---|
| Supports Chart.js v4 (v3 via separate guide) | docs/index.mdx | Documented; peer dep `^4.1.1` confirms (Verified-in-code) |
| Typed components "register their controllers by default" | docs/migration-to-v4.md | **Verified-in-code + test** — controllers only |
| Must register scales/elements/plugins (tree-shaking) or `import 'chart.js/auto'` | docs/migration-to-v4.md, faq/registered-*.md, faq/fill-property.md | **Verified-in-code** (registration.test.tsx) |
| Use `label` (default) or `datasetIdKey` to identify datasets | docs/working-with-datasets.md | **Verified-in-code** (update-semantics.test.tsx). The page's *symptom* text ("first dataset copied over to other datasets") is **not reproducible** in 5.3.1 (see unresolved.md) |
| Event helpers need a ref + `onClick` | docs/working-with-events.md | Verified-in-code (test: forwarding args) |
| `data` can no longer be a function (v3 gradient pattern); use ref + state | docs/migration-to-v4.md | Source confirms: `data` is a plain object |
| `maintainAspectRatio:false` needed for custom width/height | docs/faq/maintain-aspect-ratio.md | Documented; consistent with Chart.js behavior; demo d06 |
| Access instance/ctx/canvas via `ref` (`chart.ctx`, `chart.canvas`) | docs/faq/chartjs-instance.md, canvas-context.md | Verified (chart-canvas sandbox runs in browser) |
| ESM-only in v5.0, CJS restored in v5.1 | docs/migration-to-v5.md, faq/esm-only.md, CHANGELOG | Documented; npm 5.3.1 ships `dist/index.cjs` (Verified-in-code) |
| Library is called "2" because it started as a Chart.js v2 wrapper (2016) | faq/why-two.md | Documented; irrelevant to behaviour |
| TypeScript: import `ChartData`/`ChartOptions` from `chart.js` | docs/faq/typescript.md | tsc passes with `ChartData<'line'>`-style types in lab |

## Gaps in the docs (Derived)
- Nothing documents: shallow options merge (stale keys), construction-time `plugins`, `setTimeout` rebuild/ref-null window, reference-identity update rule, or the missing `'use client'`. All found by reading source and confirmed by tests/browser.
- `docs/chartjs-v2.mdx` / `chartjs-v3.mdx`: legacy-version guides, out of scope.

## Sources
- `source/website/docs/**` @ v5.3.1; https://react-chartjs-2.js.org/ (fetched 2026-10-20)
