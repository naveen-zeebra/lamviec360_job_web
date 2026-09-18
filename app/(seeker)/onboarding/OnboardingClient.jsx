"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Stepper from "../../../components/ds/Stepper";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { getProfile, saveProfile, saveResume, removeResume, computeCompleteness } from "../../../lib/seekerStore";

const STEP_LABELS = ["Personal", "Professional", "Education", "Experience", "Resume & Preferences", "Completion"];
const EXPERIENCE_RANGES = ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"];
const INDUSTRIES = ["Technology", "Retail & Commerce", "Media & Creative", "Transport & Logistics", "Manufacturing", "Finance & Banking", "Other"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
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

export default function OnboardingClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useToast();
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [isResumeDragging, setIsResumeDragging] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  if (!profile) return null;

  const persist = (patch) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(patch);
    return next;
  };

  const goNext = () => {
    if (step === 1 && !profile.personal.fullName.trim()) {
      setErr(t(lang, "Please enter your full name."));
      return;
    }
    if (step === 2 && !profile.professional.title.trim()) {
      setErr(t(lang, "Please enter your current job title."));
      return;
    }
    setErr("");
    setToast(t(lang, "Progress saved"));
    setStep((s) => Math.min(6, s + 1));
  };
  const goBack = () => {
    setErr("");
    setStep((s) => Math.max(1, s - 1));
  };

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (!profile.professional.skills.includes(v)) {
      persist({ professional: { ...profile.professional, skills: [...profile.professional.skills, v] } });
    }
    setSkillInput("");
  };
  const removeSkill = (s) => persist({ professional: { ...profile.professional, skills: profile.professional.skills.filter((x) => x !== s) } });

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
    // If "isCurrent" toggled on, clear end date
    if (field === "isCurrent" && value === true) list[i].end = "";
    persist({ experience: list });
  };
  const addExperience = () => persist({ experience: [...profile.experience, emptyExperience()] });
  const removeExperience = (i) => persist({ experience: profile.experience.filter((_, idx) => idx !== i) });

  // ── Profile photo handler – stores full base64 in profile.personal.photo ──
  const onPhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr(t(lang, "Please select an image file (JPG, PNG, etc.)."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr(t(lang, "Profile photo must be under 5MB."));
      return;
    }
    setErr("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      persist({ personal: { ...profile.personal, photo: dataUrl, photoName: file.name } });
      setToast(t(lang, "Photo updated"));
    } catch {
      setErr(t(lang, "Could not read image file."));
    }
  };

  // ── Random avatar generator ──
  const onGenerateAvatar = () => {
    const dataUrl = generateAvatarDataUrl(profile.personal.fullName || "User");
    persist({ personal: { ...profile.personal, photo: dataUrl, photoName: "generated-avatar.svg" } });
    setToast(t(lang, "Random avatar applied"));
  };

  // ── Resume handler – always full base64, no size shortcuts ──
  const handleResumeFile = async (file) => {
    if (!file) return;
    const okExts = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!okExts.includes(ext)) {
      setErr(t(lang, "Unsupported file type. Use PDF, DOC, DOCX, JPG or PNG."));
      return;
    }
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      setErr(t(lang, `File is larger than ${MAX_RESUME_MB}MB.`));
      return;
    }
    setErr("");
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
      setToast(t(lang, "Resume uploaded successfully!"));
    } catch (e) {
      console.error("Resume upload error:", e);
      setErr(t(lang, "Could not read resume file."));
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
    setToast(t(lang, "Resume removed"));
  };

  const preferenceList = (key, value) => {
    const list = profile.preferences[key];
    const has = list.includes(value);
    const next = has ? list.filter((v) => v !== value) : [...list, value];
    persist({ preferences: { ...profile.preferences, [key]: next } });
  };

  const completeness = computeCompleteness(profile);
  const finish = () => {
    saveProfile(profile);
    router.push("/dashboard");
  };

  return (
    <>
      <div className="lv-onboard-wrap">
        <div className="lv-onboard-head">
          <h1>{t(lang, "Set up your profile")}</h1>
          <p>{t(lang, "This helps us match you with the right jobs. You can edit everything later in Settings.")}</p>
        </div>
        <Stepper steps={STEP_LABELS.map((l) => t(lang, l))} current={step} />

        <div className="lv-onboard-card">
          {/* ── Step 1: Personal ── */}
          {step === 1 && (
            <div className="lv-form-grid">
              <Input
                label={t(lang, "Full Name")}
                value={profile.personal.fullName}
                onChange={(e) => persist({ personal: { ...profile.personal, fullName: e.target.value } })}
                placeholder="Nguyen Van A"
                error={step === 1 && err && !profile.personal.fullName.trim() ? err : undefined}
              />
              <Input
                label={t(lang, "Phone")}
                value={profile.personal.phone}
                onChange={(e) => persist({ personal: { ...profile.personal, phone: e.target.value } })}
                placeholder="090 123 4567"
              />
              <Input
                label={t(lang, "Location")}
                value={profile.personal.location}
                onChange={(e) => persist({ personal: { ...profile.personal, location: e.target.value } })}
                placeholder="Ho Chi Minh City"
              />

              {/* Profile photo upload + random avatar */}
              <div>
                <label className="lv-field-label">{t(lang, "Profile Photo")}</label>
                <div className="lv-photo-row">
                  {/* Preview */}
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
                    {profile.personal.photoName && (
                      <p className="lv-file-chip">
                        <Icon name="image" size={13} />
                        {profile.personal.photoName}
                      </p>
                    )}
                    <p className="lv-field-hint">{t(lang, "JPG, PNG. Max 5MB. Stored as base64.")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Professional ── */}
          {step === 2 && (
            <div className="lv-form-grid">
              <Input
                label={t(lang, "Current Job Title")}
                value={profile.professional.title}
                onChange={(e) => persist({ professional: { ...profile.professional, title: e.target.value } })}
                placeholder="Frontend Engineer"
                error={step === 2 && err && !profile.professional.title.trim() ? err : undefined}
              />
              <Select
                label={t(lang, "Experience")}
                value={profile.professional.experience}
                onChange={(e) => persist({ professional: { ...profile.professional, experience: e.target.value } })}
                options={EXPERIENCE_RANGES.map((v) => ({ value: v, label: t(lang, v) }))}
                placeholder={t(lang, "Select range")}
              />
              <Select
                label={t(lang, "Industry")}
                value={profile.professional.industry}
                onChange={(e) => persist({ professional: { ...profile.professional, industry: e.target.value } })}
                options={INDUSTRIES.map((v) => ({ value: v, label: t(lang, v) }))}
                placeholder={t(lang, "Select industry")}
              />
              <div>
                <label className="lv-field-label">{t(lang, "Skills")}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder={t(lang, "e.g. React")}
                  />
                  <Button type="button" variant="secondary" onClick={addSkill}>
                    {t(lang, "Add")}
                  </Button>
                </div>
                <div className="lv-job-tags" style={{ marginTop: 12 }}>
                  {profile.professional.skills.map((s) => (
                    <span key={s} className="lv-chip">
                      {s}
                      <button type="button" aria-label={t(lang, "Remove") + " " + s} onClick={() => removeSkill(s)}>
                        <Icon name="x" size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Education ── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {profile.education.length === 0 && (
                <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
                  {t(lang, "No education added yet.")}
                </p>
              )}
              {profile.education.map((ed, i) => (
                <div key={i} className="lv-repeat-card">
                  <div className="lv-form-grid">
                    <Input
                      label={t(lang, "Degree")}
                      value={ed.degree}
                      onChange={(e) => updateEducation(i, "degree", e.target.value)}
                      placeholder="B.Sc. Computer Science"
                    />
                    <Input
                      label={t(lang, "Institution")}
                      value={ed.institution}
                      onChange={(e) => updateEducation(i, "institution", e.target.value)}
                      placeholder="HCMC University of Technology"
                    />
                    <Input
                      label={t(lang, "Graduation Year")}
                      value={ed.year}
                      onChange={(e) => updateEducation(i, "year", e.target.value)}
                      placeholder="2022"
                    />
                  </div>
                  <button type="button" className="lv-repeat-remove" onClick={() => removeEducation(i)}>
                    <Icon name="trash-2" size={14} /> {t(lang, "Remove")}
                  </button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addEducation} style={{ alignSelf: "flex-start" }}>
                <Icon name="plus" size={16} /> {t(lang, "Add education")}
              </Button>
            </div>
          )}

          {/* ── Step 4: Experience (with month date pickers) ── */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {profile.experience.length === 0 && (
                <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
                  {t(lang, "No experience added yet.")}
                </p>
              )}
              {profile.experience.map((ex, i) => (
                <div key={i} className="lv-repeat-card">
                  <div className="lv-form-grid">
                    <Input
                      label={t(lang, "Company")}
                      value={ex.company}
                      onChange={(e) => updateExperience(i, "company", e.target.value)}
                      placeholder="ABC Technologies"
                    />
                    <Input
                      label={t(lang, "Job Title")}
                      value={ex.title}
                      onChange={(e) => updateExperience(i, "title", e.target.value)}
                      placeholder="Software Engineer"
                    />

                    {/* Start Date – month picker */}
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

                    {/* End Date – month picker or "Currently working here" */}
                    <div>
                      <label className="lv-field-label">{t(lang, "End Date")}</label>
                      <label className="lv-current-check">
                        <input
                          type="checkbox"
                          checked={!!ex.isCurrent}
                          onChange={(e) => updateExperience(i, "isCurrent", e.target.checked)}
                        />
                        <span>{t(lang, "Currently working here")}</span>
                      </label>
                      {!ex.isCurrent && (
                        <>
                          <input
                            type="month"
                            className="lv-month-input"
                            value={ex.end}
                            onChange={(e) => updateExperience(i, "end", e.target.value)}
                            min={ex.start || undefined}
                            max={new Date().toISOString().slice(0, 7)}
                          />
                          {ex.end && (
                            <p className="lv-field-hint" style={{ marginTop: 4 }}>
                              {fmtMonth(ex.end)}
                            </p>
                          )}
                        </>
                      )}
                      {ex.isCurrent && (
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
                      value={ex.responsibilities}
                      onChange={(e) => updateExperience(i, "responsibilities", e.target.value)}
                      placeholder={t(lang, "Key responsibilities and achievements")}
                    />
                  </div>

                  {/* Duration display */}
                  {ex.start && (
                    <p className="lv-exp-duration">
                      <Icon name="calendar" size={12} />
                      {fmtMonth(ex.start)} — {ex.isCurrent ? t(lang, "Present") : (ex.end ? fmtMonth(ex.end) : t(lang, "—"))}
                    </p>
                  )}

                  <button type="button" className="lv-repeat-remove" onClick={() => removeExperience(i)}>
                    <Icon name="trash-2" size={14} /> {t(lang, "Remove")}
                  </button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addExperience} style={{ alignSelf: "flex-start" }}>
                <Icon name="plus" size={16} /> {t(lang, "Add position")}
              </Button>
            </div>
          )}

          {/* ── Step 5: Resume & Preferences ── */}
          {step === 5 && (
            <div className="lv-form-grid">
              <div>
                <label className="lv-field-label">{t(lang, "Resume / CV")}</label>
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
              </div>

              <Select
                label={t(lang, "Preferred Work Mode")}
                value={profile.preferences.workMode}
                onChange={(e) => persist({ preferences: { ...profile.preferences, workMode: e.target.value } })}
                options={WORK_MODES.map((v) => ({ value: v, label: t(lang, v) }))}
                placeholder={t(lang, "Select mode")}
              />
              <Input
                label={t(lang, "Preferred Role")}
                value={profile.preferences.roles[0] || ""}
                onChange={(e) => persist({ preferences: { ...profile.preferences, roles: e.target.value ? [e.target.value] : [] } })}
                placeholder="Frontend Engineer"
              />
              <Input
                label={t(lang, "Preferred Location")}
                value={profile.preferences.locations[0] || ""}
                onChange={(e) => persist({ preferences: { ...profile.preferences, locations: e.target.value ? [e.target.value] : [] } })}
                placeholder="Ho Chi Minh City"
              />
              <Input
                label={t(lang, "Desired Salary")}
                value={profile.preferences.salary}
                onChange={(e) => persist({ preferences: { ...profile.preferences, salary: e.target.value } })}
                placeholder="25M - 35M VND"
              />
            </div>
          )}

          {/* ── Step 6: Completion ── */}
          {step === 6 && (
            <div className="lv-completion">
              <div className="lv-completion-ring" style={{ "--pct": completeness }}>
                <strong>{completeness}%</strong>
              </div>
              <h2 style={{ fontSize: "var(--text-xl)", margin: "16px 0 8px" }}>{t(lang, "Your profile is ready")}</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", maxWidth: 420, margin: "0 auto 24px" }}>
                {t(lang, "You can keep improving your profile from Settings at any time to get better job matches.")}
              </p>
              <Button variant="primary" size="lg" onClick={finish}>
                {t(lang, "Complete Profile")}
              </Button>
            </div>
          )}

          {err && (
            <p className="lv-error" role="alert" style={{ marginTop: 20 }}>
              <Icon name="alert-circle" size={16} />
              <span>{err}</span>
            </p>
          )}

          {step < 6 && (
            <div className="lv-reg-actions">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={goBack}>
                  {t(lang, "Back")}
                </Button>
              )}
              <Button type="button" variant="primary" onClick={goNext} style={{ marginLeft: "auto" }}>
                {t(lang, "Continue")}
              </Button>
            </div>
          )}
        </div>
      </div>
      <Toast msg={toast} />
    </>
  );
}
