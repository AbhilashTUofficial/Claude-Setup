# Docs analysis — ui.shadcn.com/docs (read from repo `apps/v4/content/docs`, @ ba1503c)

Tags: [D]=Documented, [V]=Verified-in-code/lab, [Dv]=Derived, [J]=Judgment. Docs were read as MDX in the cloned repo (primary source; the live site renders these files), NOT crawled from the website. `public/llms.txt` was read too.

## Docs inventory [V]
Counts: root 20 mdx, changelog 59, components per base: aria 66 / base 67 / radix 68 (+ai-elements 22 per base, helpers 3, react 3, utils 3, registry 16, installation 12, forms 6, dark-mode 7, rtl 5). `meta.json` order: components, ai-elements, (root), changelog, react, helpers, forms, installation, dark-mode, rtl, utils, registry.
**llms.txt is stale vs docs [V]**: it lists "Toast (Sonner)", Remix/Gatsby/Gatsby installs, "Chart (Recharts)", but omits newer pages (Trace, Code Block, Message*, Questionnaire, Typeset, shimmer/scroll-fade, GitHub registries, health, dynamic-search, package-imports, new/apply/preset). Use repo MDX, not llms.txt, as the authoritative page list.

## Positioning [D index.mdx]
"This is not a component library. It is how you build your component library." Principles: Open Code, Composition, Distribution (flat-file schema + CLI), Beautiful Defaults, AI-Ready. Updates model: core deps update via npm (`@base-ui/react`, `input-otp`…), top layer (your copied code) is yours; there is no "pull upstream updates" mechanism other than re-`add --diff`.

## CLI reference [D cli.mdx; V via `shadcn --help` 4.22.1]
Commands: `init|create`, `apply [preset]`, `add`, `diff` (DEPRECATED → `add --diff`), `docs <components…>`, `view`, `search|list`, `migrate [migration] [path]`, `eject`, `info`, `build [registry]`, `mcp`, `preset (decode|resolve|info|url|open)`, `registry (add|build|mcp|validate…)`.
- init flags: `-t next|start|vite|react-router|laravel|astro`, `-b base|radix|aria`, `--monorepo/--no-monorepo`, `-p [name|code]`, `-y` (default true), `-d`, `-f`, `-c`, `-n`, `-s`, `--css-variables/--no-css-variables`, `--rtl`, `--pointer`, `--reinstall/--no-reinstall`. (cli.mdx says `-d` = next + nova; `--help`/code say "base-nova"; code sets `options.base = options.base || "base"` when `-d`.) [V init.ts L194-198]
- add flags: `-y -o -c -a --all -p/--path -s --dry-run --diff [path] --view [path]`.
- apply: applies a preset to an existing project; `--only theme|font`.
- migrate list: `cn`, `icons` (lucide, tabler, hugeicons, phosphor, remixicon, radix legacy), `base-color` (neutral, zinc, stone, mauve, olive, mist, taupe), `radix` (→ unified `radix-ui` pkg), `rtl`. `migrate cn` needs NO components.json; Tailwind v4 only (cn engine ~ tailwind-merge v3); v3 projects keep tailwind-merge v2.
- eject: inlines `shadcn/tailwind.css` into global CSS and removes the `shadcn` dependency — **irreversible**.
- build: reads ./registry.json → `public/r`; `-o` to change.

## components.json [D components-json.mdx + V schema]
Fields and constraints: `style` (cannot change after init), `tailwind.baseColor` (cannot change after init; use `migrate base-color`), `tailwind.cssVariables` (cannot change after init → delete & reinstall components), `tailwind.config` blank for Tailwind v4, `tailwind.prefix`, `rsc` (CLI adds `"use client"` when true), `tsx`, `aliases.{components,ui,lib,hooks,utils}`, `registries`. Aliases can be backed by tsconfig `paths` OR `package.json#imports` (needs `moduleResolution:"bundler"` + `resolvePackageJsonImports:true`); target `"#components/*": "./src/components/*.tsx"` strips extensions in generated imports, `".../*"` keeps `.tsx`. Docs still say `"style": "new-york"` / "default deprecated" — stale; real styles are `<base>-<style>` (see source note). `schema.json` is at https://ui.shadcn.com/schema.json.

## Theming [D theming.mdx]
CSS variables are the recommended path. Pair convention: `--x` surface + `--x-foreground`. Token list: background, card, popover, primary, secondary, muted, accent, destructive (+no foreground), border, input, ring, chart-1..5, sidebar(-foreground/-primary/-primary-foreground/-accent/-accent-foreground/-border/-ring), radius (base; derives `--radius-sm…4xl` = 0.6/0.8/1/1.4/1.8/2.2/2.6 × radius). Values are **oklch**. Dark mode = same tokens overridden under `.dark`; `@custom-variant dark (&:is(.dark *))`. Add tokens: define in `:root` and `.dark`, then expose via `@theme inline { --color-warning: var(--warning) }`. `--no-css-variables` generates inline utilities (`bg-zinc-950 dark:bg-white`) — install-time choice. Base colors: neutral, stone, zinc, mauve, olive, mist, taupe (preset schema also has `gray`). Default CSS scaffold is at the bottom of theming.mdx (matches lab output).

## AI features [D skills.mdx, mcp.mdx, new.mdx, changelog cli-v4]
- Skill: `npx skills add shadcn/ui` (skills.sh). Skill runs `shadcn info --json` on each interaction; enforces composition rules (FieldGroup for forms, ToggleGroup for option sets, semantic colors, base-specific APIs). The repo ships it in `skills/shadcn` (analysed separately).
- MCP: `npx shadcn@latest mcp init --client claude|cursor|vscode|codex|opencode` writes `.mcp.json` (claude) / `.cursor/mcp.json` / `.vscode/mcp.json` (`servers` key) ; codex needs manual `~/.codex/config.toml` `[mcp_servers.shadcn] command="npx" args=["shadcn@latest","mcp"]`. Server tools expose browse/search/install across registries configured in components.json; auth via `${ENV}` from `.env.local`. 
- `shadcn docs <component>` pulls docs + composition tree + examples into context.

## Registry system [D registry/*.mdx; V schema/CLI]
- Items: schema in `registry-item-json.mdx` (types: base, block, component, font, lib, hook, ui, page, file, style, theme, item). `registryDependencies` accepts: bare name (= built-in shadcn item, never same-repo), `@ns/name`, `owner/repo/item[#ref]` (GitHub), full URL, `./local.json`. Refs are NOT inherited across dependencies.
- `target`: `~/` = project root; placeholders at start only: `@components/ @ui/ @lib/ @hooks/` (not `@utils/`); unknown `@foo/` treated as literal path. `target` REQUIRED for registry:page and registry:file.
- `cssVars{theme,light,dark}` merge into project CSS; `css` object adds arbitrary at-rules (`@plugin`, `@layer`, `@utility`, `@keyframes`); `tailwind.config` is DEPRECATED (v3); `envVars` → `.env.local` (or `.env`), never overwrites existing vars, "dev/example vars only"; `font` (provider google only); `docs` message shown after install; `meta`, `categories`.
- Namespaces: `registries` in components.json; `@name` keys; url must contain `{name}`, optional `{style}`; `params`/`headers`; `${VAR}` expansion; "no automatic registry discovery"; resources validated against schema, "treated as data, not code", files only written to configured paths (doc claim; see `unresolved.md`: **target `~/` and `registry:file` can write outside component dirs**, doc claim is about path restrictions—verified `is-safe-target.ts` exists, not yet read).
- Resolution: clear context → fetch main → recursively resolve deps from owning registries → topological sort → dedupe by target path (LAST WINS) → deep-merge tailwind/cssVars/css/envVars. Overriding vendor items = add them in `registryDependencies` then override.
- GitHub registries (`github.mdx`, changelog 2026-06/08): any github.com repo with root `registry.json`; `npx shadcn add owner/repo/item[#ref]`, `registry validate owner/repo[#ref]`, `list/search/view` work; `include: [...]` for nested registry.json files (paths relative to declaring file); private repos via `gh auth` or `GH_TOKEN`/`GITHUB_TOKEN` (fine-grained PAT, Contents read-only; token sent only to api.github.com); anonymous attempt first; 5 MiB per-file limit; no GitHub Enterprise; ref resolved with `git ls-remote` (full 40-char SHA needs no git); avoid symlinks. Registry items can distribute ANY files (AGENTS.md, CI workflows…) → treat as third-party code (`view`, `--dry-run`, `--diff`, `--view`).
- Registry docs also cover `dynamic-search` (server-side filtered/paginated catalog via `pagination{total,offset,limit,hasMore}`), `health` (directory health score/ranking, monitored hourly), `api-reference` (`shadcn/registry`, `shadcn/schema`, `shadcn/preset` programmatic APIs), `registry-index` (submit to the open directory: `apps/v4/registry/directory.json`).

## Versions / ecosystem notes [D]
- Tailwind v4 + React 19 are the default; `react-19.mdx` ("Next.js 15 + React 19") says itself it "might be outdated" — the npm peer-dep `--force/--legacy-peer-deps` guidance is legacy.
- tailwind-v4.mdx: upgrade guide (CSS vars, `size-*`, remove forwardRef, `tw-animate-css` replaces `tailwindcss-animate`, chart colors, dark mode colors) — historical (Mar 2025).
- Monorepo (`init --monorepo`): creates `apps/web` + `packages/ui` + turbo; run `add` inside the app dir; UI primitives land in `packages/ui/src/components`, blocks' app-specific files in `apps/web/components`; import `@workspace/ui/components/button`. Every workspace needs its own components.json with consistent aliases.
- Dark mode guides per framework: next (next-themes), vite, astro, remix, tanstack-start; RTL: `init --rtl` / `migrate rtl`, `Direction` provider (`DirectionProvider`), logical props (`ms-4`, `text-start`), RTL-generated styles only for nova (base & radix).
- Forms docs: React Hook Form, TanStack Form, Formisch, Next.js server actions — all built on the `Field` family (`Field, FieldGroup, FieldSet, FieldLegend, FieldLabel, FieldDescription, FieldError, FieldContent, FieldTitle, FieldSeparator`); validation via `data-invalid` on Field + `aria-invalid` on control. The old `<Form>` (react-hook-form wrapper) component is NOT in the list any more — Field replaced it. [D llms.txt + field.mdx; Dv]

## Changelog highlights (newest first) [D]
- 2026-10-14 Trace + Code Block components, AI Elements (agent UI patterns).
- 2026-09-03 **`cn` package**: components import `cn` from `"cn"`; `lib/utils.ts` = `export { cn } from "cn"`; `migrate cn`.
- 2026-08 questionnaire, private GitHub registries, human-in-the-loop helpers.
- 2026-07 typeset; toast (Base-UI only); **React Aria base (`--base aria`)**; helpers; dynamic search; **Base UI becomes default** (Radix still supported, "every update ships for both unless Base-only").
- 2026-06 GitHub registries; chat components (Message Scroller, Message, Bubble…).
- 2026-05 eject, Rhea style, registry `include`, package-imports target aliases.
- 2026-04 `apply`, Sera, preset commands, pointer cursor, partial preset apply, component composition docs.
- 2026-03 Luma; **CLI v4** (skills, `--preset`, `--dry-run/--diff/--view`, templates, monorepo).
- 2026-02 unified `radix-ui` package (`migrate radix`); blocks. 2026-01 RTL.
