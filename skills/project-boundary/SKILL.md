---

name: project-boundary
description: "Define and enforce a developer-controlled modification boundary for the current codebase. Keeps Claude from changing files, features, folders, functions, components, routes, services, APIs, branches, or other project areas outside the explicitly assigned scope. Boundaries are composable, can be saved as named presets, temporarily disabled, reverted, or reset. Invoke as "/project-boundary", "/project-boundary set", or "/project-boundary {boundary-definition}"."
---

---

# Project Boundary

Control what Claude is allowed to modify.

This skill establishes a **developer-controlled modification boundary** for the current project. It exists to prevent Claude from making unrelated changes while implementing a feature, fixing a bug, refactoring code, or working in a shared codebase.

The boundary is primarily a **modification boundary, not a read boundary**.

Claude may inspect, search, read, trace, and reason about code outside the active boundary when that is necessary to understand dependencies or complete the requested work. However, Claude must **not modify anything outside the active boundary without explicit developer approval**.

Boundaries are **composable**. A single boundary can contain any combination of files, folders, features, functions, components, services, APIs, routes, modules, pages, screens, branches, and other meaningful project scopes.

The skill maintains:

1. An active boundary
2. Boundary enforcement state
3. Boundary mode
4. Previous-boundary history
5. Named saved boundaries

It does not create project files or documentation unless explicitly requested.

---

# Invocation

The skill accepts both explicit definitions and natural language.

Do not require a rigid syntax.

These are all valid:

```text
/project-boundary
```

```text
/project-boundary set
```

```text
/project-boundary set files: auth.ts, login.tsx
```

```text
/project-boundary set only authentication files
```

```text
/project-boundary set login feature and auth folder
```

```text
/project-boundary set files auth.ts, login.tsx and function validateUser
```

```text
/project-boundary set frontend authentication and user profile
```

Brackets, commas, colons, equals signs, and quotes are optional unless needed to remove ambiguity.

Interpret natural language when the intended boundary is clear.

Do not force the developer to learn a command grammar just to define a scope.

---

# Core Principle

## Read broadly, modify narrowly

The active boundary answers one question:

> **What is Claude allowed to change?**

It does not mean:

> **What is Claude allowed to look at?**

For example, if the boundary is:

```text
feature: authentication
```

Claude may inspect:

- routing
- middleware
- database models
- API clients
- shared utilities
- configuration
- tests
- other features

if those are necessary to understand authentication.

But Claude may only modify files or project areas that fall within the authentication boundary.

If authentication depends on a shared utility outside the boundary, Claude may read it and explain the dependency. Claude must ask before modifying it.

---

# Boundary Types

Boundary types are **composable**.

There is no requirement to choose only one type.

A boundary may contain:

```text
files
folders
features
components
hooks
functions
services
apis
routes
modules
pages
screens
branches
```

Additional project-specific scopes may be used when they are meaningful and unambiguous.

Examples:

```text
files: package.json, auth.ts
feature: authentication
folder: src/auth
function: validateToken
component: LoginForm
route: /login
service: AuthService
api: POST /api/login
branch: feature/authentication
```

A boundary can combine them:

```text
feature: authentication
files: src/config/auth.ts, package.json
folder: src/auth
function: validateToken
component: LoginForm
```

The combined definition represents one boundary.

---

# Boundary Resolution

When a boundary is expressed conceptually rather than as exact paths, inspect the codebase to resolve it.

For example:

```text
/project-boundary set authentication feature
```

Claude should determine which current files, components, routes, services, APIs, and other project areas constitute the authentication feature.

Do not blindly assume that a feature corresponds to a single folder.

A feature may span:

```text
src/features/auth
src/middleware/auth.ts
src/api/auth.ts
src/components/LoginForm.tsx
src/services/session.ts
```

Claude should use the actual repository structure to determine the reasonable scope.

However:

> **Understanding a dependency does not automatically authorize modifying that dependency.**

If a required dependency falls outside the boundary, stop before modifying it.

---

# Invocation Behavior

## `/project-boundary`

If no definition is provided:

Ask the developer how they want to define the boundary.

Offer the available conceptual choices:

- files
- folders
- features
- components
- functions
- services
- APIs
- routes
- modules
- pages/screens
- branches
- combinations of the above

Example:

```text
How would you like to define the project boundary?

You can scope it by files, folders, features, functions, components,
services, APIs, routes, branches, or any combination of them.
```

Do not require the developer to choose only one.

---

## `/project-boundary set`

Behaves the same as `/project-boundary` when no definition follows it.

Ask for the intended scope.

---

## `/project-boundary set <definition>`

Parse and establish the supplied boundary.

Examples:

```text
/project-boundary set files: auth.ts, login.tsx
```

```text
/project-boundary set feature authentication
```

```text
/project-boundary set authentication feature and auth folder
```

```text
/project-boundary set only LoginForm and validateUser
```

If the definition is sufficiently clear, do not ask the developer to repeat it.

If the definition is ambiguous in a way that materially affects what Claude could modify, ask a focused clarification before activating it.

---

# Modes

The boundary supports a `mode`.

The default mode is:

```text
mode: strict
```

## Strict

Strict mode is the default and recommended mode.

Behavior:

- Reading outside the boundary is allowed.
- Searching outside the boundary is allowed.
- Tracing dependencies outside the boundary is allowed.
- Reasoning about outside code is allowed.
- Modifying outside the boundary requires explicit approval.
- Creating files outside the boundary requires explicit approval.
- Deleting files outside the boundary requires explicit approval.
- Renaming or moving items outside the boundary requires explicit approval.
- Configuration changes outside the boundary require explicit approval.
- Dependency changes outside the boundary require explicit approval.

Never weaken the boundary merely because modifying outside it would be easier.

---

# What Counts as a Modification

Treat the following as modifications:

- editing an existing file
- creating a file
- deleting a file
- renaming a file
- moving a file
- changing configuration
- changing dependencies
- changing lockfiles
- changing environment configuration
- changing database schemas
- changing migrations
- changing generated source
- changing tests
- changing documentation
- changing build configuration
- changing CI configuration
- formatting files in a way that changes their contents
- running a tool that mutates project files
- applying automated fixes
- changing code through scripts or code generators

If the operation changes repository state, assume it is a modification unless clearly authorized by the active boundary.

---

# Enforcement

Before every modification, determine:

1. What file or project area is being changed?
2. Does it fall inside the active boundary?
3. If not, has the developer explicitly approved the change?

If the target is outside the boundary:

**STOP before modifying it.**

Do not:

- silently expand the boundary
- assume permission because the change is small
- assume permission because the dependency is required
- modify it and explain afterward
- hide the modification inside a larger command
- modify it indirectly through another tool

Instead, explain:

```text
This change is outside the current project boundary.

Target:
<exact file / component / function / project area>

Why it appears necessary:
<reason>

What happens if we don't change it:
<consequence>

Alternative within the current boundary:
<alternative, if one exists>

Do you want to allow this change?
```

Keep the explanation concise and specific.

---

# Explicit Approval

Natural-language approval is valid.

Examples:

```text
yes
```

```text
go ahead
```

```text
allow it
```

```text
you can change that
```

```text
add it to the boundary
```

```text
include that file
```

Interpret the approval according to its wording.

## Temporary approval

If the developer says:

```text
just this time
```

or equivalent:

```text
allow it temporarily
```

then allow the specific modification without changing the permanent boundary.

Do not add the target to the active boundary.

## Permanent approval

If the developer says:

```text
add it
```

```text
include it in the boundary
```

```text
make that part of the scope
```

then update the active boundary to include the approved target.

Record the previous boundary so `/project-boundary revert` can restore it.

---

# Smallest Reasonable Scope

Always prefer the smallest boundary that can reasonably accomplish the requested work.

For example, if the developer says:

```text
/project-boundary set login feature
```

do not automatically turn it into:

```text
entire frontend
```

because login depends on shared frontend infrastructure.

Likewise, if the developer specifies:

```text
files: Login.tsx, Login.test.tsx
```

do not automatically include the entire directory.

Dependencies may be read without becoming writable.

---

# Boundary Changes

Changing the active boundary is itself a significant state change.

Before replacing an existing boundary, preserve the previous boundary in history.

Example:

```text
Current:
feature: authentication

New:
feature: profile
```

The previous authentication boundary must remain available to `/project-boundary revert`.

---

# Commands

## Set

```text
/project-boundary set
```

Ask for a definition.

Or:

```text
/project-boundary set <definition>
```

Replace the current boundary with the supplied definition.

---

## Unset

```text
/project-boundary unset
```

Disable enforcement without deleting the current configuration.

Meaning:

```text
boundary configuration remains
enforcement = inactive
```

This allows the developer to temporarily work without enforcement and later restore enforcement.

---

## Reset

```text
/project-boundary reset
```

Clear the current active boundary.

Saved boundaries remain untouched.

After reset, no project modification boundary is configured.

Do not invent a replacement boundary.

---

## Revert

```text
/project-boundary revert
```

Restore the boundary that existed immediately before the latest boundary change.

Maintain a history stack rather than only one previous boundary whenever practical.

Example:

```text
Boundary A
    ↓
Boundary B
    ↓
Boundary C
```

After:

```text
/project-boundary revert
```

restore:

```text
Boundary B
```

Another revert may restore:

```text
Boundary A
```

Saved presets are separate from revert history.

---

# Saved Boundaries

Saved boundaries are named presets that can be restored later.

## Save

```text
/project-boundary save <keyword>
```

Example:

```text
/project-boundary save auth
```

This stores the current active boundary under:

```text
auth
```

The saved boundary should contain the boundary definition and relevant mode.

If the keyword already exists, do not silently overwrite it.

Ask for confirmation before replacing an existing saved boundary.

---

## Load

Loading uses the `set` command:

```text
/project-boundary set <keyword>
```

If `<keyword>` exactly matches a saved boundary, restore that saved boundary.

Example:

```text
/project-boundary set auth
```

restores the saved `auth` boundary.

A saved keyword match takes precedence only when the command is otherwise ambiguous.

Explicit boundary definitions take precedence.

For example:

```text
/project-boundary set feature: auth
```

must be interpreted as a new boundary definition, even if `auth` is also a saved keyword.

---

## Delete

```text
/project-boundary delete <keyword>
```

Delete the saved boundary.

Deleting a saved boundary must not change the current active boundary.

---

# Status

Support:

```text
/project-boundary status
```

Show:

```text
Status: active
Mode: strict

Current boundary:
- features: authentication
- files: src/config/auth.ts
- functions: validateToken

Previous boundary:
- feature: profile

Saved boundaries:
- auth
- frontend
- payments
```

If no boundary is configured:

```text
Status: not configured
```

Do not imply that the project is unrestricted because of a previously saved preset.

---

# List Saved Boundaries

Support:

```text
/project-boundary list
```

Show the available saved presets and their definitions.

Example:

```text
Saved boundaries:

auth
  feature: authentication
  files: src/config/auth.ts

payments
  feature: payments
  folder: src/payments

frontend
  folders: src/components, src/pages
```

Do not change the current boundary when listing presets.

---

# Saved Boundary Switching

Saved boundaries are intended to make switching development scopes fast.

Example:

```text
/project-boundary set feature: authentication, files: package.json
/project-boundary save auth

/project-boundary set feature: theme, files: global.css
/project-boundary save theme

/project-boundary set auth
```

The final command restores the authentication boundary.

The developer can then switch:

```text
/project-boundary set theme
```

without redefining the scope.

This is particularly useful when working across multiple independent areas of a project.

---

# State Model

Maintain conceptual state equivalent to:

```yaml
project_boundary:
  status: active
  mode: strict

  current:
    files: []
    folders: []
    features: []
    components: []
    hooks: []
    functions: []
    services: []
    apis: []
    routes: []
    modules: []
    pages: []
    screens: []
    branches: []

  history: []

  saved: {}
```

The exact implementation mechanism is environment-dependent.

Do not create a project file solely to persist this state unless explicitly requested.

---

# Boundary and Git

Git branches can be included in a boundary when the developer specifies them.

Example:

```text
/project-boundary set branch: feature/auth
```

or:

```text
/project-boundary set branch feature/auth, feature/profile
```

A branch boundary does not automatically mean Claude may switch branches.

Branch switching changes repository state and must follow the developer's explicit request and the environment's normal Git safety rules.

A branch boundary can be used to describe where modifications are permitted or expected, but it does not override other repository protections.

---

# Conflicts and Ambiguity

When multiple boundary definitions overlap, treat them as additive unless the developer explicitly says otherwise.

Example:

```text
files: auth.ts
feature: authentication
```

means both scopes are allowed.

If a target matches either allowed scope, it is within the boundary.

Do not interpret one scope as cancelling another.

If the developer uses exclusion language:

```text
everything in authentication except auth.test.ts
```

treat the exclusion as higher priority than the broader inclusion.

If an exclusion is ambiguous, ask before modifying.

---

# Boundary Does Not Override Higher-Level Safety

The project boundary is a developer workflow control.

It does not override:

- platform safety requirements
- repository permissions
- tool restrictions
- authentication requirements
- Git protections
- environment restrictions
- explicit user instructions with higher priority

The boundary should never be used as justification for an otherwise prohibited action.

---

# Working With Existing Uncommitted Changes

Before modifying a target, be aware of existing local changes when possible.

Do not assume that uncommitted code was created by Claude.

If a file inside the boundary already contains unrelated modifications:

- preserve them
- avoid overwriting them
- make the smallest targeted change possible
- do not reset or discard them
- do not use destructive Git commands to "clean things up"

If an existing modification makes the requested change unsafe or ambiguous, stop and explain the conflict before changing it.

---

# Boundary Violations

If Claude discovers that it already modified something outside the boundary:

1. Stop further modifications.
2. Identify exactly what was changed.
3. Tell the developer immediately.
4. Do not silently revert the change.
5. Ask whether they want the change reverted or retained.
6. Do not hide the violation inside a larger cleanup.

Boundary enforcement should be transparent.

---

# Interaction With Other Skills

Other skills or workflows may inspect the repository broadly.

The project boundary still applies to modifications.

For example:

- context-gathering may read outside the boundary
- code review may inspect outside the boundary
- testing may inspect outside the boundary
- debugging may trace outside the boundary

But any resulting modification must still satisfy the active project boundary.

If another workflow asks Claude to modify an out-of-bound target, pause and request explicit approval.

---

# Final Behavior

Once a boundary is active, treat it as an ongoing instruction for the remainder of the development session until the developer:

- changes it
- unsets it
- resets it
- loads another saved boundary
- explicitly authorizes an out-of-bound modification

Do not repeatedly ask the developer to confirm changes that are clearly inside the active boundary.

Do not repeatedly explain the entire boundary before every modification.

Only surface the boundary when:

- a proposed change is outside it
- the scope is ambiguous
- the developer changes the boundary
- the developer requests status
- a boundary violation occurs

The goal is to make the boundary **quiet when everything is safe and explicit when something crosses the line**.

---

# Working Rule

When uncertain, follow this priority:

1. **Do not modify outside the boundary.**
2. **Read outside the boundary when necessary to understand the problem.**
3. **Prefer the smallest modification that solves the task.**
4. **Ask before expanding scope.**
5. **Never silently weaken or reinterpret the boundary.**
6. **Keep the developer in control of what Claude changes.**
