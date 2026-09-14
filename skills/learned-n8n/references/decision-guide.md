# Decision guide — n8n

## Use n8n when

- You need to automate a process that connects several services/APIs together, with a visual, inspectable graph rather than a hand-rolled script — especially when non-engineers need to see or adjust the flow.
- You want an **AI agent workflow** with tool use, memory, and multi-step reasoning, composed visually from swappable pieces (any LLM provider, any tool, any memory backend) rather than hard-coded in application code — n8n's `ai_*` sub-connection model (`references/ai-agents.md`) is purpose-built for this.
- You need self-hosting for compliance/data-residency reasons — n8n is source-available and genuinely self-hostable (not a hosted-only product with an on-prem afterthought), confirmed by the depth of the local Docker/deployment tooling.
- You want to expose a workflow as a callable tool to other AI systems, or consume external tools inside a workflow — via the MCP client (`McpClientTool`) and MCP server (`McpTrigger`) nodes.

## Do NOT use n8n when

- **You need a single, simple scheduled script or a one-off data transform with no integration surface.** A cron job or a small script is less overhead than standing up a workflow-automation platform for something that doesn't touch multiple external services.
- **You need sub-millisecond or very high-throughput request/response latency.** n8n's execution model (a stack-based engine, per-item processing, DB-backed execution records) is built for orchestration and integration, not a hot request path.
- **You're building the actual product's core business logic**, not integration/automation glue. n8n workflows are good at "when X happens, do Y across these systems" — they're a poor fit as the primary logic layer of an application with complex, tightly-coupled internal state.
- **You need true real-time streaming data processing** (e.g. continuous high-frequency event streams) — n8n's trigger/execution model is built around discrete workflow runs, not a streaming-data pipeline.
- **Community edition, and you need workflow/credential sharing across multiple users, environments/Git-based promotion, or external secrets management** — these are paid-tier features on self-hosted n8n; budget for that or accept single-owner workflows if staying on Community.

## Declarative vs. programmatic node style (if building a custom node)

Prefer **declarative** (no `execute()`, routing-driven) whenever the integration is basically simple HTTP/REST calls — it's less code and n8n's own authoring guidance defaults to it. Reach for **programmatic** (`execute()` does everything) only when you have multiple dependent calls, complex branching logic, or heavy response transformation — and n8n's own convention is to note *why* declarative wouldn't work when you choose programmatic. See `references/building-nodes.md`.

## Regular vs. queue execution mode (if self-hosting)

Stay on **regular mode** (default) unless you specifically need horizontal scaling of execution across multiple worker processes/machines — it's simpler to operate and the only mode SQLite officially supports. Move to **queue mode** (Postgres required) when execution volume genuinely needs to scale beyond one process, and budget separately for whether you also need the durable poll-trigger scheduler flags (see `references/pitfalls.md`) — queue mode alone doesn't make polling durable.
