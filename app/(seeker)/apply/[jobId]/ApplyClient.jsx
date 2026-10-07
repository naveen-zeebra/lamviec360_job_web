"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Badge } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import Stepper from "../../../../components/ds/Stepper";
import Check from "../../../../components/ds/Check";
import { useLang, t } from "../../../../utils/lang";

import { getProfile, hasAppliedToJob, addApplication, addNotification, saveResume, computeCompleteness } from "../../../../lib/seekerStore";
import { fetchPublicJobDetail } from "../../../../lib/api/publicApi";

const STEP_LABELS = ["Review Profile", "Resume", "Questions", "Additional", "Review", "Consent"];
const NOTICE_OPTIONS = ["Immediately available", "2 weeks", "1 month", "2 months", "3+ months"];
// BR-101-03: Resume file size must not exceed 5 MB
const MAX_RESUME_MB = 5;
const STORE_BYTES = 2 * 1024 * 1024;

export default function ApplyClient({ jobId }) {
  const [lang] = useLang();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const draftKey = `lv360-apply-draft-${jobId}`;
  const [profile, setProfile] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [step, setStep] = useState(1);
  const [resumeFileName, setResumeFileName] = useState("");
  const [answers, setAnswers] = useState({ noticePeriod: "", expectedSalary: "", whyFit: "" });
  const [coverLetter, setCoverLetter] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [selectedCertIds, setSelectedCertIds] = useState([]);
  const [appliedCertFile, setAppliedCertFile] = useState(null);
  const [appliedCertTitle, setAppliedCertTitle] = useState("");
  const [appliedCertIssuer, setAppliedCertIssuer] = useState("");
  const [certDragOver, setCertDragOver] = useState(false);

  const handleCertificateFile = (file) => {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!["pdf", "png", "jpg", "jpeg", "doc", "docx"].includes(ext)) {
      setErr(t(lang, "Use a PDF, DOC, DOCX, JPG or PNG file."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr(t(lang, "File is larger than 5MB."));
      return;
    }
    setErr("");

    const filePayload = {
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: "",
    };

    if (file.size <= STORE_BYTES) {
      const reader = new FileReader();
      reader.onload = () => {
        filePayload.dataUrl = reader.result;
        setAppliedCertFile({ ...filePayload });
      };
      reader.readAsDataURL(file);
    } else {
      setAppliedCertFile(filePayload);
    }

    if (!appliedCertTitle) {
      const clean = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setAppliedCertTitle(clean);
    }
  };

  useEffect(() => {
    async function resolveJob() {
      if (!job && jobId) {
        try {
          const remote = await fetchPublicJobDetail(jobId);
          if (remote) {
            setJob({
              id: remote.id,
              title: remote.title,
              titleVi: remote.title,
              company: remote.company_name || "ABC Technologies",
              location: remote.location,
              locationVi: remote.location,
              skills: remote.skills || [],
            });
          }
        } catch (e) {
          console.warn("Could not fetch job for application:", e.message);
        }
      }
    }
    resolveJob();
  }, [jobId]);

  useEffect(() => {
    if (!job) return;
    const p = getProfile();
    setProfile(p);
    setResumeFileName(p.resume?.fileName || "");
    if (p.certifications && p.certifications.length > 0) {
      setSelectedCertIds(p.certifications.map((c) => c.id || c.name));
    }
    setAlreadyApplied(hasAppliedToJob(job.id));
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.answers) setAnswers(d.answers);
        if (d.coverLetter) setCoverLetter(d.coverLetter);
        if (d.step) setStep(d.step);
        setDraftSaved(true);
      }
    } catch (e) { }
  }, [job, jobId]);

  if (!job) {
    return (
      <div className="lv-page-container">
        <div className="lv-empty">
          <h3>{t(lang, "Job not found")}</h3>
          <p>{t(lang, "This job may have been removed or the link is out of date.")}</p>
          <div style={{ marginTop: 20 }}>
            <Link href="/jobs"><Button variant="secondary">{t(lang, "Browse jobs")}</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const titleText = lang === "VN" || lang === "VI" ? job.titleVi : job.title;

  const saveDraft = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ answers, coverLetter, step }));
      setDraftSaved(true);
    } catch (e) { }
  };
  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch (e) { }
  };

  if (alreadyApplied && !result) {
    return (
      <div className="lv-page-container">
        <div className="lv-empty">
          <Icon name="check-circle" size={28} style={{ color: "var(--color-success)", margin: "0 auto 12px" }} />
          <h3>{t(lang, "You've already applied to this role")}</h3>
          <p>{titleText} · {job.company}</p>
          <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/applications">
              <Button variant="primary">{t(lang, "View Application Tracker")}</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="secondary">{t(lang, "Find More Jobs")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="lv-page-container">
        <div className="lv-success-card">
          <div className="lv-simple-icon" style={{ color: "var(--color-success)" }}>
            <Icon name="check-circle" size={32} />
          </div>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, margin: "12px 0 8px" }}>{t(lang, "Application submitted")}</h1>
          <p style={{ color: "var(--text-secondary)" }}>{t(lang, "We've sent your application to the employer.")}</p>
          <dl className="lv-reg-summary" style={{ margin: "24px 0", textAlign: "left" }}>
            <div>
              <dt>{t(lang, "Job")}</dt>
              <dd>{titleText}</dd>
            </div>
            <div>
              <dt>{t(lang, "Company")}</dt>
              <dd>{job.company}</dd>
            </div>
            <div>
              <dt>{t(lang, "Date")}</dt>
              <dd>{result.appliedDate}</dd>
            </div>
            <div>
              <dt>{t(lang, "Application ID")}</dt>
              <dd>{result.id}</dd>
            </div>
            <div>
              <dt>{t(lang, "Status")}</dt>
              <dd>
                <Badge tone="brand">{t(lang, "Applied")}</Badge>
              </dd>
            </div>
          </dl>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/applications/${result.id}`}>
              <Button variant="primary">{t(lang, "View in Application Tracker")}</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">{t(lang, "Back to Dashboard")}</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="ghost">{t(lang, "Find More Jobs")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const completeness = profile ? computeCompleteness(profile) : 0;
  const canApply = completeness >= 60;

  const validateStep = () => {
    // BR-101-02: Profile Completeness (at least 60% required to apply)
    if (!canApply) {
      return t(lang, `A Job Seeker must have at least 60% profile completeness to apply for a job. Your profile is currently at ${completeness}%.`);
    }
    if (step === 1 && !profile.personal.fullName.trim()) return t(lang, "Add your full name in Profile settings before applying.");
    if (step === 2 && !resumeFileName) return t(lang, "Please add a résumé before continuing.");
    if (step === 3 && !answers.noticePeriod) return t(lang, "Please answer the notice period question.");
    if (step === 3 && !answers.whyFit.trim()) return t(lang, "Please tell the employer why you're a good fit.");
    return "";
  };

  const goNext = () => {
    const msg = validateStep();
    if (msg) {
      setErr(msg);
      return;
    }
    setErr("");
    saveDraft();
    setStep((s) => Math.min(6, s + 1));
  };
  const goBack = () => {
    setErr("");
    setStep((s) => Math.max(1, s - 1));
  };

  const onResumeChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    // BR-101-03: PDF, DOC, and DOCX only
    if (!["pdf", "doc", "docx"].includes(ext)) {
      setErr(t(lang, "Unsupported file format. Allowed formats: PDF, DOC, and DOCX only"));
      return;
    }
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      setErr(t(lang, `Resume file size must not exceed ${MAX_RESUME_MB} MB.`));
      return;
    }
    setErr("");
    const persist = (dataUrl) => {
      saveResume({ fileName: file.name, size: file.size, type: file.type, dataUrl: dataUrl || "" });
      setResumeFileName(file.name);
    };
    if (file.size <= STORE_BYTES) {
      const reader = new FileReader();
      reader.onload = () => persist(reader.result);
      reader.onerror = () => persist("");
      reader.readAsDataURL(file);
    } else {
      persist("");
    }
  };

  const submit = async () => {
    // BR-101-02: Prevent job application if profile completeness is below 60%
    if (!canApply) {
      setErr(t(lang, `A Job Seeker must have at least 60% profile completeness to apply for a job. Your profile is currently at ${completeness}%.`));
      return;
    }
    if (!consent || submitting) return;
    setSubmitting(true);
    setErr("");
    try {
      const certsToAttach = [
        ...(profile.certifications || []).filter((c) => selectedCertIds.includes(c.id || c.name)),
        ...(appliedCertFile
          ? [
            {
              id: "cert-app-" + Date.now(),
              name: appliedCertTitle.trim() || appliedCertFile.name.replace(/\.[^/.]+$/, ""),
              issuer: appliedCertIssuer.trim() || "",
              fileName: appliedCertFile.name,
              fileSize: appliedCertFile.size,
              fileDataUrl: appliedCertFile.dataUrl || "",
            },
          ]
          : []),
      ];
      const record = await addApplication({
        jobId: job.id,
        job: job,
        resumeFileName,
        coverLetter,
        answers,
        certifications: certsToAttach,
        certification: appliedCertFile
          ? {
            name: appliedCertTitle.trim() || appliedCertFile.name,
            fileName: appliedCertFile.name,
            size: appliedCertFile.size,
          }
          : certsToAttach[0] || null,
      });
      addNotification({
        type: "confirmation",
        title: t(lang, "Application submitted"),
        message: `${t(lang, "Your application for")} ${titleText} ${t(lang, "was received.")}`,
        applicationId: record.id,
      });
      clearDraft();
      setResult(record);
    } catch (e) {
      setErr(e.message || t(lang, "Could not submit application. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lv-page-container">
      <div className="lv-dash-welcome">
        <h1>{t(lang, "Apply for")} {titleText}</h1>
        <p>{job.company} · {lang === "VN" || lang === "VI" ? job.locationVi : job.location}</p>
      </div>
      <Stepper steps={STEP_LABELS.map((l) => t(lang, l))} current={step} />

      {draftSaved && step < 6 && (
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "12px 0 -4px", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="save" size={13} /> {t(lang, "Your progress is saved on this device.")}
        </p>
      )}

      <div className="lv-onboard-card">
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: 16 }}>{t(lang, "Review your profile")}</h2>

            {/* BR-101-02 Completeness Banner */}
            <div style={{
              padding: "14px 18px",
              borderRadius: 10,
              background: canApply ? "#f0fdf4" : "#fef2f2",
              border: canApply ? "1px solid #86efac" : "1px solid #fca5a5",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: canApply ? "#dcfce7" : "#fee2e2",
                  color: canApply ? "#16a34a" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <Icon name={canApply ? "check-circle" : "alert-circle"} size={20} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 13, color: canApply ? "#166534" : "#991b1b" }}>
                    {canApply ? `${t(lang, "Profile Completeness")}: ${completeness}% (Eligible to Apply)` : `${t(lang, "Profile Completeness")}: ${completeness}% / 60% Required`}
                  </strong>
                  <span style={{ fontSize: 11.5, color: canApply ? "#15803d" : "#b91c1c" }}>
                    {canApply
                      ? t(lang, "Meets minimum 60% completeness requirement.")
                      : t(lang, "A Job Seeker must have at least 60% profile completeness to apply for a job.")}
                  </span>
                </div>
              </div>
              {!canApply && (
                <Link
                  href="/onboarding"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#ffffff",
                    background: "#dc2626",
                    padding: "6px 14px",
                    borderRadius: 6,
                    textDecoration: "none"
                  }}
                >
                  {t(lang, "Complete Profile Now")}
                </Link>
              )}
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: 20 }}>{t(lang, "This information will be shared with the employer.")}</p>
            <dl className="lv-reg-summary">
              <div>
                <dt>{t(lang, "Full Name")}</dt>
                <dd>{profile.personal.fullName || "—"}</dd>
              </div>
              <div>
                <dt>{t(lang, "Phone")}</dt>
                <dd>{profile.personal.phone || "—"}</dd>
              </div>
              <div>
                <dt>{t(lang, "Location")}</dt>
                <dd>{profile.personal.location || "—"}</dd>
              </div>
              <div>
                <dt>{t(lang, "Current Job Title")}</dt>
                <dd>{profile.professional.title || "—"}</dd>
              </div>
              <div>
                <dt>{t(lang, "Skills")}</dt>
                <dd>{profile.professional.skills.join(", ") || "—"}</dd>
              </div>
            </dl>
            <Link href="/settings?tab=profile" className="lv-job-view" style={{ marginTop: 16, display: "inline-flex" }}>
              {t(lang, "Edit in Profile Settings")} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: 16 }}>{t(lang, "Resume")}</h2>
            {resumeFileName ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: "#e0e7ff", color: "#4f46e5", padding: 8, borderRadius: 6 }}>
                    <Icon name="file-text" size={20} />
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: 14, color: "#0f172a", marginBottom: 2 }}>{resumeFileName}</strong>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{profile.resume?.size ? (profile.resume.size / 1024 / 1024).toFixed(2) + " MB" : t(lang, "Resume ready")}</span>
                  </div>
                </div>
                {profile.resume?.dataUrl && (
                  <a href={profile.resume.dataUrl} download={resumeFileName} style={{ display: "flex", alignItems: "center", gap: 6, color: "#0284c7", fontSize: 13, fontWeight: 600, textDecoration: "none", padding: "6px 12px", background: "#e0f2fe", borderRadius: 6 }}>
                    <Icon name="download" size={14} />
                    {t(lang, "Download")}
                  </a>
                )}
              </div>
            ) : (
              <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 8, padding: "24px", textAlign: "center", marginBottom: 20 }}>
                <Icon name="upload-cloud" size={32} style={{ color: "#94a3b8", marginBottom: 12 }} />
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: 8 }}>{t(lang, "No resume on file yet.")}</p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t(lang, "PDF, DOC, DOCX only. Max 5MB.")}</p>
              </div>
            )}

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: 12 }}>
                {t(lang, "Upload or replace")} <span style={{ color: "var(--red-500)" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={onResumeChange}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="resume-upload"
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#334155", border: "1px solid #cbd5e1" }}
                  onMouseEnter={(e) => e.target.style.background = "#f1f5f9"}
                  onMouseLeave={(e) => e.target.style.background = "#f8fafc"}
                >
                  <Icon name="upload" size={16} />
                  {t(lang, "Choose File")}
                </label>
                <span style={{ fontSize: 12, color: "#64748b" }}>{t(lang, "PDF, DOC, DOCX up to 5MB")}</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="lv-form-grid">
            <h2 style={{ fontSize: "var(--text-lg)", gridColumn: "1 / -1", marginBottom: 0 }}>{t(lang, "Employer questions")}</h2>
            <Select
              label={<>{t(lang, "Notice period")} <span style={{ color: "var(--red-500)" }}>*</span></>}
              value={answers.noticePeriod}
              onChange={(e) => setAnswers({ ...answers, noticePeriod: e.target.value })}
              options={NOTICE_OPTIONS.map((v) => ({ value: v, label: t(lang, v) }))}
              placeholder={t(lang, "Select")}
            />
            <Input label={t(lang, "Expected salary (VND)")} value={answers.expectedSalary} onChange={(e) => setAnswers({ ...answers, expectedSalary: e.target.value })} placeholder="25,000,000" />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, display: "block", marginBottom: 6 }}>
                {t(lang, "Why are you a good fit for this role?")} <span style={{ color: "var(--red-500)" }}>*</span>
              </label>
              <textarea className="lv-textarea" rows={4} value={answers.whyFit} onChange={(e) => setAnswers({ ...answers, whyFit: e.target.value })} placeholder={t(lang, "Share relevant experience or skills")} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: 16 }}>{t(lang, "Additional information")}</h2>

            {/* ── Redesigned Certification / Professional Licenses in Application Form ── */}
            <div style={{ marginBottom: 24, padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              {/* Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "#e0e7ff", color: "#4f46e5", flexShrink: 0 }}>
                    <Icon name="award" size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {t(lang, "Certification / Professional Licenses")}
                    </h3>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                      {t(lang, "Attach relevant professional certifications or licenses to strengthen your application.")}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 11, background: "#e2e8f0", padding: "3px 9px", borderRadius: 99, color: "#475569", fontWeight: 600 }}>
                  {t(lang, "Optional")}
                </span>
              </div>

              {/* Helper to normalize profile certification item */}
              {(() => {
                const rawCerts = profile.certifications || [];
                const normalizedCerts = rawCerts.map((c, idx) => {
                  if (typeof c === "string") {
                    return {
                      id: c,
                      name: c,
                      issuer: "",
                      issueDate: "",
                      credentialId: "",
                      fileName: null,
                    };
                  }
                  return {
                    id: c.id || c.name || c.title || `cert-${idx}`,
                    name: c.name || c.title || t(lang, "Certification"),
                    issuer: c.issuer || "",
                    issueDate: c.issueDate || "",
                    credentialId: c.credentialId || "",
                    fileName: c.fileName || (c.fileData ? t(lang, "Document attached") : null),
                  };
                });

                const allIds = normalizedCerts.map((c) => c.id);
                const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedCertIds.includes(id));

                return (
                  <>
                    {/* 1. Saved Profile Certifications Selection */}
                    {normalizedCerts.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                            {t(lang, "Select from your profile certifications")}:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCertIds(isAllSelected ? [] : allIds);
                            }}
                            style={{ fontSize: 12, fontWeight: 600, color: "var(--surface-brand, #2563eb)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            {isAllSelected ? t(lang, "Deselect all") : t(lang, "Select all")}
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                          {normalizedCerts.map((c) => {
                            const isSelected = selectedCertIds.includes(c.id);
                            return (
                              <div
                                key={c.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCertIds(selectedCertIds.filter((id) => id !== c.id));
                                  } else {
                                    setSelectedCertIds([...selectedCertIds, c.id]);
                                  }
                                }}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 12,
                                  padding: "12px 14px",
                                  borderRadius: 10,
                                  background: isSelected ? "#eff6ff" : "#ffffff",
                                  border: isSelected ? "1.5px solid #3b82f6" : "1px solid #cbd5e1",
                                  boxShadow: isSelected ? "0 2px 6px rgba(59, 130, 246, 0.15)" : "none",
                                  transition: "all 0.15s ease",
                                  userSelect: "none",
                                }}
                              >
                                <div
                                  style={{
                                    marginTop: 2,
                                    width: 20,
                                    height: 20,
                                    borderRadius: 5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: isSelected ? "var(--surface-brand, #2563eb)" : "#ffffff",
                                    border: isSelected ? "none" : "1.5px solid #cbd5e1",
                                    color: "#ffffff",
                                    flexShrink: 0,
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  {isSelected && <Icon name="check" size={14} />}
                                </div>

                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <strong style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {c.name}
                                  </strong>
                                  {c.issuer && (
                                    <span style={{ display: "block", fontSize: 11, color: "#64748b", margin: "1px 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {c.issuer}
                                    </span>
                                  )}
                                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, fontSize: 10, marginTop: 4 }}>
                                    {c.issueDate && (
                                      <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569", fontWeight: 500 }}>
                                        {c.issueDate}
                                      </span>
                                    )}
                                    {c.credentialId && (
                                      <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569", fontWeight: 500 }}>
                                        ID: {c.credentialId}
                                      </span>
                                    )}
                                    {c.fileName && (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#dcfce7", padding: "2px 6px", borderRadius: 4, color: "#166534", fontWeight: 600 }}>
                                        <Icon name="file-text" size={11} />
                                        {c.fileName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* 2. Upload Certificate for this application */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                    {profile.certifications && profile.certifications.length > 0
                      ? t(lang, "Upload a certificate for this application") + ":"
                      : t(lang, "Upload certificate document:")}
                  </span>
                  {(!profile.certifications || profile.certifications.length === 0) && (
                    <Link
                      href="/settings?tab=profile"
                      style={{ fontSize: 12, fontWeight: 600, color: "var(--surface-brand, #2563eb)", textDecoration: "none" }}
                    >
                      {t(lang, "Manage in Profile Settings")}
                    </Link>
                  )}
                </div>

                {appliedCertFile ? (
                  <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "16px 18px", boxShadow: "0 2px 8px rgba(34, 197, 94, 0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 10, background: "#dcfce7", color: "#16a34a", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                          <Icon name="file-text" size={22} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {appliedCertFile.name}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, fontSize: 11 }}>
                            <span style={{ color: "#64748b" }}>
                              {(appliedCertFile.size / 1024).toFixed(0)} KB
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#16a34a", fontWeight: 600 }}>
                              <Icon name="check-circle" size={13} /> {t(lang, "Ready to attach")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <label
                          htmlFor="apply-cert-replace-file"
                          style={{
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#1e293b",
                            background: "#ffffff",
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                        >
                          {t(lang, "Replace file")}
                        </label>
                        <input
                          type="file"
                          id="apply-cert-replace-file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleCertificateFile(f);
                          }}
                          style={{ display: "none" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCertFile(null);
                            setAppliedCertTitle("");
                            setAppliedCertIssuer("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "6px 8px",
                          }}
                        >
                          <Icon name="trash-2" size={14} /> {t(lang, "Remove")}
                        </button>
                      </div>
                    </div>

                    {/* Metadata fields for uploaded certificate */}
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #bbf7d0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                          {t(lang, "Certificate / License Title (optional)")}
                        </label>
                        <input
                          type="text"
                          value={appliedCertTitle}
                          onChange={(e) => setAppliedCertTitle(e.target.value)}
                          placeholder={t(lang, "e.g. AWS Certified Solutions Architect, PMP, TOEIC...")}
                          style={{ width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #cbd5e1", background: "#ffffff", color: "#0f172a" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                          {t(lang, "Issuing Organization (optional)")}
                        </label>
                        <input
                          type="text"
                          value={appliedCertIssuer}
                          onChange={(e) => setAppliedCertIssuer(e.target.value)}
                          placeholder={t(lang, "e.g. Amazon Web Services, PMI, Educational Testing Service...")}
                          style={{ width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #cbd5e1", background: "#ffffff", color: "#0f172a" }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="apply-cert-file-upload"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleCertificateFile(f);
                      }}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor="apply-cert-file-upload"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setCertDragOver(true);
                      }}
                      onDragLeave={() => setCertDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setCertDragOver(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleCertificateFile(f);
                      }}
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "26px 16px",
                        borderRadius: 12,
                        border: certDragOver ? "2px dashed var(--surface-brand, #2563eb)" : "1.5px dashed #cbd5e1",
                        background: certDragOver ? "#eff6ff" : "#ffffff",
                        transition: "all 0.15s ease",
                        textAlign: "center",
                      }}
                      onMouseEnter={(e) => {
                        if (!certDragOver) {
                          e.currentTarget.style.borderColor = "var(--surface-brand, #2563eb)";
                          e.currentTarget.style.background = "#f8fafc";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!certDragOver) {
                          e.currentTarget.style.borderColor = "#cbd5e1";
                          e.currentTarget.style.background = "#ffffff";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 12, background: "#eff6ff", color: "var(--surface-brand, #2563eb)", marginBottom: 10, boxShadow: "0 2px 5px rgba(37,99,235,0.1)" }}>
                        <Icon name="upload-cloud" size={24} />
                      </div>
                      <strong style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>
                        {t(lang, "Click to upload certificate or drag & drop")}
                      </strong>
                      <span style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
                        {t(lang, "PDF, PNG, JPG, JPEG, DOC, DOCX up to 5MB")}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", background: "#ffffff", padding: "6px 18px", borderRadius: 8, border: "1px solid #cbd5e1", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        {t(lang, "Browse file")}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, display: "block", marginBottom: 6 }}>{t(lang, "Cover letter (optional)")}</label>
            <textarea className="lv-textarea" rows={6} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder={t(lang, "Add a short note to the employer (optional)")} />
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: 16 }}>{t(lang, "Review your application")}</h2>
            <dl className="lv-reg-summary">
              <div>
                <dt>{t(lang, "Applicant")}</dt>
                <dd>{profile.personal.fullName || "—"}</dd>
              </div>
              <div>
                <dt>{t(lang, "Resume")}</dt>
                <dd>{resumeFileName || "—"}</dd>
              </div>
              <div>
                <dt>{t(lang, "Notice period")}</dt>
                <dd>{answers.noticePeriod ? t(lang, answers.noticePeriod) : "—"}</dd>
              </div>
              <div>
                <dt>{t(lang, "Expected salary")}</dt>
                <dd>{answers.expectedSalary || "—"}</dd>
              </div>
              <div>
                <dt>{t(lang, "Cover letter")}</dt>
                <dd>{coverLetter ? t(lang, "Included") : t(lang, "Not included")}</dd>
              </div>
              <div>
                <dt>{t(lang, "Certifications")}</dt>
                <dd>
                  {selectedCertIds.length > 0 || appliedCertFile ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {selectedCertIds.map((id) => {
                        const c = (profile.certifications || []).find((x) => (x.id || x.name) === id);
                        return (
                          <div key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#1e40af", background: "#eff6ff", padding: "4px 10px", borderRadius: 6, border: "1px solid #bfdbfe" }}>
                            <Icon name="award" size={14} />
                            <span style={{ fontWeight: 600 }}>{c ? c.name : id}</span>
                            {c?.issuer && <span style={{ color: "#3b82f6", fontSize: 12 }}>· {c.issuer}</span>}
                          </div>
                        );
                      })}
                      {appliedCertFile && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#166534", background: "#f0fdf4", padding: "4px 10px", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                          <Icon name="file-text" size={14} />
                          <span style={{ fontWeight: 600 }}>{appliedCertTitle || appliedCertFile.name}</span>
                          <span style={{ fontSize: 11, color: "#16a34a" }}>({(appliedCertFile.size / 1024).toFixed(0)} KB)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    t(lang, "None attached")
                  )}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: 16 }}>{t(lang, "Consent & submit")}</h2>
            <div className="lv-consent-box">
              <Check
                label={<>{t(lang, "I consent to LàmViệc360 sharing my profile and application data with this employer for recruitment purposes.")} <span style={{ color: "var(--red-500)" }}>*</span></>}
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 12 }}>{t(lang, "Required before you can submit your application.")}</p>
          </div>
        )}

        {err && (
          <p className="lv-error" role="alert" style={{ marginTop: 20 }}>
            <Icon name="alert-circle" size={16} />
            <span>{err}</span>
          </p>
        )}

        <div className="lv-reg-actions">
          {step > 1 && (
            <Button type="button" variant="secondary" onClick={goBack} disabled={submitting}>
              {t(lang, "Back")}
            </Button>
          )}
          {step < 6 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                saveDraft();
                router.push("/jobs");
              }}
            >
              {t(lang, "Save & exit")}
            </Button>
          )}
          {step < 6 ? (
            <Button type="button" variant="primary" onClick={goNext} style={{ marginLeft: "auto" }}>
              {t(lang, "Continue")}
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={submit} disabled={!consent || submitting} style={{ marginLeft: "auto" }}>
              {submitting ? t(lang, "Submitting...") : t(lang, "Submit Application")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
