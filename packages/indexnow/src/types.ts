/**
 * Configuration options and result types for the IndexNow CLI tool.
 *
 * @type {NextIndexnowOptions}
 * @property {string}  [siteUrl]  - The site URL (e.g. https://example.com). If omitted, read from next-sitemap.config.
 * @property {string}  [key]      - IndexNow API key. If omitted, read from INDEXNOW_KEY env var or prompted.
 * @property {string}  [sitemap]  - Path to the sitemap XML file. Defaults to public/sitemap-0.xml.
 * @property {number}  [chunkSize] - URLs per submission batch. Defaults to 100.
 * @property {boolean} [dryRun]  - Preview changes without submitting when true.
 */
export interface NextIndexnowOptions {
  siteUrl?: string;
  key?: string;
  sitemap?: string;
  chunkSize?: number;
  dryRun?: boolean;
}

/**
 * Result of a single URL submission chunk.
 *
 * @type {SubmissionResult}
 * @property {number}  count    - Number of URLs submitted in this chunk.
 * @property {boolean} success  - Whether the submission succeeded.
 * @property {string}  [error]  - Error message if submission failed.
 */
export interface SubmissionResult {
  count: number;
  success: boolean;
  error?: string;
}

/**
 * Aggregate result after the IndexNow submission run completes.
 *
 * @type {NextIndexnowResult}
 * @property {number}             urlsFound     - Total URLs extracted from the sitemap.
 * @property {number}             urlsSubmitted - Successfully submitted URLs.
 * @property {number}             urlsFailed    - URLs that failed to submit.
 * @property {SubmissionResult[]} chunks        - Results per submission chunk.
 * @property {number}             durationMs    - Duration in milliseconds.
 */
export interface NextIndexnowResult {
  urlsFound: number;
  urlsSubmitted: number;
  urlsFailed: number;
  chunks: SubmissionResult[];
  durationMs: number;
}

/**
 * Configuration parsed from next-sitemap.config.*.
 *
 * @type {NextSitemapConfig}
 * @property {string} siteUrl - The site URL defined in the config.
 * @property {string} [outDir] - Custom output directory for the sitemap.
 */
export interface NextSitemapConfig {
  siteUrl: string;
  outDir?: string;
}

/**
 * Validation result with error details.
 *
 * @type {ValidationResult}
 * @property {boolean} valid   - Whether validation passed.
 * @property {string}  [error] - Error message if validation failed.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
