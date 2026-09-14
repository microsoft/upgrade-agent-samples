# 4. Authoring skills

Skills are the **primary** way an extender teaches the agent. A skill is a
single `SKILL.md` Markdown file: a **metadata header** (YAML front matter) that
tells the orchestrator *when* the skill applies, plus a **Markdown body** the
agent follows.

Skills live under your extender's skills directory, one folder per skill. The
exact path depends on the host — `upgrade/skills/` for a Copilot CLI plugin,
`skills/` for a VS Code extension:

```
<skills-dir>/
├── fabrikam-v4-upgrade/SKILL.md        # a scenario (a full workflow)
├── fabrikam-package-audit/SKILL.md     # on-demand guidance
└── fabrikam-controls-rules/SKILL.md    # a scenario extension (doc 6)
```

> This page covers the SKILL.md format and every metadata field. For the
> **trait values** you put in `metadata.traits` and `scenarioTraitsSet`, see
> [doc 5](05-skills-metadata-and-traits.md).

## 4.1 Anatomy of a skill

```markdown
---
name: fabrikam-v4-upgrade
description: >
  Migrate a .NET solution from the Fabrikam v3 component suite to v4: package
  renames, a Fabrikam.Data major bump, and dropping Fabrikam.Json for
  System.Text.Json.
requires-extension: upgrade-fabrikam
metadata:
  discovery: scenario
  importance: high
  weight: 9000
  traits: .NET|CSharp|VisualBasic|DotNetCore
  scenarioTraitsSet: [.NET, Fabrikam]
---

# Fabrikam suite v3 → v4 migration

Step-by-step instructions the agent follows…
```

The body is plain Markdown. Write it as a focused playbook: numbered steps,
explicit tool calls (by bare name), and verification checkpoints.

## 4.2 The discovery modes

`metadata.discovery` decides *when* a skill is loaded into the agent's context.

| Mode | When loaded | Use for |
|------|-------------|---------|
| `lazy` | On demand, when the agent matches the `description` to the current task. | Most guidance skills. Keeps the context window lean. **Recommended default.** |
| `preload` | Always available once the extender is active. | Short, broadly-applicable rules you always want in context. Use sparingly. |
| `scenario` | Surfaced as a selectable workflow the agent can start. | Complete migration workflows (a "scenario"). |
| `scenarioExtension` | Injected into a **built-in** scenario that is already running, at the flow points you declare. | Your rules for *your* technology inside somebody else's migration. See [doc 6](06-scenario-extensions.md). |

Two further values, `none` and `system`, are accepted but reserved for
host-owned skills. As an extender you want one of the four above.

A **scenario** is just a skill with `discovery: scenario`. It represents an
end-to-end migration the user can pick and the agent can run phase by phase.

A **scenario extension** (`discovery: scenarioExtension`) is the opposite shape:
it defines no workflow of its own and is never user-selectable. It adds your
detection rules, planning constraints, migration mechanics, or review rules to a
scenario the orchestrator already owns. It has its own metadata fields
(`scope`, `extends-scenario`, `scopeInstructions`, `order`) — all of them are
covered in [doc 6](06-scenario-extensions.md).

> Pick a value explicitly. An unrecognised `discovery` value is treated as a
> typo, not as an omission: for an ordinary skill it fails closed — the skill
> matches no discovery query until it's corrected — rather than quietly loading
> as a `preload` skill. A skill that also declares scenario-extension fields is
> instead rescued as a scenario extension, with the bad value logged. See
> [doc 6](06-scenario-extensions.md).

## 4.3 Metadata field reference

All custom fields live under `metadata:` except the top-level `name`,
`description`, and `requires-extension`.

| Field | Where | Required | Purpose |
|-------|-------|----------|---------|
| `name` | top level | Yes | Unique skill id (kebab-case). Referenced by other skills' `post-completion`. |
| `description` | top level | Yes | One-to-three sentences. For `lazy` skills this is what the agent matches against — make it specific. |
| `requires-extension` | top level | Scenarios | The extender id(s) a scenario needs active. See §4.4. |
| `metadata.discovery` | metadata | No | `lazy` \| `preload` \| `scenario` \| `scenarioExtension` \| `none` \| `system`. The last two are reserved for host-owned skills; extenders use the first four. See §4.2. |
| `metadata.traits` | metadata | No | Trait expression gating the skill against repository traits. See [doc 5](05-skills-metadata-and-traits.md). |
| `metadata.scenarioTraitsSet` | metadata | Scenarios | Extra traits characterizing this scenario, used when matching it to a repository. List form, e.g. `[.NET]` or `[.NET, DotNetFramework, WebForms]`. |
| `metadata.importance` | metadata | No | `high` \| `medium` \| `low`. A hint used in ranking. |
| `metadata.weight` | metadata | No | Integer tie-breaker for ordering among comparable skills (higher = earlier). |
| `metadata.autoMatch` | metadata | No | `true` to always include the skill in task matching regardless of content score. Use only for near-universal skills. |
| `metadata.post-completion` | metadata | No | Suggest follow-up scenarios/actions after this scenario finishes. See §4.5. |
| `metadata.scope` | metadata | Extensions | Flow points a scenario extension applies at. See [doc 6](06-scenario-extensions.md). |
| `metadata.extends-scenario` | metadata | No | Scenario id(s) a scenario extension applies to; omit for all. See [doc 6](06-scenario-extensions.md). |
| `metadata.scopeInstructions` | metadata | No | Per-scope content files for a scenario extension. See [doc 6](06-scenario-extensions.md). |
| `metadata.order` | metadata | No | Ascending presentation order among scenario extensions; omitted sorts last. |

> Discovery defaults differ by where a skill is found, but a `discovery:` value
> in the skill's own metadata **always wins**. Set it explicitly and you never
> have to think about the defaults.

## 4.4 `requires-extension` (scenarios)

A scenario opts into the extender(s) it needs. Three shapes are accepted:

```yaml
requires-extension: upgrade-fabrikam                  # single id
# requires-extension: [upgrade-fabrikam, upgrade-js] # list — all must be installed
# requires-extension:                                # trait expression
#   match-traits: [.NET, DotNetCore]
#   mode: "intersect-with-installed"
```

- **Single id** — the scenario is offered only when that extender is installed.
- **List** — offered only when every listed extender is installed.
- **Trait expression** — selects extenders whose declared `traits` overlap;
  `mode: "intersect-with-installed"` further restricts to installed ones.

When the scenario starts, the orchestrator makes the resolved extenders' tools
available to the agent.

## 4.5 `post-completion` (scenarios)

Recommend what to do next when a scenario completes:

```yaml
metadata:
  post-completion:
    suggest-scenarios:
      - fabrikam-package-audit
    suggest-actions:
      - generate-report
```

The agent surfaces these as suggested next steps after the scenario finishes.

## 4.6 Authoring tips

1. **Gate precisely.** A skill with no `traits` applies everywhere; one with a
   trait expression only surfaces when the repository matches. Most skills
   should be gated — see [doc 5](05-skills-metadata-and-traits.md).
2. **Prefer `lazy`.** Reserve `preload` for tiny, always-relevant rules.
3. **Write specific descriptions.** For `lazy` skills the description *is* the
   matcher. "Migrate Spring Boot 2 → 3" beats "Java migration".
4. **One job per skill.** Split large migrations into a scenario plus focused
   guidance skills rather than one giant file.
5. **Reference tools by bare name** so prose resolves on every host.
6. **Keep facts fresh.** If a skill embeds version tables or dates, note when
   they were last verified so the agent can re-check.
7. **Watch the size.** Every line you ship competes for the same context window.
   See [doc 7](07-instruction-size-and-tokens.md) for target sizes and the
   habits that keep content small.

## Next

- [Skills metadata & known traits](05-skills-metadata-and-traits.md) — the
  catalog of trait values to gate on.
- [Scenario extensions](06-scenario-extensions.md) — add your rules to a
  built-in scenario instead of writing your own.
- [Instruction size & token budget](07-instruction-size-and-tokens.md) — how big
  any of this should be.
