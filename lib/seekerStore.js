
import * as seekerAuth from "./api/seekerAuth";
import * as seekerApi from "./api/seekerApi";
import { getSeekerToken, removeSeekerToken, removeSeekerRefreshToken } from "./api/client";
import { UPLOAD_CONFIG } from "../config/uploadConfig";
import { calculateProfileAttachmentBytes } from "../utils/fileValidation";

const KEY = "lv360-seeker-store-v1";
export const MAX_PROFILE_RESUMES = UPLOAD_CONFIG.RESUME.maxCount;
export const MAX_RESUME_ERROR = UPLOAD_CONFIG.RESUME.maxCountErrorEn;
export const MAX_PROFILE_ATTACHMENT_BYTES = UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxBytes;
export const MAX_PROFILE_ATTACHMENT_MB = UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxMb;
export const MAX_PROFILE_ATTACHMENT_ERROR = UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.errors.quotaEn;

function emptyResumeSlot() {
  return { id: "", fileName: "", uploadedAt: "", size: 0, type: "", dataUrl: "", fileUrl: "", isDefault: false };
}

export function mapApiResume(row = {}) {
  const fileUrl = row.file_url || row.fileUrl || "";
  const href = seekerApi.resumePublicHref(fileUrl) || fileUrl;
  return {
    id: row.id,
    resumeName: row.resume_name || row.resumeName || row.file_name || row.fileName || "Resume",
    fileName: row.file_name || row.fileName || "",
    uploadedAt: String(row.created_at || row.uploadedAt || "").slice(0, 10),
    size: row.size_bytes || row.size || 0,
    type: row.mime_type || row.type || "",
    dataUrl: href,
    fileUrl,
    isDefault: !!(row.is_default ?? row.isDefault),
    usedCount: Number(row.used_count || row.usedCount || 0),
  };
}


function applyResumeList(store, list) {
  const resumes = (list || []).map((r) => ({ ...emptyResumeSlot(), ...r }));
  const def = resumes.find((r) => r.isDefault) || resumes[0] || null;
  store.profile.resumes = resumes.map((r) => ({
    ...r,
    isDefault: def ? String(r.id) === String(def.id) : false,
  }));
  store.profile.resume = def
    ? {
        id: def.id,
        fileName: def.fileName,
        uploadedAt: def.uploadedAt,
        size: def.size,
        type: def.type,
        dataUrl: def.dataUrl || "",
        fileUrl: def.fileUrl || "",
        isDefault: true,
      }
    : emptyResumeSlot();
}

function migrateProfileResumes(profile) {
  if (!profile) return;
  if (!Array.isArray(profile.resumes)) profile.resumes = [];
  if (profile.resume?.fileName && profile.resumes.length === 0) {
    profile.resumes = [
      {
        id: profile.resume.id || `local-${Date.now()}`,
        fileName: profile.resume.fileName,
        uploadedAt: profile.resume.uploadedAt || "",
        size: profile.resume.size || 0,
        type: profile.resume.type || "",
        dataUrl: profile.resume.dataUrl || "",
        fileUrl: profile.resume.fileUrl || "",
        isDefault: true,
      },
    ];
  }
}

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
    auth: { loggedIn: false, emailVerified: false, name: "", email: "", phone: "" },
    profile: {
      personal: { fullName: "", photo: "", phone: "", location: "", citizenId: "" },
      professional: { title: "", experience: "", industry: "", skills: [] },
      languages: [],
      education: [],
      experience: [],
      certifications: [],
      achievements: [],
      portfolio: { url: "", fileName: "", size: 0, type: "", dataUrl: "", projects: [] },
      resume: { fileName: "", uploadedAt: "", size: 0, type: "", dataUrl: "" },
      resumes: [],
      preferences: { roles: [], locations: [], workMode: "", salary: "" },
    },
    savedJobs: [],
    applications: [],
    documents: [],
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
      if (typeof window !== "undefined") {
        const strip = (r) =>
          r && typeof r === "object" && String(r.dataUrl || "").startsWith("data:")
            ? { ...r, dataUrl: "" }
            : r;
        const safeStore = {
          ...store,
          profile: {
            ...store.profile,
            resume: strip(store.profile?.resume) || store.profile?.resume,
            resumes: (store.profile?.resumes || []).map(strip),
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

export const REQUIRED_PROFILE_FIELDS = [
  { key: "fullName", label: "Full Name", labelVi: "Họ và tên", check: (p) => !!p?.personal?.fullName?.trim() },
  { key: "email", label: "Email Address", labelVi: "Địa chỉ email", check: (p, auth) => !!p?.personal?.email?.trim() || !!auth?.email?.trim() },
  { key: "phone", label: "Phone Number", labelVi: "Số điện thoại", check: (p) => !!p?.personal?.phone?.trim() },
  { key: "location", label: "Location / City", labelVi: "Địa điểm / Thành phố", check: (p) => !!p?.personal?.location?.trim() },
  { key: "experience", label: "Work Experience (≥1)", labelVi: "Kinh nghiệm làm việc (≥1)", check: (p) => (p?.experience || []).length >= 1 },
  { key: "education", label: "Education (≥1)", labelVi: "Học vấn (≥1)", check: (p) => (p?.education || []).length >= 1 },
  { key: "skills", label: "Skills (≥3)", labelVi: "Kỹ năng (≥3)", check: (p) => (p?.professional?.skills || []).length >= 3 },
  { key: "resume", label: "Résumé (≥1)", labelVi: "CV / Hồ sơ (≥1)", check: (p) => (p?.resumes || []).length >= 1 || !!p?.resume?.fileName },
];

export function getProfileCompletenessDetails(profile, auth = null) {
  if (!profile) return { completeness: 0, missingFields: REQUIRED_PROFILE_FIELDS, canApply: false, minRequired: 60 };
  let currentAuth = auth;
  if (!currentAuth && typeof window !== "undefined") {
    try {
      const st = read();
      currentAuth = st?.auth || null;
    } catch (e) {}
  }
  const results = REQUIRED_PROFILE_FIELDS.map((f) => ({
    ...f,
    completed: f.check(profile, currentAuth),
  }));
  const completedCount = results.filter((r) => r.completed).length;
  const percentage = Math.round((completedCount / REQUIRED_PROFILE_FIELDS.length) * 100);
  const missing = results.filter((r) => !r.completed);
  return {
    completeness: percentage,
    missingFields: missing,
    canApply: percentage >= 60,
    minRequired: 60,
  };
}

export function computeCompleteness(profile, auth = null) {
  return getProfileCompletenessDetails(profile, auth).completeness;
}

export function getMissingProfileFields(profile, lang = "EN", auth = null) {
  const isVi = lang === "VN" || lang === "VI";
  const { missingFields } = getProfileCompletenessDetails(profile, auth);
  return missingFields.map((f) => (isVi ? f.labelVi : f.label));
}


export function getStore() {
  const existing = read();
  if (existing) {
    if (existing.profile) {
      existing.profile.resume = { fileName: "", uploadedAt: "", size: 0, type: "", dataUrl: "", ...existing.profile.resume };
      migrateProfileResumes(existing.profile);
    }
    if (!Array.isArray(existing.documents)) {
      existing.documents = [];
    }
    return existing;
  }
  return write(emptyStore());
}



// ---- BACKEND SYNC --------------------------------------------------------

export async function syncUploadLimits() {
  try {
    return await seekerApi.fetchUploadConfig();
  } catch (_) {
    return null;
  }
}

export async function syncSeekerWithBackend() {
  try {
    seekerApi.fetchUploadConfig();
  } catch (_) {}

  const token = getSeekerToken();
  if (!token) return getStore();

  const store = getStore();
  try {
    const [me, profileRes, appsRes, savedRes, notifsRes, docsRes] = await Promise.allSettled([
      seekerAuth.getSeekerMe(),
      seekerApi.getSeekerProfile(),
      seekerApi.fetchSeekerApplications(),
      seekerApi.fetchSavedJobs(),
      seekerApi.fetchSeekerNotifications(),
      seekerApi.fetchSeekerDocuments(),
    ]);

    if (me.status === "fulfilled" && me.value) {
      const userPhone =
        me.value.phone !== undefined && me.value.phone !== null && String(me.value.phone).trim()
          ? String(me.value.phone).trim()
          : (store.auth.phone || "");

      store.auth = {
        loggedIn: true,
        emailVerified: !!me.value.email_verified,
        name: me.value.name || store.auth.name,
        email: me.value.email || store.auth.email,
        phone: userPhone,
        userId: me.value.user_id,
        role: me.value.role,
      };

      if (userPhone && (!store.profile?.personal?.phone || !store.profile.personal.phone.trim())) {
        if (!store.profile) store.profile = emptyStore().profile;
        if (!store.profile.personal) store.profile.personal = emptyStore().profile.personal;
        store.profile.personal.phone = userPhone;
      }
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

      const backendPhone =
        (p.phone && String(p.phone).trim()) ||
        (me.status === "fulfilled" && me.value?.phone && String(me.value.phone).trim()) ||
        (p.personal?.phone && String(p.personal.phone).trim()) ||
        (current.personal?.phone && String(current.personal.phone).trim()) ||
        (store.auth?.phone && String(store.auth.phone).trim()) ||
        "";

      if (backendPhone && (!store.auth.phone || !store.auth.phone.trim())) {
        store.auth.phone = backendPhone;
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
          phone: backendPhone,
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
        resumes: Array.isArray(p.resumes)
          ? p.resumes.map(mapApiResume)
          : current.resumes || [],
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
      applyResumeList(store, store.profile.resumes || []);
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

    if (docsRes.status === "fulfilled" && docsRes.value?.items && Array.isArray(docsRes.value.items)) {
      store.documents = docsRes.value.items.map((item) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        fileName: item.file_name,
        fileUrl: item.file_url,
        dataUrl: seekerApi.resumePublicHref(item.file_url) || item.file_url,
        mimeType: item.mime_type,
        sizeBytes: item.size_bytes,
        createdAt: item.created_at,
      }));
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
  const cleanEmail = (email || "").trim().toLowerCase();
  const fresh = emptyStore();
  fresh.initialized = true;
  fresh.auth = { loggedIn: false, emailVerified: false, name: (name || "").trim(), email: cleanEmail, phone: phone || "" };
  fresh.profile.personal.fullName = (name || "").trim();
  fresh.profile.personal.phone = phone || "";
  fresh.profile.personal.email = cleanEmail;
  fresh.profile.personal.location = "";
  fresh.profile.personal.photo = "";
  fresh.profile.personal.photoName = "";
  write(fresh);

  if (password) {
    try {
      const data = await seekerAuth.registerSeeker({ name: (name || "").trim(), email: cleanEmail, password, phone });
      if (data?.user?.id) {
        fresh.auth.userId = data.user.id;
        fresh.auth.email = data.user.email || cleanEmail;
        write(fresh);
      }
    } catch (e) {
      console.warn("Backend register error, kept in local draft:", e.message);
      throw e;
    }
  }
  return fresh;
}

export async function verifyEmail(email, code = "123456") {
  const store = getStore();
  const targetEmail = (email || store.auth.email || "").trim().toLowerCase();
  if (!targetEmail) {
    throw new Error("Email address is required for verification");
  }

  const res = await seekerAuth.verifySeekerEmail({ email: targetEmail, code: String(code || "").trim() });
  const userData = res?.user || {};

  store.initialized = true;
  store.auth = {
    ...store.auth,
    loggedIn: true,
    emailVerified: true,
    email: userData.email || targetEmail,
    name: userData.full_name || store.auth.name,
    userId: userData.id || store.auth.userId,
    phone: userData.phone || store.auth.phone || "",
    role: userData.role || userData.user_type || store.auth.role || "jobseeker",
  };

  if (!store.profile) store.profile = emptyStore().profile;
  if (!store.profile.personal) store.profile.personal = emptyStore().profile.personal;

  if (userData.full_name && !store.profile.personal.fullName) {
    store.profile.personal.fullName = userData.full_name;
  }
  if (userData.phone && !store.profile.personal.phone) {
    store.profile.personal.phone = userData.phone;
  }
  if (!store.profile.personal.email) {
    store.profile.personal.email = targetEmail;
  }

  write(store);

  try {
    await syncSeekerWithBackend();
  } catch (syncErr) {
    console.warn("syncSeekerWithBackend after verifyEmail failed:", syncErr);
  }

  return store;
}

export async function sendVerificationCode(email) {
  const store = getStore();
  const targetEmail = (email || store.auth.email || "").trim().toLowerCase();
  if (!targetEmail) throw new Error("Email address is required to send verification code");
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
      const userPhone = data.phone || userData.phone || store.auth.phone || "";
      store.auth = {
        loggedIn: true,
        emailVerified: !!(data.email_verified || userData.email_verified || userData.is_verified),
        name: data.name || userData.name || userData.full_name || store.auth.name,
        email: data.email || userData.email || store.auth.email,
        phone: userPhone,
        userId: data.user_id || userData.user_id || userData.id,
        role: data.role || userData.role || "jobseeker",
      };
      if (userPhone && (!store.profile?.personal?.phone || !store.profile.personal.phone.trim())) {
        if (!store.profile) store.profile = emptyStore().profile;
        if (!store.profile.personal) store.profile.personal = emptyStore().profile.personal;
        store.profile.personal.phone = userPhone;
      }
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
  const profile = store.profile || emptyStore().profile;
  if ((!profile?.personal?.phone || !profile.personal.phone.trim()) && store.auth?.phone) {
    if (!profile.personal) profile.personal = emptyStore().profile.personal;
    profile.personal.phone = store.auth.phone;
  }
  return profile;
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
    education: patch.education || store.profile.education || [],
    experience: patch.experience || store.profile.experience || [],
    certifications: patch.certifications || store.profile.certifications || [],
    achievements: patch.achievements || store.profile.achievements || [],
    portfolio: { ...(store.profile.portfolio || {}), ...(patch.portfolio || {}) },
    resume: { ...(store.profile.resume || {}), ...(patch.resume || {}) },
    resumes: patch.resumes || store.profile.resumes || [],
  };
  write(store);
  return store.profile;
}

export function getAchievements() {
  return getProfile().achievements || [];
}

export function getPortfolio() {
  return getProfile().portfolio || { url: "", fileName: "", size: 0, type: "", dataUrl: "", projects: [] };
}

export async function saveProfile(patch = {}) {
  const profile = saveProfileLocally(patch);

  if (getSeekerToken()) {
    try {
      const res = await seekerApi.updateSeekerProfile(profile);
      const p = res?.data || res;
      if (p) {
        if (p.full_name) profile.personal.fullName = p.full_name;
        if (p.phone !== undefined) {
          profile.personal.phone = p.phone || "";
          const store = getStore();
          if (store?.auth) store.auth.phone = p.phone || "";
        }
        if (p.avatar_url) profile.personal.photo = p.avatar_url;
        if (p.headline) profile.professional.title = p.headline;
        if (p.city) profile.personal.location = p.city;
        write(getStore());
      }
    } catch (e) {
      console.warn("Backend updateSeekerProfile failed:", e.message);
      const isAuthErr =
        e.status === 401 ||
        (e.message && e.message.toLowerCase().includes("token has expired")) ||
        (e.message && e.message.toLowerCase().includes("unauthorized"));
      if (isAuthErr) {
        removeSeekerToken();
        removeSeekerRefreshToken();
        const store = getStore();
        if (store?.auth) {
          store.auth.loggedIn = false;
        }
        write(store);
      }
      throw e;
    }
  }

  return profile;
}

if (typeof window !== "undefined") {
  window.addEventListener("lv360-auth-expired", () => {
    const store = getStore();
    if (store?.auth?.loggedIn) {
      store.auth.loggedIn = false;
      write(store);
    }
  });
}

export function getProfileCompleteness() {
  return computeCompleteness(getProfile());
}

export const avatarPublicHref = seekerApi.avatarPublicHref;

export async function uploadAvatar(file) {
  if (!file) return null;
  const res = await seekerApi.uploadSeekerAvatar(file);
  const avatarUrl = res?.data?.avatar_url || res?.avatar_url || "";
  if (avatarUrl) {
    const store = getStore();
    if (store.profile?.personal) {
      store.profile.personal.photo = avatarUrl;
      store.profile.personal.photoName = file.name;
    }
    if (store.auth) {
      store.auth.avatarUrl = avatarUrl;
    }
    write(store);
  }
  return avatarUrl;
}

// ---- RESUME --------------------------------------------------------------

export function getResume() {
  const r = getProfile().resume || {};
  return { ...emptyResumeSlot(), ...r };
}

export function getResumes() {
  const store = getStore();
  migrateProfileResumes(store.profile);
  return (store.profile.resumes || []).slice();
}

export function getProfileAttachmentUsage(excludeOptions = {}) {
  const store = getStore();
  const usedBytes = calculateProfileAttachmentBytes(store.profile, excludeOptions);
  const maxBytes = MAX_PROFILE_ATTACHMENT_BYTES;
  const maxMb = MAX_PROFILE_ATTACHMENT_MB;
  const percentUsed = Math.min(100, Math.round((usedBytes / maxBytes) * 100));
  return {
    usedBytes,
    maxBytes,
    usedMb: (usedBytes / (1024 * 1024)).toFixed(1),
    maxMb,
    percentUsed,
    remainingBytes: Math.max(0, maxBytes - usedBytes),
    isOverQuota: usedBytes > maxBytes,
  };
}

function applyApiResumePayload(store, payload) {
  const items = payload?.items || (Array.isArray(payload) ? payload : null);
  if (items) {
    applyResumeList(store, items.map(mapApiResume));
    return;
  }
  if (payload?.item) {
    const mapped = mapApiResume(payload.item);
    const rest = (store.profile.resumes || []).filter((r) => String(r.id) !== String(mapped.id));
    applyResumeList(store, [...rest, mapped]);
  }
}

export async function refreshResumesFromApi() {
  const store = getStore();
  if (!getSeekerToken()) {
    migrateProfileResumes(store.profile);
    applyResumeList(store, store.profile.resumes || []);
    write(store);
    return getResumes();
  }
  try {
    const payload = await seekerApi.listSeekerResumes();
    applyApiResumePayload(store, payload);
    write(store);
  } catch (e) {
    console.warn("Backend listSeekerResumes failed:", e.message);
    migrateProfileResumes(store.profile);
  }
  return getResumes();
}

export async function saveResume({ fileName, size, type, dataUrl, file } = {}) {
  const store = getStore();
  migrateProfileResumes(store.profile);
  const list = store.profile.resumes || [];
  if (list.length >= MAX_PROFILE_RESUMES) {
    throw new Error(MAX_RESUME_ERROR);
  }

  const incomingBytes = Number(size || file?.size || 0);
  const usage = getProfileAttachmentUsage();
  if (usage.usedBytes + incomingBytes > MAX_PROFILE_ATTACHMENT_BYTES) {
    throw new Error(MAX_PROFILE_ATTACHMENT_ERROR);
  }

  if (getSeekerToken() && file) {
    const payload = await seekerApi.uploadSeekerResume(file);
    applyApiResumePayload(store, payload);
    write(store);
    return store.profile.resume;
  }

  const item = {
    id: `local-${Date.now()}`,
    fileName: fileName || file?.name || "",
    size: size || file?.size || 0,
    type: type || file?.type || "",
    dataUrl: dataUrl || "",
    fileUrl: "",
    uploadedAt: new Date().toISOString().slice(0, 10),
    isDefault: list.length === 0,
  };
  applyResumeList(store, [...list, item]);
  write(store);

  if (getSeekerToken() && !file) {
    try {
      await seekerApi.saveSeekerResume({
        fileName: item.fileName,
        size: item.size,
        mimeType: item.type || "",
        dataUrl: item.dataUrl,
      });
    } catch (e) {
      console.warn("Backend saveSeekerResume failed:", e.message);
    }
  }

  return store.profile.resume;
}

export async function setDefaultResume(id) {
  const store = getStore();
  migrateProfileResumes(store.profile);
  if (getSeekerToken() && id && !String(id).startsWith("local-")) {
    try {
      const payload = await seekerApi.setDefaultSeekerResume(id);
      applyApiResumePayload(store, payload);
      write(store);
      return getResumes();
    } catch (e) {
      console.warn("Backend setDefaultSeekerResume failed:", e.message);
    }
  }
  applyResumeList(
    store,
    (store.profile.resumes || []).map((r) => ({ ...r, isDefault: String(r.id) === String(id) })),
  );
  write(store);
  return getResumes();
}

export async function removeResume(id) {
  const store = getStore();
  migrateProfileResumes(store.profile);
  const targetId = id || (store.profile.resumes || []).find((r) => r.isDefault)?.id || store.profile.resumes?.[0]?.id;
  if (!targetId) {
    applyResumeList(store, []);
    write(store);
    return store.profile.resume;
  }

  if (getSeekerToken() && !String(targetId).startsWith("local-")) {
    try {
      const payload = await seekerApi.removeSeekerResume(targetId);
      applyApiResumePayload(store, payload);
      write(store);
      return store.profile.resume;
    } catch (e) {
      console.warn("Backend removeSeekerResume failed:", e.message);
    }
  }

  applyResumeList(store, (store.profile.resumes || []).filter((r) => String(r.id) !== String(targetId)));
  write(store);
  return store.profile.resume;
}

export async function renameResume(id, newName) {
  const store = getStore();
  migrateProfileResumes(store.profile);
  const targetId = id;
  const trimmed = (newName || "").trim();
  if (!targetId || !trimmed) return getResumes();

  if (getSeekerToken() && !String(targetId).startsWith("local-")) {
    try {
      const payload = await seekerApi.renameSeekerResume(targetId, trimmed);
      applyApiResumePayload(store, payload);
      write(store);
      return getResumes();
    } catch (e) {
      console.warn("Backend renameSeekerResume failed:", e.message);
    }
  }

  const updated = (store.profile.resumes || []).map((r) =>
    String(r.id) === String(targetId) ? { ...r, resumeName: trimmed } : r
  );
  applyResumeList(store, updated);
  write(store);
  return getResumes();
}

// ---- CANDIDATE DOCUMENT ARCHIVE (JSP-FR-012) -----------------------------

export const DOCUMENT_CATEGORIES = UPLOAD_CONFIG.DOCUMENT_ARCHIVE.categories;
export const MAX_DOCUMENT_FILE_SIZE_BYTES = UPLOAD_CONFIG.DOCUMENT_ARCHIVE.maxBytes;
export const MAX_ARCHIVE_STORAGE_BYTES = UPLOAD_CONFIG.DOCUMENT_ARCHIVE.quotaBytes;

export function getArchivedDocuments(category = "all") {
  const store = getStore();
  const docs = store.documents || [];
  if (!category || category === "all") return docs;
  return docs.filter((d) => (d.category || "").toLowerCase() === category.toLowerCase());
}

export function getArchiveStorageUsage() {
  const store = getStore();
  const docs = store.documents || [];
  const usedBytes = docs.reduce((sum, d) => sum + Number(d.sizeBytes || d.size || 0), 0);
  const maxBytes = MAX_ARCHIVE_STORAGE_BYTES;
  const percentUsed = Math.min(100, Math.round((usedBytes / maxBytes) * 100));
  return {
    usedBytes,
    maxBytes,
    percentUsed,
    usedMb: (usedBytes / (1024 * 1024)).toFixed(1),
    maxMb: 100,
  };
}

export async function refreshArchivedDocuments(category = "all") {
  const store = getStore();
  if (!getSeekerToken()) return getArchivedDocuments(category);
  try {
    const payload = await seekerApi.fetchSeekerDocuments(category);
    if (payload && Array.isArray(payload.items)) {
      const mapped = payload.items.map((item) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        fileName: item.file_name,
        fileUrl: item.file_url,
        dataUrl: seekerApi.resumePublicHref(item.file_url) || item.file_url,
        mimeType: item.mime_type,
        sizeBytes: item.size_bytes,
        createdAt: item.created_at,
      }));
      store.documents = mapped;
      write(store);
      return mapped;
    }
  } catch (e) {
    console.warn("refreshArchivedDocuments failed:", e.message);
  }
  return getArchivedDocuments(category);
}

export async function uploadArchivedDocument({ file, category = "other", title = "" }) {
  const store = getStore();
  if (!file) throw new Error("Please select a file to upload.");

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new Error("File exceeds the 10MB maximum limit.");
  }

  const currentUsage = getArchiveStorageUsage();
  if (currentUsage.usedBytes + file.size > MAX_ARCHIVE_STORAGE_BYTES) {
    throw new Error("Total document storage limit (100MB) exceeded. Please delete some documents first.");
  }

  const catClean = (category || "other").trim().toLowerCase();

  if (getSeekerToken()) {
    const result = await seekerApi.uploadSeekerDocument(file, catClean, title || file.name);
    if (result) {
      await refreshArchivedDocuments();
      return getArchivedDocuments();
    }
  }

  const localDoc = {
    id: `doc-${Date.now()}`,
    category: catClean,
    title: title || file.name,
    fileName: file.name,
    fileUrl: "",
    dataUrl: "",
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    createdAt: new Date().toISOString(),
  };

  store.documents = [localDoc, ...(store.documents || [])];
  write(store);
  return getArchivedDocuments();
}

export async function deleteArchivedDocument(docId) {
  const store = getStore();
  if (getSeekerToken() && !String(docId).startsWith("doc-")) {
    try {
      await seekerApi.deleteSeekerDocument(docId);
    } catch (e) {
      console.warn("deleteArchivedDocument failed:", e.message);
      throw e;
    }
  }

  store.documents = (store.documents || []).filter((d) => String(d.id) !== String(docId));
  write(store);
  return getArchivedDocuments();
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

  if (cert && cert.fileSize) {
    const currentUsage = getProfileAttachmentUsage({ excludeCertId: cert.id });
    if (currentUsage.usedBytes + Number(cert.fileSize) > MAX_PROFILE_ATTACHMENT_BYTES) {
      throw new Error(MAX_PROFILE_ATTACHMENT_ERROR);
    }
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

export const MAX_SAVED_JOBS = 100;
export const MAX_SAVED_JOBS_ERROR = "You can save up to 100 jobs. Please remove some jobs before saving new ones.";

export async function toggleSavedJob(jobId, jobData = null) {
  const store = getStore();
  const idStr = String(jobId);
  const has = store.savedJobs.some((item) => String(getSavedJobId(item)) === idStr);

  if (has) {
    store.savedJobs = store.savedJobs.filter((item) => String(getSavedJobId(item)) !== idStr);
  } else {
    if ((store.savedJobs || []).length >= MAX_SAVED_JOBS) {
      throw new Error(MAX_SAVED_JOBS_ERROR);
    }
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
      // Revert local store on failure
      const revertStore = getStore();
      if (!has) {
        revertStore.savedJobs = (revertStore.savedJobs || []).filter((item) => String(getSavedJobId(item)) !== idStr);
        write(revertStore);
      }
      throw e;
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

export function checkReapplicationEligibility(jobId) {
  const store = getStore();
  const idStr = String(jobId);
  const matchingApps = (store.applications || []).filter(
    (a) => String(a.jobId) === idStr || String(a.job?.id) === idStr
  );
  if (!matchingApps.length) {
    return { canApply: true };
  }

  // Check for active application (not rejected, not withdrawn)
  const activeApp = matchingApps.find((a) => {
    const stage = (a.stage || a.status || "").toLowerCase();
    return stage !== "rejected" && stage !== "withdrawn";
  });
  if (activeApp) {
    return { canApply: false, reason: "already_applied", application: activeApp };
  }

  // Check for rejected application within 90 days (JSP-FR-005b / BR-301-09)
  const rejectedApps = matchingApps.filter((a) => (a.stage || a.status || "").toLowerCase() === "rejected");
  if (rejectedApps.length > 0) {
    rejectedApps.sort((a, b) => {
      const da = new Date(a.rejectedAt || a.updated_at || a.appliedDate || 0);
      const db = new Date(b.rejectedAt || b.updated_at || b.appliedDate || 0);
      return db - da;
    });
    const latest = rejectedApps[0];
    const rejDate = new Date(latest.rejectedAt || latest.updated_at || latest.appliedDate || Date.now());
    const diffMs = Date.now() - rejDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 90) {
      const daysRemaining = 90 - diffDays;
      const eligibleDate = new Date(rejDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return {
        canApply: false,
        reason: "rejected_lockout",
        daysRemaining,
        eligibleDate,
        application: latest,
      };
    }
  }

  return { canApply: true };
}

export function hasAppliedToJob(jobId) {
  const eligibility = checkReapplicationEligibility(jobId);
  return !eligibility.canApply;
}

export function getApplicationByJobId(jobId) {
  const idStr = String(jobId);
  return (getStore().applications || []).find((a) => String(a.jobId) === idStr || String(a.job?.id) === idStr) || null;
}

export async function addApplication(app) {
  const store = getStore();

  // BR-101-02: Profile completeness must be >= 60%
  const comp = computeCompleteness(store.profile, store.auth);
  if (comp < 60) {
    throw new Error(`Profile completeness must be at least 60% to apply (BR-101-02). Your profile is currently at ${comp}%.`);
  }

  // JSP-FR-005b / BR-301-09: Reapplication eligibility check
  const eligibility = checkReapplicationEligibility(app.jobId);
  if (!eligibility.canApply) {
    if (eligibility.reason === "rejected_lockout") {
      throw new Error(`You can reapply for this job after 90 days (${eligibility.daysRemaining} days remaining, eligible: ${eligibility.eligibleDate}).`);
    }
    throw new Error("You have already submitted an active application for this position.");
  }

  const id = "APP-" + (2000 + store.applications.length + Math.floor(Math.random() * 100));
  const nowIso = new Date().toISOString();
  const record = {
    id,
    jobId: app.jobId,
    job: app.job || null,
    appliedDate: nowIso.slice(0, 10),
    stage: "Applied",
    closed: false,
    timeline: [{ stage: "Applied", date: nowIso.slice(0, 10) }],
    resumeFileName: app.resumeFileName || store.profile.resume.fileName,
    resumeName: app.resumeName || app.resumeFileName || store.profile.resume.fileName || "Resume",
    resumeId: app.resumeId || null,
    coverLetter: app.coverLetter || "",
    answers: app.answers || {},
    certifications: app.certifications || (app.certification ? [app.certification] : []),
    certification: app.certification || null,
    consent: true,
    consentTimestamp: nowIso,
  };
  store.applications = [...store.applications, record];
  write(store);

  if (getSeekerToken()) {
    try {
      const res = await seekerApi.applyToJob(app.jobId, {
        resumeFileName: record.resumeFileName,
        resumeName: record.resumeName,
        resumeId: app.resumeId,
        resumeFile: app.resumeFile || null,
        saveToProfile: app.saveToProfile !== false,
        resumeUrl: app.resumeUrl || "",
        coverLetter: record.coverLetter,
        answers: record.answers,
        consent: true,
      });
      if (res?.application_id) {
        record.id = res.application_id;
        write(store);
      }
    } catch (e) {
      console.warn("Backend applyToJob failed:", e.message);
      // Rollback local addition if backend rejected the submission
      const rollbackStore = getStore();
      rollbackStore.applications = (rollbackStore.applications || []).filter((a) => a.id !== record.id);
      write(rollbackStore);
      throw e;
    }
  }

  return record;
}

export async function withdrawApplication(id) {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  const numId = Number(id);

  if (getSeekerToken() && !String(id).startsWith("APP-")) {
    try {
      await seekerApi.withdrawApplication(numId || id);
    } catch (e) {
      console.warn("Backend withdrawApplication failed:", e.message);
      throw e;
    }
  }

  store.applications = (store.applications || []).map((a) => {
    if (String(a.id) === String(id)) {
      const existingTimeline = Array.isArray(a.timeline) ? a.timeline : [];
      const hasWithdrawnInTimeline = existingTimeline.some((tl) => tl.stage === "Withdrawn");
      return {
        ...a,
        stage: "Withdrawn",
        status: "withdrawn",
        closed: true,
        timeline: hasWithdrawnInTimeline ? existingTimeline : [...existingTimeline, { stage: "Withdrawn", date: today }],
      };
    }
    return a;
  });
  write(store);

  return store.applications.find((a) => String(a.id) === String(id)) || null;
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
