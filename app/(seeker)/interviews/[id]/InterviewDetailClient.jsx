"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import Skeleton from "../../../../components/ds/Skeleton";
import Toast, { useToast } from "../../../../components/ds/Toast";
import { useLang, t } from "../../../../utils/lang";
import { formatDate, formatTime, relativeTime } from "../../../../utils/format";
import { JOBS } from "../../../../lib/data";
import { getApplication, getInterviewByApplication, respondToInterview } from "../../../../lib/seekerStore";

const PAGE = "mx-auto max-w-[820px] px-6 pb-24 pt-10 max-md:px-4 max-md:pb-12 max-md:pt-7";
const CARD = "rounded-lg border border-line bg-card p-6 shadow-sm max-md:p-5";
const EMPTY = "rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted [&_h3]:mb-2 [&_h3]:text-lg";
const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(21,23,27,0.5)] p-6";
const MODAL = "w-full max-w-[440px] rounded-xl bg-card p-6 shadow-lg";

const MODE_LABEL = { video: "Video call", phone: "Phone call", "on-site": "On-site", onsite: "On-site" };
const STATUS_TONE = { invited: "warning", confirmed: "success", declined: "error", completed: "neutral", cancelled: "neutral" };
const STATUS_LABEL = { invited: "Invitation pending", confirmed: "Confirmed", declined: "Declined", completed: "Completed", cancelled: "Cancelled" };

const PREP_CHECKLIST = [
  "Re-read the job description and note 2–3 questions to ask.",
  "Prepare a short walkthrough of a recent project.",
  "Test your camera, microphone and internet if it's a video call.",
  "Have your résumé and portfolio links open.",
];

function icsDate(value) {
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function downloadIcs(iv, jobTitle, company) {
  const start = icsDate(iv.at);
  const end = icsDate(new Date(new Date(iv.at.replace(" ", "T")).getTime() + (iv.durationMin || 45) * 60000).toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LamViec360//Interview//EN",
    "BEGIN:VEVENT",
    `UID:${iv.applicationId}@lamviec360`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${jobTitle} interview — ${company}`,
    `DESCRIPTION:${(iv.round || "") + ". " + (iv.instructions || "")}`,
    `LOCATION:${iv.mode === "video" ? iv.meetingLink : iv.location || ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "interview.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function Row({ icon, label, children }) {
  return (
    <div className="flex gap-3 border-b border-line py-3 last:border-0">
      <Icon name={icon} size={16} />
      <div className="min-w-0 flex-1">
        <span className="block text-xs text-faint">{label}</span>
        <span className="text-sm text-ink">{children}</span>
      </div>
    </div>
  );
}

export default function InterviewDetailClient({ id }) {
  const [lang] = useLang();
  const [state, setState] = useState({ loading: true, app: null, iv: null });
  const [toast, setToast] = useToast();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineNote, setDeclineNote] = useState("");

  const load = () => {
    setState({ loading: false, app: getApplication(id), iv: getInterviewByApplication(id) });
  };
  useEffect(() => {
    load();
  }, [id]);

  const respond = async (status, note) => {
    await respondToInterview(id, status, note);
    setDeclineOpen(false);
    setDeclineNote("");
    setState((s) => ({ ...s, iv: getInterviewByApplication(id), app: getApplication(id) }));
    setToast(status === "confirmed" ? t(lang, "Interview confirmed") : t(lang, "Interview declined"));
  };

  const { loading, app, iv } = state;
  const isVi = lang === "VN" || lang === "VI";

  if (loading) {
    return (
      <div className={PAGE}>
        <Skeleton width={140} height={16} style={{ marginBottom: 20 }} />
        <Skeleton height={90} style={{ marginBottom: 16 }} />
        <Skeleton height={320} />
      </div>
    );
  }

  if (!iv) {
    return (
      <div className={PAGE}>
        <div className={EMPTY}>
          <h3>{t(lang, "Interview not found")}</h3>
          <p>{t(lang, "This interview may have been cancelled or the link is out of date.")}</p>
          <div className="mt-4">
            <Link href="/interviews"><Button variant="secondary">{t(lang, "Back to Interviews")}</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const job = (app && JOBS.find((j) => String(j.id) === String(app.jobId))) || {
    title: app?.jobTitle || "Interview",
    titleVi: app?.jobTitle || "Phỏng vấn",
    company: app?.company || "Company",
  };
  const title = job ? (isVi ? job.titleVi : job.title) : t(lang, "Interview");
  const isInvited = iv.status === "invited";
  const startMs = new Date((iv.at || "").replace(" ", "T")).getTime();
  const withinJoinWindow = Math.abs(Date.now() - startMs) <= 15 * 60000;

  return (
    <div className={PAGE}>
      <Link href="/interviews" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold no-underline">
        <Icon name="arrow-left" size={14} /> {t(lang, "Interviews")}
      </Link>

      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
          {job ? job.company.slice(0, 2).toUpperCase() : "—"}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold">{title}</h1>
          <p className="text-sm text-muted">{job ? job.company : ""} · {iv.round}</p>
        </div>
        <Badge tone={STATUS_TONE[iv.status] || "neutral"}>{t(lang, STATUS_LABEL[iv.status] || iv.status)}</Badge>
      </div>

      {isInvited && (
        <div className="mb-5 rounded-lg border border-yellow-100 bg-warning-bg p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning-fg">
            <Icon name="bell" size={15} /> {t(lang, "You've been invited to interview. Please respond.")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <Button variant="primary" size="sm" onClick={() => respond("confirmed")}>
              <Icon name="check" size={15} /> {t(lang, "Accept invitation")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setDeclineOpen(true)}>
              {t(lang, "Decline")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setToast(t(lang, "Proposing a new time isn't available in this prototype."))}>
              {t(lang, "Propose another time")}
            </Button>
          </div>
        </div>
      )}

      <div className={`${CARD} mb-5`}>
        <Row icon="calendar" label={t(lang, "Date")}>{formatDate(lang, iv.at)} · {relativeTime(lang, iv.at)}</Row>
        <Row icon="clock" label={t(lang, "Time")}>{formatTime(lang, iv.at)} ({t(lang, "Asia/Ho Chi Minh")}) · {iv.durationMin || 45} {t(lang, "min")}</Row>
        <Row icon="video" label={t(lang, "Format")}>{t(lang, MODE_LABEL[iv.mode] || iv.mode)}</Row>
        {iv.mode === "video" && iv.meetingLink && (
          <Row icon="link" label={t(lang, "Meeting link")}>
            <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="break-all">{iv.meetingLink}</a>
          </Row>
        )}
        {iv.mode !== "video" && iv.location && <Row icon="map-pin" label={t(lang, "Location")}>{iv.location}</Row>}
        {iv.interviewers && iv.interviewers.length > 0 && (
          <Row icon="users" label={t(lang, "Interviewer")}>
            {iv.interviewers.map((p) => `${p.name}${p.role ? ` (${p.role})` : ""}`).join(", ")}
          </Row>
        )}
        {iv.documents && iv.documents.length > 0 && (
          <Row icon="paperclip" label={t(lang, "Bring / have ready")}>{iv.documents.join(", ")}</Row>
        )}
        {iv.instructions && <Row icon="info" label={t(lang, "Notes from the employer")}>{iv.instructions}</Row>}

        <div className="mt-4 flex flex-wrap gap-2.5">
          {iv.status === "confirmed" && iv.mode === "video" && iv.meetingLink && (
            <a href={withinJoinWindow ? iv.meetingLink : undefined} target="_blank" rel="noreferrer">
              <Button variant="primary" size="sm" disabled={!withinJoinWindow}>
                <Icon name="video" size={15} /> {withinJoinWindow ? t(lang, "Join now") : t(lang, "Join opens 15 min before")}
              </Button>
            </a>
          )}
          <Button variant="secondary" size="sm" onClick={() => downloadIcs(iv, title, job ? job.company : "")}>
            <Icon name="calendar-plus" size={15} /> {t(lang, "Add to calendar")}
          </Button>
        </div>
      </div>

      <div className={`${CARD} mb-5`}>
        <div className="mb-3 flex items-center justify-between">
          <strong className="text-base">{t(lang, "Prepare for this interview")}</strong>
          <Link href="/ai-interview-prep" className="inline-flex items-center gap-1 text-sm font-semibold no-underline">
            {t(lang, "AI Interview Prep")} <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        <ul className="flex flex-col gap-2">
          {PREP_CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted">
              <Icon name="check-circle" size={15} /> {t(lang, item)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {job && (
          <Link href={`/job-detail?id=${job.id}`}><Button variant="ghost" size="sm">{t(lang, "View job")}</Button></Link>
        )}
        <Link href={`/applications/${app.id}`}><Button variant="ghost" size="sm">{t(lang, "View application")}</Button></Link>
      </div>

      {declineOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Decline interview")}>
          <div className={MODAL}>
            <strong className="text-base">{t(lang, "Decline this interview?")}</strong>
            <p className="mt-1 text-sm text-muted">{t(lang, "Let the employer know why (optional).")}</p>
            <textarea
              className="mt-3 w-full rounded-md border border-line bg-card p-3 text-sm"
              rows={3}
              value={declineNote}
              onChange={(e) => setDeclineNote(e.target.value)}
              placeholder={t(lang, "e.g. I've accepted another offer.")}
            />
            <div className="mt-4 flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setDeclineOpen(false)}>{t(lang, "Cancel")}</Button>
              <Button variant="danger" size="sm" onClick={() => respond("declined", declineNote)}>{t(lang, "Decline interview")}</Button>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast} />
    </div>
  );
}
