/**
 * Output formatters that control how annotation results are displayed.
 *
 * Supports three display modes (normal, verbose, quiet) plus JSON machine
 * output and a dedicated dry-run preview format.
 *
 * @module formatters
 */

import chalk from 'chalk';
import logSymbols from 'log-symbols';

import type { AnnotateResult } from './types.ts';

/**
 * Serialize annotation results as a pretty-printed JSON string.
 *
 * @param {AnnotateResult} result - The aggregated result from an annotation run.
 *
 * @returns {string} A JSON string with indentation for readability.
 */
export function formatJson(result: AnnotateResult): string {
  return JSON.stringify(
    {
      filesProcessed: result.filesProcessed,
      filesUpdated: result.filesUpdated,
      filesFailed: result.filesFailed,
      typesAnnotated: result.typesAnnotated,
      durationMs: result.durationMs,
      files: result.files.map((f) => ({
        filePath: f.filePath,
        updated: f.updated,
        failed: f.failed,
        error: f.error,
        annotations: f.annotations.map((a) => ({ name: a.name, returnType: a.returnType })),
      })),
    },
    null,
    2
  );
}

/**
 * Display annotation results to the console based on verbosity settings.
 *
 * Delegates to one of three internal printers: quiet (errors + summary),
 * verbose (per-file detail), or normal (updated files + summary).
 *
 * @param {AnnotateResult} result   - The aggregated result from an annotation run.
 * @param {object}         options  - Options to control output verbosity.
 * @param {boolean}        [options.verbose] - Show detailed output when true.
 * @param {boolean}        [options.quiet]   - Suppress non-error output when true.
 */
export function printResults(result: AnnotateResult, options: { verbose?: boolean; quiet?: boolean }): void {
  const { verbose, quiet } = options;

  if (quiet) {
    printErrors(result);
    return;
  }

  if (verbose) {
    printVerbose(result);
    return;
  }

  printNormal(result);
}

/**
 * Print only errors and the final summary to the console.
 *
 * @param {AnnotateResult} result - The aggregated result from an annotation run.
 */
function printErrors(result: AnnotateResult): void {
  for (const file of result.files) {
    if (file.failed && file.error) {
      console.error(`${logSymbols.error} ${file.filePath}: ${chalk.red(file.error)}`);
    }
  }

  printSummary(result);
}

/**
 * Print detailed per-file and per-function output to the console.
 *
 * Shows the scan status for every file, annotations added, and any errors
 * encountered.
 *
 * @param {AnnotateResult} result - The aggregated result from an annotation run.
 */
function printVerbose(result: AnnotateResult): void {
  console.log('');

  for (const file of result.files) {
    const status = file.failed
      ? `${logSymbols.error} Failed`
      : file.updated
        ? `${logSymbols.success} Updated`
        : chalk.dim('• SKIPPED');
    console.log(
      `[${result.files.indexOf(file) + 1}/${result.files.length}] ${chalk.cyan(file.filePath)} ... ${status}`
    );

    if (file.annotations.length > 0) {
      for (const ann of file.annotations) {
        console.log(`  ${chalk.dim('→')} ${chalk.yellow(ann.name)}(): ${chalk.blue(ann.returnType)}`);
      }
    }

    if (file.error) {
      console.error(chalk.red(`  ${file.error}`));
    }
  }

  printSummary(result);
}

/**
 * Print a concise summary listing only updated files and errors.
 *
 * This is the default display mode when neither `--verbose` nor `--quiet`
 * is specified.
 *
 * @param {AnnotateResult} result - The aggregated result from an annotation run.
 */
function printNormal(result: AnnotateResult): void {
  for (const file of result.files) {
    if (file.updated) {
      console.log(
        `${logSymbols.success} ${chalk.cyan(file.filePath)} (${chalk.green(String(file.annotations.length))} annotations)`
      );
    }
    if (file.failed && file.error) {
      console.error(`${logSymbols.error} ${file.filePath}: ${chalk.red(file.error)}`);
    }
  }
  printSummary(result);
}

/**
 * Print the aggregate summary as checkmark-style lines.
 *
 * @param {AnnotateResult} result - The aggregated result from an annotation run.
 */
function printSummary(result: AnnotateResult): void {
  const duration = (result.durationMs / 1000).toFixed(2);

  const labels = [
    ['Files scanned', String(result.filesProcessed), result.filesProcessed > 0 ? ('blue' as const) : ('dim' as const)],
    ['Files updated', String(result.filesUpdated), result.filesUpdated > 0 ? ('green' as const) : ('dim' as const)],
    ['Files failed', String(result.filesFailed), result.filesFailed > 0 ? ('red' as const) : ('dim' as const)],
    [
      'Types annotated',
      String(result.typesAnnotated),
      result.typesAnnotated > 0 ? ('green' as const) : ('dim' as const),
    ],
    ['Duration', `${duration}s`, result.durationMs > 0 ? ('yellow' as const) : ('dim' as const)],
  ];

  console.log('');
  for (const [label, value, color] of labels) {
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
 * Print a dry-run preview of what would be changed.
 *
 * For each file that would receive annotations, prints the file path and the
 * `add: functionName(): ReturnType` lines. When no annotations would be added
 * a message indicating all files are already annotated is displayed.
 *
 * @param {AnnotateResult} result - The aggregated result from an annotation run.
 */
export function printDryRun(result: AnnotateResult): void {
  console.log('');
  for (const file of result.files) {
    if (file.annotations.length === 0) {
      continue;
    }

    console.log(chalk.cyan(file.filePath));

    for (const ann of file.annotations) {
      console.log(`  ${chalk.dim('add:')} ${chalk.yellow(ann.name)}(): ${chalk.blue(ann.returnType)}`);
    }
  }

  if (result.typesAnnotated === 0) {
    console.log(chalk.dim('All files already have return type annotations.'));
  }

  console.log('');
  console.log(
    chalk.green(
      `Dry-run complete. ${result.typesAnnotated} annotations would be added across ${result.filesUpdated} files.`
    )
  );
}
