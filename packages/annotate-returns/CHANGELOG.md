# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
