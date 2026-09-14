# Pitfalls

Full evidence and citations: see the relevant `research/*.md` file for each item.

1. **`workflow.connections` is indexed by source node, not destination.** Finding a node's parents requires `mapConnectionsByDestination()` first; finding children uses the raw map directly. Both a source-indexed and a destination-indexed map are the *same* TypeScript type, so nothing statically warns you if you pass the wrong one to a traversal function. (`workflow-execution-analysis.md`)

2. **`packages/node-dev` is deprecated; `CONTRIBUTING.md` doesn't say so.** Use `@n8n/node-cli` (`n8n-node`) instead — it's the actually-maintained tool with hot reload, linting, and a real publish flow. (`node-development-analysis.md`)

3. **Queue mode does not make trigger registration durable by itself.** Poll triggers have two swappable implementations — a legacy in-memory poller and a newer durable one — and the durable one only activates when *both* `scheduler.enabled` **and** `workflows.useWorkflowPublicationService` are set. Enabling just one silently falls back to the legacy in-memory poller with only a log warning, no hard error. (`api-cli-deployment-analysis.md`)

4. **`EXECUTIONS_MODE=queue` is explicitly not officially supported with SQLite.** Use Postgres if you need queue mode.

5. **Three separate Redis configuration surfaces exist and are easy to conflate**: the job queue, the generic cache backend, and a standalone key-prefix setting. Setting one doesn't configure the others.

6. **"Environment" means two different things in n8n's own docs**: the ordinary `N8N_*` config-via-env-vars mechanism, and a distinct Git-branch-per-deployment "environments" feature (source control) where each branch maps to a separate running instance. Don't assume a docs page about "environments" means env vars, or vice versa. (`docs-analysis.md`)

7. **n8n ships two independent AI agent runtimes.** The canvas AI Agent node is LangChain-based. The embedded "n8n Assistant" / Instance AI product feature is built on a separate, n8n-authored package on top of the Vercel AI SDK — no LangChain involved. They're related (Instance AI can *build* workflows containing Agent nodes) but are not the same system under two names. (`ai-agent-nodes-analysis.md`)

8. **`docs.n8n.io` may describe a newer release than whatever version you have installed** — no version selector was found on the site as of this research. Cross-check anything version-sensitive against the actual installed `package.json` version and, ideally, source, rather than assuming docs parity. This skill's own `metadata.yaml` records exactly which version was studied.

9. **A `worker` process needs the encryption key handed to it explicitly** (env var or settings file) — unlike `n8n start`, it will not generate and persist a random one itself if none is found.

10. **AI chain nodes have no memory support at all** — only Agent nodes do. If a workflow needs to reference earlier conversation turns, a Chain is the wrong node regardless of how it's configured.
