# npm-packages-monorepo

Monorepo for publishing TypeScript CLI tools and utility packages.

[![GitHub](https://img.shields.io/github/license/vijayhardaha/npm-packages-monorepo)](https://github.com/vijayhardaha/npm-packages-monorepo/blob/master/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/vijayhardaha/npm-packages-monorepo)](https://github.com/vijayhardaha/npm-packages-monorepo)

## Packages

| Package                                                         | npm                                                                                                                                 | Description                                                                       |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`@vijayhardaha/schema-builder`](./packages/schema-builder)     | [![npm](https://img.shields.io/npm/v/@vijayhardaha/schema-builder)](https://www.npmjs.com/package/@vijayhardaha/schema-builder)     | Schema.org structured data utilities, types, and React components                 |
| [`@vijayhardaha/annotate-returns`](./packages/annotate-returns) | [![npm](https://img.shields.io/npm/v/@vijayhardaha/annotate-returns)](https://www.npmjs.com/package/@vijayhardaha/annotate-returns) | Add missing TypeScript return type annotations from JSDoc `@returns` tags         |
| [`@vijayhardaha/next-indexnow`](./packages/indexnow)            | [![npm](https://img.shields.io/npm/v/@vijayhardaha/next-indexnow)](https://www.npmjs.com/package/@vijayhardaha/next-indexnow)       | Submit Next.js sitemap URLs to the IndexNow API for faster search engine indexing |

### @vijayhardaha/schema-builder

Library providing reusable Schema.org structured data utilities, types, and React components for JSON-LD script tags.

**Key features:**

- Full TypeScript support with strict mode and type-safe Schema.org types via `schema-dts`
- Schema functions for Person, Organization, WebSite, WebPage, WebAPI, SoftwareApplication, and BreadcrumbList
- React `JsonLd` component for rendering JSON-LD script tags with XSS protection
- Utility functions: `deepMerge`, `mergeWithType`, `toGraph`, `buildId`, `validateUrl`, `resolveUrl`, `cleanUrl`
- Multi-entry build (core + react) via Vite with `vite-plugin-dts`
- 100% line coverage, 0 high-complexity issues above threshold

```typescript
import { personSchema, webSiteSchema, toGraph } from "@vijayhardaha/schema-builder";

const person = personSchema({ rootUrl: "https://example.com" });
const website = webSiteSchema({ rootUrl: "https://example.com" });

const graph = toGraph(person, website);
```

[→ Package documentation](./packages/schema-builder/README.md) · [→ npm](https://www.npmjs.com/package/@vijayhardaha/schema-builder)

### @vijayhardaha/annotate-returns

CLI and library that scans TypeScript source files for functions with a `@returns {Type}` JSDoc tag but lacking an explicit return type annotation, and automatically adds them.

**Key features:**

- Scans files via ts-morph with glob support (defaults to `**/*.ts` and `**/*.tsx`)
- Respects `.gitignore` patterns via directory walk-up
- Automatically discovers `tsconfig.json` (walk-up from CWD or subdirectory scan)
- Dry-run mode (`--dry-run`) for previewing changes
- Backup mode (`--backup`) for creating `.bak` files before modifications
- JSON output (`--json`) for CI pipelines
- Check mode (`--check`) for failing CI if missing annotations are found
- 100% line coverage, 0 high-complexity issues above threshold

```bash
npx @vijayhardaha/annotate-returns        # scan current directory
npx @vijayhardaha/annotate-returns src/   # scan a specific directory
npx @vijayhardaha/annotate-returns --dry-run --check
```

[→ Package documentation](./packages/annotate-returns/README.md) · [→ npm](https://www.npmjs.com/package/@vijayhardaha/annotate-returns)

### @vijayhardaha/next-indexnow

CLI tool that validates a Next.js project environment and submits sitemap URLs to the IndexNow API for instant search engine indexing.

**Key features:**

- Validates Next.js project setup (`next.config.*`, `.next/` build directory)
- Reads `next-sitemap.config.*` to extract `siteUrl` and `outDir`
- Supports variable reference configs (`const siteDomain = '...'; siteUrl: siteDomain`)
- CLI `--site-url` option overrides config file value
- Auto-creates IndexNow verification file (`public/<key>.txt`)
- Dry-run mode (`--dry-run`) for previewing URLs
- Chunked submission (default 100 URLs per request)
- 100% line coverage, 0 high-complexity issues above threshold

```bash
npx @vijayhardaha/next-indexnow                                    # auto-detect from next-sitemap.config
npx @vijayhardaha/next-indexnow --site-url https://example.com     # override site URL
npx @vijayhardaha/next-indexnow --key my-key --dry-run             # preview without submitting
```

[→ Package documentation](./packages/indexnow/README.md) · [→ npm](https://www.npmjs.com/package/@vijayhardaha/next-indexnow)

## Quick Start

```bash
# Clone and install
git clone https://github.com/vijayhardaha/npm-packages-monorepo.git
cd npm-packages-monorepo
bun install

# Build all packages
bun run build

# Run all tests (57 indexnow + 37 annotate-returns + 54 schema-builder)
bun run test

# Coverage report for all packages
bun run test:coverage

# Type-check all packages
bun run tsc

# Lint all packages
bun run lint
```

## Project Structure

```
npm-packages-monorepo/
├── packages/
│   ├── schema-builder/      # @vijayhardaha/schema-builder
│   │   ├── src/
│   │   │   ├── index.ts      # Core entry (re-exports schemas, constants, utils)
│   │   │   ├── react.tsx     # React entry (exports JsonLd component)
│   │   │   ├── components/   # JsonLd.tsx
│   │   │   ├── schemas/      # personSchema, webSiteSchema, breadcrumbSchema, etc.
│   │   │   ├── constants/    # CREATOR constant
│   │   │   ├── utils/        # merge, url, schema utilities
│   │   │   └── __tests__/    # 54 tests (100% line coverage)
│   │   └── ...
│   ├── annotate-returns/     # @vijayhardaha/annotate-returns
│   │   ├── src/
│   │   │   ├── index.ts      # Core library: annotate() + 20+ helpers
│   │   │   ├── bin/cli.ts    # CLI entry point (Commander)
│   │   │   ├── formatters.ts # Output formatting (JSON, verbose, quiet, dry-run)
│   │   │   ├── types.ts      # TypeScript interfaces
│   │   │   └── __tests__/    # 37 tests (100% line coverage)
│   │   └── ...
│   └── indexnow/             # @vijayhardaha/next-indexnow
│       ├── src/
│       │   ├── index.ts      # Core library: run() + helpers
│       │   ├── bin/cli.ts    # CLI entry point (Commander)
│       │   ├── utils.ts      # Validation & helpers
│       │   ├── constants.ts  # Shared constants
│       │   ├── types.ts      # TypeScript interfaces
│       │   └── __tests__/    # 57 tests (100% line coverage)
│       └── ...
├── package.json              # Workspace root
└── README.md                 # This file
```

## Root Scripts

| Script                  | Action                           |
| ----------------------- | -------------------------------- |
| `bun run build`         | Build all packages with Vite     |
| `bun run test`          | Run all package tests via Vitest |
| `bun run test:coverage` | Run all tests with coverage      |
| `bun run tsc`           | Type-check all packages          |
| `bun run lint`          | ESLint check all packages        |
| `bun run lint:fix`      | ESLint auto-fix all packages     |
| `bun run format`        | Prettier format all files        |
| `bun run format:check`  | Prettier check all files         |

## Technology Stack

| Tool           | Purpose                               |
| -------------- | ------------------------------------- |
| **Bun**        | Package manager & runtime             |
| **TypeScript** | Language                              |
| **Vite**       | Build tool (SSR mode for CLI bundles) |
| **Vitest**     | Test runner with v8 coverage          |
| **ESLint**     | Code linting                          |
| **Prettier**   | Code formatting                       |
| **release-it** | Package release automation            |
| **Husky**      | Git hooks                             |
| **commitlint** | Commit message linting                |

## Releasing a Package

```bash
# For schema-builder
cd packages/schema-builder
bun run release

# For annotate-returns
cd packages/annotate-returns
bun run release

# For next-indexnow
cd packages/indexnow
bun run release
```

Each package uses its own `.release-it.json` with package-scoped tags (e.g., `schema-builder@1.1.0`, `annotate-returns@1.1.2`, `next-indexnow@1.0.0`).

## Adding a New Package

1. Create a directory in `packages/`
2. Add its own `package.json`, `tsconfig.json`, and source files
3. Add `vitest.config.ts` and `vitest.setup.ts` for testing
4. Add `.release-it.json` for release automation
5. Run `bun install` from root to link workspace dependencies
6. Add the package to this README's package table

## License

MIT &copy; [Vijay Hardaha](https://github.com/vijayhardaha)
