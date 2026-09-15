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

## What to record

Record a short **Fabrikam control inventory** section in the assessment — even
when it is empty. "No Fabrikam controls present" is a valid, expected finding,
and it is not the same as "not checked".

Keep it to four columns: package, version found, verdict, affected projects.
Nothing else from this file needs to reach the report.
