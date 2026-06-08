/**
 * Tests for the annotate() function and its internal helpers.
 *
 * Uses real temporary directories so ts-morph can read files from disk.
 * Covers all branches: missing tsconfig, no file matches, annotation
 * pipeline, dry-run, backup (including the silent-fail path), exclude
 * patterns, complex generic return types, JSDoc without `@returns`, and
 * the processSourceFile error-handling path.
 */

import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { annotate } from '../index.ts';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** Minimal valid tsconfig content for test projects. */
const TSCONFIG = JSON.stringify({ compilerOptions: { target: 'ESNext', module: 'ESNext', strict: true } }, null, 2);

/** A function with a `@returns` tag and no explicit return type — should be annotated. */
const GREET_SRC = [
  '/**',
  ' * Say hello.',
  ' * @returns {string}',
  ' */',
  'export function greet() {',
  "  return 'hello';",
  '}',
].join('\n');

/** A function that already has an explicit return type — should be skipped. */
const ALREADY_SRC = [
  '/**',
  ' * Already typed.',
  ' * @returns {number}',
  ' */',
  'export function already(): number {',
  '  return 42;',
  '}',
].join('\n');

/** A function with no JSDoc at all — should be skipped. */
const NO_JSDOC_SRC = ['export function noop() {', '  return true;', '}'].join('\n');

/** A function with JSDoc that has no `@returns` tag at all — skips the returnsTag branch. */
const JSDOC_NO_RETURNS_SRC = [
  '/**',
  ' * A helper with only a @param tag.',
  ' * @param {string} name - The name.',
  ' */',
  'export function sayHi(name: string) {',
  '  return `Hi ${name}`;',
  '}',
].join('\n');

/** A function whose `@returns` tag has no {Type} block — regex match fails and should be skipped. */
const NO_TYPE_IN_RETURNS_SRC = [
  '/**',
  ' * Returns something.',
  ' * @returns The value',
  ' */',
  'export function getValue() {',
  '  return 1;',
  '}',
].join('\n');

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'annotate-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/**
 * Writes a fixture file to the temporary directory and returns its path.
 *
 * @param {string} name - Filename relative to the temp directory.
 * @param {string} content - File content to write.
 *
 * @returns {string} Absolute path to the written file.
 */
function writeFixture(name: string, content: string): string {
  const path = join(tmpDir, name);
  writeFileSync(path, content, 'utf-8');
  return path;
}

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('annotate() — edge cases (missing configs)', () => {
  it('should return empty when tsconfig does not exist', async () => {
    const result = await annotate({ tsconfig: join(tmpDir, 'missing.json') });
    expect(result.filesProcessed).toBe(0);
    expect(result.filesUpdated).toBe(0);
    expect(result.filesFailed).toBe(0);
    expect(result.typesAnnotated).toBe(0);
    expect(result.files).toHaveLength(0);
  });

  it('should return empty when no files match the include patterns', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    const result = await annotate({
      tsconfig: join(tmpDir, 'tsconfig.json'),
      include: [join(tmpDir, 'nomatch/**/*.ts')],
    });
    expect(result.filesProcessed).toBe(0);
    expect(result.filesUpdated).toBe(0);
  });

  it('should throw if tsconfig is malformed', async () => {
    writeFixture('bad.json', '{ bad json }');
    await expect(annotate({ tsconfig: join(tmpDir, 'bad.json') })).rejects.toThrow(
      'Invalid or malformed tsconfig file'
    );
  });

  it('should throw if .js file is explicitly included', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    await expect(
      annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'foo.js')] })
    ).rejects.toThrow('Tool works with TypeScript (.ts, .tsx) files only.');
  });

  it('should throw if a .js file is matched by a glob (via allowJs)', async () => {
    writeFixture('tsconfig.json', JSON.stringify({ compilerOptions: { allowJs: true } }));
    writeFixture('test.js', 'function foo() {}');
    await expect(
      annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, '**/*.*')] })
    ).rejects.toThrow('Found JS file:');
  });

  it('should automatically append glob when a directory is passed in include', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    mkdirSync(join(tmpDir, 'mydir'), { recursive: true });
    writeFixture('mydir/test.ts', GREET_SRC);
    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'mydir')] });
    expect(result.filesProcessed).toBe(1);
  });

  it('should cleanly ignore globs or non-existent paths when trying to expand directories', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    const result = await annotate({
      tsconfig: join(tmpDir, 'tsconfig.json'),
      include: [join(tmpDir, 'nonexistent/**/*.ts')],
    });
    expect(result.filesProcessed).toBe(0);
  });
});

describe('annotate() — edge cases (invalid tags)', () => {
  it('should skip functions with JSDoc that has no @returns tag', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('noreturn.ts', JSDOC_NO_RETURNS_SRC);

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'noreturn.ts')] });

    expect(result.filesProcessed).toBe(1);
    expect(result.filesUpdated).toBe(0);
    expect(result.typesAnnotated).toBe(0);
  });

  it('should skip functions whose @returns tag has no {Type} block', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('notype.ts', NO_TYPE_IN_RETURNS_SRC);

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'notype.ts')] });

    expect(result.filesProcessed).toBe(1);
    expect(result.filesUpdated).toBe(0);
    expect(result.typesAnnotated).toBe(0);
  });
});

describe('annotate() — edge cases (errors)', () => {
  it('should record filesFailed and an error message when processing throws', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('greet.ts', GREET_SRC);

    // Mock SourceFile.save to throw so the catch branch in processSourceFile is exercised.
    const tsMorph = await import('ts-morph');
    vi.spyOn(tsMorph.SourceFile.prototype, 'save').mockRejectedValue(new Error('disk full'));

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'greet.ts')] });

    expect(result.filesFailed).toBe(1);
    expect(result.files[0].failed).toBe(true);
    expect(result.files[0].error).toBe('disk full');
  });

  it('should stringify non-Error thrown values in the error message', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('greet.ts', GREET_SRC);

    const tsMorph = await import('ts-morph');
    vi.spyOn(tsMorph.SourceFile.prototype, 'save').mockRejectedValue('string error');

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'greet.ts')] });

    expect(result.filesFailed).toBe(1);
    expect(result.files[0].error).toBe('string error');
  });
});

// ---------------------------------------------------------------------------
// Annotation pipeline
// ---------------------------------------------------------------------------

describe('annotate() — annotation pipeline', () => {
  it('should add return type from @returns tag', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('greet.ts', GREET_SRC);

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'greet.ts')] });

    expect(result.filesProcessed).toBe(1);
    expect(result.filesUpdated).toBe(1);
    expect(result.typesAnnotated).toBe(1);
    expect(result.files[0].annotations[0].name).toBe('greet');
    expect(result.files[0].annotations[0].returnType).toBe('string');

    const modified = readFileSync(join(tmpDir, 'greet.ts'), 'utf-8');
    expect(modified).toContain('greet(): string');
  });

  it('should skip already-annotated functions', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('already.ts', ALREADY_SRC);

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'already.ts')] });

    expect(result.filesProcessed).toBe(1);
    expect(result.filesUpdated).toBe(0);
    expect(result.typesAnnotated).toBe(0);
  });

  it('should skip functions without JSDoc', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('nojsdoc.ts', NO_JSDOC_SRC);

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'nojsdoc.ts')] });

    expect(result.filesProcessed).toBe(1);
    expect(result.filesUpdated).toBe(0);
    expect(result.typesAnnotated).toBe(0);
  });

  it('should process multiple files and aggregate counts correctly', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('greet.ts', GREET_SRC);
    writeFixture('already.ts', ALREADY_SRC);
    writeFixture('nojsdoc.ts', NO_JSDOC_SRC);

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, '*.ts')] });

    expect(result.filesProcessed).toBe(3);
    expect(result.filesUpdated).toBe(1);
    expect(result.typesAnnotated).toBe(1);
  });

  it('should invoke onProgress callback for each file', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('greet.ts', GREET_SRC);
    writeFixture('already.ts', ALREADY_SRC);
    writeFixture('nojsdoc.ts', NO_JSDOC_SRC);

    const onProgress = vi.fn();

    await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, '*.ts')], onProgress });

    expect(onProgress).toHaveBeenCalledTimes(3);

    // Each call should provide file, current, and total
    const calls = onProgress.mock.calls.map(([info]) => [info.current, info.total, info.file.split('/').pop()]);
    expect(calls).toEqual([
      [1, 3, 'already.ts'],
      [2, 3, 'greet.ts'],
      [3, 3, 'nojsdoc.ts'],
    ]);
  });
});

// ---------------------------------------------------------------------------
// Dry-run & backup
// ---------------------------------------------------------------------------

describe('annotate() — dry-run & backup', () => {
  it('should not modify files on disk in dry-run mode', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('greet.ts', GREET_SRC);
    const original = readFileSync(join(tmpDir, 'greet.ts'), 'utf-8');

    const result = await annotate({
      tsconfig: join(tmpDir, 'tsconfig.json'),
      include: [join(tmpDir, 'greet.ts')],
      dryRun: true,
    });

    expect(result.filesUpdated).toBe(1);
    const after = readFileSync(join(tmpDir, 'greet.ts'), 'utf-8');
    expect(after).toBe(original);
  });

  it('should create .bak files before modifying when backup is enabled', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('greet.ts', GREET_SRC);

    await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'greet.ts')], backup: true });

    const bakPath = join(tmpDir, 'greet.ts.bak');
    expect(existsSync(bakPath)).toBe(true);

    const bakContent = readFileSync(bakPath, 'utf-8');
    expect(bakContent).toContain('@returns {string}');
    expect(bakContent).not.toContain('greet(): string');
  });
});

// ---------------------------------------------------------------------------
// Tsconfig discovery (walk-up and subdirectory scanning)
// ---------------------------------------------------------------------------

describe('annotate() — tsconfig discovery', () => {
  let walkDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    walkDir = mkdtempSync(join(tmpdir(), 'annotate-walk-'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(walkDir, { recursive: true, force: true });
  });

  it('should find tsconfig by walking up from include directory', async () => {
    // Create subdir/ inside walkDir; put tsconfig at walkDir/ level
    const subDir = join(walkDir, 'subproject');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(walkDir, 'tsconfig.json'), TSCONFIG, 'utf-8');
    writeFileSync(join(subDir, 'greet.ts'), GREET_SRC, 'utf-8');

    // chdir to subDir so tsconfig.json resolves to a nonexistent path
    process.chdir(subDir);

    // Include the file with a relative path — code will resolve it, fail to
    // find tsconfig at CWD, then walk up to walkDir/ where tsconfig.json lives
    const result = await annotate({ include: ['greet.ts'] });

    expect(result.filesProcessed).toBe(1);
    expect(result.filesUpdated).toBe(1);
    expect(result.typesAnnotated).toBe(1);
  });

  it('should find tsconfig in subdirectory when using default includes', async () => {
    // chdir to walkDir so tsconfig.json resolves to a nonexistent path
    process.chdir(walkDir);

    // Create a subdirectory one level deep with its own tsconfig.json
    const appsDir = join(walkDir, 'apps');
    mkdirSync(appsDir, { recursive: true });
    writeFileSync(join(appsDir, 'tsconfig.json'), TSCONFIG, 'utf-8');
    writeFileSync(join(appsDir, 'greet.ts'), GREET_SRC, 'utf-8');

    // Default includes (no include option) -> scans CWD subdirectories for tsconfig
    const result = await annotate({});

    expect(result.filesProcessed).toBe(1);
    expect(result.filesUpdated).toBe(1);
    expect(result.typesAnnotated).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Exclude patterns & complex return types
// ---------------------------------------------------------------------------

describe('annotate() — exclude patterns', () => {
  it('should exclude files matching exclude patterns', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture('greet.ts', GREET_SRC);
    writeFixture('already.ts', ALREADY_SRC);

    const result = await annotate({
      tsconfig: join(tmpDir, 'tsconfig.json'),
      include: [join(tmpDir, '*.ts')],
      exclude: [join(tmpDir, 'greet.ts')],
    });

    expect(result.filesProcessed).toBe(1);
    expect(result.filesUpdated).toBe(0);
  });
});

describe('annotate() — complex types', () => {
  it('should handle Promise<User[]> return type', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture(
      'users.ts',
      [
        'interface User { id: number; }',
        '/**',
        ' * Get users.',
        ' * @returns {Promise<User[]>}',
        ' */',
        'export async function getUsers() {',
        '  return [];',
        '}',
      ].join('\n')
    );

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'users.ts')] });

    expect(result.filesUpdated).toBe(1);
    expect(result.files[0].annotations[0].returnType).toBe('Promise<User[]>');
    const modified = readFileSync(join(tmpDir, 'users.ts'), 'utf-8');
    expect(modified).toContain('getUsers(): Promise<User[]>');
  });

  it('should handle Record<string, number> return type', async () => {
    writeFixture('tsconfig.json', TSCONFIG);
    writeFixture(
      'data.ts',
      [
        '/**',
        ' * Get data.',
        ' * @returns {Record<string, number>}',
        ' */',
        'export function getData() {',
        '  return {};',
        '}',
      ].join('\n')
    );

    const result = await annotate({ tsconfig: join(tmpDir, 'tsconfig.json'), include: [join(tmpDir, 'data.ts')] });

    expect(result.filesUpdated).toBe(1);
    expect(result.files[0].annotations[0].returnType).toBe('Record<string, number>');
    const modified = readFileSync(join(tmpDir, 'data.ts'), 'utf-8');
    expect(modified).toContain('getData(): Record<string, number>');
  });
});
