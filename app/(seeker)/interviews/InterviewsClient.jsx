"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import ErrorState from "../../../components/ds/ErrorState";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { formatDate, formatTime, formatDateTime, relativeTime } from "../../../utils/format";
import {
  listInterviews,
  respondToInterview,
  proposeInterviewReschedule,
  addDemoInterview,
  ensureDefaultInterviews,
} from "../../../lib/seekerStore";

const PAGE = "mx-auto max-w-[1080px] px-6 pb-24 pt-8 max-md:px-4 max-md:pb-12 max-md:pt-5";
const CARD = "rounded-xl border border-line bg-card p-5 text-inherit transition-all hover:shadow-md max-md:p-4";
const EMPTY = "rounded-xl border border-dashed border-line bg-card px-6 py-14 text-center text-muted [&_h3]:mb-2 [&_h3]:text-lg";
const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(21,23,27,0.5)] p-4";
const MODAL = "w-full max-w-[480px] rounded-xl bg-card p-6 shadow-xl border border-line animate-in fade-in zoom-in-95 duration-150";

const MODE_ICON = {
  video: "video",
  phone: "phone",
  "on-site": "map-pin",
  onsite: "map-pin",
};

const MODE_LABEL = {
  video: "Video Call",
  phone: "Phone Call",
  "on-site": "On-site Interview",
  onsite: "On-site Interview",
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
  invited: "Action needed",
  confirmed: "Confirmed",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
  reschedule_requested: "Reschedule requested",
};

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

function useInterviews() {
  const [state, setState] = useState({ loading: true, error: false, data: [] });
  const load = () => {
    try {
      const items = listInterviews();
      setState({ loading: false, error: false, data: items || [] });
    } catch (e) {
      setState({ loading: false, error: true, data: [] });
    }
  };

  useEffect(() => {
    load();
    if (typeof window !== "undefined") {
      window.addEventListener("lv360-store", load);
      return () => window.removeEventListener("lv360-store", load);
    }
  }, []);

  return [state, load];
}

export default function InterviewsClient() {
  const [lang] = useLang();
  const [{ loading, error, data }, reload] = useInterviews();
  const [toast, setToast] = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");

  // Modals state
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("Accepted another job offer");
  const [declineNote, setDeclineNote] = useState("");

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("14:00");
  const [rescheduleNote, setRescheduleNote] = useState("");

  const isVi = lang === "VN" || lang === "VI";
  const today = new Date().toISOString().slice(0, 10);
  const closedStatuses = ["declined", "cancelled", "completed"];

  // Quick Action Handlers
  const handleAccept = async (appId) => {
    await respondToInterview(appId, "confirmed");
    setToast(t(lang, "Interview confirmed"));
    reload();
  };

  const handleOpenDecline = (app) => {
    setDeclineTarget(app);
    setDeclineReason("Accepted another job offer");
    setDeclineNote("");
  };

  const handleConfirmDecline = async () => {
    if (!declineTarget) return;
    const noteText = declineNote.trim() ? `${declineReason}: ${declineNote}` : declineReason;
    await respondToInterview(declineTarget.id, "declined", noteText);
    setDeclineTarget(null);
    setToast(t(lang, "Interview declined"));
    reload();
  };

  const handleOpenReschedule = (app) => {
    setRescheduleTarget(app);
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setRescheduleDate(d.toISOString().slice(0, 10));
    setRescheduleTime("14:00");
    setRescheduleNote("");
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget) return;
    const proposedAt = `${rescheduleDate} ${rescheduleTime}`;
    await proposeInterviewReschedule(rescheduleTarget.id, proposedAt, rescheduleNote);
    setRescheduleTarget(null);
    setToast(t(lang, "Reschedule proposal submitted"));
    reload();
  };

  const handleSimulateInvite = () => {
    const newApp = addDemoInterview();
    setToast(t(lang, "Simulated new interview invitation!"));
    reload();
  };

  const handleResetDemo = () => {
    ensureDefaultInterviews(true);
    setToast(t(lang, "Demo interviews restored."));
    reload();
  };

  // Groupings & Counts
  const totalCount = data.length;
  const actionNeededCount = data.filter((a) => a.interview?.status === "invited").length;
  const upcomingCount = data.filter(
    (a) =>
      a.interview?.at &&
      a.interview.at.slice(0, 10) >= today &&
      !closedStatuses.includes(a.interview.status) &&
      a.interview.status !== "invited"
  ).length;
  const confirmedCount = data.filter((a) => a.interview?.status === "confirmed").length;
  const pastCount = data.filter(
    (a) =>
      closedStatuses.includes(a.interview?.status) ||
      (a.interview?.at && a.interview.at.slice(0, 10) < today)
  ).length;

  // Filtered list
  const filteredInterviews = useMemo(() => {
    return data.filter((a) => {
      const iv = a.interview;
      if (!iv || !iv.at) return false;
      const job = a.job || {};
      const companyName = job.company_name || job.company || "";
      const jobTitle = isVi && job.titleVi ? job.titleVi : job.title || "";
      const interviewersStr = (iv.interviewers || []).map((p) => p.name).join(" ");

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          jobTitle.toLowerCase().includes(q) ||
          companyName.toLowerCase().includes(q) ||
          interviewersStr.toLowerCase().includes(q) ||
          (iv.round || "").toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Format match
      if (formatFilter !== "all") {
        if (formatFilter === "video" && iv.mode !== "video") return false;
        if (formatFilter === "on-site" && iv.mode !== "on-site" && iv.mode !== "onsite") return false;
        if (formatFilter === "phone" && iv.mode !== "phone") return false;
      }

      // Tab match
      if (activeTab === "action_needed") {
        return iv.status === "invited";
      }
      if (activeTab === "upcoming") {
        return iv.at.slice(0, 10) >= today && !closedStatuses.includes(iv.status);
      }
      if (activeTab === "confirmed") {
        return iv.status === "confirmed";
      }
      if (activeTab === "past") {
        return closedStatuses.includes(iv.status) || iv.at.slice(0, 10) < today;
      }

      return true;
    });
  }, [data, activeTab, searchQuery, formatFilter, isVi, today]);

  if (error) {
    return (
      <div className={PAGE}>
        <ErrorState
          title={t(lang, "Couldn't load your interviews")}
          desc={t(lang, "Something went wrong reading your saved data.")}
          onRetry={reload}
          retryLabel={t(lang, "Try again")}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={PAGE}>
        <Skeleton width={180} height={32} style={{ marginBottom: 12 }} />
        <Skeleton width={320} height={18} style={{ marginBottom: 28 }} />
        <div className="mb-6 grid grid-cols-4 gap-3 max-md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={80} />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={110} style={{ marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div className={PAGE}>
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight max-md:text-xl">
            {t(lang, "Interviews")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t(lang, "Invitations, confirmed interviews and past rounds.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/ai-interview-prep">
            <Button variant="secondary" size="sm">
              <Icon name="sparkles" size={15} /> {t(lang, "AI Interview Prep")}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSimulateInvite}>
            <Icon name="plus-circle" size={15} /> {t(lang, "Simulate Invitation")}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetDemo} title={t(lang, "Load Demo Interviews")}>
            <Icon name="rotate-ccw" size={15} /> {t(lang, "Reset Demo")}
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="mb-6 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        <div
          onClick={() => setActiveTab("all")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeTab === "all" ? "border-brand bg-brand-subtle/40 ring-1 ring-brand" : "border-line bg-card hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>{t(lang, "Total interviews")}</span>
            <Icon name="calendar" size={16} />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-ink">{totalCount}</p>
        </div>

        <div
          onClick={() => setActiveTab("action_needed")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeTab === "action_needed"
              ? "border-yellow-500 bg-yellow-50/70 ring-1 ring-yellow-500"
              : "border-line bg-card hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-yellow-700">
            <span className="flex items-center gap-1.5">
              {actionNeededCount > 0 && <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />}
              {t(lang, "Action needed")}
            </span>
            <Icon name="bell" size={16} />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-yellow-800">{actionNeededCount}</p>
        </div>

        <div
          onClick={() => setActiveTab("upcoming")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeTab === "upcoming" ? "border-brand bg-brand-subtle/40 ring-1 ring-brand" : "border-line bg-card hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-brand">
            <span>{t(lang, "Upcoming")}</span>
            <Icon name="clock" size={16} />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-brand">{upcomingCount + actionNeededCount}</p>
        </div>

        <div
          onClick={() => setActiveTab("past")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeTab === "past" ? "border-gray-400 bg-gray-100 ring-1 ring-gray-400" : "border-line bg-card hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>{t(lang, "Past & closed")}</span>
            <Icon name="check-circle" size={16} />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-ink">{pastCount}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="mb-5 flex flex-col gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-2.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "all" ? "bg-brand text-white shadow-xs" : "text-muted hover:bg-gray-100"
            }`}
          >
            {t(lang, "All")} ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("action_needed")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "action_needed"
                ? "bg-yellow-600 text-white shadow-xs"
                : actionNeededCount > 0
                ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                : "text-muted hover:bg-gray-100"
            }`}
          >
            {actionNeededCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />}
            {t(lang, "Action needed")} ({actionNeededCount})
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "upcoming" ? "bg-brand text-white shadow-xs" : "text-muted hover:bg-gray-100"
            }`}
          >
            {t(lang, "Upcoming")} ({upcomingCount + actionNeededCount})
          </button>
          <button
            onClick={() => setActiveTab("confirmed")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "confirmed" ? "bg-green-600 text-white shadow-xs" : "text-muted hover:bg-gray-100"
            }`}
          >
            {t(lang, "Confirmed")} ({confirmedCount})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "past" ? "bg-gray-700 text-white shadow-xs" : "text-muted hover:bg-gray-100"
            }`}
          >
            {t(lang, "Past & closed")} ({pastCount})
          </button>
        </div>

        {/* Search & format filter row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[260px] flex-1 max-md:min-w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-8 text-xs font-medium text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder={t(lang, "Search by role, company, or interviewer...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 max-md:w-full">
            <span className="text-xs font-medium text-faint max-md:hidden">{t(lang, "Format")}:</span>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none max-md:flex-1"
            >
              <option value="all">{t(lang, "All formats")}</option>
              <option value="video">{t(lang, "Video Call")}</option>
              <option value="on-site">{t(lang, "On-site Interview")}</option>
              <option value="phone">{t(lang, "Phone Call")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Interview Cards List */}
      {filteredInterviews.length === 0 ? (
        <div className={EMPTY}>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="calendar" size={26} />
          </div>
          {searchQuery || formatFilter !== "all" || activeTab !== "all" ? (
            <>
              <h3 className="text-base font-bold text-ink">{t(lang, "No interviews match your filters.")}</h3>
              <p className="mt-1 text-xs text-muted">{t(lang, "Try a different filter.")}</p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFormatFilter("all");
                    setActiveTab("all");
                  }}
                >
                  {t(lang, "Reset Filters")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-ink">{t(lang, "No interviews scheduled yet")}</h3>
              <p className="mt-1 text-xs text-muted">
                {t(lang, "When an employer invites you to interview, it will show up here.")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button variant="primary" size="sm" onClick={handleResetDemo}>
                  <Icon name="sparkles" size={15} /> {t(lang, "Load Demo Interviews")}
                </Button>
                <Link href="/applications">
                  <Button variant="secondary" size="sm">
                    {t(lang, "View applications")}
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredInterviews.map((app) => {
            const job = app.job || {};
            const iv = app.interview || {};
            const companyName = job.company_name || job.company || "Company";
            const roleTitle = isVi && job.titleVi ? job.titleVi : job.title || t(lang, "Interview");
            const roundTitle = isVi && iv.roundVi ? iv.roundVi : iv.round || "Interview";
            const isInvited = iv.status === "invited";
            const isConfirmed = iv.status === "confirmed";
            const isReschedule = iv.status === "reschedule_requested";

            return (
              <div key={app.id} className={CARD}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  {/* Left Column: Avatar + Role + Metadata */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-xs">
                      {companyName.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/interviews/${app.id}`}
                          className="text-base font-bold text-ink hover:text-brand transition-colors no-underline line-clamp-1"
                        >
                          {roleTitle}
                        </Link>
                        <Badge tone={STATUS_TONE[iv.status] || "neutral"}>
                          {t(lang, STATUS_LABEL[iv.status] || iv.status)}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <span className="font-semibold text-ink">{companyName}</span>
                        <span>·</span>
                        <span>{roundTitle}</span>
                        {job.location && (
                          <>
                            <span>·</span>
                            <span className="text-faint">{job.location}</span>
                          </>
                        )}
                      </div>

                      {/* Date, Time & Format Pills */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2.5 py-1 font-semibold text-ink">
                          <Icon name="calendar" size={13} />
                          {formatDate(lang, iv.at)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2.5 py-1 font-medium text-ink">
                          <Icon name="clock" size={13} />
                          {formatTime(lang, iv.at)} ({iv.durationMin || 45} {t(lang, "min")})
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                          <Icon name={MODE_ICON[iv.mode] || "calendar"} size={13} />
                          {t(lang, MODE_LABEL[iv.mode] || iv.mode)}
                        </span>
                        <span className="text-[11px] font-medium text-faint">
                          ({relativeTime(lang, iv.at)})
                        </span>
                      </div>

                      {/* Interviewers info */}
                      {iv.interviewers && iv.interviewers.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-faint">
                          <Icon name="users" size={13} />
                          <span>
                            {t(lang, "Interviewer")}:{" "}
                            {iv.interviewers.map((p) => `${p.name}${p.role ? ` (${p.role})` : ""}`).join(", ")}
                          </span>
                        </div>
                      )}

                      {/* Instructions / Location notice */}
                      {iv.mode === "on-site" && iv.location && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-faint">
                          <Icon name="map-pin" size={13} />
                          <span className="line-clamp-1">{iv.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Prominent Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 max-md:justify-start max-md:border-t max-md:border-line max-md:pt-3">
                    {isInvited && (
                      <>
                        <Button variant="primary" size="sm" onClick={() => handleAccept(app.id)}>
                          <Icon name="check" size={14} /> {t(lang, "Accept")}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleOpenDecline(app)}>
                          {t(lang, "Decline")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenReschedule(app)}>
                          {t(lang, "Propose another time")}
                        </Button>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        {iv.mode === "video" && iv.meetingLink && (
                          <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Button variant="primary" size="sm">
                              <Icon name="video" size={14} /> {t(lang, "Join Meeting")}
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadIcs(iv, roleTitle, companyName)}
                          title={t(lang, "Add to calendar")}
                        >
                          <Icon name="calendar-plus" size={14} /> {t(lang, "Add to calendar")}
                        </Button>
                        <Link href="/ai-interview-prep">
                          <Button variant="ghost" size="sm" title={t(lang, "Prepare with AI")}>
                            <Icon name="sparkles" size={14} /> {t(lang, "Prepare with AI")}
                          </Button>
                        </Link>
                      </>
                    )}

                    {isReschedule && (
                      <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {t(lang, "Awaiting employer review and confirmation.")}
                      </span>
                    )}

                    <Link href={`/interviews/${app.id}`}>
                      <Button variant="ghost" size="sm">
                        {t(lang, "View Details")} <Icon name="chevron-right" size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decline Modal */}
      {declineTarget && (
        <div className={OVERLAY} role="dialog" aria-modal="true">
          <div className={MODAL}>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <strong className="text-base font-bold text-ink">
                {t(lang, "Decline this interview?")}
              </strong>
              <button
                onClick={() => setDeclineTarget(null)}
                className="text-gray-400 hover:text-ink"
              >
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
                    name="declineReason"
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
              <Button variant="ghost" size="sm" onClick={() => setDeclineTarget(null)}>
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
      {rescheduleTarget && (
        <div className={OVERLAY} role="dialog" aria-modal="true">
          <div className={MODAL}>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <strong className="text-base font-bold text-ink">
                {t(lang, "Propose New Time")}
              </strong>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="text-gray-400 hover:text-ink"
              >
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
                placeholder={t(lang, "e.g. I have a scheduled client presentation at this time...")}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRescheduleTarget(null)}>
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
