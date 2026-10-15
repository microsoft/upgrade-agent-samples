# 3. Packaging an extender as a VS Code extension

The working example is in
[`samples/vscode-extension/`](../samples/vscode-extension/).
Read [doc 1](01-extension-model.md) for the shared manifest and skill contract.

## 3.1 Folder layout

```text
vscode-extension/
├── package.json
├── extension.js
├── .vscodeignore
├── upgrade-extension.json
└── skills/
    ├── fabrikam-v4-upgrade/SKILL.md
    └── fabrikam-package-audit/SKILL.md
```

The extension contributes a manifest path for Upgrade content discovery and
registers its MCP through VS Code's standard MCP provider API.

## 3.2 `package.json`

```json
{
  "name": "upgrade-fabrikam",
  "displayName": "Fabrikam Suite Upgrade",
  "publisher": "fabrikam",
  "version": "1.0.0",
  "engines": { "vscode": "^1.101.0" },
  "activationEvents": [],
  "main": "./extension.js",
  "contributes": {
    "upgradeExtensions": ["./upgrade-extension.json"],
    "mcpServerDefinitionProviders": [
      {
        "id": "fabrikam.upgrade",
        "label": "Fabrikam Suite Upgrade"
      }
    ]
  }
}
```

Each `upgradeExtensions` entry is a path to an Upgrade manifest, relative to the
VSIX root. The Upgrade host discovers these pointers and loads the manifests and
their skills.

`mcpServerDefinitionProviders` is VS Code's native MCP contribution point.
Its provider `id` must match the id registered by `extension.js`. VS Code
activates the extension when that MCP provider is requested, so no explicit
activation event is needed. The sample requires VS Code 1.101 or later for the
stable MCP provider API.

## 3.3 Register the MCP in `extension.js`

```js
const vscode = require('vscode');

exports.activate = function (context) {
    context.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider(
        'fabrikam.upgrade',
        {
            provideMcpServerDefinitions() {
                return [
                    new vscode.McpStdioServerDefinition(
                        'FabrikamUpgrade',
                        'dnx',
                        ['Fabrikam.Upgrade.Mcp', '--yes', '--ignore-failed-sources'],
                        {
                            PLUGIN_MODE: '1',
                            INSTALL_SOURCE: 'upgrade-plugin'
                        },
                        context.extension.packageJSON.version
                    )
                ];
            }
        }
    ));
};
```

VS Code launches this stdio server and routes calls directly to its tools.
The `env` argument supplies variables required by your server. Never check in
credentials. Adding the registration disposable to `context.subscriptions`
lets VS Code dispose it when the extension is deactivated.

The `Fabrikam.Upgrade.Mcp` package is illustrative; replace it with your own
server. You can use `dnx`, `npx`, `node`, or any other stdio MCP command. For a
bundled script, resolve its path with
`vscode.Uri.joinPath(context.extensionUri, 'tools', 'server.js').fsPath`.

See the [VS Code MCP developer guide](https://code.visualstudio.com/api/extension-guides/ai/mcp)
for provider APIs, HTTP servers, and authentication.

## 3.4 Discovery and tool access

The Upgrade host reads the contributed manifest paths to discover your skills.
Separately, VS Code invokes your MCP provider and connects to the returned
server. Manage that server through **MCP: List Servers** and enable its tools
for the calling agent.

Manifest and skill traits gate skills, not MCP registration or tool access.
Agent tool allowlists must include the domain tools a scenario needs; otherwise
delegate those calls to an agent with the appropriate access.

Refer to tools in skill prose by their domain name, such as
`detect_fabrikam_packages`, and identify the owning server (`FabrikamUpgrade`)
where needed. Use the host's registered tool identifiers when configuring agent
allowlists; tool naming is host-specific.

## 3.5 Skills-only and multiple extenders

A skills-only VSIX needs the `upgradeExtensions` manifest pointer and its skill
files. It can omit the MCP provider contribution and activation code when it
has no other runtime functionality.

For multiple extenders, list each manifest path in `upgradeExtensions`, for
example `./extenders/<name>/upgrade-extension.json`, and keep each manifest
with its own skills. Register any domain servers through native MCP providers.

## 3.6 Local development and checklist

Replace the MCP command and arguments in `extension.js` with your own published
server or local invocation, then launch an Extension Development Host. Install
the Upgrade host extension to exercise scenario discovery. Confirm both the
scenario and the Fabrikam server's tools are available.

- [ ] Each `upgradeExtensions` entry resolves to a packaged Upgrade manifest.
- [ ] The provider id in `package.json` matches the activation code.
- [ ] `engines.vscode` supports the MCP APIs you use.
- [ ] The launch command and environment work on the user's machine.
- [ ] Workers have access to the tools their skills reference.
- [ ] Skills gate on the appropriate traits (see [doc 5](05-skills-metadata-and-traits.md)).
