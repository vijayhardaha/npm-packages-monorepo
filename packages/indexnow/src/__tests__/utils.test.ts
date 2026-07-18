/**
 * Tests for the IndexNow utility functions.
 *
 * Covers all branches of validateSiteUrl, readSitemapConfig, ensureKeyFile,
 * resolveSitemapPath, readSitemap, and submitUrls. Filesystem-dependent
 * functions use real temp directories with chdir isolation.
 */

import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
} from '../utils.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  tmpDir = realpathSync(mkdtempSync(join(tmpdir(), 'indexnow-test-')));
  originalCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/**
 * Write a fixture file to the temp directory.
 *
 * @param {string} name - Relative file path.
 * @param {string} content - File content.
 *
 * @returns {string} Absolute path to the written file.
 */
function writeFixture(name: string, content: string): string {
  const path = resolve(tmpDir, name);
  const dir = join(path, '..');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, content, 'utf-8');
  return path;
}

// ---------------------------------------------------------------------------
// validateSiteUrl
// ---------------------------------------------------------------------------

describe('validateSiteUrl', () => {
  it('should accept a valid https URL', () => {
    expect(validateSiteUrl('https://example.com')).toEqual({ valid: true });
  });

  it('should accept a valid http URL', () => {
    expect(validateSiteUrl('http://example.com')).toEqual({ valid: true });
  });

  it('should accept a subdomain URL', () => {
    expect(validateSiteUrl('https://sub.example.com')).toEqual({ valid: true });
  });

  it('should accept localhost with port', () => {
    expect(validateSiteUrl('http://localhost:3000')).toEqual({ valid: true });
  });

  it('should reject an empty string', () => {
    const result = validateSiteUrl('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Site URL is required.');
  });

  it('should reject a URL without scheme', () => {
    const result = validateSiteUrl('example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must start with http:// or https://');
  });

  it('should reject a URL with a path', () => {
    const result = validateSiteUrl('https://example.com/path');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('domain root');
  });

  it('should reject a URL with query params', () => {
    const result = validateSiteUrl('https://example.com?q=1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('domain root');
  });

  it('should reject an invalid URL string (caught by missing scheme)', () => {
    const result = validateSiteUrl('not a url');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must start with http:// or https://');
  });

  it('should reject non-string input', () => {
    const result = validateSiteUrl(undefined as unknown as string);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Site URL is required.');
  });

  it('should reject a URL with invalid characters (catch branch)', () => {
    const result = validateSiteUrl('https://%%');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid URL');
  });
});

// ---------------------------------------------------------------------------
// validateNextProject
// ---------------------------------------------------------------------------

describe('validateNextProject', () => {
  it('should detect a Next.js project via next.config.ts', () => {
    writeFixture('next.config.ts', 'export default {}');
    expect(validateNextProject()).toEqual({ valid: true });
  });

  it('should detect a Next.js project via next.config.mjs', () => {
    writeFixture('next.config.mjs', 'export default {}');
    expect(validateNextProject()).toEqual({ valid: true });
  });

  it('should detect a Next.js project via next.config.js', () => {
    writeFixture('next.config.js', 'module.exports = {}');
    expect(validateNextProject()).toEqual({ valid: true });
  });

  it('should fail when no next.config file exists', () => {
    const result = validateNextProject();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No next.config.* file found');
  });
});

// ---------------------------------------------------------------------------
// validateDotNext
// ---------------------------------------------------------------------------

describe('validateDotNext', () => {
  it('should pass when .next exists and has files', () => {
    writeFixture('.next/build-manifest.json', '{}');
    expect(validateDotNext()).toEqual({ valid: true });
  });

  it('should fail when .next does not exist', () => {
    const result = validateDotNext();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should fail when .next is empty', () => {
    mkdirSync(join(tmpDir, '.next'), { recursive: true });
    const result = validateDotNext();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should fail when .next directory cannot be read', () => {
    // Create a file named .next (not a directory) so readdirSync throws ENOENT
    writeFileSync(join(tmpDir, '.next'), 'this is a file, not a directory', 'utf-8');

    const result = validateDotNext();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Cannot read');
  });
});

// ---------------------------------------------------------------------------
// validateNextSitemapConfig
// ---------------------------------------------------------------------------

describe('validateNextSitemapConfig', () => {
  it('should detect next-sitemap.config.ts', () => {
    writeFixture('next-sitemap.config.ts', 'export default {}');
    const result = validateNextSitemapConfig();
    expect(result.valid).toBe(true);
    expect(result.filePath).toBe(resolve(tmpDir, 'next-sitemap.config.ts'));
  });

  it('should detect next-sitemap.config.js', () => {
    writeFixture('next-sitemap.config.js', 'module.exports = {}');
    const result = validateNextSitemapConfig();
    expect(result.valid).toBe(true);
    expect(result.filePath).toBe(resolve(tmpDir, 'next-sitemap.config.js'));
  });

  it('should fail when config is empty', () => {
    writeFixture('next-sitemap.config.ts', '');
    const result = validateNextSitemapConfig();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exists but is empty');
  });

  it('should fail when no config file exists', () => {
    const result = validateNextSitemapConfig();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No next-sitemap.config.* file found');
  });
});

// ---------------------------------------------------------------------------
// readSitemapConfig
// ---------------------------------------------------------------------------

describe('readSitemapConfig', () => {
  it('should extract siteUrl from inline string literal', () => {
    const configPath = writeFixture(
      'next-sitemap.config.ts',
      ['const config = {', "  siteUrl: 'https://example.com',", '};', 'export default config;'].join('\n')
    );

    const result = readSitemapConfig(configPath);
    expect(result).toEqual({ siteUrl: 'https://example.com' });
  });

  it('should extract siteUrl from variable reference', () => {
    const configPath = writeFixture(
      'next-sitemap.config.js',
      [
        "const siteDomain = 'https://kabirdoheapi.vercel.app';",
        'const config = {',
        '  siteUrl: siteDomain,',
        '};',
        'module.exports = config;',
      ].join('\n')
    );

    const result = readSitemapConfig(configPath);
    expect(result).toEqual({ siteUrl: 'https://kabirdoheapi.vercel.app' });
  });

  it('should extract outDir when present (inline string)', () => {
    const configPath = writeFixture(
      'next-sitemap.config.ts',
      [
        'const config = {',
        "  siteUrl: 'https://example.com',",
        "  outDir: './custom-public',",
        '};',
        'export default config;',
      ].join('\n')
    );

    const result = readSitemapConfig(configPath);
    expect(result).toEqual({ siteUrl: 'https://example.com', outDir: './custom-public' });
  });

  it('should extract outDir from variable reference', () => {
    const configPath = writeFixture(
      'next-sitemap.config.ts',
      [
        "const outputDir = './dist/public';",
        'const config = {',
        "  siteUrl: 'https://example.com',",
        '  outDir: outputDir,',
        '};',
        'export default config;',
      ].join('\n')
    );

    const result = readSitemapConfig(configPath);
    expect(result).toEqual({ siteUrl: 'https://example.com', outDir: './dist/public' });
  });

  it('should return null when siteUrl cannot be parsed', () => {
    const configPath = writeFixture('next-sitemap.config.ts', 'export default {};');
    const result = readSitemapConfig(configPath);
    expect(result).toBeNull();
  });

  it('should return null for non-existent file', () => {
    const result = readSitemapConfig(join(tmpDir, 'nonexistent.ts'));
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ensureKeyFile
// ---------------------------------------------------------------------------

describe('ensureKeyFile', () => {
  it('should create the key file in public/ when it does not exist', () => {
    const result = ensureKeyFile('abc123');
    expect(result).toEqual({ valid: true });

    const keyFilePath = resolve(tmpDir, 'public', 'abc123.txt');
    expect(readFileSync(keyFilePath, 'utf-8').trim()).toBe('abc123');
  });

  it('should update the key file when content differs', () => {
    writeFixture('public/abc123.txt', 'wrong-content');
    const result = ensureKeyFile('abc123');
    expect(result).toEqual({ valid: true });

    const keyFilePath = resolve(tmpDir, 'public', 'abc123.txt');
    expect(readFileSync(keyFilePath, 'utf-8').trim()).toBe('abc123');
  });

  it('should leave the key file unchanged when content matches', () => {
    writeFixture('public/abc123.txt', 'abc123');
    const result = ensureKeyFile('abc123');
    expect(result).toEqual({ valid: true });

    const keyFilePath = resolve(tmpDir, 'public', 'abc123.txt');
    expect(readFileSync(keyFilePath, 'utf-8').trim()).toBe('abc123');
  });

  it('should reject empty keys', () => {
    const result = ensureKeyFile('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });
});

// ---------------------------------------------------------------------------
// resolveSitemapPath
// ---------------------------------------------------------------------------

describe('resolveSitemapPath', () => {
  it('should default to public/sitemap.xml', () => {
    const path = resolveSitemapPath();
    expect(path).toBe(resolve(tmpDir, 'public', 'sitemap.xml'));
  });

  it('should accept custom outDir', () => {
    const path = resolveSitemapPath('./custom');
    expect(path).toBe(resolve(tmpDir, 'custom', 'sitemap.xml'));
  });

  it('should accept custom sitemap filename', () => {
    const path = resolveSitemapPath('public', 'sitemap-0.xml');
    expect(path).toBe(resolve(tmpDir, 'public', 'sitemap-0.xml'));
  });
});

// ---------------------------------------------------------------------------
// readSitemap
// ---------------------------------------------------------------------------

describe('readSitemap', () => {
  const VALID_SITEMAP = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    '    <loc>https://example.com/</loc>',
    '  </url>',
    '  <url>',
    '    <loc>https://example.com/about</loc>',
    '  </url>',
    '  <url>',
    '    <loc>https://example.com/contact</loc>',
    '  </url>',
    '</urlset>',
  ].join('\n');

  it('should parse URLs from a valid sitemap', async () => {
    const sitemapPath = writeFixture('public/sitemap.xml', VALID_SITEMAP);
    const result = await readSitemap(sitemapPath);

    expect(result.valid).toBe(true);
    expect(result.urls).toEqual(['https://example.com/', 'https://example.com/about', 'https://example.com/contact']);
  });

  it('should fail when sitemap file does not exist', async () => {
    const result = await readSitemap(join(tmpDir, 'nonexistent.xml'));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should fail when sitemap XML is malformed', async () => {
    const sitemapPath = writeFixture('sitemap.xml', 'not xml');
    const result = await readSitemap(sitemapPath);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Failed to parse');
  });

  it('should fail when sitemap has no URLs', async () => {
    const emptySitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '</urlset>',
    ].join('\n');

    const sitemapPath = writeFixture('sitemap.xml', emptySitemap);
    const result = await readSitemap(sitemapPath);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No URLs found');
  });

  it('should parse sitemap index and fetch sub-sitemaps', async () => {
    const sitemapIndex = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <sitemap>',
      '    <loc>https://example.com/sitemap-0.xml</loc>',
      '  </sitemap>',
      '  <sitemap>',
      '    <loc>https://example.com/sitemap-1.xml</loc>',
      '  </sitemap>',
      '</sitemapindex>',
    ].join('\n');

    const sitemap0 = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url><loc>https://example.com/</loc></url>',
      '  <url><loc>https://example.com/about</loc></url>',
      '</urlset>',
    ].join('\n');

    const sitemap1 = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url><loc>https://example.com/contact</loc></url>',
      '</urlset>',
    ].join('\n');

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('sitemap-0.xml')) {
        return { ok: true, text: async () => sitemap0 } as Response;
      }
      if (urlStr.includes('sitemap-1.xml')) {
        return { ok: true, text: async () => sitemap1 } as Response;
      }
      return { ok: false, text: async () => 'Not found' } as Response;
    });

    const sitemapPath = writeFixture('public/sitemap.xml', sitemapIndex);
    const result = await readSitemap(sitemapPath);

    expect(result.valid).toBe(true);
    expect(result.urls).toEqual(['https://example.com/', 'https://example.com/about', 'https://example.com/contact']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should fail when sitemap index has no sub-sitemap URLs', async () => {
    const emptyIndex = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '</sitemapindex>',
    ].join('\n');

    const sitemapPath = writeFixture('public/sitemap.xml', emptyIndex);
    const result = await readSitemap(sitemapPath);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No sub-sitemap URLs found');
  });

  it('should fail when all sub-sitemaps fail to fetch', async () => {
    const sitemapIndex = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <sitemap>',
      '    <loc>https://example.com/sitemap-0.xml</loc>',
      '  </sitemap>',
      '</sitemapindex>',
    ].join('\n');

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const sitemapPath = writeFixture('public/sitemap.xml', sitemapIndex);
    const result = await readSitemap(sitemapPath);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No URLs found in any of the sub-sitemaps');
  });

  it('should skip failed sub-sitemaps and collect URLs from successful ones', async () => {
    const sitemapIndex = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <sitemap>',
      '    <loc>https://example.com/sitemap-0.xml</loc>',
      '  </sitemap>',
      '  <sitemap>',
      '    <loc>https://example.com/sitemap-1.xml</loc>',
      '  </sitemap>',
      '</sitemapindex>',
    ].join('\n');

    const sitemap0 = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url><loc>https://example.com/</loc></url>',
      '</urlset>',
    ].join('\n');

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('sitemap-0.xml')) {
        return { ok: true, text: async () => sitemap0 } as Response;
      }
      throw new Error('Network error');
    });

    const sitemapPath = writeFixture('public/sitemap.xml', sitemapIndex);
    const result = await readSitemap(sitemapPath);

    expect(result.valid).toBe(true);
    expect(result.urls).toEqual(['https://example.com/']);
  });
});

// ---------------------------------------------------------------------------
// submitUrls
// ---------------------------------------------------------------------------

describe('submitUrls', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return success when IndexNow API responds OK', async () => {
    const mockResponse = { ok: true, text: async () => '' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const result = await submitUrls('example.com', 'key123', 'https://example.com/key123.txt', [
      'https://example.com/',
    ]);

    expect(result).toEqual({ count: 1, success: true });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.indexnow.org/indexnow',
      expect.objectContaining({ method: 'POST', body: expect.stringContaining('example.com') })
    );
  });

  it('should return error when IndexNow API responds with failure', async () => {
    const mockResponse = { ok: false, text: async () => 'Bad request' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const result = await submitUrls('example.com', 'key123', 'https://example.com/key123.txt', [
      'https://example.com/',
    ]);

    expect(result).toEqual({ count: 1, success: false, error: 'Bad request' });
  });

  it('should return error on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await submitUrls('example.com', 'key123', 'https://example.com/key123.txt', [
      'https://example.com/',
    ]);

    expect(result).toEqual({ count: 1, success: false, error: 'Network error: ECONNREFUSED' });
  });
});
