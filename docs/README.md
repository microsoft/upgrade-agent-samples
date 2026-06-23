# Extender guide

Everything you need to build an extender for the GitHub Copilot modernization
(Upgrade) agent. Read these in order the first time; use them as a reference
afterwards.

| # | Doc | Read it to learn… |
|---|-----|-------------------|
| 1 | [The extension model](01-extension-model.md) | How the orchestrator discovers and drives extenders, and the moving parts shared across every host. |
| 2 | [Copilot CLI plugin](02-copilot-cli-plugin.md) | How to package an extender as a GitHub Copilot CLI plugin. |
| 3 | [VS Code extension](03-vscode-extension.md) | How to package the same extender as a VS Code extension. |
| 4 | [Authoring skills](04-skills.md) | The SKILL.md format — scenarios, on-demand guidance, and every metadata field. |
| 5 | [Skills metadata & known traits](05-skills-metadata-and-traits.md) | The traits the orchestrator discovers, so your skills surface at the right moments. |

## Concepts in one paragraph

The **orchestrator** is the single MCP server the host (Copilot CLI or VS Code)
talks to when the user runs the Upgrade agent. On boot it **scans the target
repository** to produce a set of **traits** (facts like "this repo has .NET"),
then **discovers extenders** the user has installed. Each **extender** ships a
**manifest** (`upgrade-extension.json`), a tree of **skills**, and optionally an
**MCP server** with **tools**. The orchestrator loads the skills into its own
in-memory registry, spawns the extender MCPs as child processes, and **proxies**
their tools to the agent. Skills and tools are filtered by traits so the agent
only ever sees what's relevant to the repository in front of it.

## Terminology

| Term | Meaning |
|------|---------|
| **Orchestrator** | The core Upgrade MCP server. The only MCP the host launches directly. You don't build this — you extend it. |
| **Extender** | Your contribution: a manifest + skills + (optionally) an MCP server. Also called an "extension". |
| **Host** | The product running the agent: GitHub Copilot CLI or VS Code. |
| **Host package** | The unit the host installs — a CLI plugin or a VS Code extension — that carries your extender. |
| **Manifest** | `upgrade-extension.json`. Marks a folder as an extender and declares its id, version, MCP launch, and trait gates. |
| **Skill** | A `SKILL.md` Markdown file with a metadata header. Either a *scenario* (a workflow) or *guidance* (on-demand know-how). |
| **Scenario** | A skill with `discovery: scenario` — a complete migration workflow the agent can run. |
| **Tool** | An MCP operation the agent can call (e.g. `detect_fabrikam_packages`). |
| **Trait** | A boolean fact about the repository discovered by the orchestrator's scan (e.g. `DotNet`) or a project-capability tag used in skill gating (e.g. `DotNetFramework`). |
