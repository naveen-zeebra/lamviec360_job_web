"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "../../../components/ds";
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
const MAX_RESUME_MB = 10;

/** Generate a random avatar as a coloured SVG initials circle, returned as base64 data-URL */
function generateAvatarDataUrl(name = "?") {
  const initials = name
    .split(" ")
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
  return "data:image/svg+xml;base64," + btoa(svg);
}

function emptyEducation() {
  return { degree: "", institution: "", year: "" };
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

/** Format YYYY-MM for display e.g. "2022-03" → "Mar 2022" */
function fmtMonth(val) {
  if (!val || !val.includes("-")) return val;
  const [y, m] = val.split("-");
  const d = new Date(+y, +m - 1, 1);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
}

function ChipInput({ label, values, onAdd, onRemove, placeholder }) {
  const [v, setV] = useState("");
  return (
    <div>
      <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <Input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} />
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (v.trim()) {
              onAdd(v.trim());
              setV("");
            }
          }}
        >
          Add
        </Button>
      </div>
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
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  useEffect(() => {
    setProfile(getProfile());
    setSettings(getSettings());
    setAuth(getAuth());
    try {
      const slug = new URLSearchParams(window.location.search).get("tab");
      if (slug && SLUG_TABS[slug]) setTabState(SLUG_TABS[slug]);
    } catch (e) {}
  }, []);

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
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(patch);
  };

  const persistSettings = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(patch);
    setToast(t(lang, "Saved"));
  };

  const handleSaveProfile = async () => {
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
    const okExts = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!okExts.includes(ext)) {
      setToast(t(lang, "Use a PDF, DOC, DOCX, JPG or PNG file."));
      return;
    }
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      setToast(t(lang, `File is larger than ${MAX_RESUME_MB}MB.`));
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
                <Input label={t(lang, "Full Name")} value={profile.personal.fullName} onChange={(e) => persist({ personal: { ...profile.personal, fullName: e.target.value } })} />
                <Input label={t(lang, "Phone")} value={profile.personal.phone} onChange={(e) => persist({ personal: { ...profile.personal, phone: e.target.value } })} />
                <Input label={t(lang, "Location")} value={profile.personal.location} onChange={(e) => persist({ personal: { ...profile.personal, location: e.target.value } })} />
              </div>

              {/* Profile Photo Upload + Random Avatar */}
              <div style={{ marginTop: 16 }}>
                <label className="lv-field-label">{t(lang, "Profile Photo")}</label>
                <div className="lv-photo-row">
                  <div className="lv-photo-preview">
                    {profile.personal.photo ? (
                      <img src={profile.personal.photo} alt="Profile" className="lv-photo-img" />
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
                <Input label={t(lang, "Current Job Title")} value={profile.professional.title} onChange={(e) => persist({ professional: { ...profile.professional, title: e.target.value } })} />
                <Select label={t(lang, "Experience")} value={profile.professional.experience} onChange={(e) => persist({ professional: { ...profile.professional, experience: e.target.value } })} options={EXPERIENCE_RANGES.map((v) => ({ value: v, label: t(lang, v) }))} />
                <Select label={t(lang, "Industry")} value={profile.professional.industry} onChange={(e) => persist({ professional: { ...profile.professional, industry: e.target.value } })} options={INDUSTRIES.map((v) => ({ value: v, label: t(lang, v) }))} />
              </div>
              <div style={{ marginTop: 16 }}>
                <ChipInput
                  label={t(lang, "Skills")}
                  values={profile.professional.skills}
                  placeholder={t(lang, "e.g. React")}
                  onAdd={(v) => persist({ professional: { ...profile.professional, skills: [...profile.professional.skills, v] } })}
                  onRemove={(v) => persist({ professional: { ...profile.professional, skills: profile.professional.skills.filter((x) => x !== v) } })}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <ChipInput
                  label={t(lang, "Languages")}
                  values={profile.languages}
                  placeholder={t(lang, "e.g. English")}
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
                    <Input label={t(lang, "Degree")} value={ed.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} />
                    <Input label={t(lang, "Institution")} value={ed.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} />
                    <Input label={t(lang, "Graduation Year")} value={ed.year} onChange={(e) => updateEducation(i, "year", e.target.value)} />
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
                        placeholder="e.g. Acme Corp"
                      />
                      <Input
                        label={t(lang, "Job Title")}
                        value={ex.title}
                        onChange={(e) => updateExperience(i, "title", e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                      />

                      {/* Start Date Month Picker */}
                      <div>
                        <label className="lv-field-label">{t(lang, "Start Date")}</label>
                        <input
                          type="month"
                          className="lv-month-input"
                          value={ex.start}
                          onChange={(e) => updateExperience(i, "start", e.target.value)}
                          max={new Date().toISOString().slice(0, 7)}
                        />
                        {ex.start && (
                          <p className="lv-field-hint" style={{ marginTop: 4 }}>
                            {fmtMonth(ex.start)}
                          </p>
                        )}
                      </div>

                      {/* End Date Month Picker & Current Working Checkbox */}
                      <div>
                        <label className="lv-field-label">{t(lang, "End Date")}</label>
                        <label className="lv-current-check">
                          <input
                            type="checkbox"
                            checked={isCurrent}
                            onChange={(e) => updateExperience(i, "isCurrent", e.target.checked)}
                          />
                          <span>{t(lang, "Currently working here")}</span>
                        </label>
                        {!isCurrent && (
                          <>
                            <input
                              type="month"
                              className="lv-month-input"
                              value={ex.end === "Present" ? "" : (ex.end || "")}
                              onChange={(e) => updateExperience(i, "end", e.target.value)}
                              min={ex.start || undefined}
                              max={new Date().toISOString().slice(0, 7)}
                            />
                            {ex.end && ex.end !== "Present" && (
                              <p className="lv-field-hint" style={{ marginTop: 4 }}>
                                {fmtMonth(ex.end)}
                              </p>
                            )}
                          </>
                        )}
                        {isCurrent && (
                          <div className="lv-present-badge">
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
                        placeholder={t(lang, "Key responsibilities and achievements")}
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
                  {t(lang, "PDF, DOC, DOCX, JPG or PNG. Max 10MB. Stored as base64.")}
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
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
              placeholder={t(lang, "e.g. Frontend Engineer")}
              onAdd={(v) => persist({ preferences: { ...profile.preferences, roles: [...profile.preferences.roles, v] } })}
              onRemove={(v) => persist({ preferences: { ...profile.preferences, roles: profile.preferences.roles.filter((x) => x !== v) } })}
            />
            <ChipInput
              label={t(lang, "Preferred Locations")}
              values={profile.preferences.locations}
              placeholder={t(lang, "e.g. Ho Chi Minh City")}
              onAdd={(v) => persist({ preferences: { ...profile.preferences, locations: [...profile.preferences.locations, v] } })}
              onRemove={(v) => persist({ preferences: { ...profile.preferences, locations: profile.preferences.locations.filter((x) => x !== v) } })}
            />
            <div className="lv-form-grid">
              <Select label={t(lang, "Work Mode")} value={profile.preferences.workMode} onChange={(e) => persist({ preferences: { ...profile.preferences, workMode: e.target.value } })} options={WORK_MODES.map((v) => ({ value: v, label: t(lang, v) }))} />
              <Input label={t(lang, "Desired Salary")} value={profile.preferences.salary} onChange={(e) => persist({ preferences: { ...profile.preferences, salary: e.target.value } })} placeholder="25M - 35M VND" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-default)", paddingTop: 20, marginTop: 12 }}>
              <Button
                type="button"
                variant="primary"
                onClick={async () => {
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
              <Input label={t(lang, "Phone")} value={profile.personal.phone} onChange={(e) => persist({ personal: { ...profile.personal, phone: e.target.value } })} />
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
