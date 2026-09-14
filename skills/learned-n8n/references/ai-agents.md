# AI agent workflows

Full evidence and citations: `research/ai-agent-nodes-analysis.md`, `research/docs-analysis.md`.

## The core idiom: sub-connections ("cluster nodes")

Alongside the ordinary `main` connection type (item-array data flow), n8n has 11 `ai_*` connection types (`ai_tool`, `ai_memory`, `ai_languageModel`, `ai_vectorStore`, `ai_embedding`, `ai_retriever`, `ai_reranker`, `ai_textSplitter`, `ai_document`, `ai_outputParser`, plus two unused-as-real-connections enum values `ai_agent`/`ai_chain`) that carry **live JavaScript/LangChain objects** — a configured model instance, a memory buffer, a callable tool — instead of item arrays.

- A **sub-node** (a chat-model connector, a tool, a memory store) has no `main` input and implements `supplyData()` instead of `execute()`.
- A **root node** (the AI Agent, a Chain, a Vector Store in certain modes) declares `ai_*`-typed inputs and pulls the connected sub-node's live object at execution time.
- Resolution is **eager and synchronous** — completely unlike `main` data flow, which moves through the engine's async stack-and-loop machinery. When a root node asks for its language model, the engine calls that sub-node's `supplyData()` right there in the call stack and hands back the object.
- n8n's own documentation calls this whole family **cluster nodes**: a root node visually clustering its connected sub-nodes on the canvas.
- An ordinary `main`-flow node can act as an agent tool with **zero extra code** by setting `usableAsTool: true` on its description, or by declaring an `ai_tool` output — the engine auto-wraps its `execute()`.

## What's on the canvas

- **Agent node** (root) — the current version is exclusively a tool-calling agent: gathers a model, optional fallback model, optional memory, tools, and an optional output parser via sub-connections, then runs an iterative reasoning/tool-calling loop. Older node versions implement several now-legacy named agent types, kept for backward compatibility.
- **AI Agent Tool** — the *same* agent logic, but exposed as an `ai_tool` sub-node itself (no `main` input) — this is how you build multi-agent/orchestrator setups: a parent Agent calling a child Agent as one of its tools.
- **Chains** (root, non-agentic) — fixed prompt→LLM→(optional parser) pipelines, single pass, **no memory support at all**. Use an Agent instead of a Chain whenever conversation context is needed.
- **Chat-model connectors** (sub-node, one per provider — OpenAI, Anthropic, Bedrock, Gemini, Groq, Mistral, local via Ollama, and many more).
- **Memory** (sub-node) — in-session buffer window (not safe under queue/multi-main mode) or an external persistent store (Postgres, Redis, MongoDB, Zep, Motorhead, Xata).
- **Tools** (sub-node) — Calculator, Code (JS/Python), HTTP Request, Wikipedia/WolframAlpha/SerpApi/SearXng, Think (a reasoning scratchpad), Vector Store (RAG-as-a-tool), and — distinctively — **Workflow** (call another n8n workflow as a tool).
- **Vector stores** — one node per backend, and its `inputs`/`outputs` *change shape based on a mode parameter*: `load`/`insert`/`update` behave like an ordinary `main` node; `retrieve` becomes a pure `ai_vectorStore` sub-node; `retrieve-as-tool` outputs `ai_tool` directly, turning the vector store into an agent-callable RAG tool with no separate Retriever node needed.
- **MCP** — two opposite directions, don't conflate: `McpClientTool` makes n8n an MCP **client** (external MCP server's tools become `ai_tool` connections); `McpTrigger` makes n8n an MCP **server** (the workflow itself becomes callable by other MCP clients, e.g. Claude Desktop).
- **Guardrails** — a normal `main`-flow content-safety node (jailbreak/PII/secret/topical checks), not a sub-node.

## "n8n Assistant" is a different system — don't conflate with the Agent node

n8n ships an embedded product assistant ("n8n Assistant" in the UI, "Instance AI" internally) that lets a user build/inspect/debug workflows via chat. **It is built on a completely separate stack** — n8n's own `@n8n/agents` package on top of the Vercel AI SDK, no LangChain dependency — distinct from the LangChain-based Agent node above. The relationship: Instance AI's `build-workflow` tool can itself *construct* workflows containing the LangChain-based Agent/Tool/Memory nodes described above (using node-embedded `builderHint` metadata meant for exactly this). **Instance AI is the builder; the canvas Agent node is one of the things it builds** — they are not the same feature under two names.

## Terminology, n8n's own words

**Agent**: "interprets input and decides which tools to use." **Chain**: "no memory, can't reference prior conversation turns." Embeddings support is **text only** in n8n (no image/other-modality embeddings).
