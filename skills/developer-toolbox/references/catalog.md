# Learned-technology catalog

Generated and maintained by `knowledge-forge` — one row per `skills/learned-<slug>/` skill. **Do not hand-edit this file**; run `/knowledge-forge <source>` or `/knowledge-forge refresh <technology>` instead, which updates exactly one row.

Row format:

| Technology | Purpose | Primary use cases | Don't use for | Version studied | Freshness | Skill |
|---|---|---|---|---|---|---|
| n8n | Workflow automation / AI agent orchestration platform | Multi-service integration workflows; AI agent workflows with tools/memory/RAG; exposing workflows as MCP tools | A single simple cron script; a high-throughput low-latency request path; an application's core business logic | 2.41.0 | fresh | `learned-n8n` |
| three.js | Real-time 3D rendering in the browser (WebGL/WebGPU) | Interactive 3D visualizers/configurators, photorealistic product shots, games, WebXR | Offline-rendered maximum-fidelity stills; flat 2D UI; AAA-scale native rendering | 0.160.0 | fresh | `learned-threejs` |
| react-chartjs-2 (`react-chartjs-2`) | React wrapper for Chart.js 4: one `<canvas>` + one live Chart.js instance; typed `Line/Bar/Pie/…` components or generic `<Chart type>`, ref access, click helpers | Standard business charts (line/bar/pie/doughnut/radar/polar/bubble/scatter, mixed) in React with Chart.js plugins (annotation, zoom, time adapters); live-updating dashboards of moderate size | Server-side/static image export; DOM/SVG-accessible or CSS-styled charts; 10^5+ points or per-frame streaming; exotic types (Sankey/treemap/maps) | 5.3.1 | fresh | `learned-react-chartjs-2` |

Add new rows below the header as `learned-<slug>` skills are created. `Freshness` is copied from that skill's `metadata.yaml` at the time of the most recent write to this row — it can go stale between refreshes; `developer-toolbox` reads it as a hint, not a live guarantee.
