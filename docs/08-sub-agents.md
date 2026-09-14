# 8. Extender sub-agents

An extender can contribute **sub-agents** — hidden worker agents the
orchestrator dispatches by name — by dropping `*.agent.md` files in an `agents/`
folder beside your `upgrade-extension.json`, mirroring the sibling `skills/`
convention.

A sub-agent is the right tool when a job is **specialized, bulky, and separable**:
it runs in its **own context window**, so whatever it reads, reasons over, and
discards never lands in the main agent's context. That makes it the strongest
lever you have for the budget problem in [doc 7](07-instruction-size-and-tokens.md) —
and it is why a sub-agent may point at **its own MCP server**, giving the work a
tool surface that costs the main agent nothing.

```text
<extender-root>/
├── upgrade-extension.json     # manifest (doc 1)
├── skills/<skill>/SKILL.md    # discovered in place (doc 4)
├── agents/<name>.agent.md     # a sub-agent
└── tools/<file>               # optional helper files for your agents
```

> **Skills first.** Most extenders need no sub-agent at all. Skills plus a
> proxied MCP cover the common cases, and they compose with the orchestrator's
> own workers. Reach for a sub-agent when a task is genuinely a *separate job*
> with its own tool surface — a deep dependency analysis, a bulk code
> transformation, a domain-specific validation pass — not merely a long skill.

## 8.1 Where agent files end up

Skills stay nested under your extender folder and are discovered there. Sub-agents
are the one payload that doesn't: each host discovers custom agents in a single
flat, plugin-level folder.

| Host | Flat agent folder | Also required |
|------|-------------------|---------------|
| Copilot CLI plugin | `<pluginDir>/agents/` | Nothing — the folder is discovered. |
| VS Code extension | `<extensionDir>/prompts/` | VS Code does **not** auto-discover agent files. Each one must also be listed in `contributes.chatAgents` in `package.json`. |

If your extender *is* the plugin root — which it is for the Copilot CLI sample
in this repo — `agents/` at the root already **is** that folder, and there is
nothing to do. Only when an extender folder is nested inside a larger package do
its agent files need to be lifted to the package's flat folder.

Because both hosts flatten everything into one folder, **agent names must be
globally unique** — a duplicate silently shadows one of the two. Names are
checked case-insensitively on two independent axes:

- the **file name** (`dependency-validation.agent.md`), and
- the frontmatter **`name:`** (falling back to the file stem when absent).

Prefix both with something you own (`fabrikam-dependency-validation`) and a
clash becomes very unlikely. Note that file names are deliberately **not**
auto-namespaced for you: your own `agents:` dispatch and your prose refer to the
agent by the name you published, so renaming it would break those references.

## 8.2 `user-invocable: false` is mandatory — and enforced

Exactly one agent is user-facing: the orchestrator. Everything else is a hidden
worker it dispatches. An extender agent that reached a host's agent picker would
look like a second product.

So declare it:

```yaml
---
name: fabrikam-dependency-validation
description: Validates Fabrikam package graphs against the v4 support matrix.
user-invocable: false
---
```

If you omit the key it is **injected** as `false`; if you set it to anything
else it is **rewritten** to `false`. A file that already declares
`user-invocable: false` is left alone — key order, formatting and body are
preserved.

The frontmatter scan is deliberately narrow, and anything ambiguous is
**rejected** rather than guessed at:

- **Only column-0 keys count.** An indented `user-invocable:` or `name:` belongs
  to some enclosing key, or is text inside a block scalar — it is not the entry
  the host reads.
- **The opening `---` must be the first non-empty line.** A fence found later in
  the file isn't frontmatter.
- **A repeated top-level `user-invocable:` or `name:` is rejected.** Which one a
  parser honours is undefined, so there is no safe entry to enforce.
- **A file with no frontmatter, or an unterminated frontmatter block, is
  rejected** — it carries no name, tool scope, or visibility flag, and none of
  those are safe to guess.
- **Values resolve the way YAML resolves them**: a quoted value ends at its
  closing quote; an unquoted one ends at an inline `#` comment. `name: planner #
  worker` is the name `planner`.

## 8.3 An agent may declare its own `mcp-servers`

This is the point of the feature: a sub-agent can carry **its own tool surface**,
independent of the MCP your manifest declares.

```yaml
---
name: fabrikam-dependency-validation
description: Validates Fabrikam package graphs against the v4 support matrix.
user-invocable: false
mcp-servers:
  fabrikam-graph:
    command: dnx
    args: ["Fabrikam.Graph.Mcp", "--yes"]
tools:
  - fabrikam-graph/*
---

You validate a solution's Fabrikam package graph…
```

The block is staged **verbatim**. The packaging path never parses, validates,
rewrites, or resolves anything inside it — including tool names, which stay
exactly as you wrote them.

### The server must be launchable in any environment

Agent frontmatter is **not** a plugin manifest. It gets:

- **no `${...}` substitution**,
- **no injected plugin-root variable**, and
- **no working directory rooted at your plugin**.

So an agent **cannot launch a script shipped inside its own installed folder** —
there is no supported way to spell that path. Declare one of these instead:

| Shape | Example |
|-------|---------|
| A **package runner** naming a published package | `dnx Fabrikam.Graph.Mcp --yes`, `npx -y @fabrikam/graph-mcp`, `uvx fabrikam-graph-mcp` |
| A **remote** server you host | an HTTP MCP endpoint |
| An **executable already on `PATH`** | `fabrikam-graph-mcp` |

If your server needs to know where it was installed, it must work that out at
runtime **inside its own process**. Reading a host environment variable is not a
substitute: a variable only one host sets is `undefined` in every other one, and
the breakage is invisible in the host that *does* set it.

> This mirrors the rule for the manifest's `mcp` block ([doc 1](01-extension-model.md)),
> with one difference worth remembering: the manifest **does** support
> `${pluginRoot}`; agent frontmatter **does not**.

## 8.4 `tools/` — helper files beside your agents

An optional `tools/` folder is carried to both hosts and stays **nested** at your
extender path (it is not hoisted). Only these file types are copied out of a
packaged extender:

| Copied | Rejected |
|--------|----------|
| `.cjs`, `.js`, `.mjs`, `.json`, `.md` | anything else — notably binaries |

Anything outside the allowlist is **rejected with an error naming the file**, not
silently skipped: skipping would resurface as a runtime failure on the user's
machine instead of a packaging error you can fix. Ship compiled code as a
published package your `mcp-servers` block launches, not as a file in `tools/`.

## 8.5 Checklist

- [ ] Every agent file is `agents/<name>.agent.md` beside `upgrade-extension.json`
      (and, for VS Code, staged to `prompts/` **and** listed in
      `contributes.chatAgents`).
- [ ] Frontmatter opens with `---` on the first non-empty line and is terminated.
- [ ] `user-invocable: false` is declared explicitly, at column 0, exactly once.
- [ ] `name:` appears at column 0 exactly once, and is prefixed with something
      you own.
- [ ] The file name is prefixed the same way and matches nothing else you ship.
- [ ] Any `mcp-servers` entry names a package runner, a remote server, or a
      `PATH` executable — never a path inside the installed folder.
- [ ] No `${...}` tokens anywhere in the frontmatter.
- [ ] `tools/`, if present, contains only `.cjs`, `.js`, `.mjs`, `.json`, `.md`.
- [ ] The agent body is written to the sizing guidance in
      [doc 7](07-instruction-size-and-tokens.md).

## Next

- [Scenario extensions](06-scenario-extensions.md) — adding your rules to a
  built-in scenario.
- [Instruction size & token budget](07-instruction-size-and-tokens.md).
