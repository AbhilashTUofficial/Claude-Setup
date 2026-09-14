# API, CLI, configuration, deployment

Full evidence and citations: `research/api-cli-deployment-analysis.md`.

## Two REST APIs — pick the right one

- **`/rest/*`** — the internal API the editor UI itself uses (session-cookie auth). Not a supported public contract; don't build external integrations against it even though it's easy to find by inspecting network traffic.
- **`/api/v1/*`** — the actual **Public API**, documented and versioned, for external integrators. Auth via `X-N8N-API-KEY` header, Bearer JWT, or session cookie. Swagger UI at `/api/v1/docs`, raw OpenAPI spec at `/api/v1/openapi.yml` (no auth). Resource groups: `/workflows`, `/executions`, `/credentials`, `/tags`, `/users`, `/projects`, `/variables`, `/workflows/:id/test-runs` (evaluations), `/data-tables` (+rows/columns), `/community-packages`, and several more.

## CLI — the commands that actually matter operationally

| Command | Use it for |
|---|---|
| `n8n start` | The default full server (API + UI + webhooks + execution), single process. |
| `n8n worker --concurrency=N` | A scaling-mode execution worker — **only meaningful with `EXECUTIONS_MODE=queue`**, and forces queue mode on itself regardless of config. |
| `n8n webhook` | A dedicated process that only intercepts production webhook calls — **hard-requires queue mode** (the main process can't otherwise see/cancel executions running in a separate process). |
| `n8n execute --id=<id>` | Run one workflow synchronously in-process, useful for scripting/testing — doesn't support queue mode. |
| `n8n export:workflow` / `import:workflow` | JSON backup/migration. `--backup` = `--all --pretty --separate`. Note: `--activeState=fromJson` on import only works in queue/multi-main mode. |
| `n8n export:credentials --decrypted` | Dumps **plaintext** credentials — only for migrating to an instance with a different encryption key; treat the output as a live secret. |
| `n8n publish:workflow` / `unpublish:workflow` | The current way to manage a workflow's active/published version — `n8n update:workflow` is deprecated in favor of these. |
| `n8n ttwf:generate --prompt=...` | Generates a workflow from a natural-language prompt (n8n's AI workflow-builder capability, available from the CLI too). |

`n8n --help` also surfaces module-contributed commands not visible just by listing the `commands/` directory.

## Configuration — pure environment variables

Every config value is env-var driven (`@n8n/config`), and **every single field also transparently supports a `<VAR>_FILE` variant** that reads the value from a file instead — this isn't just documented for the six Postgres variables the docker README calls out, it applies to the whole schema (encryption key, license key, Redis password, everything).

Consequential knobs:
- `DB_TYPE` — `sqlite` (default, single-process only) or `postgresdb` (required for queue mode / horizontal scaling).
- `EXECUTIONS_MODE` — `regular` (default) or `queue`.
- `N8N_ENCRYPTION_KEY` — if unset, a random key is generated and persisted to the `.n8n` settings folder on first run; **losing that folder loses the ability to decrypt stored credentials.** A `worker` process needs the key handed to it explicitly (via env or the settings file) — it won't generate one itself.
- **Three separate Redis configuration surfaces exist** — don't conflate them: the Bull job queue (`QUEUE_BULL_REDIS_*`), the generic cache backend (`N8N_CACHE_REDIS_*`, only relevant if `N8N_CACHE_BACKEND=redis`), and a standalone key-prefix setting (`N8N_REDIS_KEY_PREFIX`).
- `N8N_RUNNERS_MODE` — `internal` (default, in the main process) or `external` (a separate task-runner process/container). **Code-node JavaScript/Python execution happens in the task runner, not the main server process, by default.**

## Deployment

The root README's `docker run` quick start is genuinely minimal — for a real self-hosted setup, the `curl -fsSL https://get.n8n.io | sh` / `docker/get-n8n-compose.yml` path provisions a materially richer stack: an mTLS-secured code-execution sandbox (isolated from the main n8n process), a dedicated task-runner service, and a self-hosted search service. Building the Docker image from source now requires a pre-compiled `./compiled` directory (`pnpm build:docker`) — a real breaking change versus older build instructions.

## Scaling — three things that scale independently

Turning on `EXECUTIONS_MODE=queue` parallelizes **execution** across `worker` processes. It does **not**, by itself, make trigger registration distributed or durable — see `references/pitfalls.md` for the specific poll-trigger gotcha.
