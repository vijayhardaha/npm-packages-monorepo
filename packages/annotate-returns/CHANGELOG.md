# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] — 2026-06-08

### Added

- **Exported `resolveTsconfigPath`** from the core library so the CLI can reuse the same tsconfig discovery logic (walk-up from include directories, subdirectory scan for monorepo layouts).

### Changed

- **CLI tsconfig check now uses library's `resolveTsconfigPath`**: Replaced the CLI's own basic `existsSync` + CWD-only walk-up with the full discovery logic from the library. When tsconfig is found via walk-up or subdirectory scan, the checkmark now shows the **actual resolved path** (e.g., `/Users/user/project/packages/app/tsconfig.json`) instead of always showing the user-provided value.

### Fixed

- **False `✖ tsconfig not found` error**: When tsconfig was discoverable via walk-up or subdirectory scan but not at the specified path, the CLI incorrectly showed an error. Now uses the library's full discovery before reporting failure.

## [1.1.1] — 2026-06-08

### Added

- **`log-symbols` package**: All hardcoded `✓`/`✗` icons replaced with `logSymbols.success`/`logSymbols.error` for consistent cross-platform icon rendering.
- **Separator-wrapped completion heading**: `✔ Annotate Completed 🎉` now displayed between `=====` separators after scan completes, matching the project's visual rhythm.
- **Footer emoji**: Success message now includes `🥳` emoji (`All N files annotated successfully! 🥳`).
- **JSDoc documentation**: Added JSDoc to all non-exported helper functions (`checkMark`, `printFooter`, `resolveIncludePatterns`).
- **Blank line spacing**: Added blank line before the separator heading for consistent visual separation between tsconfig check and completion message.

### Changed

- **Spinner icon consistency**: `spinner.succeed()` replaced with `spinner.stop()` + manual `console.log()` using `logSymbols.success`, ensuring all checkmark icons come from the same source.
- **Completion message**: `Scan complete` → `Annotate Completed 🎉` for consistency with the tool name and emoji style.
- **Status labels**: Verbose mode output changed from UPPERCASE to Title Case (`FAILED` → `Failed`, `UPDATED` → `Updated`).
- **Colon formatting**: `label : detail` → `label: detail` (space before colon removed, space after retained).
- **Color logic**: Nested ternary converted to a `switch` statement for improved readability and maintainability.
- **Summary color coding**: Values now use semantic colors — `dim` when 0, colored when > 0:
  - `Files scanned`: blue when > 0
  - `Files updated`: green when > 0
  - `Files failed`: red when > 0
  - `Types annotated`: green when > 0
  - `Duration`: yellow when > 0
- **Footer spacing**: Removed leading `console.log('')` from `printFooter` to eliminate double blank line caused by `printSummary`'s trailing blank line.
- **`Files found` line removed**: The intermediate `✔ Files found: N files` checkmark was removed to reduce output clutter — summary now goes directly from separator to results.

### Fixed

- **Double blank line before footer**: `printSummary` ended with `console.log('')` and `printFooter` started with one, creating a double blank line. Fixed by removing the leading blank line from `printFooter`.

## [1.1.0] — 2026-06-08

### Added

- **New helper functions extracted from `loadSourceFiles()`**: `resolveIncludeGlobs`, `validateNoJsFiles`, `buildExcludedSet`, `resolveGitignoreSearchDirs`, `walkUpForGitignore`, `findGitignorePatterns`, `filterSourceFiles` — each function now has a single responsibility.
- **New helper functions extracted from `annotate()`**: `resolveTsconfigPath`, `findTsconfigByWalkingUp`, `walkUpForTsconfig`, `findTsconfigInSubdirectories` — tsconfig discovery logic is now independently testable.
- 13 additional unit tests covering tsconfig discovery (walk-up from include dirs, CWD subdirectory scan), exclude patterns, complex return types (`Promise<User[]>`, `Record<string, number>`), and edge cases (errors, non-Error thrown values).
- 8 additional unit tests for formatters (`printErrors`, `printVerbose`, `printNormal`, `printSummary`, `printDryRun` with annotations, `printDryRun` with none, `printResults` quiet/verbose/normal).
- Fall-ignore comments for edge-case fallback paths.

### Changed

- **Major internal refactoring**: `loadSourceFiles()` reduced from 78 lines to 8 lines (orchestrator only); `annotate()` reduced from 89 lines to 33 lines.
- **`resolveTsconfigPath`** now returns `string | null` directly instead of a wrapper object.
- **`walkUpForGitignore`** simplified to return `string[]` instead of `{ patterns: string[]; found: boolean }`.
- **Health score improved from 76 (B) to 86 (A)** — 0 large functions and 0 high-complexity functions above threshold (was 9).
- **Documentation updated**: AGENTS.md reflects new code structure and health status; README.md clarifies programmatic API vs CLI-only options.
- **Package URLs** updated from standalone repo paths to monorepo paths.
- **Test file imports** cleaned up (removed unused `realpathSync` and `resolve`).

## [1.0.1] — 2026-05-31

### Added

- Auto-detect `tsconfig.json` from include directories when the default is not found at CWD (walks up from the scanned path).
- Auto-exclude `node_modules` from scans.
- Auto-exclude common build artifacts and dependency directories (`dist/`, `build/`, `out/`, `.next/`, `.cache/`, `.turbo/`, `coverage/`, `vendor/`, etc.).
- Auto-exclude hidden directories (`.git/`, `.husky/`, `.vscode/`, etc.).
- `.gitignore` support — reads the nearest `.gitignore` (walking up from the scanned path) and applies its exclusion patterns.

### Changed

- Default include patterns changed from `['src/**/*.ts', 'src/**/*.tsx']` to `['**/*.ts', '**/*.tsx']` — the tool now scans all `.ts/.tsx` files under CWD by default.
- Glob negation patterns (`!node_modules/**`, `!**/node_modules/**`, etc.) appended before passing to ts-morph, preventing it from ever loading ignored files — ~10x performance improvement.

### Fixed

- CLI now scans files when a directory is passed as a positional argument and `tsconfig.json` is not in CWD.
- `.gitignore` parsing silently failed with default glob include patterns (`**/*.ts`) — `statSync` on a glob always throws, skipping all include patterns. Fixed by falling back to CWD when no pattern resolves to a real path.
- File-level `.gitignore` patterns (e.g. `*.tsbuildinfo`, `*.log`) were stored but never matched against any file. Added `startsWith('*.')` detection to match by extension.

## [1.0.0] — 2026-05-31

### Added

- `-d` shorthand alias for the `--dry-run` flag.
- Automatic glob expansion when a directory is passed as input (e.g., `src/` automatically resolves to `src/**/*.{ts,tsx}`).

### Changed

- Enhanced `tsconfig.json` parsing validation to throw a clear, human-readable error instead of crashing if the config is malformed or invalid.
- Explicitly blocked `.js` and `.jsx` files. The tool will now cleanly reject JavaScript files, as it is strictly designed for TypeScript AST transformations.
- Massive internal refactoring to eliminate "Large function" complexity warnings, extracting core logic into streamlined, single-responsibility helper functions.
- Achieved **100% test coverage** across all branches, statements, functions, and lines.

## [0.1.0] — 2026-05-31

### Added

- Initial release.
- `annotate()` core library function to scan TypeScript source files and add missing return type annotations from JSDoc `@returns` tags.
- CLI with `commander` providing options: `--verbose`, `--quiet`, `--dry-run`, `--check`, `--json`, `--tsconfig`, `--include`, `--exclude`, `--backup`.
- Output formatters: normal, verbose, quiet, JSON, and dry-run preview modes.
- TypeScript AST manipulation via `ts-morph` with support for simple, generic, and complex return types (`Promise<T>`, `Record<K,V>`, etc.).
- File backup support (`--backup`) and save-to-disk on modification.
- Build pipeline with Vite (SSR mode) producing a standalone ESM CLI bundle.
- Unit tests with Vitest (6 tests across 2 test suites).
- CI-ready with `--check` and `--json` flags.
