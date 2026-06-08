# AGENTS.md — annotate-returns

## Overview

`@vijayhardaha/annotate-returns` scans TypeScript source files for functions/methods that have a `@returns {Type}` JSDoc tag but are missing an explicit return type annotation, and automatically adds them.

## Quick Start

```bash
cd packages/annotate-returns
bun install
bun run build     # builds dist/cli.js
bun run test      # runs vitest (37 tests)
bun run tsc       # type-check
```

## Project Structure

```
src/
  index.ts         → Core library: annotate() + 20+ helpers
  types.ts         → TypeScript interfaces (AnnotateOptions, AnnotateResult, FileResult, Annotation)
  formatters.ts    → Output formatting (formatJson, printResults, printDryRun, printSummary)
  bin/cli.ts       → CLI entry point (Commander-based): main(), checkMark(), printFooter()
  __tests__/
    index.test.ts        → 23 tests: annotation pipeline, dry-run, backup, tsconfig discovery
    formatters.test.ts   → 14 tests: all output formatters
dist/
  cli.js           → Built CLI binary (produced by vite build)
```

## Architecture

### Data Flow

```
CLI args (commander)
  → annotate(options)           [src/index.ts]
      → resolveTsconfigPath()   finds tsconfig.json
      → createProject()         ts-morph Project
      → loadSourceFiles()       resolves globs, gitignore-aware filtering
      → processSourceFile()     [per file] scans JSDoc, applies return types
  → formatter                   [src/formatters.ts]
      → formatJson()            [--json]
      → printResults()          [default/--verbose/--quiet] → printSummary()
      → printDryRun()           [--dry-run]
  → printFooter()               [src/bin/cli.ts] — single-line result message with emoji
```

## CLI Output

```
(ASCII banner in white)
=======================================================================
annotate-returns: v1.1.0       ← tool name in yellow
=======================================================================

✔ tsconfig found: tsconfig.json

=======================================================================
✔ Annotate Completed 🎉        ← separator-wrapped heading
=======================================================================

✔ Files scanned: 66            ← blue (>0) / dim (=0)
✔ Files updated: 0             ← green (>0) / dim (=0)
✔ Files failed: 0              ← dim (=0) / red (>0)
✔ Types annotated: 0           ← green (>0) / dim (=0)
✔ Duration: 0.30s              ← yellow (>0) / dim (=0)

All files already have return type annotations.     ← footer message
```

### Key Visual Conventions

- **Icons**: `log-symbols` package (`✔` success, `✖` error) — consistent across all output
- **Colors** (value-only, labels always bold default):
  - `Files scanned`: blue when > 0, dim when 0
  - `Files updated`: green when > 0, dim when 0
  - `Files failed`: red when > 0, dim when 0
  - `Types annotated`: green when > 0, dim when 0
  - `Duration`: yellow when > 0, dim when 0
- **Labels (checkMark)**: `label: detail` — colon with space after, no space before
- **Separators**: `chalk.dim('='.repeat(71))` — wraps banners, versions, and completion headings
- **Prose vs labels**: Data labels use Title Case (`Files scanned`), error labels use lowercase (`tsconfig found`)
- **Spacing**: No indentation before checkmarks or footer messages; blank line between tsconfig check and heading separator; blank line between bottom separator and summary (from `printSummary`)
- **No `Files found` line**: The intermediate `✔ Files found: N files` checkmark was removed to reduce clutter
- **Spinner**: Progress spinner uses `ora` (cyan color), stopped with `spinner.stop()` + manual `logSymbols.success` log for icon consistency

## CLI Options

| Flag                   | Description                                |
| ---------------------- | ------------------------------------------ |
| `-v, --verbose`        | Show every file and function processed     |
| `-q, --quiet`          | Only errors and summary                    |
| `--json`               | JSON report for CI                         |
| `-d, --dry-run`        | Preview only, no writes                    |
| `--check`              | Exit 1 if missing return types found       |
| `--tsconfig <path>`    | Custom tsconfig (default: `tsconfig.json`) |
| `--include <globs...>` | Include patterns                           |
| `--exclude <globs...>` | Exclude patterns                           |
| `--backup`             | Create `.bak` before modifying             |
| `[globs...]`           | Positional include patterns                |

## Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `formatters.ts`, `cli.ts`)
- **Functions**: `camelCase` (e.g., `processSourceFile`, `resolveIncludePatterns`)
- **Interfaces**: `PascalCase` (e.g., `AnnotateResult`, `FileResult`)
- **Tests**: `*.test.ts` co-located in `__tests__/` dirs

## Scripts

| Script                  | Action                   |
| ----------------------- | ------------------------ |
| `bun run build`         | Build CLI with vite      |
| `bun run test`          | Run vitest               |
| `bun run test:coverage` | Run vitest with coverage |
| `bun run tsc`           | Type-check with --noEmit |
| `bun run lint`          | ESLint check             |
| `bun run lint:fix`      | ESLint auto-fix          |
| `bun run format`        | Prettier format          |
| `bun run format:check`  | Prettier check           |

## Health & Quality

Health score: **86 (A)** — no large functions or high complexity issues above threshold.

- **100% line coverage** across all source files.
- **0 above threshold** for complexity/maintainability (fallow health).
- All functions are under 60 LOC with focused single responsibilities.
- High-complexity CLI argument validation is suppressed with `// fallow-ignore-next-line complexity`.

## Release Process

```bash
bun run build
bun run test
bun run tsc
bun run lint
bun run format:check
# bump version in package.json
# commit, tag, push
```

## Coding Taste

### JSDoc Conventions

- **Types & Interfaces**: Use `@type {TypeName}` followed by `@property {type} name - description` for each property in exact order. Include a one-line summary followed by a blank line before the tags.
- **Functions & Methods**: Include a meaningful summary, a blank line, `@param` tags grouped together, a blank line, and an `@returns` tag (if returning a meaningful value).
- **Private helpers** (non-exported): Also documented with JSDoc for maintainability.
- **Constants**: Use a simple single-line summary block (`/** Description. */`). No tags or blank lines.
- **Test Files**: Test files must start with a `/** ... */` block comment detailing what the test covers.

### Coding Style

- Write functional, explicit code with clear, descriptive names.
- Ensure 100% line coverage including branches where practical.
- Use early returns and minimal nesting.
- Extract complex logic into focused helpers.
- Color logic uses `switch` statement over `color` string (red/dim/green/blue/yellow/default).
- Edge-case fallback paths (e.g., last-resort `return null`) are suppressed with `/* v8 ignore next */`.
