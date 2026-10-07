
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
      certifications: [],
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

export function read() {
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

export function write(store) {
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
      const existingApps = store.applications || [];
      const mergedApps = appsRes.value.map((backendApp) => {
        const existing = existingApps.find((e) => String(e.id) === String(backendApp.id));
        let iv = existing?.interview || backendApp.interview || null;

        const isInterviewStage =
          backendApp.status === "interviewing" ||
          backendApp.status === "interview" ||
          backendApp.status === "Interview Scheduled" ||
          backendApp.stage === "Interview Scheduled";

        if (isInterviewStage && !iv) {
          iv = {
            id: "IV-" + backendApp.id,
            status: "invited",
            at: daysAhead(3) + " 14:00",
            durationMin: 45,
            mode: "video",
            meetingLink: "https://meet.google.com/lv3-" + backendApp.id,
            location: "Google Meet",
            round: "First Round Technical & Product Interview",
            roundVi: "Phỏng vấn Kỹ thuật & Sản phẩm (Vòng 1)",
            interviewers: [{ name: "Talent Acquisition Team", role: "Recruiter" }],
            instructions: "Online video interview invitation from employer. Please join on time.",
            instructionsVi: "Lời mời phỏng vấn trực tuyến từ nhà tuyển dụng. Vui lòng tham gia đúng giờ.",
            documents: ["CV / Resume"],
            responseAt: "",
          };
        }

        return {
          ...backendApp,
          interview: iv,
        };
      });

      // Preserve demo interview applications if any so user has rich test data
      const demoApps = existingApps.filter(
        (e) => String(e.id).startsWith("APP-IV-") && !mergedApps.some((m) => String(m.id) === String(e.id))
      );
      store.applications = [...mergedApps, ...demoApps];
    }

    if (savedRes.status === "fulfilled" && Array.isArray(savedRes.value)) {
      store.savedJobs = savedRes.value;
    }

    if (notifsRes.status === "fulfilled" && Array.isArray(notifsRes.value)) {
      if (notifsRes.value.length > 0) {
        const backendIds = new Set(notifsRes.value.map((n) => String(n.id)));
        const localOnly = (store.notifications || []).filter((n) => !backendIds.has(String(n.id)));
        store.notifications = [...notifsRes.value, ...localOnly];
      }
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

export async function registerDraft(name, email, password = null, phone = "") {
  // Clear any existing user data from previous sessions so the newly registered candidate starts clean
  removeSeekerToken();
  const fresh = emptyStore();
  fresh.initialized = true;
  fresh.auth = { loggedIn: false, emailVerified: false, name, email, phone };
  fresh.profile.personal.fullName = name;
  fresh.profile.personal.phone = phone || "";
  fresh.profile.personal.location = "";
  fresh.profile.personal.photo = "";
  fresh.profile.personal.photoName = "";
  write(fresh);

  if (password) {
    try {
      await seekerAuth.registerSeeker({ name, email, password, phone });
    } catch (e) {
      console.warn("Backend register error, kept in local draft:", e.message);
      throw e;
    }
  }
  return fresh;
}

export async function verifyEmail(email, code = "123456") {
  const store = getStore();
  const targetEmail = email || store.auth.email;
  try {
    const res = await seekerAuth.verifySeekerEmail({ email: targetEmail, code });
    if (res?.user) {
      store.auth.userId = res.user.id;
      if (res.user.full_name) store.auth.name = res.user.full_name;
    }
  } catch (e) {
    console.warn("Backend email verify error:", e.message);
    throw e;
  }
  store.auth.emailVerified = true;
  store.auth.loggedIn = true;
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
      const userData = data?.user || data || {};
      store.auth = {
        loggedIn: true,
        emailVerified: !!(data.email_verified || userData.email_verified || userData.is_verified),
        name: data.name || userData.name || userData.full_name || store.auth.name,
        email: data.email || userData.email || store.auth.email,
        userId: data.user_id || userData.user_id || userData.id,
        role: data.role || userData.role || "jobseeker",
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

export async function loginWithOAuth(provider, payload = {}) {
  try {
    const data = await seekerAuth.oauthSeekerLogin({
      provider,
      ...payload,
    });
    const store = getStore();
    store.initialized = true;
    const userData = data?.user || data || {};
    store.auth = {
      loggedIn: true,
      emailVerified: true,
      name: userData.full_name || userData.name || store.auth.name,
      email: userData.email || store.auth.email,
      userId: userData.id || userData.user_id,
      role: userData.role || userData.user_type || "jobseeker",
      avatarUrl: userData.avatar_url || "",
      oauthProvider: provider,
    };
    if (userData.avatar_url && !store.profile?.personal?.photo) {
      store.profile.personal.photo = userData.avatar_url;
    }
    if (userData.full_name && !store.profile?.personal?.fullName) {
      store.profile.personal.fullName = userData.full_name;
    }
    write(store);
    await syncSeekerWithBackend();
    return store;
  } catch (err) {
    console.warn(`OAuth login API attempt failed for ${provider}:`, err.message);
    // If backend is unreachable (Failed to fetch / NetworkError), provide local mockup demo session
    if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
      console.info(`Backend on port 8001 not reached. Initializing offline demo session for ${provider}`);
      const store = getStore();
      store.initialized = true;
      store.auth = {
        loggedIn: true,
        emailVerified: true,
        name: payload.name || `${provider.toUpperCase()} Candidate`,
        email: payload.email || `${provider}.demo@lamviec360.vn`,
        userId: payload.provider_user_id || `offline_${Date.now()}`,
        role: "jobseeker",
        avatarUrl: payload.avatar_url || "",
        oauthProvider: provider,
      };
      write(store);
      return store;
    }
    throw err;
  }
}

export function logout() {
  removeSeekerToken();
  return write(emptyStore());
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
    certifications: patch.certifications || store.profile.certifications || [],
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

// ---- CERTIFICATIONS / PROFESSIONAL LICENSES ------------------------------

export function getCertifications() {
  const p = getProfile();
  return (p.certifications || []).slice();
}

export function saveCertification(cert) {
  const store = getStore();
  if (!store.profile.certifications) {
    store.profile.certifications = [];
  }
  const idx = store.profile.certifications.findIndex((c) => c.id === cert.id);
  if (idx >= 0) {
    store.profile.certifications[idx] = { ...store.profile.certifications[idx], ...cert };
  } else {
    store.profile.certifications.push({
      id: cert.id || "cert-" + Date.now(),
      name: cert.name || "",
      issuer: cert.issuer || "",
      issueDate: cert.issueDate || "",
      expiryDate: cert.expiryDate || "",
      credentialId: cert.credentialId || "",
      credentialUrl: cert.credentialUrl || "",
      fileName: cert.fileName || "",
      fileSize: cert.fileSize || 0,
      fileDataUrl: cert.fileDataUrl || "",
      uploadedAt: cert.uploadedAt || new Date().toISOString(),
    });
  }
  write(store);
  return store.profile.certifications;
}

export function removeCertification(id) {
  const store = getStore();
  if (store.profile.certifications) {
    store.profile.certifications = store.profile.certifications.filter((c) => c.id !== id);
    write(store);
  }
  return store.profile.certifications || [];
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
  return (getStore().applications || []).find((a) => String(a.id) === String(id)) || null;
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
    job: app.job || null,
    appliedDate: new Date().toISOString().slice(0, 10),
    stage: "Applied",
    closed: false,
    timeline: [{ stage: "Applied", date: new Date().toISOString().slice(0, 10) }],
    resumeFileName: app.resumeFileName || store.profile.resume.fileName,
    coverLetter: app.coverLetter || "",
    answers: app.answers || {},
    certifications: app.certifications || (app.certification ? [app.certification] : []),
    certification: app.certification || null,
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

export function createDefaultDemoInterviews() {
  return [
    {
      id: "APP-IV-101",
      jobId: 1,
      appliedDate: daysAgo(6),
      stage: "Interview Scheduled",
      closed: false,
      job: {
        id: 1,
        title: "Senior Frontend Engineer (React/Next.js)",
        titleVi: "Kỹ sư Frontend Cao cấp (React/Next.js)",
        company: "TechCorp Vietnam",
        company_name: "TechCorp Vietnam",
        city: "Ho Chi Minh City",
        location: "District 1, Ho Chi Minh City",
        job_type: "Full-time",
        workplace_type: "Hybrid",
        salary: "35M – 50M VND",
      },
      interview: {
        id: "IV-101",
        status: "invited",
        at: daysAhead(2) + " 14:00",
        durationMin: 45,
        mode: "video",
        meetingLink: "https://meet.google.com/lv3-frontend-lead",
        location: "Google Meet",
        round: "Technical Screening & System Architecture (Round 1)",
        roundVi: "Phỏng vấn Kỹ thuật & Kiến trúc Hệ thống (Vòng 1)",
        interviewers: [
          { name: "Nguyen Van An", role: "VP of Engineering" },
          { name: "Le Thi Mai", role: "Principal Frontend Architect" },
        ],
        instructions: "Please be ready 5 minutes early. We will cover your recent frontend projects and conduct a short live architecture walkthrough (React/Next.js).",
        instructionsVi: "Vui lòng chuẩn bị sẵn sàng trước 5 phút. Chúng tôi sẽ thảo luận về các dự án gần đây của bạn và thực hiện trao đổi kiến trúc kỹ thuật (React/Next.js).",
        documents: ["Updated Resume (PDF)", "GitHub / Portfolio link"],
        responseAt: "",
      },
      timeline: [
        { stage: "Applied", date: daysAgo(6) },
        { stage: "Under Review", date: daysAgo(4) },
        { stage: "Shortlisted", date: daysAgo(2) },
        { stage: "Interview Scheduled", date: daysAgo(1) },
      ],
    },
    {
      id: "APP-IV-102",
      jobId: 2,
      appliedDate: daysAgo(12),
      stage: "Interview Scheduled",
      closed: false,
      job: {
        id: 2,
        title: "Product Engineer / Fullstack Developer",
        titleVi: "Kỹ sư Sản phẩm / Lập trình viên Fullstack",
        company: "VNG Corporation",
        company_name: "VNG Corporation",
        city: "Ho Chi Minh City",
        location: "VNG Campus, Tan Thuan Dong, District 7, Ho Chi Minh City",
        job_type: "Full-time",
        workplace_type: "On-site",
        salary: "30M – 45M VND",
      },
      interview: {
        id: "IV-102",
        status: "confirmed",
        at: daysAhead(5) + " 10:00",
        durationMin: 60,
        mode: "on-site",
        location: "VNG Campus, Tan Thuan Dong, District 7, HCMC (Tower B, Room 4.02)",
        meetingLink: "",
        round: "Hiring Manager & System Design (Round 2)",
        roundVi: "Quản lý tuyển dụng & Thiết kế hệ thống (Vòng 2)",
        interviewers: [
          { name: "Tran Minh Quang", role: "Head of Engineering" },
          { name: "Pham Thi Huong", role: "Senior HR Business Partner" },
        ],
        instructions: "Please arrive 10 minutes early to exchange guest pass at the ground floor security desk. Bring your personal laptop if you want to demo work.",
        instructionsVi: "Vui lòng đến trước 10 phút để nhận thẻ khách tại quầy an ninh tầng trệt. Mang theo laptop cá nhân nếu bạn muốn demo sản phẩm.",
        documents: ["National ID Card / Passport", "Personal Laptop (optional)"],
        responseAt: daysAgo(1),
      },
      timeline: [
        { stage: "Applied", date: daysAgo(12) },
        { stage: "Under Review", date: daysAgo(9) },
        { stage: "Shortlisted", date: daysAgo(6) },
        { stage: "Interview Scheduled", date: daysAgo(2) },
      ],
    },
    {
      id: "APP-IV-103",
      jobId: 3,
      appliedDate: daysAgo(15),
      stage: "Interview Scheduled",
      closed: false,
      job: {
        id: 3,
        title: "Senior UI/UX Specialist & Design Systems",
        titleVi: "Chuyên viên UI/UX & Hệ thống thiết kế",
        company: "Shopee Vietnam",
        company_name: "Shopee Vietnam",
        city: "Ho Chi Minh City",
        location: "Saigon Centre, District 1, Ho Chi Minh City",
        job_type: "Full-time",
        workplace_type: "Hybrid",
        salary: "28M – 42M VND",
      },
      interview: {
        id: "IV-103",
        status: "confirmed",
        at: daysAhead(8) + " 15:30",
        durationMin: 45,
        mode: "video",
        meetingLink: "https://zoom.us/j/8839201928",
        location: "Zoom Video Meeting",
        round: "Design System Review & Team Alignment (Round 2)",
        roundVi: "Đánh giá Hệ thống thiết kế & Phù hợp nhóm (Vòng 2)",
        interviewers: [
          { name: "David Nguyen", role: "Principal Design Lead" },
        ],
        instructions: "Walkthrough of your component design system, token architecture, and accessibility considerations.",
        instructionsVi: "Trình bày về thiết kế hệ thống component, token kiến trúc và các tiêu chuẩn tiếp cận người dùng.",
        documents: ["Figma Portfolio", "Design Token Specification"],
        responseAt: daysAgo(2),
      },
      timeline: [
        { stage: "Applied", date: daysAgo(15) },
        { stage: "Under Review", date: daysAgo(11) },
        { stage: "Shortlisted", date: daysAgo(7) },
        { stage: "Interview Scheduled", date: daysAgo(3) },
      ],
    },
    {
      id: "APP-IV-104",
      jobId: 4,
      appliedDate: daysAgo(25),
      stage: "Interview Scheduled",
      closed: true,
      job: {
        id: 4,
        title: "Senior React Developer",
        titleVi: "Lập trình viên React Cao cấp",
        company: "One Mount Group",
        company_name: "One Mount Group",
        city: "Hanoi",
        location: "Times City, Hai Ba Trung, Hanoi",
        job_type: "Full-time",
        workplace_type: "Remote",
        salary: "35M – 48M VND",
      },
      interview: {
        id: "IV-104",
        status: "completed",
        at: daysAgo(5) + " 11:00",
        durationMin: 45,
        mode: "video",
        meetingLink: "https://meet.google.com/one-mt-eval",
        location: "Google Meet",
        round: "Initial Screening & Culture Fit",
        roundVi: "Sơ tuyển & Phù hợp văn hoá",
        interviewers: [
          { name: "Do Hoang Long", role: "Talent Acquisition Lead" },
        ],
        instructions: "Completed successfully. Recommended for final panel.",
        instructionsVi: "Đã hoàn thành xuất sắc. Đề xuất tham gia vòng cuối.",
        documents: ["CV / Resume"],
        responseAt: daysAgo(8),
      },
      timeline: [
        { stage: "Applied", date: daysAgo(25) },
        { stage: "Under Review", date: daysAgo(20) },
        { stage: "Interview Scheduled", date: daysAgo(9) },
      ],
    },
    {
      id: "APP-IV-105",
      jobId: 5,
      appliedDate: daysAgo(20),
      stage: "Withdrawn",
      closed: true,
      job: {
        id: 5,
        title: "Full Stack Engineer (Node.js & Python)",
        titleVi: "Kỹ sư Full Stack (Node.js & Python)",
        company: "NextGen Software",
        company_name: "NextGen Software",
        city: "Da Nang",
        location: "Da Nang, Vietnam",
        job_type: "Full-time",
        workplace_type: "Remote",
        salary: "25M – 35M VND",
      },
      interview: {
        id: "IV-105",
        status: "declined",
        at: daysAgo(8) + " 09:00",
        durationMin: 30,
        mode: "phone",
        location: "Phone Call",
        round: "Recruiter Phone Screening",
        roundVi: "Sơ tuyển qua điện thoại",
        interviewers: [
          { name: "Bui Thanh Tung", role: "Recruiter" },
        ],
        instructions: "Candidate declined due to accepted offer elsewhere.",
        instructionsVi: "Ứng viên từ chối do đã nhận lời mời làm việc khác.",
        responseAt: daysAgo(9),
        responseNote: "Thank you for the consideration. I have accepted another offer that closely matches my immediate career goals.",
      },
      timeline: [
        { stage: "Applied", date: daysAgo(20) },
        { stage: "Interview Scheduled", date: daysAgo(10) },
        { stage: "Withdrawn", date: daysAgo(9) },
      ],
    },
  ];
}

export function ensureDefaultInterviews(force = false) {
  const store = getStore();
  const hasInterviews = (store.applications || []).some((a) => a.interview && a.interview.at);
  if (!hasInterviews || force) {
    const demo = createDefaultDemoInterviews();
    const existing = (store.applications || []).filter((a) => !demo.some((d) => String(d.id) === String(a.id)));
    store.applications = [...demo, ...existing];
    write(store);
  }
  return store.applications;
}

export function listInterviews() {
  ensureDefaultInterviews();
  return (getStore().applications || [])
    .filter((a) => a.interview && a.interview.at)
    .slice()
    .sort((a, b) => (a.interview.at < b.interview.at ? -1 : 1));
}

export function getInterviewByApplication(appId) {
  ensureDefaultInterviews();
  const app = getApplication(appId);
  return app && app.interview ? { ...app.interview, applicationId: app.id, jobId: app.jobId } : null;
}

export async function respondToInterview(appId, status, note = "") {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  store.applications = (store.applications || []).map((a) => {
    if (String(a.id) !== String(appId) || !a.interview) return a;
    return { ...a, interview: { ...a.interview, status, responseAt: today, responseNote: note || "" } };
  });
  write(store);

  const app = store.applications.find((a) => String(a.id) === String(appId));
  const isAccepted = status === "confirmed";
  addNotification({
    type: "interview",
    title: isAccepted ? "Interview confirmed" : "Interview declined",
    message: isAccepted
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

export async function proposeInterviewReschedule(appId, proposedAt, note = "") {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  store.applications = (store.applications || []).map((a) => {
    if (String(a.id) !== String(appId) || !a.interview) return a;
    return {
      ...a,
      interview: {
        ...a.interview,
        status: "reschedule_requested",
        proposedAt,
        responseAt: today,
        responseNote: note || "",
      },
    };
  });
  write(store);

  const app = store.applications.find((a) => String(a.id) === String(appId));
  addNotification({
    type: "interview",
    title: "Reschedule requested",
    message: `You proposed a new time for your interview with ${app?.job?.company_name || app?.job?.company || "the employer"}.`,
    applicationId: appId,
  });

  return app ? app.interview : null;
}

export function addDemoInterview(customJob = null) {
  const store = getStore();
  const randId = Math.floor(100 + Math.random() * 900);
  const newApp = {
    id: `APP-IV-${Date.now()}`,
    jobId: customJob?.id || randId,
    appliedDate: daysAgo(3),
    stage: "Interview Scheduled",
    closed: false,
    job: customJob || {
      id: randId,
      title: "Senior Full Stack Engineer",
      titleVi: "Kỹ sư Full Stack Cao cấp",
      company: "InnovateTech Vietnam",
      company_name: "InnovateTech Vietnam",
      city: "Ho Chi Minh City",
      location: "District 2, Ho Chi Minh City",
      job_type: "Full-time",
      workplace_type: "Hybrid",
      salary: "35M – 50M VND",
    },
    interview: {
      id: `IV-${Date.now()}`,
      status: "invited",
      at: daysAhead(3) + " 14:30",
      durationMin: 45,
      mode: "video",
      meetingLink: "https://meet.google.com/lv3-demo-interview",
      location: "Google Meet",
      round: "First Round Technical & Cultural Fit",
      roundVi: "Vòng 1: Kỹ thuật & Phù hợp văn hoá",
      interviewers: [
        { name: "Nguyen Minh Quan", role: "Engineering Director" },
        { name: "Vu Thu Ha", role: "Talent Acquisition Partner" },
      ],
      instructions: "Please join the meeting on time with a stable internet connection. We will discuss your technical background and experience.",
      instructionsVi: "Vui lòng tham gia cuộc họp đúng giờ với kết nối mạng ổn định. Chúng tôi sẽ trao đổi về kinh nghiệm và nền tảng kỹ thuật của bạn.",
      documents: ["Resume / Portfolio", "GitHub link"],
      responseAt: "",
    },
    timeline: [
      { stage: "Applied", date: daysAgo(3) },
      { stage: "Shortlisted", date: daysAgo(1) },
      { stage: "Interview Scheduled", date: new Date().toISOString().slice(0, 10) },
    ],
  };

  store.applications = [newApp, ...(store.applications || [])];
  write(store);

  addNotification({
    type: "interview",
    title: "New interview invitation",
    message: `You received an interview invitation from ${newApp.job.company_name} for ${newApp.job.title}.`,
    applicationId: newApp.id,
  });

  return newApp;
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
