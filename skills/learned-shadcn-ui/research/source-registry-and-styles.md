# Source analysis — registry, bases, styles, presets (shadcn-ui/ui @ ba1503c)

Evidence tags: [D]=Documented, [V]=Verified-in-code, [Dv]=Derived, [J]=Judgment.

## Repo layout [V]
- Monorepo (pnpm + turbo). `apps/v4` = ui.shadcn.com site (Next.js, fumadocs MDX) AND the registry source. `packages/shadcn` = CLI (npm `shadcn`, 4.22.1). `packages/registry` = internal engine imported by CLI as `@shadcn/registry/internal/*` (resolver, transformers, updaters, codemod, schema). `packages/shadcn/src/registry/index.ts` is `export * from "@shadcn/registry"`. `packages/helpers` (ai-sdk / tanstack-ai helpers), `packages/react` (message-scroller, questionnaire, use-render), `packages/tests` (fixtures: next-app, next-app-imports, next-app-init, next-app-tailwind-v3, no-framework, registry). `templates/` = 10 project starters (next/vite/start/react-router/astro × app/monorepo). `skills/` = `shadcn` and `migrate-radix-to-base` agent skills.
- Source: packages/shadcn/package.json (exports `.`, `./registry`, `./schema`, `./mcp`, `./utils`, `./icons`, `./preset`, `./tailwind.css`; engines node >=20.18.1; `.nvmrc` v20.5.1 — repo's own nvmrc is older than the CLI engines field [V], minor inconsistency).

## Style model [D+V] (apps/v4/registry/README.md)
- Two *authored* bases: `registry/bases/base/` (Base UI, dep `@base-ui/react`), `registry/bases/radix/` (dep `radix-ui`), plus `bases/aria/` (React Aria, dep `react-aria-components`) — `bases.ts` lists base, aria, radix. Each has `ui/ lib/ hooks/ blocks/ examples/ internal/ registry.ts`.
- Eight *style token files* `registry/styles/style-{nova,vega,maia,lyra,mira,luma,sera,rhea}.css`. Each defines Tailwind `@apply` for semantic classes named `cn-*` (e.g. `.cn-accordion-trigger`, `.cn-alert-variant-destructive`). nova file is 1825 lines. [V]
- Authored component source uses `cn-*` placeholder classes; the build pipeline (`packages/shadcn/src/styles/create-style-map.ts` — parses CSS with postcss, maps each `cn-*` subject class → concatenated Tailwind classes; `transform-style-map.ts`) rewrites them into real Tailwind classes. Result: a generated *combination* `<base>-<style>` (e.g. `radix-nova`, `base-vega`). Combos are NOT committed; build output is committed to `apps/v4/styles/<combo>/ui/*` and `apps/v4/public/r/styles/<combo>/*.json`. [V from README + create-style-map.ts]
- `new-york-v4` is the *legacy* hand-authored registry (500 files) still shipped; `FALLBACK_STYLE = "new-york-v4"` (constants.ts). `add` creates a throwaway config with `style:"new-york"` when no components.json exists. [V]
- RTL: `ui-rtl/*` generated for `base-nova` and `radix-nova` only. [D README]
- Build: `pnpm registry:build` in apps/v4 (full); flags `--examples --indexes --style <x|all> --registry <x|all>`; fast flags skip prettier. [D]

## Presets [V] (packages/shadcn/src/preset/defaults.ts, presets.ts)
Defaults (title – icon lib / font): Nova (Lucide/Geist), Vega (Lucide/Inter), Maia (Hugeicons/Figtree), Lyra (Phosphor/JetBrains Mono), Mira (Hugeicons/Inter), Luma (Lucide/Inter), Sera (Lucide/Noto Sans + Playfair Display heading; baseColor taupe), Rhea (Lucide/Inter). All others: baseColor neutral, menuAccent subtle, menuColor default, radius default.
- A "preset" = `{style, baseColor, theme, chartColor, iconLibrary, font, fontHeading, menuAccent, menuColor, radius, rtl}`. A short **preset code** (e.g. `a2r6bw`) encodes it; `shadcn preset decode <code> [--json]`, `preset resolve|info`, `preset url`, `preset open`. [D cli.mdx]
- `init` does NOT build the preset locally: it builds a URL `https://ui.shadcn.com/init?base=…&style=…&baseColor=…&theme=…&iconLibrary=…&font=…&rtl=…&menuAccent=…&menuColor=…&radius=…[&preset=code][&template][&only][&pointer]&track=1` and fetches it as a `registry:base` registry item whose `config` becomes components.json fields. The `track=1` query param "signals the server to record this init run" (presets.ts L142; init.ts L429; apply.ts L549) — i.e. each `init`/`apply` hits ui.shadcn.com and the server records it; the param is stripped for subsequent fetches. [V] **Privacy/offline implication**: init and apply require network to ui.shadcn.com (or `REGISTRY_URL` env override). `SHADCN_URL = REGISTRY_URL.replace(/\/r\/?$/,"")`, `REGISTRY_URL = process.env.REGISTRY_URL ?? "https://ui.shadcn.com/r"`. [V]
- Interactive prompts: `promptForBase` offers "Base UI (Recommended)", "React Aria", "Radix UI" (presets.ts L148-161) — Base UI is the *recommended default* now, not Radix. [V]
- `-p <name>` works with names (`nova`) — confirmed by lab run; without `-p`, `init -t next -b radix -y` still prompts for preset (hung non-interactively in lab) → **always pass `-p` in scripts/CI**. [V lab, see examples-run.md]

## Built-in registry & addressing [V] (registry/constants.ts)
- `BUILTIN_REGISTRIES = { "@shadcn": "${REGISTRY_URL}/styles/{style}/{name}.json" }` — cannot be overridden.
- Namespaced registries in components.json `registries`: key MUST start with `@`, URL MUST contain `{name}`; value string or `{url, params, headers}`; `${ENV}` expanded (schema.ts L6-31; docs components-json.mdx). `loadEnvFiles(cwd)` is called in `add` so `.env*` of the *user's project* feeds `${VAR}` in registry auth. [V]
- Deprecated: `toast` (only for base-UI projects; use sonner) and `toaster`; `sonner` hidden from component multi-select in `base` base. [V constants.ts]

## components.json schema [V] (registry/schema.ts rawConfigSchema, `.strict()`)
`$schema, style (string), rsc (default false), tsx (default true), tailwind{config?, css, baseColor, cssVariables=true, prefix?}, iconLibrary?, rtl?, menuColor? (default|inverted|default-translucent|inverted-translucent), menuAccent? (subtle|bold), aliases{components, utils, ui?, lib?, hooks?}, registries?`. Strict → unknown keys fail validation.
- Style string format is `<base>-<style>` (lab: `radix-nova`; docs theming example: `base-nova`). `parsePresetStyle` splits it. Docs components-json.mdx still says `"style": "new-york"` and "default deprecated" — stale vs reality (lab produced `radix-nova`). [V vs D → docs stale]

## Registry item schema [V]
Types: lib, block, component, ui, hook, page, file, theme, style, item, base, font (+ internal example/internal). `registry:file` and `registry:page` REQUIRE `target`. Fields: name, title, author(min 2), description, dependencies, devDependencies, registryDependencies, files[{path, content?, type, target?}], tailwind{config{content,theme,plugins}} (v3 legacy), cssVars{theme,light,dark}, css (nested objects/arrays → arbitrary CSS incl. @layer/@utility), envVars, meta, docs, categories, `extends`; `registry:base` has `config` (partial components.json), `registry:font` has `font{family, provider:"google", import, variable, weight, subsets, selector, dependency}`. Registry index: `{name, homepage, items[] | include[], pagination?}`. Comment in source: schema must be mirrored by hand in `apps/v4/public/schema/registry-item.json`. [V]

## Open / unverified
- Exact preset-code encoding (bit packing) not yet read: see `packages/registry/src/preset/preset.ts` (7.6KB) — see unresolved.md.
