"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, Input, Select, PhoneInput } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import {
  getProfile,
  saveProfile,
  saveResume,
  removeResume,
  getSettings,
  saveSettings,
  getAuth,
  logout,
  resetAll,
  computeCompleteness,
} from "../../../lib/seekerStore";

const TABS = ["Profile", "Preferences", "Notifications", "Privacy", "Account"];
const TAB_SLUGS = { Profile: "profile", Preferences: "preferences", Notifications: "notifications", Privacy: "privacy", Account: "account" };
const SLUG_TABS = Object.fromEntries(Object.entries(TAB_SLUGS).map(([k, v]) => [v, k]));
const INDUSTRIES = ["Technology", "Retail & Commerce", "Media & Creative", "Transport & Logistics", "Manufacturing", "Finance & Banking", "Other"];
const EXPERIENCE_RANGES = ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const VISIBILITY_OPTIONS = ["Public to employers", "Private", "Hidden from current employer"];
const RESUME_VISIBILITY_OPTIONS = ["Visible when I apply", "Always visible to employers", "Hidden"];
// BR-101-03: Resume file size must not exceed 5 MB
const MAX_RESUME_MB = 5;

/** Generate a random avatar as a coloured SVG initials circle, returned as robust SVG data-URL */
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
  return { id: "cert-" + Date.now(), name: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "", credentialUrl: "", fileName: "", fileSize: 0 };
}

function emptyExperience() {
  return { company: "", title: "", start: "", end: "", isCurrent: false, responsibilities: "" };
}

/** Wrapper: read File as base64 data-URL (always full, no size limit) */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function fmtMonth(val) {
  if (!val || !val.includes("-")) return val;
  const parts = val.split("-");
  if (parts.length === 3) {
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return d.toLocaleString("default", { day: "numeric", month: "short", year: "numeric" });
  } else if (parts.length === 2) {
    const d = new Date(+parts[0], +parts[1] - 1, 1);
    return d.toLocaleString("default", { month: "short", year: "numeric" });
  }
  return val;
}

function ChipInput({ label, values, onAdd, onRemove, placeholder, allowSpecial = true, error }) {
  const [v, setV] = useState("");
  const [chipErr, setChipErr] = useState("");

  const handleAdd = () => {
    let clean = v.trim();
    if (!clean) return;
    if (!allowSpecial) {
      if (/[^a-zA-Z0-9\s\u00C0-\u024F\u1EA0-\u1EF9\-\.]/.test(clean)) {
        setChipErr("Special characters are not allowed.");
        return;
      }
    }
    setChipErr("");
    onAdd(clean);
    setV("");
  };

  return (
    <div>
      <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          value={v}
          onChange={(e) => {
            let val = e.target.value;
            if (!allowSpecial) {
              val = val.replace(/[^a-zA-Z0-9\s\u00C0-\u024F\u1EA0-\u1EF9\-\.]/g, "");
            }
            setV(val);
            setChipErr("");
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          error={chipErr || error}
        />
        <Button type="button" variant="secondary" onClick={handleAdd}>
          Add
        </Button>
      </div>
      {chipErr && <p className="text-xs text-danger" style={{ marginTop: 4 }}>{chipErr}</p>}
      <div className="lv-job-tags" style={{ marginTop: 12 }}>
        {values.map((x) => (
          <span key={x} className="lv-chip">
            {x}
            <button type="button" aria-label={"Remove " + x} onClick={() => onRemove(x)}>
              <Icon name="x" size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function Switch({ on, onChange, label }) {
  return (
    <div className="lv-settings-toggle-row">
      <span>{label}</span>
      <button type="button" className={`lv-switch ${on ? "on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
        <span />
      </button>
    </div>
  );
}

export default function SettingsClient() {
  const [lang] = useLang();
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

  useEffect(() => {
    setProfile(getProfile());
    setSettings(getSettings());
    setAuth(getAuth());
    try {
      const slug = new URLSearchParams(window.location.search).get("tab");
      if (slug && SLUG_TABS[slug]) setTabState(SLUG_TABS[slug]);
    } catch (e) { }
  }, []);

  const validationSchema = Yup.object().shape({
    fullName: Yup.string()
      .required(t(lang, "Please enter your full name."))
      .max(30, t(lang, "Full name must not exceed 30 characters."))
      .min(2, t(lang, "Full name must be at least 2 characters."))
      .test("no-leading-space", t(lang, "First character cannot be a space."), (val) => !val || !/^\s/.test(val))
      .test("no-numbers", t(lang, "Numbers are not allowed in full name."), (val) => !val || !/\d/.test(val))
      .matches(
        /^[a-zA-Z\s\u00C0-\u024F\u1EA0-\u1EF9\-\'.]+$/,
        t(lang, "Numbers and special characters are not allowed in full name.")
      ),
    location: Yup.string().max(30, t(lang, "Location must not exceed 30 characters.")).test("no-special-chars", t(lang, "Special characters are not allowed in location."), (val) => !val || /^[a-zA-Z0-9\s\u00C0-\u024F\u1EA0-\u1EF9\-\.,]*$/.test(val)),
    phone: Yup.string().test("phone-valid", t(lang, "Please enter a valid phone number."), function (val) {
      if (!val || !val.trim()) return true;
      const digits = val.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }),
    title: Yup.string(),
    portfolioUrl: Yup.string().test(
      "url-valid",
      t(lang, "Please enter a valid URL (e.g. https://github.com/yourname)"),
      function (value) {
        if (!value || !value.trim()) return true;
        try {
          const test = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
          new URL(test);
          return true;
        } catch {
          return false;
        }
      }
    ),
    salary: Yup.string().test("salary-valid", t(lang, "Salary expectation must be between 1M and 500M VND per month"), function (val) {
      if (!val || !val.trim()) return true;
      const raw = String(val).replace(/,/g, "").trim();
      let num = null;
      const matchM = raw.match(/(\d+(\.\d+)?)\s*M/i);
      if (matchM) {
        num = parseFloat(matchM[1]) * 1000000;
      } else {
        const matchNum = raw.match(/\d+/);
        if (matchNum) {
          const parsed = parseFloat(matchNum[0]);
          num = parsed < 1000 ? parsed * 1000000 : parsed;
        }
      }
      if (num !== null && (num < 1000000 || num > 500000000)) {
        return false;
      }
      return true;
    }),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullName: profile?.personal?.fullName || "",
      phone: profile?.personal?.phone || "",
      location: profile?.personal?.location || "",
      title: profile?.professional?.title || "",
      experience: profile?.professional?.experience || "",
      industry: profile?.professional?.industry || "",
      portfolioUrl: profile?.portfolio?.url || profile?.portfolioUrl || "",
      workMode: profile?.preferences?.workMode || "",
      salary: profile?.preferences?.salary || "",
    },
    validationSchema,
    onSubmit: async () => { },
  });

  const setTab = (tb) => {
    setTabState(tb);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", TAB_SLUGS[tb]);
      window.history.replaceState(null, "", url);
    } catch (e) { }
  };

  if (!profile || !settings || !auth) return null;

  const persist = (patch) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(patch);
  };

  const persistSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(patch);
    // BR-101-07: Profile visibility changes must take effect immediately across all views
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
    setToast(t(lang, "Saved"));
  };

  const handleFullNameInput = (e) => {
    let val = e.target.value;
    // Disallow leading space
    if (val.startsWith(" ")) {
      val = val.trimStart();
    }
    // Max 30 chars
    if (val.length > 30) {
      val = val.slice(0, 30);
    }
    // Disallow numbers and special characters (allow letters, spaces, hyphens, apostrophes)
    val = val.replace(/[^a-zA-Z\s\u00C0-\u024F\u1EA0-\u1EF9\-\'.]/g, "");

    formik.setFieldValue("fullName", val);
    formik.setFieldTouched("fullName", true, true);
    persist({ personal: { ...profile.personal, fullName: val } });
  };

  const handleLocationInput = (e) => {
    let val = e.target.value;
    // Disallow special characters
    val = val.replace(/[^a-zA-Z0-9\s\u00C0-\u024F\u1EA0-\u1EF9\-\.,]/g, "");
    formik.setFieldValue("location", val);
    formik.setFieldTouched("location", true, true);
    persist({ personal: { ...profile.personal, location: val } });
  };

  const handleSaveProfile = async () => {
    formik.setTouched({
      fullName: true,
      location: true,
      phone: true,
      title: true,
      salary: true,
    });
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      const firstErr = Object.values(errors)[0];
      setToast(firstErr || t(lang, "Please fix validation errors before saving."));
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile(profile);
      setToast(t(lang, "Profile saved successfully!"));
    } catch (err) {
      console.error("Save profile error:", err);
      setToast(t(lang, "Failed to save profile. Please try again."));
    } finally {
      setIsSaving(false);
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
    if (file.size === 0) {
      setToast(t(lang, "File is empty. Please select a valid document."));
      return;
    }
    const okExts = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!okExts.includes(ext)) {
      setToast(t(lang, "Unsupported file format. Allowed formats: PDF, PNG, JPG, and DOCX only."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast(t(lang, "File exceeds 5MB limit."));
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
    if (field === "isCurrent" && value === true) {
      list[i].end = "";
    }
    if (field === "end" && value) {
      list[i].isCurrent = false;
    }
    persist({ experience: list });
  };
  const addExperience = () => persist({ experience: [...profile.experience, emptyExperience()] });
  const removeExperience = (i) => persist({ experience: profile.experience.filter((_, idx) => idx !== i) });

  // ── Profile photo handlers ──
  const onPhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast(t(lang, "Please select an image file (JPG, PNG, etc.)."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast(t(lang, "Profile photo must be under 5MB."));
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      persist({ personal: { ...profile.personal, photo: dataUrl, photoName: file.name } });
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

  // ── Resume handlers ──
  const handleResumeFile = async (file) => {
    if (!file) return;
    const okExts = [".pdf", ".doc", ".docx"]; // BR-101-03: PDF, DOC, DOCX only
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!okExts.includes(ext)) {
      setToast(t(lang, "Unsupported file format. Allowed formats: PDF, DOC, and DOCX only"));
      return;
    }
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      setToast(t(lang, `Resume file size must not exceed ${MAX_RESUME_MB} MB .`));
      return;
    }
    setResumeUploading(true);
    setToast(t(lang, "Reading file…"));
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const mime = file.type || (ext === ".pdf" ? "application/pdf" : "application/octet-stream");
      const saved = await saveResume({ fileName: file.name, size: file.size, type: mime, dataUrl });
      setProfile((prev) => ({
        ...prev,
        resume: {
          fileName: file.name,
          size: file.size,
          type: mime,
          dataUrl,
          uploadedAt: saved?.uploadedAt || new Date().toISOString().slice(0, 10),
        },
      }));
      setToast(t(lang, "Résumé saved successfully!"));
    } catch (err) {
      console.error("Resume read error:", err);
      setToast(t(lang, "Could not read resume file."));
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

  const handleRemoveResume = async () => {
    await removeResume();
    setProfile((prev) => ({
      ...prev,
      resume: { fileName: "", uploadedAt: "", size: 0, type: "", dataUrl: "" },
    }));
    setToast(t(lang, "Résumé removed"));
  };

  // ── Portfolio handlers ──
  const handlePortfolioFile = async (file) => {
    if (!file) return;
    const okExts = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!okExts.includes(ext)) {
      setToast(t(lang, "Unsupported portfolio format. Allowed: PDF, PNG, JPG, DOC, DOCX"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast(t(lang, "Portfolio file size must not exceed 5 MB"));
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

  return (
    <div className="lv-page-container">
      <div className="lv-dash-welcome">
        <h1>{t(lang, "Profile & Settings")}</h1>
        <p>{t(lang, "Manage your profile, preferences, notifications and account.")}</p>
      </div>

      <div className="lv-auth-tabs lv-settings-tabs" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
        {TABS.map((tb) => (
          <button key={tb} className={tab === tb ? "active" : ""} onClick={() => setTab(tb)} style={{ whiteSpace: "nowrap" }}>
            {t(lang, tb)}
          </button>
        ))}
      </div>

      <div className="lv-onboard-card">
        {tab === "Profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <strong style={{ fontSize: "var(--text-sm)" }}>{t(lang, "Profile Completion")}</strong>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{completeness}%</span>
              </div>
              <div className="lv-progress"><i style={{ width: `${completeness}%` }} /></div>
            </div>

            {/* ── Personal Section ── */}
            <div>
              <h3 style={{ marginBottom: 14 }}>{t(lang, "Personal")}</h3>
              <div className="lv-form-grid">
                <Input
                  label={t(lang, "Full Name")}
                  name="fullName"
                  value={formik.values.fullName}
                  onChange={handleFullNameInput}
                  onBlur={formik.handleBlur}
                  placeholder={t(lang, "e.g. Alex Mitchell")}
                  maxLength={30}
                  error={formik.touched.fullName && formik.errors.fullName ? formik.errors.fullName : undefined}
                />
                <PhoneInput
                  id="phone"
                  name="phone"
                  label={t(lang, "Phone")}
                  value={formik.values.phone}
                  onChange={(phone) => {
                    formik.setFieldValue("phone", phone);
                    formik.setFieldTouched("phone", true, true);
                    persist({ personal: { ...profile.personal, phone } });
                  }}
                  onBlur={() => formik.setFieldTouched("phone", true, true)}
                  placeholder="912 345 678"
                  defaultCountry="vn"
                  error={formik.touched.phone && formik.errors.phone ? formik.errors.phone : undefined}
                />
                <Input
                  label={t(lang, "Location")}
                  name="location"
                  value={formik.values.location}
                  onChange={handleLocationInput}
                  onBlur={formik.handleBlur}
                  placeholder={t(lang, "e.g. Ho Chi Minh City, Vietnam")}
                  error={formik.touched.location && formik.errors.location ? formik.errors.location : undefined}
                />
              </div>

              {/* Profile Photo Upload + Random Avatar */}
              <div style={{ marginTop: 16 }}>
                <label className="lv-field-label">{t(lang, "Profile Photo")}</label>
                <div className="lv-photo-row">
                  <div className="lv-photo-preview">
                    {profile.personal.photo ? (
                      <img
                        src={profile.personal.photo}
                        alt="Profile"
                        className="lv-photo-img"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = generateAvatarDataUrl(profile.personal?.fullName || "User");
                        }}
                      />
                    ) : (
                      <div className="lv-photo-placeholder">
                        <Icon name="user" size={28} />
                      </div>
                    )}
                  </div>
                  <div className="lv-photo-actions">
                    <button
                      type="button"
                      className="lv-photo-btn"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Icon name="upload" size={14} />
                      {t(lang, "Upload Photo")}
                    </button>
                    <button
                      type="button"
                      className="lv-photo-btn lv-photo-btn--rand"
                      onClick={onGenerateAvatar}
                      title={t(lang, "Generate a random avatar from your name")}
                    >
                      <Icon name="refresh-cw" size={14} />
                      {t(lang, "Random Avatar")}
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={onPhotoChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Professional Section ── */}
            <div>
              <h3 style={{ marginBottom: 14 }}>{t(lang, "Professional")}</h3>
              <div className="lv-form-grid">
                <Input
                  label={t(lang, "Current Job Title")}
                  name="title"
                  value={formik.values.title}
                  onChange={(e) => {
                    formik.setFieldValue("title", e.target.value);
                    persist({ professional: { ...profile.professional, title: e.target.value } });
                  }}
                  onBlur={formik.handleBlur}
                  placeholder={t(lang, "e.g. Senior Software Engineer")}
                />
                <Select
                  label={t(lang, "Experience")}
                  value={formik.values.experience}
                  onChange={(e) => {
                    formik.setFieldValue("experience", e.target.value);
                    persist({ professional: { ...profile.professional, experience: e.target.value } });
                  }}
                  options={EXPERIENCE_RANGES.map((v) => ({ value: v, label: t(lang, v) }))}
                  placeholder={t(lang, "Select years of experience")}
                />
                <Select
                  label={t(lang, "Industry")}
                  value={formik.values.industry}
                  onChange={(e) => {
                    formik.setFieldValue("industry", e.target.value);
                    persist({ professional: { ...profile.professional, industry: e.target.value } });
                  }}
                  options={INDUSTRIES.map((v) => ({ value: v, label: t(lang, v) }))}
                  placeholder={t(lang, "Select industry domain")}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <ChipInput
                  label={t(lang, "Skills")}
                  values={profile.professional.skills}
                  placeholder={t(lang, "e.g. React, TypeScript, Python")}
                  allowSpecial={false}
                  onAdd={(v) => persist({ professional: { ...profile.professional, skills: [...profile.professional.skills, v] } })}
                  onRemove={(v) => persist({ professional: { ...profile.professional, skills: profile.professional.skills.filter((x) => x !== v) } })}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <ChipInput
                  label={t(lang, "Languages")}
                  values={profile.languages}
                  placeholder={t(lang, "e.g. English, Vietnamese")}
                  onAdd={(v) => persist({ languages: [...profile.languages, v] })}
                  onRemove={(v) => persist({ languages: profile.languages.filter((x) => x !== v) })}
                />
              </div>
            </div>

            {/* ── Education Section ── */}
            <div>
              <h3 style={{ marginBottom: 14 }}>{t(lang, "Education")}</h3>
              {profile.education.map((ed, i) => (
                <div key={i} className="lv-repeat-card">
                  <div className="lv-form-grid">
                    <Input label={t(lang, "Degree")} value={ed.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} placeholder={t(lang, "e.g. Bachelor of Computer Science")} />
                    <Input label={t(lang, "Institution")} value={ed.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} placeholder={t(lang, "e.g. Ho Chi Minh City University of Technology")} />
                    <Input
                      label={t(lang, "Graduation Year")}
                      value={ed.year}
                      onChange={(e) => {
                        // Numbers only allowed
                        const onlyNums = e.target.value.replace(/\D/g, "").slice(0, 4);
                        updateEducation(i, "year", onlyNums);
                      }}
                      placeholder={t(lang, "e.g. 2024")}
                      maxLength={4}
                    />
                  </div>
                  <button type="button" className="lv-repeat-remove" onClick={() => removeEducation(i)}>
                    <Icon name="trash-2" size={14} /> {t(lang, "Remove")}
                  </button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addEducation}>
                <Icon name="plus" size={16} /> {t(lang, "Add education")}
              </Button>
            </div>

            {/* ── Certification / Professional Licenses Section ── */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>{t(lang, "Certification / Professional Licenses")}</h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>{t(lang, "Optional")}</span>
              </div>
              {(profile.certifications || []).map((cert, i) => (
                <div key={cert.id || i} className="lv-repeat-card">
                  <div className="lv-form-grid">
                    <Input
                      label={t(lang, "Certification Name")}
                      value={cert.name}
                      onChange={(e) => updateCertification(i, "name", e.target.value)}
                      placeholder="e.g. AWS Certified Solutions Architect"
                    />
                    <Input
                      label={t(lang, "Issuing Organization")}
                      value={cert.issuer}
                      onChange={(e) => updateCertification(i, "issuer", e.target.value)}
                      placeholder="e.g. Amazon Web Services"
                    />
                    <Input
                      label={t(lang, "Issue Date")}
                      type="date"
                      value={cert.issueDate}
                      onChange={(e) => updateCertification(i, "issueDate", e.target.value)}
                    />
                    <Input
                      label={t(lang, "Credential ID / License Number")}
                      value={cert.credentialId}
                      onChange={(e) => updateCertification(i, "credentialId", e.target.value)}
                      placeholder="e.g. AWS-1234567"
                    />
                  </div>

                  {/* Certificate File Attachment */}
                  <div style={{ marginTop: 12 }}>
                    <label className="lv-field-label">{t(lang, "Certificate Document (PDF, Image)")}</label>
                    {cert.fileName ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px 14px", borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: "#e0e7ff", color: "#4f46e5", flexShrink: 0 }}>
                            <Icon name="file-text" size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cert.fileName}</span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>{cert.fileSize ? (cert.fileSize / 1024).toFixed(0) + " KB" : t(lang, "Document attached")}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            updateCertification(i, "fileName", "");
                            updateCertification(i, "fileSize", 0);
                            updateCertification(i, "fileDataUrl", "");
                          }}
                          style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500 }}
                        >
                          <Icon name="trash-2" size={14} /> {t(lang, "Remove file")}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id={`cert-file-upload-${i}`}
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCertFileUpload(i, file);
                          }}
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor={`cert-file-upload-${i}`}
                          style={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            background: "#ffffff",
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: "1.5px dashed #cbd5e1",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--surface-brand, #2563eb)";
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#cbd5e1";
                            e.currentTarget.style.background = "#ffffff";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: "#f1f5f9", color: "#475569" }}>
                              <Icon name="upload-cloud" size={16} />
                            </div>
                            <div>
                              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                                {t(lang, "Choose Certificate File")}
                              </span>
                              <span style={{ display: "block", fontSize: 11, color: "#64748b" }}>
                                {t(lang, "PDF, PNG, JPG, or DOCX (max 5MB)")}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "5px 12px", borderRadius: 6 }}>
                            {t(lang, "Browse")}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <button type="button" className="lv-repeat-remove" onClick={() => removeCertification(i)}>
                    <Icon name="trash-2" size={14} /> {t(lang, "Remove")}
                  </button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addCertification}>
                <Icon name="plus" size={16} /> {t(lang, "Add certification")}
              </Button>
            </div>

            {/* ── Experience Section (Month Picker + Present Checkbox + Formatted Display) ── */}
            <div>
              <h3 style={{ marginBottom: 14 }}>{t(lang, "Experience")}</h3>
              {profile.experience.map((ex, i) => {
                const isCurrent = !!ex.isCurrent || ex.end === "Present";
                return (
                  <div key={i} className="lv-repeat-card">
                    <div className="lv-form-grid">
                      <Input
                        label={t(lang, "Company")}
                        value={ex.company}
                        onChange={(e) => updateExperience(i, "company", e.target.value)}
                        placeholder={t(lang, "e.g. VNG Corporation")}
                      />
                      <Input
                        label={t(lang, "Job Title")}
                        value={ex.title}
                        onChange={(e) => updateExperience(i, "title", e.target.value)}
                        placeholder={t(lang, "e.g. Senior Software Engineer")}
                      />

                      {/* Start Date Date Picker */}
                      <div>
                        <Input
                          type="date"
                          label={t(lang, "Start Date")}
                          value={ex.start}
                          onChange={(e) => updateExperience(i, "start", e.target.value)}
                          max={new Date().toISOString().slice(0, 10)}
                          placeholder="YYYY-MM-DD"
                        />
                        {ex.start && (
                          <p className="lv-field-hint" style={{ marginTop: 4 }}>
                            {fmtMonth(ex.start)}
                          </p>
                        )}
                      </div>

                      {/* End Date Date Picker & Current Working Checkbox */}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <label className="lv-field-label" style={{ marginBottom: 0 }}>{t(lang, "End Date")}</label>
                          <label className="lv-current-check" style={{ margin: 0, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={isCurrent}
                              onChange={(e) => updateExperience(i, "isCurrent", e.target.checked)}
                            />
                            <span>{t(lang, "Currently working here")}</span>
                          </label>
                        </div>
                        {!isCurrent ? (
                          <>
                            <Input
                              type="date"
                              value={ex.end === "Present" ? "" : (ex.end || "")}
                              onChange={(e) => updateExperience(i, "end", e.target.value)}
                              min={ex.start || undefined}
                              max={new Date().toISOString().slice(0, 10)}
                            />
                            {ex.end && ex.end !== "Present" && (
                              <p className="lv-field-hint" style={{ marginTop: 4 }}>
                                {fmtMonth(ex.end)}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="lv-present-badge" style={{ marginTop: 4 }}>
                            <Icon name="briefcase" size={13} />
                            {t(lang, "Present")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label className="lv-field-label">{t(lang, "Responsibilities")}</label>
                      <textarea
                        className="lv-textarea"
                        rows={3}
                        value={ex.responsibilities || ""}
                        onChange={(e) => updateExperience(i, "responsibilities", e.target.value)}
                        placeholder={t(lang, "e.g. Designed scalable microservices, collaborated with cross-functional teams, and optimized system performance...")}
                      />
                    </div>

                    {/* Duration display */}
                    {ex.start && (
                      <p className="lv-exp-duration">
                        <Icon name="calendar" size={12} />
                        {fmtMonth(ex.start)} — {isCurrent ? t(lang, "Present") : (ex.end ? fmtMonth(ex.end) : t(lang, "—"))}
                      </p>
                    )}

                    <button type="button" className="lv-repeat-remove" onClick={() => removeExperience(i)}>
                      <Icon name="trash-2" size={14} /> {t(lang, "Remove")}
                    </button>
                  </div>
                );
              })}
              <Button type="button" variant="secondary" onClick={addExperience}>
                <Icon name="plus" size={16} /> {t(lang, "Add position")}
              </Button>
            </div>

            {/* ── Résumé Section (Upload with Drag-Drop + Base64 Storage + Actions) ── */}
            <div>
              <h3 style={{ marginBottom: 14 }}>{t(lang, "Résumé")}</h3>

              <div
                className={`lv-resume-drop ${isResumeDragging ? "active" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsResumeDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsResumeDragging(false);
                }}
                onDrop={handleResumeDrop}
              >
                <Icon name="file-text" size={28} style={{ color: "#94a3b8" }} />
                <p style={{ margin: "8px 0 4px", fontWeight: 600, fontSize: 14, color: "#334155" }}>
                  {t(lang, "Upload your resume")}
                </p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>
                  {t(lang, "PDF, DOC, DOCX only. Max 5MB.")}
                </p>
                <button
                  type="button"
                  className="lv-photo-btn"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={resumeUploading}
                >
                  <Icon name="upload" size={14} />
                  {resumeUploading ? t(lang, "Uploading...") : t(lang, "Choose file")}
                </button>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={onResumeChange}
                />
              </div>

              {profile.resume?.fileName && (
                <div className="lv-resume-chip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <Icon name="file-text" size={16} style={{ color: "#4f46e5", marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p className="lv-resume-chip-name">{profile.resume.fileName}</p>
                      <p className="lv-resume-chip-meta">
                        {profile.resume.size ? `${(profile.resume.size / 1024).toFixed(0)} KB` : ""}
                        {profile.resume.uploadedAt ? ` · ${t(lang, "Uploaded")} ${profile.resume.uploadedAt}` : ""}
                        {profile.resume.dataUrl ? " · ✓ base64 stored" : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {profile.resume.dataUrl && (
                      <a
                        href={profile.resume.dataUrl}
                        download={profile.resume.fileName}
                        className="lv-photo-btn"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        title="Download saved file"
                      >
                        <Icon name="download" size={12} /> {t(lang, "Download")}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveResume}
                      className="lv-photo-btn"
                      style={{ padding: "4px 10px", fontSize: 12, color: "#dc2626", borderColor: "#fecaca" }}
                      title="Remove resume"
                    >
                      <Icon name="trash-2" size={12} /> {t(lang, "Remove")}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <Link href="/resume" className="lv-job-view" style={{ display: "inline-flex" }}>
                  {t(lang, "Manage & preview résumé")} <Icon name="arrow-right" size={14} />
                </Link>
              </div>
            </div>

            {/* ── Portfolio & Work Showcase Section ── */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="globe" size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    {t(lang, "Portfolio & Work Showcase")}
                  </h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                    {t(lang, "Showcase your GitHub, Behance, LinkedIn, or upload portfolio work samples.")}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <Input
                  label={t(lang, "Portfolio / Website Link")}
                  name="portfolioUrl"
                  value={formik.values.portfolioUrl}
                  onChange={(e) => handlePortfolioUrlChange(e.target.value)}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. https://github.com/alexmitchell"
                  error={formik.touched.portfolioUrl && formik.errors.portfolioUrl ? formik.errors.portfolioUrl : undefined}
                />

                <div>
                  <label className="lv-field-label">{t(lang, "Upload Portfolio File (optional)")}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      className="lv-photo-btn"
                      onClick={() => portfolioInputRef.current?.click()}
                      disabled={portfolioUploading}
                      style={{ fontSize: 12, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Icon name="upload-cloud" size={14} />
                      {portfolioUploading ? t(lang, "Uploading...") : t(lang, "Choose Portfolio File")}
                    </button>
                    <input
                      ref={portfolioInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handlePortfolioFile(file);
                      }}
                    />
                  </div>
                  <p className="lv-field-hint" style={{ marginTop: 4 }}>
                    {t(lang, "PDF, PNG, JPG, DOCX up to 5MB")}
                  </p>
                </div>
              </div>

              {(profile.portfolio?.fileName || profile.portfolioFile?.fileName) && (
                <div className="lv-resume-chip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon name="file-text" size={16} style={{ color: "#0891b2", flexShrink: 0 }} />
                    <div>
                      <p className="lv-resume-chip-name">{profile.portfolio?.fileName || profile.portfolioFile?.fileName}</p>
                      <p className="lv-resume-chip-meta">
                        {(profile.portfolio?.size || profile.portfolioFile?.size) ? `${((profile.portfolio?.size || profile.portfolioFile?.size) / 1024).toFixed(0)} KB` : ""}
                        {(profile.portfolio?.uploadedAt || profile.portfolioFile?.uploadedAt) ? ` · ${t(lang, "Uploaded")} ${profile.portfolio?.uploadedAt || profile.portfolioFile?.uploadedAt}` : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {(profile.portfolio?.dataUrl || profile.portfolioFile?.dataUrl) && (
                      <a
                        href={profile.portfolio?.dataUrl || profile.portfolioFile?.dataUrl}
                        download={profile.portfolio?.fileName || profile.portfolioFile?.fileName}
                        className="lv-photo-btn"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                      >
                        <Icon name="download" size={12} /> {t(lang, "Download")}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleRemovePortfolioFile}
                      className="lv-photo-btn"
                      style={{ padding: "4px 10px", fontSize: 12, color: "#dc2626", borderColor: "#fecaca" }}
                    >
                      <Icon name="trash-2" size={12} /> {t(lang, "Remove")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Save Profile Action Bar ── */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid var(--border-default)",
              paddingTop: 20,
              marginTop: 12,
              flexWrap: "wrap",
              gap: 12
            }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                {t(lang, "All changes will be updated across your profile and job applications.")}
              </span>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                <Icon name={isSaving ? "refresh-cw" : "check"} size={16} className={isSaving ? "lv-spin" : ""} />
                {isSaving ? t(lang, "Saving...") : t(lang, "Save Changes")}
              </Button>
            </div>
          </div>
        )}

        {tab === "Preferences" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ChipInput
              label={t(lang, "Preferred Roles")}
              values={profile.preferences.roles}
              placeholder={t(lang, "e.g. Senior Software Engineer")}
              onAdd={(v) => persist({ preferences: { ...profile.preferences, roles: [...profile.preferences.roles, v] } })}
              onRemove={(v) => persist({ preferences: { ...profile.preferences, roles: profile.preferences.roles.filter((x) => x !== v) } })}
            />
            <ChipInput
              label={t(lang, "Preferred Locations")}
              values={profile.preferences.locations}
              placeholder={t(lang, "e.g. Ho Chi Minh City")}
              allowSpecial={false}
              onAdd={(v) => persist({ preferences: { ...profile.preferences, locations: [...profile.preferences.locations, v] } })}
              onRemove={(v) => persist({ preferences: { ...profile.preferences, locations: profile.preferences.locations.filter((x) => x !== v) } })}
            />
            <div className="lv-form-grid">
              <Select label={t(lang, "Work Mode")} value={profile.preferences.workMode} onChange={(e) => persist({ preferences: { ...profile.preferences, workMode: e.target.value } })} options={WORK_MODES.map((v) => ({ value: v, label: t(lang, v) }))} placeholder={t(lang, "Select preferred work mode")} />
              <Input label={t(lang, "Desired Salary")} value={profile.preferences.salary} onChange={(e) => persist({ preferences: { ...profile.preferences, salary: e.target.value } })} placeholder={t(lang, "e.g. 35,000,000 VND")} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-default)", paddingTop: 20, marginTop: 12 }}>
              <Button
                type="button"
                variant="primary"
                onClick={async () => {
                  // BR-101-05: Salary expectation must be within 1M-500M VND per month
                  if (profile.preferences?.salary) {
                    const raw = String(profile.preferences.salary).replace(/,/g, "").trim();
                    let num = null;
                    const matchM = raw.match(/(\d+(\.\d+)?)\s*M/i);
                    if (matchM) {
                      num = parseFloat(matchM[1]) * 1000000;
                    } else {
                      const matchNum = raw.match(/\d+/);
                      if (matchNum) {
                        const parsed = parseFloat(matchNum[0]);
                        num = parsed < 1000 ? parsed * 1000000 : parsed;
                      }
                    }
                    if (num !== null && (num < 1000000 || num > 500000000)) {
                      setToast(t(lang, "Salary expectation must be between 1M and 500M VND per month"));
                      return;
                    }
                  }
                  await saveProfile(profile);
                  setToast(t(lang, "Preferences saved!"));
                }}
              >
                <Icon name="check" size={16} />
                {t(lang, "Save Preferences")}
              </Button>
            </div>
          </div>
        )}

        {tab === "Notifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Switch label={t(lang, "Job recommendations")} on={settings.notifications.jobRecs} onChange={(v) => persistSettings({ notifications: { ...settings.notifications, jobRecs: v } })} />
            <Switch label={t(lang, "Application updates")} on={settings.notifications.appUpdates} onChange={(v) => persistSettings({ notifications: { ...settings.notifications, appUpdates: v } })} />
            <Switch label={t(lang, "Interview alerts")} on={settings.notifications.interviewAlerts} onChange={(v) => persistSettings({ notifications: { ...settings.notifications, interviewAlerts: v } })} />
            <Switch label={t(lang, "Marketing emails")} on={settings.notifications.marketing} onChange={(v) => persistSettings({ notifications: { ...settings.notifications, marketing: v } })} />
          </div>
        )}

        {tab === "Privacy" && (
          <div className="lv-form-grid">
            <Select label={t(lang, "Profile visibility")} value={settings.privacy.profileVisibility} onChange={(e) => persistSettings({ privacy: { ...settings.privacy, profileVisibility: e.target.value } })} options={VISIBILITY_OPTIONS.map((v) => ({ value: v, label: t(lang, v) }))} />
            <Select label={t(lang, "Resume visibility")} value={settings.privacy.resumeVisibility} onChange={(e) => persistSettings({ privacy: { ...settings.privacy, resumeVisibility: e.target.value } })} options={RESUME_VISIBILITY_OPTIONS.map((v) => ({ value: v, label: t(lang, v) }))} />
          </div>
        )}

        {tab === "Account" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div className="lv-form-grid">
              <div>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, display: "block", marginBottom: 6 }}>{t(lang, "Email")}</label>
                <p className="lv-file-chip" style={{ marginTop: 0 }}><Icon name="mail" size={14} /> {auth.email}</p>
              </div>
              <PhoneInput
                label={t(lang, "Phone")}
                value={profile.personal.phone}
                onChange={(phone) => persist({ personal: { ...profile.personal, phone } })}
                defaultCountry="vn"
              />
            </div>
            <div>
              <h3 style={{ marginBottom: 14 }}>{t(lang, "Change Password")}</h3>
              <div className="lv-form-grid">
                <Input label={t(lang, "Current password")} type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="••••••••" />
                <Input label={t(lang, "New password")} type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="••••••••" />
                <Input label={t(lang, "Confirm new password")} type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="••••••••" />
              </div>
              {pwErr && (
                <p className="lv-error" role="alert" style={{ marginTop: 12 }}>
                  <Icon name="alert-circle" size={16} />
                  <span>{pwErr}</span>
                </p>
              )}
              <div style={{ marginTop: 12 }}>
                <Button variant="secondary" onClick={submitPassword}>
                  {t(lang, "Update Password")}
                </Button>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <Icon name="log-out" size={16} /> {t(lang, "Logout")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  resetAll();
                  setToast(t(lang, "Demo data reset"));
                  setTimeout(() => router.push("/"), 900);
                }}
              >
                {t(lang, "Reset demo data")}
              </Button>
            </div>
            <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: 24 }}>
              {!confirmDelete ? (
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Icon name="trash-2" size={16} /> {t(lang, "Delete Account")}
                </Button>
              ) : (
                <div className="lv-error" role="alert" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                  <span>{t(lang, "This will permanently delete your profile, applications and saved jobs. This cannot be undone.")}</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Button variant="danger" size="sm" onClick={() => { resetAll(); router.push("/"); }}>
                      {t(lang, "Confirm Delete")}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                      {t(lang, "Cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Toast msg={toast} />
    </div>
  );
}
