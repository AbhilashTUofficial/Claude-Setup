<!--
Template for a single skills/learned-<slug>/references/*.md file.
Only create files that have real content — don't stamp out an empty
performance.md just because this template exists. If the file will run
past ~100 lines, add a table-of-contents section (see below) since Claude
may only partial-read long reference files.
-->

# {{TOPIC}} — {{TECHNOLOGY_DISPLAY_NAME}}

<!-- Only include this if the file is long: -->
## Contents
- [{{Section A}}](#section-a)
- [{{Section B}}](#section-b)

{{CURATED, SYNTHESIZED CONTENT — the developer-experience answer, not raw notes.
Write it the way you'd explain it to a competent engineer who's never used this
technology: what it is, how it actually behaves, what surprises people.}}

Tag anything that isn't obviously self-evident:
- **Documented** — a source states this directly
- **Verified-in-code** — confirmed by reading source/tests yourself
- **Derived** — a logical conclusion from multiple documented facts
- **Judgment** — a best-practice opinion, not a fact
(Unconfirmed claims don't belong here — they go in research/unresolved.md instead.)

## Sources

- {{citation 1 — file path + line, URL, or commit SHA}}
- {{citation 2}}
