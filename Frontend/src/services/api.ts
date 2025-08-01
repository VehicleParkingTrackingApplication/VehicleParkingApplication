// @ts-check

const API_BASE = env() === "development" 
  ? "http://localhost:1313/api/" 
  : "/api/";

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @returns {string}
 */
export function getApiUrl(path: string, query?: URLSearchParams | Record<string, any>): string {
  const url = getApiUrlInternal(path, query);

  let returnUrl = "/";
  const returnUrlQuery = url.searchParams.get("returnUrl");

  if (returnUrlQuery) {
    const returnUrlObject = new URL(returnUrlQuery, window.location.href);
    returnUrlObject.searchParams.delete("error");
    returnUrl = returnUrlObject.toString();
  }

  url.searchParams.set("returnUrl", returnUrl);

  return url.toString();
}

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @returns {Promise<Response>}
 */
export async function fetchApi(path: string, query?: URLSearchParams | Record<string, any>): Promise<Response> {
  const url = getApiUrlInternal(path, query);

  const response = await fetch(url.toString(), {
    credentials: env() === "development" ? "include" : "same-origin",
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return response;
}

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @param {BodyInit=} body
 * @returns {Promise<Response>}
 */
export async function postApi(path: string, query?: URLSearchParams | Record<string, any>, body?: BodyInit): Promise<Response> {
  const url = getApiUrlInternal(path, query);

  const response = await fetch(url.toString(), {
    credentials: env() === "development" ? "include" : "same-origin",
    method: "POST",
    redirect: "manual",
    body: body,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return response;
}

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @param {BodyInit=} body
 * @returns {Promise<Response>}
 */
export async function putApi(path: string, query?: URLSearchParams | Record<string, any>, body?: BodyInit): Promise<Response> {
  const url = getApiUrlInternal(path, query);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url.toString(), {
    credentials: env() === "development" ? "include" : "same-origin",
    method: "PUT",
    body: body,
    headers: headers
  });

  return response;
}

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @returns {Promise<Response>}
 */
export async function deleteApi(path: string, query?: URLSearchParams | Record<string, any>): Promise<Response> {
  const url = getApiUrlInternal(path, query);

  const response = await fetch(url.toString(), {
    credentials: env() === "development" ? "include" : "same-origin",
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return response;
}

// Authenticated API functions that automatically handle token refresh
import { authInterceptor } from './authInterceptor';

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @returns {Promise<Response>}
 */
export async function fetchAuthApi(path: string, query?: URLSearchParams | Record<string, any>): Promise<Response> {
  const url = getApiUrlInternal(path, query);
  
  return authInterceptor.makeAuthenticatedRequest(url.toString(), {
    credentials: env() === "development" ? "include" : "same-origin",
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @param {BodyInit=} body
 * @returns {Promise<Response>}
 */
export async function postAuthApi(path: string, query?: URLSearchParams | Record<string, any>, body?: BodyInit): Promise<Response> {
  const url = getApiUrlInternal(path, query);
  
  return authInterceptor.makeAuthenticatedRequest(url.toString(), {
    credentials: env() === "development" ? "include" : "same-origin",
    method: "POST",
    redirect: "manual",
    body: body,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @param {BodyInit=} body
 * @returns {Promise<Response>}
 */
export async function putAuthApi(path: string, query?: URLSearchParams | Record<string, any>, body?: BodyInit): Promise<Response> {
  const url = getApiUrlInternal(path, query);
  
  return authInterceptor.makeAuthenticatedRequest(url.toString(), {
    credentials: env() === "development" ? "include" : "same-origin",
    method: "PUT",
    body: body,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @returns {Promise<Response>}
 */
export async function deleteAuthApi(path: string, query?: URLSearchParams | Record<string, any>): Promise<Response> {
  const url = getApiUrlInternal(path, query);
  
  return authInterceptor.makeAuthenticatedRequest(url.toString(), {
    credentials: env() === "development" ? "include" : "same-origin",
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @returns {URL}
 */
function getApiUrlInternal(path: string, query?: URLSearchParams | Record<string, any>): URL {
  let base = new URL(API_BASE, window.location.href);
  let url = new URL(path, base);

  if (query && !(query instanceof URLSearchParams)) {
    query = new URLSearchParams(query);
  }

  query?.forEach((value: string, key: string) => {
    url.searchParams.append(key, value);
  });

  return url;
}

/**
 * @returns { "development" | "production" }
 */
function env(): "development" | "production" {
  // @ts-ignore
  return process.env.NODE_ENV || "development";
}