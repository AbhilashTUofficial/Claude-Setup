# Research: official docs & product framing (n8n.io, docs.n8n.io)

**Scope/version caveat (read first)**: `docs.n8n.io` describes what appears to be a current/rolling release, not confirmably v2.41.0 — no version selector was found anywhere on the site. Several concepts below were *initially* uncertain against the local source, and have since been **cross-verified**: "Data tables" and an evaluation framework (`test-runs`) are confirmed present in v2.41.0 via `api-cli-deployment-analysis.md`'s public-API controller findings; "Chat Hub" is confirmed present via `ai-agent-nodes-analysis.md`'s `ChatHubVectorStore*` nodes; an "AI Workflow Builder"-style capability is confirmed present via the `ttwf:generate` CLI command. **"Gateway credits" remains Cloud-only / not found anywhere in the local source** — treat as inapplicable to a self-hosted v2.41.0 instance.

## n8n.io (marketing site — flagged as such, used only for positioning language)

Positioning: visual canvas + code-level escape hatches, 500+ integrations, multi-agent setups, RAG support, MCP integration, human-in-the-loop approval, full execution visibility (inspect prompts/responses), self-hosted/on-prem/air-gapped/cloud deployment options, Git-based workflow version control. Self-describes as **"fair-code"** licensed (not plain open-source). **Judgment**: useful only for cross-checking terminology, not as a technical source — specific numbers (star counts etc.) are marketing claims, not verified facts.

## Canonical terminology (Key Concept Glossary, `docs.n8n.io/key-concept-glossary.md`)

| Term | n8n's own definition |
|---|---|
| Workflow | "A collection of nodes that automate a process. ... begin execution when a trigger condition occurs and execute sequentially." |
| Node | "Individual components that you compose to create workflows. ... define when the workflow should run, fetch/send/process data, define flow control logic, connect with external services." |
| Credential | "Store authentication information to connect with specific apps and services." |
| Trigger node | "A special node responsible for executing the workflow in response to certain conditions. All production workflows need at least one trigger." |
| Expression | "Allow you to populate node parameters dynamically by executing JavaScript code." |
| Canvas | "The main interface for building workflows in n8n's editor UI." |
| Cluster node | "Groups of nodes that work together to provide functionality in a workflow." — matches exactly what the AI-agent-nodes research independently verified in source (root+sub-node model). |
| Data pinning | "Temporarily freeze the output data of a node during workflow development." |

Elaborated elsewhere: **Execution** = "a single run of a workflow" — Manual (editor button) vs. Production (trigger/schedule/poll-initiated); on n8n Cloud, only *production* executions count toward paid quotas (manual/sub-workflow/error-workflow runs don't). **Credentials** page adds: saving a credential triggers a live test call; two OAuth modes — **Fixed** (same credential regardless of who runs the workflow) vs. **End-user** (each user's own credential used at runtime, private to them).

## Sub-workflows (product concept, not obvious from source alone)

Selecting nodes and "converting" them into a sub-workflow auto-generates an **Execute Workflow Trigger** as the entry point, with referencing expressions auto-rewritten as trigger parameters. Caveat: sub-workflow input/output allow all types by default — the user must manually constrain types if strict typing is wanted.

## AI/LangChain guide — n8n's own framing (hub: `docs.n8n.io/build/integrate-ai.md`; the README-linked `/advanced-ai/` URL has moved/404s)

- **Agents vs. Chains**: "Agents are more powerful than chains" — an agent "interprets input and decides which tools to use," a chain is a fixed call sequence with **no memory** (can't reference prior turns). Use agents for conversation context/tool use/decisions; chains for straightforward linear calls. Matches source: chain nodes have no memory sub-input, only Agent nodes do.
- **What agents do**: "a chain that knows how to make decisions." One configurable Agent node "can act as different types of agent depending on the settings" (specific type names not confirmed from docs alone — flagged Unconfirmed there; source confirms V3 is exclusively the tool-calling type, older versions implement the legacy named types).
- Execution-model detail: "the agent runs multiple times... an initial setup, followed by a run to call a tool, then another run to evaluate the response" — consistent with the source-verified `EngineRequest`/tool-calling-as-generic-re-queueing mechanism in `workflow-execution-analysis.md`.
- **LangChain in n8n**: "n8n's AI nodes implement LangChain's JavaScript framework," represented as **cluster nodes** — root nodes (Chains, Agents, Vector Stores) with sub-nodes (models, memory, tools, retrievers, embeddings, document loaders, output parsers, text splitters) attached. Any other n8n node can connect to LangChain nodes normally — they're first-class canvas citizens, not walled off. Explicit limitation restated: "none of n8n's chain nodes support memory."
- **Tools**: three built-in categories called out — Call n8n Workflow Tool (any workflow loadable as a callable tool), Custom Code Tool, HTTP Request Tool — plus pre-built service tools and an MCP-server registry.
- **Memory**: Simple/Buffer-Window (in-session) vs. external persistent stores (Redis, Postgres, MongoDB, Zep, Motorhead, Xata) — matches source's `memory/` node list exactly.
- **Vector stores/RAG**: pipeline = document loaders+text splitters (chunking) → embeddings (**n8n only supports text embeddings**, not image/other modalities) → retrievers. Which specific vector DBs are supported wasn't confirmed from docs alone but is directly confirmed from source (see `ai-agent-nodes-analysis.md`'s `vector_store/` list).

## Product-level concepts not obvious from source alone

- **Projects** — team workspace grouping for workflows/credentials, paid-tier gated on self-hosted.
- **Environments + source control** — "n8n uses Git-based source control to support environments": each **Git branch maps to a distinct n8n instance/environment**; a "Protected instance" mode locks production so only source-control-driven changes land there. **Worth flagging explicitly**: the docs reuse the word "environment(s)" for both this Git-branch-per-deployment concept *and* the unrelated generic `N8N_*` config-env-var mechanism — easy to conflate from source alone.
- **Custom variables**, **External secrets** (Vault-style integration), **Multi-main mode**, **Sharing** (Community edition = creator-only visibility, sharing requires paid tier), **Log streaming** — all paid-tier features.
- **Registered Community Edition** — a free-but-email-registered middle tier (between free Community and paid Enterprise) unlocking Folders, in-editor debug, execution-data annotation.

## Coverage / what wasn't reached

The exact current URL for a dedicated AI Agent node reference page (listing canonical agent-type names) wasn't found — flagged Unconfirmed rather than guessed. Vector-store-specific integration pages weren't individually fetched (source-code findings cover this instead). `build/ways-of-building-workflows/*` (Chat Hub, AI Workflow Builder, n8n Assistant docs pages) were found in the sitemap but not content-fetched — cross-verified as real via source instead (see above).
