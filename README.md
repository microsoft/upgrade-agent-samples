# Upgrade Agent — Extender Samples

Reference samples and documentation for **extending the GitHub Copilot
modernization (Upgrade) agent** with your own language, framework, or
cloud-migration support.

The Upgrade agent is built around a small **orchestrator** that coordinates
independent **extenders**. An extender teaches the agent how to modernize a
particular technology by contributing two things:

- **Skills** — Markdown playbooks (scenarios and on-demand guidance) that tell
  the agent *what* to do and *when*.
- **An MCP server** — an optional process exposing *tools* the agent can call
  to inspect and transform a repository.

You package an extender for a host:

- a **GitHub Copilot CLI plugin**, or
- a **VS Code extension**.

Both hosts use the **same extender contract** — the same `upgrade-extension.json`
manifest, the same skills format, and the same MCP tool surface. Only the
packaging differs.

## What's in here

| Path | What it is |
|------|------------|
| [`docs/`](docs/) | The extender guide — every moving part explained. Start at [`docs/README.md`](docs/README.md). |
| [`samples/copilot-cli-plugin/`](samples/copilot-cli-plugin/) | A sample extender packaged as a Copilot CLI plugin (manifest + skills + an MCP launch command). |
| [`samples/vscode-extension/`](samples/vscode-extension/) | The same extender packaged as a VS Code extension. |

The samples implement a fictional third-party extender — **"Fabrikam Suite
Upgrade"** (`upgrade-fabrikam`) — that migrates .NET solutions from the Fabrikam
v3 component suite to v4 (package renames, a major version bump, and one dropped
dependency). Treat it as a copy-and-rename starting point: swap in your own id,
skills, and tools.

## Quick start

1. Read [`docs/01-extension-model.md`](docs/01-extension-model.md) for the big
   picture — how the orchestrator discovers and drives extenders.
2. Pick a host:
   - Copilot CLI → [`docs/02-copilot-cli-plugin.md`](docs/02-copilot-cli-plugin.md)
   - VS Code → [`docs/03-vscode-extension.md`](docs/03-vscode-extension.md)
3. Copy the matching sample folder, rename the extender id, and edit the
   skills and tools.
4. Use [`docs/05-skills-metadata-and-traits.md`](docs/05-skills-metadata-and-traits.md)
   to gate your skills on the right repository traits so they surface at the
   right moments.

## The five moving parts

```mermaid
flowchart LR
    subgraph Extender["Your extender"]
        M["upgrade-extension.json<br/>(manifest)"]
        S["skills/<br/>(scenarios + guidance)"]
        T["MCP server<br/>(tools)"]
    end
    P["Host package<br/>(plugin.json / package.json)"] --> Extender
    Extender --> ORCH["Upgrade orchestrator"]
    ORCH --> LLM["Agent / LLM"]
```

1. **Host package** — `plugin.json` (CLI) or `package.json` (VS Code) that
   installs your extender into the host.
2. **Manifest** — `upgrade-extension.json` declares your extender id, version,
   and (optionally) how to launch your MCP and which traits gate it.
3. **Skills** — Markdown files with metadata that the orchestrator loads and
   surfaces to the agent.
4. **MCP server** — an optional process exposing tools; the orchestrator spawns
   and proxies it.
5. **Traits** — facts the orchestrator discovers about the target repository;
   you reference them in skill metadata so your content appears only when
   relevant.

## License

[MIT](LICENSE).
