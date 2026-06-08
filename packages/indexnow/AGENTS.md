# AGENTS.md — next-indexnow

## Overview

`@vijayhardaha/next-indexnow` validates a Next.js project environment, reads the sitemap XML file, and submits URLs to the IndexNow API for faster search engine indexing.

## Quick Start

```bash
cd packages/indexnow
bun install
bun run build     # builds dist/cli.js
bun run test      # runs vitest (57 tests)
bun run tsc       # type-check
```

## Project Structure

```
src/
  bin/cli.ts       → CLI entry point (Commander): main(), displayResults(), checkMark(), printFooter(), printFailures()
  index.ts         → Core library: run() + helpers (validateEnvironment, resolveSiteConfig, resolveKeyValue, loadSitemapUrls, submitAllUrls)
  utils.ts         → Validation & helpers (validateSiteUrl, validateNextProject, validateDotNext, validateNextSitemapConfig, readSitemapConfig, ensureKeyFile, readSitemap, submitUrls)
  constants.ts     → Shared constants (API URL, filenames, chunk size)
  types.ts         → TypeScript interfaces (NextIndexnowOptions, NextIndexnowResult, NextSitemapConfig)
  __tests__/
    utils.test.ts  → 43 tests covering all utility functions
    index.test.ts  → 14 tests covering the run() pipeline
dist/
  cli.js           → Built CLI binary (produced by vite build)
```

## Architecture

### Data Flow

```
CLI args (commander)
  → run(options)                    [src/index.ts]
      → validateEnvironment()
      → resolveSiteConfig()         CLI --site-url overrides config
      → resolveKeyValue()           CLI --key / INDEXNOW_KEY env / built-in default key
      → loadSitemapUrls()           reads & parses sitemap XML
      → submitAllUrls()             submits URLs to IndexNow API in chunks (default 100)
  → displayResults()                [src/bin/cli.ts] — color-coded checkmark summary
  → printFooter()                   [src/bin/cli.ts] — single-line result message with emoji
  → printFailures()                 [src/bin/cli.ts] — lists failed chunk errors
```

## CLI Output

```
(ASCII banner in white)
=====================================================================
next-indexnow: v0.0.1      ← tool name in yellow
=====================================================================

✔ Next.js config found                  ← log-symbols icons
✔ Sitemap config found: next-sitemap.config.js  ← label: detail format
✔ Site URL resolved: example.com
✔ API key resolved: via INDEXNOW_KEY env
✔ Key verification file: 91c8...txt created
✔ Sitemap loaded: 10 URLs found

=====================================================================
✔ Submission Completed 🎉               ← separator-wrapped heading
=====================================================================

✔ URLs found: 10                        ← blue (>0) / dim (=0)
✔ URLs submitted: 10                    ← green (>0) / dim (=0)
✔ URLs failed: 0                        ← dim (=0) / red (>0)
✔ Duration: 1.23s                       ← yellow (>0) / dim (=0)

All 10 urls submitted to IndexNow successfully! 🥳  ← lowercase in prose, emoji end
```

### Key Visual Conventions

- **Icons**: `log-symbols` package (`✔` success, `✖` error) — consistent across all output
- **Colors** (value-only, labels always bold default):
  - `URLs found`: blue when > 0, dim when 0
  - `URLs submitted`: green when > 0, dim when 0
  - `URLs failed`: red when > 0, dim when 0
  - `Duration`: yellow when > 0, dim when 0
- **Labels (checkMark)**: `label: detail` — colon with space after, no space before
- **Separators**: `chalk.dim('='.repeat(69))` — wraps banners, versions, and completion headings
- **Prose vs labels**: Data labels use uppercase (`URLs found`), prose messages use lowercase (`1 urls submitted`)
- **Dry-run**: Heading always shows `Submission Completed 🎉` regardless of mode
- **Spacing**: No indentation before checkmarks or footer messages; blank lines between logical sections
- **Spinner**: Progress spinner uses `ora` (cyan color), stopped with `spinner.stop()` + manual `logSymbols.success` log for icon consistency

## CLI Options

| Option                  | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `--site-url <url>`      | Site URL (overrides next-sitemap.config value)                        |
| `--key <key>`           | IndexNow API key (falls back to INDEXNOW_KEY env or built-in default) |
| `--sitemap <path>`      | Path to sitemap XML file                                              |
| `--chunk-size <number>` | URLs per submission batch (default: 100)                              |
| `-d, --dry-run`         | Preview URLs without submitting                                       |
| `-h, --help`            | Show help                                                             |
| `--version`             | Show version                                                          |

## Validation Checks

Before submitting, the tool validates:

1. **Next.js project** — Looks for `next.config.{ts,mjs,cjs,js}` in CWD
2. **Build directory** — `.next/` or custom build dir exists and is not empty
3. **Sitemap config** — `next-sitemap.config.{ts,mjs,cjs,js}` exists and has content
4. **Site URL** — Valid `http://` or `https://` domain root (no path/query)
5. **API key** — Provided via `--key` option, `INDEXNOW_KEY` env variable, or built-in default key
6. **Key file** — `public/<key>.txt` exists with matching content (auto-created if missing)
7. **Sitemap file** — Parsable XML with at least one `<loc>` URL

## Error Handling

- Validation failures call `console.log(chalk.red(...))` + `process.exit(1)`.
- API submission failures per chunk are reported individually via `printFailures()`.
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
- **Private helpers** (non-exported): Also documented with JSDoc for maintainability, though eslint's `jsdoc/require-jsdoc` has `publicOnly: true`.

### Coding Style

- Write functional, explicit code with clear, descriptive names.
- Use early returns and minimal nesting.
- Extract complex functions into focused helpers (<60 LOC per function).
- Maintain 100% line coverage for all source files.
- Color logic uses `switch` statement over `color` string (red/dim/green/blue/yellow/default).
