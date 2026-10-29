"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import ErrorState from "../../../components/ds/ErrorState";
import StageBadge from "../../../components/seeker/StageBadge";
import { useLang, t } from "../../../utils/lang";
import { formatDateTime } from "../../../utils/format";
import { FILTER_VI } from "../../../lib/data";
import { fetchPublicJobs } from "../../../lib/api/publicApi";
import {
  getProfile,
  listApplications,
  listSavedJobs,
  listNotifications,
  computeCompleteness,
  getProfileCompletenessDetails,
  updateJobAvailability,
  syncSeekerWithBackend,
} from "../../../lib/seekerStore";

const PAGE = "mx-auto max-w-[1200px] px-6 pb-24 pt-10 max-md:px-4 max-md:pb-12 max-md:pt-7";
const STAT = "flex flex-col gap-1 rounded-md bg-sunken p-4 text-inherit no-underline transition-shadow hover:shadow-sm hover:no-underline";
const SECTION_HEAD = "mb-4 flex items-center justify-between";
const SECTION_H2 = "text-lg font-bold";
const VIEW_LINK = "flex items-center gap-1 text-sm font-semibold no-underline";
const ROW = "flex items-center gap-3 rounded-md border border-line p-2.5 text-inherit no-underline";
const EMPTY = "rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted [&_h3]:mb-2 [&_h3]:text-lg";

function readDashboardData() {
  const profile = getProfile();
  const applications = listApplications();
  const savedJobs = listSavedJobs();
  const notifications = listNotifications();
  const compDetails = getProfileCompletenessDetails(profile);
  return {
    profile,
    applications,
    savedJobs,
    notifications,
    completeness: compDetails.completeness,
    missingFields: compDetails.missingFields,
  };
}

function useDashboardData() {
  const [state, setState] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return { loading: false, error: false, data: readDashboardData() };
      }
    } catch { }
    return { loading: false, error: false, data: null };
  });

  const load = () => {
    try {
      setState({ loading: false, error: false, data: readDashboardData() });
    } catch (e) {
      setState({ loading: false, error: true, data: null });
    }
  };

  useEffect(() => {
    load();
    // Synchronize latest profile data from backend on dashboard mount
    syncSeekerWithBackend().then(() => load()).catch(() => { });

    if (typeof window !== "undefined") {
      window.addEventListener("lv360-store", load);
      return () => window.removeEventListener("lv360-store", load);
    }
  }, []);

  return [state, load];
}

/**
 * Interactive Live Job Availability Badge with quick-switch popover
 */
function LiveAvailabilityBadge({ availability = "open_to_work", lang, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const currentKey = availability || "open_to_work";

  const statusConfigs = {
    open_to_work: {
      key: "open_to_work",
      label: t(lang, "Open to Work"),
      subLabel: t(lang, "Actively looking & interviewing for new roles"),
      emoji: "🟢",
      dotClass: "bg-emerald-500",
      pingClass: "bg-emerald-400",
      badgeStyle: {
        background: "#ecfdf5",
        borderColor: "#a7f3d0",
        color: "#065f46",
      },
      activeCardClass: "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200",
    },
    open_to_opportunities: {
      key: "open_to_opportunities",
      label: t(lang, "Open to Relevant Opportunities"),
      subLabel: t(lang, "Open to hearing about tailored career matches"),
      emoji: "🟡",
      dotClass: "bg-amber-500",
      pingClass: "bg-amber-400",
      badgeStyle: {
        background: "#fffbeb",
        borderColor: "#fde68a",
        color: "#92400e",
      },
      activeCardClass: "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200",
    },
    not_looking: {
      key: "not_looking",
      label: t(lang, "Not Looking"),
      subLabel: t(lang, "Satisfied in current role; hides profile from recruiter searches"),
      emoji: "🔴",
      dotClass: "bg-rose-500",
      pingClass: "bg-rose-400",
      badgeStyle: {
        background: "#fef2f2",
        borderColor: "#fecaca",
        color: "#991b1b",
      },
      activeCardClass: "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200",
    },
  };

  const currentConfig = statusConfigs[currentKey] || statusConfigs.open_to_work;

  const handleSelect = async (optKey) => {
    if (optKey === currentKey || saving) return;
    try {
      setSaving(true);
      await updateJobAvailability(optKey);
      setJustSaved(true);
      if (onUpdated) onUpdated();
      setTimeout(() => {
        setJustSaved(false);
        setOpen(false);
      }, 550);
    } catch (err) {
      console.warn("Failed to update availability status:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer select-none"
        style={currentConfig.badgeStyle}
        aria-expanded={open}
        aria-haspopup="true"
        title={t(lang, "Click to change your availability status (takes effect immediately)")}
      >
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${currentConfig.pingClass}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${currentConfig.dotClass}`} />
        </span>

        <span className="font-bold tracking-tight text-inherit">
          {currentConfig.label}
        </span>

        <span className="rounded-full bg-white/80 dark:bg-black/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider opacity-85 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
          Live
        </span>

        <Icon
          name="chevron-down"
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : "group-hover:translate-y-0.5"}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2.5 w-84 sm:w-96 rounded-2xl border border-line bg-card p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="mb-2.5 flex items-center justify-between border-b border-line px-1 pb-2.5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                {t(lang, "Availability Status")}
              </p>
              <p className="text-[11px] text-faint">
                {t(lang, "Changes take effect immediately")}
              </p>
            </div>
            {justSaved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Icon name="check" size={11} /> {t(lang, "Saved")}
              </span>
            ) : saving ? (
              <span className="text-[10px] font-semibold text-muted animate-pulse">
                {t(lang, "Saving...")}
              </span>
            ) : null}
          </div>

          <div className="space-y-1.5">
            {Object.values(statusConfigs).map((opt) => {
              const isSelected = opt.key === currentKey;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelect(opt.key)}
                  disabled={saving}
                  className={`flex w-full items-start gap-3 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${isSelected
                    ? `${opt.activeCardClass} shadow-sm font-semibold`
                    : "border-transparent hover:border-line hover:bg-sunken text-ink"
                    }`}
                >
                  <span className="mt-0.5 text-base leading-none select-none">{opt.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-inherit">{opt.label}</span>
                      {isSelected && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          <Icon name="check" size={14} />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted leading-tight">{opt.subLabel}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-line pt-2.5 px-1 flex items-center justify-between">
            <span className="text-[10px] text-faint">{t(lang, "Inactive Policy (12 Months)")}</span>
            <Link
              href="/settings?tab=privacy"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand transition hover:underline no-underline"
            >
              <span>{t(lang, "All Privacy Settings")}</span>
              <Icon name="chevron-right" size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardClient() {
  const [lang] = useLang();
  const [{ loading, error, data }, reload] = useDashboardData();
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    async function loadRecommended() {
      try {
        const jobs = await fetchPublicJobs({ page_size: 4 });
        if (Array.isArray(jobs)) {
          setRecommended(jobs);
        }
      } catch (err) {
        console.warn("Failed to load recommended jobs", err);
      }
    }
    loadRecommended();
  }, []);

  if (error) {
    return (
      <div className={PAGE}>
        <ErrorState title={t(lang, "Couldn't load your dashboard")} desc={t(lang, "Something went wrong reading your saved data.")} onRetry={reload} retryLabel={t(lang, "Try again")} />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className={PAGE}>
        <div className="mb-6 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={STAT}>
              <Skeleton width={60} height={12} />
              <Skeleton width={40} height={26} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
        <Skeleton height={120} style={{ marginBottom: 24 }} />
        <Skeleton height={220} />
      </div>
    );
  }

  const { profile, applications, savedJobs, notifications, completeness, missingFields } = data;
  const interviews = applications.filter((a) => a.stage === "Interview Scheduled");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isVi = lang === "VN" || lang === "VI";

  return (
    <div className={PAGE}>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1.5 text-2xl font-extrabold">
            {t(lang, "Welcome back")}
            {profile.personal.fullName ? `, ${profile.personal.fullName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-base text-muted">{t(lang, "Here's what's happening with your job search.")}</p>
        </div>

        {/* Interactive Live Job Availability Badge */}
        <LiveAvailabilityBadge
          availability={profile.jobAvailability}
          lang={lang}
          onUpdated={reload}
        />
      </div>

      <div className="mb-6 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        <Link href="/dashboard#recommended" className={STAT}>
          <span className="text-xs text-faint">{t(lang, "Recommended Jobs")}</span>
          <strong className="text-2xl leading-[1.1] font-bold">{recommended.length}</strong>
        </Link>
        <Link href="/applications" className={STAT}>
          <span className="text-xs text-faint">{t(lang, "Applications")}</span>
          <strong className="text-2xl leading-[1.1] font-bold">{applications.length}</strong>
        </Link>
        <Link href="/interviews" className={STAT}>
          <span className="text-xs text-faint">{t(lang, "Interviews")}</span>
          <strong className="text-2xl leading-[1.1] font-bold">{interviews.length}</strong>
        </Link>
        <Link href="/saved-jobs" className={STAT}>
          <span className="text-xs text-faint">{t(lang, "Saved Jobs")}</span>
          <strong className="text-2xl leading-[1.1] font-bold">{savedJobs.length}</strong>
        </Link>
      </div>

      {completeness < 100 && (
        <div className={`mb-8 rounded-lg border p-5 ${completeness < 60 ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20" : "border-line bg-card"}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[200px] flex-1">
              <div className="mb-2 flex justify-between items-center">
                <div>
                  <strong>{t(lang, "Profile Completion")}</strong>
                  {completeness < 60 ? (
                    <span className="ml-2 inline-flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400">
                      ⚠️ {t(lang, "Need ≥60% to apply for jobs")}
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ {t(lang, "Eligible to apply for jobs (≥60%)")}
                    </span>
                  )}
                </div>
                <span className="font-bold text-base">{completeness}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-pill bg-sunken">
                <i className={`block h-full rounded-pill transition-all duration-300 ${completeness < 60 ? "bg-amber-500" : "bg-brand"}`} style={{ width: `${completeness}%` }} />
              </div>
            </div>
            <Link href="/settings?tab=profile">
              <Button variant={completeness < 60 ? "primary" : "secondary"} size="sm">
                {t(lang, "Complete Profile")}
              </Button>
            </Link>
          </div>

          {missingFields && missingFields.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-line/60">
              <span className="text-xs font-semibold text-muted block mb-2">
                {isVi
                  ? `Cần hoàn thiện thêm ${missingFields.length} mục để đạt 100% hồ sơ:`
                  : `Add these ${missingFields.length} item${missingFields.length > 1 ? "s" : ""} to reach 100% profile score:`}
              </span>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((field) => (
                  <Link
                    key={field.key}
                    href="/settings?tab=profile"
                    className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1 text-xs font-medium text-ink hover:bg-brand-subtle hover:text-brand transition-colors no-underline border border-line/50"
                  >
                    <span className="text-amber-500 font-bold">+</span>
                    <span>{isVi ? field.labelVi : field.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <section id="recommended" className="mb-8">
        <div className={SECTION_HEAD}>
          <h2 className={SECTION_H2}>{t(lang, "Recommended for you")}</h2>
          <Link href="/jobs" className={VIEW_LINK}>
            {t(lang, "View all")} <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        {recommended.length ? (
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {recommended.map((j) => {
              const compName =
                typeof j.company === "string"
                  ? j.company
                  : j.company_name || j.company?.company_name || "Company";
              return (
                <Link key={j.id} href={`/job-detail/${encodeURIComponent((j.title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + j.id)}`} className="flex items-center gap-3 rounded-md border border-line bg-card p-3.5 text-inherit no-underline hover:shadow-sm hover:no-underline">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
                    {compName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm">{isVi && j.titleVi ? j.titleVi : j.title}</strong>
                    <span className="text-xs text-faint">{compName} · {isVi && j.locationVi ? j.locationVi : j.city || j.location}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={EMPTY}>
            <h3>{t(lang, "No recommendations yet")}</h3>
            <p>{t(lang, "Complete your profile so we can match you with relevant jobs.")}</p>
            <div className="mt-4">
              <Link href="/settings?tab=profile"><Button variant="secondary">{t(lang, "Complete Profile")}</Button></Link>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1">
        <section className="mb-8">
          <div className={SECTION_HEAD}>
            <h2 className={SECTION_H2}>{t(lang, "Recent Applications")}</h2>
            <Link href="/applications" className={VIEW_LINK}>
              {t(lang, "View all")} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          {applications.length ? (
            <div className="flex flex-col gap-2.5">
              {applications.slice(0, 4).map((a) => {
                const job = a.job;
                if (!job) return null;
                const companyName = job.company_name || "Unknown";
                return (
                  <Link key={a.id} href={`/applications/${a.id}`} className={ROW}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
                      {companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <strong className="text-[13px]">{isVi && job.titleVi ? job.titleVi : job.title}</strong>
                      <span className="text-xs text-faint">{companyName} · {a.appliedDate || a.applied_at}</span>
                    </div>
                    <StageBadge stage={a.stage} lang={lang} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={EMPTY}>
              <h3>{t(lang, "No applications yet")}</h3>
              <p>{t(lang, "Find a role you like and apply in a few clicks.")}</p>
              <div className="mt-4">
                <Link href="/jobs">
                  <Button variant="secondary">{t(lang, "Find Jobs")}</Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="mb-8 hidden">
          <div className={SECTION_HEAD}>
            <h2 className={SECTION_H2}>{t(lang, "Upcoming Interviews")}</h2>
          </div>
          {interviews.length ? (
            <div className="flex flex-col gap-2.5">
              {interviews.map((a) => {
                const job = a.job;
                if (!job) return null;
                const at = (a.interview && a.interview.at) || a.interviewAt;
                const companyName = job.company_name || "Unknown";
                return (
                  <Link key={a.id} href={`/interviews/${a.id}`} className={ROW}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand">
                      <Icon name="calendar" size={16} />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <strong className="text-[13px]">{isVi && job.titleVi ? job.titleVi : job.title}</strong>
                      <span className="text-xs text-faint">{companyName} · {at ? formatDateTime(lang, at) : a.appliedDate || a.applied_at}</span>
                    </div>
                    <Icon name="chevron-right" size={16} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={EMPTY}>
              <h3>{t(lang, "No interviews scheduled")}</h3>
              <p>{t(lang, "Interview invitations will appear here.")}</p>
            </div>
          )}

          <div className={`${SECTION_HEAD} mt-7`}>
            <h2 className={SECTION_H2}>{t(lang, "Notifications")}</h2>
            <Link href="/notifications" className={VIEW_LINK}>
              {unreadCount > 0 ? `${unreadCount} ${t(lang, "new")}` : t(lang, "View all")} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          {notifications.length ? (
            <div className="flex flex-col">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="flex items-start gap-2.5 border-b border-line py-2.5 last:border-0">
                  {!n.read && <span className="mt-[5px] h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" aria-label={t(lang, "Unread")} />}
                  <div>
                    <strong className="block text-[13px]">{n.title}</strong>
                    <p className="mt-0.5 text-xs text-faint">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={EMPTY}>
              <h3>{t(lang, "No notifications")}</h3>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
