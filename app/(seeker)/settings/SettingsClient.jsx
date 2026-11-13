"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import {
  getProfile,
  saveProfile,
  saveProfileLocally,
  syncSeekerWithBackend,
  saveResume,
  removeResume,
  getSettings,
  saveSettings,
  getAuth,
  computeCompleteness,
  getMissingProfileFields,
  uploadAvatar,
  getProfileAttachmentUsage,
  updateJobAvailability,
  updateProfileVisibility,
} from "../../../lib/seekerStore";
import {
  validateAvatarFile,
  validateResumeFile,
  validateCertificationFile,
  validatePortfolioFile,
  validateCumulativeProfileAttachmentQuota,
} from "../../../utils/fileValidation";
import { createProfileValidationSchema } from "../../../lib/validation/profileValidation";
import { useMasterData, DEFAULT_MASTER_DATA } from "../../../lib/masterData";

// Tab Components
import ProfileTab from "./tabs/ProfileTab";
import PreferencesTab from "./tabs/PreferencesTab";
import NotificationsTab from "./tabs/NotificationsTab";
import PrivacyTab from "./tabs/PrivacyTab";
import AccountTab from "./tabs/AccountTab";

const TABS = ["Profile", "Preferences", "Notifications", "Privacy", "Account"];
const TAB_SLUGS = {
  Profile: "profile",
  Preferences: "preferences",
  Notifications: "notifications",
  Privacy: "privacy",
  Account: "account",
};
const SLUG_TABS = Object.fromEntries(Object.entries(TAB_SLUGS).map(([k, v]) => [v, k]));
const INDUSTRIES = DEFAULT_MASTER_DATA.industries;

function generateAvatarDataUrl(name = "?") {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
  const COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#db2777", "#7c3aed", "#dc2626", "#0284c7"];
  const bg = COLORS[initials.charCodeAt(0) % COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <circle cx="64" cy="64" r="64" fill="${bg}"/>
    <text x="64" y="64" dy="0.35em" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="52" font-weight="700" fill="#ffffff">${initials}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function emptyEducation() {
  return { degree: "", institution: "", year: "" };
}

function emptyCertification() {
  return {
    id: "cert-" + Date.now(),
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
    fileName: "",
    fileSize: 0,
  };
}

function emptyExperience() {
  return { company: "", title: "", start: "", end: "", isCurrent: false, responsibilities: "" };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function SettingsClient() {
  const [lang] = useLang();
  const { industries, locations } = useMasterData();
  const industryList = industries && industries.length > 0 ? industries : INDUSTRIES;
  const locationList = locations && locations.length > 0 ? locations : (DEFAULT_MASTER_DATA.locations || []);
  const router = useRouter();
  const [tab, setTabState] = useState("Profile");
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [auth, setAuth] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErr, setPwErr] = useState("");
  const [toast, setToast] = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isResumeDragging, setIsResumeDragging] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const portfolioInputRef = useRef(null);
  const [accountPhone, setAccountPhone] = useState("");
  const [accountPhoneErr, setAccountPhoneErr] = useState("");
  const [isSavingAccountPhone, setIsSavingAccountPhone] = useState(false);
  const [liveSuccessMessage, setLiveSuccessMessage] = useState("");

  useEffect(() => {
    const prof = getProfile();
    setProfile(prof);
    setAccountPhone(prof?.personal?.phone || "");
    setSettings(getSettings());
    setAuth(getAuth());

    syncSeekerWithBackend()
      .then(() => {
        const syncedProf = getProfile();
        setProfile(syncedProf);
        setAccountPhone(syncedProf?.personal?.phone || "");
        setSettings(getSettings());
        setAuth(getAuth());
      })
      .catch((e) => {
        console.warn("syncSeekerWithBackend in SettingsClient failed:", e);
      });

    import("../../../lib/api/seekerApi").then(({ getNotificationPreferences }) => {
      getNotificationPreferences()
        .then((pref) => {
          if (pref && pref.notifications) {
            setSettings((prev) => ({
              ...prev,
              preferred_language: pref.preferred_language || "vi",
              notifications: {
                ...prev?.notifications,
                jobRecs: pref.notifications.job_recommendations,
                appUpdates: pref.notifications.application_updates,
                interviewAlerts: pref.notifications.interview_alerts,
                marketing: pref.notifications.marketing,
                inApp: pref.notifications.in_app_enabled,
              },
            }));
          }
        })
        .catch(() => {});
    });

    try {
      const slug = new URLSearchParams(window.location.search).get("tab");
      if (slug && SLUG_TABS[slug]) setTabState(SLUG_TABS[slug]);
    } catch (e) {}
  }, []);

  const validationSchema = createProfileValidationSchema(t, lang);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullName: profile?.personal?.fullName || "",
      phone: profile?.personal?.phone || auth?.phone || "",
      location: profile?.personal?.location || "",
      citizenId: profile?.personal?.citizenId || "",
      title: profile?.professional?.title || "",
      experience: profile?.professional?.experience || "",
      industry: profile?.professional?.industry || "",
      portfolioUrl: profile?.portfolio?.url || profile?.portfolioUrl || "",
      workMode: profile?.preferences?.workMode || "",
      salary: profile?.preferences?.salary || "",
    },
    validationSchema,
    onSubmit: async () => {},
  });

  const setTab = (tb) => {
    setTabState(tb);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", TAB_SLUGS[tb]);
      window.history.replaceState(null, "", url);
    } catch (e) {}
  };

  if (!profile || !settings || !auth) return null;

  const persist = (patch) => {
    const next = saveProfileLocally(patch);
    setProfile(next);
    if (patch.personal?.phone !== undefined) {
      setAccountPhone(patch.personal.phone);
    }
  };

  const persistSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(patch);
    // Profile visibility changes must take effect immediately across all views
    if (patch.privacy?.profileVisibility) {
      const isPublic = !patch.privacy.profileVisibility.toLowerCase().includes("private");
      try {
        await saveProfile({
          visibility: isPublic ? "public" : "private",
          is_visible: isPublic,
          settings: next,
        });
      } catch (e) {
        console.warn("Immediate visibility sync failed:", e);
      }
    }
    // Sync notification preferences & preferred language to backend (NTF-FR-005, NTF-FR-007)
    if (patch.notifications || patch.preferred_language) {
      try {
        const { updateNotificationPreferences } = await import("../../../lib/api/seekerApi");
        await updateNotificationPreferences({
          preferred_language: patch.preferred_language || next.preferred_language || "vi",
          job_recommendations: next.notifications?.jobRecs,
          application_updates: next.notifications?.appUpdates,
          interview_alerts: next.notifications?.interviewAlerts,
          marketing: next.notifications?.marketing,
          in_app_enabled: next.notifications?.inApp ?? true,
        });
      } catch (e) {
        console.warn("Syncing notification preferences failed:", e);
      }
    }
    setToast(t(lang, "Saved"));
  };

  const handleJobAvailabilityChange = async (newVal) => {
    try {
      await updateJobAvailability(newVal);
      setProfile((prev) => ({ ...prev, jobAvailability: newVal }));
      setSettings((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, jobAvailability: newVal },
      }));
      setLiveSuccessMessage(t(lang, "Job availability updated & live immediately"));
      setToast(t(lang, "Availability status updated immediately!"));
      setTimeout(() => setLiveSuccessMessage(""), 5000);
    } catch (e) {
      console.error("Failed to update availability:", e);
      setToast(t(lang, "Failed to update availability status."));
    }
  };

  const handleProfileVisibilityChange = async (newVal) => {
    try {
      await updateProfileVisibility(newVal);
      const isPublic = !newVal.toLowerCase().includes("private");
      setSettings((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, profileVisibility: newVal },
      }));
      setProfile((prev) => ({
        ...prev,
        visibility: isPublic ? "public" : "private",
        is_visible: isPublic,
      }));
      setLiveSuccessMessage(t(lang, "Profile visibility updated & live immediately"));
      setToast(t(lang, "Visibility changes take effect immediately!"));
      setTimeout(() => setLiveSuccessMessage(""), 5000);
    } catch (e) {
      console.error("Failed to update visibility:", e);
      setToast(t(lang, "Failed to update profile visibility."));
    }
  };

  const handleFullNameInput = (e) => {
    let val = e.target.value;
    if (val.startsWith(" ")) val = val.trimStart();
    if (val.length > 30) val = val.slice(0, 30);
    val = val.replace(/[^a-zA-Z\s\u00C0-\u024F\u1EA0-\u1EF9\-\'.]/g, "");
    formik.setFieldValue("fullName", val);
  };

  const handleLocationInput = (e) => {
    let val = e.target.value;
    val = val.replace(/[^a-zA-Z0-9\s\u00C0-\u024F\u1EA0-\u1EF9\-\.,]/g, "");
    formik.setFieldValue("location", val);
  };

  const handleSaveProfile = async () => {
    formik.setTouched({
      fullName: true,
      location: true,
      phone: true,
      citizenId: true,
      title: true,
      salary: true,
    });
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      const firstErr = Object.values(errors)[0];
      setToast(firstErr || t(lang, "Please fix validation errors before saving."));
      return;
    }

    const profileToSave = {
      ...profile,
      personal: {
        ...(profile.personal || {}),
        fullName: formik.values.fullName,
        phone: formik.values.phone,
        location: formik.values.location,
        citizenId: formik.values.citizenId,
      },
      professional: {
        ...(profile.professional || {}),
        title: formik.values.title,
        experience: formik.values.experience,
        industry: formik.values.industry,
      },
      portfolio: {
        ...(profile.portfolio || {}),
        url: formik.values.portfolioUrl,
      },
      preferences: {
        ...(profile.preferences || {}),
        workMode: formik.values.workMode,
        salary: formik.values.salary,
      },
    };

    setIsSaving(true);
    try {
      const saved = await saveProfile(profileToSave);
      setProfile(saved);
      setAccountPhone(saved?.personal?.phone || "");
      setToast(t(lang, "Profile saved successfully!"));
    } catch (err) {
      console.error("Save profile error:", err);
      const errMsg = err.message || "";
      const isAuthErr =
        err.status === 401 ||
        errMsg.toLowerCase().includes("token has expired") ||
        errMsg.toLowerCase().includes("unauthorized") ||
        errMsg.toLowerCase().includes("credentials");

      const isPhoneErr =
        err.status === 400 ||
        errMsg.toLowerCase().includes("phone") ||
        errMsg.toLowerCase().includes("mobile") ||
        errMsg.toLowerCase().includes("already exists") ||
        errMsg.toLowerCase().includes("already added");

      if (isAuthErr) {
        setProfile(profileToSave);
        setToast(
          lang === "VN" || lang === "VI"
            ? "Phiên đăng nhập đã hết hạn. Thông tin đã được lưu cục bộ, vui lòng đăng nhập lại để đồng bộ."
            : "Session expired. Your changes are saved locally. Please log in again to sync."
        );
      } else if (isPhoneErr) {
        const phoneErrorText =
          errMsg.includes("already exists") || errMsg.includes("already added") || errMsg.includes("BR-101-01")
            ? t(lang, "An active account with this phone number already exists.")
            : errMsg || t(lang, "Invalid phone number. Please check and try again.");
        formik.setFieldError("phone", phoneErrorText);
        setToast(phoneErrorText);
      } else {
        setToast(errMsg || t(lang, "Failed to save profile. Please check your phone number and try again."));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAccountPhone = async () => {
    setAccountPhoneErr("");
    const cleanDigits = (accountPhone || "").replace(/\D/g, "");
    if (cleanDigits.length > 3 && cleanDigits.length < 7) {
      setAccountPhoneErr(t(lang, "Please enter a valid phone number (at least 7 digits)."));
      return;
    }
    setIsSavingAccountPhone(true);
    try {
      const updated = {
        ...profile,
        personal: {
          ...(profile.personal || {}),
          phone: accountPhone,
        },
      };
      const saved = await saveProfile(updated);
      setProfile(saved);
      formik.setFieldValue("phone", accountPhone);
      setToast(t(lang, "Phone number updated successfully!"));
    } catch (err) {
      console.error("Save account phone error:", err);
      const errMsg = err.message || "";
      const isPhoneErr =
        err.status === 400 ||
        errMsg.toLowerCase().includes("phone") ||
        errMsg.toLowerCase().includes("mobile") ||
        errMsg.toLowerCase().includes("already exists") ||
        errMsg.toLowerCase().includes("already added");

      const phoneErrorText =
        isPhoneErr && (errMsg.includes("already exists") || errMsg.includes("already added") || errMsg.includes("BR-101-01"))
          ? t(lang, "An active account with this phone number already exists.")
          : errMsg || t(lang, "Failed to update phone number.");

      setAccountPhoneErr(phoneErrorText);
      setToast(phoneErrorText);
    } finally {
      setIsSavingAccountPhone(false);
    }
  };

  const updateEducation = (i, field, value) => {
    const list = profile.education.slice();
    list[i] = { ...list[i], [field]: value };
    persist({ education: list });
  };
  const addEducation = () => persist({ education: [...profile.education, emptyEducation()] });
  const removeEducation = (i) => persist({ education: profile.education.filter((_, idx) => idx !== i) });

  const updateCertification = (i, field, value) => {
    const list = (profile.certifications || []).slice();
    list[i] = { ...list[i], [field]: value };
    persist({ certifications: list });
  };
  const addCertification = () => persist({ certifications: [...(profile.certifications || []), emptyCertification()] });
  const removeCertification = (i) => persist({ certifications: (profile.certifications || []).filter((_, idx) => idx !== i) });
  const handleCertFileUpload = async (i, file) => {
    if (!file) return;
    const validation = validateCertificationFile(file, lang);
    if (!validation.valid) {
      setToast(t(lang, validation.error));
      return;
    }
    const quotaValidation = validateCumulativeProfileAttachmentQuota(file.size, profile, { excludeCertIndex: i }, lang);
    if (!quotaValidation.valid) {
      setToast(t(lang, quotaValidation.error));
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const list = (profile.certifications || []).slice();
      list[i] = {
        ...list[i],
        fileName: file.name,
        fileSize: file.size,
        fileDataUrl: dataUrl,
      };
      persist({ certifications: list });
      setToast(t(lang, "Certificate attached"));
    } catch {
      setToast(t(lang, "Could not attach file"));
    }
  };

  const updateExperience = (i, field, value) => {
    const list = profile.experience.slice();
    list[i] = { ...list[i], [field]: value };
    if (field === "isCurrent" && value === true) list[i].end = "";
    if (field === "end" && value) list[i].isCurrent = false;
    persist({ experience: list });
  };
  const addExperience = () => persist({ experience: [...profile.experience, emptyExperience()] });
  const removeExperience = (i) => persist({ experience: profile.experience.filter((_, idx) => idx !== i) });

  const onPhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    const validation = validateAvatarFile(file, lang);
    if (!validation.valid) {
      setToast(t(lang, validation.error));
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      persist({ personal: { ...profile.personal, photo: dataUrl, photoName: file.name } });
      try {
        const uploadedUrl = await uploadAvatar(file);
        if (uploadedUrl) {
          persist({ personal: { ...profile.personal, photo: uploadedUrl, photoName: file.name } });
        }
      } catch (uploadErr) {
        console.warn("Direct avatar upload fallback:", uploadErr);
      }
      setToast(t(lang, "Photo updated"));
    } catch {
      setToast(t(lang, "Could not read image file."));
    }
  };

  const onGenerateAvatar = () => {
    const dataUrl = generateAvatarDataUrl(profile.personal?.fullName || "User");
    persist({ personal: { ...profile.personal, photo: dataUrl, photoName: "generated-avatar.svg" } });
    setToast(t(lang, "Random avatar applied"));
  };

  const handleResumeFile = async (file) => {
    if (!file) return;
    const validation = validateResumeFile(file, lang);
    if (!validation.valid) {
      setToast(t(lang, validation.error));
      return;
    }
    const quotaValidation = validateCumulativeProfileAttachmentQuota(file.size, profile, {}, lang);
    if (!quotaValidation.valid) {
      setToast(t(lang, quotaValidation.error));
      return;
    }
    setResumeUploading(true);
    setToast(t(lang, "Reading file…"));
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const mime = file.type || "application/pdf";
      await saveResume({ fileName: file.name, size: file.size, type: mime, dataUrl, file });
      setProfile(getProfile());
      setToast(t(lang, "Résumé saved successfully!"));
    } catch (err) {
      console.error("Resume read error:", err);
      setToast(t(lang, err.message || "Could not read resume file."));
    } finally {
      setResumeUploading(false);
    }
  };

  const onResumeChange = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (file) handleResumeFile(file);
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResumeDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleResumeFile(file);
  };

  const handleRemoveResume = async (id) => {
    await removeResume(id);
    setProfile(getProfile());
    setToast(t(lang, "Résumé removed"));
  };

  const handlePortfolioFile = async (file) => {
    if (!file) return;
    const validation = validatePortfolioFile(file, lang);
    if (!validation.valid) {
      setToast(t(lang, validation.error));
      return;
    }
    const quotaValidation = validateCumulativeProfileAttachmentQuota(file.size, profile, { excludePortfolio: true }, lang);
    if (!quotaValidation.valid) {
      setToast(t(lang, quotaValidation.error));
      return;
    }
    setPortfolioUploading(true);
    setToast(t(lang, "Reading portfolio file…"));
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const mime = file.type || "application/pdf";
      const portObj = {
        ...profile?.portfolio,
        url: formik.values.portfolioUrl || profile?.portfolio?.url || "",
        fileName: file.name,
        size: file.size,
        type: mime,
        dataUrl,
        uploadedAt: new Date().toISOString().slice(0, 10),
      };
      persist({ portfolio: portObj, portfolioFile: portObj });
      setToast(t(lang, "Portfolio document saved successfully!"));
    } catch (err) {
      console.error("Portfolio read error:", err);
      setToast(t(lang, "Could not read portfolio file."));
    } finally {
      setPortfolioUploading(false);
    }
  };

  const handleRemovePortfolioFile = () => {
    const portObj = {
      ...profile?.portfolio,
      fileName: "",
      size: 0,
      type: "",
      dataUrl: "",
      uploadedAt: "",
    };
    persist({ portfolio: portObj, portfolioFile: null });
    setToast(t(lang, "Portfolio file removed"));
  };

  const handlePortfolioUrlChange = (val) => {
    formik.setFieldValue("portfolioUrl", val);
    formik.setFieldTouched("portfolioUrl", true, true);
    const portObj = {
      ...profile?.portfolio,
      url: val,
    };
    persist({ portfolio: portObj, portfolioUrl: val });
  };

  const submitPassword = () => {
    if (!pw.current || !pw.next) return setPwErr(t(lang, "Fill in both password fields."));
    if (pw.next.length < 8) return setPwErr(t(lang, "New password must be at least 8 characters."));
    if (pw.next !== pw.confirm) return setPwErr(t(lang, "Passwords do not match."));
    setPwErr("");
    setPw({ current: "", next: "", confirm: "" });
    setToast(t(lang, "Password updated"));
  };

  const completeness = computeCompleteness(profile);
  const isVi = lang === "VN" || lang === "VI";
  const missingFieldsList = completeness < 100 ? getMissingProfileFields(profile, lang) : [];

  return (
    <div className="lv-page-container">
      <div className="lv-dash-welcome">
        <h1>{t(lang, "Profile & Settings")}</h1>
        <p>{t(lang, "Manage your profile, preferences, notifications and account.")}</p>
      </div>

      <div className="lv-auth-tabs lv-settings-tabs" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
        {TABS.map((tb) => (
          <button
            key={tb}
            className={tab === tb ? "active" : ""}
            onClick={() => setTab(tb)}
            style={{ whiteSpace: "nowrap" }}
          >
            {t(lang, tb)}
          </button>
        ))}
      </div>

      <div className="lv-onboard-card">
        {tab === "Profile" && (
          <ProfileTab
            profile={profile}
            auth={auth}
            formik={formik}
            persist={persist}
            handleFullNameInput={handleFullNameInput}
            handleLocationInput={handleLocationInput}
            completeness={completeness}
            missingFieldsList={missingFieldsList}
            isVi={isVi}
            lang={lang}
            t={t}
            industryList={industryList}
            photoInputRef={photoInputRef}
            onPhotoChange={onPhotoChange}
            onGenerateAvatar={onGenerateAvatar}
            updateEducation={updateEducation}
            addEducation={addEducation}
            removeEducation={removeEducation}
            updateCertification={updateCertification}
            addCertification={addCertification}
            removeCertification={removeCertification}
            handleCertFileUpload={handleCertFileUpload}
            updateExperience={updateExperience}
            addExperience={addExperience}
            removeExperience={removeExperience}
            getProfileAttachmentUsage={getProfileAttachmentUsage}
            isResumeDragging={isResumeDragging}
            setIsResumeDragging={setIsResumeDragging}
            handleResumeDrop={handleResumeDrop}
            resumeInputRef={resumeInputRef}
            onResumeChange={onResumeChange}
            handleRemoveResume={handleRemoveResume}
            resumeUploading={resumeUploading}
            portfolioInputRef={portfolioInputRef}
            portfolioUploading={portfolioUploading}
            handlePortfolioFile={handlePortfolioFile}
            handleRemovePortfolioFile={handleRemovePortfolioFile}
            handlePortfolioUrlChange={handlePortfolioUrlChange}
            handleSaveProfile={handleSaveProfile}
            isSaving={isSaving}
          />
        )}

        {tab === "Preferences" && (
          <PreferencesTab
            profile={profile}
            persist={persist}
            lang={lang}
            t={t}
            setToast={setToast}
            locations={locationList}
          />
        )}

        {tab === "Notifications" && (
          <NotificationsTab
            settings={settings}
            persistSettings={persistSettings}
            lang={lang}
            t={t}
            setToast={setToast}
          />
        )}

        {tab === "Privacy" && (
          <PrivacyTab
            profile={profile}
            settings={settings}
            handleJobAvailabilityChange={handleJobAvailabilityChange}
            handleProfileVisibilityChange={handleProfileVisibilityChange}
            persistSettings={persistSettings}
            liveSuccessMessage={liveSuccessMessage}
            lang={lang}
            t={t}
          />
        )}

        {tab === "Account" && (
          <AccountTab
            auth={auth}
            accountPhone={accountPhone}
            setAccountPhone={setAccountPhone}
            accountPhoneErr={accountPhoneErr}
            setAccountPhoneErr={setAccountPhoneErr}
            isSavingAccountPhone={isSavingAccountPhone}
            handleSaveAccountPhone={handleSaveAccountPhone}
            pw={pw}
            setPw={setPw}
            pwErr={pwErr}
            submitPassword={submitPassword}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            router={router}
            lang={lang}
            t={t}
          />
        )}
      </div>
      <Toast msg={toast} />
    </div>
  );
}
