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

export async function googleSeekerLogin({ email, name, google_id = "google_sso" }) {
  const res = await apiRequest("/auth/google", {
    method: "POST",
    body: { email, name, google_id },
  });
  const data = res?.data || res;
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
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
