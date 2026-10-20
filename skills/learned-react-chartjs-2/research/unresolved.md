# Unresolved / coverage notes — react-chartjs-2 5.3.1

## Inspected
All library source (4 files), `CHANGELOG.md`, `test/chart.test.tsx` + `test/chart.test-d.tsx` (type tests listed, not read in detail), `website/docs/**` (index, migration v4/v5, working-with-datasets/events, faq/*, components/chart, gradient example), 17 sandboxes, npm 5.3.1 dist (`index.js`, `package.json`), live landing page. Behaviour probes + browser demos: see examples-run.md.

## Intentionally skipped
- `.storybook/`, `stories/`, `website/src` (site chrome), lockfiles, `docs/chartjs-v2.mdx` & `chartjs-v3.mdx` (legacy Chart.js versions), the Chart.js core internals (separate technology — only the surface react-chartjs-2 touches was used).
- Per-component pages (`components/line.mdx` etc.): generated prop tables that restate `ChartProps` / Chart.js dataset options.

## Could not access / not exercised (coverage_status: partial)
0. **npmjs.com package page** — WebFetch returned HTTP 403. Version/peer/license/dist-tags/modified date came from `npm view` and the installed tarball instead; README, download counts and the page's "dependents" data were not read.
1. **React 16/17/18 runtime** — only React 19.3 was run; peer range claims 16.8–19 (Documented, Unconfirmed in practice).
2. **Next.js App Router / RSC build** — SSR checked only with `renderToString`; the missing `'use client'` in dist is Verified-in-code but the real Next error text and `next/dynamic` need were not run.
3. **Bundle size / tree-shaking numbers** — `.size-limit.json` exists; not measured. Claims limited to "sideEffects false + PURE annotations".
4. **Performance at scale** (10k+ points, many charts per page, decimation) — not benchmarked; Chart.js docs not studied in this pass.
5. **Touch / mobile interactions, canvas HiDPI, print** — not tested.
6. **chartjs-plugin-zoom** and other plugins beyond annotation — not run.
7. **TypeScript type tests** (`test/chart.test-d.tsx`, tsd) not executed; only app-level `tsc --noEmit` on lab code. Custom row types worked via `<Line<Row[]>>` + `parsing`.

## Weak / single-source / stale-doc items
- `working-with-datasets.md` says re-renders cause "the first dataset to be copied over to other datasets" when no key exists. In 5.3.1 with blank/duplicate labels values stayed correct (probe: duplicate-label test). Likely describes an older release → **docs possibly stale**; the *remedy* (label or datasetIdKey) is still right for animation continuity.
- `ChartProps` JSDoc `@default {}` for `options` — actual behaviour: `options` undefined is passed through (`options && {...options}`), Chart.js applies its defaults. Cosmetic.
- Ref type says `Chart | undefined` while runtime uses `null` (types.ts `@todo`). Cosmetic but affects `useRef<ChartJS>(null)` typing; works in lab (tsc clean).
- HEAD (`7c7be48`, 2026-05-26) vs tag v5.3.1: **Verified** — 5 commits after the tag (docs/chore only); `git diff --stat v5.3.1 origin/HEAD -- src package.json` is empty.
- Maintenance health (issue backlog, release cadence after 5.3.1) not assessed; last npm modify date 2025-10-27.

