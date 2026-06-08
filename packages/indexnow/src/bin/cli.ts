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

import chalk from 'chalk';
import { Command } from 'commander';
import logSymbols from 'log-symbols';
import ora from 'ora';

import { DEFAULT_INDEXNOW_KEY } from '../constants.ts';
import { run } from '../index.ts';
import type { NextIndexnowResult, NextSitemapConfig } from '../types.ts';
import {
  validateNextProject,
  validateDotNext,
  validateNextSitemapConfig,
  readSitemapConfig,
  validateSiteUrl,
  ensureKeyFile,
  resolveSitemapPath,
  readSitemap,
} from '../utils.ts';

// ── ASCII Banner ───────────────────────────────────────────────────────

const BANNER = `
${chalk.white('██╗███╗   ██╗██████╗ ███████╗██╗  ██╗███╗   ██╗ ██████╗ ██╗    ██╗')}
${chalk.white('██║████╗  ██║██╔══██╗██╔════╝╚██╗██╔╝████╗  ██║██╔═══██╗██║    ██║')}
${chalk.white('██║██╔██╗ ██║██║  ██║█████╗   ╚███╔╝ ██╔██╗ ██║██║   ██║██║ █╗ ██║')}
${chalk.white('██║██║╚██╗██║██║  ██║██╔══╝   ██╔██╗ ██║╚██╗██║██║   ██║██║███╗██║')}
${chalk.white('██║██║ ╚████║██████╔╝███████╗██╔╝ ██╗██║ ╚████║╚██████╔╝╚███╔███╔╝')}
${chalk.white('╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚══╝╚══╝')}`;

const SEPARATOR = chalk.dim('='.repeat(69));

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Print a checkmark or error icon with a status label and optional detail.
 *
 * @param {boolean} valid - Whether the check passed.
 * @param {string} label - The status label text.
 * @param {string} [detail] - Optional detail text shown after a colon.
 */
function checkMark(valid: boolean, label: string, detail?: string): void {
  const icon = valid ? logSymbols.success : logSymbols.error;
  const msg = detail ? `${label}: ${detail}` : label;
  console.log(`${icon} ${msg}`);
}

/**
 * Print the summary footer message after a submission run.
 *
 * @param {NextIndexnowResult} result - The result from the IndexNow submission run.
 * @param {boolean} dryRun - Whether this was a dry-run preview.
 */
function printFooter(result: NextIndexnowResult, dryRun: boolean): void {
  console.log('');
  if (dryRun) {
    console.log(chalk.green(`Dry-run complete. ${result.urlsFound} urls would be submitted. 🚀`));
  } else if (result.urlsFailed === 0) {
    console.log(chalk.green(`All ${result.urlsSubmitted} urls submitted to IndexNow successfully! 🥳`));
  } else {
    console.log(
      chalk.yellow(
        `${result.urlsSubmitted}/${result.urlsFound} urls submitted successfully (${result.urlsFailed} failed).`
      )
    );
  }
}

/**
 * Print detailed failure information for failed submission batches.
 *
 * @param {NextIndexnowResult} result - The result from the IndexNow submission run.
 */
function printFailures(result: NextIndexnowResult): void {
  if (result.urlsFailed === 0) return;

  console.error(chalk.red.bold('Failed submissions:'));
  for (const chunk of result.chunks) {
    if (!chunk.success) {
      console.error(chalk.red(`    ${logSymbols.error} ${chunk.error}`));
    }
  }
}

// ── Ctrl+C handling ────────────────────────────────────────────────────

let spinner: ReturnType<typeof ora> | null = null;

process.on('SIGINT', () => {
  if (spinner?.isSpinning) {
    spinner.stop();
  }
  console.log('');
  console.log(chalk.yellow('Process aborted by user.'));
  process.exit(130);
});

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
  .option('--key <key>', 'IndexNow API key. Falls back to INDEXNOW_KEY environment variable or a built-in default key.')
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
 * Log submission results as checkmark-style lines.
 *
 * @param {NextIndexnowResult} result - The result from the IndexNow submission run.
 */
function displayResults(result: NextIndexnowResult): void {
  const duration = (result.durationMs / 1000).toFixed(2);

  const items = [
    ['URLs found', String(result.urlsFound), result.urlsFound > 0 ? ('blue' as const) : ('dim' as const)],
    ['URLs submitted', String(result.urlsSubmitted), result.urlsSubmitted > 0 ? ('green' as const) : ('dim' as const)],
    ['URLs failed', String(result.urlsFailed), result.urlsFailed > 0 ? ('red' as const) : ('dim' as const)],
    ['Duration', `${duration}s`, result.durationMs > 0 ? ('yellow' as const) : ('dim' as const)],
  ];

  console.log('');
  for (const [label, value, color] of items) {
    let coloredValue: string;
    switch (color) {
      case 'red':
        coloredValue = chalk.red(value);
        break;
      case 'dim':
        coloredValue = chalk.dim(value);
        break;
      case 'green':
        coloredValue = chalk.green(value);
        break;
      case 'blue':
        coloredValue = chalk.blue(value);
        break;
      case 'yellow':
        coloredValue = chalk.yellow(value);
        break;
      default:
        coloredValue = value;
        break;
    }
    console.log(`${logSymbols.success} ${chalk.bold(label)}: ${coloredValue}`);
  }
}

/**
 * Run validation checks and display checkmarks, returning parsed state.
 *
 * @param {object} opts - CLI options for site URL and API key.
 * @param {string} [opts.siteUrl] - Override site URL from --site-url option.
 * @param {string} [opts.key] - Override API key from --key option.
 *
 * @returns {{ parsedConfig: NextSitemapConfig; siteUrl: string; siteHost: string; key: string; keyLocation: string }} Resolved configuration values.
 */
function runValidationChecks(opts: { siteUrl?: string; key?: string }): {
  parsedConfig: NextSitemapConfig;
  siteUrl: string;
  siteHost: string;
  key: string;
  keyLocation: string;
} {
  // 1. Next.js project check
  const projectCheck = validateNextProject();
  if (!projectCheck.valid) {
    checkMark(false, 'Next.js project', projectCheck.error);
    console.log(chalk.red(`\n  ${projectCheck.error}`));
    process.exit(1);
  }
  checkMark(true, 'Next.js config found');

  // 2. Build directory check
  const dotNextCheck = validateDotNext();
  if (!dotNextCheck.valid) {
    checkMark(false, 'Build directory', dotNextCheck.error);
    console.log(chalk.red(`\n  ${dotNextCheck.error}`));
    process.exit(1);
  }
  checkMark(true, 'Build directory exists (.next)');

  // 3. Sitemap config check
  const sitemapConfigCheck = validateNextSitemapConfig();
  if (!sitemapConfigCheck.valid) {
    checkMark(false, 'Sitemap config', sitemapConfigCheck.error);
    console.log(chalk.red(`\n  ${sitemapConfigCheck.error}`));
    process.exit(1);
  }
  checkMark(true, 'Sitemap config found', sitemapConfigCheck.filePath);

  // 4. Parse sitemap config
  const parsedConfig = readSitemapConfig(sitemapConfigCheck.filePath!);
  if (!parsedConfig) {
    checkMark(false, 'Site URL', 'Could not parse siteUrl from config');
    console.log(chalk.red(`\n  Could not parse "siteUrl" from ${sitemapConfigCheck.filePath}.`));
    process.exit(1);
  }

  // 5. Validate site URL
  const siteUrl = opts.siteUrl ?? parsedConfig.siteUrl;
  const urlValidation = validateSiteUrl(siteUrl);
  if (!urlValidation.valid) {
    checkMark(false, 'Site URL', urlValidation.error);
    console.log(chalk.red(`\n  ${urlValidation.error}`));
    process.exit(1);
  }
  const siteHost = new URL(siteUrl).host;
  checkMark(true, 'Site URL resolved', siteHost);

  // 6. Resolve API key
  const key = opts.key ?? process.env.INDEXNOW_KEY ?? DEFAULT_INDEXNOW_KEY;
  if (opts.key) {
    checkMark(true, 'API key provided', 'via --key option');
  } else if (process.env.INDEXNOW_KEY) {
    checkMark(true, 'API key resolved', 'via INDEXNOW_KEY env');
  } else {
    checkMark(true, 'API key resolved', 'using built-in default key');
  }

  // 7. Ensure key file
  const keyFileCheck = ensureKeyFile(key);
  if (!keyFileCheck.valid) {
    checkMark(false, 'Key file', keyFileCheck.error);
    console.log(chalk.red(`\n  ${keyFileCheck.error}`));
    process.exit(1);
  }
  const keyFilePath = resolve(process.cwd(), 'public', `${key}.txt`);
  const keyExists = existsSync(keyFilePath);
  checkMark(true, 'Key verification file', keyExists ? `${key}.txt exists` : `${key}.txt created`);

  const keyLocation = `${siteUrl}/${key}.txt`;

  return { parsedConfig, siteUrl, siteHost, key, keyLocation };
}

/**
 * Read sitemap and display checkmark with URL count.
 *
 * @param {object} opts - CLI options for sitemap path.
 * @param {string} [opts.sitemap] - Custom sitemap path from --sitemap option.
 * @param {NextSitemapConfig} parsedConfig - Parsed sitemap config for default outDir.
 *
 * @returns {Promise<string[]>} The list of URLs extracted from the sitemap.
 */
async function loadSitemapCheck(opts: { sitemap?: string }, parsedConfig: NextSitemapConfig): Promise<string[]> {
  const sitemapPath = opts.sitemap ?? resolveSitemapPath(parsedConfig.outDir);

  const sitemapResult = await readSitemap(sitemapPath);
  if (!sitemapResult.valid) {
    checkMark(false, 'Sitemap', sitemapResult.error);
    console.log(chalk.red(`\n  ${sitemapResult.error}`));
    process.exit(1);
  }

  const urlCount = sitemapResult.urls!.length;
  checkMark(true, 'Sitemap loaded', `${urlCount} URLs found`);

  return sitemapResult.urls!;
}

/**
 * Main CLI entry point.
 *
 * Displays the ASCII banner, runs validation checks with checkmarks,
 * submits URLs to the IndexNow API, and shows results with a footer.
 */
export async function main(): Promise<void> {
  const opts = program.optsWithGlobals();

  // 1. Show banner + separator + version
  console.log(BANNER);
  console.log('');
  console.log(SEPARATOR);
  console.log(chalk.yellow(`next-indexnow: v${pkg.version}`));
  console.log(SEPARATOR);
  console.log('');

  // 2. Run validation checks with checkmarks
  const { parsedConfig } = runValidationChecks({ siteUrl: opts.siteUrl, key: opts.key });
  await loadSitemapCheck({ sitemap: opts.sitemap }, parsedConfig);

  console.log('');

  // 3. Submit URLs with progress spinner
  spinner = ora({ color: 'cyan', discardStdin: false });

  const result = await run({
    siteUrl: opts.siteUrl,
    key: opts.key,
    sitemap: opts.sitemap,
    chunkSize: opts.chunkSize,
    dryRun: opts.dryRun ?? false,
    onProgress: ({ batch, totalBatches, urlCount }) => {
      if (spinner) {
        spinner.text = `Submitting batch ${batch}/${totalBatches} (${urlCount} URLs)`;
        if (!spinner.isSpinning) {
          spinner.start();
        }
      }
    },
  });

  if (spinner?.isSpinning) {
    spinner.stop();
  }
  console.log(SEPARATOR);
  console.log(`${logSymbols.success} Submission Completed 🎉`);
  console.log(SEPARATOR);

  // 4. Show results
  displayResults(result);

  // 5. Show footer
  printFooter(result, opts.dryRun);

  // 6. Show failure details at end
  printFailures(result);

  // 7. Exit with appropriate code
  if (result.urlsFailed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
  process.exit(1);
});
