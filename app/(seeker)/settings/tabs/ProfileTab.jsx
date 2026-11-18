"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, Input, Select, PhoneInput, Tooltip, InfoTip, Toast, useToast } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import ChipInput from "../components/ChipInput";
import CitizenshipIdInput from "../../../../components/seeker/CitizenshipIdInput";
import SkillSelectorRedesigned from "../../../../components/seeker/SkillSelectorRedesigned";
import AchievementsManager from "../../../../components/seeker/AchievementsManager";
import PortfolioManager from "../../../../components/seeker/PortfolioManager";
import ResumeExtractModal from "../../../../components/seeker/ResumeExtractModal";
import { extractTextFromPdfDataUrl, parseStructuredResumeData } from "../../../../utils/resumeParser";
import { avatarPublicHref, MAX_PROFILE_RESUMES, setDefaultResume, getStore } from "../../../../lib/seekerStore";

const EXPERIENCE_RANGES = ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

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

export default function ProfileTab({
  profile,
  auth,
  formik,
  persist,
  handleFullNameInput,
  handleLocationInput,
  completeness,
  missingFieldsList,
  isVi,
  lang,
  t,
  industryList,
  photoInputRef,
  onPhotoChange,
  onGenerateAvatar,
  updateEducation,
  addEducation,
  removeEducation,
  updateCertification,
  addCertification,
  removeCertification,
  handleCertFileUpload,
  updateExperience,
  addExperience,
  removeExperience,
  getProfileAttachmentUsage,
  isResumeDragging,
  setIsResumeDragging,
  handleResumeDrop,
  resumeInputRef,
  onResumeChange,
  handleRemoveResume,
  resumeUploading,
  portfolioInputRef,
  portfolioUploading,
  handlePortfolioFile,
  handleRemovePortfolioFile,
  handlePortfolioUrlChange,
  handleSaveProfile,
  isSaving,
}) {
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [extractedResumeData, setExtractedResumeData] = useState(null);
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const [toastMsg, setToastMsg] = useToast();

  const handleSetDefaultResume = async (resumeId) => {
    try {
      await setDefaultResume(resumeId);
      const updatedStore = getStore();
      persist({
        resume: updatedStore.profile.resume,
        resumes: updatedStore.profile.resumes,
      });
      setToastMsg(isVi ? "Đã đặt làm CV mặc định thành công!" : "Default résumé updated successfully!");
    } catch (err) {
      console.error("Failed to set default resume:", err);
      setToastMsg(isVi ? "Không thể đặt làm CV mặc định." : "Failed to set default résumé.");
    }
  };

  const handleExtractFromResume = async (targetResume = null) => {
    const resumeToExtract =
      targetResume ||
      profile.resume ||
      (profile.resumes && profile.resumes.find((r) => r.isDefault)) ||
      profile.resumes?.[0];

    const resumeDataUrl = resumeToExtract?.dataUrl;
    if (!resumeDataUrl) {
      setToastMsg(isVi ? "Vui lòng tải lên tệp CV trước khi trích xuất." : "Please upload a résumé file before extracting.");
      return;
    }

    setIsExtractingResume(true);
    try {
      const text = await extractTextFromPdfDataUrl(resumeDataUrl);
      const parsed = parseStructuredResumeData(text);
      setExtractedResumeData(parsed);
      setIsExtractModalOpen(true);
    } catch (err) {
      console.error("Resume parsing error:", err);
      setToastMsg(isVi ? "Không thể trích xuất dữ liệu từ tệp này." : "Could not extract data from this file.");
    } finally {
      setIsExtractingResume(false);
    }
  };

  const handleApplyExtractedData = (selected) => {
    if (!selected) return;

    // Apply personal info to formik if available
    if (selected.personal) {
      if (selected.personal.fullName && (!formik.values.fullName || formik.values.fullName === "Nguyen Van A")) {
        formik.setFieldValue("fullName", selected.personal.fullName);
      }
      if (selected.personal.phone && !formik.values.phone) {
        formik.setFieldValue("phone", selected.personal.phone);
      }
      if (selected.personal.location && !formik.values.location) {
        formik.setFieldValue("location", selected.personal.location);
      }
      if (selected.personal.title && !formik.values.title) {
        formik.setFieldValue("title", selected.personal.title);
      }
    }

    // Apply to profile state & persist
    const updatedProfile = { ...profile };

    if (selected.personal) {
      updatedProfile.personal = {
        ...(updatedProfile.personal || {}),
        fullName: selected.personal.fullName || updatedProfile.personal?.fullName || formik.values.fullName,
        phone: selected.personal.phone || updatedProfile.personal?.phone || formik.values.phone,
        location: selected.personal.location || updatedProfile.personal?.location || formik.values.location,
        bio: selected.personal.bio || updatedProfile.personal?.bio || "",
      };
      if (selected.personal.title) {
        updatedProfile.professional = {
          ...(updatedProfile.professional || {}),
          title: selected.personal.title,
        };
      }
    }

    if (selected.skills && selected.skills.length > 0) {
      const existingSkills = updatedProfile.professional?.skills || [];
      const newSkills = Array.from(new Set([...existingSkills, ...selected.skills]));
      updatedProfile.professional = {
        ...(updatedProfile.professional || {}),
        skills: newSkills,
      };
    }

    if (selected.experience && selected.experience.length > 0) {
      const existingExp = updatedProfile.experience || [];
      updatedProfile.experience = [...selected.experience, ...existingExp];
    }

    if (selected.education && selected.education.length > 0) {
      const existingEdu = updatedProfile.education || [];
      updatedProfile.education = [...selected.education, ...existingEdu];
    }

    if (selected.projects && selected.projects.length > 0) {
      const existingProjects = updatedProfile.portfolio?.projects || updatedProfile.portfolio?.items || [];
      const newProjects = selected.projects.map((proj, i) => ({
        id: `ext-proj-${Date.now()}-${i}`,
        title: proj.title,
        role: proj.role || updatedProfile.professional?.title || (isVi ? "Thành viên phát triển" : "Contributor"),
        fromDate: proj.fromDate || "",
        toDate: proj.toDate || "",
        isOngoing: proj.toDate === "Present",
        description: proj.description || proj.title || "",
        url: proj.url || "",
        extractedFromResume: true,
      }));
      updatedProfile.portfolio = {
        ...(updatedProfile.portfolio || {}),
        items: [...newProjects, ...existingProjects],
        projects: [...newProjects, ...existingProjects],
      };
    }

    persist(updatedProfile);
    setToastMsg(isVi ? "Đã nhập thành công dữ liệu từ CV vào hồ sơ!" : "Successfully applied extracted CV data to profile!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* ── Completeness Bar ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <strong style={{ fontSize: "var(--text-sm)" }}>{t(lang, "Profile Completion")}</strong>
            <InfoTip
              content={
                isVi
                  ? "Độ hoàn thiện hồ sơ được tính từ thông tin cá nhân, học vấn, kinh nghiệm, kỹ năng và CV. Đạt từ 60% trở lên để ứng tuyển việc làm."
                  : "Profile completeness is calculated from personal info, education, experience, skills, and CV. A score of ≥60% is required to apply for jobs."
              }
              title={t(lang, "Profile Completion Score")}
              position="bottom"
            />
            {completeness < 60 ? (
              <span style={{ marginLeft: 8, fontSize: "11px", fontWeight: 600, color: "var(--warning-text, #b45309)" }}>
                ⚠️ {t(lang, "Need ≥60% to apply for jobs")}
              </span>
            ) : (
              <span style={{ marginLeft: 8, fontSize: "11px", fontWeight: 600, color: "var(--success-text, #15803d)" }}>
                ✓ {t(lang, "Eligible to apply for jobs (≥60%)")}
              </span>
            )}
          </div>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>{completeness}%</span>
        </div>
        <div className="lv-progress">
          <i
            style={{
              width: `${completeness}%`,
              background: completeness < 60 ? "#f59e0b" : "var(--brand-primary, #00875a)",
            }}
          />
        </div>
        {completeness < 100 && missingFieldsList.length > 0 && (
          <div style={{ marginTop: 10, fontSize: "12px", color: "var(--text-secondary)" }}>
            <span>
              {isVi
                ? `Cần hoàn thiện thêm ${missingFieldsList.length} mục để đạt 100%:`
                : `Missing ${missingFieldsList.length} items to reach 100%:`}{" "}
            </span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {missingFieldsList.join(" · ")}
            </span>
          </div>
        )}
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
            onBlur={(e) => {
              formik.handleBlur(e);
              if (formik.values.fullName !== profile?.personal?.fullName) {
                persist({ personal: { ...(profile?.personal || {}), fullName: formik.values.fullName } });
              }
            }}
            placeholder={t(lang, "e.g. Alex Mitchell")}
            maxLength={30}
            error={formik.touched.fullName && formik.errors.fullName ? formik.errors.fullName : undefined}
          />

          {/* Non-editable Registered Account Email */}
          <div>
            <Input
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span>{t(lang, "Email Address")}</span>
                  <InfoTip
                    content={
                      isVi
                        ? "Email đăng ký gắn liền với tài khoản đăng nhập và không thể tự chỉnh sửa trực tiếp."
                        : "Registered account email is tied to login credentials and cannot be modified directly."
                    }
                  />
                </span>
              }
              value={auth?.email || profile?.personal?.email || ""}
              readOnly
              disabled
              className="opacity-75 cursor-not-allowed"
              iconRight={
                <span title={t(lang, "Account email is locked")} className="text-xs text-muted pr-1">
                  🔒
                </span>
              }
            />
            <p className="lv-field-hint" style={{ marginTop: 4, fontSize: "11px", color: "var(--text-secondary)" }}>
              {t(lang, "Registered account email cannot be modified directly.")}
            </p>
          </div>

          <PhoneInput
            id="phone"
            name="phone"
            label={t(lang, "Phone")}
            value={formik.values.phone ?? profile?.personal?.phone ?? auth?.phone ?? ""}
            onChange={(phone) => {
              formik.setFieldValue("phone", phone);
            }}
            onBlur={() => {
              formik.setFieldTouched("phone", true, true);
              if (formik.values.phone !== profile?.personal?.phone) {
                persist({ personal: { ...(profile?.personal || {}), phone: formik.values.phone } });
              }
            }}
            placeholder="912 345 678"
            defaultCountry="vn"
            error={formik.touched.phone && formik.errors.phone ? formik.errors.phone : undefined}
          />
          <Input
            label={t(lang, "Location")}
            name="location"
            value={formik.values.location}
            onChange={handleLocationInput}
            onBlur={(e) => {
              formik.handleBlur(e);
              if (formik.values.location !== profile?.personal?.location) {
                persist({ personal: { ...(profile?.personal || {}), location: formik.values.location } });
              }
            }}
            placeholder={t(lang, "e.g. Ho Chi Minh City, Vietnam")}
            error={formik.touched.location && formik.errors.location ? formik.errors.location : undefined}
          />

          {/* Citizenship ID (9 or 12 digits format) */}
          <div style={{ gridColumn: "1 / -1" }}>
            <CitizenshipIdInput
              value={formik.values.citizenId}
              onChange={(cleanDigits) => {
                formik.setFieldValue("citizenId", cleanDigits);
                formik.setFieldTouched("citizenId", true, true);
                persist({ personal: { ...profile.personal, citizenId: cleanDigits } });
              }}
              onBlur={() => formik.setFieldTouched("citizenId", true, true)}
              error={formik.touched.citizenId && formik.errors.citizenId ? formik.errors.citizenId : undefined}
              lang={lang}
            />
          </div>
        </div>

        {/* Profile Photo Upload + Random Avatar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label className="lv-field-label" style={{ marginBottom: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span>{t(lang, "Profile Photo")}</span>
              <InfoTip
                content={
                  isVi
                    ? "Ảnh đại diện rõ mặt giúp tăng mức độ tương tác và nhận diện từ nhà tuyển dụng."
                    : "A clear profile photo increases visibility and response rates from hiring employers."
                }
              />
            </label>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
              <Icon name="info" size={13} style={{ color: "#3b82f6" }} />
              {t(lang, "JPG, JPEG, PNG · Max 2MB")}
            </span>
          </div>
          <div className="lv-photo-row">
            <div className="lv-photo-preview">
              {profile.personal?.photo ? (
                <img
                  src={avatarPublicHref(profile.personal.photo) || profile.personal.photo}
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
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
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
            options={industryList.map((v) => ({ value: v, label: t(lang, v) }))}
            placeholder={t(lang, "Select industry domain")}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <SkillSelectorRedesigned
            skills={profile.professional?.skills || []}
            onChange={(newSkills) =>
              persist({ professional: { ...profile.professional, skills: newSkills } })
            }
            jobTitle={formik.values.title}
            industry={formik.values.industry}
            lang={lang}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <ChipInput
            label={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>{t(lang, "Languages")}</span>
                <InfoTip
                  content={
                    isVi
                      ? "Thêm các ngôn ngữ bạn có thể giao tiếp hoặc làm việc (ví dụ: English, Vietnamese, Japanese)."
                      : "Add languages you speak or work with (e.g. English, Vietnamese, Japanese)."
                  }
                />
              </span>
            }
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
        {(profile.education || []).map((ed, i) => (
          <div key={i} className="lv-repeat-card">
            <div className="lv-form-grid">
              <Input
                label={t(lang, "Degree")}
                value={ed.degree}
                onChange={(e) => updateEducation(i, "degree", e.target.value)}
                placeholder={t(lang, "e.g. Bachelor of Computer Science")}
              />
              <Input
                label={t(lang, "Institution")}
                value={ed.institution}
                onChange={(e) => updateEducation(i, "institution", e.target.value)}
                placeholder={t(lang, "e.g. Ho Chi Minh City University of Technology")}
              />
              <Input
                label={t(lang, "Graduation Year")}
                value={ed.year}
                onChange={(e) => {
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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <h3 style={{ margin: 0 }}>{t(lang, "Certification / Professional Licenses")}</h3>
            <InfoTip
              content={
                isVi
                  ? "Thêm chứng chỉ nghề nghiệp quốc tế hoặc chuyên ngành kèm tệp đính kèm để xác thực năng lực."
                  : "Add industry certifications and licenses with document proof to verify your qualifications."
              }
              title={t(lang, "Certifications & Licenses")}
            />
          </div>
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

      {/* ── Achievements, Honors & Awards Section ── */}
      <div>
        <AchievementsManager
          achievements={profile.achievements || []}
          onChange={(achievements) => persist({ achievements })}
          lang={lang}
        />
      </div>

      {/* ── Experience Section ── */}
      <div>
        <h3 style={{ marginBottom: 14 }}>{t(lang, "Experience")}</h3>
        {(profile.experience || []).map((ex, i) => {
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

                {/* Start Date */}
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

                {/* End Date & Currently Working Checkbox */}
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

      {/* ── Résumé Section ── */}
      <div>
        {(() => {
          const attachUsage = getProfileAttachmentUsage();
          return (
            <div style={{ margin: "0 0 16px", padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "#1e293b", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="hard-drive" size={14} style={{ color: "#4f46e5" }} />
                  {t(lang, "Profile Documents Quota")}
                  <InfoTip
                    content={
                      isVi
                        ? "Dung lượng tối đa tích lũy cho tất cả tệp đính kèm (CV, hồ sơ năng lực Portfolio và chứng chỉ) là 10MB."
                        : "Total storage across Résumés, Portfolio files, and Certificates cannot exceed 10MB per profile."
                    }
                    title={t(lang, "Attachment Quota")}
                  />
                </span>
                <span style={{ fontWeight: 600, color: attachUsage.percentUsed >= 100 ? "#ef4444" : attachUsage.percentUsed > 80 ? "#f59e0b" : "#64748b" }}>
                  {attachUsage.usedMb} / {attachUsage.maxMb} MB ({attachUsage.percentUsed}%)
                </span>
              </div>
              <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, attachUsage.percentUsed)}%`,
                    height: "100%",
                    background: attachUsage.percentUsed >= 100 ? "#ef4444" : attachUsage.percentUsed > 80 ? "#f59e0b" : "#4f46e5",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}>
                {t(lang, "Total attachment size across Résumé, Portfolio, and Certificates must not exceed 10MB.")}
              </p>
            </div>
          );
        })()}
        <h3 style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{t(lang, "Résumé")}</span>{" "}
          <span style={{ fontWeight: 500, color: "#64748b", fontSize: 13 }}>
            ({(profile.resumes || []).length}/{MAX_PROFILE_RESUMES})
          </span>
          <InfoTip
            content={
              isVi
                ? "Tải lên tối đa 3 bản CV ở định dạng PDF, DOC, hoặc DOCX. Kích thước tối đa 5MB mỗi tệp."
                : "Upload up to 3 résumés in PDF, DOC, or DOCX formats. Maximum 5MB per file."
            }
            title={t(lang, "Résumé Upload Rules")}
          />
        </h3>

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
            disabled={resumeUploading || (profile.resumes || []).length >= MAX_PROFILE_RESUMES}
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

        {(() => {
          const list =
            profile.resumes && profile.resumes.length > 0
              ? profile.resumes
              : profile.resume?.fileName
              ? [profile.resume]
              : [];

          if (list.length === 0) return null;

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {list.map((r, idx) => {
                const isDefault =
                  !!r.isDefault ||
                  profile.resume?.id === r.id ||
                  profile.resume?.fileName === r.fileName ||
                  (list.length === 1 && !r.isDefault);
                const fileHref = r.dataUrl || r.fileUrl;
                const resumeId = r.id || `res-${idx}`;

                return (
                  <div
                    key={resumeId}
                    className="lv-resume-chip"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: isDefault ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                      backgroundColor: isDefault ? "#f0fdf4" : "#ffffff",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 200, flex: 1 }}>
                      <Icon
                        name="file-text"
                        size={18}
                        style={{ color: isDefault ? "#059669" : "#4f46e5", marginTop: 2, flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <p className="lv-resume-chip-name" style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
                            {r.fileName || r.resumeName || `Resume ${idx + 1}`}
                          </p>
                          {isDefault ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                                borderRadius: 999,
                                backgroundColor: "#d1fae5",
                                color: "#065f46",
                              }}
                            >
                              <Icon name="check" size={11} /> {isVi ? "CV Mặc định" : "Default Résumé"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultResume(r.id)}
                              style={{
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: 500,
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#ffffff",
                                color: "#475569",
                                cursor: "pointer",
                              }}
                              title={isVi ? "Đặt làm CV mặc định" : "Set as default résumé"}
                            >
                              {isVi ? "Đặt làm mặc định" : "Set as default"}
                            </button>
                          )}
                        </div>
                        <p className="lv-resume-chip-meta" style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>
                          {r.size ? `${(r.size / 1024).toFixed(0)} KB` : ""}
                          {r.uploadedAt ? ` · ${t(lang, "Uploaded")} ${r.uploadedAt}` : ""}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {/* Extract Data button */}
                      {(r.dataUrl || r.fileUrl) && (
                        <Tooltip
                          content={isVi ? "Trích xuất dữ liệu gốc từ CV này để cập nhật hồ sơ" : "Extract original data from this résumé to update profile"}
                          position="top"
                        >
                          <button
                            type="button"
                            onClick={() => handleExtractFromResume(r)}
                            disabled={isExtractingResume}
                            className="lv-photo-btn"
                            style={{
                              padding: "4px 10px",
                              fontSize: 12,
                              borderColor: "#c084fc",
                              backgroundColor: "#faf5ff",
                              color: "#7e22ce",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              cursor: isExtractingResume ? "not-allowed" : "pointer",
                            }}
                          >
                            <Icon name={isExtractingResume ? "refresh-cw" : "sparkles"} size={12} className={isExtractingResume ? "lv-spin" : ""} />
                            <span>{isExtractingResume ? (isVi ? "Đang đọc CV..." : "Reading CV...") : (isVi ? "Trích xuất dữ liệu gốc" : "Extract Original Data")}</span>
                          </button>
                        </Tooltip>
                      )}

                      {/* Download button */}
                      {fileHref && (
                        <Tooltip
                          content={isVi ? "Tải xuống tệp CV này" : "Download this résumé file"}
                          position="top"
                        >
                          <a
                            href={fileHref}
                            download={r.fileName || "resume.pdf"}
                            className="lv-photo-btn"
                            style={{ padding: "4px 10px", fontSize: 12 }}
                          >
                            <Icon name="download" size={12} /> {t(lang, "Download")}
                          </a>
                        </Tooltip>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveResume(r.id)}
                        className="lv-photo-btn"
                        style={{ padding: "4px 10px", fontSize: 12, color: "#dc2626", borderColor: "#fecaca", cursor: "pointer" }}
                        title={isVi ? "Xóa CV" : "Remove resume"}
                      >
                        <Icon name="trash-2" size={12} /> {t(lang, "Remove")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div style={{ marginTop: 14 }}>
          <Link href="/resume" className="lv-job-view" style={{ display: "inline-flex" }}>
            {t(lang, "Manage & preview résumé")} <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>

      {/* ── Portfolio & Work Showcase Section ── */}
      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
        <PortfolioManager
          portfolio={profile.portfolio || {}}
          profile={profile}
          onChange={(updatedPortfolio) => {
            persist({
              portfolio: updatedPortfolio,
              portfolioFile: updatedPortfolio,
            });
          }}
          lang={lang}
        />
      </div>

      {/* ── Save Profile Action Bar ── */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <span className="text-xs text-faint">
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

      {/* ── Resume Data Extraction Modal ── */}
      {isExtractModalOpen && (
        <ResumeExtractModal
          isOpen={isExtractModalOpen}
          onClose={() => setIsExtractModalOpen(false)}
          extractedData={extractedResumeData}
          onApply={handleApplyExtractedData}
          lang={lang}
        />
      )}
      {toastMsg && <Toast msg={toastMsg} />}
    </div>
  );
}

