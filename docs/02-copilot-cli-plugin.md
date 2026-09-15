# 2. Packaging an extender as a Copilot CLI plugin

This page shows how to ship your extender as a **GitHub Copilot CLI plugin**.
The working example lives in
[`samples/copilot-cli-plugin/`](../samples/copilot-cli-plugin/).

Read [doc 1](01-extension-model.md) first — it covers the manifest, skills, and
trait gating that are shared across hosts. This page only adds the CLI-specific
packaging.

## 2.1 Folder layout

```
copilot-cli-plugin/
├── plugin.json                 # Copilot CLI plugin metadata
├── upgrade-extension.json    # the extender manifest (see doc 1)
├── upgrade/
│   └── skills/
│       ├── fabrikam-v4-upgrade/SKILL.md          # a scenario
│       ├── fabrikam-package-audit/SKILL.md       # on-demand guidance
│       └── fabrikam-controls-rules/              # a scenario extension (doc 6)
│           ├── SKILL.md
│           └── scopes/{assessment,planning}.md
└── agents/
    └── fabrikam-dependency-validation.agent.md   # a sub-agent (doc 8)
```

The plugin ships the manifest and skills. Your MCP server is **not** bundled
here — the manifest's `mcp` block only names a command (e.g. a published `dnx`
or `npx` package) that the orchestrator launches.

`agents/` is optional, and only present because this sample demonstrates a
sub-agent. Note it sits at the **plugin root, not under `upgrade/`**: it is the
CLI's own flat agent folder, so agent files go there directly — see
[doc 8](08-sub-agents.md).

After the user installs the plugin, the CLI extracts it to a folder under its
installed-plugins directory. The orchestrator scans that directory, finds your
`upgrade-extension.json`, and takes over from there.

## 2.2 `plugin.json`

This is the **Copilot CLI** plugin manifest — install/list/categorize metadata.
It is *not* the extender manifest.

```jsonc
{
  "name": "upgrade-fabrikam",
  "version": "1.0.0",
  "description": "Fabrikam Suite Upgrade — sample modernization extender for the Fabrikam .NET component suite.",
  "author": { "name": "Fabrikam" },
  "license": "MIT",
  "keywords": ["modernize", "copilot", "upgrade", "dotnet", "nuget"]
}
```

### Do **not** declare an `mcpServers` block here

Under the orchestrator model, the CLI must **not** launch your MCP — the
orchestrator does. If `plugin.json` also declared an `mcpServers` entry for your
extender, the CLI would spawn it in parallel with the orchestrator's child,
producing a duplicate. Leave `mcpServers` out entirely; the orchestrator learns
how to launch your MCP from the `mcp` block in `upgrade-extension.json`.

### Do **not** ship a visible agent file

Only the orchestrator should appear in the CLI's `/agent` list. Any agent file
you ship in `agents/` must be a hidden worker, so you must declare
`user-invocable: false` yourself — an absent key means **visible**, not hidden.
See [doc 8](08-sub-agents.md). If your extender contributes no sub-agent, ship
no agent file at all.

## 2.3 How discovery works on the CLI

```mermaid
sequenceDiagram
    participant User
    participant CLI as Copilot CLI
    participant ORCH as Orchestrator MCP
    participant EXT as Your MCP

    User->>CLI: /agent upgrade
    CLI->>ORCH: launch orchestrator
    ORCH->>ORCH: scan installed-plugins dir
    Note over ORCH: finds your upgrade-extension.json
    ORCH->>ORCH: load your skills, evaluate traits gate
    ORCH->>EXT: spawn (mcp.command + args)
    ORCH->>EXT: proxy tools/list & tools/call
```

There is no per-plugin wiring you need to do. Dropping a folder with a valid
`upgrade-extension.json` into the installed-plugins location is enough for the
orchestrator to pick it up on its next launch.

## 2.4 Skills-only plugins

If your extender contributes only skills, remove the `mcp` block from
`upgrade-extension.json`. The plugin then ships just `plugin.json`,
`upgrade-extension.json`, and `upgrade/skills/`. The orchestrator loads the
skills and never tries to spawn an MCP.

## 2.5 Local development loop

1. Get your MCP server runnable by a command. Either:
   - publish it (e.g. a .NET tool consumed via `dnx`, or an npm package consumed
     via `npx`) and reference that command in `mcp.command`/`mcp.args`, or
   - point `mcp.command`/`mcp.args` at a local invocation
     (`dotnet run --project <abs-path>`, `node <abs-path>`, …) for a fast inner
     loop.
2. Place the plugin folder where the CLI's orchestrator scans for installed
   plugins (your host's installed-plugins directory).
3. Restart the CLI and run `/agent upgrade`. Confirm your tools appear and your
   scenario shows up when the repository matches your trait gate.

> Tip: keep the published command (production launcher) in the checked-in
> manifest, and only rewrite it to a local form in a local, uncommitted copy.
> That keeps the manifest correct for users while letting you
> iterate.

## 2.6 Checklist

- [ ] `plugin.json` has a unique `name` and no `mcpServers`.
- [ ] `upgrade-extension.json` `id` matches `plugin.json` `name` and is unique.
- [ ] `mcp.command` resolves on the user's PATH after install (or the block is
      omitted for skills-only).
- [ ] Skills gate on the right traits (see [doc 5](05-skills-metadata-and-traits.md)).
- [ ] Any scenario extension declares `scope` — without it, it is never used
      (see [doc 6](06-scenario-extensions.md)).
- [ ] Any agent file in `agents/` declares `user-invocable: false` and a
      uniquely-prefixed name (see [doc 8](08-sub-agents.md)).
- [ ] Tool names are unique within your extender and ≤ ~40 chars.
- [ ] Content is sized against [doc 7](07-instruction-size-and-tokens.md).
