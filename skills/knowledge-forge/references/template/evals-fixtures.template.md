<!--
Template for skills/learned-<slug>/evals/fixtures.md.
Never loaded at runtime by the learned skill itself — this is
knowledge-forge's own quality gate, run once before a diff is presented,
and re-run (extended, not replaced) on every refresh.
-->

# Eval fixtures — {{TECHNOLOGY_DISPLAY_NAME}}

Answer every question below using **only** `references/` (not general knowledge) before considering this learned skill complete. If a question can't be answered that way, either fix the fixture or fix `references/` — don't ship a gap silently.

## Known-answer questions

1. **Q:** {{a factual question with a verifiable answer}}
   **A:** {{the answer, and which reference file it came from}}

2. **Q:** {{another factual question}}
   **A:** {{answer + source reference file}}

## Implementation check

**Task:** {{a small, concrete task a developer would actually do with this technology}}
**Result:** {{confirm it can be implemented using only what references/ + examples/ provide — note if it required anything outside them}}

## When-NOT-to-use check

**Q:** Give a concrete scenario where {{TECHNOLOGY_DISPLAY_NAME}} is the wrong choice.
**A:** {{the scenario, matching what decision-guide.md says — if decision-guide.md doesn't actually support this answer, fix decision-guide.md}}
