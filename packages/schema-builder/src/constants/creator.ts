/**
 * Dimensions and URL for the creator's profile image used in schema markup.
 */
export interface CreatorProfileImage {
  url: string;
  width: number;
  height: number;
}

/**
 * Represents a social media or personal website profile for the creator, including a unique key, display name, and URL.
 */
export interface CreatorWebsite {
  name: string;
  url: string;
}

/**
 * Configuration object defining the creator's identity, social profiles, and expertise.
 */
export interface CreatorConfig {
  // Identity
  name: string;
  description: string;
  gender: string;
  pronouns: string;
  nationality: string;

  // Professional
  jobTitle: string;
  occupation: string;

  // Presence
  handles: string[];
  urls: Record<string, string>;
  websites: Record<string, CreatorWebsite>;

  //awards and recognition
  awards: string[];

  // Credential
  credential: string;

  // Media
  profileImage: CreatorProfileImage;

  // Knowledge
  skills: string[];
  knowsAbout: string[];
  languages: string[];

  // Location
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
}

/** Default creator profile used across all Schema.org structured data entities. */
export const CREATOR: CreatorConfig = {
  // Identity
  name: 'Vijay Hardaha',
  description:
    'Full-Stack Web Developer and full-time freelancer specializing in modern web applications and custom digital solutions. Experienced in WordPress and WooCommerce development, building high-performance websites and scalable e-commerce platforms.',
  gender: 'Male',
  pronouns: 'he/him',
  nationality: 'Indian',

  // Professional
  jobTitle: 'Full-Stack Web Developer',
  occupation: 'Freelance Web Developer',

  // Presence
  handles: ['@vijayhardaha', '@vegan.vijay'],
  urls: {
    codewars: 'https://www.codewars.com/users/vijayhardaha',
    devto: 'https://dev.to/vijayhardaha',
    facebook: 'https://facebook.com/vegan.vijay',
    freecodecamp: 'https://www.freecodecamp.org/vijayhardaha',
    github: 'https://github.com/vijayhardaha',
    gravatar: 'https://gravatar.com/vijayhardaha',
    instagram: 'https://instagram.com/vegan.vijay',
    linkedin: 'https://linkedin.com/in/vijayhardaha',
    pph: 'https://pph.me/vijayhardaha',
    stackoverflow: 'https://stackoverflow.com/users/11848895/vijay-hardaha',
    twitter: 'https://twitter.com/vijayhardaha',
    wordpress: 'https://profiles.wordpress.org/vijayhardaha/',
    x: 'https://x.com/vijayhardaha',
  },
  websites: {
    tools: { name: 'Tools by Vijay', url: 'https://toolsbyvijay.vercel.app' },
    vegan_ipsum: { name: 'Vegan Ipsum', url: 'https://veganipsum.vercel.app' },
  },

  // Awards & Recognition
  awards: ['Top Rated Freelancer on PeoplePerHour'],

  // Credentials
  credential: 'Full Stack Web Development',

  // Media
  profileImage: {
    url: 'https://2.gravatar.com/avatar/a8876621e5cdda09a3ee6536b7d3ae28e968d06f8ee834877d98039b536b5a90?s=512&d=initials',
    width: 512,
    height: 512,
  },

  // Knowledge
  skills: [
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'Tailwind CSS',
    'Technical SEO',
    'Web Performance Optimization',
    'Static Site Generation (SSG)',
    'Server-Side Rendering (SSR)',
    'API Integration',
    'Headless CMS',
    'Web Accessibility (a11y)',
  ],
  knowsAbout: [
    'Frontend Development',
    'Search Engine Optimization',
    'Technical SEO',
    'Web Performance',
    'Web Accessibility',
    'Developer Tools',
    'Content Generation Tools',
    'WordPress Development',
    'Open Source Development',
    'Freelancing',
    'UI/UX Principles',
  ],
  languages: ['English', 'Hindi'],

  // Location
  addressLocality: 'Jabalpur',
  addressRegion: 'Madhya Pradesh',
  addressCountry: 'India',
};
