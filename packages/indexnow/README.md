# @vijayhardaha/next-indexnow

CLI tool to validate a Next.js project and submit sitemap URLs to the IndexNow API for faster search engine indexing.

**Problem**: You have a Next.js site with a generated sitemap, but search engines take time to discover and index your new or updated pages.

**Solution**: `next-indexnow` validates your project environment, reads the sitemap XML, extracts all URLs, and submits them to the IndexNow API in batches — instantly notifying search engines about your content changes.

## Install

```bash
npm install @vijayhardaha/next-indexnow
# or
bun add @vijayhardaha/next-indexnow
```

## Usage

```bash
# Run from your Next.js project root — auto-detects settings from next-sitemap.config
npx next-indexnow

# Override the site URL
npx next-indexnow --site-url https://example.com

# Provide IndexNow API key
npx next-indexnow --key my-api-key

# Use a custom sitemap path
npx next-indexnow --sitemap ./public/sitemap.xml

# Preview URLs without submitting
npx next-indexnow --dry-run
```

The tool reads your sitemap, parses the URLs, and submits them to `https://api.indexnow.org/indexnow` in chunks.

## Options

| Option                  | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `--site-url <url>`      | Site URL (e.g. `https://example.com`). Overrides config value |
| `--key <key>`           | IndexNow API key. Falls back to `INDEXNOW_KEY` env variable   |
| `--sitemap <path>`      | Path to the sitemap XML file                                  |
| `--chunk-size <number>` | URLs per submission batch (default: 100)                      |
| `-d, --dry-run`         | Preview URLs without submitting to the IndexNow API           |
| `-h, --help`            | Show help                                                     |
| `--version`             | Show version                                                  |

## How It Works

1. **Validates** your Next.js project (`next.config.*` must exist)
2. **Checks** the `.next` build directory exists and is not empty
3. **Reads** `next-sitemap.config.*` to extract `siteUrl` and `outDir`
4. **Resolves** the API key from CLI option or `INDEXNOW_KEY` env variable
5. **Creates** the IndexNow verification file at `public/<key>.txt`
6. **Parses** all `<loc>` URLs from the sitemap XML
7. **Submits** URLs in batches (default 100) to the IndexNow API
8. **Reports** results with per-chunk success/failure details

### Environment Variables

| Variable       | Description      |
| -------------- | ---------------- |
| `INDEXNOW_KEY` | IndexNow API key |

## Programmatic API

```typescript
import { run } from "@vijayhardaha/next-indexnow";

const result = await run({
  siteUrl: "https://example.com",
  key: "my-api-key",
  dryRun: true // preview only
});

console.log(`Found ${result.urlsFound} URLs`);
```

### `NextIndexnowOptions`

| Option      | Type      | Default | Description                 |
| ----------- | --------- | ------- | --------------------------- |
| `siteUrl`   | `string`  | —       | Site URL (overrides config) |
| `key`       | `string`  | —       | IndexNow API key            |
| `sitemap`   | `string`  | —       | Custom sitemap path         |
| `chunkSize` | `number`  | `100`   | URLs per submission batch   |
| `dryRun`    | `boolean` | `false` | Preview without submitting  |

### `NextIndexnowResult`

```typescript
interface NextIndexnowResult {
  urlsFound: number; // Total URLs extracted from sitemap
  urlsSubmitted: number; // Successfully submitted URLs
  urlsFailed: number; // URLs that failed to submit
  chunks: SubmissionResult[];
  durationMs: number;
}
```

## Configuration

The tool reads your `next-sitemap.config.*` file to extract `siteUrl` and `outDir`. It supports both inline string literals and variable references:

```javascript
// next-sitemap.config.js — variable reference style
const siteDomain = "https://example.com";

/** @type {import('next-sitemap').IConfig} */
const config = { siteUrl: siteDomain, outDir: "./public" };

module.exports = config;
```

CLI `--site-url` option always takes precedence over the config file value.

## License

MIT &copy; [Vijay Hardaha](https://github.com/vijayhardaha)
