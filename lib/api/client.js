import { API_BASE_URL, EMPLOYER_URL, API_TIMEOUT } from "../../config/index.js";

export { API_BASE_URL, EMPLOYER_URL, API_TIMEOUT };

export const SEEKER_TOKEN_KEY = "lv360_seeker_token";
export const SEEKER_REFRESH_TOKEN_KEY = "lv360_seeker_refresh_token";
export const COMPANY_TOKEN_KEY = "lv360_company_token";

export function getSeekerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SEEKER_TOKEN_KEY);
}

export function setSeekerToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(SEEKER_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SEEKER_TOKEN_KEY);
  }
}

export function removeSeekerToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SEEKER_TOKEN_KEY);
}

export function getSeekerRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SEEKER_REFRESH_TOKEN_KEY);
}

export function setSeekerRefreshToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(SEEKER_REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SEEKER_REFRESH_TOKEN_KEY);
  }
}

export function removeSeekerRefreshToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SEEKER_REFRESH_TOKEN_KEY);
}

export function getCompanyToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COMPANY_TOKEN_KEY);
}

export function setCompanyToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(COMPANY_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(COMPANY_TOKEN_KEY);
  }
}

export function removeCompanyToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COMPANY_TOKEN_KEY);
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

let refreshPromise = null;

async function tryRefreshSeekerToken() {
  const refreshToken = getSeekerRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      removeSeekerToken();
      removeSeekerRefreshToken();
      return null;
    }
    const json = await res.json();
    const newAccessToken = json?.data?.access_token || json?.access_token;
    if (newAccessToken) {
      setSeekerToken(newAccessToken);
      return newAccessToken;
    }
  } catch (_) {
    return null;
  }
  return null;
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
        if (!refreshPromise) {
          refreshPromise = tryRefreshSeekerToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          // Retry the original request with the fresh token
          reqHeaders["Authorization"] = `Bearer ${newToken}`;
          const retryRes = await fetch(url, { ...config, headers: reqHeaders });
          if (retryRes.ok) {
            const retryCt = retryRes.headers.get("content-type");
            return retryCt && retryCt.includes("application/json") ? await retryRes.json() : await retryRes.text();
          }
        }

        // If refresh failed or no refresh token exists, clear expired token
        removeSeekerToken();
        removeSeekerRefreshToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("lv360-auth-expired"));
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
