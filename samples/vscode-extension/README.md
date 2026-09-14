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
| `extension.js` | A no-op activation entry point (the extender is a pure data contribution). |
| `upgrade-extension.json` | The extender manifest: id, version, and trait gate. The MCP launch is supplied by `package.json`'s `mcp[]` for this host. |
| `skills/fabrikam-v4-upgrade/SKILL.md` | A **scenario** — the full Fabrikam v3 → v4 migration workflow. |
| `skills/fabrikam-package-audit/SKILL.md` | A **lazy** guidance skill loaded on demand. |
| `skills/fabrikam-controls-rules/` | A **scenario extension** — Fabrikam's control rules injected into the *built-in* .NET version upgrade at `Assessment`, `Planning`, and `IntegrityReview`, with per-scope content under `scopes/`. See [`../../docs/06-scenario-extensions.md`](../../docs/06-scenario-extensions.md). |
| `.vscodeignore` | Files excluded from the packaged VSIX. |

## How it differs from the CLI plugin

The extender contract is identical — same manifest, same skills, same MCP tool
surface. Only the packaging changes:

- The CLI plugin carries `plugin.json`; the VS Code extension carries
  `package.json` with a `contributes.upgradeExtensions` entry.
- The MCP launch instruction lives in `package.json`'s `mcp[]` for VS Code
  (here a published `dnx` package), whereas the CLI plugin puts a `command` in
  the manifest's `mcp` block.

Neither sample ships MCP server code — only the **command** to launch a server.
This sample references a published `Fabrikam.Upgrade.Mcp` tool via the `dnx`
transport. For a local dev loop, swap the `mcp[]` entry for an `exec` transport
pointing at your own server (see
[`../../docs/03-vscode-extension.md` §3.2](../../docs/03-vscode-extension.md#32-the-contributesupgradeextensions-contribution-point)).

## Make it your own

1. Change `name`/`publisher`/`version` in `package.json` and the matching `id`
   in `upgrade-extension.json` and `contributes.upgradeExtensions`.
2. Point `mcp[].package` at your published MCP tool (or use `exec` for local).
3. Replace the skills with your own.
4. Keep or delete `skills/fabrikam-controls-rules/` depending on whether you
   need a scenario extension. To ship a **sub-agent**, stage its
   `*.agent.md` into `prompts/` and list it in `contributes.chatAgents` — see
   [`../../docs/08-sub-agents.md`](../../docs/08-sub-agents.md).
5. Size your content against
   [`../../docs/07-instruction-size-and-tokens.md`](../../docs/07-instruction-size-and-tokens.md)
   before shipping.
