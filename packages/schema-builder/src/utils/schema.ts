import { validateUrl } from './url';

/**
 * Builds a schema ID from a URL and ID fragment.
 * Validates the URL and appends the ID fragment with a hash.
 *
 * @param {string} url - The base URL.
 * @param {string} id - The ID fragment.
 *
 * @returns {string} The combined schema ID.
 *
 * @example
 * buildId('https://example.com/', 'person'); // 'https://example.com#person'
 * buildId('https://example.com', 'website'); // 'https://example.com#website'
 *
 * @throws {Error} If the URL is invalid.
 */
export function buildId(url: string, id: string): string {
  const validated = validateUrl(url);
  return `${validated}#${id}`;
}

/**
 * Wraps entities in a `@graph` structure for multiple schemas.
 * Used when you need to return multiple interconnected schemas.
 *
 * @param {...Record<string, unknown>} entities - Schema entities to include in the graph.
 *
 * @returns {Record<string, unknown>} A JSON-LD graph object with `@context` and `@graph`.
 *
 * @throws {Error} If no entities are provided or any entity is not a plain object.
 */
export function toGraph(...entities: Record<string, unknown>[]): Record<string, unknown> {
  if (entities.length === 0) {
    throw new Error('At least one schema entity is required');
  }

  for (const entity of entities) {
    if (typeof entity !== 'object' || entity === null || Array.isArray(entity)) {
      throw new Error('All entities must be plain objects');
    }
  }

  return { '@context': 'https://schema.org', '@graph': entities };
}
