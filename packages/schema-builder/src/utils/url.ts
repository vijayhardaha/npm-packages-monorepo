const URL_REGEX = /^https?:\/\/.+/;

/**
 * Cleans a URL by optionally removing trailing slashes and/or query strings.
 *
 * @param {string} url - The URL to clean.
 * @param {boolean} removeTrailingSlash - Whether to remove trailing slash.
 * @param {boolean} [removeQueryString] - Whether to remove query strings.
 *
 * @returns {string} The cleaned URL.
 *
 * @example
 * cleanUrl('https://example.com/page/', true); // 'https://example.com/page'
 * cleanUrl('https://example.com/page?q=1', true, true); // 'https://example.com/page'
 */
export function cleanUrl(url: string, removeTrailingSlash: boolean, removeQueryString?: boolean): string {
  let cleaned = url;

  if (removeQueryString) {
    cleaned = cleaned.split('?')[0];
  }

  if (removeTrailingSlash) {
    return cleaned.replace(/\/$/, '');
  }

  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
}

/**
 * Validates and normalizes a URL by ensuring it uses HTTP/HTTPS and stripping trailing slashes.
 *
 * @param {string} url - The URL string to validate.
 *
 * @returns {string} The validated URL with trailing slash removed.
 *
 * @example
 * validateUrl('https://example.com/'); // 'https://example.com'
 *
 * @throws {Error} If the URL is empty, not a string, or uses an invalid protocol.
 */
export function validateUrl(url: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('URL is required and must be a non-empty string');
  }

  if (!URL_REGEX.test(url)) {
    throw new Error('URL must be a valid HTTP/HTTPS URL');
  }

  return cleanUrl(url, true);
}

/**
 * Resolves a URL path against a base URL, removing trailing slashes.
 *
 * @param {string} rootUrl - The base URL.
 * @param {string} [path] - The path to resolve.
 *
 * @returns {string} The resolved canonical URL.
 */
export function resolveUrl(rootUrl: string, path: string = ''): string {
  return new URL(path, rootUrl).toString().replace(/\/$/, '');
}
