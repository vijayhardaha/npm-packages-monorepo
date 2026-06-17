import type { WebAPI } from 'schema-dts';

import { buildId, mergeWithType, resolveUrl, validateUrl } from '@/utils';

/**
 * Options for building a Schema.org WebAPI entity.
 */
export type WebApiOptions = { rootUrl: string; path: string; price?: number };

/**
 * Builds a Schema.org WebAPI structured data entity with pricing and platform details.
 *
 * @param {WebApiOptions} options - Application metadata including name, URL, and category.
 * @param {Partial<WebAPI>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {WebAPI} A WebAPI schema entity with offers and authorship references.
 */
export function webApiSchema(options: WebApiOptions, overrides?: Partial<WebAPI>): WebAPI {
  const rootUrl = validateUrl(options.rootUrl);
  const canonicalUrl = resolveUrl(rootUrl, options.path);
  const orgId = buildId(rootUrl, 'organization');

  const schema: WebAPI = {
    '@type': 'WebAPI',
    '@id': buildId(canonicalUrl, 'webapi'),

    name: '', // Your API Name
    description: '', // A brief description of your API
    url: canonicalUrl,
    documentation: canonicalUrl,

    provider: { '@id': orgId },
    mainEntityOfPage: { '@id': buildId(canonicalUrl, 'webpage') },
    offers: { '@type': 'Offer', price: options.price ?? 0, priceCurrency: 'USD', availability: 'InStock' },
    serviceOutput: 'JSON',
  };

  return mergeWithType(schema, overrides);
}
