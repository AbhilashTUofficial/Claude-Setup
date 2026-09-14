# Research: REST API, CLI, configuration, deployment

Sources: `packages/cli/src/`, `packages/@n8n/config/src/`, root `README.md`, `docker/`. All `Verified-in-code` unless marked otherwise.

## Two distinct REST APIs

**A. Internal/UI API** — session-cookie auth, powers the editor, not a supported public contract. ~35 controllers (`packages/cli/src/**/*.controller.ts`), `@RestController('/workflows')`-style decorators, mounted at **`/rest/<resource>`** (`N8N_ENDPOINT_REST`, default `rest`). Middleware chain per route: IP rate limit → user-keyed rate limit → auth → license-feature gate → scope/permission gate → controller middleware.

**B. Public API** — the documented, versioned, stable contract for external integrators. `packages/cli/src/public-api/v1/controllers/*.public.controller.ts`, `@PublicApiController('/path')`, mounted at **`/api/v1`** (`N8N_PUBLIC_API_ENDPOINT`, default `api`). Auth: API key (`X-N8N-API-KEY` header), Bearer JWT, or session cookie (for the in-app Swagger tester). Requests validated against the OpenAPI spec at request time via `express-openapi-validator`. Swagger UI at `/api/v1/docs`; raw spec at `/api/v1/openapi.yml` (no auth, CORS-open, intentionally public).

Resource groups confirmed present: `/workflows`, `/executions`, `/credentials`, `/tags`, `/users`, `/projects` (+nested `/folders`), `/variables`, `/workflows/:id/test-runs` (evaluations — **cross-verified**: this resolves the docs-angle's uncertainty about whether an evaluation feature exists in v2.41.0; it does), `/discover`, `/node-type-policies`, `/promotions`, `/insights`, `/roles`, `/source-control`, plus YAML-spec-only groups **`data-tables`** (+rows/columns — also cross-verified as present in v2.41.0, resolving the docs angle's uncertainty there too) and `community-packages`.

Example real routes (`workflows.public.controller.ts:229-813`): `GET/POST /api/v1/workflows`, `GET/PUT/DELETE /api/v1/workflows/:id`, `POST /api/v1/workflows/:id/{archive,activate,deactivate,publish,...}`, `GET /api/v1/workflows/:id/history`.

Public API *routes* always exist regardless of license/config; `N8N_PUBLIC_API_DISABLED`/license only gate the **API-key auth method** specifically, since the editor UI depends on the same routes over its own session cookie.

## CLI commands

Invocation: `packages/cli/bin/n8n` → `CommandRegistry.execute()`; `process.argv[2] ?? 'start'` picks the command.

| Command | Behavior |
|---|---|
| `start` (default) | Full server: DB-settings load, optional SQLite VACUUM, HTTP server, pruning/statistics services, scheduler, then activates workflows (via a new publication-outbox path or legacy `ActiveWorkflowManager.init()` depending on config). `-o/--open` opens the editor in a browser. |
| `worker` | Scaling-mode worker. **Forces `executions.mode='queue'` even if misconfigured.** `--concurrency` default 10, warns "UNSTABLE" below 5. |
| `webhook` | Dedicated production-webhook process. **Hard-requires queue mode** — throws if not, with the reason documented inline: the main process can't see executions in a separate process or signal it to stop one without the queue. |
| `execute --id=<id>` | Runs one workflow synchronously in-process. Explicitly falls back from queue mode to regular with a warning (CLI execute doesn't support queue mode). `--file` was removed — throws telling you to import then use `--id`. |
| `export:workflow`/`import:workflow` | JSON export/import. Selectors: exactly one of `--all`/`--id`/`--projectId`. `--backup` = `--all --pretty --separate`. Import's `--activeState=fromJson` **only allowed in queue/multi-main mode** — "workflow activation is not supported" in regular mode. |
| `export:credentials --decrypted` | Dumps **plaintext** credential data — explicit warning "ALL SENSITIVE INFORMATION WILL BE VISIBLE," intended for migrating to an instance with a different `N8N_ENCRYPTION_KEY`. |
| `update:workflow` | **Deprecated** — description literally says to use `publish:workflow`/`unpublish:workflow` instead. |
| `ldap:reset` | Deletes all LDAP-managed users (per its own description) — destructive. |
| `ttwf:generate --prompt=...` | Generates workflow(s) from a natural-language prompt via the AI text-to-workflow builder — **this is source-level evidence of an "AI Workflow Builder"-style capability existing in v2.41.0**, cross-verified against the docs angle's uncertain "ways of building workflows" bucket. |

`n8n --help` also lists commands contributed by feature **modules** at runtime (`ModuleRegistry.loadModules()`) — the command set is not fully static from the `commands/` directory alone.

## Configuration — `@n8n/config`, pure env-var driven

- `@Config`/`@Env('VAR', zodSchema?)`/`@Nested` decorators build one `GlobalConfig` class via `@n8n/di`.
- **Undocumented-in-README finding**: every `@Env`-decorated field transparently supports a `<VAR>_FILE` sibling reading the value from a file instead — the docker README documents this only for 6 Postgres vars, but it applies to *every* config field in the schema (encryption key, license key, Redis password, etc). The docs undersell this.
- A separate **legacy `config` object** (`packages/cli/src/config`) still exists alongside `GlobalConfig` for DB-stored runtime settings — not deep-dived (gap).

Consequential knobs: `DB_TYPE` (`sqlite` default | `postgresdb`); `EXECUTIONS_MODE` (`regular` default | `queue`) — **queue mode is explicitly "not officially supported with sqlite"** per an inline warning; three *independent* Redis surfaces exist (job queue `QUEUE_BULL_REDIS_*`, generic cache `N8N_CACHE_REDIS_*`, and a thin `N8N_REDIS_KEY_PREFIX`) — easy to conflate as "one Redis config," they're not; `N8N_ENCRYPTION_KEY`/`_FILE` — if unset, a random key is generated and persisted to the `.n8n` settings file on first run (losing that file loses credential decryption); a `worker` process with **no** settings file and **no** env key throws rather than generating one — workers must be handed the key explicitly; `N8N_RUNNERS_MODE` (`internal` default | `external`) — this is where Code-node JS/Python execution actually happens, **not in the main server process by default**.

## Docker / deployment

Root `README.md`'s quick-start (`docker run` + volume) confirmed accurate against the Dockerfile/entrypoint. The **`docker/get-n8n-compose.yml`** stack (behind `curl -fsSL https://get.n8n.io | sh`) is materially richer than the bare quick start: it provisions an mTLS code-execution sandbox subsystem (`sandbox-api`, a privileged Docker-in-Docker runner), a `runners` service wired to the task-runner broker, and a self-hosted search service — every non-`n8n` service explicitly commented "never publish this container's ports." **Derived**: the single-container quick start is the minimal/eval path; the compose stack is the intended batteries-included self-host topology with sandboxed code execution split out of the main process. Building the Docker image now requires a pre-compiled `./compiled` directory (`pnpm build:docker`) — a documented breaking change for recent releases.

## Queue mode / scaling — trigger registration is a third, orthogonal axis

Queue mode splits work across `main` (API/UI/webhook-routing-table), `worker` (executes jobs off the queue), and optionally a dedicated `webhook` process — but **enabling queue mode doesn't automatically distribute trigger registration**:
- **Webhook triggers**: routing tables live in the DB (`webhook_entity`), served by whichever process(es) have webhook serving enabled.
- **Poll triggers**: owned by `PollJobProvider`. There are **two swappable implementations** — a legacy in-memory poller and a new "durable poller chain." The durable one only activates when **both** `scheduler.enabled` **and** `workflows.useWorkflowPublicationService` are on; otherwise it silently falls back to the legacy in-memory engine with just a log warning. **This is a real, easy-to-miss operational gotcha** — enabling one flag without the other doesn't get you durable polling.
- **Schedule/cron triggers**: a separate, also durable-scheduler-backed registrar.

## Coverage

Not read in depth: legacy `packages/cli/src/config`, auth/SSO/MFA/LDAP internals, `@n8n/db` schema/migrations, `@n8n/task-runner` implementation (only its config surface), most individual Public API v1 controllers beyond confirming their base paths, `docker/images/engine/` and `docker/images/node-pc/` Dockerfiles.
