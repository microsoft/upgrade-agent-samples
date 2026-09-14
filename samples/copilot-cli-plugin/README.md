# Sample extender — Copilot CLI plugin

A sample **Upgrade extender** packaged as a GitHub Copilot CLI plugin. It
implements a fictional third-party **"Fabrikam Suite Upgrade"**
(`upgrade-fabrikam`) extender that migrates .NET solutions from the **Fabrikam
v3 component suite to v4** — package renames, a major version bump, and one
dropped dependency.

Use it as a copy-and-rename starting point. Full authoring docs:
[`docs/02-copilot-cli-plugin.md`](../../docs/02-copilot-cli-plugin.md).

## Contents

| Path | Role |
|------|------|
| `plugin.json` | Copilot CLI plugin metadata. No `mcpServers` block (the orchestrator launches the MCP, not the CLI). |
| `upgrade-extension.json` | The extender manifest: id, version, trait gate (`.NET\|CSharp\|VisualBasic\|DotNetCore`), and the command that launches the MCP. |
| `skills/fabrikam-v4-upgrade/SKILL.md` | A **scenario** — the full v3 → v4 suite migration workflow. |
| `skills/fabrikam-package-audit/SKILL.md` | A **lazy** guidance skill loaded on demand. |
| `skills/fabrikam-controls-rules/` | A **scenario extension** — Fabrikam's control rules injected into the *built-in* .NET version upgrade at `Assessment`, `Planning`, and `IntegrityReview`, with per-scope content under `scopes/`. See [`docs/06-scenario-extensions.md`](../../docs/06-scenario-extensions.md). |
| `agents/fabrikam-dependency-validation.agent.md` | A **sub-agent** — a hidden worker with **its own** `mcp-servers` block. See [`docs/08-sub-agents.md`](../../docs/08-sub-agents.md). |

## What this extender does

The Fabrikam suite ships a breaking v4 release. The extender migrates a solution
across it:

| Remove (v3) | Add (v4) | Notes |
|-------------|----------|-------|
| `Fabrikam.Web.Mvc` 3.x | `Fabrikam.AspNetCore.Mvc` 4.0.0 | Renamed for ASP.NET Core. |
| `Fabrikam.Data` 3.x | `Fabrikam.Data` 4.0.0 | Major bump; async-only API. |
| `Fabrikam.Logging` 2.x | `Fabrikam.Diagnostics` 4.0.0 | Renamed + consolidated. |
| `Fabrikam.Security.Tokens` 3.x | `Fabrikam.Identity.Tokens` 4.0.0 | Renamed. |
| `Fabrikam.Json` 1.x | *(removed)* | Replaced by `System.Text.Json`. |

## Launching the MCP server

This sample does **not** ship MCP server code — extenders are free to implement
their tool server in any language. The manifest only declares the **command**
the orchestrator runs to start it. This sample uses a .NET tool published to
NuGet, launched with `dnx`:

```jsonc
// upgrade-extension.json
"mcp": {
  "command": "dnx",
  "args": ["Fabrikam.Upgrade.Mcp", "--yes"]
}
```

Any executable that speaks MCP over stdio works — e.g. a Node-based server
published to npm:

```jsonc
"mcp": {
  "command": "npx",
  "args": ["-y", "@fabrikam/upgrade-mcp"]
}
```

The command must launch a server that speaks MCP over stdio and exposes your
domain tools (here `detect_fabrikam_packages` and `plan_package_migration`). A
skills-only extender can omit the `mcp` block entirely.

## Make it your own

1. Rename the folder and change `id`/`name` in `upgrade-extension.json` and
   `plugin.json` (keep them equal).
2. Change the `traits` gate to your ecosystem's discovery trait(s) — see
   [`docs/05-skills-metadata-and-traits.md`](../../docs/05-skills-metadata-and-traits.md).
3. Replace the skills with your own scenarios and guidance.
4. Point the manifest's `mcp.command` at your own MCP server (or drop the `mcp`
   block for a skills-only extender).
5. Keep or delete `skills/fabrikam-controls-rules/` and `agents/` depending on
   whether you need a scenario extension or a sub-agent. Both are optional.
6. Size your content against
   [`docs/07-instruction-size-and-tokens.md`](../../docs/07-instruction-size-and-tokens.md)
   before shipping.
