# Mental model — shadcn/ui

## Contents
- [What it is](#what-it-is)
- [The four moving parts](#the-four-moving-parts)
- [Style = base × style × preset](#style--base--style--preset)
- [What `init` and `add` actually do](#what-init-and-add-actually-do)
- [Ownership model](#ownership-model)

## What it is
shadcn/ui is **a code-distribution system plus a curated set of components**, not an npm component library. [Documented: "This is not a component library. It is how you build your component library."] You run a CLI (`shadcn`, npm package, v4.22.1 studied) that copies component *source files* (`components/ui/*.tsx`) into your repo, rewrites their imports to your aliases, installs npm deps, and merges CSS variables into your global CSS. After that the code is yours; there is no `import ... from "shadcn-ui"`. [Verified-in-lab: `button.tsx` is a plain file importing `radix-ui`, `class-variance-authority`, `cn`.]

## The four moving parts
1. **Registry** — JSON items (`registry-item.json`) served over HTTP (`https://ui.shadcn.com/r/styles/{style}/{name}.json`), GitHub (`owner/repo/item#ref`), or local `./file.json`. An item = files (with inlined `content`) + `dependencies` (npm) + `registryDependencies` (other items) + `cssVars`/`css`/`envVars`/`font`/`docs`. [Verified-in-code schema.ts]
2. **CLI** — `init`/`add`/`apply`/`view`/`search`/`docs`/`info`/`build`/`migrate`/`mcp`/`preset`/`registry`. Resolves items recursively (topological, last-write-wins per target path, deep-merge of css/vars), runs transformers, writes files. [Documented + Verified]
3. **components.json** — per-project config: `style` (`<base>-<style>`), `tailwind.css`, `baseColor`, `cssVariables`, `aliases`, `iconLibrary`, `rsc`, `tsx`, `rtl`, `registries`. Required only for CLI use. [Documented; strict zod schema Verified-in-code]
4. **Theme** — Tailwind v4 CSS variables (oklch) in your global CSS: `:root`/`.dark` tokens + `@theme inline` mapping to `--color-*`. Components only use semantic utilities (`bg-primary`, `text-muted-foreground`). [Documented + Verified-in-lab]

## Style = base × style × preset
- **Base** (primitive library): `base` (Base UI, **default since July 2026**), `radix` (unified `radix-ui` package), `aria` (React Aria Components). Same component names, *different props/APIs* (see `bases.md`).
- **Style** (visual treatment): `nova vega maia lyra mira luma sera rhea`. components.json `style` = `radix-nova`, `base-vega`, … Authored component source uses placeholder classes `cn-button-variant-default`; the **registry build** replaces them with that style's Tailwind classes (from `registry/styles/style-<name>.css`), so installed files contain only real Tailwind classes. [Verified-in-code + lab]
- **Preset** = style + baseColor + theme + chartColor + iconLibrary + font + fontHeading + radius + menuAccent + menuColor (+rtl). Encoded as a short base62 code (`b2fA` = default nova; `b0`). Base is *not* part of the code. `init --preset <code|name>`, `apply <code>`. [Verified-in-code]
- Legacy `new-york(-v4)` / `default` styles still exist in the registry but new projects don't use them. [Verified]

## What `init` and `add` actually do
`init -t <next|vite|start|react-router|astro> -b <base> -p <preset> -n <name>`: (new project) git-sparse-clones `templates/<tpl>` from GitHub and runs your package manager install → fetches a `registry:base` item from `ui.shadcn.com/init?...` → writes components.json → installs `shadcn`, `cn`, `class-variance-authority`, `tw-animate-css`, base primitives, icon lib → adds fonts → writes `lib/utils.ts` (`export { cn } from "cn"`) → merges tokens into global CSS (adds `@import "shadcn/tailwind.css"`).
`add <item…>`: resolve item + registryDependencies → show/confirm → write files (skip identical; prompt on differing unless `-o`) → install npm deps → merge CSS vars/envVars → print `docs` note.

## Ownership model
- You own every copied file; "update" = `add <c> --diff` / `--dry-run` and merge by hand (or `--overwrite`). There is no version pin per component. [Documented + Lab]
- What *does* update via npm: the primitives (`radix-ui`, `@base-ui/react`, `react-aria-components`), `cn`, `shadcn/tailwind.css` (custom variants like `data-open:`, accordion keyframes) — until you `eject`. [Documented]
- Registry items are **third-party code with write access to your project tree** (any in-project target, including config files and CI workflows). Review with `view`, `--dry-run`, `--diff`, `--view`. [Verified-in-code is-safe-target.ts; Documented github.mdx]

## Sources
- research/docs-analysis.md, research/source-registry-and-styles.md, research/source-cli-and-transformers.md, research/examples-run.md
- apps/v4/content/docs/(root)/index.mdx; packages/registry/src/preset/preset.ts; packages/shadcn/src/commands/init.ts
