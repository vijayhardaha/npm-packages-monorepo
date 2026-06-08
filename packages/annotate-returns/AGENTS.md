# AGENTS.md — annotate-returns

## Overview

`@vijayhardaha/annotate-returns` scans TypeScript source files for functions/methods that have a `@returns {Type}` JSDoc tag but are missing an explicit return type annotation, and automatically adds them.

## Quick Start

```bash
cd packages/annotate-returns
bun install
bun run build     # builds dist/cli.js
bun run test      # runs vitest (36 tests)
bun run tsc       # type-check
```

## Project Structure

```
src/
  index.ts         → Core library: annotate() + 20+ helpers
                     (backupFile, createProject, resolveIncludeGlobs, validateNoJsFiles,
                      buildExcludedSet, resolveGitignoreSearchDirs, walkUpForGitignore,
                      findGitignorePatterns, filterSourceFiles, loadSourceFiles, emptyResult,
                      annotateFunction, processFunctions, saveModifications, processSourceFile,
                      processSourceFiles, resolveTsconfigPath, walkUpForTsconfig,
                      findTsconfigByWalkingUp, findTsconfigInSubdirectories)
  types.ts         → TypeScript interfaces (AnnotateOptions, AnnotateResult, FileResult, Annotation)
  formatters.ts    → Output formatting (formatJson, printResults, printDryRun)
  bin/cli.ts       → CLI entry point (Commander-based): main() + resolveIncludePatterns
  __tests__/
    index.test.ts        → 22 tests: annotation pipeline, dry-run, backup, tsconfig discovery,
                            exclude patterns, complex types, edge cases
    formatters.test.ts   → 14 tests: all output formatters
dist/
  cli.js           → Built CLI binary (produced by vite build)
```

## Architecture

### Data Flow

```
CLI args (commander)
  → annotate(options)           [src/index.ts]
      → resolveTsconfigPath()   finds tsconfig.json (CWD, walk-up, or subdirectory scan)
      → createProject()         ts-morph Project
      → loadSourceFiles()       resolves globs, validates no .js files, builds exclude set,
                                 finds .gitignore patterns, filters source files
      → processSourceFile()     [per file]
          → scans JSDoc @returns tags
          → matches {Type} pattern
          → applies return types via ts-morph
          → optionally backs up & saves
  → formatter                   [src/formatters.ts]
      → formatJson()            [--json]
      → printResults()          [default/--verbose/--quiet]
      → printDryRun()           [--dry-run]
```

### Tsconfig Discovery

When `tsconfig.json` is not found at CWD:

1. **Walk-up**: Resolves each include pattern to a filesystem path, walks up looking for `tsconfig.json`
2. **Subdirectory scan** (default includes only): Scans CWD subdirectories (skipping hidden dirs and build output) for a `tsconfig.json`

### Key Decisions

- **ts-morph**: Used for TypeScript AST manipulation. `skipAddingFilesFromTsConfig: true` to avoid auto-loading project files; files are added explicitly via `addSourceFilesAtPaths`.
- **Commander**: CLI argument parsing library. Handles `--help`, `--version`, option validation, pre-action hook for mutually exclusive flags.
- **Vite (SSR mode)**: Builds the CLI as a single ESM bundle with external dependencies (commander, ts-morph).
- **Vitest**: Test runner with real temp directories for filesystem tests and v8 coverage (100% line coverage).
- **`.gitignore`-aware**: Automatically parses `.gitignore` files by walking up from include directories and excludes matched paths from processing.

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
- **Constants**: Use a simple single-line summary block (`/** Description. */`). No tags or blank lines.
- **Test Files**: Test files must start with a `/** ... */` block comment detailing what the test covers.

### Coding Style

- Write functional, explicit code with clear, descriptive names.
- Ensure 100% line coverage including branches where practical.
- Use early returns and minimal nesting.
- Extract complex logic into focused helpers.
- Edge-case fallback paths (e.g., last-resort `return null`) are suppressed with `/* v8 ignore next */`.
