import type { BreadcrumbList, ListItem } from 'schema-dts';

import { buildId, mergeWithType, resolveUrl, validateUrl } from '@/utils';

/** A single breadcrumb navigation item with display name and URL path. */
export type BreadcrumbItem = { name: string; path: string };

/** Options for building a Schema.org BreadcrumbList entity from navigation items. */
export type BreadcrumbOptions = { rootUrl: string; items: BreadcrumbItem[] };

/**
 * Builds a Schema.org BreadcrumbList structured data entity from navigation items.
 *
 * @param {BreadcrumbOptions} options - The root URL and ordered breadcrumb items.
 * @param {Partial<BreadcrumbList>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {BreadcrumbList} A BreadcrumbList schema entity with positioned list items.
 */
export function breadcrumbSchema(options: BreadcrumbOptions, overrides?: Partial<BreadcrumbList>): BreadcrumbList {
  const rootUrl = validateUrl(options.rootUrl);
  const { items } = options;
  const lastItem = items[items.length - 1];
  const canonicalUrl = resolveUrl(rootUrl, lastItem?.path);

  const schema: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': buildId(canonicalUrl, 'breadcrumb'),
    itemListElement: items.map<ListItem>((item, index) => {
      const itemUrl = resolveUrl(rootUrl, item.path);

      return { '@type': 'ListItem', position: index + 1, name: item.name, item: itemUrl } satisfies ListItem;
    }),
  };

  return mergeWithType(schema, overrides);
}
