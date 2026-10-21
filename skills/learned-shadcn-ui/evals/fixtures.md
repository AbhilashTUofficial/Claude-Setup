# Eval fixtures — shadcn/ui

Answered using **only** `references/` and `examples/` (not general knowledge). Run 2026-10-22; result: all 12 questions + implementation + when-not check answerable from those files (see "Fixes made").

## Known-answer questions

1. **Q:** Which component base is the default for new projects, and since when?
   **A:** Base UI (`base`), since 2026-07-02; Radix remains fully supported, Aria is the third base. — `bases.md` (table), `mental-model.md`.

2. **Q:** `npx shadcn init -t next -b radix -y` hangs in CI. Why and what is the fix?
   **A:** `-y` does not skip the preset prompt; pass `-p <name|code>` (plus `-t -b -n --no-monorepo`). — `pitfalls.md` #1, `api.md` init.

3. **Q:** What does the installed `button.tsx` contain compared with the authored source, and what does `components.json` `style: "radix-nova"` mean?
   **A:** Authored source uses `cn-*` placeholder classes; the registry build swaps in the style's Tailwind classes, so installed files hold real classes. `radix-nova` = base `radix` + style `nova`. — `mental-model.md` "Style = base × style × preset".

4. **Q:** What is the preset code of the default nova preset and what does it not encode?
   **A:** `b2fA`; it doesn't encode the base (pass `-b`). — `mental-model.md`, `api.md` (preset).

5. **Q:** How do you render a Dialog trigger as your own Button in a Base UI project vs a Radix project? What extra prop is needed for an `<a>`?
   **A:** Base: `<DialogTrigger render={<Button />}>`; Radix: `<DialogTrigger asChild><Button/></DialogTrigger>`; on Base a non-button render target needs `nativeButton={false}`. — `bases.md`.

6. **Q:** `npx shadcn add C:\reg\hello-card.json` fails with "unknown scheme". Why, and what works?
   **A:** Drive letter parsed as URL scheme; local files must start with `./` or `/` (copy under the project, use `./r-local/hello-card.json`). — `pitfalls.md` #8, `api.md` add.

7. **Q:** `shadcn build` says "Unexpected token '﻿'" on registry.json written from PowerShell. Cause?
   **A:** UTF-8 BOM from `Set-Content -Encoding utf8`; write without BOM. — `pitfalls.md` #7.

8. **Q:** In `add --diff` output what do `-` and `+` mean, and does `add -y` overwrite a modified file?
   **A:** `-` local, `+` incoming upstream; `-y` doesn't overwrite (prompts, non-TTY keeps local) — only `-o`. — `api.md` add, `pitfalls.md` #2, `patterns.md`.

9. **Q:** When two registry items target the same path, which wins? And what writes `envVars`?
   **A:** The last-resolved item wins per target path; css/vars deep-merge; `envVars` go to `.env.local` without overwriting existing keys. — `api.md` registry schema.

10. **Q:** After `add dashboard-01`, `next build` fails with "Tooltip must be used within TooltipProvider". Fix?
    **A:** Wrap the app in `<TooltipProvider>` in the root layout; the CLI only prints a note. — `pitfalls.md` #5, `patterns.md`.

11. **Q:** Which theme command changes only colors, and what files change?
    **A:** `apply <code> --only theme` (or `--only font`); only the global CSS tokens change. — `theming.md`, `api.md`.

12. **Q:** Which doc claims are known stale? (name three)
    **A:** components.json docs `style:"new-york"`; `--preset base-nova` (CLI rejects); llms.txt missing newer pages / react-19 doc outdated. — `pitfalls.md` "Docs that are stale or wrong".

## Implementation check

**Task:** In a Next.js 16 + Tailwind v4 app, scaffold shadcn with Radix + nova, add Card, Field, Input, Select, Dialog, Sonner; build a form card with a validation-state input, a select, a dialog opened from a Button, a toast on Save, and verify it builds.
**Result:** Doable from references only: `patterns.md` (bootstrap command, Field/validation rules, TooltipProvider/Toaster note), `api.md` (flags), `bases.md` (Radix `asChild`, inline `SelectItem`s), and `examples/01-radix-nova-next-page.tsx` (the exact page that passed `tsc` + `next build` + a Playwright check in the lab). Required nothing outside `references/` + `examples/`.

## When-NOT-to-use check

**Q:** Give a concrete scenario where shadcn/ui is the wrong choice.
**A:** (a) A Vue/Svelte/Angular app, or a project that can't adopt Tailwind v4 + React; (b) many apps needing a centrally versioned, semver-upgraded component package (shadcn copies source, no per-component versions); (c) offline/air-gapped build (init/add hit ui.shadcn.com, `-t` clones GitHub). — `decision-guide.md` "Do NOT use it when" #1–#3. Consistent with decision-guide.

## Fixes made during the pass
- `decision-guide.md` claimed "Laravel+Inertia"; unverified → changed to "Laravel React starter".
- `decision-guide.md` said `apply` prompts on base switch; only `init` does (code) → reworded.
- `patterns.md` pointed at a research file ("see examples-run.md §6") → removed (references must be self-contained, one level deep).
- Self-check caveat: answers were written by the same agent that compiled `references/`, so this proves coverage of the files, not independent correctness; correctness rests on the [Verified] tags and `research/unresolved.md`.
