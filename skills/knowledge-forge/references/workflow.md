# knowledge-forge workflow

The full procedure behind `/knowledge-forge`. Read this in full before starting research — it is the actual operational content; `SKILL.md` is only the dispatcher.

## Contents

- [Evidence discipline](#evidence-discipline) — the tagging scheme and source-priority rules used throughout
- [A. Ingestion workflow](#a-ingestion-workflow) — `/knowledge-forge <source>`
- [B. Refresh workflow](#b-refresh-workflow) — `/knowledge-forge refresh <technology>`
- [C. Inspect workflow](#c-inspect-workflow) — `/knowledge-forge inspect <technology>`
- [Security boundaries](#security-boundaries)
- [Never destroy, never auto-commit](#never-destroy-never-auto-commit)

## Evidence discipline

Tag every non-trivial claim written into `research/*.md`, and every claim in `references/*.md` that isn't obviously self-evident, with one of:

- **Documented** — a source states this directly (cite it: file path + line, URL, or commit SHA).
- **Verified-in-code** — confirmed by reading source or tests yourself, not just asserted by docs.
- **Derived** — a logical conclusion from multiple Documented/Verified-in-code facts.
- **Judgment** — a best-practice opinion (e.g. "prefer pattern X over Y") — legitimate and useful, but must be labeled as opinion, not fact.
- **Unconfirmed** — plausible but not independently verified. These belong in `research/unresolved.md`, not stated as fact in `references/`.

**Source priority when sources conflict** (highest to lowest trust): tests → official source code → type definitions/API schemas → official documentation → changelog/release notes → official examples → maintainer discussions/issues → third-party tutorials (gap-filling only, always flagged as community-sourced) → model prior knowledge (never the sole basis for a stated fact — usable only as a hypothesis to verify against everything above it).

**Conflict resolution**:
- Docs vs. implementation → trust implementation; flag the doc as potentially stale in `unresolved.md`.
- Docs vs. tests → trust tests.
- Old docs vs. current code → trust current code; record why via the commit/version metadata.
- Tutorial vs. official source → official source wins; tutorial content only fills genuine gaps, tagged as unverified against maintainers.
- Model knowledge vs. supplied source → supplied source always wins; model knowledge only fills genuine gaps and is tagged Judgment/Unconfirmed, never promoted to a stated fact in `references/` without a citation.

## A. Ingestion workflow

1. **Source discovery & classification.** Determine source type (repository / documentation site / local files / video-transcript) from the input. If ambiguous (e.g. a bare package name with no URL), ask the user rather than guessing which repo/docs it refers to. Read `references/source-adapters.md` for the type-specific discovery playbook.

2. **Scope mapping.** For a repository or docs site, get an overview before diving in — a directory listing, a table of contents, a nav structure. Decide what's in scope (core library code, public docs, tests, examples, changelog) and what's explicitly out of scope (generated files, `node_modules`/vendored deps, marketing/legal pages, build artifacts). Write this decision down; it becomes part of `research/unresolved.md`'s "intentionally skipped" section later.

3. **Coverage planning.** For a small/single-file source, plan a single direct research pass. For a substantial source, plan parallel research angles — typically some subset of: docs analysis, source analysis, tests analysis, examples analysis, changelog analysis — sized to the source, not a fixed number. Default to no more than ~5–8 concurrent subagents unless the user has explicitly asked for a wider pass; more than that rarely improves quality and mostly adds coordination overhead.

4. **Deep research.** For a substantial source, spawn the planned research angles as parallel `general-purpose` Agent-tool subagents, each with a clearly scoped prompt (what to read, what question to answer, what to report back) — the same pattern used to research and write this system's own architecture report. Do **not** rely on a skill-level `context: fork` for this fan-out; it produces only one subagent per invocation, not several. For a small source, just read it directly yourself — spawning subagents for an 11-line utility is waste, not thoroughness.

5. **Cross-verification.** Where two angles produced overlapping claims (e.g. docs-analysis and source-analysis both describe the same API), reconcile them using the conflict-resolution rules above rather than keeping both. Where a claim only has one source and it's low-trust (a single tutorial, unverifiable video claim), tag it Unconfirmed rather than silently upgrading its confidence.

6. **Knowledge extraction & research cache.** Write one file per research angle actually used into `research/` (e.g. `docs-analysis.md`, `source-analysis.md`) with inline citations. This is the WARM tier — it's allowed to be longer and more raw than `references/`, since its job is to preserve the evidence, not to be cheap to read. Write `research/unresolved.md` listing: what was inspected, what was intentionally skipped and why, what couldn't be accessed, what has weak/single-source evidence.

7. **Runtime reference compilation.** From the research cache, write the curated HOT tier into `references/` using the skeleton in `references/template/reference-file.template.md`. Always write `mental-model.md` and `decision-guide.md` (the latter must state at least one concrete scenario where the technology should **not** be used — this is the anti-overuse safeguard `developer-toolbox` depends on). Write other reference files (`api.md`, `patterns.md`, `pitfalls.md`, `performance.md`, etc.) only where the source actually has enough material to justify a dedicated file — do not create empty or near-empty files to satisfy a template. Cross-references in `SKILL.md`/`references/*.md` must stay one level deep — a reference file pointing to another reference file pointing to a third is exactly the chain that best practice warns Claude may not fully read.

8. **Metadata & provenance.** Write `metadata.yaml` from `references/template/metadata.yaml.template` — technology/version/ecosystem, every source with its URL and (for repos) commit SHA, `retrieved_at`/`compiled_at`/`last_refreshed` dates, `source_visibility` (see Security boundaries), `coverage_status` (`full` or `partial`), a qualitative `confidence`, and `unresolved_count` pointing at `research/unresolved.md`. Do not fabricate precision a source didn't provide — an unknown commit SHA is recorded as unknown, not guessed.

9. **SKILL.md compilation.** Write `SKILL.md` from `references/template/SKILL.md.template` — a thin router: a short mental-model summary, the when-to-use/when-not-to-use decision in a sentence or two (full detail lives in `decision-guide.md`), and links to the `references/*.md` files that exist. Keep the body well under the ~500-line/~5,000-token guidance — this is a hard truncation boundary on re-attach, not a style preference. If a first draft runs long, move detail into `references/`, don't shrink the font, so to speak.

10. **Evaluation.** Write `evals/fixtures.md` (a handful of known-answer questions the compiled `references/` should be able to answer, plus one "implement this small example using only `references/`" check, plus one "does `decision-guide.md` correctly flag a real when-NOT-to-use case" check). Actually answer the fixture questions using only what's in `references/` (not your general knowledge) to confirm they're answerable from the compiled files alone — if a question can't be answered that way, either the fixture is wrong or `references/` is missing something; fix whichever is true before moving on.

11. **Toolbox registration.** Append or update exactly one row for this technology in `skills/developer-toolbox/references/catalog.md` (see that skill's own format). Never rewrite the whole catalog file — touch only this technology's row.

12. **Present, don't commit.** Summarize what was produced, run `git status`/`git diff` in the repo, and show it to the user. Do not run `git add`/`git commit`/`git push` yourself.

## B. Refresh workflow

1. **Cheap staleness check.** Read the existing `metadata.yaml`. Compare `technology.version_studied`/`sources[].commit` against the current latest version or current HEAD of the source. If nothing meaningful changed, report that and stop — don't re-research for no reason.

2. **Classify the change.** Pull the changelog/release notes and, for a repo source, `git log <old_commit>..<new_commit> --stat` between the stored and current commit — these are structured signals, prefer them over trying to semantically diff prose documentation (no tool anywhere does that reliably, this one included). Decide: nothing meaningful changed / a targeted refresh is sufficient / a full rebuild is justified.

   **Full rebuild is justified when**: the diff touches a large fraction of the files previously cited across `references/*.md`'s sources, a major version bumped, or `metadata.yaml` already had `coverage_status: partial` going in (meaning the prior research was already incomplete, so patching it further compounds the gap rather than closing it).

3. **Targeted refresh** (the default path): map the changed files/paths to which `references/*.md` files cite them (via their existing citations back into `research/*.md`). Re-research and rewrite only those files, plus their corresponding `research/*.md` angle. Leave everything else untouched.

4. **Protect existing knowledge.** Before overwriting any `references/*.md` or `research/*.md` file, compare the new draft against the old one. If the new pass would produce **less** information, **lower confidence**, or drop a previously-verified fact the new research didn't actually contradict (e.g. a source that was reachable last time is unreachable this time), do not silently overwrite — keep the old content, note the regression in `research/unresolved.md`, and flag it prominently in the diff shown to the user. Never delete a `research/` file outright as part of a refresh.

5. **Update metadata**, run the evaluation fixtures again, update the catalog row, present the diff. Same discipline as ingestion steps 8–12.

## C. Inspect workflow

Read-only. Read `metadata.yaml` and `research/unresolved.md` for the named technology and report: version/commit studied, when compiled/last refreshed, freshness, coverage status, confidence, and the unresolved items. No research, no writes.

## Security boundaries

- **Never read `credentials/` or any `.env`-shaped file** — in this repo or in the source being studied — regardless of what the source claims to need. This system has no legitimate reason to ever open either.
- Before writing any file, scan generated content for secret-shaped strings (API-key-looking tokens, common credential patterns) and drop/redact them rather than writing them out. This is a cheap safety net, not a guarantee — it doesn't replace boundary #1.
- If the source is a private/unlicensed repository (not public OSS), set `source_visibility: private` in `metadata.yaml` and explicitly confirm with the user before compiling — private/company code and redistributable public library knowledge carry different reuse assumptions, and this repo's whole security model rests on staying private rather than on gitignoring secrets, so anything written here gets committed by default unless the user says otherwise.
- Never copy this repo's own `credentials/` contents into a generated skill under any circumstances, including as an "example."

## Never destroy, never auto-commit

`knowledge-forge` produces files and a diff. It never runs `git add`/`git commit`/`git push`. It never deletes a `research/` file as part of ordinary operation (only the user, or an explicit user-directed cleanup, removes one). Git history is the ultimate safety net for this system — that's a reason to keep it as the *only* safety net (no in-repo backup/versioning scheme is needed on top of it), not a reason to be careless about what gets written.
