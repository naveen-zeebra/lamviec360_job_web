import { apiRequest, setSeekerToken, removeSeekerToken } from "./client";

export async function registerSeeker({ name, email, password, phone = "" }) {
  const res = await apiRequest("/auth/register", {
    method: "POST",
    body: { full_name: name, email, password, phone },
  });
  const data = res?.data || res;
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
}

export async function verifySeekerEmail({ email, code }) {
  return apiRequest("/auth/verify-email", {
    method: "POST",
    body: { email, code },
    authType: "seeker",
  });
}

export async function sendVerificationEmail(email) {
  return apiRequest("/auth/send-verification-email", {
    method: "POST",
    body: { email },
    authType: "seeker",
  });
}

export async function forgotPassword(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword({ token, email, code, new_password }) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, email, code, new_password },
  });
}

export async function loginSeeker({ email, password }) {
  const res = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const data = res?.data || res;
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
}

export async function oauthSeekerLogin({
  provider,
  token = null,
  code = null,
  redirect_uri = null,
  code_verifier = null,
  email = null,
  name = null,
  avatar_url = null,
  provider_user_id = null,
}) {
  const res = await apiRequest("/auth/oauth/login", {
    method: "POST",
    body: {
      provider,
      token,
      code,
      redirect_uri,
      code_verifier,
      email,
      name,
      avatar_url,
      provider_user_id,
    },
  });
  const data = res?.data || res;
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
}

export async function googleSeekerLogin(payload = {}) {
  const body = {
    provider: "google",
    token: payload.token || null,
    code: payload.code || null,
    redirect_uri: payload.redirect_uri || null,
    email: payload.email || null,
    name: payload.name || null,
    avatar_url: payload.avatar_url || null,
    google_id: payload.google_id || payload.provider_user_id || "google_sso",
  };
  const res = await apiRequest("/auth/google", {
    method: "POST",
    body,
  });
  const data = res?.data || res;
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
}

export async function zaloSeekerLogin(payload = {}) {
  const body = {
    provider: "zalo",
    token: payload.token || null,
    code: payload.code || null,
    code_verifier: payload.code_verifier || null,
    redirect_uri: payload.redirect_uri || null,
    email: payload.email || null,
    name: payload.name || null,
    avatar_url: payload.avatar_url || null,
    zalo_id: payload.zalo_id || payload.provider_user_id || "zalo_sso",
  };
  const res = await apiRequest("/auth/zalo", {
    method: "POST",
    body,
  });
  const data = res?.data || res;
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
}

export async function linkedinSeekerLogin(payload = {}) {
  const body = {
    provider: "linkedin",
    token: payload.token || null,
    code: payload.code || null,
    redirect_uri: payload.redirect_uri || null,
    email: payload.email || null,
    name: payload.name || null,
    avatar_url: payload.avatar_url || null,
    linkedin_id: payload.linkedin_id || payload.provider_user_id || "linkedin_sso",
  };
  const res = await apiRequest("/auth/linkedin", {
    method: "POST",
    body,
  });
  const data = res?.data || res;
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
}

export async function facebookSeekerLogin(payload = {}) {
  const body = {
    provider: "facebook",
    token: payload.token || null,
    code: payload.code || null,
    redirect_uri: payload.redirect_uri || null,
    email: payload.email || null,
    name: payload.name || null,
    avatar_url: payload.avatar_url || null,
    facebook_id: payload.facebook_id || payload.provider_user_id || "facebook_sso",
  };
  const res = await apiRequest("/auth/facebook", {
    method: "POST",
    body,
  });
  const data = res?.data || res;
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
}

export async function getOAuthUrl(provider, redirectUri = null) {
  const params = redirectUri ? { redirect_uri: redirectUri } : null;
  const res = await apiRequest(`/auth/oauth/${provider}/url`, {
    method: "GET",
    params,
  });
  return res?.data || res;
}

export async function getOAuthProviders() {
  const res = await apiRequest("/auth/oauth/providers", {
    method: "GET",
  });
  return res?.data || res;
}

export async function getSeekerMe() {
  const res = await apiRequest("/auth/me", {
    method: "GET",
    authType: "seeker",
  });
  return res?.data || res;
}

export function logoutSeeker() {
  removeSeekerToken();
}
