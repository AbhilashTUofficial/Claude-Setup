---
name: knowledge-forge
description: "Deeply researches a technical source — a repository, documentation site, local files, or video/transcript material — and compiles the findings into a durable, source-backed learned-<slug> skill stored in this repo, so future sessions can reuse the knowledge cheaply instead of re-researching it. Also refreshes and inspects previously-compiled learned skills. Use on /knowledge-forge {source}, /knowledge-forge refresh {technology}, /knowledge-forge inspect {technology}, or when the user explicitly asks to study/learn/ingest a technology into Claude-Setup."
disable-model-invocation: true
argument-hint: "<source> | refresh <technology> | inspect <technology>"
---

# knowledge-forge

This skill turns an expensive, one-time research pass into a durable, cheap-to-reuse Claude Skill. It does not summarize documentation — it studies a source with the same discipline a careful engineer would (primary sources over memory, tests over docs, verified facts kept separate from judgment calls) and compiles the result into `skills/learned-<slug>/`, following the contract in `references/template/`.

**This skill never auto-triggers.** It's expensive and deliberate — only run it on explicit `/knowledge-forge` invocation, never because a task's shape merely resembles research.

## The three invocations

| Command | What it does |
|---|---|
| `/knowledge-forge <source>` | Full ingestion of a new source into a new `learned-<slug>` skill, or a full re-ingestion if one already exists for that slug. |
| `/knowledge-forge refresh <technology>` | Targeted incremental update of an existing `learned-<slug>` skill against a newer version/commit of its source. |
| `/knowledge-forge inspect <technology>` | Reports an existing `learned-<slug>` skill's freshness, coverage, and unresolved items — no research, just reads `metadata.yaml` and `research/unresolved.md`. |

`<source>` may be a local path, a GitHub URL, a documentation-site URL, or a local video/transcript file. `<technology>` is a slug matching an existing `skills/learned-<slug>/` directory.

## Before doing anything else

Read **`references/workflow.md`** now — it is the actual step-by-step procedure for all three invocations (discovery → classification → coverage planning → research → verification → compilation → evaluation → toolbox registration, or the refresh-specific variant). This file is a dispatcher; the workflow lives there so it can be detailed without bloating what's always loaded.

For a repository/docs-site/video/local-files source, also read **`references/source-adapters.md`** for source-type-specific discovery guidance before starting research.

When writing the actual `learned-<slug>` output, use the skeletons in **`references/template/`** — do not improvise the shape of a generated skill; the template exists so every learned skill stays structurally consistent and so `developer-toolbox`/`study` can rely on a fixed contract.

## Non-negotiable principles (detailed in workflow.md)

- **Primary sources beat model memory.** Every claim in the compiled output traces to a source or is explicitly tagged as a judgment/inference, never presented as verified fact when it isn't.
- **Claude is not being retrained.** This skill produces external, version-controlled files a future session reads — it does not and cannot make any model "remember" the source material.
- **Never read or write secrets.** Never open this repo's `credentials/` or any `.env`-shaped file in this repo or the source being studied, for any reason. Never write anything secret-shaped into generated output.
- **Never auto-commit or auto-push.** Produce files, run the evaluation pass, show a diff, and stop. The user commits.
- **Don't overwrite good knowledge with worse knowledge.** A refresh that would lose previously-verified detail gets flagged in the diff, not silently applied.
- **Match research depth to source size.** A single-file utility does not need five parallel research subagents; a large framework does. Scale the workflow's research-fanout step accordingly — abundant tokens are for thoroughness on sources that warrant it, not a mandate to over-research everything uniformly.

## Output

A new or updated `skills/learned-<slug>/` directory (see `references/template/`), an updated row in `skills/developer-toolbox/references/catalog.md`, and a plain-text summary of what was produced plus a suggested `git status`/diff for the user to review before committing.
