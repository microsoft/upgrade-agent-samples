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
| 6 | [Scenario extensions](06-scenario-extensions.md) | How to inject your rules into a **built-in** scenario — scopes, per-scope content, and delivery. |
| 7 | [Instruction size & token budget](07-instruction-size-and-tokens.md) | How much to write, and why smaller content wins. |
| 8 | [Extender sub-agents](08-sub-agents.md) | Shipping hidden worker agents, each with its own MCP server. |

Docs 1–5 are the core path: read them in order. Docs 6–8 cover the surfaces you
reach for once you know what you're contributing — most extenders need 6 and 7,
and only some need 8.

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

## Choosing what to contribute

| If you… | Contribute |
|---------|------------|
| own an end-to-end migration users should be able to pick and run | a **scenario** — [doc 4](04-skills.md) |
| own a technology that shows up *inside* a built-in migration (a control library, a package family, an API surface) | a **scenario extension** — [doc 6](06-scenario-extensions.md) |
| have know-how the agent should reach for on the right kind of task | a **lazy guidance skill** — [doc 4](04-skills.md) |
| can compute something the agent can't reason out (a dependency graph, a compatibility lookup, a bulk rewrite) | **MCP tools** — [doc 1](01-extension-model.md) |
| have a specialized, bulky job that deserves its own context window and tool surface | a **sub-agent** — [doc 8](08-sub-agents.md) |

Whichever you pick, read [doc 7](07-instruction-size-and-tokens.md) before you
write much: everything you ship shares one context window with the user's
conversation and the code being changed.

## Terminology

| Term | Meaning |
|------|---------|
| **Orchestrator** | The core Upgrade MCP server. The only MCP the host launches directly. You don't build this — you extend it. |
| **Extender** | Your contribution: a manifest + skills + (optionally) an MCP server. Also called an "extension". |
| **Host** | The product running the agent: GitHub Copilot CLI or VS Code. |
| **Host package** | The unit the host installs — a CLI plugin or a VS Code extension — that carries your extender. |
| **Manifest** | `upgrade-extension.json`. Marks a folder as an extender and declares its id, version, MCP launch, and trait gates. |
| **Skill** | A `SKILL.md` Markdown file with a metadata header. Either a *scenario* (a workflow), *guidance* (on-demand know-how), or a *scenario extension*. |
| **Scenario** | A skill with `discovery: scenario` — a complete migration workflow the agent can run. |
| **Scenario extension** | A skill with `discovery: scenarioExtension` — never user-selectable; it adds your rules to a built-in scenario at the flow points you declare. See [doc 6](06-scenario-extensions.md). |
| **Scope** | A named point in a scenario's flow where a scenario extension's content is served. The current set, and the `Any` wildcard, are listed in [doc 6 §6.2](06-scenario-extensions.md#62-the-scope-vocabulary). |
| **Sub-agent** | A hidden `*.agent.md` worker an extender ships in `agents/`, dispatched by name and able to declare its own MCP servers (Copilot CLI). See [doc 8](08-sub-agents.md). |
| **Tool** | An MCP operation the agent can call (e.g. `detect_fabrikam_packages`). |
| **Trait** | A boolean fact about the repository discovered by the orchestrator's scan (e.g. `DotNet`) or a project-capability tag used in skill gating (e.g. `DotNetFramework`). |
