"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import Skeleton from "../../../../components/ds/Skeleton";
import Toast, { useToast } from "../../../../components/ds/Toast";
import { useLang, t } from "../../../../utils/lang";
import { formatDate, formatTime, relativeTime } from "../../../../utils/format";
import {
  getApplication,
  getInterviewByApplication,
  respondToInterview,
  proposeInterviewReschedule,
  ensureDefaultInterviews,
} from "../../../../lib/seekerStore";

const PAGE = "mx-auto max-w-[880px] px-6 pb-24 pt-8 max-md:px-4 max-md:pb-12 max-md:pt-5";
const CARD = "rounded-xl border border-line bg-card p-6 shadow-xs max-md:p-4";
const EMPTY = "rounded-xl border border-dashed border-line bg-card px-6 py-14 text-center text-muted [&_h3]:mb-2 [&_h3]:text-lg";
const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(21,23,27,0.5)] p-4";
const MODAL = "w-full max-w-[480px] rounded-xl bg-card p-6 shadow-xl border border-line animate-in fade-in zoom-in-95 duration-150";

const MODE_LABEL = {
  video: "Video call",
  phone: "Phone call",
  "on-site": "On-site",
  onsite: "On-site",
};

const MODE_ICON = {
  video: "video",
  phone: "phone",
  "on-site": "map-pin",
  onsite: "map-pin",
};

const STATUS_TONE = {
  invited: "warning",
  confirmed: "success",
  declined: "error",
  completed: "neutral",
  cancelled: "neutral",
  reschedule_requested: "info",
};

const STATUS_LABEL = {
  invited: "Invitation pending",
  confirmed: "Confirmed",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
  reschedule_requested: "Reschedule requested",
};

const DEFAULT_PREP_CHECKLIST = [
  "Re-read the job description and note 2–3 questions to ask.",
  "Prepare a short walkthrough of a recent project.",
  "Test your camera, microphone and internet if it's a video call.",
  "Have your résumé and portfolio links open.",
  "Review common behavioral questions with AI Interview Prep.",
];

function icsDate(value) {
  if (!value) return "";
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (isNaN(d.getTime())) return "";
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function downloadIcs(iv, jobTitle, company) {
  const start = icsDate(iv.at);
  if (!start) return;
  const d = new Date(iv.at.includes("T") ? iv.at : iv.at.replace(" ", "T"));
  const end = icsDate(new Date(d.getTime() + (iv.durationMin || 45) * 60000).toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LamViec360//Interview//EN",
    "BEGIN:VEVENT",
    `UID:${iv.applicationId || iv.id || Date.now()}@lamviec360`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${jobTitle} interview — ${company}`,
    `DESCRIPTION:${(iv.round || "") + (iv.instructions ? ". " + iv.instructions : "")}`,
    `LOCATION:${iv.mode === "video" ? iv.meetingLink || "Online" : iv.location || ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `interview-${(company || "company").toLowerCase().replace(/[^a-z0-9]/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Row({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3.5 border-b border-line py-3.5 last:border-0">
      <span className="mt-0.5 text-faint">
        <Icon name={icon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-faint">{label}</span>
        <div className="mt-0.5 text-sm font-medium text-ink">{children}</div>
      </div>
    </div>
  );
}

export default function InterviewDetailClient({ id }) {
  const [lang] = useLang();
  const [state, setState] = useState({ loading: true, app: null, iv: null });
  const [toast, setToast] = useToast();

  // Modals state
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("Accepted another job offer");
  const [declineNote, setDeclineNote] = useState("");

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("14:00");
  const [rescheduleNote, setRescheduleNote] = useState("");

  // Interactive checklist state
  const [checkedItems, setCheckedItems] = useState({});

  const today = new Date().toISOString().slice(0, 10);
  const isVi = lang === "VN" || lang === "VI";

  const load = () => {
    ensureDefaultInterviews();
    const app = getApplication(id);
    const iv = getInterviewByApplication(id);
    setState({ loading: false, app, iv });
  };

  useEffect(() => {
    load();
    if (typeof window !== "undefined") {
      window.addEventListener("lv360-store", load);
      return () => window.removeEventListener("lv360-store", load);
    }
  }, [id]);

  const toggleCheck = (idx) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleRespond = async (status, note) => {
    await respondToInterview(id, status, note);
    setDeclineOpen(false);
    setDeclineNote("");
    setState((s) => ({ ...s, iv: getInterviewByApplication(id), app: getApplication(id) }));
    setToast(status === "confirmed" ? t(lang, "Interview confirmed") : t(lang, "Interview declined"));
  };

  const handleConfirmDecline = async () => {
    const fullNote = declineNote.trim() ? `${declineReason}: ${declineNote}` : declineReason;
    await handleRespond("declined", fullNote);
  };

  const handleOpenReschedule = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setRescheduleDate(d.toISOString().slice(0, 10));
    setRescheduleTime("14:00");
    setRescheduleNote("");
    setRescheduleOpen(true);
  };

  const handleConfirmReschedule = async () => {
    const proposedAt = `${rescheduleDate} ${rescheduleTime}`;
    await proposeInterviewReschedule(id, proposedAt, rescheduleNote);
    setRescheduleOpen(false);
    setState((s) => ({ ...s, iv: getInterviewByApplication(id), app: getApplication(id) }));
    setToast(t(lang, "Reschedule proposal submitted"));
  };

  const handleCopyLink = (link) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setToast(t(lang, "Meeting Link Copied!"));
    }
  };

  const { loading, app, iv } = state;

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
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="calendar-x" size={26} />
          </div>
          <h3 className="text-base font-bold text-ink">{t(lang, "Interview not found")}</h3>
          <p className="mt-1 text-xs text-muted">
            {t(lang, "This interview may have been cancelled or the link is out of date.")}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/interviews">
              <Button variant="primary" size="sm">
                <Icon name="arrow-left" size={14} /> {t(lang, "Back to Interviews")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const job = app?.job || {
    title: app?.jobTitle || "Interview",
    titleVi: app?.jobTitle || "Phỏng vấn",
    company: app?.company || "Company",
    company_name: app?.company || "Company",
  };
  const title = job ? (isVi && job.titleVi ? job.titleVi : job.title) : t(lang, "Interview");
  const companyName = job.company_name || job.company || "Company";
  const roundTitle = isVi && iv.roundVi ? iv.roundVi : iv.round || "Interview";
  const instructionsText = isVi && iv.instructionsVi ? iv.instructionsVi : iv.instructions || "";

  const isInvited = iv.status === "invited";
  const isConfirmed = iv.status === "confirmed";
  const isRescheduled = iv.status === "reschedule_requested";

  const startMs = new Date((iv.at || "").replace(" ", "T")).getTime();
  const withinJoinWindow = !isNaN(startMs) && Math.abs(Date.now() - startMs) <= 30 * 60000;

  const jobId = job?.id || app?.jobId || 1;
  const jobSlug =
    encodeURIComponent((job.title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) +
    "-" +
    jobId;

  return (
    <div className={PAGE}>
      {/* Back Link */}
      <Link
        href="/interviews"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline no-underline"
      >
        <Icon name="arrow-left" size={14} /> {t(lang, "Back to Interviews")}
      </Link>

      {/* Main Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-card p-5 shadow-xs">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-lg font-bold text-white shadow-xs">
            {companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-ink max-md:text-lg">{title}</h1>
              <Badge tone={STATUS_TONE[iv.status] || "neutral"}>
                {t(lang, STATUS_LABEL[iv.status] || iv.status)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted">
              <span className="font-semibold text-ink">{companyName}</span> · {roundTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadIcs(iv, title, companyName)}
            title={t(lang, "Add to calendar")}
          >
            <Icon name="calendar-plus" size={14} /> {t(lang, "Add to calendar")}
          </Button>
        </div>
      </div>

      {/* Action Banner for Invited State */}
      {isInvited && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50/80 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-yellow-700">
              <Icon name="bell" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="text-sm font-bold text-yellow-900">
                {t(lang, "You've been invited to interview. Please respond.")}
              </strong>
              <p className="mt-1 text-xs text-yellow-800">
                {t(
                  lang,
                  "Please confirm your availability so the hiring manager and interview panel can reserve this slot."
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button variant="primary" size="sm" onClick={() => handleRespond("confirmed")}>
                  <Icon name="check" size={14} /> {t(lang, "Accept invitation")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDeclineReason("Accepted another job offer");
                    setDeclineNote("");
                    setDeclineOpen(true);
                  }}
                >
                  {t(lang, "Decline")}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleOpenReschedule}>
                  {t(lang, "Propose another time")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Banner */}
      {isRescheduled && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/80 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-blue-600">
              <Icon name="info" size={18} />
            </span>
            <div>
              <strong className="text-xs font-bold text-blue-900">
                {t(lang, "You proposed a new time for this interview.")}
              </strong>
              <p className="mt-0.5 text-xs text-blue-800">
                {iv.proposedAt ? `${t(lang, "Preferred Date & Time")}: ${iv.proposedAt}` : ""} —{" "}
                {t(lang, "Awaiting employer review and confirmation.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interview Details Card */}
      <div className={`${CARD} mb-6`}>
        <div className="mb-2 flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Icon name="calendar" size={18} /> {t(lang, "Interview details")}
          </h2>
          <span className="text-xs font-semibold text-brand">
            {relativeTime(lang, iv.at)}
          </span>
        </div>

        <Row icon="calendar" label={t(lang, "Date")}>
          <span className="font-semibold text-ink">{formatDate(lang, iv.at)}</span> · {relativeTime(lang, iv.at)}
        </Row>

        <Row icon="clock" label={t(lang, "Time")}>
          <span className="font-semibold text-ink">{formatTime(lang, iv.at)}</span> ({t(lang, "Asia/Ho Chi Minh")}) ·{" "}
          {iv.durationMin || 45} {t(lang, "min")}
        </Row>

        <Row icon={MODE_ICON[iv.mode] || "video"} label={t(lang, "Format")}>
          {t(lang, MODE_LABEL[iv.mode] || iv.mode)}
        </Row>

        {iv.mode === "video" && iv.meetingLink && (
          <Row icon="link" label={t(lang, "Meeting link")}>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={iv.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline break-all"
              >
                {iv.meetingLink}
              </a>
              <button
                type="button"
                onClick={() => handleCopyLink(iv.meetingLink)}
                className="inline-flex items-center gap-1 rounded bg-sunken px-2 py-0.5 text-xs font-medium text-muted hover:text-ink"
                title={t(lang, "Copy meeting link")}
              >
                <Icon name="copy" size={12} /> {t(lang, "Copy meeting link")}
              </button>
            </div>
          </Row>
        )}

        {iv.mode !== "video" && iv.location && (
          <Row icon="map-pin" label={t(lang, "Location")}>
            <span className="font-medium text-ink">{iv.location}</span>
          </Row>
        )}

        {iv.interviewers && iv.interviewers.length > 0 && (
          <Row icon="users" label={t(lang, "Interviewer")}>
            <div className="flex flex-col gap-1">
              {iv.interviewers.map((p, idx) => (
                <span key={idx}>
                  <strong className="text-ink">{p.name}</strong>
                  {p.role && <span className="text-muted"> — {p.role}</span>}
                </span>
              ))}
            </div>
          </Row>
        )}

        {iv.documents && iv.documents.length > 0 && (
          <Row icon="paperclip" label={t(lang, "Bring / have ready")}>
            <ul className="list-disc pl-4 text-xs font-medium text-ink">
              {iv.documents.map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>
          </Row>
        )}

        {instructionsText && (
          <Row icon="info" label={t(lang, "Notes from the employer")}>
            <p className="rounded-lg bg-sunken p-3 text-xs text-ink leading-relaxed">
              {instructionsText}
            </p>
          </Row>
        )}

        {/* Video Call Quick Launch */}
        {isConfirmed && iv.mode === "video" && iv.meetingLink && (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="sm">
                <Icon name="video" size={15} /> {withinJoinWindow ? t(lang, "Join now") : t(lang, "Join Meeting")}
              </Button>
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadIcs(iv, title, companyName)}
            >
              <Icon name="calendar-plus" size={15} /> {t(lang, "Add to calendar")}
            </Button>
          </div>
        )}
      </div>

      {/* Interactive Preparation Checklist Card */}
      <div className={`${CARD} mb-6`}>
        <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
          <strong className="text-base font-bold text-ink flex items-center gap-2">
            <Icon name="check-square" size={18} /> {t(lang, "Prepare for this interview")}
          </strong>
          <Link
            href="/ai-interview-prep"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline no-underline"
          >
            <Icon name="sparkles" size={14} /> {t(lang, "AI Interview Prep")} <Icon name="arrow-right" size={12} />
          </Link>
        </div>

        <p className="mb-3 text-xs text-muted">
          {t(lang, "Check off these preparation steps to boost your readiness and confidence:")}
        </p>

        <div className="flex flex-col gap-2">
          {DEFAULT_PREP_CHECKLIST.map((itemKey, idx) => {
            const isChecked = !!checkedItems[idx];
            return (
              <label
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  isChecked ? "border-green-300 bg-green-50/50" : "border-line bg-card hover:bg-sunken"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="mt-0.5 accent-brand"
                />
                <span
                  className={`text-xs font-medium ${
                    isChecked ? "text-green-800 line-through opacity-80" : "text-ink"
                  }`}
                >
                  {t(lang, itemKey)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2.5">
          <Link href={`/job-detail/${jobSlug}`}>
            <Button variant="secondary" size="sm">
              <Icon name="briefcase" size={14} /> {t(lang, "View job")}
            </Button>
          </Link>
          <Link href={`/applications/${app.id}`}>
            <Button variant="ghost" size="sm">
              <Icon name="file-text" size={14} /> {t(lang, "View application")}
            </Button>
          </Link>
        </div>

        <Link href="/interviews">
          <Button variant="ghost" size="sm">
            <Icon name="arrow-left" size={14} /> {t(lang, "Back to Interviews")}
          </Button>
        </Link>
      </div>

      {/* Decline Modal */}
      {declineOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true">
          <div className={MODAL}>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <strong className="text-base font-bold text-ink">
                {t(lang, "Decline this interview?")}
              </strong>
              <button onClick={() => setDeclineOpen(false)} className="text-gray-400 hover:text-ink">
                <Icon name="x" size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-muted">
              {t(lang, "Why are you declining this interview?")}
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {[
                "Accepted another job offer",
                "Schedule conflict",
                "Location or commute not feasible",
                "Role or compensation no longer aligns",
                "Other reason",
              ].map((reasonKey) => (
                <label
                  key={reasonKey}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-line p-2.5 text-xs font-medium hover:bg-sunken transition-colors"
                >
                  <input
                    type="radio"
                    name="detailDeclineReason"
                    value={reasonKey}
                    checked={declineReason === reasonKey}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="accent-brand"
                  />
                  <span>{t(lang, reasonKey)}</span>
                </label>
              ))}
            </div>

            <textarea
              className="mt-3 w-full rounded-lg border border-line bg-card p-3 text-xs text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none"
              rows={3}
              value={declineNote}
              onChange={(e) => setDeclineNote(e.target.value)}
              placeholder={t(lang, "Let the employer know why (optional)...")}
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDeclineOpen(false)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDecline}>
                {t(lang, "Confirm Decline")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Another Time Modal */}
      {rescheduleOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true">
          <div className={MODAL}>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <strong className="text-base font-bold text-ink">
                {t(lang, "Propose New Time")}
              </strong>
              <button onClick={() => setRescheduleOpen(false)} className="text-gray-400 hover:text-ink">
                <Icon name="x" size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-muted">
              {t(lang, "Let the employer know your preferred date and time.")}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-faint mb-1">
                  {t(lang, "Preferred Date & Time")}
                </label>
                <input
                  type="date"
                  min={today}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-line bg-card p-2 text-xs text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-faint mb-1">
                  {t(lang, "Time")}
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full rounded-lg border border-line bg-card p-2 text-xs text-ink focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-faint mb-1">
                {t(lang, "Reason / Note for employer")}
              </label>
              <textarea
                className="w-full rounded-lg border border-line bg-card p-3 text-xs text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none"
                rows={3}
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
                placeholder={t(lang, "e.g. I have a prior work commitment at this time...")}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRescheduleOpen(false)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmReschedule}>
                {t(lang, "Send Proposal")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast} />
    </div>
  );
}
