# Sample extender — VS Code extension

The same **"Fabrikam Suite Upgrade"** (`upgrade-fabrikam`) extender from
[`samples/copilot-cli-plugin/`](../copilot-cli-plugin/), packaged as a **VS Code
extension** instead of a Copilot CLI plugin. It migrates .NET solutions from the
Fabrikam v3 component suite to v4.

Full authoring docs:
[`docs/03-vscode-extension.md`](../../docs/03-vscode-extension.md).

## Contents

| Path | Role |
|------|------|
| `package.json` | VS Code extension manifest. The `contributes.upgradeExtensions` block registers the extender with the Upgrade host extension. |
| `extension.js` | A no-op activation entry point (the extender is a pure data contribution). |
| `upgrade-extension.json` | Extender identity, skill trait gate, and VS Code-only `mcp` launch settings, including optional `mcp.env` server environment variables. |
| `skills/fabrikam-v4-upgrade/SKILL.md` | A **scenario** — the full Fabrikam v3 → v4 migration workflow. |
| `skills/fabrikam-package-audit/SKILL.md` | A **lazy** guidance skill loaded on demand. |
| `skills/fabrikam-controls-rules/` | A **scenario extension** — Fabrikam's control rules injected into the *built-in* .NET version upgrade at `Assessment`, `Planning`, and `IntegrityReview`, with per-scope content under `scopes/`. See [`docs/06-scenario-extensions.md`](../../docs/06-scenario-extensions.md). |
| `.vscodeignore` | Files excluded from the packaged VSIX. |

## How it differs from the CLI plugin

The extender contract is identical — same manifest, same skills, same MCP tool
surface. Packaging and MCP registration differ:

- The CLI plugin carries `plugin.json`; the VS Code extension carries
  `package.json` with a `contributes.upgradeExtensions` entry.
- VS Code reads the `mcp` block in the contributed `upgrade-extension.json`
  (here a published `dnx` package). **CLI plugins do not use that block**:
  they register servers in `plugin.json` / `mcp.json` or sub-agent YAML
  `mcp-servers`. Neither host proxies domain tools through the orchestrator.

The optional `mcp.env` object in `upgrade-extension.json` is passed to the
server when launched by the VS Code Upgrade host. The sample sets
`FABRIKAM_LOG_LEVEL` to `"info"` as an illustrative server-specific setting.
Replace it with variables your server supports; values must be strings and
must not contain checked-in secrets. CLI plugins must set `env` in their
native MCP configuration, not in this Upgrade manifest.

Neither sample ships MCP server code — only the **command** to launch a server.
The `Fabrikam.Upgrade.Mcp` package name is illustrative, not a supplied server.
For a local dev loop, change the manifest's `mcp.command` / `mcp.args` to point
at your own server (see
[`docs/03-vscode-extension.md` §3.2](../../docs/03-vscode-extension.md#32-the-contributesupgradeextensions-contribution-point)).

## Make it your own

1. Change `name`/`publisher`/`version` in `package.json` and the matching `id`
   in `upgrade-extension.json`. Keep the `contributes.upgradeExtensions`
   manifest path valid.
2. Point manifest `mcp.command` / `mcp.args` at your published MCP tool or
   local server, and choose a unique `mcp.serverName`.
3. Replace the skills with your own.
4. Keep or delete `skills/fabrikam-controls-rules/` depending on whether you
   need a scenario extension. To ship a **sub-agent**, stage its
   `*.agent.md` into `prompts/` and list it in `contributes.chatAgents` — see
   [`docs/08-sub-agents.md`](../../docs/08-sub-agents.md).
5. Size your content against
   [`docs/07-instruction-size-and-tokens.md`](../../docs/07-instruction-size-and-tokens.md)
   before shipping.
