---
name: learned-shadcn-ui
description: "Compiled knowledge of shadcn/ui and the `shadcn` CLI 4.22.1 (ui.shadcn.com, github.com/shadcn-ui/ui): copy-the-source React components on Tailwind v4 with Base UI / Radix / React Aria bases, presets, registries, blocks, theming, MCP. Use when evaluating, scaffolding, theming, debugging or extending shadcn/ui, writing components.json or a custom registry, or choosing between Base UI and Radix bases."
metadata:
  knowledge_schema_version: 1
  learned_skill: true
---

# shadcn/ui

shadcn/ui is a **code-distribution system, not an npm component library**: the `shadcn` CLI resolves items from a registry (JSON over HTTP, GitHub `owner/repo/item#ref`, or local file), rewrites imports to your aliases, installs npm deps, merges CSS variables, and writes the component *source* into your repo (`components/ui/*.tsx`). A project's `components.json` records `style` = `<base>-<style>` (`base|radix|aria` × `nova|vega|maia|lyra|mira|luma|sera|rhea`), Tailwind v4 CSS path, aliases, icon library. Styles are baked into installed files as plain Tailwind classes; theming is oklch CSS variables (`--primary`, `--primary-foreground`, … + `@theme inline`) in your global CSS; a short **preset code** (`b2fA`) bundles style/colors/font/icons/radius. Base UI is the default base since July 2026; Radix is fully supported. After install you own and edit the files; updates are `add <c> --diff`/`--dry-run`.

Studied at CLI `shadcn@4.22.1`, repo commit `ba1503c` (2026-10-19), hands-on on Windows with Next 16.4 + Radix and Vite 8 + Base UI, as of 2026-10-22. See `metadata.yaml` for provenance; `research/unresolved.md` lists what is **not** covered (per-component API pages, aria base, monorepo/RTL/GitHub-registry runs, etc.).

## When to use this / when not to

Use for React 19 + Tailwind v4 apps that want accessible, editable, themeable components, blocks (dashboard/sidebar/login) and your own distributable registry. Not for non-React stacks, Tailwind-v3-locked projects, centrally semver-versioned component packages, or offline/air-gapped installs — full scenarios in `references/decision-guide.md`.

## Reference files

Read only what the current task needs — not meant to be loaded together.

- `references/mental-model.md` — what shadcn is, registry/CLI/components.json/theme, base × style × preset, init/add internals, ownership
- `references/decision-guide.md` — when to use / NOT to use, base choice, registry choice, alternatives
- `references/api.md` — CLI commands & flags, components.json schema, registry-item schema, addresses, env vars
- `references/bases.md` — Base UI vs Radix vs React Aria API differences (asChild/render, Select, ToggleGroup, Slider, Accordion, Toast)
- `references/theming.md` — tokens, adding colors, presets/apply, dark mode, fonts, icons, RTL
- `references/patterns.md` — bootstrap recipes, composition rules, Field forms, updating owned components, registry authoring, agent workflow, monorepo
- `references/pitfalls.md` — verified gotchas (non-interactive init, Windows BOM/paths/quoting, TooltipProvider, stale docs, auto-discovered registries)
- `examples/` — runnable lab artifacts: Next+Radix page, Vite+Base UI app, custom registry + item, verified PowerShell command list

Do not read `research/` for ordinary questions — it is the cited raw evidence (WARM tier): `docs-analysis.md`, `source-registry-and-styles.md`, `source-cli-and-transformers.md`, `official-skill-and-community.md`, `examples-run.md`, `unresolved.md`.

## If this feels stale

Check `metadata.yaml`'s `freshness`. shadcn/ui ships weekly (changelog entries monthly; CLI at 4.22.x) — if it says `aging` or `stale`, say so before answering and suggest `/knowledge-forge refresh shadcn-ui`.
