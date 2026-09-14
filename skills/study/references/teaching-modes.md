# Teaching modes

All modes read from the same source (the target `learned-<slug>` skill's `references/`/`research/`) and generate their output fresh each time — nothing here is pre-written or cached.

## Teach fundamentals

`/study <technology>` with no topic. Read `mental-model.md` and `decision-guide.md`, then walk the user through the core concepts in a logical order (not just a reformatted dump of the reference file) — build up from what the technology is *for* to how it actually works.

## Explain a specific topic

`/study <technology> <topic>`. Read the reference file(s) that cover it and explain in more depth/more conversationally than the reference file's own terse form, using concrete examples where the technology's `examples/` directory has relevant material.

## Exercises

Generate progressively harder tasks the user can actually attempt, grounded in real patterns from `patterns.md`/`examples/` — not invented scenarios that don't match how the technology is actually used. State what a correct solution should demonstrate, not necessarily a worked solution, unless asked for one.

## Quiz

Generate questions with answers grounded in `references/` content, similar in spirit to `evals/fixtures.md` but for the user rather than for validating the learned skill itself — don't reuse the eval fixtures verbatim, generate fresh ones.

## Progressively harder examples

Start from the simplest realistic use case in `patterns.md`/`examples/` and layer in complexity (edge cases, performance considerations from `performance.md` if it exists, common pitfalls from `pitfalls.md`) one step at a time rather than jumping straight to an advanced example.

## Compare two approaches / technologies

If both are `learned-<slug>` skills, read both skills' `decision-guide.md` and `mental-model.md` and contrast them directly — this is one of the few cases where reading two learned skills at once is justified, since the comparison itself is the point.

## What this mode does not do (V1)

No persistent "what have you already learned" tracking across sessions — every `/study` invocation is stateless and generates fresh from the current `references/`. If the user asks "what haven't I learned yet," say that progress-tracking isn't implemented yet rather than guessing at their history.
