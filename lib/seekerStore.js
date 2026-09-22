
import * as seekerAuth from "./api/seekerAuth";
import * as seekerApi from "./api/seekerApi";
import { getSeekerToken, removeSeekerToken } from "./api/client";

const KEY = "lv360-seeker-store-v1";

export const STAGES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Offer Sent",
  "Hired",
  "Rejected",
  "Withdrawn",
];

export const STAGE_TYPICAL = {
  Applied: "Typical: 1-2 days",
  "Under Review": "Typical: 2-4 days",
  Shortlisted: "Typical: 3-5 days",
  "Interview Scheduled": "Typical: 5-7 days",
  "Offer Sent": "Typical: 2-3 days",
  Hired: "",
  Rejected: "",
  Withdrawn: "",
};

function emptyStore() {
  return {
    initialized: false,
    auth: { loggedIn: false, emailVerified: false, name: "", email: "" },
    profile: {
      personal: { fullName: "", photo: "", phone: "", location: "" },
      professional: { title: "", experience: "", industry: "", skills: [] },
      languages: [],
      education: [],
      experience: [],
      resume: { fileName: "", uploadedAt: "", size: 0, type: "", dataUrl: "" },
      preferences: { roles: [], locations: [], workMode: "", salary: "" },
    },
    savedJobs: [],
    applications: [],
    notifications: [],
    settings: {
      notifications: { jobRecs: true, appUpdates: true, interviewAlerts: true, marketing: false },
      privacy: { profileVisibility: "Public to employers", resumeVisibility: "Visible when I apply" },
    },
  };
}

let memStore = null;

function read() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      // Preserve large in-memory dataUrl if localStorage version stripped it to avoid quota
      if (
        memStore?.profile?.resume?.dataUrl &&
        !parsed.profile?.resume?.dataUrl &&
        parsed.profile?.resume?.fileName === memStore.profile.resume.fileName
      ) {
        parsed.profile.resume.dataUrl = memStore.profile.resume.dataUrl;
      }
      memStore = parsed;
      return parsed;
    }
  } catch (e) {}
  return memStore;
}

function write(store) {
  memStore = store;
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(store));
    }
  } catch (e) {
    // Quota exceeded: store metadata with dataUrl stripped so localStorage doesn't fail
    try {
      if (typeof window !== "undefined" && store.profile?.resume?.dataUrl) {
        const safeStore = {
          ...store,
          profile: {
            ...store.profile,
            resume: {
              ...(store.profile?.resume || {}),
              dataUrl: "",
            },
          },
        };
        localStorage.setItem(KEY, JSON.stringify(safeStore));
      }
    } catch (e2) {}
  }
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lv360-store"));
    }
  } catch (e) {}
  return store;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function computeCompleteness(profile) {
  if (!profile) return 0;
  const p = profile.personal || {};
  const pr = profile.professional || {};
  const pref = profile.preferences || {};
  const checks = [
    !!p.fullName,
    !!p.phone,
    !!p.location,
    !!pr.title,
    !!pr.industry,
    (pr.skills || []).length > 0,
    (profile.education || []).length > 0,
    (profile.experience || []).length > 0,
    !!(profile.resume && profile.resume.fileName),
    (pref.roles || []).length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function getStore() {
  const existing = read();
  if (existing) {
    if (existing.profile) {
      existing.profile.resume = { fileName: "", uploadedAt: "", size: 0, type: "", dataUrl: "", ...existing.profile.resume };
    }
    return existing;
  }
  return write(emptyStore());
}



// ---- BACKEND SYNC --------------------------------------------------------

export async function syncSeekerWithBackend() {
  const token = getSeekerToken();
  if (!token) return getStore();

  const store = getStore();
  try {
    const [me, profileRes, appsRes, savedRes, notifsRes] = await Promise.allSettled([
      seekerAuth.getSeekerMe(),
      seekerApi.getSeekerProfile(),
      seekerApi.fetchSeekerApplications(),
      seekerApi.fetchSavedJobs(),
      seekerApi.fetchSeekerNotifications(),
    ]);

    if (me.status === "fulfilled" && me.value) {
      store.auth = {
        loggedIn: true,
        emailVerified: !!me.value.email_verified,
        name: me.value.name || store.auth.name,
        email: me.value.email || store.auth.email,
        userId: me.value.user_id,
        role: me.value.role,
      };
    }

    if (profileRes.status === "fulfilled" && profileRes.value) {
      const p = profileRes.value;
      const current = store.profile || emptyStore().profile;

      let skillsArr = current.professional?.skills || [];
      if (Array.isArray(p.skills)) {
        skillsArr = p.skills;
      } else if (typeof p.skills === "string" && p.skills.trim()) {
        skillsArr = p.skills.split(",").map((s) => s.trim()).filter(Boolean);
      }

      let expRange = current.professional?.experience || "";
      if (!expRange && p.experience_years !== undefined && p.experience_years !== null) {
        const y = Number(p.experience_years);
        if (y < 1) expRange = "Less than 1 year";
        else if (y <= 3) expRange = "1-3 years";
        else if (y <= 5) expRange = "3-5 years";
        else if (y <= 10) expRange = "5-10 years";
        else expRange = "10+ years";
      }

      let salaryStr = current.preferences?.salary || "";
      if (!salaryStr && p.expected_salary) {
        const s = Number(p.expected_salary);
        if (s >= 1000000) salaryStr = `${Math.round(s / 1000000)}M VND`;
        else salaryStr = `${s.toLocaleString()} VND`;
      }

      store.profile = {
        ...current,
        personal: {
          fullName:
            p.full_name ||
            p.personal?.fullName ||
            current.personal?.fullName ||
            store.auth.name ||
            "",
          photo:
            p.avatar_url ||
            p.personal?.photo ||
            current.personal?.photo ||
            "",
          photoName:
            current.personal?.photoName ||
            (p.avatar_url ? "avatar.jpg" : ""),
          phone:
            p.phone ||
            p.personal?.phone ||
            current.personal?.phone ||
            "",
          location:
            p.city ||
            p.personal?.location ||
            current.personal?.location ||
            "",
        },
        professional: {
          title:
            p.headline ||
            p.professional?.title ||
            current.professional?.title ||
            "",
          experience: expRange,
          industry: current.professional?.industry || "Technology",
          skills: skillsArr,
        },
        languages: current.languages || [],
        education: current.education || [],
        experience: current.experience || [],
        resume: {
          fileName:
            p.resume_url ||
            current.resume?.fileName ||
            "",
          uploadedAt:
            current.resume?.uploadedAt ||
            (p.resume_url ? new Date().toISOString().slice(0, 10) : ""),
          size: current.resume?.size || 0,
          type: current.resume?.type || "application/pdf",
          dataUrl: current.resume?.dataUrl || "",
        },
        preferences: {
          roles: current.preferences?.roles?.length
            ? current.preferences.roles
            : p.headline
            ? [p.headline]
            : [],
          locations: current.preferences?.locations?.length
            ? current.preferences.locations
            : p.city
            ? [p.city]
            : [],
          workMode: current.preferences?.workMode || "Remote",
          salary: salaryStr,
        },
      };
      write(store);
    }

    if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value)) {
      store.applications = appsRes.value;
    }

    if (savedRes.status === "fulfilled" && Array.isArray(savedRes.value)) {
      store.savedJobs = savedRes.value;
    }

    if (notifsRes.status === "fulfilled" && Array.isArray(notifsRes.value)) {
      store.notifications = notifsRes.value;
    }

    store.initialized = true;
    write(store);
  } catch (err) {
    console.warn("Could not sync seeker store with backend:", err.message);
  }

  return store;
}

// Auto-sync if token is available on client load
if (typeof window !== "undefined") {
  setTimeout(() => {
    if (getSeekerToken()) {
      syncSeekerWithBackend();
    }
  }, 100);
}

// ---- AUTH ACTIONS --------------------------------------------------------

export async function registerDraft(name, email, password = null) {
  const store = getStore();
  store.initialized = true;
  store.auth = { loggedIn: false, emailVerified: false, name, email };
  store.profile.personal.fullName = name;
  write(store);

  if (password) {
    try {
      await seekerAuth.registerSeeker({ name, email, password });
    } catch (e) {
      console.warn("Backend register error, kept in local draft:", e.message);
      throw e;
    }
  }
  return store;
}

export async function verifyEmail(email, code = "123456") {
  const store = getStore();
  const targetEmail = email || store.auth.email;
  try {
    await seekerAuth.verifySeekerEmail({ email: targetEmail, code });
  } catch (e) {
    console.warn("Backend email verify error:", e.message);
    throw e;
  }
  store.auth.emailVerified = true;
  return write(store);
}

export async function sendVerificationCode(email) {
  const store = getStore();
  const targetEmail = email || store.auth.email;
  if (!targetEmail) throw new Error("Email is required");
  return seekerAuth.sendVerificationEmail(targetEmail);
}

export async function requestPasswordReset(email) {
  if (!email) throw new Error("Email is required");
  return seekerAuth.forgotPassword(email);
}

export async function completePasswordReset({ token, email, code, newPassword }) {
  if (!newPassword) throw new Error("New password is required");
  return seekerAuth.resetPassword({
    token,
    email,
    code,
    new_password: newPassword,
  });
}

export async function login(email, password) {
  if (email && password) {
    try {
      const data = await seekerAuth.loginSeeker({ email, password });
      const store = getStore();
      store.initialized = true;
      store.auth = {
        loggedIn: true,
        emailVerified: !!data.email_verified,
        name: data.name,
        email: data.email,
        userId: data.user_id,
        role: data.role,
      };
      write(store);
      await syncSeekerWithBackend();
      return store;
    } catch (err) {
      console.warn("API login failed:", err.message);
      throw err;
    }
  }

  throw new Error("Email and password required");
}

export function logout() {
  removeSeekerToken();
  const store = getStore();
  store.auth.loggedIn = false;
  return write(store);
}

export function isLoggedIn() {
  return !!(getStore().auth.loggedIn || getSeekerToken());
}

export function getAuth() {
  return getStore().auth;
}

export function getProfile() {
  const store = getStore();
  if (!store.initialized) return emptyStore().profile;
  return store.profile;
}

export function saveProfileLocally(patch) {
  const store = getStore();
  store.profile = {
    ...store.profile,
    ...patch,
    personal: { ...(store.profile.personal || {}), ...(patch.personal || {}) },
    professional: {
      ...(store.profile.professional || {}),
      ...(patch.professional || {}),
    },
    preferences: {
      ...(store.profile.preferences || {}),
      ...(patch.preferences || {}),
    },
    resume: { ...(store.profile.resume || {}), ...(patch.resume || {}) },
  };
  write(store);
  return store.profile;
}

export async function saveProfile(patch = {}) {
  const profile = saveProfileLocally(patch);

  if (getSeekerToken()) {
    try {
      const res = await seekerApi.updateSeekerProfile(profile);
      if (res?.data) {
        const p = res.data;
        if (p.full_name) profile.personal.fullName = p.full_name;
        if (p.phone) profile.personal.phone = p.phone;
        if (p.avatar_url) profile.personal.photo = p.avatar_url;
        if (p.headline) profile.professional.title = p.headline;
        if (p.city) profile.personal.location = p.city;
        write(getStore());
      }
    } catch (e) {
      console.warn("Backend updateSeekerProfile failed:", e.message);
    }
  }

  return profile;
}

export function getProfileCompleteness() {
  return computeCompleteness(getProfile());
}

// ---- RESUME --------------------------------------------------------------

export function getResume() {
  const r = getProfile().resume || {};
  return { fileName: "", uploadedAt: "", size: 0, type: "", dataUrl: "", ...r };
}

export async function saveResume({ fileName, size, type, dataUrl }) {
  const store = getStore();
  const resumeObj = {
    fileName: fileName || "",
    size: size || 0,
    type: type || "",
    dataUrl: dataUrl || "",
    uploadedAt: new Date().toISOString().slice(0, 10),
  };
  store.profile = {
    ...store.profile,
    resume: resumeObj,
  };
  write(store);

  if (getSeekerToken()) {
    try {
      await seekerApi.saveSeekerResume({
        fileName,
        size,
        mimeType: type || "",
        dataUrl,
      });
    } catch (e) {
      console.warn("Backend saveSeekerResume failed:", e.message);
    }
  }

  return store.profile.resume;
}

export async function removeResume() {
  const store = getStore();
  store.profile = { ...store.profile, resume: { fileName: "", uploadedAt: "", size: 0, type: "", dataUrl: "" } };
  write(store);

  if (getSeekerToken()) {
    try {
      await seekerApi.removeSeekerResume();
    } catch (e) {
      console.warn("Backend removeSeekerResume failed:", e.message);
    }
  }

  return store.profile.resume;
}

// ---- SAVED JOBS ----------------------------------------------------------

export function getSavedJobId(item) {
  if (!item) return null;
  if (typeof item === "object") {
    return item.job?.id ?? item.id ?? item.saved_id;
  }
  return item;
}

export function isSaved(jobId) {
  if (!jobId) return false;
  const store = getStore();
  const list = store.savedJobs || [];
  const idStr = String(jobId);
  return list.some((item) => String(getSavedJobId(item)) === idStr);
}

export function listSavedJobs() {
  return (getStore().savedJobs || []).slice();
}

export async function refreshSavedJobs() {
  if (!getSeekerToken()) return getStore().savedJobs || [];
  try {
    const fresh = await seekerApi.fetchSavedJobs();
    if (Array.isArray(fresh)) {
      const store = getStore();
      store.savedJobs = fresh;
      write(store);
      return fresh;
    }
  } catch (e) {
    console.warn("refreshSavedJobs failed:", e.message);
  }
  return getStore().savedJobs || [];
}

export async function toggleSavedJob(jobId, jobData = null) {
  const store = getStore();
  const idStr = String(jobId);
  const has = store.savedJobs.some((item) => String(getSavedJobId(item)) === idStr);

  if (has) {
    store.savedJobs = store.savedJobs.filter((item) => String(getSavedJobId(item)) !== idStr);
  } else {
    const entry = jobData
      ? (jobData.job ? jobData : { saved_id: Date.now(), saved_at: new Date().toISOString(), job: jobData })
      : { saved_id: Date.now(), saved_at: new Date().toISOString(), job: { id: Number(jobId) } };
    store.savedJobs = [entry, ...store.savedJobs];
  }
  write(store);

  if (getSeekerToken()) {
    try {
      await seekerApi.toggleSavedJob(jobId, has);
      const fresh = await seekerApi.fetchSavedJobs();
      if (Array.isArray(fresh)) {
        store.savedJobs = fresh;
        write(store);
      }
    } catch (e) {
      console.warn("Backend toggleSavedJob failed:", e.message);
    }
  }

  return !has;
}

// ---- APPLICATIONS -------------------------------------------------------

export function listApplications() {
  return (getStore().applications || []).slice().sort((a, b) => (a.appliedDate < b.appliedDate ? 1 : -1));
}

export function getApplication(id) {
  return (getStore().applications || []).find((a) => a.id === id) || null;
}

export function hasAppliedToJob(jobId) {
  const idStr = String(jobId);
  return (getStore().applications || []).some((a) => String(a.jobId) === idStr);
}

export async function addApplication(app) {
  const store = getStore();
  const id = "APP-" + (2000 + store.applications.length + Math.floor(Math.random() * 100));
  const record = {
    id,
    jobId: app.jobId,
    appliedDate: new Date().toISOString().slice(0, 10),
    stage: "Applied",
    closed: false,
    timeline: [{ stage: "Applied", date: new Date().toISOString().slice(0, 10) }],
    resumeFileName: app.resumeFileName || store.profile.resume.fileName,
    coverLetter: app.coverLetter || "",
    answers: app.answers || {},
  };
  store.applications = [...store.applications, record];
  write(store);

  if (getSeekerToken()) {
    try {
      const res = await seekerApi.applyToJob(app.jobId, {
        resumeFileName: record.resumeFileName,
        coverLetter: record.coverLetter,
        answers: record.answers,
      });
      if (res?.data?.application_id) {
        record.id = res.data.application_id;
        write(store);
      }
    } catch (e) {
      console.warn("Backend applyToJob failed:", e.message);
    }
  }

  return record;
}

export async function withdrawApplication(id) {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  store.applications = store.applications.map((a) =>
    a.id === id
      ? { ...a, stage: "Withdrawn", closed: true, timeline: [...(a.timeline || []), { stage: "Withdrawn", date: today }] }
      : a
  );
  write(store);

  if (getSeekerToken()) {
    try {
      await seekerApi.withdrawApplication(id);
    } catch (e) {
      console.warn("Backend withdrawApplication failed:", e.message);
    }
  }

  return store.applications.find((a) => a.id === id) || null;
}

// ---- INTERVIEWS ---------------------------------------------------------

export function listInterviews() {
  return (getStore().applications || [])
    .filter((a) => a.interview && a.interview.at)
    .slice()
    .sort((a, b) => (a.interview.at < b.interview.at ? -1 : 1));
}

export function getInterviewByApplication(appId) {
  const app = getApplication(appId);
  return app && app.interview ? { ...app.interview, applicationId: app.id, jobId: app.jobId } : null;
}

export async function respondToInterview(appId, status, note = "") {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  store.applications = store.applications.map((a) => {
    if (a.id !== appId || !a.interview) return a;
    return { ...a, interview: { ...a.interview, status, responseAt: today, responseNote: note || "" } };
  });
  write(store);

  const app = store.applications.find((a) => a.id === appId);
  addNotification({
    type: "interview",
    title: status === "confirmed" ? "Interview confirmed" : "Interview declined",
    message:
      status === "confirmed"
        ? `You confirmed your interview for ${app?.job?.title || "the role"}.`
        : `You declined the interview for ${app?.job?.title || "the role"}.`,
    applicationId: appId,
  });

  if (getSeekerToken() && app?.interview?.id) {
    try {
      await seekerApi.respondToInterview(app.interview.id, status, note);
    } catch (e) {
      console.warn("Backend respondToInterview failed:", e.message);
    }
  }

  return app ? app.interview : null;
}

// ---- NOTIFICATIONS ------------------------------------------------------

export function listNotifications() {
  return (getStore().notifications || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function unreadNotificationCount() {
  return (getStore().notifications || []).filter((n) => !n.read).length;
}

export async function markNotificationRead(id) {
  const store = getStore();
  store.notifications = store.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  write(store);

  if (getSeekerToken()) {
    try {
      await seekerApi.markSeekerNotificationRead(id);
    } catch (e) {}
  }
  return store.notifications;
}

export function markAllNotificationsRead() {
  const store = getStore();
  store.notifications = store.notifications.map((n) => ({ ...n, read: true }));
  return write(store).notifications;
}

export function deleteNotification(id) {
  const store = getStore();
  store.notifications = store.notifications.filter((n) => n.id !== id);
  return write(store).notifications;
}

export function addNotification(n) {
  const store = getStore();
  const record = { id: "N" + Date.now() + Math.floor(Math.random() * 1000), read: false, date: new Date().toISOString().slice(0, 10), ...n };
  store.notifications = [record, ...(store.notifications || [])];
  write(store);
  return record;
}

// ---- SETTINGS -----------------------------------------------------------

export function getSettings() {
  return getStore().settings;
}

export function saveSettings(patch) {
  const store = getStore();
  store.settings = { ...store.settings, ...patch };
  return write(store).settings;
}

export function resetAll() {
  removeSeekerToken();
  memStore = null;
  write(emptyStore());
}
