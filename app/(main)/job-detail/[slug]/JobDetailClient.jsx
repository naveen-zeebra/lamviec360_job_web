"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button, Badge } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import { useLang, t } from "../../../../utils/lang";
import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/layout/Footer";
import JobRow from "../../../../components/jobs/JobRow";
import Toast, { useToast } from "../../../../components/ds/Toast";
import { FILTER_VI } from "../../../../lib/data";
import { isSaved, toggleSavedJob, hasAppliedToJob, isLoggedIn, getAuth, getProfile, computeCompleteness } from "../../../../lib/seekerStore";
import { fetchPublicJobDetail, fetchPublicJobs, reportJob } from "../../../../lib/api/publicApi";

const STAGES = [
  ["Applied", "Đã nộp"],
  ["Under Review", "Đang xét duyệt"],
  ["Shortlisted", "Danh sách rút gọn"],
  ["Interview", "Phỏng vấn"],
  ["Offer", "Đề nghị"],
  ["Hired", "Được tuyển"],
];

const REPORT_REASONS = [
  { id: "Scam or Fraud", vi: "Lừa đảo hoặc gian lận", en: "Scam or Fraud" },
  { id: "Inaccurate Salary", vi: "Mức lương không đúng thực tế", en: "Inaccurate Salary" },
  { id: "Discriminatory Content", vi: "Nội dung phân biệt đối xử", en: "Discriminatory Content" },
  { id: "Expired or Inactive", vi: "Tin tuyển dụng đã hết hạn", en: "Expired or Inactive" },
  { id: "Incorrect Job Information", vi: "Thông tin sai lệch hoặc gây hiểu nhầm", en: "Misleading Information" },
  { id: "Other", vi: "Lý do vi phạm khác", en: "Other violation" },
];


function formatDetailExperience(job, lang) {
  const exp = job.experience || job.experience_level;
  if (exp === undefined || exp === null || exp === "") {
    return job.level ? (lang === "VN" || lang === "VI" ? job.levelVi || job.level : job.level) : (lang === "VN" || lang === "VI" ? "Không yêu cầu" : "Not specified");
  }
  const s = String(exp).trim().toLowerCase();
  if (s === "0" || s === "fresher") return lang === "VN" || lang === "VI" ? "Fresher (Không yêu cầu kinh nghiệm)" : "Fresher (No experience)";
  if (s === "0-1") return lang === "VN" || lang === "VI" ? "0 - 1 Năm kinh nghiệm" : "0 - 1 Year experience";
  if (s === "1-3") return lang === "VN" || lang === "VI" ? "1 - 3 Năm kinh nghiệm" : "1 - 3 Years experience";
  if (s === "3-5") return lang === "VN" || lang === "VI" ? "3 - 5 Năm kinh nghiệm" : "3 - 5 Years experience";
  if (s === "5-10") return lang === "VN" || lang === "VI" ? "5 - 10 Năm kinh nghiệm" : "5 - 10 Years experience";
  if (s === "10+") return lang === "VN" || lang === "VI" ? "Trên 10 Năm kinh nghiệm" : "10+ Years experience";
  if (/^\d+$/.test(s)) return s + " " + (lang === "VN" || lang === "VI" ? "năm kinh nghiệm" : "years experience");
  return lang === "VN" || lang === "VI" ? job.levelVi || job.level : job.level;
}

export default function JobDetailClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toast, setToast] = useToast();
  const params = useParams();

  // Report modal state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Scam or Fraud");
  const [reportDetails, setReportDetails] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Extract ID from slug, assuming format is `title-id`
  const slug = params.slug || "";
  const parts = slug.split("-");
  const rawId = parts[parts.length - 1];

  const [job, setJob] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    async function loadJobDetail() {
      if (rawId) {
        try {
          const remote = await fetchPublicJobDetail(rawId);
          if (remote) {
            setJob(remote);
          }
        } catch (e) {
          console.warn("Could not fetch remote job detail:", e.message);
        }

        try {
          const allJobs = await fetchPublicJobs();
          if (Array.isArray(allJobs)) {
            setRelated(allJobs.filter((j) => String(j.id) !== String(rawId)).slice(0, 3));
          }
        } catch (e) {
          // ignore
        }
      }
    }
    loadJobDetail();
  }, [rawId]);

  useEffect(() => {
    if (job?.id) {
      setSaved(isSaved(job.id));
      setApplied(hasAppliedToJob(job.id));
    }
    const handleStoreChange = () => {
      if (job?.id) {
        setSaved(isSaved(job.id));
        setApplied(hasAppliedToJob(job.id));
      }
    };
    window.addEventListener("lv360-store", handleStoreChange);
    return () => window.removeEventListener("lv360-store", handleStoreChange);
  }, [job?.id]);

  const handleOpenReportModal = () => {
    const auth = getAuth();
    const prof = getProfile();
    setReporterName(prof?.personal?.fullName || auth?.name || "");
    setReporterEmail(auth?.email || "");
    setReportSubmitted(false);
    setIsReportOpen(true);
  };

  const handleReportSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!job?.id) return;
    setIsSubmittingReport(true);
    try {
      await reportJob(job.id, {
        reason: reportReason,
        details: reportDetails,
        reporter_name: reporterName.trim() || undefined,
        reporter_email: reporterEmail.trim() || undefined,
      });
      setReportSubmitted(true);
      setToast(
        lang === "VN" || lang === "VI"
          ? "Đã gửi báo cáo kiểm duyệt thành công."
          : "Report submitted successfully for admin review."
      );
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSubmitted(false);
        setReportDetails("");
      }, 1600);
    } catch (err) {
      setToast(
        lang === "VN" || lang === "VI"
          ? "Không thể gửi báo cáo. Vui lòng thử lại."
          : "Failed to submit report. Please try again."
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Social Sharing Links (EMP-FR-014)
  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator?.clipboard && url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setToast(lang === "VN" || lang === "VI" ? "Đã sao chép liên kết vào bộ nhớ tạm!" : "Job link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareLinkedIn = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
  };

  const handleShareFacebook = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
  };

  const resp =
    lang === "VI" || lang === "VN"
      ? [
        "Tham gia thiết kế, xây dựng và bảo trì các tính năng của sản phẩm.",
        "Hợp tác với thiết kế, sản phẩm và các kỹ sư khác trong nhóm.",
        "Xem xét mã nguồn và góp phần nâng cao chất lượng kỹ thuật.",
        "Theo dõi và cải thiện hiệu năng, độ tin cậy của hệ thống.",
      ]
      : [
        "Help design, build and maintain product features.",
        "Work closely with design, product and other engineers on the team.",
        "Review code and contribute to overall technical quality.",
        "Monitor and improve system performance and reliability.",
      ];

  const reqs =
    lang === "VI" || lang === "VN"
      ? [
        "Kinh nghiệm thực tế phù hợp với cấp bậc của vị trí.",
        "Thành thạo các kỹ năng chính được liệt kê cho vai trò này.",
        "Khả năng giao tiếp rõ ràng bằng tiếng Việt; tiếng Anh là một lợi thế.",
        "Tinh thần hợp tác và chủ động trong công việc nhóm.",
      ]
      : [
        "Relevant hands-on experience for the level of the role.",
        "Working proficiency in the core skills listed for this role.",
        "Clear communication in Vietnamese; English is an advantage.",
        "A collaborative, self-directed approach to teamwork.",
      ];

  const bens =
    lang === "VI" || lang === "VN"
      ? [
        "Bảo hiểm theo quy định pháp luật",
        "Thưởng theo hiệu quả công việc",
        "Ngân sách học tập và phát triển",
        "Chính sách làm việc linh hoạt",
      ]
      : [
        "Statutory insurance coverage",
        "Performance-based bonus",
        "Learning and development budget",
        "Flexible working arrangements",
      ];

  if (!job) {
    return (
      <>
        <Header lang={lang} setLang={setLang} app="seeker" />
        <main style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <p>{t(lang, "Loading...")}</p>
        </main>
        <Footer lang={lang} setLang={setLang} app="seeker" />
      </>
    );
  }

  const companyName =
    typeof job.company === "string" ? job.company : job.company_name || "Company";
  const logoText = companyName.slice(0, 2).toUpperCase();
  const logoUrl =
    !imgFailed && (job.company_logo || job.logo || (job.companyObj && job.companyObj.logo_url))
      ? job.company_logo || job.logo || job.companyObj.logo_url
      : null;

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main>
        {/* Page Head */}
        <section className="lv-page-head">
          <div className="lv-page-head-inner">
            <div className="lv-crumbs">
              <Link href="/">{t(lang, "Home")}</Link>
              <Icon name="chevron-right" size={14} />
              <Link href="/jobs">{t(lang, "Find Jobs")}</Link>
              <Icon name="chevron-right" size={14} />
              <span>{lang === "VN" || lang === "VI" ? job.titleVi || job.title : job.title}</span>
            </div>

            <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start", flexWrap: "wrap" }}>
              {/* Company Logo / Initials */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  border: "1px solid var(--border-default, #e2e8f0)",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  padding: 4,
                  flexShrink: 0,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
                aria-hidden="true"
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={companyName}
                    style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }}
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--brand-600, #2563eb)" }}>
                    {logoText}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
                  <h1 style={{ fontSize: "var(--text-3xl)", margin: 0 }}>
                    {lang === "VN" || lang === "VI" ? job.titleVi || job.title : job.title}
                  </h1>

                </div>

                <div className="lv-job-company" style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                  {companyName}
                  {job.verified && (
                    <Badge tone="brand">
                      <Icon name="shield-check" size={11} /> {t(lang, "Verified Company")}
                    </Badge>
                  )}
                </div>

                <div className="lv-job-meta" style={{ marginBottom: 0, flexWrap: "wrap", gap: "12px 18px" }}>
                  <span>
                    <Icon name="map-pin" size={15} />
                    {lang === "VN" || lang === "VI" ? job.locationVi || job.location : job.location}
                  </span>
                  <span>
                    <Icon name="wallet" size={15} />
                    <strong style={{ color: "#059669" }}>{job.salary}</strong>
                  </span>
                  <span>
                    <Icon name="briefcase" size={15} />
                    {lang === "VN" || lang === "VI" ? FILTER_VI[job.type] || job.type : job.type} ·{" "}
                    {lang === "VN" || lang === "VI" ? job.modeVi || job.mode : job.mode}
                  </span>
                  {job.vacancies > 1 && (
                    <span>
                      <Icon name="users" size={15} />
                      {job.vacancies} {lang === "VN" || lang === "VI" ? "chỉ tiêu" : "openings"}
                    </span>
                  )}
                  <span>
                    <Icon name="clock" size={15} />
                    {lang === "VN" || lang === "VI" ? job.postedVi || job.posted : job.posted}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closed / Expired Alert */}
        {job.isNoLongerAvailable && (
          <div
            style={{
              maxWidth: "var(--container-max, 1200px)",
              margin: "20px auto 0",
              padding: "16px 20px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              color: "#991b1b",
            }}
          >
            <Icon name="alert-triangle" size={22} style={{ flexShrink: 0, color: "#dc2626" }} />
            <div>
              <strong style={{ display: "block", fontSize: "14px", fontWeight: 700 }}>
                {lang === "VN" || lang === "VI"
                  ? "Vị trí tuyển dụng đã hết hạn hoặc đã đóng"
                  : "Job posting has expired or is no longer active"}
              </strong>
              <span style={{ fontSize: "13px", color: "#b91c1c" }}>
                {lang === "VN" || lang === "VI"
                  ? "Vị trí này không còn nhận hồ sơ ứng tuyển mới. Vui lòng tham khảo các việc làm tương tự đang mở bên dưới."
                  : "This role is no longer accepting new candidate applications. Please check similar active roles below."}
              </span>
            </div>
          </div>
        )}

        <div className="lv-detail-layout">
          <div>
            <div className="lv-detail-card">
              <h2>{t(lang, "About the role")}</h2>
              {job.description ? (
                <div
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "var(--leading-relaxed)",
                    fontSize: "var(--text-base)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {job.description}
                </div>
              ) : (
                <p>
                  {t(
                    lang,
                    "${job.company} is looking for a ${job.title} in ${job.location}. This is a ${job.type.toLowerCase()} role working ${job.mode.toLowerCase()}, suited to ${job.level.toLowerCase()} candidates."
                  )
                    .replace("${job.company}", companyName)
                    .replace("${job.title}", job.title)
                    .replace("${job.location}", job.location)
                    .replace("${job.type.toLowerCase()}", (job.type || "").toLowerCase())
                    .replace("${job.mode.toLowerCase()}", (job.mode || "").toLowerCase())
                    .replace("${job.level.toLowerCase()}", (job.level || "").toLowerCase())}
                </p>
              )}

              <h2>{t(lang, "Responsibilities")}</h2>
              <ul>
                {resp.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>

              <h2>{t(lang, "Requirements")}</h2>
              <ul>
                {reqs.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>

              <h2>{t(lang, "Required Skills")}</h2>
              <div className="lv-job-tags" style={{ marginBottom: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(job.skills || []).map((s) => (
                  <Badge key={s} tone="neutral">
                    {s}
                  </Badge>
                ))}
              </div>

              <h2>{t(lang, "Benefits")}</h2>
              <ul>
                {bens.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>

              <h2>{t(lang, "Hiring process")}</h2>
              <div className="lv-journey" style={{ marginTop: "var(--space-5)", maxWidth: "100%" }}>
                {STAGES.slice(0, 4).map((s, i) => (
                  <span key={s[0]} style={{ display: "contents" }}>
                    <div className="lv-journey-step">
                      <div className="lv-journey-dot">{`0${i + 1}`}</div>
                      <span>{lang === "VN" || lang === "VI" ? s[1] : s[0]}</span>
                    </div>
                    {i < 3 && <div className="lv-journey-bar"></div>}
                  </span>
                ))}
              </div>
            </div>

            {related.length > 0 && (
              <section style={{ marginTop: "var(--space-10)" }}>
                <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-5)" }}>
                  {t(lang, "Similar jobs")}
                </h2>
                <div className="lv-job-list">
                  {related.map((j) => (
                    <JobRow key={j.id} job={j} lang={lang} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar Facts & Application Card */}
          <aside className="lv-apply-card">
            <strong style={{ fontSize: "var(--text-md)" }}>{t(lang, "Apply for this role")}</strong>

            <div className="lv-apply-row">
              <span>{t(lang, "Salary")}</span>
              <strong>{job.salary}</strong>
            </div>

            {job.salary_type && (
              <div className="lv-apply-row">
                <span>{t(lang, "Salary structure")}</span>
                <span
                  style={{
                    textTransform: "capitalize",
                    fontWeight: 700,
                    color: "#1d4ed8",
                    backgroundColor: "#eff6ff",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {job.salary_type}
                </span>
              </div>
            )}

            <div className="lv-apply-row">
              <span>{t(lang, "Vacancies")}</span>
              <strong>
                {job.vacancies || 1} {lang === "VN" || lang === "VI" ? "chỉ tiêu" : "positions"}
              </strong>
            </div>

            <div className="lv-apply-row">
              <span>{t(lang, "Experience")}</span>
              <strong>{formatDetailExperience(job, lang)}</strong>
            </div>

            {job.education && (
              <div className="lv-apply-row">
                <span>{t(lang, "Education")}</span>
                <strong>{job.education}</strong>
              </div>
            )}

            <div className="lv-apply-row">
              <span>{t(lang, "Type")}</span>
              <strong>{lang === "VN" || lang === "VI" ? FILTER_VI[job.type] || job.type : job.type}</strong>
            </div>

            <div className="lv-apply-row">
              <span>{t(lang, "Work mode")}</span>
              <strong>{lang === "VN" || lang === "VI" ? job.modeVi || job.mode : job.mode}</strong>
            </div>

            <div className="lv-apply-row">
              <span>{t(lang, "Location")}</span>
              <strong>{lang === "VN" || lang === "VI" ? job.locationVi || job.location : job.location}</strong>
            </div>

            <div className="lv-apply-row">
              <span>{t(lang, "Deadline")}</span>
              <strong style={{ color: job.isExpired ? "#dc2626" : undefined }}>
                {job.deadline
                  ? new Date(job.deadline).toLocaleDateString(lang === "VN" || lang === "VI" ? "vi-VN" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                  : lang === "VN" || lang === "VI"
                    ? "Mở đến khi đủ"
                    : "Until filled"}
              </strong>
            </div>

            {job.isNoLongerAvailable ? (
              <Button
                variant="secondary"
                size="lg"
                disabled
                style={{
                  width: "100%",
                  justifyContent: "center",
                  opacity: 0.7,
                  cursor: "not-allowed",
                  borderColor: "#fca5a5",
                  color: "#dc2626",
                  backgroundColor: "#fef2f2",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="slash" size={16} style={{ color: "#dc2626" }} />
                {lang === "VN" || lang === "VI" ? "Đã hết hạn / Đã đóng" : "No Longer Available"}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={applied}
                onClick={() => {
                  if (!isLoggedIn()) {
                    router.push("/login");
                    return;
                  }
                  const prof = getProfile();
                  const pct = computeCompleteness(prof);
                  if (pct < 60) {
                    setToast(
                      lang === "VN" || lang === "VI"
                        ? `Hồ sơ của bạn mới đạt ${pct}%. Cần ít nhất 60% độ hoàn thiện để ứng tuyển.`
                        : `Your profile completeness is ${pct}%. A minimum of 60% completeness is required to apply for jobs.`
                    );
                    setTimeout(() => router.push("/onboarding"), 1000);
                    return;
                  }
                  if (!applied) router.push(`/apply/${job.id}`);
                }}
              >
                {applied ? t(lang, "Applied") : t(lang, "Apply Now")}
              </Button>
            )}

            <Button
              variant="secondary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                if (!isLoggedIn()) {
                  router.push("/login");
                  return;
                }
                toggleSavedJob(job.id, job);
                const nowSaved = !saved;
                setSaved(nowSaved);
                setToast(nowSaved ? t(lang, "Job saved") : t(lang, "Removed from saved jobs"));
              }}
            >
              <Icon name="heart" size={16} style={{ fill: saved ? "currentColor" : "none" }} />{" "}
              {saved ? t(lang, "Saved") : t(lang, "Save Job")}
            </Button>

            {/* EMP-FR-014 Social Sharing Links */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 12,
                borderTop: "1px solid var(--border-default, #e2e8f0)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-tertiary, #64748b)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {lang === "VN" || lang === "VI" ? "Chia sẻ cơ hội này" : "Share this job"}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={handleShareLinkedIn}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0a66c2",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Share on LinkedIn"
                >
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.75 1.75-1.75a1.75 1.75 0 0 1 0 3.51m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                  </svg>
                  <span>LinkedIn</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareFacebook}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#1877f2",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Share on Facebook"
                >
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: copiedLink ? "#f0fdf4" : "#ffffff",
                    color: copiedLink ? "#15803d" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Copy link"
                >
                  <Icon name={copiedLink ? "check" : "copy"} size={13} />
                  <span>
                    {copiedLink
                      ? lang === "VN" || lang === "VI"
                        ? "Đã chép"
                        : "Copied"
                      : lang === "VN" || lang === "VI"
                        ? "Sao chép"
                        : "Copy"}
                  </span>
                </button>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: "var(--leading-relaxed)", margin: "4px 0 0" }}>
              {t(lang, "You need a LamViec360 profile to apply. Your details are shared only with your consent.")}
            </p>

            <Link href={`/jobs?company=${encodeURIComponent(companyName)}`} className="lv-job-view">
              {t(lang, "All jobs at this company ")}
              <Icon name="arrow-right" size={14} />
            </Link>

            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-color, #f1f5f9)" }}>
              <button
                type="button"
                onClick={handleOpenReportModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-tertiary, #64748b)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "100%",
                  padding: "6px 0",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary, #64748b)")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                {lang === "VN" || lang === "VI" ? "Báo cáo tin tuyển dụng vi phạm" : "Report this job posting"}
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Footer lang={lang} setLang={setLang} app="seeker" />
      <Toast msg={toast} />

      {/* Report Job Modal */}
      {isReportOpen && (
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
          onClick={() => !isSubmittingReport && setIsReportOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {reportSubmitted ? (
              <div style={{ textAlign: "center", padding: "24px 8px" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0", color: "#0f172a" }}>
                  {lang === "VN" || lang === "VI" ? "Báo cáo đã được gửi" : "Report Submitted"}
                </h3>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  {lang === "VN" || lang === "VI"
                    ? "Cảm ơn bạn đã phản hồi. Đội ngũ kiểm duyệt LàmViệc360 sẽ kiểm tra và xử lý theo quy định."
                    : "Thank you for your report. The LamViec360 moderation team has queued this post for review."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        background: "#fef2f2",
                        color: "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                        <line x1="4" y1="22" x2="4" y2="15"></line>
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                        {lang === "VN" || lang === "VI" ? "Báo cáo tin tuyển dụng" : "Report Job Listing"}
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                        {job.title} • {companyName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: 4,
                      borderRadius: 6,
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                    {lang === "VN" || lang === "VI" ? "Lý do báo cáo" : "Violation Reason"}
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {REPORT_REASONS.map((r) => (
                      <label
                        key={r.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: reportReason === r.id ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                          backgroundColor: reportReason === r.id ? "#eff6ff" : "#ffffff",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: reportReason === r.id ? 600 : 400,
                          color: reportReason === r.id ? "#1d4ed8" : "#334155",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={r.id}
                          checked={reportReason === r.id}
                          onChange={() => setReportReason(r.id)}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>{lang === "VN" || lang === "VI" ? r.vi : r.en}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    {lang === "VN" || lang === "VI" ? "Chi tiết bổ sung (tùy chọn)" : "Additional Details (Optional)"}
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder={
                      lang === "VN" || lang === "VI"
                        ? "Vui lòng mô tả chi tiết lý do bạn phát hiện tin tuyển dụng này có dấu hiệu sai lệch hoặc vi phạm..."
                        : "Please describe what makes this job posting inaccurate, abusive, or fraudulent..."
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontFamily: "inherit",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                      {lang === "VN" || lang === "VI" ? "Họ tên người báo cáo" : "Your Name"}
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Candidate"
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                      {lang === "VN" || lang === "VI" ? "Email liên hệ" : "Your Email"}
                    </label>
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="email@example.com"
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmittingReport}
                    onClick={() => setIsReportOpen(false)}
                  >
                    {lang === "VN" || lang === "VI" ? "Hủy bỏ" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmittingReport}
                    style={{ background: "#dc2626", borderColor: "#dc2626" }}
                  >
                    {isSubmittingReport
                      ? lang === "VN" || lang === "VI"
                        ? "Đang gửi..."
                        : "Submitting..."
                      : lang === "VN" || lang === "VI"
                        ? "Gửi báo cáo"
                        : "Submit Report"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
