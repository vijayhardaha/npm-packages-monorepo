#!/usr/bin/env node

/**
 * next-indexnow — CLI entry point.
 *
 * Parses command-line arguments with commander, validates the environment,
 * reads the Next.js sitemap, and submits URLs to the IndexNow API.
 *
 * @module cli
 *
 * Usage:
 *   next-indexnow
 *   next-indexnow --site-url https://example.com
 *   next-indexnow --key my-api-key
 *   next-indexnow --sitemap ./public/sitemap-0.xml
 *   next-indexnow --dry-run
 *   next-indexnow --help
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Command } from 'commander';

import { run } from '../index.ts';
import type { NextIndexnowResult } from '../types.ts';

const __filename = fileURLToPath(import.meta.url);
const pkgPathSrc = resolve(__filename, '..', '..', '..', 'package.json');
const pkgPathDist = resolve(__filename, '..', '..', 'package.json');
const pkgPath = existsSync(pkgPathDist) ? pkgPathDist : pkgPathSrc;

// Read version from package.json
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };

const program = new Command();

program
  .name('next-indexnow')
  .description('Submit Next.js sitemap URLs to the IndexNow API for faster search engine indexing')
  .version(pkg.version)
  .option('--site-url <url>', 'The site URL (e.g. https://example.com). Overrides next-sitemap.config value.')
  .option('--key <key>', 'IndexNow API key. Falls back to INDEXNOW_KEY environment variable.')
  .option('--sitemap <path>', 'Path to the sitemap XML file')
  .option('--chunk-size <number>', 'URLs per submission batch', (v) => Number.parseInt(v, 10), 100)
  .option('-d, --dry-run', 'Preview URLs without submitting to the IndexNow API')
  .addHelpText(
    'after',
    `
Examples:
  $ next-indexnow                            Submit URLs using settings from next-sitemap.config
  $ next-indexnow --site-url https://example.com  Override the site URL
  $ next-indexnow --key my-api-key           Provide IndexNow API key
  $ next-indexnow --sitemap ./public/sitemap.xml  Use a custom sitemap path
  $ next-indexnow --dry-run                  Preview URLs without submitting
  $ next-indexnow --help                     Show this help message
    `
  )
  .parse(process.argv);

/**
 * Display the submission results in a formatted table.
 *
 * @param {NextIndexnowResult} result - The result from the IndexNow submission run.
 */
function displayResults(result: NextIndexnowResult): void {
  const duration = (result.durationMs / 1000).toFixed(2);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 INDEXNOW SUBMISSION RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`URLs found         : ${result.urlsFound}`);
  console.log(`URLs submitted      : ${result.urlsSubmitted}`);
  console.log(`URLs failed         : ${result.urlsFailed}`);
  console.log(`Duration            : ${duration}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

/**
 * Print per-chunk errors and exit with code 1 if any submissions failed.
 *
 * @param {NextIndexnowResult} result - The result from the IndexNow submission run.
 */
function handleFailures(result: NextIndexnowResult): void {
  if (result.urlsFailed === 0) return;

  console.error('Some submissions failed:');
  for (const chunk of result.chunks) {
    if (!chunk.success) {
      console.error(`  ✗ ${chunk.error}`);
    }
  }
  process.exit(1);
}

/**
 * Main CLI entry point.
 *
 * Reads parsed commander options, invokes the IndexNow submission
 * library, and displays results.
 */
export async function main(): Promise<void> {
  const opts = program.optsWithGlobals();

  const result = await run({
    siteUrl: opts.siteUrl,
    key: opts.key,
    sitemap: opts.sitemap,
    chunkSize: opts.chunkSize,
    dryRun: opts.dryRun ?? false,
  });

  displayResults(result);
  handleFailures(result);
}

main().catch((error) => {
  console.error('Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
