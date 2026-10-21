# Decision guide — when to use shadcn/ui and when not

## Contents
- [Use it when](#use-it-when)
- [Do NOT use it when](#do-not-use-it-when)
- [Choosing a base](#choosing-a-base)
- [Choosing registry source / template](#choosing-registry-source--template)
- [Choosing alternatives](#choosing-alternatives)

## Use it when
- You build a **React 19 + Tailwind CSS v4** app (Next.js, Vite, TanStack Start, React Router, Astro-with-React, Laravel React starter) and want accessible primitives wrapped in your own styled, editable source. [Documented installation docs; Verified in lab on Next 16]
- You want a design system you can reshape (variants via `cva`, tokens via CSS vars) without fighting a library's override layer, and you accept owning/upgrading the copied code. [Documented]
- You want forms/dashboards/sidebars/login/signup scaffolds fast (`add dashboard-01`, `sidebar-07`, `login-03`). [Verified in lab: dashboard-01 adds 34 files]
- You want to distribute your own components/config internally: author `registry.json`, `shadcn build` or point at a GitHub repo. [Documented + Verified in lab]
- You work with AI agents: `shadcn info --json`, `shadcn docs`, MCP server, and the `shadcn` skill are first-class. [Documented]

## Do NOT use it when
1. **You can't/won't run Tailwind CSS v4 + React** — e.g. Vue/Svelte/Angular apps, plain HTML, or a project locked to Tailwind v3 with no upgrade plan. The default registry targets v4 (`@theme inline`, `size-*`, `data-open:` custom variants); v3 support is legacy (`tailwind.config`, `--no-css-variables`) and the flagship `cn` merge engine is v4-only. [Documented tailwind-v4/migrate cn; Derived]
2. **You need a versioned, centrally-upgraded component package** (many apps consuming one npm dependency with semver upgrades and no local forks). shadcn copies source; there are no per-component versions and no automatic upstream merge. Use a normal package (MUI, Mantine, Chakra, Ant) or publish your own package (use shadcn only as a starting point; in a monorepo, put the output in `packages/ui`). [Documented index.mdx FAQ; Verified `add --diff` workflow]
3. **You must install in an offline/air-gapped or restricted-network build** — `init`/`apply`/`add` fetch from `ui.shadcn.com` (10 s timeout), `init -t` git-clones GitHub; init/apply also send a `track=1` request. Mirror via `REGISTRY_URL`/own registry or vendor the generated files. [Verified-in-code, lab timeout]
4. **You want zero maintenance of the UI layer** (generated code that you never read). Blocks like `dashboard-01` add ~30 files with hard dependencies (recharts, dnd-kit, TanStack table) and require manual wiring (e.g. `TooltipProvider` — build failed until added). [Verified in lab]
5. **Strict supply-chain posture with untrusted registries** — any registry item (esp. GitHub/`@ns`) can write arbitrary in-project paths and add npm deps/env vars; unknown `@ns` names are auto-resolved from the public directory index. Pin refs/SHAs, use `view`/`--dry-run`, or restrict to `@shadcn`. [Verified-in-code]
6. **You need a non-React headless/SSR-only/email/PDF output** — components are client-interactive React with Radix/Base UI/React Aria primitives.

## Choosing a base
| Situation | Pick |
|---|---|
| New project, no strong preference | `base` (Base UI) — project default since 2026-07; new components (e.g. Toast) land here first |
| Existing project/team code/knowledge on Radix; need `asChild`; want fewest surprises | `radix` (fully supported, "not deprecated") |
| Need React Aria semantics (RAC `Select`, `Calendar`, etc.) | `aria` (`menubar`, `navigation-menu` not available) |
Switching base later is a re-install of every component (`init --force --base <new>`; `init` asks to confirm a base switch — `apply` keeps the current base per the official skill) plus consumer-code changes (see `bases.md`; the repo ships a `migrate-radix-to-base` skill). [Documented + Verified-in-code]

## Choosing registry source / template
- Official components/blocks → default `@shadcn` (no config).
- Third-party registries → configure `registries` in components.json explicitly (`@ns: "https://…/{name}.json"`), or `owner/repo/item#sha` for GitHub; never rely on auto-discovery in CI.
- New app starter → `init -t next|vite|start|react-router|astro [--monorepo]`; shadcn.io/template is a **community directory (unaffiliated as far as the page states)** — vet licenses per repo.

## Choosing alternatives
- Pure Tailwind snippets with no CLI → copy manually (`installation/manual`), skip `components.json`.
- Charts beyond the `chart` wrapper over Recharts 3 → use the charting library directly.
- Data grid with virtualization/heavy features → `data-table` is a *pattern doc* on TanStack Table, not a full grid component.

## Sources
- research/docs-analysis.md; research/source-cli-and-transformers.md; research/examples-run.md; research/official-skill-and-community.md
