# Research workspace layout

```
research/<topic-slug>/
├── research-plan.md        # the objective, research questions, chosen mode
├── agent-assignments.md    # which agent got which assignment, availability log
├── responses/
│   ├── chatgpt.md
│   ├── gemini.md
│   ├── perplexity.md
│   ├── copilot.md          # only if reached
│   └── claude.md           # your own independent research
├── evidence-ledger.md       # per-claim verification status + source
├── disagreements.md         # cross-examination output
└── final-report.md          # the deliverable
```

`<topic-slug>` is a short kebab-case slug of the research topic (e.g. `veo-character-consistency`). Create it under `research/` in the current project directory unless the user names another location.

`node scripts/scaffold_research.js "<topic>" --mode Standard` creates the project folder, the top-level files (`research-plan.md`, `agent-assignments.md`, `disagreements.md`, `evidence-ledger.md`, `final-report.md`) with placeholders filled in, and an empty `responses/` folder — it does not pre-create per-agent response files, since you don't know which agents will be available until Phase 1. Run it once at the start of Phase 0; it refuses to overwrite an existing project folder. `--force` fully deletes and recreates the project folder (a real restart, including any already-collected responses) — only pass it if the user confirms they want to restart that project; ask first.

Before reusing a path, check whether research already exists there: an existing `research-plan.md` for the same or an overlapping topic means resuming or merging, not blindly overwriting. If the topic is genuinely new, a fresh slug avoids the question entirely.
