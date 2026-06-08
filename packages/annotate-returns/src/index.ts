/**
 * CLI tool that adds missing TypeScript return type annotations by reading
 * `@returns {Type}` JSDoc tags and applying them as explicit return types.
 *
 * @module annotate-returns
 */

import { copyFileSync, existsSync, statSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

import { Project, SyntaxKind, type SourceFile, type FunctionDeclaration } from 'ts-morph';

import type { AnnotateOptions, AnnotateResult, Annotation, FileResult, AnnotateProgress } from './types.ts';

/**
 * Create a `.bak` copy of a file before modification.
 *
 * Silently skips if the source file does not exist or if the copy fails.
 *
 * @param {string} filePath - Absolute path to the file to back up.
 */
function backupFile(filePath: string): void {
  const bakPath = `${filePath}.bak`;

  try {
    copyFileSync(filePath, bakPath);
  } catch {
    // File does not exist or cannot be copied; skip silently.
  }
}

/**
 * Create a ts-morph Project instance configured for scanning.
 *
 * @param {string} tsconfigPath - Resolved absolute path to the tsconfig.json.
 *
 * @returns {Project} A configured Project instance for scanning.
 *
 * @throws {Error} If the tsconfig file is invalid or malformed.
 */
function createProject(tsconfigPath: string): Project {
  try {
    return new Project({ tsConfigFilePath: tsconfigPath, skipAddingFilesFromTsConfig: true });
  } catch {
    throw new Error(`Invalid or malformed tsconfig file: ${tsconfigPath}`);
  }
}

/**
 * Directories automatically excluded from scanning regardless of include patterns.
 */
const IGNORE_DIRS = new Set([
  '.cache',
  '.git',
  '.hg',
  '.next',
  '.nyc_output',
  '.pnp',
  '.svelte-kit',
  '.svn',
  '.turbo',
  '.vitest',
  '.yarn',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'vendor',
]);

/**
 * Parse a `.gitignore` file into path-substring patterns for exclusion.
 *
 * Only handles basic directory/file patterns — comments, empty lines, and
 * negation lines are skipped. Trailing slashes (gitignore dir convention)
 * are stripped. Glob patterns (`*`, `?`) are converted to match against the
 * full file path.
 *
 * @param {string} dir - Directory to look for `.gitignore` in.
 *
 * @returns {string[]} List of path substrings to check against file paths.
 */
function parseGitignore(dir: string): string[] {
  const gitignorePath = join(dir, '.gitignore');
  try {
    const content = readFileSync(gitignorePath, 'utf-8');
    const patterns: string[] = [];

    for (const line of content.split('\n')) {
      const raw = line.trim();
      if (!raw || raw.startsWith('#')) continue;

      // Negation patterns would require re-including files — skip for simplicity.
      if (raw.startsWith('!')) continue;

      // Strip trailing slash (gitignore convention for directory-only rules)
      const stripped = raw.endsWith('/') ? raw.slice(0, -1) : raw;

      // For glob-free patterns, match as a path segment (e.g. `dist` matches `/dist/`)
      if (!stripped.includes('*') && !stripped.includes('?') && !stripped.includes('[')) {
        patterns.push(stripped);
      } else {
        // Keep the raw pattern for glob-based matching
        patterns.push(stripped);
      }
    }

    return patterns;
  } catch {
    return [];
  }
}

/**
 * Check if a file path should be ignored based on built-in rules and
 * parsed `.gitignore` patterns.
 *
 * @param {string}   filePath         - Absolute file path to check.
 * @param {string[]} gitignorePatterns - Patterns parsed from `.gitignore`.
 *
 * @returns {boolean} True if the file should be excluded from processing.
 */
function isIgnored(filePath: string, gitignorePatterns: string[]): boolean {
  // Built-in ignore directories
  for (const dir of IGNORE_DIRS) {
    if (filePath.includes(`/${dir}/`) || filePath.endsWith(`/${dir}`)) return true;
  }

  // .gitignore patterns
  for (const pattern of gitignorePatterns) {
    if (filePath.includes(`/${pattern}/`)) return true;
    if (filePath.endsWith(`/${pattern}`)) return true;
    if (filePath.endsWith(`/${pattern}.ts`) || filePath.endsWith(`/${pattern}.tsx`)) return true;
    // Handle file-level globs like *.tsbuildinfo, *.log
    if (pattern.startsWith('*.') && filePath.endsWith(pattern.slice(1))) return true;
  }

  return false;
}

/**
 * Resolve include patterns by expanding directories and appending ts-morph
 * negation patterns for built-in ignore directories.
 *
 * @param {string[]} include - Raw include patterns from options.
 *
 * @returns {string[]} Glob patterns ready for ts-morph.
 *
 * @throws {Error} If a .js/.jsx file is explicitly included.
 */
function resolveIncludeGlobs(include: string[]): string[] {
  const tsIncludes = include.map((pattern) => {
    if (pattern.endsWith('.js') || pattern.endsWith('.jsx')) {
      throw new Error(`Tool works with TypeScript (.ts, .tsx) files only. Invalid input: ${pattern}`);
    }

    try {
      if (statSync(pattern).isDirectory()) {
        return pattern.endsWith('/') ? `${pattern}**/*.{ts,tsx}` : `${pattern}/**/*.{ts,tsx}`;
      }
    } catch {
      // Ignored: likely a glob pattern or non-existent path
    }

    return pattern;
  });

  // Append glob negation (!) patterns for built-in ignore directories so
  // ts-morph doesn't waste time loading files from node_modules etc.
  const globPatterns = [...tsIncludes];
  for (const dir of IGNORE_DIRS) {
    globPatterns.push(`!${dir}/**`, `!**/${dir}/**`);
  }

  return globPatterns;
}

/**
 * Validate that all loaded source files are TypeScript files.
 *
 * @param {SourceFile[]} sourceFiles - Files loaded by ts-morph.
 *
 * @throws {Error} If a JavaScript file is found in the loaded set.
 */
function validateNoJsFiles(sourceFiles: SourceFile[]): void {
  for (const sf of sourceFiles) {
    const fp = sf.getFilePath().toString();
    if (fp.endsWith('.js') || fp.endsWith('.jsx')) {
      throw new Error(`Tool works with TypeScript (.ts, .tsx) files only. Found JS file: ${fp}`);
    }
  }
}

/**
 * Build a set of file paths that match the exclude patterns.
 *
 * @param {Project}  project - Initialized ts-morph Project instance.
 * @param {string[]} exclude - Exclude glob patterns.
 *
 * @returns {Set<string>} Set of absolute file paths to exclude.
 */
function buildExcludedSet(project: Project, exclude: string[]): Set<string> {
  const excludedSet = new Set<string>();
  for (const pattern of exclude) {
    project.addSourceFilesAtPaths(pattern).forEach((sf) => excludedSet.add(sf.getFilePath().toString()));
  }
  return excludedSet;
}

/**
 * Determine the starting directories for `.gitignore` search.
 *
 * Resolves each include pattern to a filesystem path. Uses the directory
 * of the pattern (or CWD for glob patterns) as a search starting point.
 *
 * @param {string[]} include - Raw include patterns from options.
 *
 * @returns {string[]} List of directory paths to search from.
 */
function resolveGitignoreSearchDirs(include: string[]): string[] {
  const dirs: string[] = [];

  for (const pattern of include) {
    try {
      const p = resolve(pattern);
      const s = statSync(p);
      dirs.push(s.isDirectory() ? p : dirname(p));
    } catch {
      // glob pattern — skip, will use CWD as fallback
    }
  }

  return dirs.length > 0 ? dirs : [process.cwd()];
}

/**
 * Walk up from a directory looking for a `.gitignore` file.
 *
 * @param {string} startDir - Directory to start searching from.
 *
 * @returns {string[]} Parsed gitignore patterns, or empty array if none found.
 */
function walkUpForGitignore(startDir: string): string[] {
  let scanDir = startDir;

  while (true) {
    const parsed = parseGitignore(scanDir);
    if (parsed.length > 0) {
      return parsed;
    }
    const parent = dirname(scanDir);
    if (parent === scanDir) break;
    scanDir = parent;
  }

  return [];
}

/**
 * Search for `.gitignore` files by walking up from include directories or CWD.
 *
 * @param {string[]} include - Raw include patterns from options.
 *
 * @returns {string[]} Parsed gitignore patterns, or an empty array if none found.
 */
function findGitignorePatterns(include: string[]): string[] {
  const searchDirs = resolveGitignoreSearchDirs(include);

  for (const startDir of searchDirs) {
    const patterns = walkUpForGitignore(startDir);
    if (patterns.length > 0) {
      return patterns;
    }
  }

  return [];
}

/**
 * Filter source files by gitignore patterns and explicit exclude patterns.
 *
 * @param {SourceFile[]} sourceFiles      - Files to filter.
 * @param {string[]}     gitignorePatterns - Patterns parsed from .gitignore.
 * @param {Set<string>}  excludedSet      - Explicitly excluded file paths.
 *
 * @returns {SourceFile[]} Filtered list of source files.
 */
function filterSourceFiles(
  sourceFiles: SourceFile[],
  gitignorePatterns: string[],
  excludedSet: Set<string>
): SourceFile[] {
  return sourceFiles.filter((sf) => {
    const fp = sf.getFilePath().toString();
    return !isIgnored(fp, gitignorePatterns) && !excludedSet.has(fp);
  });
}

/**
 * Load source files from the project, applying include and exclude patterns.
 *
 * @param {Project}  project  - Initialized ts-morph Project instance.
 * @param {string[]} include  - Glob patterns for files to include.
 * @param {string[]} exclude  - Glob patterns for files to exclude.
 *
 * @returns {SourceFile[]} Array of source files ready to process.
 *
 * @throws {Error} If a JavaScript file is provided or matched by a glob.
 */
function loadSourceFiles(project: Project, include: string[], exclude: string[]): SourceFile[] {
  const globPatterns = resolveIncludeGlobs(include);
  project.addSourceFilesAtPaths(globPatterns);

  const allSourceFiles = project.getSourceFiles();
  validateNoJsFiles(allSourceFiles);

  const excludedSet = buildExcludedSet(project, exclude);
  const gitignorePatterns = findGitignorePatterns(include);

  return filterSourceFiles(allSourceFiles, gitignorePatterns, excludedSet);
}

/**
 * Build an empty early-return result for when no files match or tsconfig is
 * missing.
 *
 * @param {number} startTime - Timestamp (epoch ms) when the process started.
 *
 * @returns {AnnotateResult} A zeroed-out result with no files.
 */
function emptyResult(startTime: number): AnnotateResult {
  return {
    filesProcessed: 0,
    filesUpdated: 0,
    filesFailed: 0,
    typesAnnotated: 0,
    durationMs: Date.now() - startTime,
    files: [],
  };
}

/**
 * Annotates a single function if it has a valid `@returns` JSDoc tag.
 *
 * @param {FunctionDeclaration} fn - The function to check.
 *
 * @returns {Annotation | null} The applied annotation, or null if skipped.
 */
function annotateFunction(fn: FunctionDeclaration): Annotation | null {
  if (fn.getReturnTypeNode()) {
    return null;
  }

  for (const doc of fn.getJsDocs()) {
    const returnsTag = doc.getTags().find((tag) => tag.getTagName() === 'returns');

    if (!returnsTag) continue;

    const match = returnsTag.getText().match(/\{([^}]+)\}/);
    if (!match) continue;

    const returnType = match[1];
    /* v8 ignore next */
    if (!returnType) continue;

    fn.setReturnType(returnType.trim());

    /* v8 ignore next */
    return { name: fn.getName() ?? '<anonymous>', returnType: returnType.trim() };
  }

  return null;
}

/**
 * Iterates through functions and attempts to annotate them.
 *
 * @param {FunctionDeclaration[]} functions - The functions to process.
 *
 * @returns {Annotation[]} List of successful annotations.
 */
function processFunctions(functions: FunctionDeclaration[]): Annotation[] {
  const fileAnnotations: Annotation[] = [];
  for (const fn of functions) {
    const annotation = annotateFunction(fn);
    if (annotation) {
      fileAnnotations.push(annotation);
    }
  }
  return fileAnnotations;
}

/**
 * Saves modifications to the source file, optionally creating a backup.
 *
 * @param {SourceFile} sourceFile - The ts-morph source file to save.
 * @param {string} filePath - Path of the source file.
 * @param {boolean} dryRun - If true, skips saving.
 * @param {boolean} backup - If true, creates a backup before saving.
 */
async function saveModifications(
  sourceFile: SourceFile,
  filePath: string,
  dryRun: boolean,
  backup: boolean
): Promise<void> {
  if (!dryRun) {
    if (backup) {
      backupFile(filePath);
    }
    await sourceFile.save();
  }
}

/**
 * Scan a single source file for functions that have a `@returns {Type}` JSDoc
 * tag but are missing an explicit return type annotation, and apply them.
 *
 * @param {SourceFile} sourceFile - The ts-morph SourceFile to scan.
 * @param {boolean}    dryRun     - When true, annotate in-memory without saving.
 * @param {boolean}    backup     - When true, create `.bak` copies before modifying.
 *
 * @returns {Promise<FileResult>} The result for this file.
 */
async function processSourceFile(sourceFile: SourceFile, dryRun: boolean, backup: boolean): Promise<FileResult> {
  const filePath = sourceFile.getFilePath().toString();
  const result: FileResult = { filePath, updated: false, failed: false, annotations: [] };

  try {
    const functions = [
      ...sourceFile.getFunctions(),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
    ];

    const fileAnnotations = processFunctions(functions);

    if (fileAnnotations.length > 0) {
      await saveModifications(sourceFile, filePath, dryRun, backup);

      result.updated = true;
      result.annotations = fileAnnotations;
    }
  } catch (error) {
    result.failed = true;
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

/**
 * Processes a list of source files, aggregating the results.
 *
 * @param {SourceFile[]} sourceFiles - The list of source files to process.
 * @param {boolean} dryRun - If true, skips saving.
 * @param {boolean}          backup     - If true, creates a backup before saving.
 * @param {AnnotateProgress} [onProgress] - Callback invoked before each file is processed.
 *
 * @returns {Promise<Pick<AnnotateResult, 'filesUpdated' | 'filesFailed' | 'typesAnnotated' | 'files'>>} The aggregated stats and results.
 */
async function processSourceFiles(
  sourceFiles: SourceFile[],
  dryRun: boolean,
  backup: boolean,
  onProgress?: AnnotateProgress
): Promise<Pick<AnnotateResult, 'filesUpdated' | 'filesFailed' | 'typesAnnotated' | 'files'>> {
  const files: FileResult[] = [];
  let filesUpdated = 0;
  let filesFailed = 0;
  let typesAnnotated = 0;

  for (let i = 0; i < sourceFiles.length; i++) {
    const sourceFile = sourceFiles[i]!;
    const filePath = sourceFile.getFilePath().toString();

    onProgress?.({ file: filePath, current: i + 1, total: sourceFiles.length });

    const result = await processSourceFile(sourceFile, dryRun, backup);

    if (result.updated) {
      filesUpdated++;
      typesAnnotated += result.annotations.length;
    }

    if (result.failed) {
      filesFailed++;
    }

    files.push(result);
  }

  return { filesUpdated, filesFailed, typesAnnotated, files };
}

/**
 * Walk up from a directory looking for tsconfig.json.
 *
 * @param {string} dir - Starting directory.
 *
 * @returns {string | null} Absolute tsconfig path or null if not found.
 */
function walkUpForTsconfig(dir: string): string | null {
  let current = dir;

  while (true) {
    const candidate = join(current, 'tsconfig.json');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) break; // reached filesystem root
    current = parent;
  }

  /* v8 ignore next */
  return null;
}

/**
 * Try to find tsconfig.json by walking up from include pattern directories.
 *
 * @param {string[]} include - Include patterns to search from.
 *
 * @returns {string | null} Absolute tsconfig path, or null if not found.
 */
function findTsconfigByWalkingUp(include: string[]): string | null {
  for (const pattern of include) {
    try {
      const p = resolve(pattern);
      let dir: string;
      /* c8 ignore start */
      const absStat = statSync(p);
      if (absStat.isDirectory()) {
        dir = p;
      } else if (absStat.isFile()) {
        dir = dirname(p);
      } else {
        continue;
      }
      /* c8 ignore stop */

      const result = walkUpForTsconfig(dir);
      if (result) {
        return result;
      }
    } catch {
      // skip glob/non-existent patterns
    }
  }

  /* v8 ignore next */
  return null;
}

/**
 * Scan CWD subdirectories for a tsconfig.json (monorepo-style layout).
 *
 * @returns {string | null} Absolute tsconfig path, or null if not found.
 */
function findTsconfigInSubdirectories(): string | null {
  const cwd = process.cwd();
  for (const entry of readdirSync(cwd)) {
    if (entry.startsWith('.') || IGNORE_DIRS.has(entry)) continue;
    const candidate = join(cwd, entry, 'tsconfig.json');
    if (!existsSync(candidate)) continue;
    return candidate;
  }
  /* v8 ignore next */
  return null;
}

/**
 * Resolve the tsconfig.json path, with fallback discovery when the default
 * path does not exist.
 *
 * @param {string}   tsconfig            - User-provided or default tsconfig path.
 * @param {string[]} include             - Include patterns.
 * @param {boolean}  userProvidedInclude - Whether the user explicitly provided include patterns.
 *
 * @returns {string | null} Resolved absolute tsconfig path, or null if not found.
 */
function resolveTsconfigPath(tsconfig: string, include: string[], userProvidedInclude: boolean): string | null {
  const tsconfigPath = resolve(tsconfig);

  if (existsSync(tsconfigPath)) {
    return tsconfigPath;
  }

  if (tsconfig !== 'tsconfig.json') {
    return null;
  }

  // Walk up from include pattern directories
  const walked = findTsconfigByWalkingUp(include);
  if (walked) {
    return walked;
  }

  // Scan CWD subdirectories (default includes only)
  if (!userProvidedInclude) {
    return findTsconfigInSubdirectories();
  }

  /* v8 ignore next */
  return null;
}

/**
 * Run the annotation process with the provided options.
 *
 * Scans TypeScript source files for functions that have a `@returns {Type}`
 * JSDoc tag but lack an explicit return type annotation, and adds the
 * inferred return type to the function signature.
 *
 * @param {AnnotateOptions} options - Configuration for the scan (include, exclude,
 *                          dry-run, backup, etc.).
 *
 * @returns {Promise<AnnotateResult>} Per-file details and aggregate statistics.
 */
export async function annotate(options: AnnotateOptions = {}): Promise<AnnotateResult> {
  const startTime = Date.now();

  const userProvidedInclude = options?.include !== undefined;

  const { tsconfig = 'tsconfig.json', exclude = [], dryRun = false, backup = false } = options;

  const include: string[] = options.include ?? ['**/*.ts', '**/*.tsx'];

  const tsconfigPath = resolveTsconfigPath(tsconfig, include, userProvidedInclude);

  if (!tsconfigPath) {
    return emptyResult(startTime);
  }

  const project = createProject(tsconfigPath);
  const sourceFiles = loadSourceFiles(project, include, exclude);

  if (sourceFiles.length === 0) {
    return emptyResult(startTime);
  }

  const { filesUpdated, filesFailed, typesAnnotated, files } = await processSourceFiles(
    sourceFiles,
    dryRun,
    backup,
    options.onProgress
  );

  return {
    filesProcessed: sourceFiles.length,
    filesUpdated,
    filesFailed,
    typesAnnotated,
    durationMs: Date.now() - startTime,
    files,
  };
}
