# Bases — Base UI vs Radix vs React Aria

## Contents
- [Which is which](#which-is-which)
- [Detect the base](#detect-the-base)
- [API differences that break code](#api-differences-that-break-code)
- [Availability differences](#availability-differences)
- [Switching](#switching)

## Which is which
| Base | Primitive package | components.json style prefix | Default? |
|---|---|---|---|
| `base` | `@base-ui/react` | `base-<style>` | **Yes (since 2026-07-02)** |
| `radix` | unified `radix-ui` (since 2026-02; legacy `@radix-ui/react-*` via `migrate radix`) | `radix-<style>` | no, fully supported |
| `aria` | `react-aria-components` | `aria-<style>` | no (first-class since 2026-07-17) |
All three exist for all 8 styles; same component names and composition; `registry/bases/<base>/ui/*.tsx` are separately authored (README: keep shared surfaces in sync across bases). [Documented changelog + registry README; Verified file layout]
Unfortunate mixes (Verified-in-code `_registry.ts`): Radix-base `combobox` uses `@base-ui/react`; Radix/Base `drawer` = `vaul` (radix) vs `@base-ui/react` (base/aria); Base `direction` uses `@base-ui/react`.

## Detect the base
`components.json` `style` prefix, or `npx shadcn@latest info --json` → `base`. (`getBase` falls back to `radix` when the style has no prefix, e.g. legacy `new-york`.) [Verified-in-code get-config.ts:325]

## API differences that break code
(From the maintainers' skill `rules/base-vs-radix.md` [Documented]; the Radix side was exercised in lab.)
| Concern | Radix | Base UI |
|---|---|---|
| Custom trigger element | `<DialogTrigger asChild><Button/></DialogTrigger>` | `<DialogTrigger render={<Button />}>Open</DialogTrigger>` |
| Trigger renders non-button (`<a>`) | `<Button asChild><a href/></Button>` | `<Button render={<a href="/x"/>} nativeButton={false}>` |
| Applies to | DialogTrigger, SheetTrigger, AlertDialogTrigger, DropdownMenuTrigger, PopoverTrigger, TooltipTrigger, CollapsibleTrigger, *Close, NavigationMenuLink, BreadcrumbLink, SidebarMenuButton, Badge, Item | same list |
| Select placeholder | `<SelectValue placeholder="…"/>` | `items` array on root incl. `{label:"Select…", value:null}`; `<SelectValue/>` |
| Select positioning | `<SelectContent position="popper">` | `<SelectContent alignItemWithTrigger={false} side="bottom">` |
| Select multi/object values | single string only | `multiple`, render-fn `SelectValue`, `itemToStringValue` |
| ToggleGroup | `type="single"|"multiple"`, string `defaultValue` | `multiple` boolean, `defaultValue` always array (`["daily"]`); controlled single: `value={[v]} onValueChange={(a)=>setV(a[0])}` |
| Slider | `defaultValue={[50]}` always array | single thumb takes number `defaultValue={50}`; ranges use arrays; `onValueChange` may need `as number[]` |
| Accordion | `type="single"` + `collapsible`, string `defaultValue` | no `type`; `multiple` boolean; `defaultValue={["item-1"]}` |
| Toast | `sonner` (`toast.success()`) | `toast` component (`toast.add({title})`); sonner is hidden from the multi-select on base |
Lab-verified Radix facts: `import { Slot } from "radix-ui"`, `asChild`, `Dialog` closes on Escape, `DialogTrigger asChild` works. [Verified-in-lab]
Lab-verified Base facts (Vite + `base-nova`, `tsc -b` + `vite build` pass): `DialogTrigger render={<Button variant="outline" />}`, `Button render={<a href/>} nativeButton={false}`, `Select items={[{label,value:null},…]}`, `ToggleGroup defaultValue={["daily"]} spacing={2}`, `Slider defaultValue={50}`, `Accordion defaultValue={["a"]}`, `toast.add({title})` with `<Toaster/>` from `@/components/ui/toast`. Negative test: on Base, `asChild` on `DialogTrigger` and string `defaultValue="x"` on `Accordion` are **TypeScript errors** (good: tsc catches Radix-isms); `Slider defaultValue={[50]}` still typechecks (array is allowed, scalar is the extra option). [Verified-in-lab]

## Availability differences
- `toast`: Base only. `menubar`, `navigation-menu`: not in Aria. Aria has extra `select`/`message-scroller`/`questionnaire`/`trace` registry entries in its `_registry.ts` (different dependency wiring). Base has `direction` via Base UI. Counts of `ui/` files: radix 64, base 65, aria ≈ 62+. [Verified file listing; approximate]
- Docs have per-base component pages: `docs/components/{base,radix,aria}/<name>.mdx` (and `ai-elements`). `shadcn docs <c>` resolves links for the project's base (`-b` to override).

## Switching
Re-initialize with a different base reinstalls components (`init --force -b <new>`; CLI prompts to confirm a base switch) and then consumer code must adopt the API differences above; the repo's `skills/migrate-radix-to-base` is a guide for that (class mapping, consumer props, wrappers; not studied in depth). Presets don't encode the base, so pass `-b` when scripting `apply`/`init --preset` in scratch dirs. [Verified-in-code; Documented skill]

## Sources
- skills/shadcn/rules/base-vs-radix.md; apps/v4/registry/bases/{base,radix,aria}/ui/_registry.ts; apps/v4/content/docs/changelog/2026-07-*.mdx
- packages/registry/src/get-config.ts; packages/shadcn/src/commands/init.ts
