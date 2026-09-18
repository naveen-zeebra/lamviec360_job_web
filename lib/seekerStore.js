import { JOBS } from "./data";
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

export function ensureSeeded() {
  const store = getStore();
  if (store.initialized) return store;

  const job1 = JOBS.find((j) => j.id === 1 || j.id === "JOB-2001");
  const job7 = JOBS.find((j) => j.id === 7 || j.id === "JOB-2002");
  const job11 = JOBS.find((j) => j.id === 11);
  const job6 = JOBS.find((j) => j.id === 6);

  store.initialized = true;
  store.auth = { loggedIn: true, emailVerified: true, name: "Minh Tran", email: "minh.tran@example.com" };
  store.profile = {
    personal: { fullName: "Minh Tran", photo: "", phone: "090 123 4567", location: "Ho Chi Minh City" },
    professional: { title: "Frontend Engineer", experience: "3-5 years", industry: "Technology", skills: ["React", "TypeScript", "Node.js", "CSS"] },
    languages: ["Vietnamese", "English"],
    education: [{ degree: "B.Sc. Computer Science", institution: "HCMC University of Technology", year: "2019" }],
    experience: [
      { company: "Nhat Tin Software", title: "Frontend Engineer", start: "2022", end: "Present", responsibilities: "Building and maintaining customer-facing web applications." },
    ],
    resume: { fileName: "Minh_Tran_CV.pdf", uploadedAt: daysAgo(20), size: 248000, type: "application/pdf", dataUrl: "" },
    preferences: { roles: ["Frontend Engineer", "Fullstack Engineer"], locations: ["Ho Chi Minh City", "Remote"], workMode: "Hybrid", salary: "25M - 35M VND" },
  };

  store.savedJobs = [job11 ? job11.id : 11, job6 ? job6.id : 6];

  store.applications = [
    job1 && {
      id: "APP-1001",
      jobId: job1.id,
      appliedDate: daysAgo(2),
      stage: "Applied",
      closed: false,
      timeline: [{ stage: "Applied", date: daysAgo(2) }],
      resumeFileName: "Minh_Tran_CV.pdf",
      coverLetter: "",
      answers: {},
    },
    job7 && {
      id: "APP-1002",
      jobId: job7.id,
      appliedDate: daysAgo(9),
      stage: "Interview Scheduled",
      closed: false,
      interviewAt: daysAhead(3) + " 14:00",
      interview: {
        status: "invited",
        at: daysAhead(3) + " 14:00",
        durationMin: 45,
        mode: "video",
        location: "",
        meetingLink: "https://meet.lamviec360.vn/abc-frontend-r1",
        round: "First round – Hiring Manager",
        interviewers: [{ name: "Trang Bui", role: "Engineering Manager" }],
        instructions: "Please be ready 5 minutes early. We will cover your recent projects and a short live coding exercise (React).",
        documents: ["CV / Resume", "Portfolio link"],
        responseAt: "",
      },
      timeline: [
        { stage: "Applied", date: daysAgo(9) },
        { stage: "Under Review", date: daysAgo(7) },
        { stage: "Shortlisted", date: daysAgo(5) },
        { stage: "Interview Scheduled", date: daysAgo(1) },
      ],
      resumeFileName: "Minh_Tran_CV.pdf",
      coverLetter: "",
      answers: {},
    },
    {
      id: "APP-1003",
      jobId: 2,
      appliedDate: daysAgo(30),
      stage: "Hired",
      closed: true,
      timeline: [
        { stage: "Applied", date: daysAgo(30) },
        { stage: "Under Review", date: daysAgo(27) },
        { stage: "Shortlisted", date: daysAgo(23) },
        { stage: "Interview Scheduled", date: daysAgo(18) },
        { stage: "Offer Sent", date: daysAgo(10) },
        { stage: "Hired", date: daysAgo(7) },
      ],
      resumeFileName: "Minh_Tran_CV.pdf",
      coverLetter: "",
      answers: {},
    },
    {
      id: "APP-1004",
      jobId: 9,
      appliedDate: daysAgo(15),
      stage: "Rejected",
      closed: true,
      timeline: [
        { stage: "Applied", date: daysAgo(15) },
        { stage: "Under Review", date: daysAgo(12) },
        { stage: "Rejected", date: daysAgo(6) },
      ],
      resumeFileName: "Minh_Tran_CV.pdf",
      coverLetter: "",
      answers: {},
    },
  ].filter(Boolean);

  store.notifications = [
    { id: "N1", type: "interview", title: "Interview scheduled", message: `Your interview for ${job7 ? job7.title : "the role"} is confirmed.`, date: daysAgo(1), read: false, applicationId: "APP-1002" },
    { id: "N2", type: "status", title: "Application shortlisted", message: `You were shortlisted for ${job7 ? job7.title : "a role"} at ${job7 ? job7.company : ""}.`, date: daysAgo(5), read: false, applicationId: "APP-1002" },
    { id: "N3", type: "offer", title: "Offer sent", message: "Sen Vang Group sent you an offer.", date: daysAgo(10), read: true, applicationId: "APP-1003" },
    { id: "N4", type: "cv_view", title: "Your CV was viewed", message: `${job1 ? job1.company : "A company"} viewed your resume.`, date: daysAgo(2), read: false },
    { id: "N5", type: "confirmation", title: "Application submitted", message: `Your application for ${job1 ? job1.title : "a role"} was received.`, date: daysAgo(2), read: true, applicationId: "APP-1001" },
  ];

  return write(store);
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
      store.profile = {
        personal: {
          fullName: p.personal?.fullName || store.auth.name || "",
          photo: p.personal?.photo || "",
          phone: p.personal?.phone || "",
          location: p.personal?.location || "",
        },
        professional: {
          title: p.professional?.title || "",
          experience: p.professional?.experience || "",
          industry: p.professional?.industry || "",
          skills: p.professional?.skills || [],
        },
        languages: p.languages || [],
        education: p.education || [],
        experience: p.experience || [],
        resume: {
          fileName: p.resume?.fileName || "",
          uploadedAt: p.resume?.uploadedAt || "",
          size: p.resume?.size || 0,
          type: "application/pdf",
          dataUrl: store.profile?.resume?.dataUrl || p.resume?.dataUrl || "",
        },
        preferences: p.preferences || { roles: [], locations: [], workMode: "", salary: "" },
      };
    }

    if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value)) {
      // Keep locally saved mock applications (where jobId is an integer/numeric)
      const mockApps = store.applications.filter((a) => !isNaN(Number(a.jobId)));
      // Filter out backend apps that might have duplicates, then merge
      const backendApps = appsRes.value.filter(ba => !mockApps.some(ma => ma.id === ba.id));
      store.applications = [...mockApps, ...backendApps];
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
  }
  store.auth.emailVerified = true;
  return write(store);
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
      // Fallback to seeded demo account if offline or backend unavailable
      console.warn("API login failed, checking offline demo fallback:", err.message);
      if (email.toLowerCase() === "minh.tran@example.com") {
        const store = ensureSeeded();
        store.auth.loggedIn = true;
        store.auth.emailVerified = true;
        return write(store);
      }
      throw err;
    }
  }

  // Fallback default login for prototype
  const store = ensureSeeded();
  store.auth.loggedIn = true;
  store.auth.emailVerified = true;
  return write(store);
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
  if (!store.initialized) return ensureSeeded().profile;
  return store.profile;
}

export async function saveProfile(patch) {
  const store = getStore();
  store.profile = { ...store.profile, ...patch };
  write(store);

  if (getSeekerToken()) {
    try {
      await seekerApi.updateSeekerProfile(patch);
    } catch (e) {
      console.warn("Backend updateSeekerProfile failed:", e.message);
    }
  }

  return store.profile;
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

export function isSaved(jobId) {
  const store = getStore();
  const list = store.savedJobs || [];
  const idStr = String(jobId);
  return list.some((item) => {
    const itemId = typeof item === "object" ? item.id : item;
    return String(itemId) === idStr;
  });
}

export function listSavedJobs() {
  return (getStore().savedJobs || []).slice();
}

export async function toggleSavedJob(jobId) {
  const store = getStore();
  const idStr = String(jobId);
  const has = store.savedJobs.some((item) => {
    const itemId = typeof item === "object" ? item.id : item;
    return String(itemId) === idStr;
  });
  
  store.savedJobs = has
    ? store.savedJobs.filter((item) => {
        const itemId = typeof item === "object" ? item.id : item;
        return String(itemId) !== idStr;
      })
    : [...store.savedJobs, jobId];
  write(store);

  if (getSeekerToken()) {
    try {
      await seekerApi.toggleSavedJob(jobId);
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
  const job = app && JOBS.find((j) => j.id === app.jobId);
  addNotification({
    type: "interview",
    title: status === "confirmed" ? "Interview confirmed" : "Interview declined",
    message:
      status === "confirmed"
        ? `You confirmed your interview for ${job ? job.title : "the role"}.`
        : `You declined the interview for ${job ? job.title : "the role"}.`,
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
