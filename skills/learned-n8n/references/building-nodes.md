# Building a custom node

Full evidence and citations: `research/node-development-analysis.md`.

## Tooling — use the current one

**Use `@n8n/node-cli` (`n8n-node`), scaffolded via `npm create @n8n/node@latest`.** Do not use `packages/node-dev` (`n8n-node-dev`) — it is deprecated (its own README says so), and n8n's own `CONTRIBUTING.md` is stale on this point (lists the deprecated tool first). `n8n-node dev` runs a real local n8n instance with hot reload; `n8n-node build` produces a publish-ready `dist/`; `n8n-node lint [--fix]` runs the community-node ESLint rules; `n8n-node release` handles the full build→lint→changelog→tag→publish flow.

**Read n8n's own `.agents/*.md` authoring guides** (shipped into every scaffolded project's `.agents/` folder — `nodes.md`, `nodes-declarative.md`, `nodes-programmatic.md`, `properties.md`, `credentials.md`, `versioning.md`, `workflow.md`) before hand-deriving conventions from `nodes-base` source — they're n8n's first-party, current, prescriptive answer to "how should this be built," not something to reverse-engineer.

## The contract

An `INodeType` needs only a `description: INodeTypeDescription`. Everything else — `execute`, `poll`, `trigger`, `webhook`, `supplyData`, `methods` — is optional and present only for the capabilities the node actually has. `INodeTypeDescription` requires `version`, `defaults`, `inputs`, `outputs`, `properties`; a declarative node additionally sets `requestDefaults` (base URL/headers) and puts `routing` on individual properties/operations instead of implementing `execute`.

## Two styles

**Declarative** — no `execute()` at all. `requestDefaults: { baseURL, headers }` on the node description; each operation carries `routing: { request: { method, url } }` (the URL can itself be an expression); parameters carry `routing.send` (map into query/body) or `routing.output.postReceive` (unwrap the response envelope). The engine builds and fires the HTTP request from the declared routing.

**Programmatic** — `execute()` loops over input items by hand (`for (let i = 0; i < items.length; i++)`), reads params via `getNodeParameter(name, i)`, calls a hand-written HTTP wrapper (`this.helpers.httpRequestWithAuthentication`), wraps results with `this.helpers.constructExecutionMetaData(...)` to preserve `pairedItem`, and wraps the per-item body in try/catch supporting `continueOnFail()`.

**Default to declarative.** Use programmatic only for multiple dependent calls, complex branching, or heavy response transformation.

## Credentials

Three real patterns, pick based on the API's auth model:
1. **Declarative `authenticate`** — a static `IAuthenticateGeneric` object (e.g. `{ headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } }`) applied automatically to every request.
2. **Function-form `authenticate`** — an async function receiving the already-built request options, free to inspect/mutate them conditionally (e.g. put the secret in the body for one endpoint, the query string for others).
3. **OAuth2 by inheritance** — `extends: ['oAuth2Api']`, overriding only provider-specific constants (`authUrl`, `scope`); the base credential type supplies the whole authorize/refresh flow.

The node itself never reads the decrypted credential value directly in patterns 1/2 — the framework applies it.

## Triggers

**Polling** — `polling: true`, implement `poll()`, persist your cursor via `getWorkflowStaticData('node')` (survives across ticks). Special-case `this.getMode() === 'manual'` to fetch just one record for the editor's "test step" button.

**Webhook, app-registered** — implement `webhookMethods.{checkExists,create,delete}` to register/tear down a webhook subscription with the third-party API on workflow (de)activation (persist the returned id/secret via `getWorkflowStaticData('node')`), and `webhook()` for the actual per-request handler. This is distinct from the generic core Webhook node, which just exposes a static n8n URL with no external registration step.

## Common conventions worth matching

- Resource + Operation top-level params, `noDataExpression: true`, driving the rest of the UI via `displayOptions.show`.
- `subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}'` on the canvas.
- `returnAll` + `limit` pairing on every "Get Many" operation.
- `usableAsTool: true` — one boolean flag lets an ordinary action node double as an AI-agent tool with zero extra code (see `references/ai-agents.md`).
- Split per-resource property/operation definitions into their own files, spread into the main node's `properties` array, to keep the main `.node.ts` short.

## Versioning

Start with **light versioning** (`version: [1, 1.1, 1.2]`, checked via `this.getNode().typeVersion` at runtime) — do not introduce **full versioning** (`extends VersionedNodeType`, one class per major version) on a node's first version; that's only for a node that has genuinely outgrown light versioning. Declarative nodes can only use light versioning.
