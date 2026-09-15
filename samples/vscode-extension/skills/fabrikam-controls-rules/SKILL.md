---
name: fabrikam-controls-rules
description: >
  Fabrikam UI control rules that apply during a .NET version upgrade — which
  Fabrikam.Windows.Forms versions are supported on modern .NET, what must be
  replaced rather than retargeted, and how the decision is recorded.
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

# Fabrikam UI controls during a .NET version upgrade

Fabrikam ships the `Fabrikam.Windows.Forms` control suite. We own its support
policy, and the platform's own compatibility data does not describe it — so a
.NET version upgrade must not decide anything about these packages without our
input.

**The one rule that always holds:** `Fabrikam.Windows.Forms` **before 8.0 is not
supported on .NET 8 or later**. Those references must be *replaced* with 8.x,
not retargeted. Do not infer a policy for a `Fabrikam.*` package that is not
named in our guidance — ask instead.

This body is what the `IntegrityReview` scope is served, because that scope is
declared in `scope` but deliberately left out of `scopeInstructions`. When
reviewing the resulting change, confirm that:

- no project targeting .NET 8+ still references `Fabrikam.Windows.Forms` < 8.0;
- every designer file touched by the bump was regenerated, not hand-edited;
- no `Fabrikam.Windows.Forms.Themes` reference survives.

This skill is a **scenario extension**: it defines no workflow of its own and is
never user-selectable. It adds Fabrikam's rules to the scenario named in
`extends-scenario`, at the three points named in `scope`.

Two things to change when you copy this sample:

- **`extends-scenario: [dotnet-version-upgrade]` is a placeholder.** Confirm the
  real scenario id in your environment — an id that matches nothing fails
  silently. If your guidance is cross-cutting, omit the field instead of
  guessing.
- **`order: 100`** only fixes presentation sequence when several extensions
  match (ascending; omitted sorts last). It does **not** arbitrate conflicts.
  100 is just a round mid-range value.

`traits` (`.NET|CSharp|VisualBasic`) gates on the repository — a separate filter
from `extends-scenario` and `scope`. All three must pass for this content to be
served.

See [`docs/06-scenario-extensions.md`](../../../../docs/06-scenario-extensions.md).
