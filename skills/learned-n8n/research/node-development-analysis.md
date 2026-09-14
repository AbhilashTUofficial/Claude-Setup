# Research: building a custom node

Sources: `packages/nodes-base/`, `packages/node-dev/`, `packages/@n8n/node-cli/`, `packages/workflow/src/interfaces.ts`. Sample: 5 full node implementations + 2 CLI-generated templates + 4 credential files, chosen for structural diversity (declarative/programmatic, resource-op/single-op, polling/webhook trigger) out of 309 node directories / 560 `.node.ts` files — roughly 1-2% of `nodes-base` by file count, cross-checked against n8n's own `.agents/*.md` authoring guides (see below), which describe the general pattern rather than just the sampled files.

## The authoritative contract (`packages/workflow/src/interfaces.ts`)

- `INodeType` (`:2559-2616`) — only `description: INodeTypeDescription` is required. Everything else optional: `execute?`, `poll?`, `trigger?`, `webhook?`, `methods?` (`loadOptions`, `listSearch`, `credentialTest`, `resourceMapping`), `webhookMethods?`, `supplyData?` (AI sub-nodes), `customOperations?` (declarative per-op override, mutually exclusive with `execute`).
- `INodeTypeDescription` (`:3099-3145`) — required `version`, `defaults`, `inputs`, `outputs`, `properties`; optional `credentials?`, `polling?`, `requestDefaults?` (declarative base URL/headers), `webhooks?`.
- `INodeProperties` (`:2171-2210`) — `displayName`/`name`/`type`/`default` required; `displayOptions` (conditional show/hide), `routing?` (declarative hook).
- `ICredentialType` (`:417-464`) — `name`/`displayName`/`properties`; optional `extends?: string[]` (inherit a base credential, e.g. `oAuth2Api`), `authenticate?`, `test?`.
- `IAuthenticate` (`:344-349`) — either a plain async function `(credentials, requestOptions) => Promise<IHttpRequestOptions>`, or a declarative `IAuthenticateGeneric` object applied automatically to every outgoing request.
All **Verified-in-code**.

**v2.41.0-specific note**: `IPollFunctions` (`:1510-1541`) now carries engine-internal cursor machinery (`getPollBudgetMs()`, `__emit`, `__commitCursor?`) that the real node sampled (`AirtableTrigger.poll()`) does not call directly — these appear to be engine-side plumbing, not part of the author-facing contract. There's also a second, newer `abstract class Node` (`:2709-2720`) with an `execute(context, response?)` → `EngineRequest` signature for sub-execution orchestration; none of the 5 sampled nodes use this form (all use `class X implements INodeType`) — **Unconfirmed** which built-in nodes, if any, use it.

## Two node styles, both current

**Declarative** (no `execute()`; routing does the work) — sampled: `Currents.node.ts`. `requestDefaults: { baseURL, headers }`; each operation's `routing: { request: { method, url } }` (URL can itself be an expression); `routing.send`/`routing.output.postReceive` map params into the request / unwrap the response envelope. No `execute()` at all — the engine builds and fires the HTTP request from the declared routing. **Verified-in-code.**

**Programmatic** (`execute()` does everything by hand) — sampled: `ConvertKit.node.ts` (494 lines). `for (let i = 0; i < items.length; i++)` loop, `getNodeParameter(name, i)`, hand-written HTTP wrapper via `this.helpers.httpRequestWithAuthentication`, `this.helpers.constructExecutionMetaData(...)` for pairedItem, and a per-item `try/catch` supporting `continueOnFail()`. **Verified-in-code.**

n8n's own guidance (`.agents/nodes.md`, `.agents/workflow.md`, shipped into every `@n8n/node-cli`-scaffolded project) is explicit: **prefer declarative** for simple HTTP/REST calls; use programmatic only for multiple dependent calls, complex branching, or heavy transformation — and explain why declarative wouldn't work if programmatic is chosen. **Documented** (n8n's own first-party guide).

## Triggers

- **Polling** (`AirtableTrigger.node.ts`) — `polling: true`, `inputs: []`. `poll(this: IPollFunctions)` builds a cursor query off `getWorkflowStaticData('node')`-persisted state, returns new items or `null`. Special-cases `getMode() === 'manual'` (editor's "test step" button) to fetch just one record.
- **Webhook, app-registered** (`CurrentsTrigger.node.ts`) — `webhooks: [{ name: 'default', httpMethod, responseMode, path }]`. `webhookMethods.default.{checkExists,create,delete}` (`this: IHookFunctions`) register/tear down the webhook against the third-party API on workflow (de)activation, persisting the returned hook id + a generated secret via `getWorkflowStaticData('node')`. `webhook(this: IWebhookFunctions)` is the actual per-request handler — verifies signature, filters events, returns `{ workflowData: [...] }` to start a run.
- This is distinct from the generic core `Webhook` node (a static URL n8n exposes, no `webhookMethods`) vs. an app-specific trigger that *registers itself* with the third-party service's own webhook API. **Verified-in-code.**

## Credentials — three patterns traced end to end

1. **Declarative `authenticate`** (`CurrentsApi.credentials.ts`) — `IAuthenticateGeneric`, `{ headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } }`, applied automatically to every request the routing builds.
2. **Function-form `authenticate`** (`ConvertKitApi.credentials.ts`) — an async function that inspects the target URL and conditionally puts the secret in the body vs. query string; the node itself never touches the credential value — the framework runs this function to mutate request options before the call goes out.
3. **OAuth2 by inheritance** (`AirtableOAuth2Api.credentials.ts`) — `extends: ['oAuth2Api']`, only provider-specific constants (`authUrl`, `scope`) overridden; the base credential type supplies the whole authorize/token-exchange/refresh flow.
All **Verified-in-code**; pattern 3 also confirmed present in the current `@n8n/node-cli` GitHub-Issues scaffold template, so it's the standard current idiom, not legacy-only.

## Tooling — a real docs-vs-reality gap

**`packages/node-dev` is deprecated** — its own README opens with "⚠️ Deprecated — This package is deprecated and no more updates will be published to npm" (`node-dev/README.md:3-5`). It still functionally scaffolds 4 templates and runs `tsc` + asset copy into `~/.n8n/custom/`, but has no linting, no bundling, no "run n8n for you" capability.

**The current tool is `@n8n/node-cli`** (binary `n8n-node`, scaffolded via `npm create @n8n/node@latest`): `n8n-node dev` actually **runs a real n8n instance** on `localhost:5678` with hot reload (materially more capable than old `build --watch`, which only compiled+copied); `n8n-node build` produces a publish-ready `dist/`; `n8n-node lint [--fix]` runs `eslint-plugin-n8n-nodes-base` + community-node rules; `n8n-node cloud-support enable|disable` toggles strict-mode ESLint required for n8n Cloud verification; `n8n-node release` does a full build→lint→changelog→tag→publish flow. **Documented + Verified-in-code.**

**`CONTRIBUTING.md` is stale on this exact point** — it lists the deprecated `node-dev` first under "CLI to create new n8n-nodes" without flagging the deprecation, and only mentions `@n8n/node-cli` in passing (re: a hot-reload env var). A contributor or agent reading only `CONTRIBUTING.md` would reach for the wrong tool. **Verified-in-code** (direct read of both `CONTRIBUTING.md` and both packages' READMEs).

Node discovery contract (both `nodes-base/package.json` and generated `@n8n/node-cli` templates): a `"n8n"` package.json field — `{ n8nNodesApiVersion, nodes: [...], credentials: [...] }` — is literally how n8n's loader finds compiled node/credential files.

## n8n's own AI-authoring guide for node development

`@n8n/node-cli`'s scaffolding ships a `.agents/` folder (`nodes.md`, `nodes-declarative.md`, `nodes-programmatic.md`, `properties.md`, `credentials.md`, `versioning.md`, `workflow.md`) into every generated community-node project — n8n's first-party, current instructions for an AI agent building n8n nodes. **Judgment**: this is more authoritative for "how should an agent build a node" than reverse-engineering conventions from `nodes-base` source, since it's prescriptive and current rather than derived. Key content: resource/operation UX conventions (return-all+limit toggle, "Simplify Output" toggle), the full expressions/`displayOptions` mechanism including `{_cnd: {...}}` condition syntax and `@version` gating, three dynamic-options mechanisms (`loadOptionsMethod`, `resourceLocator`+`listSearch`, `resourceMapper` — "use only when necessary"), and a hard rule: **do not introduce full versioning (`extends VersionedNodeType`) on a node's first version** — only "light versioning" (`version: [1, 1.1, 1.2]`) is appropriate initially.

## Common patterns

Resource+Operation top-level params driving `displayOptions.show` everywhere; a near-universal `subtitle` expression (`'={{$parameter["operation"] + ": " + $parameter["resource"]}}'`); per-resource description files spread into the main node's `properties` array; a per-node-folder `GenericFunctions.ts` HTTP wrapper shared by `execute()` and `loadOptions`; `returnAll`+`limit` pairing on every "Get Many" op; `getWorkflowStaticData('node')` as the de facto cursor/state store for both polling and webhook-registration state; `usableAsTool: true` — a single boolean that lets an ordinary action node double as an AI-agent tool with zero extra code.

## Pitfalls

1. `node-dev` in the repo is dead — don't build tooling advice around it.
2. Declarative nodes cannot use full versioning, only programmatic ones can.
3. `IPollFunctions`'s underscore-prefixed cursor methods are engine-internal, not author-facing, despite being visible on the type.
4. Two coexisting node base shapes (`implements INodeType` vs. the newer `abstract class Node`) — which built-ins use the class form is unconfirmed.
5. A credential's `authenticate` function receives the *already-built* request and can mutate it conditionally per-request (not just static header injection).
6. `CONTRIBUTING.md` points a reader at the wrong (deprecated) node-dev tool.

## Coverage

~1-2% of `nodes-base` by file count, deliberately diverse rather than random. Not read: AI/LangChain nodes (covered separately in `ai-agent-nodes-analysis.md`), `V1`/`V2` versioned-node directories beyond confirming they exist, resourceMapper/paired-item edge cases, the node-loading runtime in `core`/`cli` (how the `"n8n"` package.json field actually gets resolved at boot), the community-node ESLint rule implementations.
