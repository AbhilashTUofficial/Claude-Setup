# Unresolved — n8n

## Scope boundary (recorded before research began)

This ingestion covers n8n from the **builder/integrator perspective** — workflow model, custom node development, the API/CLI, self-hosting, and AI-agent features. It deliberately excludes n8n's own internal contribution process (lint-config layering, the TypeORM persistence-boundary rules, PR/Linear conventions, encryption-boundary enforcement, security-fix hygiene) — that's n8n-repo-specific contributor process already documented in the repo's own `AGENTS.md`/`CLAUDE.md`, not transferable technology knowledge. Also out of scope: `packages/frontend` (Vue editor UI internals), `packages/@n8n/design-system`, `packages/testing`, `packages/extensions` — implementation detail not needed to understand how to build with n8n.

## Version-mismatch caveat

`docs.n8n.io` describes a current/rolling release with no version selector found — not confirmably the same as the locally-installed v2.41.0. Several docs-sourced concepts (Data tables, Chat Hub, an AI Workflow Builder, an evaluation framework) were cross-verified as genuinely present in the local v2.41.0 source during synthesis (see `docs-analysis.md`'s header). **"Gateway credits" (an n8n Cloud LLM-billing concept) was not found anywhere in the local source and is treated as Cloud-only / not applicable to a self-hosted instance** — if this matters later, verify directly against a specific self-hosted release rather than assuming docs parity.

## Coverage by research angle (condensed from each angle's own gap disclosure — see the individual research/*.md files for full detail)

- **Workflow/execution model**: ~20-25% of `packages/workflow/src` by file count, ~10-15% of `packages/core/src`. Not read: `partial-execution-utils/` (partial/manual re-execution logic), poll/schedule job-management internals beyond the activation-tracking layer, binary-data/encryption subsystems, most individual `*Context` class bodies (existence + instantiation sites confirmed, not full implementations).
- **Custom node development**: ~1-2% of `nodes-base`'s 309 node directories, deliberately diverse sample. Not read: AI/LangChain nodes (covered separately), `V1`/`V2` versioned-node directories beyond confirming they exist, the node-loading runtime in `core`/`cli`, community-node ESLint rule implementations.
- **API/CLI/deployment**: Not read: legacy `packages/cli/src/config`, auth/SSO/MFA/LDAP internals, `@n8n/db` schema/migrations, `@n8n/task-runner` implementation (only its config surface), most individual Public API v1 controllers beyond base paths, two of five Docker image variants (`engine/`, `node-pc/`).
- **AI-agent/LangChain nodes**: Not read: full tool-calling loop internals, individual chain-node execution bodies, individual vector-store backend implementations, `@n8n/workflow-sdk` internals, most of Instance AI's own docs beyond `architecture.md` + partial `tools.md`.
- **Official docs**: Exact current URL for the canonical AI-Agent-node reference page not found. Vector-store-specific docs pages not individually fetched. `ways-of-building-workflows/*` pages not content-fetched (existence cross-verified via source instead).

## Genuinely unresolved / needs a follow-up pass if it matters

1. **Relationship between `NodeApiError`/`NodeOperationError` (node-execution-facing errors) and the repo-wide `UserError`/`OperationalError`/`UnexpectedError` taxonomy** — not confirmed whether they share a lineage (`BaseError`) or are separate. Both families are real and in active use; their exact relationship wasn't traced.
2. **Which built-in nodes, if any, use the newer `abstract class Node` (`execute(context, response?) → EngineRequest`) form** vs. the standard `implements INodeType` form — none of the sampled nodes used it; not confirmed whether any shipped node does.
3. **`Workflow.getConnectionsByDestination()`** (a static method duplicating `mapConnectionsByDestination()`'s algorithm) looks like dead code — not exhaustively confirmed unused repo-wide.
4. **Canonical list of selectable AI-Agent "types"** in n8n's own current terminology (Tools Agent / Conversational / etc.) — the docs page describing this wasn't locatable at the URL guessed; source confirms V3 is exclusively tool-calling and older versions implement several named legacy types, but the current user-facing naming wasn't independently confirmed from docs.
5. **Exact mechanics of the fan-in re-queue** (`waitingExecution` → a multi-input node becoming ready once its last branch arrives) — the data structure and its consultation are confirmed; the precise transition logic wasn't traced line-by-line.

## Weak-evidence areas

Everything tagged **Unconfirmed** or **Derived** (rather than **Documented**/**Verified-in-code**) throughout the five `research/*.md` files falls into this bucket by construction — see each file's own tagging rather than duplicating the list here.
