# Sample extender — VS Code extension

The same **"Fabrikam Suite Upgrade"** (`upgrade-fabrikam`) extender from
[`../copilot-cli-plugin/`](../copilot-cli-plugin/), packaged as a **VS Code
extension** instead of a Copilot CLI plugin. It migrates .NET solutions from the
Fabrikam v3 component suite to v4.

Full authoring docs:
[`../../docs/03-vscode-extension.md`](../../docs/03-vscode-extension.md).

## Contents

| Path | Role |
|------|------|
| `package.json` | VS Code extension manifest. The `contributes.upgradeExtensions` block registers the extender with the Upgrade host extension. |
| `extension.js` | Registers the Fabrikam MCP with VS Code's native MCP provider API. |
| `upgrade-extension.json` | Upgrade content identity, version, and skill trait gate. |
| `skills/fabrikam-v4-upgrade/SKILL.md` | A **scenario** — the full Fabrikam v3 → v4 migration workflow. |
| `skills/fabrikam-package-audit/SKILL.md` | A **lazy** guidance skill loaded on demand. |
| `.vscodeignore` | Files excluded from the packaged VSIX. |

## How it differs from the CLI plugin

The extender contract is identical — same manifest, same skills, same MCP tool
surface. Only the packaging changes:

- The CLI plugin carries `plugin.json`; the VS Code extension carries
  `package.json` with a `contributes.upgradeExtensions` manifest-path pointer.
- The CLI plugin registers its MCP in `plugin.json`'s `mcpServers`. The VS Code
  extension contributes `mcpServerDefinitionProviders` and registers its
  provider in `extension.js`.

Neither sample ships MCP server code — only the **command** to launch a server.
`Fabrikam.Upgrade.Mcp` is an illustrative package name, launched with `dnx`.
Replace the command and arguments in `extension.js` with your own published
server or local invocation before using the skills.

VS Code launches the MCP and routes tool calls directly to it. Manifest traits
filter skills, not MCP tools. Enable the domain tools for the calling agent;
workers with explicit allowlists need the corresponding tool identifiers.

## Make it your own

1. Change `name`/`publisher`/`version` in `package.json` and the matching `id`
   in `upgrade-extension.json`. Keep `contributes.upgradeExtensions` pointing
   to that manifest.
2. Set the MCP command, arguments, and environment in `extension.js`. Keep its
   provider id aligned with `contributes.mcpServerDefinitionProviders`.
3. Replace the skills with your own and configure the calling agents' tool access.
4. Use VS Code 1.101 or later, launch an Extension Development Host with the
   Upgrade host extension installed, and inspect your server with
   **MCP: List Servers**.
