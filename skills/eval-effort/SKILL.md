---
name: eval-effort
description: "Recommends the optimal model tier and reasoning/effort level for a task, purely as advice — it never changes settings itself. Invoke as /eval-effort {task description}, or bare /eval-effort to evaluate the task in the user's immediately preceding message."
---

# Eval Effort

People often leave their model/effort setting wherever it last was — cranked up for yesterday's hard problem, or left low from a quick throwaway task — rather than reconsidering it per task. This skill is a fast, honest second opinion: given a task, say what tier of model and what depth of reasoning it actually calls for, in a couple of lines, and stop there.

**This skill only recommends. It never calls a tool to switch models or effort, and never tells the user their current setting is "wrong" in a scolding way — it just states what would be optimal and lets them act on it (or not).** If no tool for changing model/effort exists in this session (it usually doesn't — that's normally a UI control the person uses themselves), don't go looking for one or apologize for lacking it; just give the recommendation.

## What task to evaluate

- `/eval-effort {description}` — evaluate the described task directly.
- Bare `/eval-effort` — evaluate whatever the user's message immediately before this invocation asked for. If there isn't a clear preceding task (e.g. this is the very first message, or the prior message was small talk), ask them in one line to describe the task instead of guessing.

## The two axes

**Model tier** — think in three rough bands rather than specific version names (products change these over time and across surfaces):
- *Fast/small* — cheapest, quickest, weakest at multi-step reasoning. Right for lookups, format conversions, short factual answers, simple rewrites, boilerplate.
- *Balanced/mid* — the default workhorse. Right for most real tasks: normal coding, analysis, writing, multi-step tool use of moderate depth.
- *Max/frontier* — the most capable tier. Right for genuinely hard reasoning, ambiguous or high-stakes problems, large multi-file/multi-source synthesis, or anything where a wrong answer is expensive to discover later.

**Reasoning/effort level** — independent of model tier, think in terms of how much deliberation the task benefits from: *none/minimal* (the answer is basically retrieval or a mechanical transform), *low* (a little structuring but no real uncertainty), *medium* (some genuine reasoning or tradeoffs to weigh), *high* (multi-step reasoning, several plausible approaches to compare, non-obvious edge cases), *max* (the task is adversarial, safety/correctness-critical, or the cost of a subtly wrong answer is high and there's no cheap way to check the work afterward). Map this to whatever granularity the user's own interface actually exposes — some surfaces only have on/off extended thinking, others have named levels; give the recommendation in these general terms and let them translate it to their toggle.

The two axes are independent: a simple-but-huge data reformatting job might want a fast model at minimal effort; a short but genuinely tricky logic puzzle might want a mid-tier model at high effort even though the output is three sentences.

## Signals to weigh

Push toward **lower** tier/effort when the task is: factual lookup or retrieval, a mechanical or templated transform, short-form writing with no real ambiguity, something with an obvious right answer, or something cheap to redo if it comes out wrong.

Push toward **higher** tier/effort when the task involves: multi-step reasoning or planning, real ambiguity requiring judgment calls, unfamiliar or adversarial edge cases, code correctness in a nontrivial system, synthesizing many sources or a large amount of context, creative work where quality varies a lot by effort, or high stakes where a wrong answer is costly or hard to catch.

When genuinely unsure, default toward the *lower* recommendation and say so — it's cheap to redo a task that came out underpowered, but effort spent on a simple task is just gone. Say when a task is a toss-up rather than forcing false precision.

## Output format

Keep it to a few lines, not a report:

```
Recommended: <tier> model, <effort level> effort
Why: <one or two sentences pointing at the specific signals above that drove this>
```

If the task is a genuine toss-up between two reasonable settings, say so briefly ("either fast/minimal or balanced/low would be fine here — leaning fast/minimal because...") rather than presenting false confidence. Don't pad this with caveats, alternatives no one asked about, or a breakdown of every signal you considered — the person wants the answer, not the derivation.