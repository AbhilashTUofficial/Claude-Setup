# Source-type adapters

Discovery playbooks per source type. The extraction/synthesis/evidence-tagging logic in `workflow.md` is shared across all of them — only how you *find* the material differs.

## Repository (local clone or GitHub URL)

Read, roughly in this order: `README`, top-level docs directory, package manifest (`package.json`/`pyproject.toml`/etc. — this is where the actual version/ecosystem for `metadata.yaml` comes from), public API surface (exported symbols, type definitions), tests (the highest-trust source for actual behavior — prefer them over docs whenever they conflict), examples directory, `CHANGELOG`/release notes.

Explicitly skip: `node_modules`/vendored dependencies, build output/`dist`, generated files, test fixtures that aren't themselves documentation of behavior.

Record the exact commit SHA (or tag) studied in `metadata.yaml` — this is what makes a later refresh's `git log <old>..<new>` diff possible. If given a local clone, confirm which remote/branch it tracks before assuming it's authoritative.

## Documentation website

Start from the nav/table-of-contents structure, not a blind crawl. Read concept/guide pages and API reference pages; note any version selector and record which version the docs being read actually describe. Explicitly skip marketing, pricing, legal, and blog/changelog-as-content-marketing pages — they're not technical knowledge, even when they're reachable from the same nav.

If the site publishes an `llms.txt` or similar curated index, it's a reasonable starting map of what exists, but verify its content against the actual pages rather than trusting it as ground truth — these files are self-attested by the site owner and not independently checked by anyone.

## Video / playlist / course

Pipeline: video → transcript → chapters → concepts/claims, each claim tagged with its source timestamp. This depends entirely on a transcript existing or being obtainable — state plainly when one isn't available rather than inventing content from the video's title/description.

There is no way to verify a claim made only in a video against an independent source unless one exists elsewhere. Default every video-only claim to **Unconfirmed** unless it's independently corroborated by the actual repository/docs — this is a real, structural limitation of this source type, not a gap to paper over.

## Local files (Markdown, PDF, source, directories)

Same extraction pipeline as the repository adapter, minus the network-fetch step. If the files are a subset of a larger project (e.g. one package in a monorepo), note that scope boundary explicitly in `research/unresolved.md` rather than implying the whole project was studied.
