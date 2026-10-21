# Patterns — composing, forms, updating, authoring registries

## Contents
- [Project bootstrap recipes](#project-bootstrap-recipes)
- [Composition rules (official skill)](#composition-rules-official-skill)
- [Forms with Field](#forms-with-field)
- [Customizing a component safely](#customizing-a-component-safely)
- [Updating components you already own](#updating-components-you-already-own)
- [Authoring and consuming a registry](#authoring-and-consuming-a-registry)
- [Agent workflow](#agent-workflow)
- [Monorepo](#monorepo)

## Project bootstrap recipes
```bash
# New Next.js app, Radix primitives, nova preset (fully non-interactive)
npx shadcn@latest init -t next -b radix -p nova -n my-app --no-monorepo -y
# New Vite app, Base UI (default base)
npx shadcn@latest init -t vite -b base -p nova -n my-app --no-monorepo -y
# Existing app (components.json missing)
npx shadcn@latest init -b base -p nova -y
# Preview then install a block
npx shadcn@latest add dashboard-01 --dry-run
npx shadcn@latest add dashboard-01 -y     # then wrap root layout in <TooltipProvider>
```
Verified-in-lab: Next 16 + radix-nova and Vite 8 + base-nova both scaffold, typecheck and build. Wrap the whole app (inside ThemeProvider) in `TooltipProvider` and render `<Toaster />` once for sonner.

## Composition rules (official skill, maintainers' guidance) [Documented]
- Compose existing components: settings page = Tabs + Card + fields; dashboard = Sidebar + Card + Chart + Table.
- Built-in variants/sizes first; `className` only for layout (`max-w-md`, `mt-4`); semantic color tokens; `gap-*` not `space-*`; `size-*` when w=h; `cn()` for conditionals; no z-index on overlays.
- Items inside their Group (`SelectGroup`, `DropdownMenuGroup`, `CommandGroup`…); Dialog/Sheet/Drawer need a Title (use `sr-only` to hide); full Card anatomy (`CardHeader/Title/Description/Content/Footer`); `TabsTrigger` inside `TabsList`; `AvatarFallback` always.
- Button loading: `<Button disabled><Spinner data-icon="inline-start" />Saving…</Button>` (no `isPending` prop). Icon + text: `<SearchIcon data-icon="inline-start" />`.
- Use `Alert`, `Empty`, `Separator`, `Skeleton`, `Badge`, `ToggleGroup` instead of hand-rolled markup. Overlay choice: Dialog (focused task), AlertDialog (destructive confirm), Sheet (side panel), Drawer (mobile bottom), Popover/HoverCard (small contextual).
- Chat UIs: `MessageScroller` + `Message` + `Bubble` + `Attachment` + `Marker` + `Trace` (+`CodeBlock`); don't hand-roll stick-to-bottom.

## Forms with Field
```tsx
<FieldGroup>
  <Field data-invalid={!!errors.email}>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" aria-invalid={!!errors.email} />
    <FieldDescription>We never share it.</FieldDescription>
    {errors.email && <FieldError>{errors.email.message}</FieldError>}
  </Field>
  <Field orientation="horizontal"><Switch id="n"/><FieldLabel htmlFor="n">Newsletter</FieldLabel></Field>
</FieldGroup>
```
- Hierarchy: `FieldSet > FieldLegend + FieldDescription + FieldGroup > Field > (FieldLabel | FieldContent(FieldTitle/FieldDescription) | control | FieldError)`; `FieldSeparator` between groups. `orientation`: vertical (default) | horizontal | responsive (container-query aware via `@container/field-group`).
- Validation = `data-invalid` on `Field` + `aria-invalid` on control; disabled = `data-disabled` + `disabled`. Works for Input, Textarea, Select, Checkbox, RadioGroupItem, Switch, Slider, NativeSelect, InputOTP.
- Integrations documented: React Hook Form, TanStack Form, Formisch, Next.js server actions (docs/forms/*). There is no `<Form>` wrapper component in the current list. [Documented llms.txt + forms docs]
- Inputs with buttons/addons: `InputGroup` + `InputGroupInput` + `InputGroupAddon` (never raw `Input` inside `InputGroup`).

## Customizing a component safely
Edit the copied file: add variants in its `cva`, change tokens in CSS. Keep upstream-diffability: make small, localized edits (lab: changing `rounded-4xl`→`rounded-md` in badge showed as a one-line diff). Prefer tokens/variants over deep rewrites. Check `data-slot` attributes (components expose `data-slot="button"`, `data-variant`, `data-size`) — they are the styling hooks other components use (e.g. `has-data-[icon=inline-start]`, `in-data-[slot=button-group]`). [Verified-in-lab button.tsx]

## Updating components you already own
```bash
npx shadcn@latest add button --dry-run          # what would change
npx shadcn@latest add button --diff button.tsx  # '-' local, '+' upstream
# no local edits → add button -o ; local edits → hand-merge using the diff
```
Never `-o` blindly (overwrites local edits); `-y` alone does not overwrite. To switch presets while keeping edits: `init --preset <code> --force --no-reinstall`, then per-component `--diff`. [Verified-in-lab + Documented skill]

## Authoring and consuming a registry
1. `registry.json` at repo root (`$schema`, `name`, `homepage`, `items[]`), item files under e.g. `registry/<item>/…`.
2. `npx shadcn build` → `public/r/*.json` (host statically, or serve dynamic route handlers; `{name}` placeholder). Write files **without BOM** on Windows.
3. Consumers: add `"registries": {"@acme": "https://acme.dev/r/{name}.json"}` (use `headers`/`params` + `${ENV}` for auth), then `npx shadcn add @acme/hello-card`. Or skip hosting: push to GitHub and `npx shadcn add owner/repo/item#<tag|sha>`.
4. Local testing: copy output into the consumer project and `add ./path/item.json` (must start `./` or `/`).
5. Put UI deps in `registryDependencies` (`card`, `button`) and npm deps in `dependencies`; theme tokens in `cssVars`; keep `envVars` to dev/example values.
6. Override a vendor item by making a new item that lists it in `registryDependencies` and overrides vars/files (last wins).
[Verified-in-lab round trip; Documented]

## Agent workflow
Run `shadcn info --json`; `shadcn search '@shadcn' -q <term>`; `shadcn docs <c>` then fetch the links; `view` unknown items; `add --dry-run`/`--diff`; after install **read the added files** (missing Groups, hard-coded `@/components/ui` imports in third-party items, icon library mismatch); don't pick a registry on the user's behalf; MCP: `npx shadcn@latest mcp init --client claude` (tools: get_project_registries, list/search/view_items_in_registries, get_item_examples_from_registries, get_add_command_for_items [returns command text only], get_audit_checklist). Skill: `npx skills add shadcn/ui`. [Documented + Verified-in-code]

## Monorepo
`init --monorepo -t next|vite|start|react-router|astro` creates `apps/web` + `packages/ui` (+turbo/pnpm workspace); run `add` inside the app dir; primitives land in `packages/ui/src/components`, app-specific block files in `apps/web/components`; import `@workspace/ui/components/button`. Every workspace needs a `components.json` with consistent aliases. [Documented monorepo.mdx; not run in lab]

## Sources
- skills/shadcn/SKILL.md & rules/*.md; docs/registry/*; docs/forms/*; docs/(root)/monorepo.mdx, mcp.mdx
- research/examples-run.md; research/official-skill-and-community.md
