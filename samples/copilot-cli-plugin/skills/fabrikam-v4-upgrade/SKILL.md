---
name: fabrikam-v4-upgrade
description: >
  Migrate a .NET solution from the Fabrikam v3 component suite to v4 — apply the
  package renames (Fabrikam.Web.Mvc → Fabrikam.AspNetCore.Mvc, Fabrikam.Logging
  → Fabrikam.Diagnostics, Fabrikam.Security.Tokens → Fabrikam.Identity.Tokens),
  bump Fabrikam.Data to 4.0, and drop Fabrikam.Json in favor of System.Text.Json.
requires-extension: upgrade-fabrikam
metadata:
  discovery: scenario
  importance: high
  weight: 9000
  traits: .NET|CSharp|VisualBasic|DotNetCore
  scenarioTraitsSet: [.NET]
  post-completion:
    suggest-scenarios:
      - fabrikam-package-audit
    suggest-actions:
      - generate-report
---

# Fabrikam suite v3 → v4 migration

Migrate every project that references the Fabrikam v3 suite to v4 in one
coordinated change set. Prefer mechanical, verifiable steps and build + test
after each phase.

## 1. Establish a baseline

1. Confirm which Fabrikam packages and versions are referenced with
   `detect_fabrikam_packages` (scans `.csproj`, `Directory.Packages.props`, and
   `packages.config`).
2. Ensure the solution builds and there is a working test command
   (`dotnet test`). If none exists, add a smoke test before changing code.

## 2. Apply the package migration

Call `plan_package_migration` to get the authoritative old → new mapping, then
apply it across every project and any central `Directory.Packages.props`:

| Remove (v3) | Add (v4) | Notes |
|-------------|----------|-------|
| `Fabrikam.Web.Mvc` 3.x | `Fabrikam.AspNetCore.Mvc` 4.0.0 | Renamed for ASP.NET Core hosting. |
| `Fabrikam.Data` 3.x | `Fabrikam.Data` 4.0.0 | Major bump; the data API is async-only in v4. |
| `Fabrikam.Logging` 2.x | `Fabrikam.Diagnostics` 4.0.0 | Renamed and consolidated. |
| `Fabrikam.Security.Tokens` 3.x | `Fabrikam.Identity.Tokens` 4.0.0 | Renamed. |
| `Fabrikam.Json` 1.x | *(removed)* | Replaced by `System.Text.Json`. |

## 3. Fix the code

1. Update namespaces to match the renamed packages (`Fabrikam.Web.Mvc` →
   `Fabrikam.AspNetCore.Mvc`, `Fabrikam.Logging` → `Fabrikam.Diagnostics`,
   `Fabrikam.Security.Tokens` → `Fabrikam.Identity.Tokens`).
2. Make `Fabrikam.Data` calls `await`-able — v4 removes the synchronous
   overloads; propagate `async`/`await` to call sites.
3. Replace `Fabrikam.Json` serialization with `System.Text.Json`
   (`JsonSerializer.Serialize`/`Deserialize`).

## 4. Verify

1. Restore and build the whole solution; resolve any remaining `NU` / `CS`
   errors.
2. Run the full test suite.
3. Run the application's smoke path.
4. Generate a migration report summarizing what changed.

## Notes

- Tool names above (`detect_fabrikam_packages`, `plan_package_migration`) are
  the bare names exposed by the `upgrade-fabrikam` MCP; every host resolves them.
- Replace the heuristics here with project-specific guidance for your suite.
