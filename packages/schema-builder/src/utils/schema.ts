import { cleanUrl } from './url';

/**
 * Builds a schema ID from a URL and ID fragment.
 * Cleans the URL and appends the ID fragment with a hash.
 *
 * @param {string} url - The base URL.
 * @param {string} id - The ID fragment.
 *
 * @returns {string} The combined schema ID.
 *
 * @example
 * buildId('https://example.com/', 'person'); // 'https://example.com#person'
 * buildId('https://example.com', 'website'); // 'https://example.com#website'
 */
export function buildId(url: string, id: string): string {
  return `${cleanUrl(url, true)}#${id}`;
}

/**
 * Wraps entities in a `@graph` structure for multiple schemas.
 * Used when you need to return multiple interconnected schemas.
 *
 * @param {...Record<string, unknown>} entities - Schema entities to include in the graph.
 *
 * @returns {Record<string, unknown>} A JSON-LD graph object with `@context` and `@graph`.
 */
export function toGraph(...entities: Record<string, unknown>[]): Record<string, unknown> {
  return { '@context': 'https://schema.org', '@graph': entities };
}
