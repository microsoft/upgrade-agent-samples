# Fabrikam controls — assessment rules

Served to the assessor at `scope: Assessment`.

**Guardrail first:** report only what you find. Do not infer a support policy
for a `Fabrikam.*` package that is not listed below — flag it as unknown and say
so, rather than guessing.

## What to detect

1. Every `Fabrikam.Windows.Forms` reference — in `.csproj` / `.vbproj`
   `<PackageReference>` items, a central `Directory.Packages.props`, or a legacy
   `packages.config` — together with its version.
2. Any `*.Designer.cs` / `*.Designer.vb` file referencing a
   `Fabrikam.Windows.Forms` type.
3. Any `Fabrikam.Windows.Forms.Themes` reference.

## How to judge it

| Found | Verdict |
|-------|---------|
| `Fabrikam.Windows.Forms` < 8.0 on a project targeting .NET 8+ | **Blocking.** Must be replaced with 8.x; retargeting alone will not work. |
| `Fabrikam.Windows.Forms` 8.x | Supported. No action. |
| `Fabrikam.Windows.Forms.Themes`, any version | **Blocking.** Removed in 8.0; styling moves into `Fabrikam.Windows.Forms` 8.x. No drop-in successor. |
| Designer files referencing pre-8.0 types | **Needs regeneration** after the package bump. List the affected files. |

## Delegating the graph walk

For anything beyond a handful of projects, hand the dependency walk to the
`fabrikam-dependency-validation` sub-agent rather than tracing transitive
references yourself. It runs in its own context, talks to the Fabrikam graph
server directly, and returns just the verdict table — so the assessment never
pays for the intermediate reasoning.

Reach for it when the solution has more than a few UI projects, when
`Fabrikam.*` versions disagree across projects, or when a reference is pulled in
transitively. Fall back to the rules above if the graph server is unavailable.

> This is the pattern in
> [`docs/08-sub-agents.md`](../../../../../../docs/08-sub-agents.md): shipping the
> agent makes it available, naming it here is what gets it used.

## What to record

Record a short **Fabrikam control inventory** section in the assessment — even
when it is empty. "No Fabrikam controls present" is a valid, expected finding,
and it is not the same as "not checked".

Keep it to four columns: package, version found, verdict, affected projects.
Nothing else from this file needs to reach the report.
