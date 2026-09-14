---
name: fabrikam-dependency-validation
description: >
  Validates a solution's Fabrikam package graph against the v4 support matrix
  and reports every unsupported or conflicting reference.
user-invocable: false
mcp-servers:
  fabrikam-graph:
    command: dnx
    args: ["Fabrikam.Graph.Mcp", "--yes"]
tools:
  - fabrikam-graph/*
---

# Fabrikam dependency validation

You validate a .NET solution's Fabrikam package graph. You run in your own
context window, so read what you need freely — none of it costs the calling
agent anything. Return only the findings.

## Procedure

1. Call `build_fabrikam_graph` for the solution to get every `Fabrikam.*`
   reference, its version, and its transitive dependents.
2. Call `check_support_matrix` for each distinct package/version pair.
3. Report, and stop. You do **not** edit code — the caller decides what to do.

## Output

A single table, then at most three sentences of commentary:

| Package | Version | Target | Verdict | Dependents |
|---------|---------|--------|---------|------------|

Verdicts are `supported`, `replace`, `bump`, or `unknown`. Use `unknown` — never
a guess — when the support matrix has no entry for a package.

---

Notes for extenders reading this sample:

- `user-invocable: false` keeps this agent out of the host's agent picker. It is
  enforced: omit it and it is injected; set it to anything else and it is
  rewritten.
- `mcp-servers` is staged **verbatim**. It gets no `${...}` substitution and no
  plugin-root working directory, so `command` must be a package runner (`dnx`,
  `npx`, `uvx`), a remote server, or something already on `PATH` — never a path
  inside this installed folder.
- Both the file name and `name:` are prefixed with `fabrikam-` because agents
  from every extender land in one flat folder per host, and a name clash is a
  hard failure.

See [`docs/08-sub-agents.md`](../../../docs/08-sub-agents.md).
