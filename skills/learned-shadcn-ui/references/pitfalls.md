# Pitfalls — shadcn/ui (all Verified-in-lab or Verified-in-code unless marked)

## Contents
- [Non-interactive / CI](#non-interactive--ci)
- [Windows / PowerShell](#windows--powershell)
- [Network and trust](#network-and-trust)
- [Generated code surprises](#generated-code-surprises)
- [Docs that are stale or wrong](#docs-that-are-stale-or-wrong)
- [Base-specific traps](#base-specific-traps)

## Non-interactive / CI
1. `init … -y` still prompts for preset (and base/template/monorepo when omitted) → hangs. Always pass `-t -b -p -n --no-monorepo`.
2. `add <existing-file-component> -y` prompts "overwrite?"; non-TTY defaults to **no** and silently keeps the file. Use `-o` only after reviewing `--diff`.
3. One flaky request aborts `init` midway (10 s timeout on `…/r/colors/neutral.json`): you get package.json deps + components.json but no `lib/utils.ts`/CSS. Re-run `init -b <base> -p <preset> -f -y --no-reinstall` in the project dir. In CI, retry or mirror the registry via `REGISTRY_URL`.
4. New-project `init -t` needs `git` + GitHub (sparse clone of `templates/<tpl>`) and runs your package manager install.
5. After `add` of blocks/components that need providers, the CLI only prints a note: `tooltip` → wrap app in `<TooltipProvider>` (else `next build` fails prerendering "`Tooltip` must be used within `TooltipProvider`"); `sonner` → render `<Toaster />`.

## Windows / PowerShell
6. Quote namespaces: `npx shadcn add '@shadcn/button'` (unquoted `@x` = splat variable error).
7. `Set-Content -Encoding utf8` (Windows PowerShell 5.1) writes a **BOM** → `shadcn build` fails `Failed to parse registry file … Unexpected token '﻿'`. Write JSON with `[IO.File]::WriteAllText(path, text, New-Object Text.UTF8Encoding $false)` or an editor.
8. `add C:\abs\file.json` → "unknown scheme" (drive letter parsed as URL scheme). Local files must start with `./` or `/`; `..\` also fails. Copy the JSON under the project and use `./r-local/x.json`.
9. Cosmetic: `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` printed at exit on Node 24/Windows after some commands; output was complete [cause Unconfirmed].
10. Registry JSON built from Windows sources keeps `\r\n` in inlined `content`.

## Network and trust
11. `init`/`apply` call `ui.shadcn.com/init?…&track=1` — the server records the run (what exactly: undocumented). Set `REGISTRY_URL` to a mirror if that matters.
12. Unknown `@ns/item` is **auto-resolved** from the public registries index (`/r/registries.json`) and, on a real `add`, written into components.json — contrary to docs ("never automatically adds registries"). Configure `registries` explicitly; pin GitHub refs to full SHAs.
13. Any registry item can write any path inside the project (config files, `.github/workflows`, `.env.local` via `envVars`, `package.json` deps) — `is-safe-target` only blocks traversal/outside-project/NUL/encoded `..`. Always `view`/`--dry-run`/`--diff` unknown items.
14. A registry `registry:file` targeting an env file is merged **into `.env.local`**, not created as given (lab: `~/.env.example` target → keys appended to `.env.local`). `.env.local` is gitignored by the Next template (`.env*`) but the **Vite template's `.gitignore` has no `env` entry** (lab) — add `.env*` yourself before using registry `envVars`; don't ship secrets via `envVars`.

## Generated code surprises
15. Installed code has **resolved Tailwind classes** (style baked at install), so changing preset/style later requires `apply`/reinstall — editing `components.json` `style` by hand does nothing to existing files. `style`, `baseColor`, `cssVariables` can't be changed after init (use `apply`, `migrate base-color`, reinstall).
16. Leaked placeholder: sonner installs `toastOptions.classNames.toast = "cn-toast"` (a no-op class; nova's intended `rounded-2xl` is never applied). Harmless; fix by editing the file if you care.
17. `lib/utils.ts` is now `export { cn } from "cn"`; older tutorials show `clsx` + `tailwind-merge`. `cn` merge engine is Tailwind-v4 only (v3 projects stay on `tailwind-merge@2`; `migrate cn` warns).
18. Next template theme provider binds the **`d` key** to toggle dark mode (and writes `AGENTS.md`/`CLAUDE.md` Next agent rules). Remove `ThemeHotkey` if unwanted.
19. `rsc:false` projects (Vite/Router): `"use client"` is only *partially* stripped — lab (Vite, base-nova): 6 of 17 freshly added files kept the directive (separator, sidebar, toast, toggle-group, toggle, tooltip) due to a known `g`-flag regex bug noted in `transform-rsc.ts`. Harmless in Vite (ignored directive) but inconsistent; strip manually if you care. Also the post-install `tooltip` note shows Next-style `app/layout.tsx` and is printed twice in Vite.
20. `dashboard-01` etc. add ~30 files and heavy deps (recharts 3.x, @dnd-kit/*, @tanstack/react-table, vaul, zod) — review dependency cost before adding blocks to a lean app.
21. `shadcn docs <c>` returns links only; you must fetch them for API details.
22. `migrate icons` rewrites imports in `ui/` only, leaves a stale `strokeWidth={2}` on Phosphor icons (no-op; Phosphor uses `weight`) and does not remove the old icon package from package.json; your own app files still import the old library. [Verified-in-lab lucide?phosphor]

## Docs that are stale or wrong
- `components.json` docs: `"style": "new-york"`, "default deprecated" → real styles are `<base>-<style>` (`radix-nova`).
- `--preset base-nova` (docs/skill/`-d` help) → CLI rejects; use `nova` (+ `-b base`).
- `react-19.mdx` (npm `--force` peer-dep dance) is self-described as outdated; `llms.txt` is missing newer pages; skill's preset list omits `sera`, `rhea`; README says combos are committed under `public/r` but the clone only has `default` and `new-york`.
- Trust order when sources disagree: tests/source > official skill/docs > changelog.

## Base-specific traps
- Radix: `asChild`; Base UI: `render={<Button/>}` and, for non-button targets, `nativeButton={false}`. Radix `Select` uses inline JSX; Base `Select` needs `items` + `{value:null}` placeholder. ToggleGroup/Accordion/Slider value shapes differ (arrays vs strings/numbers). Full table in `bases.md`.
- `toast` component exists only for Base UI; Radix/Aria use `sonner`. `menubar`/`navigation-menu` absent in the Aria base.
- `combobox` in the Radix base depends on `@base-ui/react` (mixed primitives even on Radix).

## Sources
- research/examples-run.md (lab); research/source-cli-and-transformers.md; research/unresolved.md; skills/shadcn/rules/*.md

