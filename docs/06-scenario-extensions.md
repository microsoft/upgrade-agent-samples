# 6. Scenario extensions

A **scenario extension** is a skill that *adds to a scenario the orchestrator
already owns*, instead of defining a workflow of its own.

This is the surface to use when you own a technology that appears **inside
somebody else's migration** — a control library, a package family, an API
surface. The orchestrator's built-in scenarios (for example, a .NET version
upgrade) only know platform defaults. Everything you know about *your* product —
your deprecations, your replacements, your support policy — has to arrive as a
scenario extension.

```mermaid
flowchart LR
    S["Built-in scenario<br/>(e.g. .NET version upgrade)"] --> W
    subgraph W["Workers, each at its own point in the flow"]
        A["assessor"]
        P["planner"]
        TB["task-breaker"]
        E["task-executor"]
        R["code-reviewer"]
    end
    X["Your scenario extension<br/>scope: [Assessment, Planning]"] -. "served at matching scopes only" .-> A
    X -. " " .-> P
```

> **Scenario vs. scenario extension.** A *scenario* (`discovery: scenario`,
> [doc 4](04-skills.md)) is a workflow the user can pick. A *scenario extension*
> is never user-selectable, never appears in agent skill lists, and is never
> returned by skill search. It exists only to be injected into a scenario that is
> already running.

## 6.1 Declaring one

A scenario extension is an ordinary `SKILL.md` with `discovery: scenarioExtension`:

```yaml
---
name: fabrikam-controls-rules
description: >
  Migration rules for Fabrikam WinForms controls during a framework upgrade.
metadata:
  discovery: scenarioExtension
  extends-scenario: [dotnet-version-upgrade]
  traits: .NET|CSharp|VisualBasic
  order: 100
  scope: [Assessment, Planning, IntegrityReview]
  scopeInstructions:
    Assessment: scopes/assessment.md
    Planning: scopes/planning.md
---

Fabrikam controls ship in `Fabrikam.Windows.Forms`. Versions before 8.0 are not
supported on .NET 8+ and must be replaced, not retargeted.
```

| Field | Required | Meaning |
|-------|----------|---------|
| `discovery: scenarioExtension` | **Yes** | Classifies the skill. Case-insensitive. Only `none`, `preload`, `lazy`, `system`, `scenario`, `scenarioExtension` are accepted — anything else counts as a typo. Exclusive: combining it with another mode (`scenarioExtension, preload`) collapses back to `scenarioExtension`, so extension content can never also be preloaded or selected as a scenario. |
| `scope` | **Yes** | *Where in the flow* the extension applies. String or list. **Omitting it means the extension is never used** — see §6.3. |
| `extends-scenario` | No | Scenario id(s) it applies to. String or list. **Omit to apply to every scenario** — the right shape for cross-cutting guidance such as review rules. |
| `scopeInstructions` | No | Map of scope → file path, relative to the skill folder. Chooses *what* is served at a scope; never turns one on. See §6.4. |
| `traits` | No | Standard trait gate, ANDed with your manifest's `traits`. See [doc 5](05-skills-metadata-and-traits.md). |
| `order` | No | Ascending presentation order; lower is served first. **Omitted sorts last.** Ties break on extender id, then skill name. |

`name` and `description` are the usual top-level fields. `requires-extension` is
for *scenarios* and has no meaning here.

> **Keep the YAML shapes intact.** `scope` and `extends-scenario` accept a
> scalar **or a list**; `scopeInstructions` must be a **mapping**. Don't
> pipe-join the lists (`scope: Assessment|Planning` is one scope named
> `Assessment|Planning`) and don't stringify the map.

## 6.2 The scope vocabulary

Each worker in a scenario asks for the extension content relevant to *its* point
in the flow. Your `scope` decides which of those requests you answer.

| Scope | Asked by | Put here |
|-------|----------|----------|
| `Assessment` | the assessment workers | Detection rules — deprecated packages, unsupported versions, what to flag and how to judge it. |
| `Planning` | the planner | Ordering constraints, prerequisites, and **upgrade options** the user should be asked about (§6.6). |
| `TaskBreakdown` | the task-breaker | How work on your technology should be split into tasks. |
| `Execution` | the execution workers, including error handling | The migration mechanics — API replacements, code patterns, before/after snippets. |
| `IntegrityReview` | the code-reviewer | Correctness rules for reviewing the resulting change. |
| `Any` | every scope | Guidance that genuinely applies throughout. **Must stand alone** — listed next to named scopes it would make them meaningless, so the named ones win and the `Any` is dropped with a warning. A `scope` value only, never a `scopeInstructions` key. |

A scope can be requested by **more than one worker**. `Assessment` and
`Execution` in particular are each asked for by multiple workers — for example,
`Execution` content is served both when work is being applied and when a failure
is being fixed. Write for the scope's *purpose*, not for one imagined caller.

Scopes are **free-form strings**, matched case-insensitively. A scope nothing
asks for is simply inert — it costs nothing, and it starts working if that scope
is wired later. The table above is the set wired today.

Pick the narrowest set that is true. Content is served **per request, not once
per run**: a worker asks at the moment it needs it, and some workers run
repeatedly — `Execution` is requested on every task. A broadly-scoped extension
is therefore loaded many times over a single scenario, and spends budget every
time (see [doc 7](07-instruction-size-and-tokens.md)).

## 6.3 `scope` and `extends-scenario` treat "absent" differently

This trips people up, and the difference is deliberate:

| Field | Omitted means |
|-------|---------------|
| `extends-scenario` | **Every scenario.** It is a *filter*; removing the filter widens the match. |
| `scope` | **Never used.** It is not a filter — it is the declaration that the extension applies anywhere at all. Nothing to apply to means nothing happens. |

If you want "everywhere" behaviour for scope, write it out: `scope: Any`.

### Finding the scenario id to target

`extends-scenario` matches the scenario's **id**, and a name that doesn't match
any scenario simply never fires — silently, because nothing is wrong with your
skill, it just never applies. Since scenario ids are owned by whatever ships the
scenario, don't guess one:

- **Read it from the scenario you're extending.** A scenario's own skill
  declares its id; that is the authoritative spelling, and it is what you copy.
- **Confirm empirically before you invest.** Ship a deliberately obvious
  one-line `Assessment` scope first and check it appears in a real run. Getting
  the id wrong and getting the `scope` wrong look identical from the outside, so
  prove the id works before layering real content on it.
- **If your guidance is genuinely cross-cutting, omit the field.** Review rules
  that hold regardless of the upgrade being performed don't need an id at all —
  and omitting is safer than pinning the wrong one.

> The samples in this repo use `dotnet-version-upgrade` as an illustrative
> placeholder. Verify the id in your target environment rather than assuming
> this one.

## 6.4 `scopeInstructions` — different content at different points

One skill can serve a different file at each scope, so a worker only pays for
the part that concerns it:

```
skills/fabrikam-controls-rules/
├── SKILL.md              # frontmatter + shared body (the fallback)
└── scopes/
    ├── assessment.md     # detection rules
    └── planning.md       # ordering + the upgrade option
```

Rules:

- It **never turns a scope on.** A key naming a scope you didn't declare in
  `scope` is never served — you are filtered out at that scope before any
  content is resolved, so your root body doesn't appear there either. The one
  exception is `scope: Any`, which already applies everywhere, so it may map
  any scope an agent queries.
- **`Any` is not a valid key.** It is a `scope` value only. A `scopeInstructions`
  entry keyed `Any` is ignored with a warning, because a scope you don't map is
  already served your root body.
- **There is no catch-all key.** A scope you don't map is already served your
  `SKILL.md` body. Put shared guidance there, or map the same file to each scope
  it belongs to.
- Paths are **relative to the skill folder**, and paths that escape it are
  rejected.
- If a mapped file is missing, unreadable, or empty it is **skipped with a
  warning**, and the remaining mapped files are still served. Only when **none**
  of a scope's files can be read does that scope **fall back to your root body**.
  You declared the scope; a mistyped path must not leave you worse off than
  mapping nothing.
- An extension is dropped only when it has no text anywhere.
- A scope mapped to **several** files is concatenated. That makes truncation
  non-resumable (§6.5) — map **one file per scope** if you want it resumable.

## 6.5 How the content reaches the agent

Each worker pulls what it needs, at the moment it needs it. You never wire
anything: workers ask unconditionally, and "no extensions apply" is a **success**,
not an error. Which scenario is active is tracked by the run itself — you never
pass a scenario id anywhere, and there is no hook for you to register.

Your content arrives wrapped:

```text
<scenario_extension name="…" scope="…" path="…">
…content…
</scenario_extension>
```

The **whole response is allocated against a fixed character ceiling** —
preamble, wrappers and content together — divided across the matching extensions
**by ascending need**, so an extension smaller than its equal share releases the
remainder to the others. Declaration order never decides who gets trimmed, and
no single extension can starve the rest. (Truncation markers themselves aren't
charged, so the rendered output can run marginally over.)

The exact ceiling and line cap are **implementation details that can change**,
so design to the shape of this behaviour, not to the numbers. At the time of
writing the ceiling is on the order of 60,000 characters and a partial block
shows up to about 150 leading lines. Never author to the limit; author so that
truncation would be survivable.

An extension that doesn't fit gets its **leading whole lines plus an explicit
pointer** — the line cap, or fewer if its share allows fewer — never a silent
cut:

```text
<scenario_extension name="…" scope="…" path="…"
    delivery="partial" shown-lines="150" total-lines="4000">
…first 150 lines…
[Truncated at line 150 of 4000. Continue with read("…", offset=150), or search it for the
package or API you need.]
</scenario_extension>
```

If not even one line fits, the extension degrades to a body-less **reference**
naming the file, so the worker still learns it exists and can read it:

```text
<scenario_extension name="…" scope="…" path="…" delivery="reference" total-lines="4000">
[Not included: too large to fit. Use read("…") for the package or API you need.]
</scenario_extension>
```

When the budget is so exhausted that even a reference won't fit, the response
ends instead with a **notice that further extensions were omitted**. That is the
worst case, and it is the one to design against: an extension you cannot see is
an extension that cannot influence the run.

Three consequences for you as an author:

1. **Cuts land on line boundaries**, so a partial table or list can't read as a
   complete one, and the resume offset is exact.
2. **A complete block carries none of these markers.** Their presence *is* the
   signal that more exists.
3. **Put the decisive content first.** A policy table's guardrail row ("do not
   infer a policy for a package not listed here") belongs *above* the table, not
   below it, so it survives a partial delivery.

Keep lines to a readable length and this machinery stays invisible. See
[doc 7](07-instruction-size-and-tokens.md) for sizing guidance.

## 6.6 Contributing an upgrade option (`Planning`)

Planning content may include an `## Upgrade Option` section carrying a
`**Plan impact**:` line. The planner treats a contributed option like a
first-party one: it is evaluated at the planning gate, listed under
`## Upgrade Options` in the plan, and attributed to its source.

```markdown
## Upgrade Option

**Fabrikam control pack** — choose `Modern` (default), `Compat`, or `None`.

**Plan impact**: `Compat` adds a shim package reference to every UI project and
keeps the v3 designer surface; `Modern` removes it and requires designer files
to be regenerated.
```

Use this for a decision only the user can make.

## 6.7 Rules and boundaries

- **Extension guidance is additive, and additive is not powerless.** It cannot
  override safety rules, the user's explicit instructions, or replace the
  scenario's own instructions. Within those limits, Planning-scope guidance
  legitimately *may* add or reorder tasks, constrain the strategy, or contribute
  an upgrade option — that is what the scope is for. What you cannot do is
  redefine the scenario itself or override a decision the user already made.
- **`order` does not arbitrate conflicts.** It fixes the sequence blocks are
  served in, nothing more. Where two extenders give genuinely incompatible
  instructions for the same code, the correct outcome is for the agent to
  surface the conflict as a decision — not to take whichever block sorted last.
  If your guidance only holds under conditions, say so in the text.
- **A block never says who packaged it.** It carries the skill's name and the
  path its content came from. Which extender shipped it is distribution
  plumbing; don't write guidance that depends on the agent knowing your brand
  from the wrapper. Say it in the body if it matters.
- **Your `Assessment` guidance can shape the assessment report.** State plainly
  what you want recorded, and where. If you name a destination file, your
  content goes there and nowhere else. Don't name a path inside the report's own
  `assessment/` folder — the orchestrator owns and rewrites that tree. A file of
  your own belongs beside the report.
- **A skill folder is trusted content**, but only its own files: mapped paths
  that escape the folder are rejected.

## 6.8 When it doesn't work

Authoring mistakes **fail quietly by design** — a broken extension makes itself
inert rather than derailing somebody else's upgrade. That is good for users and
awkward for you: nothing crashes, your content simply never appears. Every one
of these is logged with the skill name, so raise the host's log verbosity and
search the output for your skill's `name` — that string is your fastest signal.

If you can't get at the logs, bisect instead. Reduce the skill to a single
scope, a short literal body, and no `scopeInstructions`, confirm *that* appears,
then add one piece back at a time. Most of the table below is diagnosable this
way in a few minutes.

| Symptom | Likely cause |
|---------|--------------|
| Never served anywhere | No `scope` declared. It does **not** default to `Any`. |
| Never served, `scope` looks right | `extends-scenario` names a scenario that doesn't exist — check the spelling against the scenario you mean to extend. |
| Served everywhere, unexpectedly | `extends-scenario` omitted — that means *every* scenario. |
| Served at some scopes, not others | A `scopeInstructions` key names a scope missing from `scope`. The map never turns a scope on (unless you declared `scope: Any`). |
| A `scopeInstructions` entry is ignored entirely | It is keyed `Any`, which is a `scope` value, not a key. |
| `Any` seems ignored | `Any` was listed alongside named scopes; the named ones win and `Any` is dropped with a warning. |
| Your root body appears where you mapped a file | *Every* file mapped to that scope was missing, empty, unreadable, or escaped the skill folder, so the scope fell back to the body. |
| Part of a multi-file scope is missing | One mapped file failed and was skipped; the rest were still served. The warning names it. |
| Appeared in skill search or an agent list | It isn't classified as an extension. Check `discovery`. |
| Content ends mid-document, or a block has no body | Partial or reference delivery — your content didn't fit. Move the decisive material to the top and see [doc 7](07-instruction-size-and-tokens.md). |

> Declaring `extends-scenario`, `scope` or `scopeInstructions` *without* a valid
> `discovery` — absent, blank, or misspelled — is tolerated: the shape says
> plainly what the skill is, so it still classifies as an extension rather than
> being preloaded into every session, and the bad value is logged. For any
> *other* skill, an unparseable `discovery` fails closed and matches no
> discovery query at all. Don't lean on the rescue — it is a safety net, not a
> second way to declare an extension. Write `discovery: scenarioExtension`.

## Next

- [Instruction size & token budget](07-instruction-size-and-tokens.md) — how big
  your content should be, and why.
- [Extender sub-agents](08-sub-agents.md) — shipping your own worker agents.
