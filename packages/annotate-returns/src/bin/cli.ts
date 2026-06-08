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
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import chalk from 'chalk';
import { Command } from 'commander';
import logSymbols from 'log-symbols';
import ora from 'ora';

import { formatJson, printDryRun, printResults } from '../formatters.ts';
import { annotate } from '../index.ts';
import type { AnnotateResult } from '../types.ts';

// ── ASCII Banner ───────────────────────────────────────────────────────

const BANNER = `
${chalk.white(' █████╗ ███╗   ██╗███╗   ██╗ ██████╗ ████████╗ █████╗ ████████╗███████╗')}
${chalk.white('██╔══██╗████╗  ██║████╗  ██║██╔═══██╗╚══██╔══╝██╔══██╗╚══██╔══╝██╔════╝')}
${chalk.white('███████║██╔██╗ ██║██╔██╗ ██║██║   ██║   ██║   ███████║   ██║   █████╗  ')}
${chalk.white('██╔══██║██║╚██╗██║██║╚██╗██║██║   ██║   ██║   ██╔══██║   ██║   ██╔══╝  ')}
${chalk.white('██║  ██║██║ ╚████║██║ ╚████║╚██████╔╝   ██║   ██║  ██║   ██║   ███████╗')}
${chalk.white('╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚══════╝')}`;

const SEPARATOR = chalk.dim('='.repeat(71));

// ── Helpers ────────────────────────────────────────────────────────────

function checkMark(valid: boolean, label: string, detail?: string): void {
  const icon = valid ? logSymbols.success : logSymbols.error;
  const msg = detail ? `${label} : ${detail}` : label;
  console.log(`${icon} ${msg}`);
}

function printFooter(result: AnnotateResult): void {
  console.log('');
  if (result.filesProcessed === 0) {
    console.log(chalk.yellow('No TypeScript files found to scan.'));
  } else if (result.filesUpdated === 0 && result.filesFailed === 0) {
    console.log(chalk.green('All files already have return type annotations.'));
  } else if (result.filesFailed > 0 && result.filesUpdated === 0) {
    console.log(chalk.red(`All ${result.filesProcessed} files failed to process.`));
  } else if (result.filesFailed > 0) {
    console.log(
      chalk.yellow(
        `${result.filesUpdated}/${result.filesProcessed} files updated successfully (${result.filesFailed} failed).`
      )
    );
  } else {
    console.log(chalk.green(`All ${result.filesUpdated} files annotated successfully! 🥳`));
  }
  console.log('');
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
 * Displays the ASCII banner, validates the tsconfig, scans TypeScript
 * files for missing return type annotations, shows results, and exits
 * with the appropriate code.
 */
// fallow-ignore-next-line complexity
export async function main(): Promise<void> {
  const opts = program.optsWithGlobals();
  const args = program.args;

  const include = resolveIncludePatterns(args, opts.include);

  const showUX = !opts.json;
  const showProgress = showUX && !opts.quiet && !opts.verbose;

  // 1. Show banner + separator + version
  if (showUX) {
    console.log(BANNER);
    console.log('');
    console.log(SEPARATOR);
    console.log(chalk.yellow(`annotate-returns: v${pkg.version}`));
    console.log(SEPARATOR);
    console.log('');

    // 2. Tsconfig check — walk up from CWD for default path to match library resolution
    const tsconfigPath = resolve(opts.tsconfig);
    let tsconfigExists = existsSync(tsconfigPath);
    if (!tsconfigExists && opts.tsconfig === 'tsconfig.json') {
      let dir = process.cwd();
      while (true) {
        const candidate = join(dir, 'tsconfig.json');
        if (existsSync(candidate)) {
          tsconfigExists = true;
          break;
        }
        const parent = dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
    }
    if (tsconfigExists) {
      checkMark(true, 'tsconfig found', opts.tsconfig);
    } else {
      checkMark(false, 'tsconfig not found', opts.tsconfig);
    }
  }

  // 3. Create spinner for progress (normal mode only)
  if (showProgress) {
    spinner = ora({ color: 'cyan', discardStdin: false });
  }

  // 4. Run annotation
  const result = await annotate({
    tsconfig: opts.tsconfig,
    include: include.length > 0 ? include : undefined,
    exclude: opts.exclude,
    dryRun: opts.dryRun ?? false,
    check: opts.check ?? false,
    backup: opts.backup ?? false,
    onProgress: showProgress
      ? ({ file, current, total }) => {
          if (spinner) {
            spinner.text = `[${current}/${total}] ${file}`;
            if (!spinner.isSpinning) {
              spinner.start();
            }
          }
        }
      : undefined,
  });

  if (spinner?.isSpinning) {
    spinner.succeed('Scan complete');
  }

  // 5. Show files found checkmark
  if (showUX) {
    if (result.filesProcessed > 0) {
      checkMark(true, 'Files found', `${result.filesProcessed} ${result.filesProcessed === 1 ? 'file' : 'files'}`);
    } else {
      checkMark(false, 'No files found');
    }
    console.log('');
  }

  // 6. Show formatted output
  if (opts.json) {
    console.log(formatJson(result));
  } else if (opts.dryRun) {
    printDryRun(result);
  } else {
    printResults(result, { verbose: opts.verbose, quiet: opts.quiet });
  }

  // 7. Show footer message (dry-run already has its own summary from printDryRun)
  if (showUX && !opts.dryRun) {
    printFooter(result);
  }

  // 8. Exit with appropriate code
  if (result.filesFailed > 0) {
    process.exit(1);
  }

  if (opts.check && result.typesAnnotated > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error instanceof Error ? error.message : String(error));
  process.exit(1);
});
