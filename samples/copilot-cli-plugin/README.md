# Sample extender — Copilot CLI plugin

A sample **Upgrade extender** packaged as a GitHub Copilot CLI plugin. It
implements a fictional third-party **"Fabrikam Suite Upgrade"**
(`upgrade-fabrikam`) extender that migrates .NET solutions from the **Fabrikam
v3 component suite to v4** — package renames, a major version bump, and one
dropped dependency.

Use it as a copy-and-rename starting point. Full authoring docs:
[`docs/02-copilot-cli-plugin.md`](../../docs/02-copilot-cli-plugin.md).

> **MCP settings go in CLI configuration, not `upgrade-extension.json`.**
> Use `plugin.json`'s `mcpServers` (inline or referencing `mcp.json`) for a
> plugin-wide server, or a sub-agent's YAML `mcp-servers` for an agent-local
> server. The Upgrade manifest's `mcp` block is used by VS Code extenders only.

## Contents

| Path | Role |
|------|------|
| `plugin.json` | Copilot CLI metadata and plugin-wide `mcpServers` registration for `FabrikamUpgrade`. |
| `upgrade-extension.json` | Upgrade content identity and skill trait gate (`.NET\|CSharp\|VisualBasic\|DotNetCore`). No CLI MCP launch settings. |
| `upgrade/skills/fabrikam-v4-upgrade/SKILL.md` | A **scenario** — the full v3 → v4 suite migration workflow. |
| `upgrade/skills/fabrikam-package-audit/SKILL.md` | A **lazy** guidance skill loaded on demand. |
| `upgrade/skills/fabrikam-controls-rules/` | A **scenario extension** — Fabrikam's control rules injected into the *built-in* .NET version upgrade at `Assessment`, `Planning`, and `IntegrityReview`, with per-scope content under `scopes/`. See [`docs/06-scenario-extensions.md`](../../docs/06-scenario-extensions.md). |
| `agents/fabrikam-dependency-validation.agent.md` | A **sub-agent** — a hidden worker with **its own** `mcp-servers` block. Note it sits at the plugin root, not under `upgrade/`. See [`docs/08-sub-agents.md`](../../docs/08-sub-agents.md). |

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
their tool server in any language. **Copilot CLI** launches the command in
`plugin.json`; the orchestrator does not launch or proxy it. This sample uses
an illustrative .NET tool package, not a supplied server, launched with `dnx`:

```jsonc
// plugin.json: plugin-wide registration
"mcpServers": {
  "FabrikamUpgrade": {
    "type": "local",
    "command": "dnx",
    "args": ["Fabrikam.Upgrade.Mcp", "--yes"],
    "tools": ["*"],
    "timeout": 300000
  }
}
```

For a separate `mcp.json` example, see
[`docs/02-copilot-cli-plugin.md` §2.2](../../docs/02-copilot-cli-plugin.md#22-pluginjson).
For agent-local registration, see the existing
`agents/fabrikam-dependency-validation.agent.md`, which registers the
**different** `fabrikam-graph` server for that worker alone. Choose one scope
per server rather than unintentionally launching the same server twice.

The command must launch a server that speaks MCP over stdio and exposes your
domain tools (here `detect_fabrikam_packages` and `plan_package_migration`). A
skills-only extender omits CLI MCP registration. Calling workers need access
to the registered domain tools; manifest trait gates only filter skills.

## Make it your own

1. Rename the folder and change `id`/`name` in `upgrade-extension.json` and
   `plugin.json` (keep them equal).
2. Change the `traits` gate to your ecosystem's discovery trait(s) — see
   [`docs/05-skills-metadata-and-traits.md`](../../docs/05-skills-metadata-and-traits.md).
3. Replace the skills with your own scenarios and guidance.
4. Point `plugin.json`'s `mcpServers` (or a referenced `mcp.json` / agent YAML)
   at your own MCP server. Omit MCP registration for a skills-only extender.
5. Keep or delete `upgrade/skills/fabrikam-controls-rules/` and `agents/`
   depending on whether you need a scenario extension or a sub-agent. Both are
   optional.
6. Size your content against
   [`docs/07-instruction-size-and-tokens.md`](../../docs/07-instruction-size-and-tokens.md)
   before shipping.
