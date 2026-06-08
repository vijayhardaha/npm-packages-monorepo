/**
 * Output formatters that control how annotation results are displayed.
 *
 * Supports three display modes (normal, verbose, quiet) plus JSON machine
 * output and a dedicated dry-run preview format.
 *
 * @module formatters
 */

import type { AnnotateResult } from './types.ts';

/**
 * Serialize annotation results as a pretty-printed JSON string.
 *
 * @param {AnnotateResult} result - The aggregated result from an annotation run.
 *
 * @returns {string} A JSON string with indentation for readability.
 */
// fallow-ignore-next-line dead-code
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
// fallow-ignore-next-line dead-code
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
      console.error(`✗ ${file.filePath}: ${file.error}`);
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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Return Type Annotation Scan');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  for (const file of result.files) {
    const status = file.failed ? '✗ FAILED' : file.updated ? '✓ UPDATED' : '• SKIPPED';
    console.log(`[${result.files.indexOf(file) + 1}/${result.files.length}] ${file.filePath} ... ${status}`);

    if (file.annotations.length > 0) {
      for (const ann of file.annotations) {
        console.log(`  → ${ann.name}(): ${ann.returnType}`);
      }
    }

    if (file.error) {
      console.error(`  ${file.error}`);
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
      console.log(`✓ ${file.filePath} (${file.annotations.length} annotations)`);
    }
    if (file.failed && file.error) {
      console.error(`✗ ${file.filePath}: ${file.error}`);
    }
  }
  printSummary(result);
}

/**
 * Print the aggregate summary block (files scanned, updated, failed, etc.).
 *
 * @param {AnnotateResult} result - The aggregated result from an annotation run.
 */
function printSummary(result: AnnotateResult): void {
  const duration = (result.durationMs / 1000).toFixed(2);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 ANNOTATION RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Files scanned      : ${result.filesProcessed}`);
  console.log(`Files updated      : ${result.filesUpdated}`);
  console.log(`Files failed       : ${result.filesFailed}`);
  console.log(`Types annotated    : ${result.typesAnnotated}`);
  console.log(`Duration           : ${duration}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
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
// fallow-ignore-next-line dead-code
export function printDryRun(result: AnnotateResult): void {
  for (const file of result.files) {
    if (file.annotations.length === 0) {
      continue;
    }

    console.log(file.filePath);

    for (const ann of file.annotations) {
      console.log(`  add: ${ann.name}(): ${ann.returnType}`);
    }
  }

  if (result.typesAnnotated === 0) {
    console.log('All files already have return type annotations.');
  }

  console.log('');
  console.log(
    `Dry-run complete. ${result.typesAnnotated} annotations would be added across ${result.filesUpdated} files.`
  );
}
