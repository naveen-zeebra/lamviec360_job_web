"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../../../components/ds";
import JobRow from "../../../components/jobs/JobRow";
import Skeleton from "../../../components/ds/Skeleton";
import ErrorState from "../../../components/ds/ErrorState";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { JOBS } from "../../../lib/data";
import { listSavedJobs, toggleSavedJob } from "../../../lib/seekerStore";

export default function SavedJobsClient() {
  const [lang] = useLang();
  const [state, setState] = useState({ loading: true, error: false, ids: null });
  const [toast, setToast] = useToast();

  const load = () => {
    try {
      setState({ loading: false, error: false, ids: listSavedJobs() });
    } catch (e) {
      setState({ loading: false, error: true, ids: null });
    }
  };
  useEffect(() => {
    load();
  }, []);

  const { loading, error, ids } = state;

  if (error) {
    return (
      <div className="lv-page-container">
        <ErrorState title={t(lang, "Couldn't load saved jobs")} desc={t(lang, "Something went wrong reading your saved data.")} onRetry={load} retryLabel={t(lang, "Try again")} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="lv-page-container">
        <Skeleton width={160} height={28} style={{ marginBottom: 8 }} />
        <Skeleton width={280} height={14} style={{ marginBottom: 24 }} />
        {[1, 2, 3].map((i) => <Skeleton key={i} height={150} style={{ marginBottom: 14 }} />)}
      </div>
    );
  }

  const jobs = ids
    .map((item) => {
      if (typeof item === "object") return item;
      return JOBS.find((j) => String(j.id) === String(item));
    })
    .filter(Boolean);

  const unsave = (jobId) => {
    toggleSavedJob(jobId);
    setState((s) => ({
      ...s,
      ids: s.ids.filter((item) => {
        const itemId = typeof item === "object" ? item.id : item;
        return String(itemId) !== String(jobId);
      }),
    }));
    setToast(t(lang, "Removed from saved jobs"));
  };

  return (
    <div className="lv-page-container">
      <div className="lv-dash-welcome">
        <h1>{t(lang, "Saved Jobs")}</h1>
        <p>
          {jobs.length
            ? `${jobs.length} ${t(lang, jobs.length === 1 ? "saved job" : "saved jobs")}`
            : t(lang, "Jobs you've bookmarked to review or apply to later.")}
        </p>
      </div>

      {jobs.length ? (
        <div className="lv-job-list">
          {jobs.map((j) => (
            <JobRow key={j.id} job={j} lang={lang} saved onSave={() => unsave(j.id)} />
          ))}
        </div>
      ) : (
        <div className="lv-empty">
          <h3>{t(lang, "No saved jobs yet")}</h3>
          <p>{t(lang, "Tap the heart icon on any job to save it here.")}</p>
          <div style={{ marginTop: 20 }}>
            <Link href="/jobs">
              <Button variant="secondary">{t(lang, "Find Jobs")}</Button>
            </Link>
          </div>
        </div>
      )}
      <Toast msg={toast} />
    </div>
  );
}
