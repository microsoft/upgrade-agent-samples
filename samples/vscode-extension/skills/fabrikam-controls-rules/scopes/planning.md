# Fabrikam controls — planning rules

Served to the planner at `scope: Planning`.

**Guardrail first:** do not add, remove, rename, or reorder any plan task to
satisfy this extension. The task list belongs to the scenario. Record the
decision and the constraints below; nothing more.

## Ordering constraints

- Bump `Fabrikam.Windows.Forms` to 8.x **before** any designer file is
  regenerated. Regenerating against the old package produces code that has to be
  thrown away.
- Upgrade shared UI libraries before the applications that reference them.

## Upgrade Option

**Fabrikam control pack** — `Modern` (default), `Compat`, or `None`.

- `Modern` — target `Fabrikam.Windows.Forms` 8.x and regenerate designer files.
  Correct unless the user needs compatibility with a pre-8.0 release.
- `Compat` — add the `Fabrikam.Windows.Forms.Compat` shim to every UI project
  and keep the v3 designer surface. Choose only when designer regeneration is
  out of scope for this upgrade.
- `None` — remove Fabrikam controls entirely and migrate to stock WinForms
  controls. Large; only when the user asks for it.

**Plan impact**: `Compat` adds a shim package reference to every UI project and
skips designer regeneration; `Modern` removes the shim and requires every
designer file flagged in the assessment to be regenerated; `None` replaces
control usages and invalidates the designer files outright.

## What to record

State the chosen option in the plan, with a one-sentence rationale. If the
choice is `Compat` or `None`, say which projects it affects.
