/** URL comparison and normalization for duplicate tab detection. */

function normalizePathname(pathname: string): string {
  if (pathname === '/' || pathname === '') {
    return '/';
  }
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function normalizeUrl(url: string | undefined, ignoreParameters: boolean): string | null {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }

    const normalizedPathname = normalizePathname(urlObj.pathname);

    const isDefaultPort =
      (urlObj.protocol === 'http:' && urlObj.port === '80') ||
      (urlObj.protocol === 'https:' && urlObj.port === '443') ||
      urlObj.port === '';
    const host = isDefaultPort ? urlObj.hostname : `${urlObj.hostname}:${urlObj.port}`;

    if (ignoreParameters) {
      return `${urlObj.protocol}//${host}${normalizedPathname}`;
    }
    return `${urlObj.protocol}//${host}${normalizedPathname}${urlObj.search}`;
  } catch (error) {
    return null;
  }
}

export function normalizeException(exception: string): string {
  if (!exception || !exception.trim()) {
    return exception;
  }

  const trimmed = exception.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function extractDomain(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return urlObj.hostname;
  } catch (error) {
    return null;
  }
}

/** Exact URL match only; used for "Allow this page" so root URL ≠ whole domain. */
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

/** True if URL is in page exceptions (exact) or its domain is in domain exceptions; used by tab detection. */
export function isUrlAllowedForDuplicateCheck(
  url: string | undefined,
  exceptions: string[],
  domainExceptions: string[]
): boolean {
  if (!url) return false;
  const domain = extractDomain(url);
  return isPageInExceptions(url, exceptions) || isDomainInExceptions(domain, domainExceptions);
}

/** Legacy: both exact URL and domain match for backward compatibility. */
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

