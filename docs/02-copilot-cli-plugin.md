# 2. Packaging an extender as a Copilot CLI plugin

The working example is in
[`samples/copilot-cli-plugin/`](../samples/copilot-cli-plugin/).
Read [doc 1](01-extension-model.md) for the shared manifest and skill contract.

## 2.1 Folder layout

```text
copilot-cli-plugin/
├── plugin.json
├── upgrade-extension.json
└── skills/
    ├── fabrikam-v4-upgrade/SKILL.md
    └── fabrikam-package-audit/SKILL.md
```

`plugin.json` is the normal Copilot CLI plugin manifest. It describes the plugin
and registers its MCP server. `upgrade-extension.json` identifies the Upgrade
content and gates its skills.

## 2.2 Register the MCP in `plugin.json`

```json
{
  "name": "upgrade-fabrikam",
  "version": "1.0.0",
  "description": "Fabrikam Suite Upgrade",
  "author": { "name": "Fabrikam" },
  "license": "MIT",
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
}
```

The CLI registers and launches `FabrikamUpgrade` as a regular MCP server and
routes tool calls directly to it. `command` and `args` can launch any stdio MCP
implementation, such as a .NET tool, a Node package, or a bundled executable.
`env` supplies server-specific environment variables; use the variables your
server actually needs. Never put credentials in a checked-in configuration.

`timeout` is the MCP initialization budget in milliseconds. The five-minute
budget gives `dnx` time to download and extract the package on a cold cache
before the server can complete its MCP handshake.

`mcpServers` can also point to a separate MCP configuration file. See the
[Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
for the supported configuration formats.

The sample's `Fabrikam.Upgrade.Mcp` package is illustrative, not a supplied
server. Replace it with your own runnable server before using the sample's tools.

## 2.3 Agent-scoped MCP registration

When only one sub-agent needs a server, register it in that plugin-shipped
agent's YAML front matter instead of the plugin-wide `mcpServers` map:

```markdown
---
name: Fabrikam package worker
description: Inspect Fabrikam packages and plan a v4 migration.
user-invocable: false
tools: ['FabrikamUpgrade/*']
mcp-servers:
  FabrikamUpgrade:
    type: local
    command: dnx
    args: ['Fabrikam.Upgrade.Mcp', '--yes', '--ignore-failed-sources']
    env:
      PLUGIN_MODE: '1'
      INSTALL_SOURCE: upgrade-plugin
    tools: ['*']
    timeout: 300000
---

Use detect_fabrikam_packages and plan_package_migration to inspect the solution
and return an ordered package migration plan.
```

Place the file under `agents/`, for example `agents/fabrikam-package-worker.agent.md`,
and have your scenario delegate the package work to that agent. The sample uses
plugin-wide registration because its scenario and audit skill both call the
domain tools.

Choose one registration scope for a given server. Agent-scoped registration
belongs to that agent; other workers need their own tool access or must delegate
to it. A `tools:` list selects allowed tools; it does not launch a server.

For files bundled with the plugin, use `${PLUGIN_ROOT}` in a plugin MCP
definition or a plugin-shipped agent's MCP command/arguments to reference the
installed plugin directory.

## 2.4 Discovery and permissions

The CLI installs your plugin and handles its MCP registration. The Upgrade
orchestrator discovers the installed `upgrade-extension.json`, loads the skills,
and filters them by traits.

MCP registration and skill discovery are independent. Manifest and skill traits
do not restrict the server's tools. The calling agent must have access to the
registered MCP tools through its tool configuration and the host's permissions.
Workers with explicit tool allowlists need the Fabrikam tools in their own
scope, or the scenario must delegate to a worker that has them.

## 2.5 Skills-only plugins

A skills-only plugin ships `plugin.json`, `upgrade-extension.json`, and
`skills/`, with no MCP registration. Its playbooks use built-in tools or other
tools available to the calling agent.

## 2.6 Local development loop

1. Replace the illustrative MCP command in `plugin.json` with your own published
   server or a local invocation such as `node <absolute-path>` or
   `dotnet run --project <absolute-path>`.
2. Install the sample folder with `copilot plugin install <path-to-plugin>`.
3. Start a new CLI session with the Upgrade plugin installed and select the
   Upgrade agent.
4. Confirm your scenario is discoverable for matching repository traits and
   that the worker calling your tools has access to `FabrikamUpgrade`.

Keep machine-specific launch paths in local, uncommitted configuration.

## 2.7 Checklist

- [ ] `plugin.json` has a unique `name` matching `upgrade-extension.json` `id`.
- [ ] MCP registration lives in `mcpServers` or the owning agent's `mcp-servers`.
- [ ] The launch command resolves on the user's machine.
- [ ] Any bundled helper agent is `user-invocable: false` and has the needed tools.
- [ ] Skills gate on the appropriate traits (see [doc 5](05-skills-metadata-and-traits.md)).
- [ ] Skills-only playbooks reference only tools available to their calling agent.
