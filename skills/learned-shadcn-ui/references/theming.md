# Theming, dark mode, icons, fonts, RTL — shadcn/ui

## Contents
- [Token system](#token-system)
- [Adding a token / brand color](#adding-a-token--brand-color)
- [Switching theme with presets](#switching-theme-with-presets)
- [Dark mode](#dark-mode)
- [Radius, fonts, icons](#radius-fonts-icons)
- [Without CSS variables](#without-css-variables)
- [RTL](#rtl)

## Token system
Generated CSS (Verified-in-lab, 129 lines for radix-nova): header `@import "tailwindcss"; @import "tw-animate-css"; @import "shadcn/tailwind.css"; @custom-variant dark (&:is(.dark *));` then `@theme inline { --font-heading; --font-sans; --color-<token>: var(--<token>); --radius-sm…4xl }`, then `:root { --radius:.625rem; --background … }` and `.dark { … }` in **oklch**. [Verified-in-lab, Documented theming.mdx]
- Pairs: surface `--x` + text `--x-foreground`. Tokens: background, foreground, card, popover, primary, secondary, muted, accent (each with `-foreground`), destructive (no foreground), border, input, ring, chart-1…5, sidebar family (`sidebar`, `-foreground`, `-primary(-foreground)`, `-accent(-foreground)`, `-border`, `-ring`), `radius`.
- Radius scale derives from `--radius`: sm .6×, md .8×, lg 1×, xl 1.4×, 2xl 1.8×, 3xl 2.2×, 4xl 2.6×.
- Use utilities `bg-primary text-primary-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`; never raw palette colors or `dark:` color pairs for themed surfaces (official skill rule).

## Adding a token / brand color
```css
:root { --warning: oklch(0.84 0.16 84); --warning-foreground: oklch(0.28 0.07 46); }
.dark { --warning: oklch(0.41 0.11 46); --warning-foreground: oklch(0.99 0.02 95); }
@theme inline { --color-warning: var(--warning); --color-warning-foreground: var(--warning-foreground); }
```
→ `bg-warning text-warning-foreground`. Same result via a registry item `cssVars{theme,light,dark}` (lab: `--color-brand: var(--brand)` landed in `@theme inline`, `--brand` in `:root` and `.dark`). [Verified-in-lab]

## Switching theme with presets
- `npx shadcn apply <code> --only theme` rewrites only color tokens (lab: primary/secondary/chart/sidebar-primary changed to indigo oklch); `--only font` for fonts; no `icon` partial. Full `apply <code>` / `init --preset <code>` also reinstalls components. [Verified-in-lab, Documented]
- Base colors: neutral, stone, zinc, mauve, olive, mist, taupe (`migrate base-color --to zinc`). Themes also include amber…yellow colors (preset schema). `tailwind.baseColor` and `cssVariables` are fixed at init.
- Build/preview presets visually at ui.shadcn.com/create (`preset url|open <code>`).

## Dark mode
Class strategy: `.dark` on `<html>` + `@custom-variant dark`. Next template ships `components/theme-provider.tsx` using **next-themes** (`attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`) plus a `ThemeHotkey`: pressing **`d`** toggles theme (ignored while typing, with modifiers, or on repeat). `suppressHydrationWarning` on `<html>`. Verified: pressing `d` adds `html.dark`. [Verified-in-lab] Other frameworks: docs `dark-mode/{vite,astro,remix,tanstack-start}` (own providers). Remove the hotkey if `d` conflicts with your app.

## Radius, fonts, icons
- Radius: preset values `default|none|small|medium|large`; or edit `--radius`.
- Fonts: preset `font`/`fontHeading` (26 families). Next: `next/font/google` variable `--font-sans`; non-Next projects install `@fontsource-variable/*` (`registry:font.dependency`). `@theme inline --font-heading: var(--font-sans)`.
- Icons: `iconLibrary` (lucide default; hugeicons, tabler, phosphor, remixicon; radix legacy). Registry source uses `IconPlaceholder`; install swaps to your library's imports. After `migrate icons --from lucide --to phosphor`, `iconLibrary` updates. Always import icons from the configured library. [Verified-in-lab (lucide), Documented]
- Components size their own icons via CSS (`[&_svg:not([class*='size-'])]:size-4`); inside Button use `data-icon="inline-start|inline-end"`; don't add `size-4`. [Verified-in-lab button.tsx classes + official skill]

## Without CSS variables
`init --no-css-variables` generates inline utilities (`bg-zinc-950 dark:bg-white`). Install-time only; switching requires deleting & reinstalling components. [Documented]

## RTL
`init --rtl` or `migrate rtl`: components.json `rtl:true`; physical classes → logical (`ml-4`→`ms-4`, `text-left`→`text-start`), `rtl:` variants where needed; `Direction` component/provider; pre-generated RTL styles exist for **nova** (base & radix) only. [Documented; generation scope from registry README]

## Sources
- apps/v4/content/docs/(root)/theming.mdx, components-json.mdx, cli.mdx; docs/rtl/index.mdx; docs/dark-mode/index.mdx
- research/examples-run.md §1, §5; packages/registry/src/preset/preset.ts
