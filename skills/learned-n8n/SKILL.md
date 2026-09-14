---
name: learned-n8n
description: "How to build with n8n (v2.41.0): the workflow/node/connection data model, the execution engine, custom node development (declarative vs programmatic, current tooling), the REST API and CLI, self-hosting/deployment/scaling, expressions, and AI agent workflows (n8n's distinctive ai_* sub-connection / cluster-node model, and how it differs from the embedded n8n Assistant). Use when building, debugging, deploying, or writing custom nodes/integrations for n8n, or building AI agent workflows in n8n."
metadata:
  knowledge_schema_version: 1
  learned_skill: true
---

# n8n

A workflow-automation platform: workflows are graphs of nodes connected by typed connections, triggered by events/schedules/webhooks, moving data as item arrays. Its most distinctive feature is a separate connection-type system (`ai_*`) that lets AI agent workflows wire in models/tools/memory as live objects rather than data — see `references/ai-agents.md`.

Studied at `2.41.0` as of 2026-09-24 (local repo, commit `46be5421...`, plus `docs.n8n.io` and `n8n.io`). See `metadata.yaml` for full provenance and `research/unresolved.md` for what this does not yet cover — notably, this ingestion deliberately excludes n8n's own contributor-process conventions (lint layering, TypeORM boundary rules, PR/security-fix hygiene), which are process for contributing to n8n itself, not transferable technology knowledge for building *with* n8n.

## When to use this / when not to

n8n fits multi-service integration/automation and AI agent orchestration, self-hosted or cloud — it's a poor fit for a single simple scheduled script, a high-throughput low-latency request path, or as an application's core business-logic layer. Full reasoning in `references/decision-guide.md`.

## Reference files

Read only what the current task actually needs.

- `references/mental-model.md` — the workflow/node/connection/data/execution model
- `references/decision-guide.md` — when to use n8n / when not to, declarative-vs-programmatic, regular-vs-queue-mode
- `references/building-nodes.md` — building a custom node: current tooling, the `INodeType` contract, credentials patterns, triggers
- `references/ai-agents.md` — the `ai_*` sub-connection model, the node catalog, MCP, n8n Assistant vs. the Agent node
- `references/api-cli-deployment.md` — the two REST APIs, CLI commands, configuration, Docker/scaling
- `references/expressions.md` — the `{{ }}` expression syntax and what context is available inside it
- `references/pitfalls.md` — ten specific, verified gotchas worth knowing before you hit them

Do not read `research/` for ordinary questions — it's the raw, cited evidence behind the files above (five research angles plus a coverage ledger), useful only when `references/` genuinely doesn't answer the question at hand.

## If this feels stale

Check `metadata.yaml`'s `freshness` field, and be aware `docs.n8n.io` may describe a newer release than `2.41.0` (no version selector was found on the docs site during research — see `references/pitfalls.md`, item 8). If this looks outdated, suggest `/knowledge-forge refresh n8n`.
