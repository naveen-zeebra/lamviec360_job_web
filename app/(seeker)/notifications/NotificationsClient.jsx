"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import ErrorState from "../../../components/ds/ErrorState";
import { useLang, t } from "../../../utils/lang";
import { relativeTime } from "../../../utils/format";
import { listNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "../../../lib/seekerStore";

const TYPE_ICON = {
  confirmation: "send",
  cv_view: "eye",
  status: "list-checks",
  interview: "calendar",
  offer: "gift",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "interview", label: "Interviews" },
  { key: "status", label: "Status" },
  { key: "offer", label: "Offers" },
];

function linkFor(n) {
  if (n.type === "cv_view") return "/resume";
  if (n.applicationId) return n.type === "interview" ? `/interviews/${n.applicationId}` : `/applications/${n.applicationId}`;
  if (n.type === "interview") return "/interviews";
  return null;
}

export default function NotificationsClient() {
  const [lang] = useLang();
  const router = useRouter();
  const [state, setState] = useState({ loading: true, error: false, data: null });
  const [filter, setFilter] = useState("all");

  const load = () => {
    try {
      setState({ loading: false, error: false, data: listNotifications() });
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
        <ErrorState title={t(lang, "Couldn't load notifications")} desc={t(lang, "Something went wrong reading your saved data.")} onRetry={load} retryLabel={t(lang, "Try again")} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="lv-page-container">
        <Skeleton width={180} height={28} style={{ marginBottom: 8 }} />
        <Skeleton width={320} height={14} style={{ marginBottom: 24 }} />
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={74} style={{ marginBottom: 10 }} />)}
      </div>
    );
  }

  const open = (n) => {
    markNotificationRead(n.id);
    setState((s) => ({ ...s, data: s.data.map((x) => (x.id === n.id ? { ...x, read: true } : x)) }));
    const href = linkFor(n);
    if (href) router.push(href);
  };

  const remove = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
    setState((s) => ({ ...s, data: s.data.filter((x) => x.id !== id) }));
  };

  const markAll = () => {
    markAllNotificationsRead();
    setState((s) => ({ ...s, data: s.data.map((x) => ({ ...x, read: true })) }));
  };

  const shown = filter === "all" ? data : data.filter((n) => n.type === filter);
  const unread = data.filter((n) => !n.read).length;

  return (
    <div className="lv-page-container">
      <div className="lv-dash-welcome">
        <h1>{t(lang, "Notifications")}</h1>
        <p>{t(lang, "Application confirmations, status changes, interview invitations and offers.")}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className="lv-filter-chip"
              aria-pressed={filter === f.key}
              style={filter === f.key ? { background: "var(--surface-brand)", color: "#fff", borderColor: "var(--surface-brand)" } : undefined}
              onClick={() => setFilter(f.key)}
            >
              {t(lang, f.label)}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAll}>
            <Icon name="check-check" size={15} /> {t(lang, "Mark all as read")}
          </Button>
        )}
      </div>

      {shown.length ? (
        <div className="lv-notif-list">
          {shown.map((n) => {
            const href = linkFor(n);
            return (
              <div
                key={n.id}
                className={`lv-notif-row ${n.read ? "" : "unread"}`}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => open(n)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open(n)}
              >
                <span className="lv-notif-icon">
                  <Icon name={TYPE_ICON[n.type] || "bell"} size={18} />
                </span>
                <span className="lv-notif-body">
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                  <em>{relativeTime(lang, n.date)}{href ? ` · ${t(lang, "Tap to view")}` : ""}</em>
                </span>
                {!n.read && <span className="lv-notif-dot" aria-label={t(lang, "Unread")} />}
                <button
                  className="lv-job-save"
                  aria-label={t(lang, "Dismiss")}
                  onClick={(e) => remove(e, n.id)}
                  style={{ marginLeft: 4 }}
                >
                  <Icon name="x" size={16} style={{ color: "var(--gray-400)" }} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="lv-empty">
          <h3>{t(lang, "Nothing here yet")}</h3>
          <p>{t(lang, "Updates about your applications and interviews will show up here.")}</p>
        </div>
      )}
    </div>
  );
}
