# Expressions

Full evidence and citations: `research/workflow-execution-analysis.md`.

A parameter is an expression if its **stored value starts with `=`** — the `{{ }}` you type in the editor is what goes *inside* that, not the marker itself. Everything inside `{{ }}` is JavaScript, evaluated against a sandboxed context object.

## Context you can reference inside `{{ }}`

| Expression | Gives you |
|---|---|
| `$json` | The current item's JSON |
| `$binary` | The current item's binary/file data |
| `$('NodeName')` | The modern node selector — `.first()`, `.last()`, `.all()`, `.item`, `.itemMatching()` (traces lineage through branches/merges via `pairedItem`) |
| `$input` | The current node's own incoming data — `.item`, `.first()`, `.last()`, `.all()` |
| `$parameter` / `$rawParameter` | This node's own resolved/raw parameter values |
| `$workflow` | `{ active, id, name }` — throws a friendly error if the workflow hasn't been saved yet (no `id`) |
| `$execution` | Execution id/mode/resume info — populated by the execution engine, not always present (e.g. not during credential-testing) |
| `$vars` | Instance-level custom variables |
| `$secrets` | Only exposed while resolving **credential** fields specifically — not available in ordinary node parameters |
| `$now` / `$today` | Luxon `DateTime` instances |
| `$jmesPath(...)` | JMESPath query over JSON |
| `$evaluateExpression(expr, itemIndex?)` | Recursively evaluate another expression string |

Expressions also work inside credential fields, where they can read data from the current execution context.

## Sandboxing — what you can't do

Expressions run in a deliberately locked-down context: dangerous globals (`document`, `eval`, `Function`, `require`, `fetch`, `Promise`, `Proxy`, `WebAssembly`, ...) are shadowed away, and a regex explicitly blocks any expression text containing `.constructor` (a common sandbox-escape vector). Don't expect Node.js globals, network access, or prototype-chain tricks to work inside an expression — that's by design, not a bug to work around. If you need real code execution, use a Code node (which runs in a separate, more capable sandbox/task-runner) instead of trying to push logic into an expression.
