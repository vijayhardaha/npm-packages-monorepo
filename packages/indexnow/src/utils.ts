/**
 * Validation and helper functions for the IndexNow CLI.
 *
 * @module utils
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import xml2js from 'xml2js';

import {
  INDEXNOW_API_URL,
  NEXT_CONFIG_FILES,
  NEXT_SITEMAP_CONFIG_FILES,
  NEXT_BUILD_DIRS,
  KEY_FILE_EXTENSION,
  DEFAULT_SITEMAP_DIR,
  DEFAULT_SITEMAP_FILE,
} from './constants.ts';
import type { NextSitemapConfig, ValidationResult, SubmissionResult } from './types.ts';

/**
 * Validate that a URL string is a valid site domain with http:// or https:// scheme.
 *
 * Accepts standard domains (example.com), subdomains, and localhost with ports.
 *
 * @param {string} url - The URL string to validate.
 *
 * @returns {ValidationResult} Valid result on success, or invalid with an error message.
 */
export function validateSiteUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Site URL is required.' };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { valid: false, error: 'Site URL must start with http:// or https://' };
  }

  try {
    const parsed = new URL(url);

    /* v8 ignore next 3 */
    if (!parsed.hostname) {
      return { valid: false, error: 'Site URL must have a valid hostname.' };
    }

    // Reject URLs with path, query, or fragment beyond a single trailing slash
    /* v8 ignore next 2 */
    if ((parsed.pathname !== '/' && parsed.pathname !== '') || parsed.search || parsed.hash) {
      return { valid: false, error: 'Site URL should be a domain root (e.g. https://example.com).' };
    }
  } catch {
    return { valid: false, error: `Invalid URL: "${url}". Please provide a valid URL.` };
  }

  return { valid: true };
}

/**
 * Check if the current working directory is a Next.js project by looking for
 * a next.config.* file.
 *
 * @returns {ValidationResult} Valid result if a Next.js config file is found.
 */
export function validateNextProject(): ValidationResult {
  for (const configFile of NEXT_CONFIG_FILES) {
    if (existsSync(resolve(process.cwd(), configFile))) {
      return { valid: true };
    }
  }

  return { valid: false, error: 'No next.config.* file found. This command must be run from a Next.js project root.' };
}

/**
 * Check if the `.next` build directory exists and contains files.
 *
 * @returns {ValidationResult} Valid result if `.next` exists and is not empty.
 */
export function validateDotNext(): ValidationResult {
  for (const dir of NEXT_BUILD_DIRS) {
    const dotNextPath = resolve(process.cwd(), dir);

    if (!existsSync(dotNextPath)) {
      return { valid: false, error: `"${dir}" directory not found. Run "next build" first.` };
    }

    try {
      const entries = readdirSync(dotNextPath);
      if (entries.length === 0) {
        return { valid: false, error: `"${dir}" directory is empty. Run "next build" first.` };
      }
    } catch {
      /* v8 ignore next */
      return { valid: false, error: `Cannot read "${dir}" directory.` };
    }
  }

  return { valid: true };
}

/**
 * Check if a next-sitemap config file exists and is not empty.
 *
 * Searches for next-sitemap.config.{ts,mjs,cjs,js} in the current directory.
 *
 * @returns {ValidationResult & { filePath?: string }} Valid result with the config file path if found.
 */
export function validateNextSitemapConfig(): ValidationResult & { filePath?: string } {
  for (const configFile of NEXT_SITEMAP_CONFIG_FILES) {
    const configPath = resolve(process.cwd(), configFile);

    if (existsSync(configPath)) {
      const content = readFileSync(configPath, 'utf-8').trim();

      if (content.length === 0) {
        return { valid: false, error: `"${configFile}" exists but is empty.` };
      }

      return { valid: true, filePath: configPath };
    }
  }

  return { valid: false, error: 'No next-sitemap.config.* file found. Create one to configure your sitemap.' };
}

/**
 * Read the next-sitemap config file and extract the `siteUrl` and optional `outDir`.
 *
 * Parses the file to extract `siteUrl` from the config object, handling both
 * inline string literals (`siteUrl: 'https://...'`) and variable references
 * (`const siteDomain = 'https://...'; siteUrl: siteDomain`). Avoids the
 * complexity of dynamic module loading for mixed CJS/ESM configs.
 *
 * @param {string} configPath - Absolute path to the next-sitemap config file.
 *
 * @returns {NextSitemapConfig | null} Parsed config, or null if siteUrl could not be extracted.
 */
export function readSitemapConfig(configPath: string): NextSitemapConfig | null {
  try {
    const content = readFileSync(configPath, 'utf-8');

    // Build a map of const variable names to their string literal values
    const constMap = new Map<string, string>();
    for (const match of content.matchAll(/const\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g)) {
      constMap.set(match[1]!, match[2]!);
    }

    // Try inline string literal first, then variable reference lookup
    const siteUrlMatch = content.match(/siteUrl:\s*['"]([^'"]+)['"]/);
    const siteUrlVarMatch = content.match(/siteUrl:\s*(\w+)/);

    const siteUrl = siteUrlMatch?.[1] ?? (siteUrlVarMatch?.[1] ? constMap.get(siteUrlVarMatch[1]) : undefined);

    if (!siteUrl) {
      return null;
    }

    // Extract optional outDir value (inline string literal or variable)
    const outDirMatch = content.match(/outDir:\s*['"]([^'"]+)['"]/);
    const outDirVarMatch = content.match(/outDir:\s*(\w+)/);
    const outDir = outDirMatch?.[1] ?? (outDirVarMatch?.[1] ? constMap.get(outDirVarMatch[1]) : undefined);

    return { siteUrl, outDir };
  } catch {
    return null;
  }
}

/**
 * Ensure the IndexNow verification key file exists at public/<key>.txt with the
 * correct content. Creates the file and directory if they don't exist.
 *
 * @param {string} key - The IndexNow API key.
 *
 * @returns {ValidationResult} Valid result if the key file exists or was created successfully.
 */
export function ensureKeyFile(key: string): ValidationResult {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'IndexNow API key is required.' };
  }

  const publicDir = resolve(process.cwd(), DEFAULT_SITEMAP_DIR);
  const keyFilePath = resolve(publicDir, `${key}${KEY_FILE_EXTENSION}`);

  try {
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    if (existsSync(keyFilePath)) {
      const existingContent = readFileSync(keyFilePath, 'utf-8').trim();

      if (existingContent !== key) {
        writeFileSync(keyFilePath, key, 'utf-8');
      }
    } else {
      writeFileSync(keyFilePath, key, 'utf-8');
    }

    return { valid: true };
  } catch (error) {
    /* v8 ignore next 3 */
    return {
      valid: false,
      error: `Failed to create key file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Resolve the sitemap file path.
 *
 * Uses the configured outDir (from next-sitemap.config) or falls back to
 * the default `public/` directory.
 *
 * @param {string}  [outDir]    - Custom output directory from next-sitemap config.
 * @param {string}  [sitemapFile] - Custom sitemap filename. Defaults to sitemap-0.xml.
 *
 * @returns {string} Absolute path to the sitemap file.
 */
export function resolveSitemapPath(outDir?: string, sitemapFile?: string): string {
  const dir = outDir ?? DEFAULT_SITEMAP_DIR;
  const file = sitemapFile ?? DEFAULT_SITEMAP_FILE;
  return resolve(process.cwd(), dir, file);
}

/**
 * Read and parse a sitemap XML file, extracting all `<loc>` URLs.
 *
 * @param {string} sitemapPath - Absolute path to the sitemap XML file.
 *
 * @returns {Promise<ValidationResult & { urls?: string[] }>} Valid result with URL list, or invalid with error.
 */
export async function readSitemap(sitemapPath: string): Promise<ValidationResult & { urls?: string[] }> {
  let content: string;

  try {
    content = await readFileSync(sitemapPath, 'utf-8');
  } catch {
    return { valid: false, error: `Sitemap file not found: ${sitemapPath}` };
  }

  let parsed: { urlset?: { url?: Array<{ loc?: string[] }> } };

  try {
    parsed = await xml2js.parseStringPromise(content);
  } catch {
    return { valid: false, error: 'Failed to parse sitemap XML. Ensure the file is valid XML.' };
  }

  const urls = parsed.urlset?.url?.map((entry) => entry.loc?.[0]).filter(Boolean) as string[] | undefined;

  if (!urls || urls.length === 0) {
    return { valid: false, error: 'No URLs found in the sitemap.' };
  }

  return { valid: true, urls };
}

/**
 * Submit a batch of URLs to the IndexNow API.
 *
 * @param {string}   host      - The site hostname (e.g. example.com).
 * @param {string}   key       - The IndexNow API key.
 * @param {string}   keyLocation - Public URL of the key verification file.
 * @param {string[]} urlList   - URLs to submit in this batch.
 *
 * @returns {Promise<SubmissionResult>} The submission result for this batch.
 */
export async function submitUrls(
  host: string,
  key: string,
  keyLocation: string,
  urlList: string[]
): Promise<SubmissionResult> {
  try {
    const response = await fetch(INDEXNOW_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, key, keyLocation, urlList }),
    });

    if (response.ok) {
      return { count: urlList.length, success: true };
    }

    const errorText = await response.text();
    return { count: urlList.length, success: false, error: errorText };
  } catch (error) {
    /* v8 ignore next 4 */
    return {
      count: urlList.length,
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
