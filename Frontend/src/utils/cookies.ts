/**
 * Cookie utility functions for secure token management
 */

/**
 * Set a cookie with secure defaults
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
export function setCookie(
  name: string, 
  value: string, 
  options: {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  } = {}
): void {
  const {
    maxAge = 60 * 60 * 24, // 1 day default
    path = '/',
    domain,
    secure = process.env.NODE_ENV === 'production', // Only secure in production
    sameSite = 'Strict'
  } = options;

  let cookieString = `${name}=${encodeURIComponent(value)}`;

  if (maxAge) {
    cookieString += `; max-age=${maxAge}`;
  }

  if (path) {
    cookieString += `; path=${path}`;
  }

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += '; secure';
  }

  if (sameSite) {
    cookieString += `; SameSite=${sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  
  return null;
}

/**
 * Delete a cookie by setting it to expire in the past
 * @param name - Cookie name
 * @param path - Cookie path (must match the path used when setting)
 */
export function deleteCookie(name: string, path: string = '/'): void {
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Check if a cookie exists
 * @param name - Cookie name
 * @returns True if cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Get all cookies as an object
 * @returns Object with cookie names as keys and values as values
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  if (document.cookie) {
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  
  return cookies;
} 