"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Button } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import Skeleton from "../../../../components/ds/Skeleton";
import StageBadge from "../../../../components/seeker/StageBadge";
import Toast, { useToast } from "../../../../components/ds/Toast";
import { useLang, t } from "../../../../utils/lang";
import { formatDate, formatDateTime, cleanResumeFileName } from "../../../../utils/format";

import { getApplication, STAGE_TYPICAL, withdrawApplication, getCanonicalStage } from "../../../../lib/seekerStore";
import { fetchApplicationDetail } from "../../../../lib/api/seekerApi";
import { fetchPublicJobDetail } from "../../../../lib/api/publicApi";

export default function ApplicationDetailClient({ id }) {
  const [lang] = useLang();
  const [app, setApp] = useState(undefined);
  const [toast, setToast] = useToast();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [jobDetail, setJobDetail] = useState(null);

  useEffect(() => {
    const local = getApplication(id);
    if (local) {
      const cleanName = cleanResumeFileName(local.resumeFileName || local.resume_file_name || local.resume_name || local.resume_url);
      setApp({ ...local, resumeFileName: cleanName, resumeName: cleanName });
    }
    // Also sync from backend if numeric ID
    if (!String(id).startsWith("APP-")) {
      fetchApplicationDetail(id)
        .then((remote) => {
          if (remote) {
            const cleanName = cleanResumeFileName(remote.resumeFileName || remote.resume_file_name || remote.resume_name || remote.resume_url);
            setApp((prev) => {
              const mergedAnswers =
                (remote.answers && typeof remote.answers === "object" && Object.keys(remote.answers).length > 0)
                  ? remote.answers
                  : (prev?.answers || local?.answers || null);
              const mergedQuestions =
                (Array.isArray(remote.questions) && remote.questions.length > 0)
                  ? remote.questions
                  : (Array.isArray(remote.job?.questions) && remote.job.questions.length > 0
                    ? remote.job.questions
                    : (prev?.questions || local?.questions || []));

              return {
                ...(prev || {}),
                ...remote,
                id: remote.id,
                answers: mergedAnswers,
                questions: mergedQuestions,
                resumeFileName: cleanName,
                resumeName: cleanName,
                stage: getCanonicalStage(remote.status || remote.stage),
                status: remote.status,
                appliedDate: remote.applied_at || remote.created_at,
                applied_at: remote.applied_at || remote.created_at,
                timeline: (prev && prev.timeline && prev.timeline.length) ? prev.timeline : [
                  { stage: "Applied", date: remote.applied_at || remote.created_at },
                  ...(remote.status === "withdrawn" ? [{ stage: "Withdrawn", date: remote.updated_at }] : [])
                ]
              };
            });
          }
        })
        .catch(() => {
          if (!local) setApp(null);
        });
    } else if (!local) {
      setApp(null);
    }
  }, [id]);

  useEffect(() => {
    const targetJobId = app?.job?.id || app?.jobId || app?.job_id;
    const hasQuestions = (Array.isArray(app?.questions) && app.questions.length > 0) ||
      (Array.isArray(app?.job?.questions) && app.job.questions.length > 0);

    if (targetJobId && !hasQuestions) {
      fetchPublicJobDetail(targetJobId)
        .then((j) => {
          if (j && j.questions && j.questions.length > 0) {
            setJobDetail(j);
          }
        })
        .catch(() => {});
    }
  }, [app?.job?.id, app?.jobId, app?.job_id, app?.questions, app?.job?.questions]);

  const { questionList, questionMap } = useMemo(() => {
    const map = {};
    const rawList = app?.questions || app?.job?.questions || jobDetail?.questions;
    let qList = [];
    if (Array.isArray(rawList)) {
      qList = rawList;
    } else if (typeof rawList === "string" && rawList.trim()) {
      try {
        const parsed = JSON.parse(rawList);
        if (Array.isArray(parsed)) qList = parsed;
      } catch {}
    }
    for (let i = 0; i < qList.length; i++) {
      const item = qList[i];
      if (item) {
        const qText = item.question || item.text || item.label || item.title || "";
        if (item.id) {
          map[item.id] = qText;
        }
        map[`q_${i}`] = qText;
        map[String(i)] = qText;
      }
    }
    return { questionList: qList, questionMap: map };
  }, [app?.questions, app?.job?.questions, jobDetail?.questions]);

  const answers = useMemo(() => {
    if (!app?.answers) return null;
    if (typeof app.answers === "object") {
      return Object.keys(app.answers).length ? app.answers : null;
    }
    if (typeof app.answers === "string" && app.answers.trim()) {
      try {
        const parsed = JSON.parse(app.answers);
        return parsed && typeof parsed === "object" && Object.keys(parsed).length ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }, [app?.answers]);

  if (app === undefined) {
    return (
      <div className="lv-page-container">
        <Skeleton width={140} height={16} style={{ marginBottom: 20 }} />
        <Skeleton height={90} style={{ marginBottom: 16 }} />
        <Skeleton height={280} />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="lv-page-container">
        <div className="lv-empty">
          <h3>{t(lang, "Application not found")}</h3>
          <div style={{ marginTop: 16 }}>
            <Link href="/applications">
              <Button variant="secondary">{t(lang, "Back to Application Tracker")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const job = app.job || {
    title: app.jobTitle || "Job Position",
    titleVi: app.jobTitle || "Vị trí tuyển dụng",
    company: app.company || "Company",
  };
  const companyName = job.company_name || job.company?.company_name || job.company || "Company";
  const isVi = lang === "VN" || lang === "VI";
  const title = job ? (isVi ? job.titleVi || job.title : job.title) : "";
  const rawStage = app.stage || app.status || "Applied";
  const currentStage = getCanonicalStage(rawStage);
  const HAPPY_PATH = currentStage === "Post-Hire Tracking"
    ? ["Applied", "Screening", "Phone Screening", "Shortlisted", "Interview Scheduled", "Offer Sent", "Hired", "Post-Hire Tracking"]
    : ["Applied", "Screening", "Phone Screening", "Shortlisted", "Interview Scheduled", "Offer Sent", "Hired"];
  const isRejected = currentStage === "Rejected";
  const isWithdrawn = currentStage === "Withdrawn";
  const currentIndex = HAPPY_PATH.indexOf(currentStage);
  const reachedDate = (stage) => {
    const entry = (app.timeline || []).find((tl) => getCanonicalStage(tl.stage) === stage || tl.stage === stage);
    if (entry && entry.date) return entry.date;
    if (stage === "Applied") return app.appliedDate || app.applied_at || app.created_at;
    if (stage === currentStage) return app.updated_at || app.status_updated_at;
    return undefined;
  };
  const isClosed = app.closed !== undefined
    ? app.closed
    : (
        currentStage === "Rejected" ||
        currentStage === "Hired" ||
        currentStage === "Post-Hire Tracking" ||
        currentStage === "Withdrawn" ||
        app.status === "closed"
      );

  // BR-301-04: Talent can withdraw application before screening stage only (status == "applied")
  const canWithdraw = currentStage === "Applied";

  const handleConfirmWithdraw = async () => {
    setWithdrawing(true);
    try {
      const updated = await withdrawApplication(app.id);
      const nowIso = new Date().toISOString();
      setApp((prev) => ({
        ...prev,
        ...(updated || {}),
        stage: "Withdrawn",
        status: "withdrawn",
        closed: true,
        timeline: [
          ...((prev && prev.timeline) || []),
          { stage: "Withdrawn", date: nowIso }
        ]
      }));
      setToast(t(lang, "Application withdrawn"));
      setIsWithdrawModalOpen(false);
    } catch (err) {
      setToast(err.message || t(lang, "Could not withdraw application"));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="lv-page-container">
      <Link href="/applications" className="lv-job-view" style={{ marginBottom: 20, display: "inline-flex" }}>
        <Icon name="arrow-left" size={14} /> {t(lang, "Application Tracker")}
      </Link>

      <div className="lv-tracker-detail-head">
        <div className="lv-job-logo" style={{ width: 56, height: 56 }}>
          {job ? companyName.slice(0, 2).toUpperCase() : "—"}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: "var(--text-xl)", marginBottom: 4 }}>{title}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
            {job ? companyName : ""} · {t(lang, "Applied")} {formatDateTime(lang, app.appliedDate || app.applied_at)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <StageBadge stage={currentStage} lang={lang} />
          {isClosed && !isRejected && !isWithdrawn && currentStage !== "Hired" && currentStage !== "Post-Hire Tracking" && <Badge tone="neutral">{t(lang, "Position Closed")}</Badge>}
          {canWithdraw && (
            <Button
              variant="secondary"
              size="sm"
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
        </div>
      </div>

      {!canWithdraw && !isWithdrawn && !isClosed && (
        <div style={{
          margin: "12px 0 20px",
          padding: "10px 14px",
          background: "var(--surface-sunken, #f8fafc)",
          borderRadius: "8px",
          fontSize: "var(--text-xs)",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid var(--border-subtle, #e2e8f0)"
        }}>
          <Icon name="info" size={14} style={{ color: "var(--color-brand, #2563eb)" }} />
          <span>{lang === "VN" || lang === "VI" ? "Hồ sơ đang trong quy trình xét duyệt của nhà tuyển dụng. Chỉ có thể rút hồ sơ khi ở trạng thái 'Đã nộp'." : "This application is currently being screened by the employer. Applications can only be withdrawn while in 'Applied' status."}</span>
        </div>
      )}

      {job && (
        <div className="lv-detail-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div className="lv-job-meta" style={{ marginBottom: 0 }}>
              <span><Icon name="map-pin" size={14} /> {isVi ? job.locationVi || job.location || job.city : job.location || job.city || "Unknown Location"}</span>
              <span><Icon name="wallet" size={14} /> {job.salary_min && job.salary_max ? `${Math.round(job.salary_min / 1000000)}M – ${Math.round(job.salary_max / 1000000)}M VND` : job.salary || "Negotiable"}</span>
              <span><Icon name="briefcase" size={14} /> {isVi ? job.modeVi || job.workplace_type || job.job_type || job.mode : job.workplace_type || job.job_type || job.mode || "Unknown Type"}</span>
            </div>
            <Link href={`/job-detail/${encodeURIComponent((job.title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + job.id)}`}>
              <Button variant="secondary" size="sm">{t(lang, "View job")}</Button>
            </Link>
          </div>
        </div>
      )}

      {app.interview && (
        <div className="lv-detail-card hidden" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: "var(--text-md)", margin: "0 0 4px" }}>{t(lang, "Interview")}</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", margin: 0 }}>
                {app.interview.round} · {formatDateTime(lang, app.interview.at)}
              </p>
            </div>
            <Link href={`/interviews/${app.id}`}>
              <Button variant="primary" size="sm">
                {app.interview.status === "invited" ? t(lang, "Respond to invitation") : t(lang, "View interview details")}
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="lv-timeline">
        {isRejected || isWithdrawn
          ? (app.timeline && app.timeline.length ? app.timeline : [
            { stage: "Applied", date: app.appliedDate || app.applied_at },
            { stage: isWithdrawn ? "Withdrawn" : "Rejected", date: app.updated_at || new Date().toISOString() }
          ]).map((tl) => (
            <div key={tl.stage} className={`lv-timeline-item done ${tl.stage === "Rejected" || tl.stage === "Withdrawn" ? "rejected" : ""}`}>
              <span className="lv-timeline-dot">
                <Icon name={tl.stage === "Rejected" ? "x" : tl.stage === "Withdrawn" ? "undo-2" : "check"} size={12} />
              </span>
              <div className="lv-timeline-body">
                <strong>{t(lang, tl.stage)}</strong>
                <span>{formatDateTime(lang, tl.date)}</span>
              </div>
            </div>
          ))
          : HAPPY_PATH.map((stage, i) => {
            const reached = i <= currentIndex;
            const isNext = i === currentIndex + 1;
            return (
              <div key={stage} className={`lv-timeline-item ${reached ? "done" : ""} ${i === currentIndex ? "current" : ""}`}>
                <span className="lv-timeline-dot">{reached ? <Icon name="check" size={12} /> : i + 1}</span>
                <div className="lv-timeline-body">
                  <strong>{t(lang, stage)}</strong>
                  {reached ? <span>{formatDateTime(lang, reachedDate(stage))}</span> : isNext && STAGE_TYPICAL[stage] ? <span className="lv-timeline-typical">{t(lang, STAGE_TYPICAL[stage])}</span> : <span>{t(lang, "Pending")}</span>}
                </div>
              </div>
            );
          })}
      </div>

      {(app.resumeFileName || app.resumeName || app.resume_name || app.resume_file_name || app.resume_url || app.resumeUrl || app.coverLetter || answers) && (
        <div className="lv-detail-card" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontSize: "var(--text-md)", margin: 0 }}>{t(lang, "What you submitted")}</h2>
            {(app.appliedDate || app.applied_at) && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="clock" size={13} /> {t(lang, "Applied")} {formatDateTime(lang, app.appliedDate || app.applied_at)}
              </span>
            )}
          </div>
          {(app.resumeFileName || app.resumeName || app.resume_name || app.resume_file_name || app.resume_url || app.resumeUrl) && (() => {
            const rawName = app.resumeFileName || app.resumeName || app.resume_file_name || app.resume_name || app.resume_url || app.resumeUrl;
            const displayResumeName = cleanResumeFileName(rawName);
            const downloadUrl = app.resume_url || app.resumeUrl || "#";
            return (
              <a
                href={downloadUrl}
                download={displayResumeName}
                style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--surface-brand)", fontSize: "var(--text-sm)", textDecoration: "none" }}
              >
                <Icon name="file-text" size={15} /> {displayResumeName}
              </a>
            );
          })()}
          {app.coverLetter && (
            <>
              <strong style={{ display: "block", margin: "12px 0 4px", fontSize: "var(--text-sm)" }}>{t(lang, "Cover letter")}</strong>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>{app.coverLetter}</p>
            </>
          )}
          {answers && Object.keys(answers).length > 0 && (
            <div style={{ marginTop: 20, borderTop: "1px solid var(--border-line, #e2e8f0)", paddingTop: 16 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <Icon name="help-circle" size={16} style={{ color: "var(--surface-brand, #2563eb)" }} />
                {lang === "VN" || lang === "VI" ? "Câu hỏi sàng lọc & Câu trả lời của bạn" : "Screening Questions & Your Answers"}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(answers).map(([qKey, ans], idx) => {
                  let resolvedQuestion =
                    (typeof ans === "object" && ans?.question ? ans.question : null) ||
                    questionMap[qKey] ||
                    questionMap[`q_${idx}`] ||
                    questionMap[String(idx)] ||
                    (questionList[idx] ? (questionList[idx].question || questionList[idx].text || questionList[idx].label || questionList[idx].title) : null);

                  if (!resolvedQuestion || resolvedQuestion.startsWith("q_")) {
                    resolvedQuestion = `${lang === "VN" || lang === "VI" ? "Câu hỏi" : "Question"} ${idx + 1}`;
                  }

                  const displayAnswer =
                    typeof ans === "object" && ans !== null
                      ? (ans.answer !== undefined ? String(ans.answer) : JSON.stringify(ans))
                      : String(ans);

                  return (
                    <div
                      key={qKey}
                      style={{
                        background: "var(--surface-sunken, #f8fafc)",
                        border: "1px solid var(--border-line, #e2e8f0)",
                        borderRadius: 10,
                        padding: "12px 16px",
                      }}
                    >
                      <span style={{ display: "block", marginBottom: 6, fontSize: "var(--text-sm)", color: "var(--text-primary)", fontWeight: 600 }}>
                        {idx + 1}. {resolvedQuestion}
                      </span>
                      <div style={{
                        display: "inline-block",
                        background: "var(--surface-card, #ffffff)",
                        border: "1px solid var(--border-line, #e2e8f0)",
                        borderRadius: 6,
                        padding: "5px 12px",
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        color: "var(--text-primary, #0f172a)",
                      }}>
                        {displayAnswer}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Withdrawal */}
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
                ? `Bạn đang rút hồ sơ cho vị trí "${title}" tại ${companyName}. Nhà tuyển dụng sẽ không tiếp tục xét duyệt hồ sơ này.`
                : `You are withdrawing your application for "${title}" at ${companyName}. The employer will no longer consider this application.`}
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
                onClick={handleConfirmWithdraw}
                style={{
                  background: "#ef4444",
                  borderColor: "#ef4444",
                  color: "#ffffff",
                }}
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

      <Toast msg={toast} />
    </div>
  );
}

