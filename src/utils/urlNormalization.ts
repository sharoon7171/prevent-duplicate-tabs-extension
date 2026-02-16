/**
 * URL normalization utilities
 * Handles URL comparison and normalization for duplicate tab detection
 */

/**
 * Normalizes a pathname by removing trailing slashes (except for root path)
 * This ensures that /path and /path/ are treated as the same URL
 * 
 * @param pathname - The pathname to normalize
 * @returns Normalized pathname without trailing slash (except root)
 */
function normalizePathname(pathname: string): string {
  // Keep root path as-is
  if (pathname === '/' || pathname === '') {
    return '/';
  }
  
  // Remove trailing slash for all other paths
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

/**
 * Normalizes a URL for comparison
 * Strips query parameters and fragments when ignoreParameters is true
 * Removes trailing slashes from pathname to ensure /path and /path/ match
 * 
 * @param url - The URL to normalize
 * @param ignoreParameters - Whether to ignore query parameters and fragments
 * @returns Normalized URL string, or null if URL is invalid or cannot be normalized
 */
export function normalizeUrl(url: string | undefined, ignoreParameters: boolean): string | null {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);

    // Handle chrome://, extension pages, and other non-HTTP(S) URLs
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }

    // Normalize pathname to remove trailing slashes (except root)
    const normalizedPathname = normalizePathname(urlObj.pathname);

    // Include port when it's non-default (80 for http, 443 for https)
    const isDefaultPort =
      (urlObj.protocol === 'http:' && urlObj.port === '80') ||
      (urlObj.protocol === 'https:' && urlObj.port === '443') ||
      urlObj.port === '';
    const host = isDefaultPort ? urlObj.hostname : `${urlObj.hostname}:${urlObj.port}`;

    // If ignoring parameters, return just protocol + host + pathname
    if (ignoreParameters) {
      return `${urlObj.protocol}//${host}${normalizedPathname}`;
    }

    // Otherwise, include everything except the hash fragment
    return `${urlObj.protocol}//${host}${normalizedPathname}${urlObj.search}`;
  } catch (error) {
    // Invalid URL format
    return null;
  }
}

/**
 * Normalizes an exception string by adding protocol if missing
 * Automatically adds https:// protocol if exception doesn't start with http:// or https://
 * 
 * @param exception - The exception string to normalize (domain or URL)
 * @returns Normalized exception string with protocol
 */
export function normalizeException(exception: string): string {
  if (!exception || !exception.trim()) {
    return exception;
  }

  const trimmed = exception.trim();

  // If it already has a protocol, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Add https:// protocol
  return `https://${trimmed}`;
}

/**
 * Extracts the domain from a URL
 * 
 * @param url - The URL to extract domain from
 * @returns Domain string, or null if URL is invalid
 */
export function extractDomain(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    
    // Only extract domain for HTTP(S) URLs
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }

    return urlObj.hostname;
  } catch (error) {
    // Invalid URL format
    return null;
  }
}

/**
 * Checks if a URL is in the page exceptions list (exact URL match only).
 * Use this to show "Allow this page" state without treating root URL as domain.
 *
 * @param url - The URL to check
 * @param exceptions - List of exception URLs (specific pages only)
 * @returns True if URL has an exact match in exceptions, false otherwise
 */
export function isPageInExceptions(url: string | undefined, exceptions: string[]): boolean {
  if (!url || exceptions.length === 0) {
    return false;
  }

  const normalizedUrl = normalizeUrl(url, false);
  if (!normalizedUrl) {
    return false;
  }

  return exceptions.some((exception) => {
    const normalizedException = normalizeException(exception);
    try {
      const exceptionNormalizedUrl = normalizeUrl(normalizedException, false);
      return exceptionNormalizedUrl === normalizedUrl;
    } catch {
      return normalizedException === normalizedUrl;
    }
  });
}

/**
 * Checks if a domain is in the domain exceptions list.
 * Use this for "Allow this domain" so root page and domain are independent.
 *
 * @param domain - The domain to check (e.g. www.sqtech.dev)
 * @param domainExceptions - List of exception domains (e.g. https://www.sqtech.dev)
 * @returns True if domain is in domainExceptions, false otherwise
 */
export function isDomainInExceptions(domain: string | null, domainExceptions: string[]): boolean {
  if (!domain || domainExceptions.length === 0) {
    return false;
  }

  return domainExceptions.some((exception) => {
    const normalizedException = normalizeException(exception);
    const exceptionDomain = extractDomain(normalizedException);
    return exceptionDomain === domain;
  });
}

/**
 * Checks if a URL is allowed (in exceptions for duplicate check).
 * True if the URL is in page exceptions (exact) OR its domain is in domain exceptions.
 * Used by tab detection.
 *
 * @param url - The URL to check
 * @param exceptions - List of page exception URLs
 * @param domainExceptions - List of domain exceptions
 * @returns True if duplicates are allowed for this URL
 */
export function isUrlAllowedForDuplicateCheck(
  url: string | undefined,
  exceptions: string[],
  domainExceptions: string[]
): boolean {
  if (!url) return false;
  const domain = extractDomain(url);
  return isPageInExceptions(url, exceptions) || isDomainInExceptions(domain, domainExceptions);
}

/**
 * Checks if a URL is in the exceptions list (legacy: both exact URL and domain match).
 * Used for backward compatibility with the global exceptions list.
 *
 * @param url - The URL to check
 * @param exceptions - List of exception URLs/domains
 * @returns True if URL is in exceptions, false otherwise
 */
export function isUrlInExceptions(url: string | undefined, exceptions: string[]): boolean {
  if (!url || exceptions.length === 0) {
    return false;
  }

  const normalizedUrl = normalizeUrl(url, false);
  const domain = extractDomain(url);

  if (!normalizedUrl && !domain) {
    return false;
  }

  return exceptions.some((exception) => {
    const normalizedException = normalizeException(exception);

    try {
      const exceptionNormalizedUrl = normalizeUrl(normalizedException, false);
      if (normalizedUrl && exceptionNormalizedUrl === normalizedUrl) {
        return true;
      }
    } catch {
      if (normalizedUrl && normalizedException === normalizedUrl) {
        return true;
      }
    }

    try {
      const exceptionUrlObj = new URL(normalizedException);
      const exceptionDomain = exceptionUrlObj.hostname;
      const exceptionPath = normalizePathname(exceptionUrlObj.pathname);

      if (domain && exceptionDomain === domain && exceptionPath === '/') {
        return true;
      }
    } catch {
      if (domain && normalizedException === domain) {
        return true;
      }
    }

    return false;
  });
}

