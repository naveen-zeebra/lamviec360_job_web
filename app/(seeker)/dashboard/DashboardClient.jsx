"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import ErrorState from "../../../components/ds/ErrorState";
import StageBadge from "../../../components/seeker/StageBadge";
import { useLang, t } from "../../../utils/lang";
import { formatDateTime } from "../../../utils/format";
import { JOBS, FILTER_VI } from "../../../lib/data";
import { getProfile, listApplications, listSavedJobs, listNotifications, computeCompleteness } from "../../../lib/seekerStore";

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
  const completeness = computeCompleteness(profile);
  const recommended = JOBS.filter(
    (j) => (profile.professional?.industry && j.industry === profile.professional.industry) || (profile.personal?.location && j.location === profile.personal.location)
  ).slice(0, 4);
  return { profile, applications, savedJobs, notifications, completeness, recommended };
}

function useDashboardData() {
  const [state, setState] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return { loading: false, error: false, data: readDashboardData() };
      }
    } catch {}
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
    if (typeof window !== "undefined") {
      window.addEventListener("lv360-store", load);
      return () => window.removeEventListener("lv360-store", load);
    }
  }, []);

  return [state, load];
}

export default function DashboardClient() {
  const [lang] = useLang();
  const [{ loading, error, data }, reload] = useDashboardData();

  if (error) {
    return (
      <div className={PAGE}>
        <ErrorState title={t(lang, "Couldn't load your dashboard")} desc={t(lang, "Something went wrong reading your saved data.")} onRetry={reload} retryLabel={t(lang, "Try again")} />
      </div>
    );
  }

  if (loading) {
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

  const { profile, applications, savedJobs, notifications, completeness, recommended } = data;
  const interviews = applications.filter((a) => a.stage === "Interview Scheduled");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isVi = lang === "VN" || lang === "VI";

  return (
    <div className={PAGE}>
      <div className="mb-7">
        <h1 className="mb-1.5 text-2xl font-extrabold">
          {t(lang, "Welcome back")}
          {profile.personal.fullName ? `, ${profile.personal.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-base text-muted">{t(lang, "Here's what's happening with your job search.")}</p>
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
        <div className="mb-8 flex flex-wrap items-center gap-5 rounded-lg border border-line bg-card p-5">
          <div className="min-w-[200px] flex-1">
            <div className="mb-2 flex justify-between">
              <strong>{t(lang, "Profile Completion")}</strong>
              <span>{completeness}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-pill bg-sunken">
              <i className="block h-full rounded-pill bg-brand" style={{ width: `${completeness}%` }} />
            </div>
          </div>
          <Link href="/settings?tab=profile">
            <Button variant="primary" size="sm">
              {t(lang, "Complete Profile")}
            </Button>
          </Link>
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
            {recommended.map((j) => (
              <Link key={j.id} href={`/job-detail?id=${j.id}`} className="flex items-center gap-3 rounded-md border border-line bg-card p-3.5 text-inherit no-underline hover:shadow-sm hover:no-underline">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
                  {j.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm">{isVi ? j.titleVi : j.title}</strong>
                  <span className="text-xs text-faint">{j.company} · {isVi ? j.locationVi : j.location}</span>
                </div>
              </Link>
            ))}
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
                const job = JOBS.find((j) => j.id === a.jobId);
                if (!job) return null;
                return (
                  <Link key={a.id} href={`/applications/${a.id}`} className={ROW}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <strong className="text-[13px]">{isVi ? job.titleVi : job.title}</strong>
                      <span className="text-xs text-faint">{job.company} · {a.appliedDate}</span>
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

        <section className="mb-8">
          <div className={SECTION_HEAD}>
            <h2 className={SECTION_H2}>{t(lang, "Upcoming Interviews")}</h2>
          </div>
          {interviews.length ? (
            <div className="flex flex-col gap-2.5">
              {interviews.map((a) => {
                const job = JOBS.find((j) => j.id === a.jobId);
                if (!job) return null;
                const at = (a.interview && a.interview.at) || a.interviewAt;
                return (
                  <Link key={a.id} href={`/interviews/${a.id}`} className={ROW}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand">
                      <Icon name="calendar" size={16} />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <strong className="text-[13px]">{isVi ? job.titleVi : job.title}</strong>
                      <span className="text-xs text-faint">{job.company} · {at ? formatDateTime(lang, at) : a.appliedDate}</span>
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
