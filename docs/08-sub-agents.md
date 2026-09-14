# 8. Extender sub-agents

An extender can contribute **sub-agents** — hidden worker agents the
orchestrator dispatches by name — by dropping `*.agent.md` files in an `agents/`
folder beside your `upgrade-extension.json`, mirroring the sibling `skills/`
convention.

A sub-agent is the right tool when a job is **specialized, bulky, and separable**:
it runs in its **own context window**, so whatever it reads and reasons over
never lands in the main agent's context. That makes it the strongest lever you
have for the budget problem in [doc 7](07-instruction-size-and-tokens.md) — and
it is why a sub-agent may point at **its own MCP server**, giving the work a tool
surface that costs the main agent nothing.

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

If your extender *is* the plugin root — as in this repo's Copilot CLI sample —
then root-level `agents/` already **is** that folder, so nothing needs copying
(you still write `user-invocable: false` yourself; see
[§8.3](#83-user-invocable-false-is-mandatory)). Only an extender folder nested
inside a larger package needs its agent files lifted out.

Because both hosts flatten into one folder, **agent names must be globally
unique** — a duplicate silently shadows one of the two, and which one wins isn't
something you can rely on. Uniqueness spans two axes: the **file name**
(`dependency-validation.agent.md`) and the frontmatter **`name:`** (falling back
to the file stem). Prefix both with something you own
(`fabrikam-dependency-validation`). Names are deliberately **not**
auto-namespaced for you, because your own prose and dispatch refer to the agent
by the name you published.

## 8.2 How your sub-agent actually gets invoked

Discovery is not dispatch. Getting the file into the right folder makes your
agent *available*; something still has to *call* it, and nothing in the upgrade
flow calls it on a schedule or by position. It is dispatched **by name, through
the host's agent-spawning tool**, by whichever agent is currently running. So:
what makes that agent decide to hand work to yours?

You have two levers, and they are not equally strong.

**Your skills are the lever that works.** They are read by the worker doing the
job, at the moment it does it. When your `Assessment` scope says *"for anything
beyond a handful of projects, hand the dependency walk to
`fabrikam-dependency-validation`"*, you have told the right agent, at the right
point in the flow, in your own words. This is the real reason to pair a
sub-agent with a scenario extension: the extension is what gets the agent used
([doc 6](06-scenario-extensions.md)).

**Your `description` is the weaker, always-on lever.** It is what the calling
model sees when it enumerates available agents, so a vague one can keep a good
agent from ever being picked. Necessary — but on its own it is a passive hope
that the model connects your agent to the task unprompted. Write it as a
**selection cue**, not a title:

| Instead of | Write |
|-----------|-------|
| `Fabrikam agent` | `Validates Fabrikam package graphs against the v4 support matrix. Use before planning a Fabrikam upgrade.` |
| `Dependency helper` | `Resolves transitive Fabrikam.* version conflicts in a solution and reports the blocking set.` |

Name the trigger condition — *when* to reach for it — not just the capability.
Then do the part that actually decides it: **name the agent in the skills that
run where it should be used.** An agent with no matching mention in your own
instructions is usually an agent that never runs.

## 8.3 `user-invocable: false` is mandatory

Exactly one agent is user-facing: the orchestrator. Everything else is a hidden
worker it dispatches. An extender agent that reached a host's agent picker would
look like a second product.

So declare it — always, explicitly:

```yaml
---
name: fabrikam-dependency-validation
description: Validates Fabrikam package graphs against the v4 support matrix.
user-invocable: false
---
```

> **This is your responsibility, not the host's.** In a standalone plugin or
> VSIX — what this repo shows you how to build — **nothing rewrites your
> frontmatter.** Copilot CLI treats an *absent* `user-invocable` as **`true`**,
> so omitting the line publishes your worker into the user's agent picker as if
> it were a second product. Write the line.
>
> The same goes for normalization, name-collision checks, and the `tools/`
> filtering below: those belong to the pipeline that applies when an extender is
> **bundled into a host package**, not to standalone shipping.

The rules below are what that bundling pipeline enforces — and what to write to
if you want your agent to survive being bundled later. Its frontmatter scan is
deliberately narrow, and anything ambiguous is **rejected** rather than guessed:

- **Only column-0 keys count.** An indented `user-invocable:` or `name:` belongs
  to an enclosing key, or is text inside a block scalar.
- **The opening `---` must be the first non-empty line.** A fence found later
  isn't frontmatter.
- **A repeated top-level `user-invocable:` or `name:` is rejected** — which one
  a parser honours is undefined.
- **No frontmatter, or an unterminated block, is rejected** — it carries no
  name, tool scope, or visibility flag, and none are safe to guess.
- **Keep names plain and single-line.** A plain or simply quoted scalar with an
  optional trailing `#` comment works (`name: planner # worker` → `planner`).
  Folded and block scalars, anchors, aliases, tags, escaped double-quoted
  values, flow mappings, explicit-key syntax, and values continued across lines
  do not, and non-ASCII or non-printable characters are rejected in both the
  file name and the dispatch name.

## 8.4 An agent may declare its own `mcp-servers`

This is the point of the feature: a sub-agent can carry **its own tool surface**,
independent of the MCP your manifest declares.

> **Host support:** agent-local `mcp-servers` is honoured by the **Copilot CLI**
> agent runtime. In VS Code the block is carried through but the current host
> wiring does not launch it, and nothing warns you — extender tools reach the
> model through the orchestrator there instead. If your sub-agent must have its
> own server today, target the CLI, and don't rely on VS Code picking it up.

```yaml
---
name: fabrikam-dependency-validation
description: Validates Fabrikam package graphs against the v4 support matrix. Use before planning a Fabrikam upgrade.
user-invocable: false
mcp-servers:
  fabrikam-graph:
    type: local
    command: dnx
    args: ["Fabrikam.Graph.Mcp", "--yes"]
    tools: ["*"]
tools:
  - fabrikam-graph/*
---

You validate a solution's Fabrikam package graph…
```

Note the **`tools` key inside the server entry**: it is required there and is not
the same as the agent-level `tools:` list. The inner one says which of that
server's tools to expose (`["*"]` for all); the outer one scopes what the agent
may call. Omit the inner key and the frontmatter is malformed — the agent is
dropped.

The block is staged **verbatim**: nothing parses, validates, rewrites, or
resolves anything inside it, including tool names.

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

## 8.5 `tools/` — helper files beside your agents

An optional `tools/` folder is carried to both hosts and stays **nested** at your
extender path (it is not hoisted).

When an extender is bundled into a host package, only these file types are
copied out of its `tools/` folder:

| Copied | Rejected |
|--------|----------|
| `.cjs`, `.js`, `.mjs`, `.json`, `.md` | anything else — notably binaries |

Anything outside the allowlist is **rejected with an error naming the file**,
not silently skipped — skipping would resurface as a runtime failure on the
user's machine instead of a packaging error you can fix.

Follow the rule even when you ship standalone and nothing filters for you. Ship
compiled code as a published package your `mcp-servers` block launches, not as a
file in `tools/`: a binary dropped here is unsigned payload riding inside
someone else's trusted install, and it blocks you the moment you try to bundle.

## 8.6 Checklist

- [ ] Every agent file is `agents/<name>.agent.md` beside `upgrade-extension.json`
      (and, for VS Code, staged to `prompts/` **and** listed in
      `contributes.chatAgents`).
- [ ] Frontmatter opens with `---` on the first non-empty line and is terminated.
- [ ] `user-invocable: false` is declared explicitly, at column 0, exactly once —
      nothing adds it for you, and an absent key means *visible*.
- [ ] `description:` reads as a selection cue ("use this when…"), because it is
      what decides whether the agent is ever dispatched.
- [ ] `name:` appears at column 0 exactly once, and is prefixed with something
      you own.
- [ ] The file name is prefixed the same way and matches nothing else you ship.
- [ ] Each `mcp-servers` entry has its own inner `tools:` key and a `type:`.
- [ ] Any `mcp-servers` entry names a package runner, a remote server, or a
      `PATH` executable — never a path inside the installed folder.
- [ ] Anything depending on agent-local `mcp-servers` targets Copilot CLI.
- [ ] No `${...}` tokens anywhere in the frontmatter.
- [ ] `tools/`, if present, contains only `.cjs`, `.js`, `.mjs`, `.json`, `.md`.
- [ ] The agent body is written to the sizing guidance in
      [doc 7](07-instruction-size-and-tokens.md).

## Next

- [Scenario extensions](06-scenario-extensions.md) — adding your rules to a
  built-in scenario.
- [Instruction size & token budget](07-instruction-size-and-tokens.md).
