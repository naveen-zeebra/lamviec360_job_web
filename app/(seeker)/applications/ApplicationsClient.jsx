"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import ErrorState from "../../../components/ds/ErrorState";
import StageBadge from "../../../components/seeker/StageBadge";
import { useLang, t } from "../../../utils/lang";
import { formatDate } from "../../../utils/format";
import { JOBS } from "../../../lib/data";
import { listApplications } from "../../../lib/seekerStore";

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

export default function ApplicationsClient() {
  const [lang] = useLang();
  const [state, setState] = useState({ loading: true, error: false, data: null });
  const [filter, setFilter] = useState("active");

  const load = () => {
    try {
      setState({ loading: false, error: false, data: listApplications() });
    } catch (e) {
      setState({ loading: false, error: true, data: null });
    }
  };
  useEffect(() => {
    load();
  }, []);

  const { loading, error, data } = state;

  if (error) {
    return (
      <div className="lv-page-container">
        <ErrorState title={t(lang, "Couldn't load your applications")} desc={t(lang, "Something went wrong reading your saved data.")} onRetry={load} retryLabel={t(lang, "Try again")} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="lv-page-container">
        <Skeleton width={200} height={28} style={{ marginBottom: 8 }} />
        <Skeleton width={300} height={14} style={{ marginBottom: 24 }} />
        {[1, 2, 3].map((i) => <Skeleton key={i} height={78} style={{ marginBottom: 10 }} />)}
      </div>
    );
  }

  const counts = {
    all: data.length,
    active: data.filter((a) => !a.closed).length,
    closed: data.filter((a) => a.closed).length,
  };
  const shown = filter === "all" ? data : data.filter((a) => (filter === "active" ? !a.closed : a.closed));

  return (
    <div className="lv-page-container">
      <div className="lv-dash-welcome">
        <h1>{t(lang, "Application Tracker")}</h1>
        <p>{t(lang, "Follow the progress of every job you've applied to.")}</p>
      </div>

      {data.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className="lv-filter-chip"
              aria-pressed={filter === f.key}
              style={filter === f.key ? { background: "var(--surface-brand)", color: "#fff", borderColor: "var(--surface-brand)" } : undefined}
              onClick={() => setFilter(f.key)}
            >
              {t(lang, f.label)} ({counts[f.key]})
            </button>
          ))}
        </div>
      )}

      {shown.length ? (
        <div className="lv-tracker-list">
          {shown.map((a) => {
            const job = JOBS.find((j) => j.id === a.jobId);
            if (!job) return null;
            const title = lang === "VN" || lang === "VI" ? job.titleVi : job.title;
            return (
              <Link key={a.id} href={`/applications/${a.id}`} className="lv-tracker-card">
                <div className="lv-job-logo" style={{ width: 48, height: 48 }}>
                  {job.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="lv-tracker-card-body">
                  <strong>{title}</strong>
                  <span>{job.company} · {t(lang, "Applied")} {formatDate(lang, a.appliedDate)}</span>
                </div>
                <div className="lv-tracker-card-status">
                  <StageBadge stage={a.stage} lang={lang} />
                  {a.closed && a.stage !== "Withdrawn" && a.stage !== "Hired" && a.stage !== "Rejected" && <Badge tone="neutral">{t(lang, "Position Closed")}</Badge>}
                </div>
                <Icon name="chevron-right" size={18} style={{ color: "var(--text-tertiary)" }} />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="lv-empty">
          <h3>{data.length ? t(lang, "Nothing in this view") : t(lang, "No applications yet")}</h3>
          <p>{data.length ? t(lang, "Try a different filter.") : t(lang, "Once you apply to a job, you'll be able to track its status here.")}</p>
          <div style={{ marginTop: 20 }}>
            <Link href="/jobs">
              <Button variant="secondary">{t(lang, "Find Jobs")}</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
