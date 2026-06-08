# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] — 2026-06-08

### Added

- Initial release.
- CLI tool to read a Next.js sitemap XML file and submit URLs to the IndexNow API.
- Chunked URL submission (100 URLs per request) to avoid oversized payloads.
- Chunked URL submission with per-chunk status feedback.
- Build pipeline with Vite (SSR mode) producing a standalone ESM CLI bundle.
