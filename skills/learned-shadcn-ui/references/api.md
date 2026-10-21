# API reference — CLI, components.json, registry schema (shadcn 4.22.1)

## Contents
- [CLI commands](#cli-commands)
- [init / create](#init--create)
- [add](#add)
- [Read-only inspection commands](#read-only-inspection-commands)
- [Preset commands](#preset-commands)
- [migrate / eject](#migrate--eject)
- [components.json](#componentsjson)
- [Registry item schema](#registry-item-schema)
- [Registry addresses](#registry-addresses)
- [Environment variables](#environment-variables)

Always quote `@ns` arguments in PowerShell (`'@shadcn/button'`): unquoted `@name` is a splat. [Verified-in-lab]

## CLI commands
`init|create`, `apply [preset]`, `add [items…]`, `diff` (deprecated → `add --diff`), `docs <components…>`, `view <items…>`, `search|list [registries…]`, `migrate [name] [path]`, `eject`, `info`, `build [registry]`, `mcp`, `preset`, `registry`. Run `npx shadcn@latest <cmd> --help`. [Verified `--help`]

## init / create
```
shadcn init [components…] -t <next|start|vite|react-router|laravel|astro> -b <base|radix|aria>
  -p [name|code|url]  -d  -f  -y(default true)  -c <cwd>  -n <name>  -s
  --monorepo | --no-monorepo   --css-variables | --no-css-variables
  --rtl | --no-rtl   --pointer | --no-pointer   --reinstall | --no-reinstall
```
- Named presets accepted: `nova vega maia lyra mira luma sera rhea`. Preset codes match `^[ab][0-9A-Za-z]+$` (≤10 chars). **`base-nova` is rejected** though it appears in docs/skill. [Verified-in-lab]
- `-y` does NOT skip the preset/base/template prompts — pass `-p`, `-b`, `-t` (and `--no-monorepo`) for non-interactive runs. [Verified-in-lab]
- `-d` = `--template next` + `--base base` (unless given) + nova preset. [Verified init.ts]
- In an existing project: asks to overwrite components.json (`-f` skips) and whether to reinstall components (`--reinstall/--no-reinstall`). Backs up components.json and restores on failure.
- Needs network to `ui.shadcn.com` (and GitHub + git for `-t` new projects). Partial failure (timeout) leaves deps+components.json but no files → re-run `init -b <b> -p <p> -f -y --no-reinstall` inside the project. [Verified-in-lab]

## add
```
shadcn add [items…] -y -o(--overwrite) -c <cwd> -a(--all) -p <path> -s --dry-run --diff [file] --view [file]
```
- Item address: bare name (`button`), block (`dashboard-01`, `login-03`, `sidebar-07`), `@ns/name`, `owner/repo/item[#ref]`, URL, or local file starting with `./` or `/` (**not** `C:\…`, not `..\`). [Verified-in-code builder.ts, lab]
- No items → interactive multi-select. Missing components.json → offers to run init.
- `--dry-run` lists create / skip(identical) / overwrite and npm deps; `--diff` shows unified diff where `-` = local, `+` = incoming; `--view` prints file content. Identical files are skipped silently; differing files **prompt even with `-y`** unless `-o`. [Verified-in-lab]
- Installing `registry:style|theme|base` asks confirmation that CSS vars/components get overwritten. Deprecated names: `toast` (Base-UI-only, use `sonner` on radix/aria) and `toaster`.
- Post-install notes are only printed (e.g. "wrap app with TooltipProvider") — **the CLI never edits your layout**. [Verified-in-lab: dashboard-01 build failed until provider added]

## Read-only inspection commands
- `info [--json]`: framework, version, rsc, TS, tailwind version/css, alias, style, base, iconLibrary, rtl, menuColor/menuAccent, **preset code & values**, aliases, resolved paths, registries, installed components, doc links. Primary context source for agents.
- `docs <c…> [-b base] [--json]`: prints doc/example/API **links only** for the project's base. Fetch them yourself.
- `view <items…>`: prints registry-item JSON (with inlined file contents).
- `search|list [@ns|owner/repo …] -q <text> -l <limit=100> -o <offset> [-t <type>]`: e.g. `search '@shadcn' -q sidebar -l 6` → "Found 22 … Showing 1-6".

## Preset commands
`preset decode <code> [--json]`, `preset resolve|info [--json]` (project's current), `preset url <code>`, `preset open <code>`; `apply <code|name> [--only theme|font|theme,font]`. `apply` needs an existing components.json, keeps the current base; `--only theme` rewrites only CSS tokens (lab). Preset switch modes per official skill: overwrite (`apply`), partial (`--only`), merge (`init --preset … --force --no-reinstall` + per-file `--diff`), skip. [Verified-in-lab + Documented]

## migrate / eject
`migrate cn|icons|base-color|radix|rtl [path-or-glob] [-l] [-y] [-f from] [-t to]`.
- `cn`: no components.json needed; Tailwind v4 only; replaces `clsx`/`tailwind-merge`/`cnfast` with the `cn` package.
- `icons`: lucide | tabler | hugeicons | phosphor | remixicon | radix(legacy); updates `iconLibrary` unless path-scoped.
- `base-color`: neutral zinc stone mauve olive mist taupe. `radix`: `@radix-ui/react-*` → `radix-ui`. `rtl`: physical → logical classes, sets `rtl:true`.
- `eject`: inlines `shadcn/tailwind.css` and removes the `shadcn` dep — irreversible. [Documented]

## components.json
Strict schema (unknown keys error). Fields: `$schema`, `style` (`<base>-<style>`; fixed after init), `rsc` (bool, default false), `tsx` (default true), `tailwind{config ("" for v4), css, baseColor (fixed), cssVariables (fixed, default true), prefix}`, `iconLibrary`, `rtl`, `menuColor` (default|inverted|default-translucent|inverted-translucent), `menuAccent` (subtle|bold), `aliases{components, utils, ui, lib, hooks}`, `registries{ "@name": "https://x/{name}.json" | {url, params, headers} }`. Aliases may be tsconfig `paths` or `package.json#imports` (`#components/*`; needs `moduleResolution:"bundler"` + `resolvePackageJsonImports:true`; target ending `.tsx` strips extensions in generated imports). `${VAR}` in registry headers/params expands from env (the CLI loads the project's `.env*` files). [Verified-in-code schema.ts + Documented]

## Registry item schema
Types: `registry:base|block|component|font|lib|hook|ui|page|file|style|theme|item` (+internal example/internal).
```json
{ "$schema":"https://ui.shadcn.com/schema/registry-item.json", "name":"hello-card", "type":"registry:component",
  "dependencies":["zod","name@1.0.2"], "devDependencies":["tw-animate-css"],
  "registryDependencies":["card","@acme/x","owner/repo/y#v1","https://…/z.json","./local.json"],
  "files":[{"path":"registry/hello/hello-card.tsx","type":"registry:component","target":"@components/hello-card.tsx"}],
  "cssVars":{"theme":{"color-brand":"var(--brand)"},"light":{"brand":"oklch(...)"},"dark":{"brand":"oklch(...)"}},
  "css":{"@layer base":{"body":{"font-size":"1rem"}},"@utility text-magic":{}},
  "envVars":{"LAB_API_URL":"http://localhost:4000"}, "docs":"shown after install", "meta":{}, "categories":[] }
```
- `target` required for `registry:page` and `registry:file`; `~/` = project root; placeholders at start only: `@components/ @ui/ @lib/ @hooks/`. `tailwind.config` = deprecated v3 field. `registry:font` requires `font{family, provider:"google", import, variable, subsets?, weight?, selector?, dependency?}`. `registry:base` carries `config` (partial components.json).
- `registry.json`: `{name, homepage, items[]}` or `include:[…paths]` (paths relative to declaring file). `shadcn build` → `public/r/<name>.json` with file `content` inlined. `shadcn registry validate owner/repo[#ref]`. Env: envVars go to `.env.local` and never overwrite existing keys; never put production secrets in them.
- Resolution: deps resolved recursively, topological, **last item wins per target path**, css/vars deep-merged. [Documented + Verified-in-lab]

## Registry addresses
`name` (built-in `@shadcn`), `@ns/name`, `owner/repo/item[#branch|tag|sha]` (github.com only, root `registry.json`, private via `gh auth` or `GH_TOKEN`/`GITHUB_TOKEN`), URL, `./file.json`. Bare names in `registryDependencies` always mean the built-in registry. Refs are not inherited by dependencies.

## Environment variables
`REGISTRY_URL` (default `https://ui.shadcn.com/r`), `SHADCN_GITHUB_URL`, `SHADCN_TEMPLATE_DIR` (local templates), `GH_TOKEN`/`GITHUB_TOKEN` (GitHub registries), project `.env*` for `${VAR}` registry auth. [Verified-in-code constants.ts, create-template.ts; Documented github.mdx]

## Sources
- apps/v4/content/docs/(root)/cli.mdx, components-json.mdx; docs/registry/*.mdx
- packages/shadcn/src/commands/*.ts; packages/registry/src/registry/{schema,constants,builder}.ts
- research/examples-run.md (lab verification)
