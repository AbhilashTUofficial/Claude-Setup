# Knowledge System Architecture — Pre-Implementation Research Report

Status: **research complete, nothing implemented**. Produced 2026-09-23 in a session scoped to research/architecture only — no skills, directories, or files beyond this report were created; nothing was committed or pushed. This document is the handoff artifact for the next session, which should be able to implement V1 directly from it without repeating the research below.

Evidence discipline used throughout: **Confirmed** (verified directly from current source/docs), **Inferred** (strong conclusion from confirmed evidence), **Proposed** (our architectural decision, not a fact), **Unknown** (not enough evidence). This report was itself produced by three parallel research passes (repo audit, live Claude Code Skills capability check, prior-art survey) that used this same discipline — the system being designed is meant to make that same rigor cheap to reuse later.

---

# Executive Summary

The core idea — study a technology once, deeply, and compile the result into a reusable Claude Skill instead of re-researching it every session — is sound and directly supported by how Skills actually work today: progressive disclosure (metadata always resident, body loaded on trigger, reference files loaded only when read) is *exactly* the mechanism this idea needs, and it already exists natively. No new infrastructure is required to get the core value.

The recommended architecture is a **hybrid of "every technology is its own skill" plus "a generated catalog for cheap discovery at scale"** (option H from the Phase 3 evaluation below), built entirely from plain files that `claude-setup.sh` already knows how to discover and install — no database, no embeddings, no vector store, no new install machinery. This is not a compromise for simplicity's sake; it's what the evidence actually points to: the AI-coding-tool industry has been visibly *moving away* from embeddings-based doc indexing (Continue.dev deprecated its RAG doc indexer, Sourcegraph Cody is moving away from embeddings in Enterprise, Aider never adopted them) toward static files and live/on-demand retrieval. At the scale this system will realistically reach (10–100 technologies), a vector database would be solving a problem this repo doesn't have.

Three new skills are specified in full: **`knowledge-forge`** (ingests a source, produces/refreshes a `learned-*` skill), **`developer-toolbox`** (cheap, routing-only awareness of what's already known), and **`study`** (on-demand tutoring generated from compiled knowledge, no duplicate content store). A fourth artifact — the **`learned-*` skill contract/template** — is fully specified but is not itself a hand-written skill; it's a schema `knowledge-forge` stamps out.

The single most important constraint discovered, and the one that should anchor every sizing decision below: **Claude Code keeps a combined 25,000-token budget across all currently-attached skills on re-attach, capped at 5,000 tokens per skill, oldest dropped first.** Every learned skill's SKILL.md body should be written to comfortably fit inside that per-skill allowance — this is not a soft aspiration, it's a hard truncation boundary.

---

# What I Found in the Existing Claude-Setup

(Full detail from direct repository inspection; see also `README.md`, `claude-setup.sh`, `skills/README.md`, and the five existing skills for primary sources.)

- **This is a private, two-person (Abhilash + Jinu) portable config repo**, not an OSS project — `README.md:3-5` states this explicitly, and the repo's entire security posture rests on staying private rather than on gitignoring secrets (`.gitignore` only excludes OS/editor cruft; the comment on its first line explicitly says `credentials/` is *intentionally tracked*). Anything a new subsystem writes into this repo is committed by default unless deliberately excluded.
- **`claude-setup.sh` (177 lines, read in full)**: discovers skills purely by filesystem convention — any `skills/<name>/SKILL.md` that exists gets installed, zero script changes needed to add a skill. Installs via `link_or_copy()`: try `ln -s`, fall back to `cp -r` silently if symlinking fails (no OS branch — it's a runtime try/fallback). **Skip-if-exists idempotency**: if the destination already exists (symlink, copy, or otherwise), the script does nothing — no diff, no update, no uninstall path exists anywhere in the script. This matters directly: a Knowledge Forge auto-refresh mechanism **cannot** rely on re-running this installer to pick up updated content; it has to update files that are already in place, not re-install them.
- Config (`config/settings.json`, `config/mcp.json`) and skills both go through the same skip-if-exists `link_or_copy`. **Rules (`rules/`) and credentials (`credentials/`) are explicitly never auto-installed** — the script only prints a suggested line / export command for the human to run manually (`claude-setup.sh:141-167`). This is a deliberate, repeated design choice (stated in comments at both sites) that a new subsystem should mirror: don't auto-wire secrets or auto-inject into a project's own `CLAUDE.md`.
- **`skills/README.md`'s documented convention** is minimal: `SKILL.md` (required) + optional `references/` + optional `scripts/`. It does **not** document `assets/` or `agents/` as valid subfolders, even though the one vendored skill (`last30days`) uses both — a real, if minor, gap between documented and actual convention that a new subsystem's own docs should not repeat.
- **Five skills exist today, and they are not structurally uniform** — line counts range 44 to 2,424. Four are hand-authored and minimal (`name`+`description` frontmatter only). One, `last30days`, is a vendored third-party skill (upstream `homepage`/`repository`/`author` in frontmatter, its own semver, `v3.25.0`) with by far the richest frontmatter in the repo (`version`, `argument-hint`, `allowed-tools`, `homepage`, `repository`, `author`, `license`, `user-invocable`, plus a nested `metadata.openclaw` block) and the only real precedent in this repo for a persistent knowledge/caching system: a SQLite+FTS5 research store, a "topic queue" coverage tracker, and a generated `index.html`/`feed.xml` catalog of its own accumulated briefs. This is useful *shape* precedent (queue/coverage tracking, a generated feed/catalog) but it is third-party code, not something to structurally copy — and notably, none of that caching/versioning machinery is factored out as repo-level infrastructure other skills could reuse.
- **`project-boundary/SKILL.md`'s frontmatter is mildly malformed** (doubled `---` delimiter, unescaped quotes in the description) — likely tolerated by most YAML parsers but worth fixing opportunistically, unrelated to this project.
- **No `docs/` or `docs/planning/` directory exists anywhere in this repo** (confirmed by direct search) — this report introduces that convention fresh, mirroring the pattern Abhilash already uses in the separate `bigsocials` project (`docs/planning/architecture-audit-2026-05-19.md`).
- **No skill index/catalog file exists.** Discovery is purely the shell script's filesystem glob — there is nothing today that answers "what skills exist and what do they do" other than looking at the directory yourself.
- **No cron/scheduled-automation mechanism exists in the repo** at all.
- **Naming convention**: skill directories are kebab-case, and in all four hand-authored skills the `name:` frontmatter value matches the directory name exactly.
- **Portability model**: `claude-setup.sh` is a Bash script (`set -euo pipefail`) that assumes a Bash-capable environment (Git Bash/WSL on Windows) and detects symlink capability purely via `ln -s`'s exit code — no explicit OS branching. On a Windows machine without symlink privilege, skills silently become **static copies**, which combined with the skip-if-exists behavior above means a copied (non-symlinked) skill can silently drift out of date forever with no signal that it happened. This is a pre-existing risk in the repo, not something this project introduces, but it directly affects how confidently a refresh mechanism can assume "the installed copy reflects the source of truth."

**What must remain backward-compatible**: the `skills/<name>/SKILL.md` discovery contract (minimum `name`+`description` frontmatter); credentials and rules staying manual/never-auto-installed; not assuming any update path exists beyond skip-if-exists (so refresh logic must operate on already-installed files directly, or on the source-of-truth repo files before install, not rely on reinstall-to-update).

---

# Current Claude Skill Constraints / Capabilities

Verified live against current Anthropic documentation (`code.claude.com/docs/en/skills`, `code.claude.com/docs/en/plugins*`, `code.claude.com/docs/en/hooks`, `platform.claude.com/.../agent-skills/*`, the Anthropic engineering blog on Agent Skills) — not from training-data memory, since this area changes quickly and two doc sets (Claude-Code-specific vs. cross-surface) exist with some unreconciled differences noted below.

**SKILL.md format.** Only `name` (≤64 chars, lowercase/digits/hyphens) and `description` are required. `description` character limits differ between the two doc sets (1,024 chars per the cross-surface platform spec vs. 1,536 combined with an optional `when_to_use` field per Claude-Code-specific docs) — write to the tighter 1,024-char limit to be safe on both surfaces. **Confirmed, repeated in three separate places: SKILL.md body should stay under ~500 lines**, and cross-references to supporting files should stay **one level deep** from SKILL.md (avoid chains like SKILL.md → advanced.md → details.md), because Claude may only partial-read (`head`-style) a nested file. Reference files over 100 lines should carry a table of contents.

**Discovery/triggering** is the model itself matching a task against every installed skill's `name`+`description`, which are **always** resident in the system prompt (~100 tokens/skill) regardless of use — this is the literal, unavoidable per-skill tax that motivates the catalog/toolbox design below. On top of pure description-matching there are deterministic controls: `paths` (glob-restrict auto-trigger to matching files), `disable-model-invocation` (skill only reachable via explicit `/name`), and settings.json-level `skillOverrides`/`Skill()` permission rules.

**Progressive disclosure is real and exactly matches the mental model this project needs** — confirmed identically across the engineering blog and both doc sets, as a concrete three-level structure:

| Level | Content | Loaded | Cost |
|---|---|---|---|
| 1 | `name` + `description` | Always | ~100 tokens/skill |
| 2 | SKILL.md body | On trigger | Recommend under 5,000 tokens |
| 3+ | `references/`, `scripts/`, `assets/` | Only when Claude follows a link/reads/executes it | Zero until touched |

Mechanically, Level 3 loads through **ordinary file access** — Claude literally runs `Read`/`cat` on a referenced file when it decides to follow the link; there is no special preloading. Scripts execute via Bash and only their **stdout** enters context, never their source — meaning heavy logic can live in `scripts/` at zero standing context cost.

**The single hardest numeric constraint found**: re-attached skills keep only their **first 5,000 tokens each**, sharing a **25,000-token combined budget across every currently-attached skill**, most-recently-relevant kept, oldest dropped first when the budget is exceeded. This is the concrete reason the architecture below (a) keeps every learned skill's SKILL.md body well under 5,000 tokens and (b) treats `developer-toolbox`'s job as actively *discouraging* over-invocation, not just cheap discovery — every extra skill Claude attaches competes for that same 25k pool.

**Discovery paths and precedence** (highest to lowest): enterprise-managed → personal (`~/.claude/skills/`) → project (`.claude/skills/`) → nested (subdirectory `.claude/skills/`) → plugin-provided (always namespaced `/plugin-name:skill-name`) → `--add-dir` → claude.ai-synced (`~/.claude/skills/synced/`, one-way sync down). A synced skill colliding in name with a local one resolves as: local wins at `/name`, the synced copy becomes reachable at `/anthropic-skills:name` — this is the confirmed, documented mechanism behind the `anthropic-skills:*`-prefixed skills visible in this very session (e.g. `anthropic-skills:consolidate-memory`); the exact bundle those ship in wasn't identifiable in the two public marketplace repos checked, so it's most likely a claude.ai/Cowork-side default sync set rather than something in the OSS marketplaces — flagged Unknown, not guessed.

**Personal/project skills have no built-in versioning** — "skills update in place; no version pinning" is the documented behavior. Only **plugin-packaged** skills get real version resolution, via `plugin.json`'s `version` field (falling back through marketplace entry → git tag → npm → commit SHA). This is a genuine, confirmed gap that the metadata schema below has to fill itself for personal skills, since the platform won't do it.

**Tool scoping** (`allowed-tools`/`disallowed-tools`) and **`hooks`** exist as Claude-Code-specific frontmatter fields — the first two are turn-scoped (clear after the next message), `hooks` persists session-wide once the skill is invoked. **`context: fork`** lets a skill run in a fully isolated subagent (`agent:` selects the type, default `general-purpose`; `background: true` by default since v2.1.218) — but it produces exactly **one** subagent per invocation; there is no documented mechanism for a skill to declaratively fan out to several parallel subagents. Multi-agent fan-out (which this project's own ingestion research needs) has to be done the way this very report was produced: SKILL.md body instructions telling Claude to use the Agent/Task tool itself, multiple times, in the main thread — not via `context: fork`.

**Plugins are a real, fully documented bundling mechanism**: a directory with `.claude-plugin/plugin.json` can bundle `skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, etc.; its skills are always namespaced `/plugin-name:skill-name`; a lightweight "skills-directory plugin" shortcut exists (drop a folder with its own `plugin.json` directly into `~/.claude/skills/`, auto-loads with zero marketplace step). This is a legitimate alternative to plain filesystem skills for the `learned-*` collection — noted as an open decision below, not adopted for V1 because it would introduce an install pathway `claude-setup.sh` doesn't know about.

**Security is called out prominently, not as a footnote**: skills are effectively "install software," bundled scripts should be audited, skills that fetch external URLs are a prompt-injection surface, and enterprise orgs have a "skill content scanning" option. There is now a purpose-built **`/skill-doctor`** command (v2.1.252+) that "reports skill usage and context costs; helps identify unused skills to disable" — direct, official evidence that the context-cost concern this whole project is designed around is real and already being addressed by Anthropic at the tooling level; `developer-toolbox` should be thought of as complementary to `/skill-doctor`, not a reimplementation of it.

---

# Evaluation of the Knowledge-Compilation Idea

**The idea is sound, and it's a good fit for the platform, not a workaround.** Progressive disclosure was built for exactly this shape of problem: cheap, always-on awareness plus expensive, on-demand depth. The interesting design work is not "should we do this" but "how much structure earns its keep."

**Architecture comparison** (per Phase 3's list):

| Option | Verdict | Why |
|---|---|---|
| A. Every technology is its own skill | **Adopted, as the base layer** | Matches native discovery/progressive-disclosure exactly; independently versionable/diffable/committable in git; the only real weakness is L1 description-cost at scale (see D). |
| B. One giant knowledge skill | **Rejected** | Directly violates the ~500-line/5k-token SKILL.md guidance; can't version or refresh per-technology; one massive file makes for unreviewable diffs. |
| C. Skills + shared knowledge directory (knowledge outside `skills/`) | **Rejected** | Forfeits the native discovery/trigger mechanism for no real benefit over A. |
| D. Skills + generated index/catalog | **Adopted, as the routing layer** | Directly fixes A's one weakness (L1 cost/collision risk at scale) without touching the base layer. |
| E. Skills + searchable local database (SQLite/FTS, à la `last30days`) | **Deferred, not rejected** | Real prior art exists in this repo, but at 10–100 technologies, full-text `grep`/`Read` over a few dozen files is not a bottleneck. Revisit only if/when the catalog itself gets unwieldy (see Scaling section). |
| F. Skills + embeddings/vector DB | **Explicitly rejected for V1** | Directly contradicted by the observed industry trend: Continue.dev deprecated its own RAG doc-indexer in favor of static rules + live-fetch MCP; Sourcegraph Cody is moving *away* from embeddings in Enterprise; Aider never adopted them, recomputing a structural repo map live instead. Nobody credible in the prior-art survey argues for embeddings at this scale. |
| G. Skills + plain Markdown references | **Adopted, as the substrate** | This is just the native `references/` mechanism — not a distinct option, it's what A and D are built out of. |
| H. Hybrid | **This is the recommendation**: A (one skill per technology) + D (a generated catalog skill for cheap routing) + G (plain markdown as the internal substrate), with E and F named explicitly as V2-or-never options gated on real evidence of pain, not speculation. |

This lands very close to independently-discovered prior art: Andrej Karpathy's "LLM Wiki" pattern (a `raw/` immutable-sources tier, a cross-referenced `wiki/` tier, a schema file, an `index.md` catalog, and an append-only `log.md`, with explicit `ingest`/`query`/`lint` operations) is close enough to this design that it's worth citing directly — it independently validates the layered-tiers-plus-catalog shape, and its `lint` operation (a periodic self-consistency/staleness check) is folded into the Quality Assurance section below as something worth having from day one, not deferred.

One important, well-evidenced caution from the prior-art research: a study cited in HN discussion found **machine-generated `AGENTS.md`-style files can measurably *hurt*** — agents that dutifully followed them were more thorough but used ~19% more tokens for no better outcome, while human-authored versions helped. The lesson isn't "don't automate compilation" — it's that compiled knowledge must pass a real quality gate (verification against sources, a coverage/eval check) before being trusted, not be a raw dump of everything `knowledge-forge` read. This directly shapes the Quality Assurance section.

---

# Recommended Architecture

```
knowledge-forge  ──generates/refreshes──▶  skills/learned-<slug>/  ──registered with──▶  developer-toolbox
                                                    │                                          │
                                                    └──────────────consumed by (read-only)──────┘
                                                    │
                                                    ▼
                                                  study  (tutoring, generated on demand from the same references/research)
```

**Coupling is deliberately loose and file-mediated, not code-mediated.** `developer-toolbox` never queries `knowledge-forge` at runtime — it only ever reads a generated `catalog.md` file that `knowledge-forge` writes as its last ingestion step. `study` never depends on `knowledge-forge` at all; it only depends on the `learned-*` skill **contract** (that `references/` and `metadata.yaml` exist in a known shape). This means a `learned-*` skill could in principle be hand-authored without `knowledge-forge` and still work fine with `developer-toolbox` and `study` — the contract is the real interface, not the tool that produces it.

---

# V1 Skill Blueprints

## `knowledge-forge`

| Field | Specification |
|---|---|
| **Purpose** | Given a source (repo, docs site, video/transcript, local files, PDF, etc.), perform deep, evidence-disciplined research and compile it into a new or refreshed `learned-<slug>` skill. |
| **Trigger conditions** | Explicit only: `/knowledge-forge <source>` and `/knowledge-forge refresh <technology>` / `/knowledge-forge inspect <technology>`. `disable-model-invocation: true` — this is a deliberate, expensive, human-initiated action; it should never auto-trigger from a task's shape the way a normal skill would. |
| **Inputs** | A source reference (GitHub URL, local path, docs-site URL, video URL/transcript path, PDF path) and, for `refresh`/`inspect`, a technology slug matching an existing `learned-<slug>` directory. |
| **Supported source types** | Repository (local clone or GitHub URL), documentation website, local file/directory (Markdown, PDF, source code), video/transcript/playlist. Each gets a short source-type-specific playbook in `references/source-adapters.md` (see Source-Type Ingestion Strategy below) rather than a separate skill per type. |
| **Workflow** | 1) Identify source type and confirm scope with the user if ambiguous (e.g. "whole repo or a subpackage?"). 2) Spawn parallel research subagents via the Agent/Task tool for independent angles (docs, source, tests, examples, changelog) — `context: fork` is **not** used here since it only produces one subagent; fan-out is done via explicit multi-Agent-tool-call instructions in the SKILL.md body, mirroring how this very report was produced. 3) Synthesize findings with the Confirmed/Inferred/Judgment/Unconfirmed tagging scheme (see Source & Evidence Strategy). 4) Stamp out the `learned-<slug>` directory from the template (see below), writing `references/*.md` (curated, L2/L3) and `research/*.md` (raw analysis with citations, L4). 5) Run the quality-gate eval pass (see Evaluation strategy). 6) Show a diff to the human — never auto-commit. 7) On approval, append/update the technology's entry in `developer-toolbox`'s `catalog.md`. |
| **Outputs** | A new or updated `skills/learned-<slug>/` directory; an updated `skills/developer-toolbox/references/catalog.md` entry; a diff presented for human review. |
| **Files it owns** | `skills/knowledge-forge/` entirely (SKILL.md, `references/workflow.md`, `references/source-adapters.md`, `references/template/`). |
| **Files it may modify** | `skills/learned-<slug>/**` (create or update, per technology being ingested/refreshed); `skills/developer-toolbox/references/catalog.md` (append/update one entry — never rewrite the whole file wholesale). |
| **Safety boundaries** | Never reads `credentials/` or any `.env`-shaped file, in this repo or a source repo, regardless of what the source claims to need. Never writes anything into `credentials/`. Pattern-checks generated content for secret-shaped strings before writing. Refuses (with a loud warning requiring explicit confirmation) to compile knowledge from an unlicensed private/company repository the same way it would a public OSS library — tags `source_visibility` in metadata either way. Never auto-commits or auto-pushes — matches this repo's own existing "never auto-touch sensitive/shared things" pattern for `credentials/`/`rules/`. |
| **Context-loading strategy** | Its own SKILL.md stays a thin dispatcher (well under the 500-line guidance); the actual step-by-step workflow, the per-source-type playbooks, and the generation template all live in `references/`, read by Claude only while `knowledge-forge` is actively running (never loaded by any `learned-*` skill or by `developer-toolbox`/`study` at runtime). |
| **Subagent strategy** | Parallel `general-purpose` Agent-tool calls, one per independent research angle, scoped explicitly in the prompt (this mirrors the pattern used to produce this very report). Default soft cap of ~5–8 parallel subagents per ingestion run unless the human asks for more — this is a judgment call, flagged as an open decision below. |
| **Failure behaviour** | A source that's partially unreachable does not fail the whole run — coverage gaps go into `research/unresolved.md` and `metadata.yaml`'s `coverage_status: partial`, and the human sees this in the diff. A refresh that would produce *less* or *lower-confidence* information than what's already stored does not silently overwrite it — it's flagged in the diff for the human to decide, per Phase 11's "protect old knowledge" requirement. |
| **Refresh behaviour** | See Incremental Refresh Strategy below — cheap version/commit-diff staleness check vs. targeted re-research of only the affected `references/*.md` files, with a full rebuild only when the diff is large, a major version bumped, or prior coverage was already flagged incomplete. |
| **Validation/eval behaviour** | Before a diff is presented, run the `evals/` fixture set (see Quality Assurance section) against the freshly-written `references/` content — known-answer questions, "can this example be implemented from only the compiled reference," and an explicit "does this reference correctly say when NOT to use the technology" check. |
| **Approximate runtime context cost** | SKILL.md body: target 2,000–3,000 tokens (well under the 5k re-attach cap, leaving headroom since this skill's body is unusually workflow-heavy). Only loaded during an active ingestion/refresh session — never resident otherwise beyond its ~100-token L1 description. |

## `developer-toolbox`

| Field | Specification |
|---|---|
| **Purpose** | Cheap, routing-only awareness of what technical knowledge already exists, so Claude can decide *whether* a `learned-*` skill is worth invoking for the current task — and, just as importantly, actively discourage invoking one when it isn't actually the right fit. |
| **Should this be a skill?** | **Yes — Proposed, not obvious.** Every `learned-*` skill already broadcasts its own one-line description for free at L1, so a separate catalog doesn't add *discovery* per se. Its real value is (a) cross-technology comparison a single skill's own description can't offer (e.g. "for a big virtualized table: KendoReact vs. TanStack Table" requires seeing both at once), and (b) a single place to carry the "don't force a known tool onto a mismatched problem" instruction, instead of repeating that caveat in every learned skill. Making it a skill (rather than a bare file Claude has no reason to go looking for) reuses the existing trigger/discovery mechanism instead of inventing a new one. |
| **Activation strategy** | Hybrid: auto-triggerable via a `description` written to fire when a task's shape suggests "check what's already known" is useful (e.g. picking a library, comparing approaches), **plus** explicit `/developer-toolbox` for "what do we already know" and `/study` overlaps with it for the learning angle. Not `disable-model-invocation` — unlike `knowledge-forge`, this one should be cheap and safe enough to trigger organically. |
| **Catalog/index structure** | A single generated `references/catalog.md`, one row per `learned-<slug>`: technology name, one-line purpose, version studied, freshness (`fresh`/`aging`/`stale`), and an explicit one-line **anti-use-case** ("don't reach for this for X"). Written and updated exclusively by `knowledge-forge`, never hand-edited. |
| **Runtime token budget** | SKILL.md body kept intentionally tiny (well under 1,000 tokens) — its job is to say "read `references/catalog.md`, then decide, and default toward *not* invoking a learned skill unless the task genuinely needs it." The catalog file itself grows with the number of technologies but costs nothing until read (Level 3). |
| **Routing behaviour** | Read the catalog, shortlist zero-to-few genuinely relevant `learned-*` skills, and explicitly weigh the 25,000-token shared re-attach budget — recommend *not* invoking more than a couple of learned skills in one turn's context unless the task truly spans that many technologies. |
| **Relationship with learned skills** | Read-only consumer of each `learned-<slug>`'s L1 description via the catalog; never reads their `references/`/`research/` directly — routing decisions only need the catalog's one line per technology, not the technology's actual content. |
| **Update mechanism** | `knowledge-forge` appends/updates exactly one catalog row per ingestion/refresh; `developer-toolbox` itself never writes the catalog. |
| **Stale-version behaviour** | Surfaces the `freshness` field verbatim from the catalog (itself sourced from each learned skill's `metadata.yaml`) and suggests `/knowledge-forge refresh <technology>` when routing to something marked `stale`, rather than silently using outdated knowledge. |
| **Interaction with other skills** | Read-only relative to `learned-*` skills and to `knowledge-forge`'s output; no write access to anything. |
| **Error handling** | If `catalog.md` doesn't exist yet (no technologies learned), says so plainly rather than erroring. |
| **Approximate runtime context cost** | ~100 tokens L1 + under 1,000 tokens L2 body; `catalog.md` cost scales with N technologies but is Level-3 (zero until read), and even at 100 entries a one-line-per-tech table is a few thousand tokens — trivial next to a single `Read`. |

## `study`

| Field | Specification |
|---|---|
| **Purpose** | On-demand tutoring generated from already-compiled `learned-*` knowledge — "teach me X," "explain topic Y using what we already studied," "give me exercises on Z," "quiz me," "show progressively harder examples." |
| **Trigger conditions** | Explicit: `/study <technology> [topic]`, plus natural-language phrasing ("teach me react three fiber," "quiz me on next.js caching") matched via `description`. |
| **Inputs** | A technology slug (must match an existing `learned-<slug>`) and an optional topic/mode (explain / exercises / quiz / progression). |
| **Outputs** | Generated explanation, exercise set, or quiz — produced fresh each time from `references/` (and `research/` only if the topic needs more depth than `references/` has), **never stored as a separate persistent curriculum copy**. This directly avoids duplicating the knowledge base solely for teaching. |
| **Directory structure** | Just `skills/study/SKILL.md` (+ a short `references/teaching-modes.md` describing the four interaction modes) — it has no per-technology content of its own by design. |
| **Interaction with other skills** | Read-only consumer of a `learned-<slug>`'s `references/` and, when needed, `research/`. Independent of `knowledge-forge` at runtime — works against any skill that satisfies the `learned-*` contract, hand-authored or generated. |
| **Read/write boundaries** | Read-only. V1 has no persistent "what have I already learned" state (see V2 Possibilities) — every session's teaching is generated fresh, which is a deliberate simplicity trade-off, not an oversight. |
| **Error handling** | If the requested technology has no `learned-<slug>` yet, says so and suggests `/knowledge-forge <source>` rather than guessing from general model knowledge and presenting it as verified. |
| **Refresh behaviour** | None of its own — it always reflects whatever `references/`/`research/` currently contain, so it's automatically current the moment `knowledge-forge` refreshes something. |
| **Evaluation strategy** | Not a candidate for the same eval-fixture approach as `knowledge-forge`'s output (there's no "correct" quiz), but should be spot-checked that its explanations don't introduce claims absent from the source `references/`/`research/` content — i.e., it teaches from the compiled knowledge, it doesn't invent new claims on top of it. |
| **Approximate runtime context cost** | ~100 tokens L1 + a small (under 1,000 token) L2 body; cost of an actual session scales with however much of the target technology's `references/`/`research/` gets read, same as normal usage of that `learned-*` skill. |

## The `learned-<slug>` contract (not a hand-written skill — the template `knowledge-forge` stamps out)

**Naming: `learned-<slug>` prefix, kebab-case slug matching the package/technology's own common name** (e.g. `learned-react-three-fiber`, `learned-kendo-react`). Chosen over a bare technology name (collision risk with a possible future hand-authored skill of the same name) and over namespacing everything under a single plugin (see open decision #1 below) because it requires zero new install machinery — it's discovered by the exact same `skills/<name>/SKILL.md` glob every other skill in this repo already uses.

```
skills/learned-<slug>/
  SKILL.md                    # L2 — thin router. Required.
  metadata.yaml                # structured provenance/freshness. Required.
  references/                  # L3 — curated, "developer experience" knowledge. Required, but only the files that earn their keep.
    mental-model.md
    decision-guide.md          #   when to use / when NOT to use — always present, this is the anti-overuse safeguard
    api.md
    patterns.md
    pitfalls.md
    performance.md             #   omit if not materially relevant — no boilerplate empty files
    ...
  examples/                    # L3 — runnable/copyable snippets referenced from references/*.md. Optional, present when the technology benefits from it.
  research/                    # L4 — WARM. Raw per-angle analysis with citations. Required.
    docs-analysis.md
    source-analysis.md
    tests-analysis.md
    examples-analysis.md
    changelog-analysis.md
    unresolved.md               #   coverage gaps — required, even if empty, to make "what wasn't inspected" answerable
  evals/                        # quality-gate fixtures, not loaded at runtime. Required.
    fixtures.md                 #   known-answer Q&A + "implement this from only references/" checks
```

For every file/folder type:

| Item | Required? | Purpose | Loaded at runtime? | Generated or hand-edited? | Refreshed how? |
|---|---|---|---|---|---|
| `SKILL.md` | Required | Router: mental-model summary, when to use/not use, pointers into `references/*.md` (one level deep only) | L1 always, L2 on trigger | Generated by `knowledge-forge` from the template | Regenerated whenever any `references/` content it points to changes materially |
| `metadata.yaml` | Required | Structured provenance/freshness (see schema below) | Read by `knowledge-forge`/`developer-toolbox`/scripts, not auto-loaded by Claude Code itself (the `metadata` SKILL.md field is confirmed ignored by Claude Code — this file is separate and explicitly read on demand) | Generated | Updated on every refresh |
| `references/*.md` | Required (minimum: `mental-model.md`, `decision-guide.md`) | Curated, verified, developer-experience-level knowledge | L3, on demand | Generated, but this is the layer most worth a human skim/edit pass | Targeted — only the files whose cited sources changed |
| `examples/*` | Optional | Runnable snippets | L3, on demand | Generated | Same as `references/` |
| `research/*.md` | Required | Raw analysis, citations, "show your work" | L4, rarely — only when `references/` is insufficient | Generated | Same as `references/`, additive by default |
| `research/unresolved.md` | Required | Coverage-gap tracking (Phase 16) | L4, rarely | Generated | Updated every ingestion/refresh |
| `evals/fixtures.md` | Required | Quality gate for `knowledge-forge` itself | Never at normal runtime | Generated, human-extendable | Extended, not replaced, on refresh |

**Metadata schema (Proposed, deliberately minimal per the "don't over-engineer the schema" instruction)**:

```yaml
name: react-three-fiber
slug: react-three-fiber
knowledge_schema_version: 1
technology:
  package: "@react-three/fiber"
  version_studied: "9.x"
  ecosystem: npm
sources:
  - type: repository
    url: https://github.com/pmndrs/react-three-fiber
    commit: <sha>
  - type: documentation
    url: https://r3f.docs.pmnd.rs
    retrieved_at: 2026-09-23
source_visibility: public   # public | private — gates knowledge-forge's licensing safety check
compiled_at: 2026-09-23
last_refreshed: 2026-09-23
freshness: fresh            # fresh | aging | stale
coverage_status: full        # full | partial
confidence: high             # qualitative only — not a fake precision score
unresolved_count: 2          # pointer into research/unresolved.md
```

---

# Directory Structure

```
Claude-Setup/
  docs/
    planning/
      knowledge-system-architecture-2026-09-23.md    # this report
  skills/
    knowledge-forge/
      SKILL.md
      references/
        workflow.md
        source-adapters.md
        template/
          SKILL.md.template
          metadata.yaml.template
          reference-file.template.md
    developer-toolbox/
      SKILL.md
      references/
        catalog.md              # generated, one row per learned-* skill
    study/
      SKILL.md
      references/
        teaching-modes.md
    learned-<slug>/              # N of these, one per compiled technology — see contract above
      ...
    eval-effort/                 # existing, unchanged
    gather-context/              # existing, unchanged
    last30days/                  # existing, unchanged
    project-boundary/            # existing, unchanged
    set-author/                  # existing, unchanged
    README.md                    # modified: document learned-* convention + assets/agents/ gap
```

---

# Runtime Context Strategy

Mapping the user's proposed L0–L4 model onto the mechanics actually confirmed above:

| Level | Content | Cost | Notes |
|---|---|---|---|
| L0 | `developer-toolbox`'s own L1 description | ~100 tokens, always | The true "is anything known at all" signal |
| L1 | Every `learned-<slug>`'s `name`+`description` | ~100 tokens each, always | Unavoidable platform tax — this is exactly why `developer-toolbox` exists as a routing aid, not a discovery mechanism |
| L2 | `learned-<slug>`'s SKILL.md body | Under 5,000 tokens, on trigger | Hard-anchored to the confirmed per-skill re-attach cap |
| L3 | `references/*.md`, `examples/*` | Zero until read | The default depth for real work |
| L4 | `research/*.md` | Zero until read, rarely read | "Show your work" / refresh substrate, explicitly not read in normal operation (SKILL.md should say so) |
| L5 | Original source | Not stored, or stored only as a cache-hit optimization — see Original-Source Handling | Revisited only when L2–L4 are insufficient or flagged stale |

**Never loaded by default, ever, under this design**: `research/` content during ordinary Q&A; `evals/fixtures.md` outside of `knowledge-forge`'s own validation pass; the full `developer-toolbox` catalog when only one or two technologies are actually in play (routing should shortlist, not dump the whole table into the response).

---

# Knowledge Schema

Categories worth extracting per technology (Phase 5), scoped to what's *universally* useful vs. what should only exist when it earns its place — no boilerplate empty files:

**Always present** (these are the anti-overuse and orientation core): mental model, when to use / when NOT to use (`decision-guide.md`), core public API, common pitfalls.

**Present when materially relevant, generated conditionally**: performance characteristics, security considerations, migration/version-specific behavior, integration patterns, debugging knowledge, testing strategy.

**Deliberately excluded from the curated `references/` layer, kept only in `research/` if captured at all**: internal implementation details (unless directly load-bearing for a pitfall/decision), alternatives-and-trade-offs commentary beyond what's needed for the decision guide (that's `developer-toolbox`'s comparison job, not every individual skill's).

---

# Source & Evidence Strategy

**Priority order when sources conflict** (highest to lowest trust): tests → official source code → type definitions/API schemas → official documentation → changelog/release notes → official examples → maintainer discussions/issues → third-party tutorials (lowest trust, gap-filling only, always flagged as community-sourced) → model prior knowledge (never the sole basis for a stated fact — usable only as a hypothesis to verify against everything above it).

**Conflict resolution rules**: docs vs. implementation → trust implementation, flag the doc as potentially stale in `unresolved.md`. Docs vs. tests → trust tests. Old docs vs. current code → trust current code, and record *why* via the commit/version metadata. Tutorial vs. official source → official source wins; tutorial content is only used to fill genuine gaps and stays explicitly tagged as unverified against maintainers.

**Fact-tagging scheme**, used inside `research/*.md` and, more sparingly, in `references/*.md`: **Documented** (a source states this directly) / **Verified-in-code** (confirmed by reading source or tests) / **Derived** (logical conclusion from multiple documented facts) / **Judgment** (a best-practice opinion, e.g. "prefer pattern X") / **Unconfirmed** (plausible, not independently verified — should be rare outside `research/unresolved.md`). This is the same discipline the three research subagents that produced this report were asked to use — proven practical at report-writing scale in this very session.

---

# Research Cache Strategy

`research/` is the WARM tier: one file per research angle (`docs-analysis.md`, `source-analysis.md`, `tests-analysis.md`, `examples-analysis.md`, `changelog-analysis.md`), each carrying inline citations (file path + line, URL, commit SHA). It is expected to overlap with `references/` in *content* while differing in *purpose*: `references/` is the synthesized, developer-experience answer; `research/` is the evidence that justifies it. `SKILL.md` should explicitly instruct Claude **not** to read `research/` unless `references/` proves insufficient for the question at hand — this is what keeps the WARM tier from being a de facto second copy of the HOT tier in normal use. `research/unresolved.md` is the coverage-gap ledger (see Coverage Verification below); a lightweight coverage note (what was inspected, what was skipped and why) belongs either in `unresolved.md` or folded into `metadata.yaml`'s `coverage_status` field — not a separate manifest file, to avoid over-fragmentation.

---

# Metadata & Provenance

Schema given in full above under the `learned-<slug>` contract. Deliberately minimal: schema version (for future migrations), what technology/version/commit was studied, where from, when, a qualitative freshness/confidence pair (not fake precision), and a pointer to the unresolved-items count. No per-fact provenance ledger at the metadata-file level — per-fact provenance lives inline in `research/*.md` via citations, which is the right granularity for it.

---

# Versioning Strategy

Personal/project skills get **no built-in versioning from the platform** (confirmed above) — `metadata.yaml`'s `technology.version_studied` + `compiled_at`/`last_refreshed` timestamps are this project's own substitute, checked into git like any other file, with git history itself serving as the version log (see Git Workflow). Multi-version knowledge (Phase 19, e.g. Next.js 16 vs. 18 both in active use) is **not** solved by branching inside one `learned-<slug>` skill — that would fight the "SKILL.md stays thin" constraint. Instead: a genuinely divergent major version gets its own `learned-<slug>-v<major>` skill only if/when the two versions' knowledge has actually diverged enough to matter (e.g. a framework's architecture changed, not just a minor API addition) — this is a judgment call made at refresh time, not a rule applied automatically to every version bump.

---

# Incremental Refresh Strategy

Two tiers, directly informed by the prior-art finding that real diffing tools (OpenAPI diff, dependency-graph impact analysis) work on **structured** representations, not prose — no tool anywhere does true semantic diffing of documentation prose, so this design doesn't promise that either:

1. **Cheap staleness check** (no research, just a version/commit comparison): compare `metadata.yaml`'s `technology.version_studied`/`sources[].commit` against the latest published version or current HEAD. Sets `freshness: aging` or `stale` using a simple TTL-by-category heuristic (fast-moving libraries get a shorter TTL than stable ones) — kept deliberately simple, not a scored formula.
2. **Targeted refresh** (`/knowledge-forge refresh <technology>`): diff `git log <old>..<new> --stat` plus changelog/release notes between the stored and current version (structured signals, consistent with what the prior-art research found actually works), map changed paths to which `references/*.md` files cite them (via their existing citations), and re-research **only** those files — leaving untouched files alone. **Full rebuild is justified only when**: the diff touches a large fraction of previously-cited files, a major version bumped, or `coverage_status` was already `partial` going in.

Protection against regression (Phase 11): a refresh that would produce less or lower-confidence information than what's already there does not silently overwrite it — it's surfaced in the diff for human review, and git history is the ultimate safety net (`knowledge-forge` never auto-commits).

---

# Toolbox / Discovery Strategy

Covered in full in the `developer-toolbox` blueprint above. Summary of the two Phase-12 judgment calls: (1) activation is **hybrid** — auto-triggerable for task-shaped relevance, plus explicit `/developer-toolbox`; (2) the overuse risk (Claude reaching for a known tool just because it's known) is mitigated structurally, not just by instruction — every catalog row carries an explicit anti-use-case line, and the skill's own body defaults toward *not* invoking a learned skill unless the task genuinely needs it, with the 25k shared-budget constraint cited as the concrete reason to stay selective.

---

# Personal Learning Strategy

**Adopted: option B+C** — a single generic `study` skill (not `learned-*`-prefixed; it's infrastructure, not learned knowledge) that generates teaching content on demand from a technology's existing `references/`/`research/`, rather than storing a parallel curriculum. This directly satisfies "avoid unnecessary duplication of technical knowledge." **V1 is stateless** — "teach me X," "quiz me on Y," and "give exercises on Z" all work without any persistent progress record. "What haven't I learned yet" (a genuinely stateful question) is explicitly deferred to V2, since answering it durably requires a new small per-user state file and a new set of decisions (where it lives, whether it's gitignored, whether it's shared between Abhilash and Jinu or per-person) that aren't necessary to deliver the core tutoring value.

---

# Source-Type Ingestion Strategy

One skill (`knowledge-forge`), source-type playbooks inside `references/source-adapters.md` rather than separate skills per type — the extraction/synthesis/tagging logic is shared; only the *discovery* step differs:

- **Repository**: README, docs, source, tests, examples, package manifests, types, changelog/release history. Skip `node_modules`/build artifacts/generated files.
- **Documentation site**: navigation structure, concept guides, API reference, examples, version selector if present. Explicitly skip marketing/legal/pricing pages — they're not technical knowledge.
- **Video/playlist/course**: transcript → chapters → concepts/claims with source timestamps. Practical limitation, stated plainly rather than worked around: this depends entirely on transcript availability; no source-of-truth verification is possible for claims made only in a video with no accompanying written material, so video-derived claims should default to a lower confidence tag than repo/docs-derived ones.
- **Local files**: Markdown/PDF/code/directories, same extraction pipeline as the repository adapter minus the network-fetch step.

---

# Large Repository Strategy

For repositories too large to read exhaustively: repository mapping first (structure/high-signal-file identification, similar in spirit to Aider's structural repo-map approach, though computed by Claude's own reading rather than a separate tree-sitter/PageRank pass), then parallel subagent partitioning by research angle (as specified in `knowledge-forge`'s workflow) rather than by arbitrary file ranges, explicit deduplication before writing `references/`, and a coverage record in `research/unresolved.md` naming what was deliberately skipped and why (generated code, vendored dependencies, test fixtures) versus what simply wasn't reached. The goal stated by the user — "maximum durable knowledge per expensive research session," not "minimize today's token usage" — means it's acceptable and expected for a large-repo ingestion to spend heavily on the parallel research pass; the discipline is in not re-reading the same files across subagents, not in reading less overall.

---

# Quality Assurance / Evals

Directly shaped by the "machine-generated AGENTS.md files can hurt" finding from the prior-art research: compiled knowledge is not trusted by default just because `knowledge-forge` produced it. Before a diff is presented to the human, `knowledge-forge` runs the fixtures in `evals/fixtures.md` — known-answer documentation questions, "can this example be implemented using only the compiled `references/`," and an explicit check that the `decision-guide.md` correctly identifies at least one scenario where the technology should **not** be used. This is a lightweight, per-technology fixture set (not a generic benchmark), extended over time rather than replaced on refresh. Borrowing Karpathy's "lint" concept from the prior-art research: a periodic, cheap self-consistency pass across all `learned-*` skills (do citations still point to real files/URLs, does `freshness` match reality, are there orphaned cross-references) is worth having as a `knowledge-forge` subcommand once there are enough learned skills for drift to be a realistic risk — not needed on day one with zero or one learned skill.

---

# Security / Privacy

`knowledge-forge` never reads `credentials/` or any `.env`-shaped file in this repo or in a source being studied, and never writes into `credentials/` — matching this repo's own existing, repeated design pattern for those two things. Generated content is pattern-checked for secret-shaped strings before being written, as a cheap safety net, not a guarantee. A source flagged `source_visibility: private` in metadata gets an explicit human-confirmation gate before compilation, distinct from the default (implicit) path for public OSS sources — the licensing research found that private/company code and redistributable public docs carry meaningfully different reuse assumptions, and the metadata schema should make that distinction visible, not silently blur it. Because this repo's whole security model is "stay private" rather than "gitignore secrets," anything `knowledge-forge` writes is committed by default unless a deliberate exception is added — which is consistent with the existing repo philosophy, not a new risk this project introduces, but worth stating explicitly since it means generated `research/` content (which may include verbatim quotes from a private source) should be scoped to the same access assumptions.

---

# Git Workflow

`knowledge-forge` never commits or pushes on its own — it produces files and shows a diff, and the human commits, exactly mirroring how this repo already treats `credentials/` and `rules/` (print/suggest, never auto-apply). Suggested commit-message convention, extending this repo's existing plain style rather than inventing a new one: `knowledge: learn <slug>` / `knowledge: refresh <slug> for <version>` / `knowledge: add <slug> <topic> research`.

---

# Scaling to 10 / 50 / 100 Technologies

| Scale | Git repo size | Discovery/L1 cost | Catalog size | What changes |
|---|---|---|---|---|
| 10 | Negligible | ~1,000 tokens of always-resident descriptions | A few dozen catalog rows, trivially skimmable | Nothing — V1 as specified handles this comfortably |
| 50 | Still small (this is all markdown) | ~5,000 tokens of always-resident descriptions — now a real, if modest, standing cost | Catalog approaching a size where `developer-toolbox` should summarize/group rather than list every row verbatim | Worth revisiting whether `developer-toolbox`'s own body needs to get smarter about pre-filtering the catalog before presenting it |
| 100 | Still modest for a markdown-only repo | ~10,000 tokens of always-resident descriptions | This is the point at which grep-over-catalog starts being genuinely more efficient than "read the whole catalog" | This is the threshold at which options E (searchable local index) or a `last30days`-style SQLite/FTS cache stop being premature and start being justified — **not before** |

Scaling rule (Proposed): don't add search/database infrastructure speculatively — add it when the catalog file itself becomes the bottleneck, which the numbers above suggest is realistically a 50–100-technology problem, not a 10-technology one.

---

# Major Failure Modes and Mitigations

| Failure mode | Mitigation |
|---|---|
| Compiled knowledge becomes stale silently | `freshness` field + cheap staleness check + `developer-toolbox` surfacing it and suggesting refresh |
| Machine-generated content is confidently wrong (evidenced risk, not hypothetical) | Mandatory eval-fixture gate + human diff review before any commit |
| Too many attached skills exhaust the 25k shared re-attach budget | `developer-toolbox` actively discourages over-invocation; every `learned-*` SKILL.md body is sized to fit comfortably under the 5k per-skill cap |
| `developer-toolbox` routes to a known technology that doesn't actually fit the task | Explicit anti-use-case line per catalog row; decision-guide.md required in every learned skill |
| A refresh silently destroys previously-good research | Diff-before-write, never-auto-commit, flag-don't-overwrite on regression |
| Knowledge-forge reads/leaks a secret | Never touches `credentials/`/`.env`; pattern-checks output |
| Repository grows unreviewable at scale | Scaling rule above — add search infra only when the catalog is the actual bottleneck |
| A learned skill's SKILL.md balloons past the 500-line/5k-token guidance over successive refreshes | `knowledge-forge`'s template enforces the thin-router shape; refreshes update `references/`, not by default the SKILL.md body itself |
| Private/company knowledge gets treated the same as redistributable OSS knowledge | `source_visibility` metadata field + explicit confirmation gate on private sources |

---

# Features Explicitly Deferred from V1

Vector databases/embeddings (contradicted by current industry direction at this scale); a custom search server or daemon; background/scheduled automation (no cron mechanism exists in this repo today, and none is needed for a human-initiated `/knowledge-forge`); fully autonomous git commits/pushes; a separate plugin-packaging distribution model for `learned-*` skills (viable, but adds install-path complexity `claude-setup.sh` doesn't currently have — see open decision below); stateful tutoring progress-tracking; automatic "spare-token" scheduled research sessions; a `lint`/self-consistency pass (useful, but not needed until there's enough `learned-*` content for drift to be realistic).

---

# Existing Claude-Setup Components We Can Reuse

The `skills/<name>/SKILL.md` discovery contract and `claude-setup.sh`'s install mechanism — zero new install machinery needed. The `skills/README.md` authoring convention, extended (not replaced) to document `learned-*` and the previously-undocumented `references/`/`assets/`/`agents/` folder possibilities. `last30days`'s queue/coverage-tracking and generated-feed *shape* is useful precedent for the catalog concept, even though its actual code isn't reused (it's third-party). Nothing else in the repo (no existing repo-level caching, indexing, or scheduling infrastructure) is directly reusable — confirmed by the audit, not assumed.

---

# V1 Scope

`knowledge-forge`, `developer-toolbox`, `study`, and the `learned-<slug>` contract/template, exactly as specified above. Ingestion for all four source types (repo, docs site, video, local files). Cheap staleness checking and targeted incremental refresh. The eval-fixture quality gate. Human-reviewed, human-committed git workflow. Explicitly *not* in V1: anything in the Deferred list above.

---

# V2 Possibilities

Stateful tutoring progress-tracking in `study`; a `lint`/self-consistency pass across all learned skills once there are enough of them; searchable local index (SQLite/FTS or similar) once the catalog is a measured bottleneck, not before; plugin-packaged `learned-*` skills if real versioning or independent distribution becomes a genuine need; scheduled "spare-token" refresh sessions if/when this repo's Claude Code setup gains a cron-like mechanism generally (none exists today).

---

# Implementation Order

1. Land this report at `docs/planning/knowledge-system-architecture-2026-09-23.md` (done — this file) so the next session has it without re-deriving anything.
2. Build the `learned-<slug>` template/contract as `knowledge-forge`'s `references/template/` — this is the single most load-bearing artifact; get its shape right before anything else depends on it.
3. Build `knowledge-forge`'s SKILL.md (thin dispatcher) + `references/workflow.md`, **ingestion path only** — no refresh logic yet.
4. Dry-run `knowledge-forge` on one small, well-understood technology end-to-end, and treat the resulting `learned-<slug>` skill as a quality checkpoint before building anything else around it — if the template doesn't produce something genuinely useful on a simple case, fix the template before scaling up.
5. Build `developer-toolbox` (needs at least one real `learned-<slug>` to have something to catalog).
6. Build `study` (needs at least one real `learned-<slug>` to test tutoring against).
7. Add refresh capability to `knowledge-forge` — deferred until the ingest path and provenance fields are proven correct, since refresh logic depends on them.
8. Add the eval-fixture quality gate once there's enough real compiled content to write meaningful fixtures against.
9. Only after real usage at 10+ technologies reveals actual pain points, revisit V2 items — not speculatively.

---

# Files That Would Be Created or Modified

| Path | Purpose | New or modified |
|---|---|---|
| `docs/planning/knowledge-system-architecture-2026-09-23.md` | This report | New (this session) |
| `skills/knowledge-forge/SKILL.md` | Ingestion/refresh dispatcher | New |
| `skills/knowledge-forge/references/workflow.md` | Full step-by-step ingestion/refresh workflow | New |
| `skills/knowledge-forge/references/source-adapters.md` | Per-source-type discovery playbooks | New |
| `skills/knowledge-forge/references/template/SKILL.md.template` | Learned-skill SKILL.md skeleton | New |
| `skills/knowledge-forge/references/template/metadata.yaml.template` | Learned-skill metadata skeleton | New |
| `skills/developer-toolbox/SKILL.md` | Routing/catalog-reading dispatcher | New |
| `skills/developer-toolbox/references/catalog.md` | Generated catalog (empty until first ingestion) | New, generated |
| `skills/study/SKILL.md` | Tutoring dispatcher | New |
| `skills/study/references/teaching-modes.md` | Explain/exercise/quiz/progression mode definitions | New |
| `skills/learned-<slug>/**` | Per-technology compiled knowledge | New, generated, one set per technology ingested |
| `skills/README.md` | Document the `learned-*` convention and the existing `assets/`/`agents/` folder gap | Modified |

---

# Decisions That Still Require My Input

1. ~~`learned-*` as plain filesystem skills (V1, recommended) vs. bundled as a single namespaced plugin~~ — **Decided 2026-09-23: plain filesystem skills for V1.** No new install machinery, discovered by the same `skills/<name>/SKILL.md` glob as every other skill in the repo. The lack-of-built-in-versioning gap this forgoes (plugin-packaged skills get real semver via `plugin.json`; personal skills don't) is covered instead by `metadata.yaml`'s own `technology.version_studied`/`compiled_at`/`last_refreshed` fields plus git history — revisit plugin-bundling only if that substitute proves insufficient in practice.
2. **Should `research/` raw caches be committed to git by default** (consistent with this repo's existing "stay private, don't gitignore" philosophy) **or excluded to control repo size at scale**? Recommendation: commit by default, matching existing repo philosophy and using git history as the Phase-11 safety net; revisit only if repo size becomes a real, measured problem.
3. **Default parallel-subagent cap for a single `knowledge-forge` ingestion run** — proposed a soft default of ~5–8 concurrent subagents unless explicitly told to go wider. This is a cost/thoroughness judgment call, not something the research can settle on its own.
4. Confirm the three skill names (`knowledge-forge`, `developer-toolbox`, `study`) and the `learned-<slug>` naming convention are acceptable as final, or flag a preferred alternative before the next session scaffolds them.

---

# Implementation Notes (added 2026-09-23, post-implementation)

V1 as specified above has been built: `skills/knowledge-forge/`, `skills/developer-toolbox/`, `skills/study/`, and the `learned-<slug>` template/contract under `knowledge-forge/references/template/`. Decision #1 above was confirmed by the user (plain-filesystem skills) before implementation began. Decisions #2–#4 remain open; #4's names were used as-is pending confirmation, since nothing in implementation surfaced a reason to prefer alternatives.

**One material finding from portability validation, not anticipated during research**: on this machine, `claude-setup.sh`'s `ln -s` call returns exit 0 and the script prints `linked: ...`, but the result is a **plain directory copy, not a real Windows symlink/junction** (verified via `Get-Item` — no `ReparsePoint` attribute, empty `LinkType`) — the script's own success message is misleading here, not just falling back silently as the original architecture assumed. This is a **pre-existing behavior of `claude-setup.sh` affecting every skill in the repo**, not something introduced by this implementation, and per the implementation brief it was not fixed (`claude-setup.sh` wasn't touched). Practical consequence specific to this system: a `/knowledge-forge refresh` that updates a `learned-<slug>` skill in this repo will **not** automatically reach an already-installed copy in `~/.claude/skills/` on this machine — the installed copy is static, and the installer's skip-if-exists behavior means re-running it won't refresh it either. The user needs to know to manually re-sync (delete-and-reinstall, or a manual copy) after a refresh on machines where this occurs. Worth a separate, small follow-up to `claude-setup.sh` (e.g., detecting and reporting true link status, or an explicit re-sync path) — intentionally not done here since it's outside this task's scope and touches a shared script other skills depend on.
