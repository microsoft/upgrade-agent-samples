# Fabrikam controls — planning rules

Served to the planner at `scope: Planning`.

**Stay inside your lane.** Planning guidance may legitimately constrain
ordering, add a prerequisite task, or contribute an upgrade option — that is
what this scope is for. What it must not do is restate the scenario's own plan,
override a choice the user has already made, or weaken a safety rule. Contribute
the Fabrikam-specific constraints below and leave the rest of the plan alone.

**The guardrail, restated here on purpose:** `Fabrikam.Windows.Forms` **before
8.0 is not supported on .NET 8 or later**, so every pre-8.0 reference must be
replaced with 8.x. None of the options below waive that — they differ only in
what happens to the *designer surface*.

> Why restate it? Because a scope mapped in `scopeInstructions` is served *this
> file instead of* the skill's root body. A guardrail that lives only in the
> root body would be invisible here. Repeat anything a scope must not decide
> without.

## Ordering constraints

- Bump `Fabrikam.Windows.Forms` to 8.x **before** any designer file is
  regenerated. Regenerating against the old package produces code that has to be
  thrown away.
- Upgrade shared UI libraries before the applications that reference them.

## Upgrade Option

**Fabrikam control pack** — `Modern` (default), `Compat`, or `None`. All three
replace the pre-8.0 package; they differ in how the designer surface is handled.

- `Modern` — move to `Fabrikam.Windows.Forms` 8.x and regenerate designer files.
  Correct unless regeneration is out of scope.
- `Compat` — move to `Fabrikam.Windows.Forms` 8.x **and** add the
  `Fabrikam.Windows.Forms.Compat` shim, which restores the v3 designer API on
  top of 8.x so designer files don't have to be regenerated. This satisfies the
  replacement rule; it does **not** keep a pre-8.0 reference.
- `None` — drop Fabrikam controls entirely and migrate to stock WinForms
  controls. Largest option; only when the user asks for it.

**Plan impact**: every option removes all pre-8.0 `Fabrikam.Windows.Forms`
references. `Compat` additionally adds the shim to every UI project and skips
designer regeneration; `Modern` requires every designer file flagged in the
assessment to be regenerated; `None` replaces control usages and invalidates the
designer files outright.

## What to record

State the chosen option in the plan, with a one-sentence rationale. If the
choice is `Compat` or `None`, say which projects it affects.
