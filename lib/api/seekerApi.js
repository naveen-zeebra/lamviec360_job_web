import { apiRequest, API_BASE_URL, getSeekerToken } from "./client";
import { syncUploadConfig } from "../../config/uploadConfig.js";

export async function getSeekerProfile() {
  const res = await apiRequest("/profile", {
    method: "GET",
    authType: "seeker",
  });
  return res?.data || res;
}

export function mapProfileToBackendPayload(profile) {
  if (!profile) return {};
  const personal = profile.personal || {};
  const professional = profile.professional || {};
  const preferences = profile.preferences || {};
  const resume = profile.resume || {};

  let expYears = 0;
  if (professional.experience) {
    const match = String(professional.experience).match(/\d+/);
    if (match) expYears = parseFloat(match[0]);
  }

  let expectedSalary = null;
  if (preferences.salary) {
    const raw = String(preferences.salary).replace(/,/g, "").trim();
    const matchM = raw.match(/(\d+(\.\d+)?)\s*M/i);
    if (matchM) {
      expectedSalary = parseFloat(matchM[1]) * 1000000;
    } else {
      const matchNum = raw.match(/\d+/);
      if (matchNum) {
        const num = parseFloat(matchNum[0]);
        expectedSalary = num < 1000 ? num * 1000000 : num;
      }
    }
  }

  // BR-101-05: Bound salary expectation to 1M-500M VND
  if (expectedSalary !== null) {
    if (expectedSalary < 1000000) expectedSalary = 1000000;
    if (expectedSalary > 500000000) expectedSalary = 500000000;
  }

  const skillsStr = Array.isArray(professional.skills)
    ? professional.skills.join(", ")
    : professional.skills || "";

  const visibilityStr = profile.settings?.privacy?.profileVisibility || profile.visibility || "Public to employers";
  const isPublic = !visibilityStr.toLowerCase().includes("private");

  return {
    full_name: personal.fullName || undefined,
    phone: personal.phone !== undefined && personal.phone !== null ? String(personal.phone).trim() : undefined,
    avatar_url: personal.photo || undefined,
    headline: professional.title || (preferences.roles && preferences.roles[0]) || undefined,
    city: personal.location || (preferences.locations && preferences.locations[0]) || undefined,
    country: "Vietnam",
    skills: skillsStr || undefined,
    experience_years: expYears || 0,
    expected_salary: expectedSalary || undefined,
    resume_url: resume.fileName || (resume.dataUrl ? "resume.pdf" : undefined),
    is_visible: isPublic,
    visibility: isPublic ? "public" : "private",
  };
}

export async function updateSeekerProfile(data) {
  const payload =
    data?.personal || data?.professional || data?.preferences
      ? mapProfileToBackendPayload(data)
      : data;

  const res = await apiRequest("/profile", {
    method: "PUT",
    authType: "seeker",
    body: payload,
  });
  return res?.data || res;
}

export function resumePublicHref(fileUrl) {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("data:") || fileUrl.startsWith("blob:") || /^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }
  const origin = String(API_BASE_URL || "").replace(/\/api\/v1\/jobseeker\/?$/i, "");
  return `${origin}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
}

export function avatarPublicHref(fileUrl) {
  return resumePublicHref(fileUrl);
}

export async function uploadSeekerAvatar(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiRequest("/profile/avatar", {
    method: "POST",
    authType: "seeker",
    body: form,
  });
  return res?.data || res;
}

export async function listSeekerResumes() {
  const res = await apiRequest("/profile/resumes", {
    method: "GET",
    authType: "seeker",
  });
  return res?.data || res;
}

export async function uploadSeekerResume(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiRequest("/profile/resumes", {
    method: "POST",
    authType: "seeker",
    body: form,
  });
  return res?.data || res;
}

export async function setDefaultSeekerResume(resumeId) {
  const res = await apiRequest(`/profile/resumes/${resumeId}/default`, {
    method: "PATCH",
    authType: "seeker",
  });
  return res?.data || res;
}

export async function saveSeekerResume({ fileName, size = 0, mimeType = "", dataUrl = "", file = null } = {}) {
  if (file) {
    return uploadSeekerResume(file);
  }
  try {
    return await apiRequest("/profile/resumes", {
      method: "POST",
      authType: "seeker",
      body: {
        file_name: fileName,
        size,
        mime_type: mimeType,
        data_url: dataUrl,
      },
    });
  } catch (e) {
    console.warn("saveSeekerResume fallback:", e.message);
    return { success: true };
  }
}

export async function fetchSeekerResumeDownload(resumeId) {
  try {
    return await apiRequest(`/profile/resumes/${resumeId}/download`, {
      method: "GET",
      authType: "seeker",
    });
  } catch (e) {
    console.warn("fetchSeekerResumeDownload fallback:", e.message);
    return null;
  }
}

export async function removeSeekerResume(resumeId) {
  if (!resumeId) {
    return { success: true };
  }
  const res = await apiRequest(`/profile/resumes/${resumeId}`, {
    method: "DELETE",
    authType: "seeker",
  });
  return res?.data || res;
}

export async function fetchSeekerApplications() {
  const res = await apiRequest("/applications", {
    method: "GET",
    authType: "seeker",
  });
  return res?.data || (Array.isArray(res) ? res : []);
}

export async function applyToJob(jobId, {
  resumeFileName = "",
  resumeUrl = "",
  resumeId = null,
  resumeFile = null,
  resumeName = "",
  saveToProfile = true,
  coverLetter = "",
  answers = {},
  consent = true,
} = {}) {
  if (resumeFile) {
    const form = new FormData();
    form.append("job_id", String(Number(jobId)));
    form.append("cover_letter", coverLetter || "");
    if (resumeId) form.append("resume_id", String(resumeId));
    if (resumeName) form.append("resume_name", resumeName);
    form.append("save_to_profile", saveToProfile ? "true" : "false");
    form.append("consent", consent ? "true" : "false");
    form.append("file", resumeFile);
    const res = await apiRequest("/applications", {
      method: "POST",
      authType: "seeker",
      body: form,
    });
    return res?.data || res;
  }
  const res = await apiRequest("/applications", {
    method: "POST",
    authType: "seeker",
    body: {
      job_id: Number(jobId),
      cover_letter: coverLetter || "",
      resume_id: resumeId || undefined,
      resume_name: resumeName || resumeFileName || undefined,
      resume_url: resumeUrl || resumeFileName || "",
      save_to_profile: saveToProfile,
      consent: !!consent,
    },
  });
  return res?.data || res;
}

export async function fetchApplicationDetail(appId) {
  const res = await apiRequest(`/applications/${appId}`, {
    method: "GET",
    authType: "seeker",
  });
  return res?.data || res;
}

export async function withdrawApplication(appId) {
  const res = await apiRequest(`/applications/${appId}/withdraw`, {
    method: "POST",
    authType: "seeker",
  });
  return res?.data || res;
}


export async function fetchSavedJobs() {
  const res = await apiRequest("/profile/saved-jobs", {
    method: "GET",
    authType: "seeker",
  });
  return res?.data || (Array.isArray(res) ? res : []);
}

export async function saveJob(jobId) {
  const num = Number(jobId);
  if (isNaN(num)) return { success: false, message: "Invalid job ID" };
  const res = await apiRequest(`/profile/saved-jobs/${num}`, {
    method: "POST",
    authType: "seeker",
  });
  return res?.data || res;
}

export async function unsaveJob(jobId) {
  const num = Number(jobId);
  if (isNaN(num)) return { success: false, message: "Invalid job ID" };
  const res = await apiRequest(`/profile/saved-jobs/${num}`, {
    method: "DELETE",
    authType: "seeker",
  });
  return res?.data || res;
}

export async function toggleSavedJob(jobId, currentlySaved) {
  if (currentlySaved) {
    return unsaveJob(jobId);
  } else {
    return saveJob(jobId);
  }
}

export async function fetchSeekerInterviews() {
  try {
    return await apiRequest("/interviews", {
      method: "GET",
      authType: "seeker",
    });
  } catch (e) {
    return [];
  }
}

export async function respondToInterview(id, status, note = "") {
  try {
    return await apiRequest(`/interviews/${id}/respond`, {
      method: "POST",
      authType: "seeker",
      body: {
        status,
        note,
      },
    });
  } catch (e) {
    return { success: true };
  }
}

export async function fetchSeekerNotifications() {
  try {
    const res = await apiRequest("/notifications", {
      method: "GET",
      authType: "seeker",
    });
    return res?.data || (Array.isArray(res) ? res : []);
  } catch (e) {
    return [];
  }
}

export async function markSeekerNotificationRead(id) {
  try {
    const res = await apiRequest(`/notifications/${id}/read`, {
      method: "PATCH",
      authType: "seeker",
    });
    return res?.data || { success: true };
  } catch (e) {
    return { success: true };
  }
}

export async function renameSeekerResume(resumeId, resumeName) {
  const res = await apiRequest(`/profile/resumes/${resumeId}`, {
    method: "PATCH",
    authType: "seeker",
    body: { resume_name: resumeName },
  });
  return res?.data || res;
}

export async function fetchProfileCompleteness() {
  try {
    const res = await apiRequest("/profile/completeness", {
      method: "GET",
      authType: "seeker",
    });
    return res?.data || res;
  } catch (e) {
    return null;
  }
}

export async function fetchSeekerDocuments(category = "all") {
  try {
    const res = await apiRequest(`/profile/documents?category=${encodeURIComponent(category)}`, {
      method: "GET",
      authType: "seeker",
    });
    return res?.data || { items: [], usage: { used_bytes: 0, percent_used: 0 } };
  } catch (e) {
    return { items: [], usage: { used_bytes: 0, percent_used: 0 } };
  }
}

export async function uploadSeekerDocument(file, category = "other", title = "") {
  const safeCategory = (category || "other").trim().toLowerCase();
  const form = new FormData();
  form.append("file", file);
  form.append("category", safeCategory);
  if (title) form.append("title", title);

  const res = await apiRequest(`/profile/documents?category=${encodeURIComponent(safeCategory)}`, {
    method: "POST",
    authType: "seeker",
    body: form,
  });
  return res?.data || res;
}

export async function deleteSeekerDocument(docId) {
  const res = await apiRequest(`/profile/documents/${docId}`, {
    method: "DELETE",
    authType: "seeker",
  });
  return res?.data || res;
}

export async function fetchUploadConfig() {
  try {
    const res = await apiRequest("/profile/upload-config", {
      method: "GET",
      authType: "seeker",
    });
    const data = res?.data || res;
    if (data && (data.AVATAR || data.RESUME || data.DOCUMENT_ARCHIVE)) {
      syncUploadConfig(data);
    }
    return data;
  } catch (e) {
    console.warn("fetchUploadConfig fallback to local defaults:", e?.message);
    return null;
  }
}

export function triggerBlobDownload(blob, fallbackFileName = "download") {
  if (typeof window === "undefined" || !blob) return;
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = blobUrl;
  a.download = fallbackFileName || "download";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
  }, 200);
}

function extractFilenameFromHeader(disposition, fallbackFileName) {
  let filename = fallbackFileName;
  if (disposition && disposition.includes("filename")) {
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;\s]+)/i);
    if (utf8Match && utf8Match[1]) {
      try {
        filename = decodeURIComponent(utf8Match[1]);
      } catch (_) {
        filename = utf8Match[1];
      }
    } else {
      const match = disposition.match(/filename=["']?([^"';\n]+)["']?/i);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }
  }
  return filename;
}

export async function downloadSeekerResume(resumeId, fallbackFileName = "resume.pdf") {
  const token = getSeekerToken();
  const url = `${API_BASE_URL}/profile/resumes/${resumeId}/download`;
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Failed to download résumé (${res.status})`);
  }
  const disposition = res.headers.get("content-disposition");
  const filename = extractFilenameFromHeader(disposition, fallbackFileName);
  const blob = await res.blob();
  triggerBlobDownload(blob, filename);
}

export async function downloadSeekerDocument(docId, fallbackFileName = "document") {
  const token = getSeekerToken();
  const url = `${API_BASE_URL}/profile/documents/${docId}/download`;
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Failed to download document (${res.status})`);
  }
  const disposition = res.headers.get("content-disposition");
  const filename = extractFilenameFromHeader(disposition, fallbackFileName);
  const blob = await res.blob();
  triggerBlobDownload(blob, filename);
}

export async function downloadFileFromUrl(fileUrl, fallbackFileName = "download") {
  if (!fileUrl) throw new Error("No URL provided");
  if (fileUrl.startsWith("data:")) {
    const res = await fetch(fileUrl);
    const blob = await res.blob();
    triggerBlobDownload(blob, fallbackFileName);
    return;
  }
  const fullUrl = resumePublicHref(fileUrl);
  const token = getSeekerToken();
  const headers = {};
  if (token && fullUrl.startsWith(API_BASE_URL)) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(fullUrl, { headers });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  triggerBlobDownload(blob, fallbackFileName);
}


