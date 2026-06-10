import type { AboutPage, ContactPage, WebPage } from 'schema-dts';

import { buildId, mergeWithType, resolveUrl, validateUrl } from '@/utils';

/**
 * Options for building a Schema.org WebPage entity with routing and type information.
 */
export type WebPageOptions = {
  rootUrl: string;
  path: string;
  type?: 'WebPage' | 'AboutPage' | 'ContactPage';
  breadcrumb?: boolean;
  mainEntityId?: string;
};

/**
 * Internal function to build a WebPage schema with common properties.
 *
 * @param {WebPageOptions} options - Page metadata including URL, name, and type.
 * @param {Partial<WebPage>} [overrides] - Optional property overrides.
 *
 * @returns {WebPage} A WebPage schema entity.
 */
function buildWebPageSchema(options: WebPageOptions, overrides?: Partial<WebPage>): WebPage {
  const rootUrl = validateUrl(options.rootUrl);
  const canonicalUrl = resolveUrl(rootUrl, options.path);
  const personId = buildId(rootUrl, 'person');
  const orgId = buildId(rootUrl, 'organization');
  const webSiteID = buildId(rootUrl, 'website');
  const breadcrumbId = buildId(canonicalUrl, 'breadcrumb');

  const schema: WebPage = {
    '@type': options.type || 'WebPage',
    '@id': buildId(canonicalUrl, 'webpage'),

    name: '', // Your Page Name
    description: '', // A brief description of this page
    inLanguage: 'en',
    url: canonicalUrl,

    isPartOf: { '@id': webSiteID },
    publisher: { '@id': orgId },
    author: { '@id': personId },
    copyrightHolder: { '@id': personId },

    copyrightYear: new Date().getFullYear(),
    dateModified: new Date().toISOString(),

    image: { '@type': 'ImageObject', url: `${canonicalUrl}/preview.png`, width: '1200', height: '630' },
  };

  if (options.mainEntityId) {
    schema.mainEntity = { '@id': options.mainEntityId };
  }

  if (options.breadcrumb) {
    schema.breadcrumb = { '@id': breadcrumbId };
  }

  const result = mergeWithType(
    schema as unknown as Record<string, unknown>,
    overrides as Record<string, unknown>
  ) as unknown as WebPage;

  return result;
}

/**
 * Builds a Schema.org WebPage structured data entity for a specific page.
 *
 * @param {WebPageOptions} options - Page metadata including URL, name, and type.
 * @param {Partial<WebPage>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {WebPage} A WebPage schema entity linked to the site, author, and publisher.
 */
export function webPageSchema(options: WebPageOptions, overrides?: Partial<WebPage>): WebPage {
  return buildWebPageSchema(options, overrides);
}

/**
 * Builds a Schema.org AboutPage structured data entity.
 *
 * @param {WebPageOptions} options - Page metadata including URL, name, and description.
 * @param {Partial<AboutPage>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {AboutPage} An AboutPage schema entity.
 */
export function aboutPageSchema(options: WebPageOptions, overrides?: Partial<AboutPage>): AboutPage {
  return buildWebPageSchema({ ...options, type: 'AboutPage' }, overrides) as AboutPage;
}

/**
 * Builds a Schema.org ContactPage structured data entity.
 *
 * @param {WebPageOptions} options - Page metadata including URL, name, and description.
 * @param {Partial<ContactPage>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {ContactPage} A ContactPage schema entity.
 */
export function contactPageSchema(options: WebPageOptions, overrides?: Partial<ContactPage>): ContactPage {
  return buildWebPageSchema({ ...options, type: 'ContactPage' }, overrides) as ContactPage;
}
