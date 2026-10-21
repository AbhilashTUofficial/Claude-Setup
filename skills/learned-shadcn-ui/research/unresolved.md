# Unresolved / coverage — shadcn/ui (learned 2026-10-22)

## Inspected (in scope)
- Repo `shadcn-ui/ui` @ `ba1503c64472b82256d9de95e2e62c5901a38e8b` (shallow clone, committed 2026-10-19): `apps/v4/content/docs` (root, registry, installation selected, components outline for sidebar/chart/data-table/combobox/date-picker/field, changelog selected entries); `packages/shadcn/src` (init, add, docs, preset, templates, mcp index/utils, utils/registries); `packages/registry/src` (schema, constants, preset, transformers index/rsc/next, is-safe-target, get-project-info); `apps/v4/registry` (README, bases layout, bases.ts, style css head, `_registry.ts`); `skills/shadcn` (SKILL + rules); `templates/` listing; `packages/{helpers,react}` manifests.
- Lab runs on CLI 4.22.1: init, info, preset decode/resolve, add (dry-run, diff, real), view, search, docs, apply --only theme, build, local `add ./x.json`; Next 16.4 build + Playwright check. See `examples-run.md`.
- Third-party: shadcn.io/template listing page (via WebFetch).

## Intentionally skipped
- `node_modules`, generated registry output, per-component MDX pages beyond the few outlined (≈200 component docs; API detail per component NOT compiled — read repo MDX or `shadcn docs <c>` at use time).
- Individual blocks' source (login-*, sidebar-*), `new-york-v4` legacy tree, `examples/` demos (582 files in radix), `ai-elements`, `react/` and `helpers/` docs, `rtl` details, `figma`, `v0`/`_blocks` private mdx, marketing pages of ui.shadcn.com (create, blocks, themes, charts).
- `migrate-radix-to-base` skill content (~150 KB) — only listed.
- `packages/registry/src/codemod/*`, `updaters/*` internals, github-* registry code, `search.ts`, `validate.ts`.

## Could not access / not done
- Live website pages (not crawled); relied on repo MDX which may lag/lead the deployed site.
- Did not run the monorepo test suites (needs `pnpm install` of the whole workspace).
- Did not test: `--base aria` projects; `init -t start|react-router|astro` (vite+base and next+radix were tested), `--monorepo`; `--rtl`; `migrate icons|radix|base-color|rtl|cn`; `eject`; `mcp init`; `registry validate`; GitHub registries; authenticated registries; `--no-css-variables`; Tailwind v3 projects; JS (non-TS) output; npm/yarn/bun differences (only npm on Windows tested).

## Weak / single-source / Unconfirmed items (do not treat as fact)
1. ~~`"use client"` leftovers with `rsc:false`~~ — **RESOLVED/verified in lab** (Vite + base-nova: 6 of 17 added files kept `"use client"`). Remaining unknown: whether upstream has since fixed it (code comment says "kept on purpose until that is fixed").
2. **Libuv assertion on Windows/Node 24** after some commands (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`): cause not investigated; output was complete. [Unconfirmed]
3. **Persisting auto-discovered registries**: `ensureRegistriesInConfig` writes discovered `@ns` entries into components.json on a real `add` (code-verified), contradicting docs ("The CLI never automatically adds registries"). Dry-run resolution of `@magicui/shimmer-button` without config worked and did not write components.json (lab). Real-add persistence not run (would install third-party code). [Docs conflict; trust code]
4. **Server-side `track=1`** semantics (what is recorded) are not documented; only the query param is verified. [Unconfirmed what data]
5. **Preset code ↔ named preset mapping**: `nova` = `b2fA`, `b0` = nova style + inter font; codes for other named presets not computed. 
6. **Docs staleness list** (verified stale): components-json.mdx `style:"new-york"` / "default deprecated"; react-19.mdx (marks itself outdated); llms.txt (misses many pages); cli.mdx/skill `--preset base-nova`; skill named-presets list (omits sera, rhea); README claim that `public/r/*` combos are committed (clone has only default & new-york).
7. `cn-toast` placeholder leak (verified) — upstream bug or intended? unknown; no issue searched on GitHub.
8. MCP "install" wording vs code: tool `get_add_command_for_items` only returns a command string (verified); other tools unverified beyond names.
9. Components inventory counts were taken from file listings (radix ui 64, base 65, aria ≈ radix−2); exact per-base parity not audited.
10. Licensing/pricing of shadcn.io templates & Pro not verified; page names no operator.
11. Windows: absolute-path `add C:\x.json` fails ("unknown scheme"); `..\`-relative also not local per `builder.ts:19` (only `./` or `/`). BOM in registry.json breaks `build`. Both lab-verified; other Windows path forms untested.
12. Network: 10 s fetch timeout aborted one init mid-way (transient); no retry logic observed. Re-run recovered. Frequency unknown.

unresolved_count (substantive): 11


