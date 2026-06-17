# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2026-06-17

### Changed

- **`mergeWithType` generics enhanced**: Return type widened to `T & Record<string, unknown>` for flexible property access. `overrides` parameter accepts `unknown`, removing the need for caller-side casts with schema-dts types.

### Fixed

- **`buildId` URL validation**: Now validates the input URL via `validateUrl()` instead of using `cleanUrl()` without validation.

- **`toGraph` input validation**: Now throws if no entities are provided or any entity is not a plain object.

## [1.1.1] - 2026-06-10

### Fixed

- Updated `exports` map in `package.json` to point to compiled `dist/` files instead of `src/` source files, resolving resolution failures when the package is consumed from npm (where only `dist/` is shipped)

## [1.1.0] - 2026-06-10

### Added

- `tsc` script for per-package TypeScript type-checking
- `.prettierignore` to exclude `dist/` from formatting
- `eslint-import-resolver-typescript` for `@/*` path alias resolution in ESLint

### Changed

- **Monorepo migration**: Migrated from standalone repo to `npm-packages-monorepo` workspace
  - Updated `homepage`, `repository`, and `bugs` URLs to monorepo paths
  - Switched `tsconfig.json` to extend `../../tsconfig` (monorepo root)
  - Updated `.release-it.json` with scoped tag pattern (`schema-builder@${version}`)
  - Scoped `include` in tsconfig to package sources only (`src`, config files)
- Aligned `package.json` scripts format with other monorepo packages
- Aligned `vite.config.ts` and `vitest.config.ts` import style with monorepo conventions
- Updated `eslint.config.mjs` resolver configuration for monorepo root-level linting
- Removed shared devDependencies (hoisted to monorepo root), retained package-specific ones
- Updated `README.md` to point to monorepo issue tracker

### Docs

- Updated `AGENTS.md` with monorepo context, release process, and git workflow

## [1.0.6] - 2026-05-29

### Chore

- Updated React and React-DOM dependencies to ^19.2.6
- Updated @commitlint packages to ^21.0.2
- Updated @vijayhardaha/dev-config to ^2.0.2
- Updated ESLint to ^10.4.0 with related plugin updates
- Added typescript-eslint ^8.60.0 as new dependency
- Simplified ESLint lint scripts by removing explicit file extensions
- Updated various development dependencies to latest versions

## [1.0.5] - 2026-05-29

### Fixed

- TypeScript declaration files now output to `dist/` root instead of `dist/src/`, fixing the `exports` map mismatch in `package.json`

## [1.0.4] - 2026-05-29

### Changed

- Switched package manager from npm to bun
- Updated all documentation references from npm to bun commands
- Updated release-it hooks to use bun run

### Refactor

- Extracted `isPlainObject()` guard in `deepMerge` to reduce branch density (0.19 → 0.15)
- Extracted `buildPersonSchema()` helper from `personSchema` to reduce unit size (71 → 26 LOC)
- Grouped test cases into nested describe blocks in `merge.test.ts` and `softwareApp.test.ts`

### Test

- Added edge case tests for `deepMerge` (null values, empty objects, multi-level nesting, mutation safety)
- Total test count increased from 49 to 54

### Lint

- Fixed missing JSDoc return types and param descriptions across multiple files

## [1.0.3] - 2026-05-29

### Chore

- Updated dependencies to latest versions
- Reorganized package.json fields for better structure
- Updated lint/format scripts

### Test

- Moved schema tests to `__tests__` directory for consistency
- Moved utility tests to `__tests__` directory for consistency

### Refactor

- Added explicit `JSX.Element` return type to `JsonLd` component

### Style

- Standardized comment alignment in configuration files

### Docs

- Updated AGENTS.md with git workflow guidelines
- Added CLAUDE.md symlink to AGENTS.md
- Replaced copilot-instructions.md with symlink to AGENTS.md

### CI

- Updated release hooks and timing in release-it config
- Enhanced pre-commit hooks with format and lint checks

## [1.0.2] - 2026-03-29

### Fixed

- Replaced `websiteSchema` export name with `webSiteSchema`

## [1.0.1] - 2026-03-28

### Added

- ESLint resolver configuration for TypeScript paths
- CHANGELOG.md documentation

### Fixed

- ESLint `import/no-unresolved` errors for `@vijayhardaha/dev-config` imports
- Linter issue with import/order

### Feat

- Removed `mainEntityOfPage` from Person schema
- Deleted unmatched keys from each schema on merge

### Refactor

- Removed `sameAs` from organization schema
- Removed redundant cleanup code from all schemas (deepMerge handles undefined values)

### Test

- Improved test coverage from 88% to 93%
- Added tests for `softwareAppSchema` optional fields
- Added tests for `webPageSchema` options (breadcrumb, mainEntityId)
- Added tests for `aboutPageSchema` and `contactPageSchema`
- Added more test cases for webPage and merge utilities

### Chore

- Switched to `@vijayhardaha/dev-config` for shared configs
- Updated `@vijayhardaha/dev-config` to v1.0.5
- Removed lint script from pre-commit hook

### Docs

- Updated AGENTS.md and copilot-instructions.md

## [1.0.0] - 2026-03-27

### Added

- Initial release
- Schema.org structured data utilities with TypeScript support
- React components for JSON-LD script tags
- Utility functions for merging, validating, and building schemas

### Features

- `personSchema` - Person entity with creator profile
- `organizationSchema` - Organization linked to creator
- `webSiteSchema` - Website with search action
- `webpageSchema` - General web page
- `aboutPageSchema` - About page
- `contactPageSchema` - Contact page
- `webApiSchema` - WebAPI with pricing and platform
- `softwareAppSchema` - Software application with pricing
- `breadcrumbSchema` - Navigation breadcrumb list

### Utilities

- `validateUrl()` - Validates HTTP(S) URLs, throws on invalid
- `resolveUrl()` - Resolves URL with path
- `cleanUrl()` - Cleans URL (trailing slash, query strings)
- `deepMerge()` - Recursively merges objects
- `mergeWithType()` - Merges while preserving `@type`
- `toGraph()` - Wraps entities in `@graph` structure
- `buildId()` - Builds schema ID from URL and fragment

### React Components

- `JsonLd` - Renders JSON-LD script tag with XSS protection

### Build

- Vite multi-entry build (ESM only)
- TypeScript declaration files via vite-plugin-dts
