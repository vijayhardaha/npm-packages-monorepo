# AGENTS.md — npm-packages-monorepo

## Overview

Monorepo for publishing npm packages. Each package in `packages/` is independently built, tested, and published via release-it with scoped tags.

## Quick Start

```bash
git clone <repo>
cd npm-packages-monorepo
bun install
bun run build     # builds all packages
bun run test      # runs all tests
bun run tsc       # type-check all packages
```

## Project Structure

```
packages/
  schema-builder/      → @vijayhardaha/schema-builder (library — Schema.org utilities & React components)
  annotate-returns/    → @vijayhardaha/annotate-returns (CLI + library)
  indexnow/            → @vijayhardaha/next-indexnow (CLI)
AGENTS.md              → this file — monorepo overview
```

## Scripts

| Script                  | Action                    |
| ----------------------- | ------------------------- |
| `bun run build`         | Build all packages        |
| `bun run dev`           | Dev mode for all packages |
| `bun run test`          | Run vitest                |
| `bun run test:coverage` | Run vitest with coverage  |
| `bun run tsc`           | Type-check with --noEmit  |
| `bun run lint`          | ESLint check              |
| `bun run lint:fix`      | ESLint auto-fix           |
| `bun run format`        | Prettier format           |
| `bun run format:check`  | Prettier check            |

## Release Process

Each package uses release-it with scoped tags. Example for `annotate-returns`:

```bash
cd packages/annotate-returns
bun run release
```

Tags follow the pattern `@vijayhardaha/<package>@<version>` (e.g., `@vijayhardaha/annotate-returns@1.0.2`).

## Health & Quality

- Run `bun run lint` + `bun run format:check` before committing or pushing.
- Pre-push hooks run: format:check → tsc → lint → build.
- Commit messages follow conventional commits (enforced by commitlint).

## Naming Conventions

- **Packages**: `kebab-case` directory names (e.g., `annotate-returns`)
- **npm scope**: `@vijayhardaha/<package-name>`
- **Source files**: `kebab-case.ts`
- **Functions**: `camelCase`
- **Interfaces**: `PascalCase`
- **Tests**: `*.test.ts` co-located in `__tests__/` dirs

## Coding Taste

### JSDoc Conventions

- **Types & Interfaces**: Use `@type {TypeName}` followed by `@property {type} name - description` for each property in exact order. Include a one-line summary followed by a blank line before the tags. Do not use `@interface`.
- **Functions & Methods**: Include a meaningful summary, a blank line, `@param` tags grouped together, a blank line, and an `@returns` tag (if returning a meaningful value). Avoid empty `@returns` for void/setters.
- **Constants**: Use a simple single-line summary block (`/** Description. */`). No tags or blank lines.
- **Test Files**: Test files must start with a `/** ... */` block comment detailing what the test covers. Do not use the `@module` tag in test files.

### Coding Style

- Write functional, explicit code with clear, descriptive names.
- Ensure 100% test coverage including branches.
- Use early returns and minimal nesting.
