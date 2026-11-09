import { apiRequest } from "./client.js";

export const SUPPORT_CATEGORIES = [
  { value: "ACCOUNT", label: { vi: "Tài khoản & Đăng nhập", en: "Account & Login" } },
  { value: "TECHNICAL", label: { vi: "Sự cố kỹ thuật", en: "Technical Issue" } },
  { value: "CONTENT", label: { vi: "Nội dung & Tin tuyển dụng", en: "Content & Job Listings" } },
  { value: "OTHER", label: { vi: "Hỗ trợ chung", en: "General Support" } },
];

export const SUPPORT_PRIORITIES = [
  { value: "LOW", label: { vi: "Thấp", en: "Low" } },
  { value: "MEDIUM", label: { vi: "Bình thường", en: "Medium" } },
  { value: "HIGH", label: { vi: "Cao", en: "High" } },
  { value: "URGENT", label: { vi: "Khẩn cấp", en: "Urgent" } },
];

/**
 * Submit a customer support case without requiring the user to know internal database IDs.
 */
export async function submitSupportTicket({
  subject,
  category = "ACCOUNT",
  priority = "MEDIUM",
  message,
  submitter_name,
  submitter_email,
  submitter_role = "JOBSEEKER",
  job_id = null,
  company_id = null,
  user_id = null,
}) {
  const numericUserId = user_id && !isNaN(Number(user_id)) && Number(user_id) > 0 ? Number(user_id) : null;
  return await apiRequest("/support/submit", {
    method: "POST",
    body: {
      subject,
      category,
      priority,
      message,
      submitter_name,
      submitter_email,
      submitter_role,
      job_id: job_id ? Number(job_id) : null,
      company_id: company_id ? Number(company_id) : null,
      user_id: numericUserId,
    },
  });
}

/**
 * Track an existing ticket and load public message thread with support staff replies.
 */
export async function trackSupportTicket(ticketNumber) {
  return await apiRequest(`/support/track/${encodeURIComponent(ticketNumber.trim())}`, {
    method: "GET",
  });
}

/**
 * Send a customer reply to the support thread.
 */
export async function replyToSupportTicket(ticketNumber, { message, submitter_name }) {
  return await apiRequest(`/support/track/${encodeURIComponent(ticketNumber.trim())}/reply`, {
    method: "POST",
    body: {
      message,
      submitter_name,
    },
  });
}


/**
 * List support tickets submitted by current jobseeker email.
 */
export async function listMySeekerTickets({ email, user_id } = {}) {
  const params = {};
  if (email && String(email).trim()) params.email = String(email).trim();
  const numericUserId = user_id && !isNaN(Number(user_id)) && Number(user_id) > 0 ? Number(user_id) : null;
  if (numericUserId) params.user_id = numericUserId;
  return await apiRequest("/support/my-tickets", {
    method: "GET",
    params,
    authType: "seeker",
  });
}
