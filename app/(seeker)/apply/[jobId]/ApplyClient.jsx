"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Badge } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import Check from "../../../../components/ds/Check";
import { useLang, t } from "../../../../utils/lang";

import {
  isLoggedIn,
  getProfile,
  getAuth,
  getApplicationByJobId,
  withdrawApplication,
  addApplication,
  addNotification,
  refreshResumesFromApi,
  computeCompleteness,
  checkReapplicationEligibility,
} from "../../../../lib/seekerStore";
import { fetchPublicJobDetail } from "../../../../lib/api/publicApi";
import { UPLOAD_CONFIG } from "../../../../config/uploadConfig";
import { validateResumeFile } from "../../../../utils/fileValidation";

export default function ApplyClient({ jobId }) {
  const [lang] = useLang();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [auth, setAuth] = useState(null);
  const [eligibility, setEligibility] = useState({ canApply: true });
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Resume state (Auto-selects default per JSP-FR-004b)
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [applyResumeFile, setApplyResumeFile] = useState(null);
  const [saveApplyResumeToProfile, setSaveApplyResumeToProfile] = useState(true);

  // Cover letter & consent
  const [coverLetter, setCoverLetter] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const errorRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push(`/login?redirect=${encodeURIComponent(`/apply/${jobId}`)}`);
      return;
    }
    setAuth(getAuth());
  }, [jobId, router]);

  useEffect(() => {
    async function resolveJob() {
      if (!job && jobId) {
        try {
          const remote = await fetchPublicJobDetail(jobId);
          if (remote) {
            setJob({
              ...remote,
              id: remote.id,
              title: remote.title,
              titleVi: remote.titleVi || remote.title,
              company: remote.company || remote.company_name || "Company",
              location: remote.location,
              locationVi: remote.locationVi || remote.location,
              skills: remote.skills || [],
              isNoLongerAvailable: remote.isNoLongerAvailable,
              isExpired: remote.isExpired,
              isLive: remote.isLive,
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
    const currentAuth = getAuth();
    setProfile(p);
    setAuth(currentAuth);

    refreshResumesFromApi().then((list) => {
      setResumes(list);
      // Auto-select default resume per JSP-FR-004b
      const def = list.find((r) => r.isDefault) || list[0];
      if (def) {
        setSelectedResumeId(def.id);
        setResumeFileName(def.fileName);
      } else if (p.resume?.fileName) {
        setResumeFileName(p.resume.fileName);
      }
    });

    const foundApp = getApplicationByJobId(job.id);
    setExistingApp(foundApp);
    const elig = checkReapplicationEligibility(job.id);
    setEligibility(elig);
    setAlreadyApplied(!elig.canApply && elig.reason === "already_applied");
  }, [job, jobId]);

  const handleResumeFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const validation = validateResumeFile(file, lang);
    if (!validation.valid) {
      setErr(t(lang, validation.error));
      return;
    }
    setErr("");
    setApplyResumeFile(file);
    setResumeFileName(file.name);
    setSelectedResumeId("");
  };

  const handleWithdrawFromApplyPage = async () => {
    if (!existingApp) return;
    setWithdrawing(true);
    try {
      await withdrawApplication(existingApp.id);
      setAlreadyApplied(false);
      setWithdrawSuccess(true);
      setIsWithdrawModalOpen(false);
      setExistingApp((prev) => ({
        ...prev,
        stage: "Withdrawn",
        status: "withdrawn",
        closed: true,
      }));
    } catch (err) {
      setErr(err.message || t(lang, "Could not withdraw application"));
    } finally {
      setWithdrawing(false);
    }
  };

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

  const titleText = lang === "VN" || lang === "VI" ? job.titleVi || job.title : job.title;

  if (job.isNoLongerAvailable || job.isExpired || job.isLive === false) {
    return (
      <div className="lv-page-container">
        <div className="lv-empty">
          <Icon name="alert-circle" size={40} style={{ color: "#ef4444", margin: "0 auto 14px" }} />
          <h3>{lang === "VN" || lang === "VI" ? "Công việc đã hết hạn hoặc đã đóng" : "Job No Longer Available"}</h3>
          <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{titleText} · {job.company}</p>
          <p style={{ maxWidth: 520, margin: "14px auto 24px", color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
            {lang === "VN" || lang === "VI"
              ? "Vị trí tuyển dụng này đã hết hạn nhận hồ sơ hoặc đã được nhà tuyển dụng đóng. Vui lòng khám phá các công việc đang mở tuyển khác trên LàmViệc360."
              : "This job posting has reached its application deadline or has been closed by the employer. Please explore other active job opportunities on LamViec360."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/jobs">
              <Button variant="primary">{lang === "VN" || lang === "VI" ? "Xem việc làm đang tuyển" : "Browse Live Jobs"}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRejectedLockout = !eligibility.canApply && eligibility.reason === "rejected_lockout";
  if (isRejectedLockout && !result) {
    return (
      <div className="lv-page-container">
        <div className="lv-empty">
          <Icon name="clock" size={36} style={{ color: "#d97706", margin: "0 auto 12px" }} />
          <h3>{lang === "VN" || lang === "VI" ? "Thời gian chờ ứng tuyển lại (90 ngày)" : "Reapplication Cooling-off Period (90 Days)"}</h3>
          <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{titleText} · {job.company}</p>
          <div style={{
            margin: "14px auto 18px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 18px",
            background: "#fffbeb",
            color: "#92400e",
            borderRadius: "9999px",
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            border: "1px solid #fde68a"
          }}>
            <Icon name="alert-triangle" size={16} />
            <span>
              {lang === "VN" || lang === "VI"
                ? `Còn lại ${eligibility.daysRemaining} ngày (Được ứng tuyển lại từ ngày ${eligibility.eligibleDate})`
                : `${eligibility.daysRemaining} days remaining (Eligible to reapply on ${eligibility.eligibleDate})`}
            </span>
          </div>
          <p style={{ maxWidth: 520, margin: "0 auto 24px", color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
            {lang === "VN" || lang === "VI"
              ? "Theo quy định nền tảng, ứng viên chưa phù hợp trong đợt ứng tuyển trước cần đợi 90 ngày kể từ ngày thông báo kết quả trước khi nộp lại hồ sơ cho cùng một vị trí."
              : "Candidates who were not selected must wait 90 days from the rejection notification before reapplying to the same position."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {eligibility.application && (
              <Link href={`/applications/${eligibility.application.id}`}>
                <Button variant="secondary">{t(lang, "View Previous Application")}</Button>
              </Link>
            )}
            <Link href="/jobs">
              <Button variant="primary">{t(lang, "Find More Jobs")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyApplied && !result) {
    const rawStage = existingApp?.stage || existingApp?.status || "Applied";
    const currentAppStage = rawStage.toLowerCase() === "applied" ? "Applied" : rawStage;
    const canWithdraw = currentAppStage.toLowerCase() === "applied";

    return (
      <div className="lv-page-container">
        <div className="lv-empty">
          <Icon name="check-circle" size={32} style={{ color: "var(--color-success)", margin: "0 auto 12px" }} />
          <h3>{t(lang, "You've already applied to this role")}</h3>
          <p>{titleText} · {job.company}</p>
          <div style={{
            margin: "12px auto 16px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            background: canWithdraw ? "#ecfdf5" : "#eff6ff",
            color: canWithdraw ? "#065f46" : "#1e40af",
            borderRadius: "9999px",
            fontSize: "var(--text-xs)",
            fontWeight: 600
          }}>
            <Icon name={canWithdraw ? "clock" : "search"} size={13} />
            <span>{t(lang, "Status")}: {t(lang, currentAppStage)}</span>
          </div>
          <p style={{ maxWidth: 460, margin: "0 auto 24px", color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
            {canWithdraw
              ? (lang === "VN" || lang === "VI"
                ? "Hồ sơ của bạn đã được gửi tới nhà tuyển dụng và đang chờ xét duyệt. Bạn có thể rút hồ sơ trước khi nhà tuyển dụng bắt đầu xét duyệt."
                : "Your application is waiting for employer screening. You may withdraw your application before employer screening begins.")
              : (lang === "VN" || lang === "VI"
                ? "Hồ sơ đang trong quy trình xét duyệt của nhà tuyển dụng. Chỉ có thể rút hồ sơ khi ở trạng thái 'Đã nộp'."
                : "Employer screening is underway for this position; applications cannot be withdrawn after screening begins.")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {existingApp && (
              <Link href={`/applications/${existingApp.id}`}>
                <Button variant="primary">{t(lang, "View Application Details")}</Button>
              </Link>
            )}
            {canWithdraw && (
              <Button
                variant="secondary"
                onClick={() => setIsWithdrawModalOpen(true)}
                style={{
                  color: "var(--color-error, #ef4444)",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Icon name="undo-2" size={14} />
                {t(lang, "Withdraw application")}
              </Button>
            )}
            <Link href="/jobs">
              <Button variant="secondary">{t(lang, "Find More Jobs")}</Button>
            </Link>
          </div>
        </div>

        {isWithdrawModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => !withdrawing && setIsWithdrawModalOpen(false)}
          >
            <div
              style={{
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: "16px",
                maxWidth: "460px",
                width: "100%",
                padding: "24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1px solid #e2e8f0",
                textAlign: "left",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#fef2f2",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="alert-triangle" size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>
                    {t(lang, "Withdraw application")}
                  </h3>
                </div>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 20px" }}>
                <strong>{t(lang, "Withdraw this application? This can't be undone.")}</strong>
                <br />
                {lang === "VN" || lang === "VI"
                  ? `Bạn đang rút hồ sơ cho vị trí "${titleText}" tại ${job.company}. Nhà tuyển dụng sẽ không tiếp tục xét duyệt hồ sơ này.`
                  : `You are withdrawing your application for "${titleText}" at ${job.company}. The employer will no longer consider this application.`}
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button
                  variant="secondary"
                  disabled={withdrawing}
                  onClick={() => setIsWithdrawModalOpen(false)}
                >
                  {t(lang, "Cancel")}
                </Button>
                <Button
                  variant="primary"
                  disabled={withdrawing}
                  onClick={handleWithdrawFromApplyPage}
                  style={{ background: "#ef4444", borderColor: "#ef4444", color: "#ffffff" }}
                >
                  {withdrawing ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon name="loader" size={14} className="spin" />
                      {lang === "VN" || lang === "VI" ? "Đang xử lý..." : "Withdrawing..."}
                    </span>
                  ) : (
                    t(lang, "Withdraw")
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (result) {
    return (
      <div className="lv-page-container">
        <div className="lv-success-card">
          <div className="lv-simple-icon" style={{ color: "var(--color-success)" }}>
            <Icon name="check-circle" size={36} />
          </div>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, margin: "14px 0 8px" }}>
            {lang === "VN" || lang === "VI" ? "Nộp đơn ứng tuyển thành công!" : "Application Submitted Successfully!"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
            {lang === "VN" || lang === "VI"
              ? `Hồ sơ của bạn đã được chuyển tới nhà tuyển dụng ${job.company}.`
              : `Your profile has been securely delivered to ${job.company}.`}
          </p>

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
              <dt>{lang === "VN" || lang === "VI" ? "Ngày nộp" : "Applied Date"}</dt>
              <dd>{result.appliedDate}</dd>
            </div>
            <div>
              <dt>{lang === "VN" || lang === "VI" ? "Mã hồ sơ" : "Application ID"}</dt>
              <dd><code style={{ fontWeight: 700, color: "var(--surface-brand, #2563eb)" }}>{result.id}</code></dd>
            </div>
            <div>
              <dt>{t(lang, "Resume")}</dt>
              <dd>{result.resumeName || result.resumeFileName || "Default Resume"}</dd>
            </div>
            {result.coverLetter && (
              <div>
                <dt>{lang === "VN" || lang === "VI" ? "Thư giới thiệu" : "Cover Letter"}</dt>
                <dd style={{ whiteSpace: "pre-wrap" }}>{result.coverLetter}</dd>
              </div>
            )}
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

  // Profile data & email fallback (Fixes missing candidate email bug)
  const candidateEmail = (profile.personal?.email || auth?.email || auth?.user?.email || "").trim();
  const candidateName = (profile.personal?.fullName || auth?.name || auth?.full_name || auth?.user?.full_name || "").trim();
  const candidatePhone = (profile.personal?.phone || auth?.phone || "").trim();
  const candidateLocation = (profile.personal?.location || "").trim();
  const candidateTitle = (profile.professional?.title || "").trim();
  const candidateSkills = Array.isArray(profile.professional?.skills) ? profile.professional.skills : [];

  const completeness = computeCompleteness(profile, auth);
  const canApply = completeness >= 60;

  const submitApplication = async () => {
    setErr("");

    // Gate 1: Profile Completeness
    if (!canApply) {
      const msg = lang === "VN" || lang === "VI"
        ? `Hồ sơ của bạn mới đạt ${completeness}%. Cần đạt tối thiểu 60% để ứng tuyển theo quy định.`
        : `Profile completeness is ${completeness}%. A minimum of 60% completeness is required to apply.`;
      setErr(msg);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Gate 2: Full Name
    if (!candidateName) {
      const msg = lang === "VN" || lang === "VI"
        ? "Vui lòng cập nhật Họ và tên trong hồ sơ trước khi ứng tuyển."
        : "Please add your Full Name in Profile settings before applying.";
      setErr(msg);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Gate 3: Resume
    if (!resumeFileName && !applyResumeFile) {
      const msg = lang === "VN" || lang === "VI"
        ? "Vui lòng chọn hoặc tải lên một bản CV / Hồ sơ trước khi nộp."
        : "Please select or upload a résumé before submitting.";
      setErr(msg);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Gate 4: PDPD Consent Checkbox only
    if (!consent) {
      const msg = lang === "VN" || lang === "VI"
        ? "Vui lòng đánh dấu đồng ý chia sẻ thông tin theo Nghị định 13/2023/NĐ-CP."
        : "Please agree to the consent terms before submitting your application.";
      setErr(msg);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const selectedResumeObj = resumes.find((r) => String(r.id) === String(selectedResumeId));
      const resolvedResumeName = applyResumeFile
        ? applyResumeFile.name
        : (selectedResumeObj?.resumeName || resumeFileName || "Resume");

      const record = await addApplication({
        jobId: job.id,
        job: job,
        resumeFileName,
        resumeName: resolvedResumeName,
        resumeId: applyResumeFile ? null : selectedResumeId,
        resumeFile: applyResumeFile,
        saveToProfile: saveApplyResumeToProfile,
        coverLetter: coverLetter.trim(),
        answers: {},
        certifications: [],
        certification: null,
        consent: true,
      });

      addNotification({
        type: "confirmation",
        title: lang === "VN" || lang === "VI" ? "Ứng tuyển thành công" : "Application submitted",
        message: `${t(lang, "Your application for")} ${titleText} ${t(lang, "was received.")}`,
        applicationId: record.id,
      });

      setResult(record);
    } catch (e) {
      setErr(e.message || t(lang, "Could not submit application. Please try again."));
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lv-page-container">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-tertiary)", marginBottom: 16 }}>
        <Link href="/jobs" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>{t(lang, "Jobs")}</Link>
        <Icon name="chevron-right" size={13} />
        <Link href={`/job-detail/${job.id}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>{titleText}</Link>
        <Icon name="chevron-right" size={13} />
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{lang === "VN" || lang === "VI" ? "Ứng tuyển 1-Chạm" : "One-Click Apply"}</span>
      </nav>

      {/* Header with One-Click Apply Badge */}
      <div className="lv-dash-welcome" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 800 }}>{t(lang, "Apply for")} {titleText}</h1>

          </div>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
            <strong>{job.company}</strong> · {lang === "VN" || lang === "VI" ? job.locationVi || job.location : job.location}
          </p>
        </div>
        <Link href={`/job-detail/${job.id}`}>
          <Button variant="secondary" size="sm">
            <Icon name="arrow-left" size={14} style={{ marginRight: 4 }} />
            {lang === "VN" || lang === "VI" ? "Xem lại tin tuyển dụng" : "Back to Job Details"}
          </Button>
        </Link>
      </div>

      {/* Reapplication / Withdrawal feedback */}
      {(withdrawSuccess || (existingApp && (existingApp.status === "withdrawn" || (existingApp.stage || "").toLowerCase() === "withdrawn"))) && (
        <div style={{
          padding: "12px 16px",
          marginBottom: 20,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 10,
          color: "#166534",
          fontSize: "var(--text-sm)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <Icon name="info" size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
          <span>
            {lang === "VN" || lang === "VI"
              ? "Bạn đã rút hồ sơ cho vị trí này trước đó. Bạn có thể nộp lại hồ sơ ứng tuyển mới bên dưới."
              : "You previously withdrew your application for this position. You can submit a fresh application below."}
          </span>
        </div>
      )}

      {/* Profile Completeness & Readiness Gate */}
      <div style={{
        padding: "14px 18px",
        borderRadius: 12,
        background: canApply ? "#f0fdf4" : "#fef2f2",
        border: canApply ? "1px solid #86efac" : "1px solid #fca5a5",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: canApply ? "#dcfce7" : "#fee2e2",
            color: canApply ? "#16a34a" : "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Icon name={canApply ? "check-circle" : "alert-circle"} size={22} />
          </div>
          <div>
            <strong style={{ display: "block", fontSize: 13.5, color: canApply ? "#166534" : "#991b1b" }}>
              {canApply
                ? (lang === "VN" || lang === "VI"
                  ? `Hồ sơ đủ điều kiện ứng tuyển: ${completeness}% hoàn thiện`
                  : `Profile Ready for One-Click Apply: ${completeness}% Complete`)
                : (lang === "VN" || lang === "VI"
                  ? `Độ hoàn thiện hồ sơ: ${completeness}% / Yêu cầu tối thiểu 60%`
                  : `Profile Completeness: ${completeness}% / 60% Required`)}
            </strong>
            <span style={{ fontSize: 12, color: canApply ? "#15803d" : "#b91c1c" }}>
              {canApply
                ? (lang === "VN" || lang === "VI"
                  ? "Thông tin cá nhân và CV mặc định đã được chuẩn bị sẵn sàng để gửi."
                  : "Candidate snapshot and default resume ready for immediate dispatch.")
                : (lang === "VN" || lang === "VI"
                  ? "Vui lòng hoàn thiện tối thiểu 60% thông tin hồ sơ để mở tính năng ứng tuyển."
                  : "A Job Seeker must have at least 60% profile completeness to apply for a job.")}
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
              padding: "7px 16px",
              borderRadius: 8,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Icon name="pencil" size={13} />
            {t(lang, "Complete Profile Now")}
          </Link>
        )}
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {/* SECTION 1: Candidate Profile Snapshot */}
        <section style={{
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="user-check" size={18} style={{ color: "var(--surface-brand, #2563eb)" }} />
              <h2 style={{ fontSize: "var(--text-md)", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                {lang === "VN" || lang === "VI" ? "Hồ sơ ứng viên (Tự động điền)" : "Candidate Information Snapshot"}
              </h2>
            </div>
            <Link href="/settings?tab=profile" style={{ fontSize: 12, fontWeight: 600, color: "var(--surface-brand, #2563eb)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              {lang === "VN" || lang === "VI" ? "Chỉnh sửa hồ sơ" : "Edit Profile"}
              <Icon name="arrow-right" size={12} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                {lang === "VN" || lang === "VI" ? "Họ và tên" : "Full Name"} *
              </span>
              <strong style={{ fontSize: 13.5, color: candidateName ? "var(--text-primary)" : "#dc2626" }}>
                {candidateName || (lang === "VN" || lang === "VI" ? "Chưa cập nhật họ tên" : "Missing full name")}
              </strong>
            </div>

            <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                {lang === "VN" || lang === "VI" ? "Email liên hệ" : "Email Address"} *
              </span>
              <strong style={{ fontSize: 13.5, color: candidateEmail ? "var(--text-primary)" : "#dc2626" }}>
                {candidateEmail || (lang === "VN" || lang === "VI" ? "Chưa có email" : "Missing email")}
              </strong>
            </div>

            <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                {lang === "VN" || lang === "VI" ? "Số điện thoại" : "Phone"}
              </span>
              <strong style={{ fontSize: 13.5, color: "var(--text-primary)" }}>
                {candidatePhone || "—"}
              </strong>
            </div>

            <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                {lang === "VN" || lang === "VI" ? "Khu vực / Tỉnh thành" : "Location"}
              </span>
              <strong style={{ fontSize: 13.5, color: "var(--text-primary)" }}>
                {candidateLocation || "—"}
              </strong>
            </div>
          </div>

          {(candidateTitle || candidateSkills.length > 0) && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #e2e8f0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, fontSize: 12.5 }}>
              {candidateTitle && (
                <span style={{ color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{lang === "VN" || lang === "VI" ? "Chức danh:" : "Title:"}</strong> {candidateTitle}
                </span>
              )}
              {candidateSkills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{lang === "VN" || lang === "VI" ? "Kỹ năng:" : "Skills:"}</strong>
                  </span>
                  {candidateSkills.slice(0, 5).map((s) => (
                    <span key={s} style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, color: "#334155" }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 2: Résumé / CV Selection (Auto-Selected Default per JSP-FR-004b) */}
        <section style={{
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="file-text" size={18} style={{ color: "var(--surface-brand, #2563eb)" }} />
              <h2 style={{ fontSize: "var(--text-md)", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                {lang === "VN" || lang === "VI" ? "Hồ sơ ứng tuyển (CV / Résumé)" : "Attached Résumé / CV"} *
              </h2>
            </div>
            <Link href="/resume" style={{ fontSize: 12, fontWeight: 600, color: "var(--surface-brand, #2563eb)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              {t(lang, "Manage résumés")}
              <Icon name="arrow-right" size={12} />
            </Link>
          </div>

          {/* List of profile resumes */}
          {resumes.length > 0 ? (
            <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
              {resumes.map((r) => {
                const isSelected = !applyResumeFile && String(selectedResumeId) === String(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      setApplyResumeFile(null);
                      setSelectedResumeId(r.id);
                      setResumeFileName(r.fileName);
                    }}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: isSelected ? "#eff6ff" : "#f8fafc",
                      border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: isSelected ? "6px solid #2563eb" : "2px solid #94a3b8",
                        background: "#ffffff",
                        flexShrink: 0
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 13.5, color: isSelected ? "#1e40af" : "var(--text-primary)" }}>
                            {r.fileName}
                          </strong>
                          {r.isDefault && (
                            <span style={{ fontSize: 11, background: "#dbeafe", color: "#1d4ed8", padding: "2px 7px", borderRadius: 9999, fontWeight: 700 }}>
                              {lang === "VN" || lang === "VI" ? "Mặc định" : "Default"}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>
                          {r.size ? `${(r.size / 1024).toFixed(0)} KB` : t(lang, "Saved résumé")}
                          {r.uploadedAt ? ` · ${new Date(r.uploadedAt).toLocaleDateString()}` : ""}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#16a34a" }}>
                        <Icon name="check" size={14} />
                        {lang === "VN" || lang === "VI" ? "Đang chọn" : "Selected"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !applyResumeFile ? (
            <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 10, padding: "20px", textAlign: "center", marginBottom: 14 }}>
              <Icon name="file-question" size={28} style={{ color: "#94a3b8", marginBottom: 6 }} />
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-secondary)" }}>
                {lang === "VN" || lang === "VI" ? "Chưa có CV trong hồ sơ." : "No saved résumé found on your profile."}
              </p>
            </div>
          ) : null}

          {/* Upload different resume for this job */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <label
                htmlFor="oneclick-resume-upload"
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f8fafc",
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#334155",
                  border: "1px solid #cbd5e1"
                }}
              >
                <Icon name="upload" size={14} />
                {lang === "VN" || lang === "VI" ? "Tải lên CV khác cho công việc này" : "Upload different résumé for this job"}
              </label>
              <input
                type="file"
                id="oneclick-resume-upload"
                accept={UPLOAD_CONFIG.RESUME.accept}
                onChange={handleResumeFileChange}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>
                PDF, DOC, DOCX ({lang === "VN" || lang === "VI" ? "Tối đa 5MB" : "Max 5MB"})
              </span>
            </div>

            {applyResumeFile && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ display: "block", fontSize: 13, color: "#166534" }}>
                    <Icon name="check" size={13} style={{ marginRight: 6, display: "inline" }} />
                    {applyResumeFile.name} ({(applyResumeFile.size / 1024).toFixed(0)} KB)
                  </strong>
                  <span style={{ fontSize: 11.5, color: "#15803d" }}>
                    {lang === "VN" || lang === "VI" ? "Sẽ được đính kèm vào hồ sơ ứng tuyển này" : "Will be attached to this application"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setApplyResumeFile(null);
                    const def = resumes.find((r) => r.isDefault) || resumes[0];
                    if (def) {
                      setSelectedResumeId(def.id);
                      setResumeFileName(def.fileName);
                    }
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 12, fontWeight: 600 }}
                >
                  {lang === "VN" || lang === "VI" ? "Hủy" : "Cancel"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: Cover Letter */}
        <section style={{
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="message-square" size={16} style={{ color: "var(--surface-brand, #2563eb)" }} />
              {lang === "VN" || lang === "VI" ? "Thư giới thiệu / Lời nhắn tới nhà tuyển dụng" : "Cover Letter / Note to Employer"}
            </label>
            <span style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 8px", borderRadius: 99, color: "#64748b", fontWeight: 600 }}>
              {t(lang, "Optional")}
            </span>
          </div>
          <textarea
            className="lv-textarea"
            rows={4}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder={lang === "VN" || lang === "VI"
              ? "Giới thiệu ngắn gọn lý do bạn phù hợp với vị trí này hoặc thời gian bạn có thể bắt đầu làm việc..."
              : "Introduce yourself briefly or add any key information for the hiring team..."}
          />
        </section>

        {/* SECTION 4: Checkbox Only (PDPD Consent) */}
        <section style={{
          background: "var(--card-bg, #ffffff)",
          border: consent ? "1px solid #86efac" : "1px solid var(--border-color, #e2e8f0)",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <Check
              label={
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {lang === "VN" || lang === "VI"
                    ? `Tôi đồng ý để LàmViệc360 chia sẻ hồ sơ ứng viên của tôi với ${job.company} cho mục đích tuyển dụng theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.`
                    : `I consent to LamViec360 sharing my candidate profile with ${job.company} for recruitment purposes in accordance with Decree 13/2023/ND-CP on Personal Data Protection.`}
                  <span style={{ color: "#dc2626", marginLeft: 4 }}>*</span>
                </span>
              }
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
          </div>

          {/* Validation Error Alert */}
          {err && (
            <div ref={errorRef} style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 10,
              color: "#991b1b",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <Icon name="alert-circle" size={18} style={{ color: "#dc2626", flexShrink: 0 }} />
              <span>{err}</span>
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <Link href={`/job-detail/${job.id}`}>
              <Button type="button" variant="secondary" disabled={submitting}>
                {t(lang, "Cancel")}
              </Button>
            </Link>

            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={submitting}
              onClick={submitApplication}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
              }}
            >
              {submitting ? (
                <>
                  <Icon name="loader" size={16} className="spin" />
                  {lang === "VN" || lang === "VI" ? "Đang gửi..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Icon name="zap" size={16} style={{ color: "#fef08a" }} />
                  {lang === "VN" || lang === "VI" ? "Gửi đơn ứng tuyển" : "Submit Application"}
                </>
              )}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
