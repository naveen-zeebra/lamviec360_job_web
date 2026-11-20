import { API_BASE_URL, EMPLOYER_URL, API_TIMEOUT, API_TARGET, S3_IMAGE_BASE_URL } from "../../config/index.js";
import { AppStorage, STORAGE_CONFIG, getScopedKey } from "../storage/index.js";

export { API_BASE_URL, EMPLOYER_URL, API_TIMEOUT, API_TARGET, S3_IMAGE_BASE_URL, AppStorage, STORAGE_CONFIG };

export const SEEKER_TOKEN_KEY = getScopedKey(STORAGE_CONFIG.keys.SEEKER_TOKEN.key);
export const SEEKER_REFRESH_TOKEN_KEY = getScopedKey(STORAGE_CONFIG.keys.SEEKER_REFRESH_TOKEN.key);
export const COMPANY_TOKEN_KEY = getScopedKey(STORAGE_CONFIG.keys.COMPANY_TOKEN.key);

export function getSeekerToken() {
  return AppStorage.get(STORAGE_CONFIG.keys.SEEKER_TOKEN);
}

export function setSeekerToken(token) {
  if (token) {
    AppStorage.set(STORAGE_CONFIG.keys.SEEKER_TOKEN, token);
  } else {
    AppStorage.remove(STORAGE_CONFIG.keys.SEEKER_TOKEN);
  }
}

export function removeSeekerToken() {
  AppStorage.remove(STORAGE_CONFIG.keys.SEEKER_TOKEN);
}

export function getSeekerRefreshToken() {
  return AppStorage.get(STORAGE_CONFIG.keys.SEEKER_REFRESH_TOKEN);
}

export function setSeekerRefreshToken(token) {
  if (token) {
    AppStorage.set(STORAGE_CONFIG.keys.SEEKER_REFRESH_TOKEN, token);
  } else {
    AppStorage.remove(STORAGE_CONFIG.keys.SEEKER_REFRESH_TOKEN);
  }
}

export function removeSeekerRefreshToken() {
  AppStorage.remove(STORAGE_CONFIG.keys.SEEKER_REFRESH_TOKEN);
}

export function getCompanyToken() {
  return AppStorage.get(STORAGE_CONFIG.keys.COMPANY_TOKEN);
}

export function setCompanyToken(token) {
  if (token) {
    AppStorage.set(STORAGE_CONFIG.keys.COMPANY_TOKEN, token);
  } else {
    AppStorage.remove(STORAGE_CONFIG.keys.COMPANY_TOKEN);
  }
}

export function removeCompanyToken() {
  AppStorage.remove(STORAGE_CONFIG.keys.COMPANY_TOKEN);
}

let seekerRefreshPromise = null;

async function tryRefreshSeekerToken() {
  const refreshToken = getSeekerRefreshToken();
  if (!refreshToken) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      removeSeekerToken();
      removeSeekerRefreshToken();
      return null;
    }
    const json = await res.json();
    const newAccessToken = json?.data?.access_token || json?.access_token;
    const newRefreshToken = json?.data?.refresh_token || json?.refresh_token;
    if (newAccessToken) {
      setSeekerToken(newAccessToken);
      if (newRefreshToken) {
        setSeekerRefreshToken(newRefreshToken);
      }
      return newAccessToken;
    }
  } catch (_) {
    removeSeekerToken();
    removeSeekerRefreshToken();
    return null;
  }
  return null;
}

export async function apiRequest(endpoint, { method = "GET", body, headers = {}, authType = null, params = null } = {}) {
  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.append(k, v);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const reqHeaders = { ...headers };

  if (body && !(body instanceof FormData) && !reqHeaders["Content-Type"]) {
    reqHeaders["Content-Type"] = "application/json";
  }

  if (authType === "seeker") {
    const token = getSeekerToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  } else if (authType === "company") {
    const token = getCompanyToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const config = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      // Automatic token refresh on 401 for seeker authenticated requests
      if (
        res.status === 401 &&
        authType === "seeker" &&
        !endpoint.includes("/auth/refresh") &&
        !endpoint.includes("/auth/login") &&
        !endpoint.includes("/auth/register")
      ) {
        if (!seekerRefreshPromise) {
          seekerRefreshPromise = tryRefreshSeekerToken().finally(() => {
            seekerRefreshPromise = null;
          });
        }
        const newToken = await seekerRefreshPromise;
        if (newToken) {
          // Retry the original request with the fresh token
          reqHeaders["Authorization"] = `Bearer ${newToken}`;
          const retryRes = await fetch(url, { ...config, headers: reqHeaders });
          if (retryRes.ok) {
            const retryCt = retryRes.headers.get("content-type");
            return retryCt && retryCt.includes("application/json") ? await retryRes.json() : await retryRes.text();
          }
        }

        // If refresh failed or no refresh token exists, clear expired token and redirect to login
        removeSeekerToken();
        removeSeekerRefreshToken();
        AppStorage.remove(STORAGE_CONFIG.keys.SEEKER_AUTH);
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }

      let errorMsg = `Request failed with status ${res.status}`;
      if (data && typeof data === "object") {
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          errorMsg = data.detail.map((d) => d.msg || (typeof d === "string" ? d : JSON.stringify(d))).join(", ");
        } else if (typeof data.message === "string") {
          errorMsg = data.message;
        }
      }
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.warn(`API Error [${method} ${endpoint}]:`, error.message || error);
    throw error;
  }
}
