---
name: fabrikam-package-audit
description: >
  Audit a .NET project's Fabrikam package references for v4 readiness — find
  v3-era Fabrikam.* packages, flag the ones that are renamed, version-bumped, or
  removed in v4, and report a per-package upgrade plan. Use when reviewing
  .csproj, Directory.Packages.props, or packages.config.
requires-extension: upgrade-fabrikam
metadata:
  discovery: lazy
  importance: medium
  traits: .NET|CSharp|VisualBasic|DotNetCore
---

# Fabrikam package audit

On-demand guidance for reviewing a solution's Fabrikam package set before or
during a v4 migration.

## Steps

1. Locate the package declarations: `.csproj` `<PackageReference>` items, a
   central `Directory.Packages.props`, or legacy `packages.config`.
2. Call `detect_fabrikam_packages` to list every `Fabrikam.*` reference and its
   current version, then `plan_package_migration` for the v4 target of each.
3. For each flagged package:
   - **Renamed** (e.g. `Fabrikam.Logging` → `Fabrikam.Diagnostics`) — remove the
     old reference, add the new one, and update namespaces.
   - **Version-bumped** (e.g. `Fabrikam.Data` 3.x → 4.0) — bump the version and
     review the breaking-change notes (async-only API in v4).
   - **Removed** (e.g. `Fabrikam.Json`) — delete the reference and migrate
     callers to the recommended successor (`System.Text.Json`).
4. Summarize required changes and propose an ordered plan (shared/leaf projects
   first, then the apps that depend on them).

This skill is `lazy`: it loads only when the agent matches a package-review
task, keeping it out of the context window otherwise.
