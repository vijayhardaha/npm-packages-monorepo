/**
 * Tests for the run() orchestration function.
 *
 * Covers dry-run mode, the full submission pipeline with mocked utilities,
 * and all validation error paths (no next.config, no .next dir, no sitemap
 * config, missing key, missing sitemap).
 */

import { mkdtempSync, writeFileSync, rmSync, mkdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { run } from '../index.ts';

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  tmpDir = realpathSync(mkdtempSync(join(tmpdir(), 'indexnow-run-')));
  originalCwd = process.cwd();
  process.chdir(tmpDir);

  // Set up a default valid project structure
  writeFileSync(join(tmpDir, 'next.config.ts'), 'export default {}', 'utf-8');
  mkdirSync(join(tmpDir, '.next'), { recursive: true });
  writeFileSync(join(tmpDir, '.next', 'build-manifest.json'), '{}', 'utf-8');

  // next-sitemap config with variable reference
  writeFileSync(
    join(tmpDir, 'next-sitemap.config.ts'),
    [
      "const siteDomain = 'https://example.com';",
      'const config = {',
      '  siteUrl: siteDomain,',
      '};',
      'export default config;',
    ].join('\n'),
    'utf-8'
  );

  // Valid sitemap — ensure public/ dir exists
  mkdirSync(join(tmpDir, 'public'), { recursive: true });
  writeFileSync(
    join(tmpDir, 'public', 'sitemap.xml'),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url>',
      '    <loc>https://example.com/</loc>',
      '  </url>',
      '  <url>',
      '    <loc>https://example.com/about</loc>',
      '  </url>',
      '</urlset>',
    ].join('\n'),
    'utf-8'
  );

  // Set INDEXNOW_KEY env var
  process.env.INDEXNOW_KEY = 'test-api-key';

  // Mock fetch to succeed by default
  const mockResponse = { ok: true, text: async () => '' };
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  delete process.env.INDEXNOW_KEY;
});

// ---------------------------------------------------------------------------
// Dry-run
// ---------------------------------------------------------------------------

describe('run() — dry-run mode', () => {
  it('should return URLs found without submitting when dryRun is true', async () => {
    const result = await run({ dryRun: true });

    expect(result.urlsFound).toBe(2);
    expect(result.urlsSubmitted).toBe(0);
    expect(result.urlsFailed).toBe(0);
    expect(result.chunks).toHaveLength(0);

    // fetch should NOT be called in dry-run mode
    expect(fetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Full submission pipeline
// ---------------------------------------------------------------------------

describe('run() — full submission pipeline', () => {
  it('should submit all URLs in chunks and return aggregate results', async () => {
    // Use chunk size of 1 to test chunking
    const result = await run({ chunkSize: 1 });

    expect(result.urlsFound).toBe(2);
    expect(result.urlsSubmitted).toBe(2);
    expect(result.urlsFailed).toBe(0);
    expect(result.chunks).toHaveLength(2);

    // Both chunks should be successful
    for (const chunk of result.chunks) {
      expect(chunk.success).toBe(true);
      expect(chunk.count).toBe(1);
    }
  });

  it('should use --key option over INDEXNOW_KEY env var', async () => {
    const result = await run({ key: 'custom-key', chunkSize: 10 });

    expect(result.urlsSubmitted).toBe(2);

    // Verify fetch was called with the custom key
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('custom-key') })
    );
  });

  it('should use --site-url option over config value', async () => {
    const result = await run({ siteUrl: 'https://custom.example.com', chunkSize: 10 });

    expect(result.urlsSubmitted).toBe(2);

    // Verify fetch used the custom site URL's host
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('custom.example.com') })
    );
  });

  it('should invoke onProgress callback for each batch', async () => {
    const onProgress = vi.fn();

    await run({ chunkSize: 1, onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, { batch: 1, totalBatches: 2, urlCount: 1 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { batch: 2, totalBatches: 2, urlCount: 1 });
  });
});

// ---------------------------------------------------------------------------
// Validation error paths
// ---------------------------------------------------------------------------

describe('run() — validation errors', () => {
  it('should throw when not in a Next.js project', async () => {
    // Remove next.config.ts
    rmSync(join(tmpDir, 'next.config.ts'), { force: true });

    await expect(run()).rejects.toThrow('No next.config.* file found');
  });

  it('should throw when .next directory does not exist', async () => {
    rmSync(join(tmpDir, '.next'), { recursive: true, force: true });

    await expect(run()).rejects.toThrow('not found');
  });

  it('should throw when no next-sitemap.config exists', async () => {
    rmSync(join(tmpDir, 'next-sitemap.config.ts'), { force: true });

    await expect(run()).rejects.toThrow('No next-sitemap.config.* file found');
  });

  it('should throw when sitemap file does not exist', async () => {
    rmSync(join(tmpDir, 'public'), { recursive: true, force: true });

    await expect(run()).rejects.toThrow('not found');
  });

  it('should use default key when none is provided', async () => {
    delete process.env.INDEXNOW_KEY;

    const result = await run({ key: undefined, chunkSize: 10 });

    expect(result.urlsSubmitted).toBe(2);
  });

  it('should throw when sitemap config exists but has no siteUrl field', async () => {
    // Write a config file that exists but has no siteUrl
    rmSync(join(tmpDir, 'next-sitemap.config.ts'), { force: true });
    writeFileSync(
      join(tmpDir, 'next-sitemap.config.ts'),
      ['const config = {', "  someOtherField: 'value',", '};', 'export default config;'].join('\n'),
      'utf-8'
    );

    await expect(run()).rejects.toThrow('Could not parse "siteUrl"');
  });

  it('should throw when siteUrl validation fails via options', async () => {
    // Provide an invalid site URL via options to trigger the urlValidation check
    await expect(run({ siteUrl: 'invalid-url' })).rejects.toThrow('must start with http:// or https://');
  });

  it('should throw when sitemap file does not exist at custom path', async () => {
    await expect(run({ sitemap: '/nonexistent/sitemap.xml' })).rejects.toThrow('not found');
  });

  it('should handle ensureKeyFile failure when public/ is a file', async () => {
    // Replace public/ directory with a regular file so writing inside it fails
    rmSync(join(tmpDir, 'public'), { recursive: true, force: true });
    writeFileSync(join(tmpDir, 'public'), 'this is a file, not a directory', 'utf-8');

    await expect(run()).rejects.toThrow('Failed to create key file');
  });
});
