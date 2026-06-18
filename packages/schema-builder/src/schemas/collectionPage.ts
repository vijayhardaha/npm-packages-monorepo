import type { CollectionPage } from 'schema-dts';

import { buildId, mergeWithType, resolveUrl, validateUrl } from '@/utils';

/**
 * Options for building a Schema.org CollectionPage entity with routing information.
 */
export type CollectionPageOptions = { rootUrl: string; path: string };

/**
 * Builds a Schema.org CollectionPage structured data entity for a collection or listing page.
 *
 * @param {CollectionPageOptions} options - Page metadata including root URL and path.
 * @param {Partial<CollectionPage>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {CollectionPage} A CollectionPage schema entity linked to the site, author, and publisher.
 */
export function collectionPageSchema(
  options: CollectionPageOptions,
  overrides?: Partial<CollectionPage>
): CollectionPage {
  const rootUrl = validateUrl(options.rootUrl);
  const canonicalUrl = resolveUrl(rootUrl, options.path);
  const webSiteID = buildId(rootUrl, 'website');
  const orgId = buildId(rootUrl, 'organization');
  const personID = buildId(rootUrl, 'person');

  const schema: CollectionPage = {
    '@type': 'CollectionPage',
    '@id': buildId(canonicalUrl, 'collectionpage'),

    identifier: canonicalUrl,
    name: '', // Collection Name
    description: '', // Collection Description
    url: canonicalUrl,

    inLanguage: 'en',
    isPartOf: { '@id': webSiteID },
    publisher: { '@id': orgId },
    author: { '@id': personID },
    copyrightHolder: { '@id': personID },

    copyrightYear: new Date().getFullYear(),
    dateModified: new Date().toISOString(),
  };

  return mergeWithType(schema, overrides);
}
