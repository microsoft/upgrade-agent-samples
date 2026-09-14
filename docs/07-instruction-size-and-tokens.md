# 7. Instruction size & token budget

Everything an extender contributes — skill bodies, scenario-extension content,
tool descriptions, tool results — lands in a **shared context window** alongside
the orchestrator's own instructions, the user's conversation, and the code the
agent is reading. Context is the scarcest resource in the system. Content that
is too long doesn't just cost money and latency; it **pushes out the content
that would have mattered**, including your own.

The single rule underneath everything on this page: **make relevance a property
of when your content loads, not of how much you write.**

## 7.1 Budgets worth knowing

| Surface | Bound | What happens at the edge |
|---------|-------|--------------------------|
| Scenario-extension response | A **60,000-character ceiling** for the whole response — preamble, wrappers and every matching extension together | Divided by ascending need; an extension that doesn't fit is truncated to **up to 150 leading whole lines** plus a resume pointer, or named as a body-less reference. See [doc 6 §6.5](06-scenario-extensions.md#65-how-the-content-reaches-the-agent). |
| `preload` skills | No hard cap — and that is the danger | Loaded into **every** session where the extender is active, whether relevant or not. |
| `lazy` skills | No hard cap | Loaded only when the `description` matches the task. The description is the cost you always pay. |
| Tool descriptions | No hard cap | Every tool's name and description sit in context for the **whole session**. |

There is no budget that makes a 4,000-line instruction file work. Truncation is
a safety net, not a strategy.

## 7.2 Target sizes

These are working targets, not enforced limits. Treat a breach as a signal to
split, not as a failure.

| Content | Target | Hard ceiling before you should split |
|---------|--------|--------------------------------------|
| Skill `description` | 1–3 sentences | ~50 words |
| `preload` skill body | ≤ 50 lines | 100 lines — above this, it probably isn't `preload` material |
| `lazy` skill body | 100–300 lines | 500 lines |
| Scenario body | 200–500 lines | Split detail into referenced files |
| Scenario-extension body or scope file | **≤ 200 lines** | 400 lines — beyond this, plan for partial delivery and order accordingly |
| Line length | ≤ 100 characters | A single line longer than an extension's share of the budget can't be shown at all |
| Tool description | 1–2 sentences | ~30 words |

## 7.3 Seven habits that keep content small

**1. Default to `lazy`.** Reserve `preload` for rules that are short *and*
apply to virtually every session. A 300-line `preload` skill is 300 lines the
user pays for while doing something unrelated to your product.

**2. Scope narrowly.** Extension content is served **per request, not once per
run** — a worker asks at the point it needs it, and some workers run repeatedly
(`Execution` is requested on every task). A broadly-scoped extension is
therefore re-sent many times over a single scenario. Most guidance belongs at
one or two points. `Any` is almost never the right answer — see
[doc 6 §6.2](06-scenario-extensions.md#62-the-scope-vocabulary).

**3. Split by scope, not by topic.** `scopeInstructions` exists so the assessor
never pays for your execution mechanics and the reviewer never pays for your
detection rules. One 400-line file served at three scopes costs 400 lines every
time any of the three asks; three 130-line files cost 130.

**4. Put the decisive content first.** Guardrails, the "when does this *not*
apply" caveat, and the top of a policy table survive truncation. A qualifier at
the bottom of a long table may never be read. This also makes your content
better when it *isn't* truncated.

**5. Move enumerations out of context.** A 900-row package table doesn't belong
inline. Two better shapes:

- **A tool.** If your MCP already knows the mapping, expose
  `lookup_fabrikam_package(name)` and let the agent ask about the five packages
  the repo actually uses instead of reading about 900 it doesn't.
- **A referenced file.** Keep a short, decisive body that names the file and
  says how to search it. The agent can `read` it on demand. State the guardrail
  in the body ("do not infer a policy for a package not listed in that file")
  so it holds even when the file hasn't been read.

**6. Write for an agent, not for a reader.** Cut marketing copy, product
history, rationale the agent can't act on, and prose restating what a table
already says. Prefer imperative steps, tables, and short before/after snippets.
One worked example beats three near-identical ones.

**7. Don't restate the platform.** The scenario already knows how to run a .NET
version upgrade. Say only what changes *because of your product*. If a paragraph
would be equally true with your product removed, delete it.

## 7.4 Tool surface counts too

Tool metadata is in context for the entire session, before a single tool is
called.

- **Fewer, sharper tools.** Ten tools with 20-word descriptions cost less and
  choose better than thirty with 60-word ones.
- **Descriptions state what and when**, not how. `"List every Fabrikam.* package
  reference and its version. Use before planning a v4 migration."` — done.
- **Bound the results.** A tool that can return a whole repository's worth of
  output should paginate, cap, or summarize. A tool result is context spent at
  the worst moment: mid-task.
- **Keep names short** (≤ ~40 characters) and unique within your extender. See
  [doc 2](02-copilot-cli-plugin.md) and [doc 3](03-vscode-extension.md).

## 7.5 A quick self-check

Before you ship, for each piece of content:

- [ ] Would this still be true and useful if the agent read **only its first 20
      lines**?
- [ ] Is anything here the scenario or the platform already knows?
- [ ] Does every `preload` skill earn always being in context?
- [ ] Is each scenario extension scoped to the fewest points that are true?
- [ ] Is any single file over ~400 lines, or any single line over ~200
      characters?
- [ ] Could a long table be a tool call or a referenced file instead?
- [ ] Does each tool description fit in two sentences?

## Next

- [Extender sub-agents](08-sub-agents.md) — moving bulky, specialized work out
  of the main agent's context entirely.
