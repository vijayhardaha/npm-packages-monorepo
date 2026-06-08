/**
 * Configuration options for the annotation process.
 *
 * @type {AnnotateOptions}
 * @property {string} [tsconfig] - Path to the tsconfig.json file
 * @property {string[]} [include] - Glob patterns for files to include in the scan
 * @property {string[]} [exclude] - Glob patterns for files to exclude from the scan
 * @property {boolean} [dryRun] - Preview changes without writing to disk when true
 * @property {boolean} [check] - Exit with code 1 if any missing return types are found
 * @property {boolean} [verbose] - Show detailed per-file and per-function output
 * @property {boolean} [quiet] - Suppress all output except errors and the final summary
 * @property {boolean} [json] - Output results as a machine-readable JSON string
 * @property {boolean} [backup] - Create .bak copies of files before modifying them
 */
export interface AnnotateOptions {
  tsconfig?: string;
  include?: string[];
  exclude?: string[];
  dryRun?: boolean;
  check?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  backup?: boolean;
}

/**
 * Result of processing a single source file.
 *
 * @type {FileResult}
 * @property {string} filePath - Absolute or relative path to the processed file
 * @property {boolean} updated - Whether the file was modified by the annotation process
 * @property {boolean} failed - Whether processing this file resulted in an error
 * @property {string} [error] - Error message set when processing fails
 * @property {Annotation[]} annotations - List of annotations that were added to this file
 */
export interface FileResult {
  filePath: string;
  updated: boolean;
  failed: boolean;
  error?: string;
  annotations: Annotation[];
}

/**
 * A single return type annotation applied to a function.
 *
 * @type {Annotation}
 * @property {string} name - Name of the function, or "<anonymous>" for unnamed functions
 * @property {string} returnType - The return type string that was added to the signature
 */
export interface Annotation {
  name: string;
  returnType: string;
}

/**
 * Aggregate result returned after an annotation run completes.
 *
 * @type {AnnotateResult}
 * @property {number} filesProcessed - Total number of source files processed
 * @property {number} filesUpdated - Number of files modified with new annotations
 * @property {number} filesFailed - Number of files that failed during processing
 * @property {number} typesAnnotated - Total return type annotations added across all files
 * @property {number} durationMs - Duration of the annotation run in milliseconds
 * @property {FileResult[]} files - Detailed results for each processed file
 */
export interface AnnotateResult {
  filesProcessed: number;
  filesUpdated: number;
  filesFailed: number;
  typesAnnotated: number;
  durationMs: number;
  files: FileResult[];
}
