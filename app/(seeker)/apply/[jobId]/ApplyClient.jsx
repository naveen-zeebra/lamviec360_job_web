"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Badge } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import Stepper from "../../../../components/ds/Stepper";
import Check from "../../../../components/ds/Check";
import { useLang, t } from "../../../../utils/lang";
import { JOBS } from "../../../../lib/data";
import { getProfile, hasAppliedToJob, addApplication, addNotification, saveResume } from "../../../../lib/seekerStore";
import { fetchPublicJobDetail } from "../../../../lib/api/publicApi";

const STEP_LABELS = ["Review Profile", "Resume", "Questions", "Additional", "Review", "Consent"];
const NOTICE_OPTIONS = ["Immediately available", "2 weeks", "1 month", "2 months", "3+ months"];
const MAX_RESUME_MB = 10;
const STORE_BYTES = 2 * 1024 * 1024;

export default function ApplyClient({ jobId }) {
  const [lang] = useLang();
  const router = useRouter();
  const initialJob = JOBS.find((j) => String(j.id) === String(jobId)) || null;
  const [job, setJob] = useState(initialJob);
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
    } catch (e) {}
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
    } catch (e) {}
  };
  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {}
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

  const validateStep = () => {
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
    if (!["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(ext)) {
      setErr(t(lang, "Use a PDF, DOC, DOCX, JPG or PNG file."));
      return;
    }
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      setErr(t(lang, "File is larger than 10MB."));
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
    if (!consent || submitting) return;
    setSubmitting(true);
    setErr("");
    try {
      const record = await addApplication({ jobId: job.id, resumeFileName, coverLetter, answers });
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
              <p className="lv-file-chip">
                <Icon name="file-text" size={14} />
                {resumeFileName}
              </p>
            ) : (
              <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>{t(lang, "No resume on file yet.")}</p>
            )}
            <label style={{ display: "block", marginTop: 16, fontSize: "var(--text-sm)", fontWeight: 600 }}>{t(lang, "Upload or replace")}</label>
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={onResumeChange} style={{ marginTop: 8 }} />
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6 }}>{t(lang, "PDF, DOC, DOCX, JPG or PNG. Max 10MB.")}</p>
          </div>
        )}

        {step === 3 && (
          <div className="lv-form-grid">
            <h2 style={{ fontSize: "var(--text-lg)", gridColumn: "1 / -1", marginBottom: 0 }}>{t(lang, "Employer questions")}</h2>
            <Select
              label={t(lang, "Notice period")}
              value={answers.noticePeriod}
              onChange={(e) => setAnswers({ ...answers, noticePeriod: e.target.value })}
              options={NOTICE_OPTIONS.map((v) => ({ value: v, label: t(lang, v) }))}
              placeholder={t(lang, "Select")}
            />
            <Input label={t(lang, "Expected salary (VND)")} value={answers.expectedSalary} onChange={(e) => setAnswers({ ...answers, expectedSalary: e.target.value })} placeholder="25,000,000" />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, display: "block", marginBottom: 6 }}>{t(lang, "Why are you a good fit for this role?")}</label>
              <textarea className="lv-textarea" rows={4} value={answers.whyFit} onChange={(e) => setAnswers({ ...answers, whyFit: e.target.value })} placeholder={t(lang, "Share relevant experience or skills")} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: 16 }}>{t(lang, "Additional information")}</h2>
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
            </dl>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: 16 }}>{t(lang, "Consent & submit")}</h2>
            <div className="lv-consent-box">
              <Check
                label={t(lang, "I consent to LàmViệc360 sharing my profile and application data with this employer for recruitment purposes.")}
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
