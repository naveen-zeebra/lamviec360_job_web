"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { formatDateTime } from "../../../utils/format";
import {
  listSeekerMessageThreadsStore,
  getSeekerThreadMessagesStore,
  sendSeekerThreadMessageStore,
} from "../../../lib/seekerStore";

export default function MessagesClient() {
  const [lang] = useLang();
  const searchParams = useSearchParams();
  const initialAppId = searchParams?.get("applicationId");
  const [toast, setToast] = useToast();

  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState(initialAppId ? Number(initialAppId) : null);

  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setLoadingThreads(true);
    listSeekerMessageThreadsStore()
      .then((list) => {
        const items = Array.isArray(list) ? list : [];
        setThreads(items);
        if (!selectedAppId && items.length > 0) {
          setSelectedAppId(items[0].application_id);
        }
      })
      .catch(() => setThreads([]))
      .finally(() => setLoadingThreads(false));
  }, []);

  useEffect(() => {
    if (!selectedAppId) return;
    setLoadingChat(true);
    getSeekerThreadMessagesStore(selectedAppId)
      .then((res) => {
        setActiveThread(res?.thread || null);
        setMessages(Array.isArray(res?.messages) ? res.messages : []);
        setThreads((prev) =>
          prev.map((th) =>
            Number(th.application_id) === Number(selectedAppId) ? { ...th, unread_count: 0 } : th
          )
        );
      })
      .catch((err) => setToast(err?.message || t(lang, "Could not load conversation")))
      .finally(() => setLoadingChat(false));
  }, [selectedAppId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, selectedAppId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeThread?.allow_recruiter_dm || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await sendSeekerThreadMessageStore(activeThread.application_id, draft.trim());
      if (res?.message) setMessages((prev) => [...prev, res.message]);
      if (res?.thread) {
        setActiveThread(res.thread);
        setThreads((prev) =>
          prev.map((th) =>
            Number(th.application_id) === Number(activeThread.application_id) ? res.thread : th
          )
        );
      }
      setDraft("");
    } catch (err) {
      setToast(err?.message || t(lang, "Failed to send message"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="lv-page-container">
      <div className="lv-dash-welcome" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>{t(lang, "Direct Messages")}</h1>
          <p>{t(lang, "Two-way conversations with employers on your job applications.")}</p>
        </div>
        <Link href="/settings?tab=privacy">
          <Button variant="secondary" size="sm">
            <Icon name="shield" size={14} /> {t(lang, "Contact Policy Settings")}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-line bg-card shadow-xs overflow-hidden min-h-[560px]">
        {/* Left thread list */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-line overflow-y-auto divide-y divide-line">
          {loadingThreads ? (
            <div className="p-8 text-center text-xs text-muted">{t(lang, "Loading conversations...")}</div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted space-y-2">
              <Icon name="message-square" size={26} className="mx-auto text-muted/50" />
              <p className="font-semibold text-ink">{t(lang, "No applications yet")}</p>
              <p>{t(lang, "Apply for jobs to start messaging with hiring teams.")}</p>
            </div>
          ) : (
            threads.map((th) => {
              const selected = Number(th.application_id) === Number(selectedAppId);
              return (
                <button
                  key={th.application_id}
                  type="button"
                  onClick={() => setSelectedAppId(th.application_id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    selected ? "bg-blue-50/70 border-l-4 border-l-blue-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink truncate">{th.company_name || t(lang, "Company")}</span>
                    {th.unread_count > 0 && (
                      <span className="rounded-full bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                        {th.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-blue-700 truncate mt-0.5">{th.job_title}</p>
                  <p className="text-[11px] text-muted truncate mt-1">
                    {th.last_message_preview || t(lang, "No messages yet")}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Right thread detail */}
        <div className="lg:col-span-8 flex flex-col">
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-xs text-muted">
              <Icon name="message-square" size={32} className="mb-2 text-muted/40" />
              <p>{t(lang, "Select an application to view Direct Messages.")}</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-ink truncate">{activeThread.company_name}</h2>
                  <Link href={`/applications/${activeThread.application_id}`} className="text-xs font-semibold text-blue-600 hover:underline">
                    {activeThread.job_title} · #{activeThread.application_id}
                  </Link>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  activeThread.allow_recruiter_dm
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  <Icon name={activeThread.allow_recruiter_dm ? "check-circle" : "lock"} size={12} />
                  {activeThread.allow_recruiter_dm ? t(lang, "Direct Messages Allowed") : t(lang, "Disabled in Account Policy")}
                </span>
              </div>

              {!activeThread.allow_recruiter_dm && (
                <div className="m-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <span>{t(lang, "Direct Messages are turned off in your account Privacy Policy. Enable it once to allow recruiter messages across your applications.")}</span>
                  <Link href="/settings?tab=privacy">
                    <Button type="button" size="sm" variant="primary">
                      {t(lang, "Enable in Privacy Settings")}
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[400px]">
                {loadingChat ? (
                  <p className="text-xs text-muted">{t(lang, "Loading messages...")}</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-muted">{t(lang, "No messages exchanged yet.")}</p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_role === "jobseeker";
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-900 rounded-bl-sm"
                        }`}>
                          <div className={`text-[10px] font-semibold mb-1 ${isMe ? "text-blue-100" : "text-slate-500"}`}>
                            {m.sender_name} · {m.created_at ? formatDateTime(lang, m.created_at) : ""}
                          </div>
                          <p className="m-0 whitespace-pre-wrap">{m.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {activeThread.allow_recruiter_dm && (
                <form onSubmit={handleSend} className="p-4 border-t border-line flex gap-2.5">
                  <input
                    type="text"
                    className="lv-input flex-1"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t(lang, "Reply to recruiter...")}
                  />
                  <Button type="submit" variant="primary" disabled={sending || !draft.trim()}>
                    {sending ? t(lang, "Sending...") : t(lang, "Send")}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
      <Toast msg={toast} />
    </div>
  );
}
