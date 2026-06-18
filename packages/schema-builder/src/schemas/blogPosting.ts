import type { BlogPosting } from 'schema-dts';

import { buildId, mergeWithType, resolveUrl, validateUrl } from '@/utils';

/**
 * Options for building a Schema.org BlogPosting entity with routing and metadata.
 */
export type BlogPostingOptions = { rootUrl: string; path: string };

/**
 * Builds a Schema.org BlogPosting structured data entity for a blog post or article.
 *
 * @param {BlogPostingOptions} options - Post metadata including root URL, path, and optional author.
 * @param {Partial<BlogPosting>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {BlogPosting} A BlogPosting schema entity linked to the publisher and main entity page.
 */
export function blogPostingSchema(options: BlogPostingOptions, overrides?: Partial<BlogPosting>): BlogPosting {
  const rootUrl = validateUrl(options.rootUrl);
  const canonicalUrl = resolveUrl(rootUrl, options.path);
  const orgId = buildId(rootUrl, 'organization');
  const personID = buildId(rootUrl, 'person');

  const schema: BlogPosting = {
    '@type': 'BlogPosting',
    '@id': buildId(canonicalUrl, 'blogposting'),

    identifier: canonicalUrl,
    headline: '', // Post Title
    description: '', // Post Description
    url: canonicalUrl,

    inLanguage: 'en',
    author: { '@id': personID },
    publisher: { '@id': orgId },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },

    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    image: '', // Featured Image URL
  };

  return mergeWithType(schema, overrides);
}
