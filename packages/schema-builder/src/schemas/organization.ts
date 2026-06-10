import type { Organization } from 'schema-dts';

import { buildId, mergeWithType, validateUrl } from '@/utils';

/** Options for building a Schema.org Organization entity. */
export type OrganizationOptions = { rootUrl: string };

/**
 * Builds a Schema.org Organization structured data entity linked to the site creator.
 *
 * @param {OrganizationOptions} options - The root URL for generating organization identifiers.
 * @param {Partial<Organization>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {Organization} An Organization schema entity with logo and founder references.
 */
export function organizationSchema(options: OrganizationOptions, overrides?: Partial<Organization>): Organization {
  const rootUrl = validateUrl(options.rootUrl);
  const personId = buildId(rootUrl, 'person');
  const orgId = buildId(rootUrl, 'organization');

  const schema: Organization = {
    '@type': 'Organization',
    '@id': orgId,
    name: '', // Your Name or Organization
    description: '', // A brief description of your organization
    url: rootUrl,
    logo: { '@type': 'ImageObject', url: `${rootUrl}/logo.png`, width: '512', height: '512' },
    founder: { '@id': personId },
    foundingDate: new Date().getFullYear().toString(),
  };

  const result = mergeWithType(
    schema as unknown as Record<string, unknown>,
    overrides as Record<string, unknown>
  ) as unknown as Organization;

  return result;
}
