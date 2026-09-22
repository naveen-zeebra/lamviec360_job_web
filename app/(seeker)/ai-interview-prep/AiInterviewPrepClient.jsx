"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { formatDateTime } from "../../../utils/format";
import { listApplications } from "../../../lib/seekerStore";

const NOTIFY_KEY = "lv360-aiprep-notify";

const BENEFITS = [
  { icon: "target", title: "Role-specific questions", desc: "Practice with questions generated from the actual job description." },
  { icon: "mic", title: "Technical, behavioral & HR", desc: "Cover every interview type recruiters commonly use." },
  { icon: "trending-up", title: "Track your progress", desc: "See which skills to reinforce before the real interview." },
];

const INTERVIEW_TYPES = ["Technical", "Behavioral", "HR", "Role-specific"];

export default function AiInterviewPrepClient() {
  const [lang] = useLang();
  const [preview, setPreview] = useState(false);
  const [applications, setApplications] = useState([]);
  const [toast, setToast] = useToast();
  const [selectedApp, setSelectedApp] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    setApplications(listApplications());
    try {
      setNotified(localStorage.getItem(NOTIFY_KEY) === "1");
    } catch (e) {}
  }, []);

  const notifyMe = () => {
    try {
      localStorage.setItem(NOTIFY_KEY, "1");
    } catch (e) {}
    setNotified(true);
    setToast(t(lang, "We'll notify you when this feature launches"));
  };

  const appOptions = applications
    .map((a) => {
      const job = a.job;
      return job ? { value: a.id, label: `${lang === "VN" || lang === "VI" ? job.titleVi || job.title : job.title} · ${job.company_name || job.company?.company_name || job.company}` } : null;
    })
    .filter(Boolean);

  const selectedApplication = applications.find((x) => x.id === selectedApp) || null;
  const selectedJob = selectedApplication ? selectedApplication.job : null;

  if (!preview) {
    return (
      <div className="lv-page-container">
        <div className="lv-ai-coming-soon">
          <Badge tone="brand">{t(lang, "P2 · Coming Soon")}</Badge>
          <h1>{t(lang, "AI Interview Preparation")}</h1>
          <p>{t(lang, "Get AI-generated practice questions tailored to your saved applications. This feature isn't enabled yet — here's what's coming.")}</p>
          <div className="lv-feature-grid" style={{ margin: "32px 0" }}>
            {BENEFITS.map((b) => (
              <div key={b.title} className="lv-sol-card">
                <div className="lv-sol-icon">
                  <Icon name={b.icon} size={20} />
                </div>
                <h3>{t(lang, b.title)}</h3>
                <p>{t(lang, b.desc)}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Button variant="primary" onClick={notifyMe} disabled={notified}>
              {notified ? t(lang, "You're on the list") : t(lang, "Notify Me")}
            </Button>
            <Button variant="secondary" onClick={() => setPreview(true)}>
              {t(lang, "Preview the planned flow")}
            </Button>
          </div>
        </div>
        <Toast msg={toast} />
      </div>
    );
  }

  return (
    <div className="lv-page-container">
      <button className="lv-job-view" style={{ marginBottom: 20 }} onClick={() => setPreview(false)}>
        <Icon name="arrow-left" size={14} /> {t(lang, "Back to Coming Soon")}
      </button>
      <Badge tone="warning">{t(lang, "Preview only · Not yet active")}</Badge>
      <h1 style={{ margin: "12px 0 24px" }}>{t(lang, "Planned setup flow")}</h1>

      <div className="lv-onboard-card">
        <div className="lv-form-grid">
          <Select
            label={t(lang, "Saved application / target job")}
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            options={appOptions}
            placeholder={t(lang, "Choose an application")}
          />
          <Select
            label={t(lang, "Interview type")}
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
            options={INTERVIEW_TYPES.map((v) => ({ value: v, label: t(lang, v) }))}
            placeholder={t(lang, "Select type")}
          />
        </div>

        {selectedJob && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: "var(--text-base)", marginBottom: 10 }}>{t(lang, "Relevant skills")}</h3>
            <div className="lv-job-tags">
              {(selectedJob.skills || []).map((s) => (
                <Badge key={s} tone="neutral">
                  {s}
                </Badge>
              ))}
            </div>
            <h3 style={{ fontSize: "var(--text-base)", margin: "20px 0 10px" }}>{t(lang, "Job context")}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              {selectedJob.company_name || selectedJob.company?.company_name || selectedJob.company} · {lang === "VN" || lang === "VI" ? selectedJob.locationVi || selectedJob.location : selectedJob.location}
            </p>
            {selectedApplication && selectedApplication.interview && (
              <div className="lv-reg-hint" style={{ marginTop: 16 }}>
                <span aria-hidden="true"><Icon name="calendar" size={16} /></span>
                <span>
                  {t(lang, "You have an interview for this role on")} {formatDateTime(lang, selectedApplication.interview.at)}.{" "}
                  <Link href={`/interviews/${selectedApplication.id}`} style={{ fontWeight: 700 }}>{t(lang, "View details")}</Link>
                </span>
              </div>
            )}
          </div>
        )}

        <div className="lv-reg-hint" style={{ marginTop: 28 }}>
          <span aria-hidden="true">
            <Icon name="info" size={16} />
          </span>
          <span>{t(lang, "This is a preview of the planned experience. Practice questions will be generated once AI Interview Preparation is enabled.")}</span>
        </div>
      </div>
    </div>
  );
}
