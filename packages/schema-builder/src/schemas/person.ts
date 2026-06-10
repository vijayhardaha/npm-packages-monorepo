import type { Person } from 'schema-dts';

import { CREATOR } from '@/constants/creator';
import { buildId, mergeWithType, validateUrl } from '@/utils';

/** Options for building a Schema.org Person entity with linked organization. */
export type PersonOptions = { rootUrl: string };

/**
 * Builds the base Person schema object from creator constants.
 *
 * @param {string} rootUrl - The validated root URL.
 * @param {string} personId - The schema ID for the person entity.
 *
 * @returns {Person} A Person schema populated with creator profile data.
 */
function buildPersonSchema(rootUrl: string, personId: string): Person {
  return {
    '@type': 'Person',
    '@id': personId,

    // Identity
    name: CREATOR.name,
    givenName: CREATOR.name.split(' ')[0],
    familyName: CREATOR.name.split(' ')[1],
    alternateName: CREATOR.handles,
    gender: CREATOR.gender,
    pronouns: CREATOR.pronouns,
    nationality: CREATOR.nationality,
    description: CREATOR.description,

    // URLs / Presence
    url: rootUrl,
    sameAs: Object.values(CREATOR.urls),

    // Media
    image: {
      '@type': 'ImageObject',
      url: CREATOR.profileImage.url,
      width: String(CREATOR.profileImage.width),
      height: String(CREATOR.profileImage.height),
    },

    // Professional Info
    jobTitle: CREATOR.jobTitle,
    hasOccupation: { '@type': 'Occupation', name: CREATOR.occupation },
    worksFor: { '@type': 'Organization', name: CREATOR.websites.tools.name, url: CREATOR.websites.tools.url },

    // Credentials & Recognition
    hasCredential: { '@type': 'EducationalOccupationalCredential', name: CREATOR.credential },
    award: CREATOR.awards,

    // Knowledge
    knowsLanguage: CREATOR.languages,
    knowsAbout: CREATOR.knowsAbout,

    // Location
    workLocation: [
      {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: CREATOR.addressLocality,
          addressRegion: CREATOR.addressRegion,
          addressCountry: CREATOR.addressCountry,
        },
      },
      { '@type': 'Place', name: 'Remote' },
    ],

    // Services
    makesOffer: { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Web Development Services' } },

    // Branding
    brand: { '@type': 'Brand', name: CREATOR.name },
  };
}

/**
 * Builds a Schema.org Person structured data entity for the site creator.
 *
 * @param {PersonOptions} options - The root URL and optional organization reference.
 * @param {Partial<Person>} [overrides] - Optional property overrides to merge into the schema.
 *
 * @returns {Person} A Person schema entity populated with creator profile data.
 */
export function personSchema(options: PersonOptions, overrides?: Partial<Person>): Person {
  const rootUrl = validateUrl(options.rootUrl);
  const personId = buildId(rootUrl, 'person');
  const schema = buildPersonSchema(rootUrl, personId);

  return mergeWithType(
    schema as unknown as Record<string, unknown>,
    overrides as Record<string, unknown> | undefined
  ) as unknown as Person;
}
