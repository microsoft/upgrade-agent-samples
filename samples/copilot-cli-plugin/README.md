# Sample extender — Copilot CLI plugin

A sample **Upgrade extender** packaged as a GitHub Copilot CLI plugin. It
implements a fictional third-party **"Fabrikam Suite Upgrade"**
(`upgrade-fabrikam`) extender that migrates .NET solutions from the **Fabrikam
v3 component suite to v4** — package renames, a major version bump, and one
dropped dependency.

Use it as a copy-and-rename starting point. Full authoring docs:
[`../../docs/02-copilot-cli-plugin.md`](../../docs/02-copilot-cli-plugin.md).

## Contents

| Path | Role |
|------|------|
| `plugin.json` | Copilot CLI plugin metadata and native `mcpServers` registration. |
| `upgrade-extension.json` | Upgrade content identity, version, and skill trait gate (`.NET\|CSharp\|VisualBasic\|DotNetCore`). |
| `skills/fabrikam-v4-upgrade/SKILL.md` | A **scenario** — the full v3 → v4 suite migration workflow. |
| `skills/fabrikam-package-audit/SKILL.md` | A **lazy** guidance skill loaded on demand. |

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
their tool server in any language. `plugin.json` declares the server through
the standard `mcpServers` map. The CLI launches it and routes tool calls directly
to it:

```jsonc
// plugin.json
"mcpServers": {
  "FabrikamUpgrade": {
    "type": "local",
    "command": "dnx",
    "args": ["Fabrikam.Upgrade.Mcp", "--yes", "--ignore-failed-sources"],
    "env": {
      "PLUGIN_MODE": "1",
      "INSTALL_SOURCE": "upgrade-plugin"
    },
    "tools": ["*"],
    "timeout": 300000
  }
}
```

`Fabrikam.Upgrade.Mcp` is an illustrative package name. Replace it with your own
server before using these skills. Any executable that speaks MCP over stdio
works; for a Node package, use `command: "npx"` and
`args: ["-y", "@your-org/upgrade-mcp"]`.

The `timeout` value is an initialization budget in milliseconds, allowing up to
five minutes for a cold `dnx` package download and the MCP handshake.

The server supplies `detect_fabrikam_packages` and `plan_package_migration`.
Workers running these skills need access to those tools. Manifest traits filter
the skills, not the server or its tools.

For an MCP used by only one sub-agent, use that agent's YAML `mcp-servers`
header instead of plugin-wide registration. See
[the CLI guide](../../docs/02-copilot-cli-plugin.md#23-agent-scoped-mcp-registration)
for a complete example. A skills-only plugin can omit MCP registration and use
tools already available to its calling agent.

## Make it your own

1. Rename the folder and change `id`/`name` in `upgrade-extension.json` and
   `plugin.json` (keep them equal).
2. Change the `traits` gate to your ecosystem's discovery trait(s) — see
   [`../../docs/05-skills-metadata-and-traits.md`](../../docs/05-skills-metadata-and-traits.md).
3. Replace the skills with your own scenarios and guidance.
4. Point `plugin.json`'s `mcpServers.FabrikamUpgrade` at your own server and set
   the environment it needs. For skills-only content, omit MCP registration and
   adapt the playbooks to available tools.
5. Install with `copilot plugin install <path-to-plugin>` and ensure workers
   calling your domain tools have the appropriate tool permissions.
