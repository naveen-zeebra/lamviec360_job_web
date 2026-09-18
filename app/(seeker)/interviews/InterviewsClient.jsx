"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import ErrorState from "../../../components/ds/ErrorState";
import { useLang, t } from "../../../utils/lang";
import { formatDateTime, relativeTime } from "../../../utils/format";
import { JOBS } from "../../../lib/data";
import { listInterviews } from "../../../lib/seekerStore";

const PAGE = "mx-auto max-w-[900px] px-6 pb-24 pt-10 max-md:px-4 max-md:pb-12 max-md:pt-7";
const CARD = "block rounded-lg border border-line bg-card p-4 text-inherit no-underline shadow-xs transition-shadow hover:shadow-md hover:no-underline";
const EMPTY = "rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted [&_h3]:mb-2 [&_h3]:text-lg";

const MODE_ICON = { video: "video", phone: "phone", "on-site": "map-pin", onsite: "map-pin" };
const STATUS_TONE = { invited: "warning", confirmed: "success", declined: "error", completed: "neutral", cancelled: "neutral" };
const STATUS_LABEL = { invited: "Action needed", confirmed: "Confirmed", declined: "Declined", completed: "Completed", cancelled: "Cancelled" };

function useInterviews() {
  const [state, setState] = useState({ loading: true, error: false, data: null });
  const load = () => {
    try {
      setState({ loading: false, error: false, data: listInterviews() });
    } catch (e) {
      setState({ loading: false, error: true, data: null });
    }
  };
  useEffect(() => {
    load();
  }, []);
  return [state, load];
}

function InterviewCard({ app, lang }) {
  const job = JOBS.find((j) => j.id === app.jobId);
  const iv = app.interview;
  const isVi = lang === "VN" || lang === "VI";
  return (
    <Link href={`/interviews/${app.id}`} className={CARD}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand">
          <Icon name={MODE_ICON[iv.mode] || "calendar"} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[15px]">{job ? (isVi ? job.titleVi : job.title) : t(lang, "Interview")}</strong>
            <Badge tone={STATUS_TONE[iv.status] || "neutral"}>{t(lang, STATUS_LABEL[iv.status] || iv.status)}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted">{job ? job.company : ""} · {iv.round}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-faint">
            <Icon name="clock" size={13} /> {formatDateTime(lang, iv.at)} · {relativeTime(lang, iv.at)}
          </p>
        </div>
        <Icon name="chevron-right" size={18} />
      </div>
    </Link>
  );
}

export default function InterviewsClient() {
  const [lang] = useLang();
  const [{ loading, error, data }, reload] = useInterviews();

  if (error) {
    return (
      <div className={PAGE}>
        <ErrorState title={t(lang, "Couldn't load your interviews")} desc={t(lang, "Something went wrong reading your saved data.")} onRetry={reload} retryLabel={t(lang, "Try again")} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={PAGE}>
        <Skeleton width={160} height={28} style={{ marginBottom: 24 }} />
        {[1, 2, 3].map((i) => <Skeleton key={i} height={92} style={{ marginBottom: 12 }} />)}
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const closed = ["declined", "cancelled", "completed"];
  const upcoming = data.filter((a) => a.interview.at.slice(0, 10) >= today && !closed.includes(a.interview.status));
  const past = data.filter((a) => !upcoming.includes(a));

  return (
    <div className={PAGE}>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">{t(lang, "Interviews")}</h1>
        <p className="mt-1 text-base text-muted">{t(lang, "Invitations, confirmed interviews and past rounds.")}</p>
      </div>

      {data.length === 0 ? (
        <div className={EMPTY}>
          <h3>{t(lang, "No interviews scheduled yet")}</h3>
          <p>{t(lang, "When an employer invites you to interview, it will show up here.")}</p>
          <div className="mt-4">
            <Link href="/applications"><Button variant="secondary">{t(lang, "View applications")}</Button></Link>
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-bold">{t(lang, "Upcoming")}</h2>
              <div className="flex flex-col gap-3">
                {upcoming.map((a) => <InterviewCard key={a.id} app={a} lang={lang} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">{t(lang, "Past & closed")}</h2>
              <div className="flex flex-col gap-3">
                {past.map((a) => <InterviewCard key={a.id} app={a} lang={lang} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
