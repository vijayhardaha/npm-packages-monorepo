import type { WebSite } from 'schema-dts';

import { buildId, mergeWithType, validateUrl } from '@/utils';

/** Options for building a Schema.org WebSite entity with optional main entity reference. */
export type WebSiteOptions = { rootUrl: string };

/**
 * Builds a Schema.org WebSite structured data entity for the site root.
 *
 * @param {WebSiteOptions} options - The root URL and optional main entity reference.
 * @param {Partial<WebSite>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {WebSite} A WebSite schema entity with author and language metadata.
 */
export function webSiteSchema(options: WebSiteOptions, overrides?: Partial<WebSite>): WebSite {
  const rootUrl = validateUrl(options.rootUrl);
  const personId = buildId(rootUrl, 'person');
  const orgId = buildId(rootUrl, 'organization');

  const schema: WebSite = {
    '@type': 'WebSite',
    '@id': buildId(rootUrl, 'website'),

    name: '', // Your Website Name
    description: '', // A brief description of your website
    alternateName: '', // Your Website Alternate Name

    url: rootUrl,
    inLanguage: 'en',
    author: { '@id': personId },
    publisher: { '@id': orgId },
  };

  const result = mergeWithType(
    schema as unknown as Record<string, unknown>,
    overrides as Record<string, unknown>
  ) as unknown as WebSite;

  return result;
}
