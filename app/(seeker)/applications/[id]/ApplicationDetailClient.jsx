"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import Skeleton from "../../../../components/ds/Skeleton";
import StageBadge from "../../../../components/seeker/StageBadge";
import Toast, { useToast } from "../../../../components/ds/Toast";
import { useLang, t } from "../../../../utils/lang";
import { formatDate, formatDateTime } from "../../../../utils/format";
import { JOBS } from "../../../../lib/data";
import { getApplication, STAGE_TYPICAL, withdrawApplication } from "../../../../lib/seekerStore";

const HAPPY_PATH = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Offer Sent", "Hired"];

export default function ApplicationDetailClient({ id }) {
  const [lang] = useLang();
  const [app, setApp] = useState(undefined);
  const [toast, setToast] = useToast();
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  useEffect(() => {
    setApp(getApplication(id));
  }, [id]);

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

  const job = JOBS.find((j) => String(j.id) === String(app.jobId)) || {
    title: app.jobTitle || "Job Position",
    titleVi: app.jobTitle || "Vị trí tuyển dụng",
    company: app.company || "Company",
  };
  const isVi = lang === "VN" || lang === "VI";
  const title = job ? (isVi ? job.titleVi : job.title) : "";
  const isRejected = app.stage === "Rejected";
  const isWithdrawn = app.stage === "Withdrawn";
  const currentIndex = HAPPY_PATH.indexOf(app.stage);
  const reachedDate = (stage) => ((app.timeline || []).find((tl) => tl.stage === stage) || {}).date;
  const answers = app.answers && Object.keys(app.answers).length ? app.answers : null;
  const canWithdraw = !app.closed && !isRejected && !isWithdrawn;

  const doWithdraw = async () => {
    const updated = await withdrawApplication(app.id);
    setApp(updated || getApplication(app.id));
    setConfirmWithdraw(false);
    setToast(t(lang, "Application withdrawn"));
  };

  return (
    <div className="lv-page-container">
      <Link href="/applications" className="lv-job-view" style={{ marginBottom: 20, display: "inline-flex" }}>
        <Icon name="arrow-left" size={14} /> {t(lang, "Application Tracker")}
      </Link>

      <div className="lv-tracker-detail-head">
        <div className="lv-job-logo" style={{ width: 56, height: 56 }}>
          {job ? job.company.slice(0, 2).toUpperCase() : "—"}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: "var(--text-xl)", marginBottom: 4 }}>{title}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
            {job ? job.company : ""} · {t(lang, "Applied")} {formatDate(lang, app.appliedDate)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StageBadge stage={app.stage} lang={lang} />
          {app.closed && !isRejected && !isWithdrawn && app.stage !== "Hired" && <Badge tone="neutral">{t(lang, "Position Closed")}</Badge>}
        </div>
      </div>

      {job && (
        <div className="lv-detail-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div className="lv-job-meta" style={{ marginBottom: 0 }}>
              <span><Icon name="map-pin" size={14} /> {isVi ? job.locationVi : job.location}</span>
              <span><Icon name="wallet" size={14} /> {job.salary}</span>
              <span><Icon name="briefcase" size={14} /> {isVi ? job.modeVi : job.mode}</span>
            </div>
            <Link href={`/job-detail?id=${job.id}`}>
              <Button variant="secondary" size="sm">{t(lang, "View job")}</Button>
            </Link>
          </div>
        </div>
      )}

      {app.interview && (
        <div className="lv-detail-card" style={{ marginBottom: 20 }}>
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
          ? app.timeline.map((tl) => (
              <div key={tl.stage} className={`lv-timeline-item done ${tl.stage === "Rejected" || tl.stage === "Withdrawn" ? "rejected" : ""}`}>
                <span className="lv-timeline-dot">
                  <Icon name={tl.stage === "Rejected" ? "x" : tl.stage === "Withdrawn" ? "undo-2" : "check"} size={12} />
                </span>
                <div className="lv-timeline-body">
                  <strong>{t(lang, tl.stage)}</strong>
                  <span>{formatDate(lang, tl.date)}</span>
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
                    {reached ? <span>{formatDate(lang, reachedDate(stage))}</span> : isNext && STAGE_TYPICAL[stage] ? <span className="lv-timeline-typical">{t(lang, STAGE_TYPICAL[stage])}</span> : <span>{t(lang, "Pending")}</span>}
                  </div>
                </div>
              );
            })}
      </div>

      {(app.resumeFileName || app.coverLetter || answers) && (
        <div className="lv-detail-card" style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: "var(--text-md)", marginTop: 0 }}>{t(lang, "What you submitted")}</h2>
          {app.resumeFileName && (
            <p style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              <Icon name="file-text" size={15} /> {app.resumeFileName}
            </p>
          )}
          {app.coverLetter && (
            <>
              <strong style={{ display: "block", margin: "12px 0 4px", fontSize: "var(--text-sm)" }}>{t(lang, "Cover letter")}</strong>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>{app.coverLetter}</p>
            </>
          )}
          {answers &&
            Object.entries(answers).map(([q, ans]) => (
              <div key={q} style={{ marginTop: 12 }}>
                <strong style={{ display: "block", marginBottom: 4, fontSize: "var(--text-sm)" }}>{q}</strong>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{String(ans)}</p>
              </div>
            ))}
        </div>
      )}

      {canWithdraw && (
        <div style={{ marginTop: 24 }}>
          {!confirmWithdraw ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirmWithdraw(true)}>
              <Icon name="undo-2" size={15} /> {t(lang, "Withdraw application")}
            </Button>
          ) : (
            <div className="lv-error" role="alert" style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
              <span>{t(lang, "Withdraw this application? This can't be undone.")}</span>
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="danger" size="sm" onClick={doWithdraw}>{t(lang, "Withdraw")}</Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmWithdraw(false)}>{t(lang, "Cancel")}</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Toast msg={toast} />
    </div>
  );
}
