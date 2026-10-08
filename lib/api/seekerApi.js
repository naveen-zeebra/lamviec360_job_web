import { apiRequest } from "./client";

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

export async function saveSeekerResume({ fileName, size = 0, mimeType = "", dataUrl = "" }) {
  try {
    return await apiRequest("/seeker/resume", {
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

export async function fetchSeekerResumeDownload() {
  try {
    return await apiRequest("/seeker/resume/download", {
      method: "GET",
      authType: "seeker",
    });
  } catch (e) {
    console.warn("fetchSeekerResumeDownload fallback:", e.message);
    return null;
  }
}

export async function removeSeekerResume() {
  try {
    return await apiRequest("/seeker/resume", {
      method: "DELETE",
      authType: "seeker",
    });
  } catch (e) {
    console.warn("removeSeekerResume fallback:", e.message);
    return { success: true };
  }
}

export async function fetchSeekerApplications() {
  const res = await apiRequest("/applications", {
    method: "GET",
    authType: "seeker",
  });
  return res?.data || (Array.isArray(res) ? res : []);
}

export async function applyToJob(jobId, { resumeFileName = "", resumeUrl = "", coverLetter = "", answers = {} } = {}) {
  const res = await apiRequest("/applications", {
    method: "POST",
    authType: "seeker",
    body: {
      job_id: Number(jobId),
      cover_letter: coverLetter || "",
      resume_url: resumeUrl || resumeFileName || "",
    },
  });
  return res?.data || res;
}

export async function withdrawApplication(appId) {
  try {
    return await apiRequest(`/applications/${appId}/withdraw`, {
      method: "POST",
      authType: "seeker",
    });
  } catch (e) {
    console.warn("withdrawApplication fallback:", e.message);
    return { success: true };
  }
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
