/**
 * Core orchestration for the IndexNow CLI tool.
 *
 * Coordinates validation, sitemap parsing, and URL submission to the
 * IndexNow API for faster search engine indexing.
 *
 * @module next-indexnow
 */

import { CHUNK_SIZE } from './constants.ts';
import type { NextIndexnowOptions, NextIndexnowResult, NextSitemapConfig, SubmissionResult } from './types.ts';
import {
  validateSiteUrl,
  validateNextProject,
  validateDotNext,
  validateNextSitemapConfig,
  readSitemapConfig,
  ensureKeyFile,
  resolveSitemapPath,
  readSitemap,
  submitUrls,
} from './utils.ts';

/**
 * Validate basic project structure: Next.js project and .next build directory.
 *
 * @throws {Error} If the project is not a Next.js project or .next is missing/empty.
 */
function validateBasicEnvironment(): void {
  const projectCheck = validateNextProject();
  if (!projectCheck.valid) {
    throw new Error(projectCheck.error);
  }

  const dotNextCheck = validateDotNext();
  if (!dotNextCheck.valid) {
    throw new Error(dotNextCheck.error);
  }
}

/**
 * Validate that a sitemap config file exists and parse its contents.
 *
 * @returns {NextSitemapConfig} The parsed sitemap config (siteUrl + optional outDir).
 *
 * @throws {Error} If no config file is found, it is empty, or siteUrl cannot be parsed.
 */
function validateSitemapSetup(): NextSitemapConfig {
  const sitemapConfigCheck = validateNextSitemapConfig();
  if (!sitemapConfigCheck.valid) {
    throw new Error(sitemapConfigCheck.error!);
  }

  const parsedConfig = readSitemapConfig(sitemapConfigCheck.filePath!);
  if (!parsedConfig) {
    throw new Error(`Could not parse "siteUrl" from ${sitemapConfigCheck.filePath}.`);
  }

  return parsedConfig;
}

/**
 * Validate that the current directory is a Next.js project with a build
 * artifact and a sitemap config file.
 *
 * @returns {NextSitemapConfig} The parsed sitemap config (siteUrl + optional outDir).
 *
 * @throws {Error} If any validation check fails.
 */
function validateEnvironment(): NextSitemapConfig {
  validateBasicEnvironment();
  return validateSitemapSetup();
}

/**
 * Resolve the effective siteUrl from options (takes precedence) or config file,
 * validate it, and extract the hostname.
 *
 * @param {NextIndexnowOptions} options      - CLI options.
 * @param {NextSitemapConfig}   parsedConfig - Parsed sitemap config.
 *
 * @returns {{ siteUrl: string; siteHost: string }} The resolved site URL and host.
 *
 * @throws {Error} If the site URL is invalid.
 */
function resolveSiteConfig(
  options: NextIndexnowOptions,
  parsedConfig: NextSitemapConfig
): { siteUrl: string; siteHost: string } {
  const siteUrl = options.siteUrl ?? parsedConfig.siteUrl;

  const urlValidation = validateSiteUrl(siteUrl);
  if (!urlValidation.valid) {
    throw new Error(urlValidation.error);
  }

  return { siteUrl, siteHost: new URL(siteUrl).host };
}

/**
 * Resolve the IndexNow API key from options or the INDEXNOW_KEY env var,
 * and ensure the verification key file exists on disk.
 *
 * @param {NextIndexnowOptions} options - CLI options.
 * @param {string}              siteUrl - The resolved site URL (for keyLocation).
 *
 * @returns {{ key: string; keyLocation: string }} The resolved key and its public URL.
 *
 * @throws {Error} If no key is provided or the key file cannot be created.
 */
function resolveKeyValue(options: NextIndexnowOptions, siteUrl: string): { key: string; keyLocation: string } {
  const key = options.key ?? process.env.INDEXNOW_KEY;

  if (!key) {
    throw new Error('IndexNow API key is required. Provide it via --key option or INDEXNOW_KEY environment variable.');
  }

  const keyFileCheck = ensureKeyFile(key);
  if (!keyFileCheck.valid) {
    throw new Error(keyFileCheck.error);
  }

  return { key, keyLocation: `${siteUrl}/${key}.txt` };
}

/**
 * Resolve the sitemap path (from options or default) and read all URLs.
 *
 * @param {NextIndexnowOptions} options      - CLI options.
 * @param {NextSitemapConfig}   parsedConfig - Parsed sitemap config (for outDir).
 *
 * @returns {Promise<string[]>} The list of URLs found in the sitemap.
 *
 * @throws {Error} If the sitemap cannot be read or contains no URLs.
 */
async function loadSitemapUrls(options: NextIndexnowOptions, parsedConfig: NextSitemapConfig): Promise<string[]> {
  const sitemapPath = options.sitemap ?? resolveSitemapPath(parsedConfig.outDir);

  const sitemapResult = await readSitemap(sitemapPath);
  if (!sitemapResult.valid) {
    throw new Error(sitemapResult.error!);
  }

  return sitemapResult.urls!;
}

/**
 * Submit all URLs to the IndexNow API in chunks and aggregate the results.
 *
 * @param {string[]} urls        - All URLs to submit.
 * @param {string}   siteHost    - The site hostname.
 * @param {string}   key         - The IndexNow API key.
 * @param {string}   keyLocation - Public URL of the key verification file.
 * @param {number}   chunkSize   - Maximum URLs per submission batch.
 *
 * @returns {Promise<Pick<NextIndexnowResult, 'urlsSubmitted' | 'urlsFailed' | 'chunks'>>} Aggregate submission counts and per-chunk details.
 */
async function submitAllUrls(
  urls: string[],
  siteHost: string,
  key: string,
  keyLocation: string,
  chunkSize: number
): Promise<Pick<NextIndexnowResult, 'urlsSubmitted' | 'urlsFailed' | 'chunks'>> {
  const chunks: SubmissionResult[] = [];

  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize);
    const result = await submitUrls(siteHost, key, keyLocation, chunk);
    chunks.push(result);
  }

  const urlsSubmitted = chunks.filter((c) => c.success).reduce((sum, c) => sum + c.count, 0);
  const urlsFailed = chunks.filter((c) => !c.success).reduce((sum, c) => sum + c.count, 0);

  return { urlsSubmitted, urlsFailed, chunks };
}

/**
 * Run the IndexNow submission process.
 *
 * Validates the environment (Next.js project, .next dir, sitemap config),
 * reads the sitemap, and submits all URLs to the IndexNow API in chunks.
 *
 * @param {NextIndexnowOptions} options - CLI options (siteUrl, key, sitemap, chunkSize, dryRun).
 *
 * @returns {Promise<NextIndexnowResult>} Aggregate result with per-chunk details.
 */
export async function run(options: NextIndexnowOptions = {}): Promise<NextIndexnowResult> {
  const startTime = Date.now();
  const chunkSize = options.chunkSize ?? CHUNK_SIZE;

  // 1. Validate environment & parse sitemap config
  const parsedConfig = validateEnvironment();

  // 2. Resolve siteUrl & key
  const { siteUrl, siteHost } = resolveSiteConfig(options, parsedConfig);
  const { key, keyLocation } = resolveKeyValue(options, siteUrl);

  // 3. Read sitemap
  const urls = await loadSitemapUrls(options, parsedConfig);

  // 4. Dry-run short-circuit
  if (options.dryRun) {
    return { urlsFound: urls.length, urlsSubmitted: 0, urlsFailed: 0, chunks: [], durationMs: Date.now() - startTime };
  }

  // 5. Submit URLs in chunks
  const { urlsSubmitted, urlsFailed, chunks } = await submitAllUrls(urls, siteHost, key, keyLocation, chunkSize);

  return { urlsFound: urls.length, urlsSubmitted, urlsFailed, chunks, durationMs: Date.now() - startTime };
}
