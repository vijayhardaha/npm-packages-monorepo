import type { SoftwareApplication } from 'schema-dts';

import { buildId, mergeWithType, resolveUrl, validateUrl } from '@/utils';

/**
 * Options for building a Schema.org SoftwareApplication entity.
 */
export type SoftwareAppOptions = {
  rootUrl: string;
  path: string;
  operatingSystem?: string;
  applicationCategory?: string;
  applicationSubCategory?: string;
  version?: string;
  price?: number;
  downloadUrl?: string;
  installUrl?: string;
  requirements?: string;
  sourceCode?: string;
};

/**
 * Builds a Schema.org SoftwareApplication structured data entity with pricing and platform details.
 *
 * @param {SoftwareAppOptions} options - Application metadata including name, URL, and category.
 * @param {Partial<SoftwareApplication>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {SoftwareApplication} A SoftwareApplication schema entity with offers and authorship references.
 */
export function softwareAppSchema(
  options: SoftwareAppOptions,
  overrides?: Partial<SoftwareApplication>
): SoftwareApplication {
  const rootUrl = validateUrl(options.rootUrl);
  const canonicalUrl = resolveUrl(rootUrl, options.path);
  const orgId = buildId(rootUrl, 'organization');
  const personId = buildId(rootUrl, 'person');

  const schema: SoftwareApplication = {
    '@type': 'SoftwareApplication',
    '@id': buildId(canonicalUrl, 'app'),
    name: '', // Your Application Name
    description: '', // A brief description of your application
    url: canonicalUrl,

    applicationCategory: options.applicationCategory || 'UtilityApplication',
    operatingSystem: options.operatingSystem || 'All',
    softwareVersion: options.version || '1.0.0',
    isAccessibleForFree: true,

    author: { '@id': personId },
    publisher: { '@id': orgId },

    mainEntityOfPage: { '@id': buildId(canonicalUrl, 'webpage') },
    offers: { '@type': 'Offer', price: options.price || 0, priceCurrency: 'USD', availability: 'InStock' },
  };

  if (options.applicationSubCategory) schema.applicationSubCategory = options.applicationSubCategory;
  if (options.downloadUrl) schema.downloadUrl = options.downloadUrl;
  if (options.installUrl) schema.installUrl = options.installUrl;
  if (options.requirements) schema.softwareRequirements = options.requirements;
  if (options.sourceCode) schema.isBasedOn = options.sourceCode;

  const result = mergeWithType(
    schema as unknown as Record<string, unknown>,
    overrides as Record<string, unknown>
  ) as unknown as SoftwareApplication;

  return result;
}
