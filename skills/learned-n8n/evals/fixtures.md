# Eval fixtures — n8n

## Known-answer questions

1. **Q:** Why can't you just look up a node's parent nodes directly from `workflow.connections`?
   **A:** `connections` is indexed by source node, not destination — you have to invert it via `mapConnectionsByDestination()` first to look up predecessors. From `references/mental-model.md` / `references/pitfalls.md`.

2. **Q:** Should a new n8n community node use `node-dev` or `@n8n/node-cli`?
   **A:** `@n8n/node-cli` (`n8n-node`) — `node-dev` is deprecated, even though `CONTRIBUTING.md` lists it first. From `references/building-nodes.md`.

3. **Q:** What's the difference between an AI Agent node and a Chain node in n8n?
   **A:** Chains are fixed, single-pass prompt→LLM pipelines with no memory support at all; Agents can use memory, call tools, and make multi-step decisions. Use an Agent whenever conversation context or tool use is needed. From `references/ai-agents.md`.

4. **Q:** Is the embedded "n8n Assistant" the same system as the AI Agent workflow node?
   **A:** No — the Agent node is LangChain-based; n8n Assistant (Instance AI) runs on a separate, n8n-authored package built on the Vercel AI SDK. Instance AI can *build* workflows that contain Agent nodes, but they're different systems. From `references/ai-agents.md`.

5. **Q:** If I turn on `EXECUTIONS_MODE=queue`, are my poll-trigger nodes now durable/distributed?
   **A:** Not automatically — the durable poll-trigger engine only activates when *both* `scheduler.enabled` and `workflows.useWorkflowPublicationService` are set; otherwise it silently falls back to a legacy in-memory poller. From `references/pitfalls.md`, item 3.

## Implementation check

**Task:** Add a "when NOT to use a Chain node" check to an AI workflow design.
**Result:** Fully answerable from `references/ai-agents.md` alone: don't use a Chain if the workflow needs to reference earlier conversation turns — Chains have no memory support; use an Agent with a Memory sub-node instead.

## When-NOT-to-use check

**Q:** Give a concrete scenario where n8n is the wrong choice.
**A:** A high-throughput, sub-millisecond request/response service, or a single simple cron script with no cross-service integration — n8n's stack-based, DB-backed execution model is built for orchestration, not a hot low-latency path. Matches `references/decision-guide.md`.
