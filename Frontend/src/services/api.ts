// @ts-check

const API_BASE = env() === "development" 
  ? "http://localhost:1313/api/" 
  : "/api/";

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @returns {string}
 */
export function getApiUrl(path: string, query?: URLSearchParams | Record<string, unknown>): string {
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
export async function fetchApi(path: string, query?: URLSearchParams | Record<string, unknown>): Promise<Response> {
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
export async function postApi(path: string, query?: URLSearchParams | Record<string, unknown>, body?: BodyInit): Promise<Response> {
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
export async function putApi(path: string, query?: URLSearchParams | Record<string, unknown>, body?: BodyInit): Promise<Response> {
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
export async function deleteApi(path: string, query?: URLSearchParams | Record<string, unknown>): Promise<Response> {
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

/**
 * @param {string} path
 * @param {URLSearchParams | Record<string, any>=} query
 * @returns {URL}
 */
function getApiUrlInternal(path: string, query?: URLSearchParams | Record<string, unknown>): URL {
  const base = new URL(API_BASE, window.location.href);
  const url = new URL(path, base);

 if (query && !(query instanceof URLSearchParams)) {
  const stringQuery: Record<string, string> = Object.fromEntries(
    Object.entries(query).map(([k, v]) => [k, String(v)])
  );
  query = new URLSearchParams(stringQuery);
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
  // @ts-expect-ignore
  const mode = process.env.NODE_ENV || "development";
  return mode === "production" ? "production" : "development";
}