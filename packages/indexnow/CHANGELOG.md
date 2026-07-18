# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] — 2026-07-18

### Added

- **Sitemap index support**: Now reads `sitemap.xml` (sitemap index) by default, fetches all referenced sub-sitemaps via HTTP, and collects all URLs before submission.
- **Remote sub-sitemap fetching**: Added `fetchSitemapXml` helper for fetching remote sitemap XML files.
- **Graceful sub-sitemap failures**: Failed sub-sitemaps are skipped silently; URLs from successful sub-sitemaps are still collected and submitted.

### Changed

- **Default sitemap file**: Changed from `sitemap-0.xml` to `sitemap.xml` (standard Next.js sitemap index convention).
- **Updated tests**: Added 4 new tests covering sitemap index parsing, empty index, failed sub-sitemap fetching, and partial sub-sitemap failures.

## [1.0.0] — 2026-06-08

### Added

- Initial release.
- CLI tool to read a Next.js sitemap XML file and submit URLs to the IndexNow API.
- Chunked URL submission (100 URLs per request) to avoid oversized payloads.
- Chunked URL submission with per-chunk status feedback.
- Build pipeline with Vite (SSR mode) producing a standalone ESM CLI bundle.
- **ASCII banner**: INDEXNOW logo displayed in white on CLI startup.
- **Separator-wrapped version**: Version displayed as `next-indexnow: vX.X.X` in yellow, wrapped between `=====` separators for visual hierarchy.
- **`log-symbols` package**: All hardcoded `✓`/`✗` icons replaced with `logSymbols.success`/`logSymbols.error` for consistent cross-platform icon rendering.
- **Separator-wrapped completion heading**: `✔ Submission Completed 🎉` displayed between `=====` separators after submission completes — always shown (including during dry-run).
- **Footer emojis**: Success messages include emojis — `🥳` for successful submission, `🚀` for dry-run completion.
- **Color-coded summary values**: Display results now use semantic colors:
  - `URLs found`: blue when > 0, dim when 0
  - `URLs submitted`: green when > 0, dim when 0
  - `URLs failed`: red when > 0, dim when 0
  - `Duration`: yellow when > 0, dim when 0
- **JSDoc documentation**: Added JSDoc to all helper functions (`checkMark`, `printFooter`, `printFailures`, `displayResults`).
- **CLI Output section in README**: Full example output with sanitized paths documented in README.md.
- **AGENTS.md**: Comprehensive project documentation added.

### Changed

- **Spinner icon consistency**: `spinner.succeed()` replaced with `spinner.stop()` + manual `console.log()` using `logSymbols.success`, ensuring all checkmark icons come from the same source.
- **Version display**: `vX.X.X` (dim) → `next-indexnow: vX.X.X` (yellow) — includes tool name and brighter color.
- **ASCII banner color**: Changed from cyan to white for better readability.
- **Colon formatting**: `label : detail` → `label: detail` (space before colon removed, space after retained).
- **Spacing**: Removed indentation before checkmarks and footer messages (flush left).
- **Prose casing**: Footer messages use lowercase `urls` (e.g., `All 10 urls submitted`), while data labels use uppercase `URLs` (e.g., `✔ URLs found: 10`).
- **Label casing**: `Api key` → `API key`, `Urls` → `URLs` for correctness.
- **Color logic**: Nested ternary converted to a `switch` statement for improved readability and maintainability.
- **Dry-run heading**: Completion heading now shows even during dry-run (previously hidden because spinner never starts).

### Fixed

- **Missing dry-run heading**: When running with `--dry-run`, the spinner never spins, so the `if (spinner?.isSpinning)` guard skipped the completion heading entirely. Now always shows.
- **`printFailures` indent**: Removed extra indentation from failure messages for consistency.
