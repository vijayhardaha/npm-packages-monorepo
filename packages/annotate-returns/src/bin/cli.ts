#!/usr/bin/env node

/**
 * annotate-returns — CLI entry point.
 *
 * Parses command-line arguments with commander, invokes the annotation
 * library, and displays results using the appropriate formatter.
 *
 * @module cli
 *
 * Usage:
 *   annotate-returns [options]
 *   annotate-returns src/
 *   annotate-returns "src/**\/*.ts"
 *   annotate-returns --verbose
 *   annotate-returns --quiet
 *   annotate-returns --dry-run
 *   annotate-returns --check
 *   annotate-returns --exclude "dist/**"
 *   annotate-returns --tsconfig tsconfig.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Command } from 'commander';

import { formatJson, printDryRun, printResults } from '../formatters.ts';
import { annotate } from '../index.ts';

const __filename = fileURLToPath(import.meta.url);
const pkgPathSrc = resolve(__filename, '..', '..', '..', 'package.json');
const pkgPathDist = resolve(__filename, '..', '..', 'package.json');
const pkgPath = existsSync(pkgPathDist) ? pkgPathDist : pkgPathSrc;

// Read version from package.json
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };

const program = new Command();

program
  .name('annotate-returns')
  .description('Add missing TypeScript return type annotations from JSDoc @returns tags')
  .version(pkg.version)
  .argument('[globs...]', 'Files or glob patterns to scan (e.g. src/ "src/**/*.ts")')
  .option('-v, --verbose', 'Show detailed output')
  .option('-q, --quiet', 'Show only errors and summary')
  .option('--json', 'Output JSON report')
  .option('-d, --dry-run', 'Preview changes without writing files')
  .option('--check', 'Fail (exit code 1) if missing return types are found')
  .option('--tsconfig <path>', 'Path to tsconfig.json', 'tsconfig.json')
  .option('--include <globs...>', 'Include files matching glob(s)')
  .option('--exclude <globs...>', 'Exclude files matching glob(s)')
  .option('--backup', 'Create .bak files before modifications')
  .addHelpText(
    'after',
    `
Examples:
  $ annotate-returns                    Scan all .ts/.tsx files in current directory
  $ annotate-returns src/               Scan a directory
  $ annotate-returns "src/**/*.ts"      Scan with custom glob
  $ annotate-returns --verbose          Show every file and function processed
  $ annotate-returns --quiet            Only show errors and summary
  $ annotate-returns --dry-run          Preview changes without saving
  $ annotate-returns --check            Exit with code 1 if annotations are missing
  $ annotate-returns --exclude "dist/**" --include "src/**/*.ts"
  $ annotate-returns --tsconfig tsconfig.custom.json
  $ annotate-returns --json             Output machine-readable JSON
  $ annotate-returns --backup           Create .bak files before modifications
    `
  )
  // fallow-ignore-next-line complexity
  .hook('preAction', (thisCommand) => {
    // fallow-ignore-next-line complexity
    const opts = thisCommand.optsWithGlobals();

    if (opts.verbose && opts.quiet) {
      console.error('Error: --verbose and --quiet cannot be used together');
      process.exit(1);
    }

    if (opts.json && (opts.verbose || opts.quiet)) {
      console.error('Error: --json cannot be used with --verbose or --quiet');
      process.exit(1);
    }
  })
  .parse(process.argv);

/**
 * Resolve the include patterns from command-line arguments and options.
 *
 * Priority order:
 * 1. Positional glob arguments
 * 2. --include option values
 * 3. Empty array (library defaults will be used)
 *
 * @param {string[]} args - Positional arguments from commander.
 * @param {string[] | undefined} optsInclude - The --include option value from commander.
 *
 * @returns {string[]} Array of include glob patterns.
 */
export function resolveIncludePatterns(args: string[], optsInclude: string[] | undefined): string[] {
  if (args.length > 0) {
    return args;
  }

  if (optsInclude && optsInclude.length > 0) {
    return optsInclude;
  }

  return [];
}

/**
 * Main CLI entry point.
 *
 * Reads parsed commander options, invokes the annotate library, formats
 * the output based on flags, and exits with the appropriate code.
 */
// fallow-ignore-next-line complexity
export async function main(): Promise<void> {
  const opts = program.optsWithGlobals();
  const args = program.args;

  const include = resolveIncludePatterns(args, opts.include);

  const result = await annotate({
    tsconfig: opts.tsconfig,
    include: include.length > 0 ? include : undefined,
    exclude: opts.exclude,
    dryRun: opts.dryRun ?? false,
    check: opts.check ?? false,
    backup: opts.backup ?? false,
  });

  if (opts.json) {
    console.log(formatJson(result));
  } else if (opts.dryRun) {
    printDryRun(result);
  } else {
    printResults(result, { verbose: opts.verbose, quiet: opts.quiet });
  }

  if (result.filesFailed > 0) {
    process.exit(1);
  }

  if (opts.check && result.typesAnnotated > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
