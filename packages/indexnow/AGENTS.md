# AGENTS.md — next-indexnow

## Overview

`@vijayhardaha/next-indexnow` validates a Next.js project environment, reads the sitemap XML file, and submits URLs to the IndexNow API for faster search engine indexing.

## Quick Start

```bash
cd packages/indexnow
bun install
bun run build     # builds dist/cli.js
bun run test      # runs vitest (56 tests)
bun run tsc       # type-check
```

## Project Structure

```
src/
  bin/cli.ts       → CLI entry point (Commander): main()
  index.ts         → Core library: run() + helpers (validateEnvironment, resolveSiteConfig, resolveKeyValue, loadSitemapUrls, submitAllUrls)
  utils.ts         → Validation & helpers (validateSiteUrl, validateNextProject, validateDotNext, validateNextSitemapConfig, readSitemapConfig, ensureKeyFile, readSitemap, submitUrls)
  constants.ts     → Shared constants (API URL, filenames, chunk size)
  types.ts         → TypeScript interfaces (NextIndexnowOptions, NextIndexnowResult, NextSitemapConfig)
  __tests__/
    utils.test.ts  → 43 tests covering all utility functions
    index.test.ts  → 13 tests covering the run() pipeline
dist/
  cli.js           → Built CLI binary (produced by vite build)
```

## Architecture

### Data Flow

```
CLI args (commander)
  → run(options)              [src/index.ts]
      → validateEnvironment()
          → validateNextProject()     checks for next.config.*
          → validateDotNext()         checks .next/ dir exists & not empty
          → validateNextSitemapConfig() checks next-sitemap.config.*
          → readSitemapConfig()       parses siteUrl + outDir
      → resolveSiteConfig()           CLI --site-url overrides config
      → resolveKeyValue()             CLI --key / INDEXNOW_KEY env; ensures public/<key>.txt
      → loadSitemapUrls()             reads & parses sitemap XML
      → submitAllUrls()               submits URLs to IndexNow API in chunks (default 100)
  → displayResults()          [src/bin/cli.ts]
  → handleFailures()          [src/bin/cli.ts]
```

### Key Decisions

- **Commander**: CLI argument parsing library. Handles `--help`, `--version`, option validation.
- **xml2js**: XML parsing library for sitemap parsing.
- **Vite (SSR mode)**: Builds the CLI as a single ESM bundle with external dependencies (commander, xml2js).
- **Vitest**: Test runner with v8 coverage for 100% line coverage.
- **IndexNow API**: Submits URLs via POST to `https://api.indexnow.org/indexnow` with host, key, keyLocation, and urlList.

## CLI Options

| Option                 | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `--site-url <url>`     | Site URL (overrides next-sitemap.config value)      |
| `--key <key>`          | IndexNow API key (falls back to INDEXNOW_KEY env)   |
| `--sitemap <path>`     | Path to sitemap XML file                            |
| `--chunk-size <number>`| URLs per submission batch (default: 100)            |
| `-d, --dry-run`        | Preview URLs without submitting                     |
| `-h, --help`           | Show help                                           |
| `--version`            | Show version                                        |

## Validation Checks

Before submitting, the tool validates:

1. **Next.js project** — Looks for `next.config.{ts,mjs,cjs,js}` in CWD
2. **Build directory** — `.next/` or custom build dir exists and is not empty
3. **Sitemap config** — `next-sitemap.config.{ts,mjs,cjs,js}` exists and has content
4. **Site URL** — Valid `http://` or `https://` domain root (no path/query)
5. **API key** — Provided via `--key` option or `INDEXNOW_KEY` env variable
6. **Key file** — `public/<key>.txt` exists with matching content (auto-created if missing)
7. **Sitemap file** — Parsable XML with at least one `<loc>` URL

## Error Handling

- Validation failures throw descriptive errors caught by the CLI.
- API submission failures per chunk are reported individually.
- Non-`Error` thrown values are stringified.
- Network errors in `fetch()` are caught and reported.

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

## Release Process

```bash
cd packages/indexnow
bun run release
```

Tags follow the pattern `next-indexnow@<version>`.

## Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `utils.ts`, `constants.ts`)
- **Functions**: `camelCase` (e.g., `validateSiteUrl`, `submitAllUrls`)
- **Interfaces**: `PascalCase` (e.g., `NextIndexnowOptions`, `SubmissionResult`)
- **Tests**: `*.test.ts` co-located in `__tests__/` dirs

## Coding Taste

### JSDoc Conventions

- **Functions & Methods**: Include a meaningful summary, a blank line, `@param` tags grouped together, a blank line, and an `@returns` tag (if returning a meaningful value).

### Coding Style

- Write functional, explicit code with clear, descriptive names.
- Use early returns and minimal nesting.
- Extract complex functions into focused helpers (<60 LOC per function).
- Maintain 100% line coverage for all source files.
