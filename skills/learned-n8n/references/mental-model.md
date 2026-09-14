# Mental model — n8n

n8n is a workflow-automation platform: you build a **workflow** (a directed graph of **nodes** connected by **connections**) that runs when a **trigger** node fires, moving data through the graph as arrays of **items**.

## The graph

- A workflow's `connections` are **indexed by source node**, not destination — `{ [sourceNodeName]: { [connectionType]: [[{node, type, index}, ...]] } }`. Finding a node's *parents* requires inverting this map first (`mapConnectionsByDestination()`); finding *children* uses it directly. Both directions are the exact same TypeScript type, so nothing in the type system tells you which orientation you're holding — see `references/pitfalls.md`.
- Most connections are type `main` — ordinary item-array data flow. A separate family of 11 `ai_*` connection types (`ai_tool`, `ai_memory`, `ai_languageModel`, ...) exists specifically for AI agent workflows and behaves completely differently at runtime — see `references/ai-agents.md`.

## Data flowing through the graph

A node's output is `INodeExecutionData[][]` — outer array = one entry per output branch (an IF node has two; a Switch node has N), inner array = the ordered items on that branch. Each item is `{ json, binary?, pairedItem?, error? }`. `pairedItem` is how n8n traces an output item back to the input item(s) that produced it, even across branches and merges — this is what powers `$('SomeNode').itemMatching()` in expressions.

## How a workflow actually runs

The execution engine (`WorkflowExecute`, `packages/core`) is a **LIFO work-stack machine**, not a pre-computed topological scheduler — it pops one node's pending execution off a stack, runs it, and pushes its downstream nodes back on. A node with multiple `main` inputs (e.g. Merge) that's still missing a branch is simply skipped and picked up again once the missing data arrives.

Which of a node's methods actually runs depends purely on what the node implements — `execute()` for ordinary action nodes, `poll()` for polling triggers, `trigger()` for event/cron triggers, `webhook()` for the per-request handler of a webhook trigger, `supplyData()` for AI sub-nodes. Each gets a different "context" object (`ExecuteContext`, `PollContext`, `TriggerContext`, `WebhookContext`, `SupplyDataContext`, ...) as `this` — the concrete API surface a node's code can call differs by which one it's running under.

**AI tool-calling reuses this same generic mechanism** — a node's `execute()` can return an `EngineRequest` ("please also run these nodes for me") instead of normal output, and the engine folds the requested actions back into the same stack. There's no special-cased "agent execution mode."

## Two axes of "how is this deployed," and they're independent

1. **Execution mode**: `regular` (one process does everything, default) vs `queue` (work split across `main`/`worker`/optionally a dedicated `webhook` process over Bull/Redis — not officially supported with SQLite).
2. **Trigger registration**: webhook triggers are DB-persisted and HTTP-routed regardless of execution mode; poll/schedule triggers are tracked in-memory per instance by default, with a separate "durable" implementation that only activates when *two* specific flags are both set (see `references/pitfalls.md`). Turning on queue mode does not, by itself, make trigger registration distributed/durable.

## Errors — two families, don't conflate

A node's own `execute()` throws `NodeApiError`/`NodeOperationError` when an external call or its own logic fails — these attach to the failing node's execution data and surface in the editor. Separately, the wider backend codebase (`packages/core`, `packages/cli`) uses a newer three-way taxonomy — `UserError` (the builder's fault, fixable), `OperationalError` (transient/expected, e.g. a network call failing), `UnexpectedError` (an internal invariant broke) — that replaced a now-deprecated `ApplicationError`. The exact relationship between the two families isn't confirmed (see `research/unresolved.md`); treat them as two distinct, purpose-specific error vocabularies rather than one hierarchy.
