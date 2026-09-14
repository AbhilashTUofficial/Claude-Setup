---
name: study
description: "Teaches a technology the user already has compiled learned-* knowledge for — explains fundamentals or a specific topic, gives exercises, quizzes, or progressively harder examples, generated fresh each time from the existing learned-<slug> skill's references/research (never a separate stored curriculum). Use on /study {technology} [topic], or on requests like 'teach me X', 'quiz me on Y', 'give me exercises on Z', 'explain topic X using what we already studied'."
argument-hint: "<technology> [topic]"
---

# study

Tutoring generated on demand from a `learned-<slug>` skill's `references/` (and, if the topic needs more depth, `research/`) — never a second, independently-maintained copy of the knowledge. The compiled technical reference is always the source of truth; this skill teaches from it rather than alongside it.

If the requested technology has no `learned-<slug>` skill yet, say so and suggest `/knowledge-forge <source>` — don't fall back to general model knowledge and present it as if it were the verified, compiled material.

See `references/teaching-modes.md` for how to handle each interaction mode (fundamentals, specific topic, exercises, quiz, progressive examples, compare two approaches). Read it before responding to a `/study` invocation.

## Ground rules

- Read `references/mental-model.md` and `references/decision-guide.md` from the target `learned-<slug>` skill first, then whichever other `references/*.md` files the requested topic actually needs — don't load every reference file for a simple question.
- Don't introduce claims that aren't in the target skill's `references/`/`research/`. If a good teaching example requires something the compiled knowledge doesn't cover, say that explicitly rather than inventing plausible-sounding detail.
- If `metadata.yaml` shows `freshness: stale`, mention that before teaching version-sensitive material.
