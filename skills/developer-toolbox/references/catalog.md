# Learned-technology catalog

Generated and maintained by `knowledge-forge` — one row per `skills/learned-<slug>/` skill. **Do not hand-edit this file**; run `/knowledge-forge <source>` or `/knowledge-forge refresh <technology>` instead, which updates exactly one row.

Row format:

| Technology | Purpose | Primary use cases | Don't use for | Version studied | Freshness | Skill |
|---|---|---|---|---|---|---|
| n8n | Workflow automation / AI agent orchestration platform | Multi-service integration workflows; AI agent workflows with tools/memory/RAG; exposing workflows as MCP tools | A single simple cron script; a high-throughput low-latency request path; an application's core business logic | 2.41.0 | fresh | `learned-n8n` |
| three.js | Real-time 3D rendering in the browser (WebGL/WebGPU) | Interactive 3D visualizers/configurators, photorealistic product shots, games, WebXR | Offline-rendered maximum-fidelity stills; flat 2D UI; AAA-scale native rendering | 0.160.0 | fresh | `learned-threejs` |

Add new rows below the header as `learned-<slug>` skills are created. `Freshness` is copied from that skill's `metadata.yaml` at the time of the most recent write to this row — it can go stale between refreshes; `developer-toolbox` reads it as a hint, not a live guarantee.
