"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import ErrorState from "../../../components/ds/ErrorState";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { formatDate, relativeTime, formatBytes } from "../../../utils/format";
import {
  getResumes,
  saveResume,
  removeResume,
  setDefaultResume,
  refreshResumesFromApi,
  getSettings,
  getCertifications,
  MAX_PROFILE_RESUMES,
  MAX_RESUME_ERROR,
} from "../../../lib/seekerStore";

const PAGE = "mx-auto max-w-[1000px] px-6 pb-24 pt-10 max-md:px-4 max-md:pb-12 max-md:pt-7";
const CARD = "rounded-lg border border-line bg-card p-6 shadow-sm max-md:p-5";
const EMPTY = "rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted [&_h3]:mb-2 [&_h3]:text-lg";
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

const ACCEPT = ".pdf,.doc,.docx";
const ALLOWED_EXT = ["pdf", "doc", "docx"];
const MAX_BYTES = 5 * 1024 * 1024;
const STORE_BYTES = 2 * 1024 * 1024;

function useResumeData() {
  const [state, setState] = useState({ loading: true, error: false, data: null });
  const load = async () => {
    try {
      const resumes = await refreshResumesFromApi();
      setState({
        loading: false,
        error: false,
        data: { resumes, settings: getSettings(), certifications: getCertifications() },
      });
    } catch (e) {
      setState({ loading: false, error: true, data: null });
    }
  };
  useEffect(() => {
    load();
  }, []);
  return [state, load, setState];
}

function previewMeta(resume) {
  const href = resume?.dataUrl || resume?.fileUrl || "";
  const isImage = /^image\//.test(resume?.type || "") || /\.(jpe?g|png)$/i.test(resume?.fileName || "");
  const isPdf = resume?.type === "application/pdf" || /\.pdf$/i.test(resume?.fileName || "");
  const canPreview = !!href && (isImage || isPdf) && (href.startsWith("data:") || href.startsWith("http") || href.startsWith("/"));
  return { href, isImage, isPdf, canPreview };
}

export default function ResumeClient() {
  const [lang] = useLang();
  const [{ loading, error, data }, reload, setState] = useResumeData();
  const [toast, setToast] = useToast();
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [uploadErr, setUploadErr] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const fileRef = useRef(null);

  const setResumes = (resumes) => setState((s) => ({ ...s, data: { ...s.data, resumes } }));

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploadErr("");
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setUploadErr(t(lang, "Unsupported format. Allowed formats: PDF, DOC, and DOCX only"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadErr(t(lang, "File size must not exceed 5 MB"));
      return;
    }
    const finish = async (dataUrl) => {
      try {
        await saveResume({ fileName: file.name, size: file.size, type: file.type, dataUrl: dataUrl || "", file });
        const list = getResumes();
        setResumes(list);
        setSelectedId(list[list.length - 1]?.id || list.find((r) => r.isDefault)?.id || null);
        setConfirmRemoveId(null);
        setToast(t(lang, "Résumé saved"));
      } catch (err) {
        setUploadErr(t(lang, err.message || MAX_RESUME_ERROR));
      }
    };
    if (file.size <= STORE_BYTES) {
      const reader = new FileReader();
      reader.onload = () => finish(reader.result);
      reader.onerror = () => finish("");
      reader.readAsDataURL(file);
    } else {
      finish("");
    }
  };

  const onRemove = async (id) => {
    await removeResume(id);
    const list = getResumes();
    setResumes(list);
    setConfirmRemoveId(null);
    if (String(selectedId) === String(id)) {
      setSelectedId(list.find((r) => r.isDefault)?.id || list[0]?.id || null);
    }
    setToast(t(lang, "Résumé removed"));
  };

  if (error) {
    return (
      <div className={PAGE}>
        <ErrorState title={t(lang, "Couldn't load your résumé")} desc={t(lang, "Something went wrong reading your saved data.")} onRetry={reload} retryLabel={t(lang, "Try again")} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={PAGE}>
        <Skeleton width={180} height={28} style={{ marginBottom: 24 }} />
        <Skeleton height={140} style={{ marginBottom: 20 }} />
        <Skeleton height={360} />
      </div>
    );
  }

  const resumes = data.resumes || [];
  const { settings } = data;
  const atCap = resumes.length >= MAX_PROFILE_RESUMES;
  const selected = resumes.find((r) => String(r.id) === String(selectedId)) || resumes.find((r) => r.isDefault) || resumes[0] || null;
  const { href, isImage, isPdf, canPreview } = previewMeta(selected);

  return (
    <div className={PAGE}>
      <input ref={fileRef} type="file" accept={ACCEPT} onChange={onFile} className="hidden" aria-hidden="true" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/settings" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold no-underline">
            <Icon name="arrow-left" size={14} /> {t(lang, "Back to Settings")}
          </Link>
          <h1 className="text-2xl font-extrabold">{t(lang, "My Resume")}</h1>
          <p className="mt-1 text-base text-muted">{t(lang, "Save up to 5 résumés and choose which one employers see when you apply.")}</p>
        </div>
        <span className="rounded-full bg-sunken px-3 py-1 text-sm font-semibold text-ink">
          {resumes.length} / {MAX_PROFILE_RESUMES}
        </span>
      </div>

      {resumes.length === 0 ? (
        <div className={EMPTY}>
          <h3>{t(lang, "No resume on file yet")}</h3>
          <p>{t(lang, "PDF, DOC, DOCX only. Max 5MB")}</p>
          <div className="mt-4">
            <Button variant="primary" onClick={() => fileRef.current && fileRef.current.click()}>
              <Icon name="upload" size={16} /> {t(lang, "Upload resume")}
            </Button>
          </div>
          {uploadErr && <p className="mt-3 text-sm text-danger-fg">{uploadErr}</p>}
        </div>
      ) : (
        <>
          <div className={`${CARD} mb-5`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className={LABEL} style={{ marginBottom: 0 }}>{t(lang, "Saved résumés")}</span>
              <Button
                variant="primary"
                size="sm"
                disabled={atCap}
                onClick={() => fileRef.current && fileRef.current.click()}
              >
                <Icon name="plus" size={14} /> {t(lang, "Add résumé")}
              </Button>
            </div>
            {atCap && (
              <p className="mb-3 text-sm text-muted">{t(lang, MAX_RESUME_ERROR)}</p>
            )}
            {uploadErr && <p className="mb-3 text-sm text-danger-fg">{uploadErr}</p>}
            <div className="flex flex-col gap-2.5">
              {resumes.map((resume) => {
                const active = selected && String(selected.id) === String(resume.id);
                return (
                  <div
                    key={resume.id}
                    className={`rounded-md border p-3 ${active ? "border-brand bg-brand-subtle" : "border-line bg-sunken"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(resume.id)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand">
                        <Icon name="file-text" size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="block break-words text-sm">{resume.fileName}</strong>
                        <span className="text-xs text-faint">
                          {[formatBytes(resume.size), resume.uploadedAt && `${t(lang, "uploaded")} ${formatDate(lang, resume.uploadedAt)} (${relativeTime(lang, resume.uploadedAt)})`]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        {resume.isDefault && (
                          <span className="ml-2 inline-block rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-white">{t(lang, "Default")}</span>
                        )}
                      </div>
                    </button>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!resume.isDefault && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            await setDefaultResume(resume.id);
                            setResumes(getResumes());
                            setToast(t(lang, "Default résumé updated"));
                          }}
                        >
                          {t(lang, "Set as default")}
                        </Button>
                      )}
                      {resume.dataUrl && (
                        <a href={resume.dataUrl} download={resume.fileName}>
                          <Button variant="secondary" size="sm"><Icon name="download" size={15} /> {t(lang, "Download")}</Button>
                        </a>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveId(resume.id)}>
                        <Icon name="trash-2" size={15} /> {t(lang, "Remove")}
                      </Button>
                    </div>
                    {String(confirmRemoveId) === String(resume.id) && (
                      <div className="mt-3 flex flex-col items-start gap-2.5 rounded-md border border-red-100 bg-danger-bg px-4 py-3 text-sm text-danger-fg" role="alert">
                        <span>{t(lang, "Remove this résumé? Employers won't see it until you upload another.")}</span>
                        <div className="flex gap-2.5">
                          <Button variant="danger" size="sm" onClick={() => onRemove(resume.id)}>{t(lang, "Remove résumé")}</Button>
                          <Button variant="secondary" size="sm" onClick={() => setConfirmRemoveId(null)}>{t(lang, "Cancel")}</Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${CARD} mb-5`}>
            <span className={LABEL}>{t(lang, "Preview")}</span>
            {selected && canPreview ? (
              isPdf ? (
                <iframe title={t(lang, "Résumé preview")} src={href} className="h-[560px] w-full rounded-md border border-line bg-sunken max-md:h-[420px]" />
              ) : isImage ? (
                <img src={href} alt={t(lang, "Résumé preview")} className="mx-auto max-h-[560px] rounded-md border border-line" />
              ) : null
            ) : (
              <div className="rounded-md border border-dashed border-line bg-sunken px-6 py-12 text-center text-sm text-muted">
                <Icon name="file-search" size={26} />
                <p className="mt-2">{t(lang, "Preview isn't available for this file.")}</p>
                {href && (
                  <a href={href} download={selected?.fileName} className="mt-3 inline-block">
                    <Button variant="secondary" size="sm">{t(lang, "Download to view")}</Button>
                  </a>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <div className={CARD}>
        <span className={LABEL}>{t(lang, "Résumé visibility")}</span>
        <p className="text-sm text-muted">
          {t(lang, "Current setting")}: <strong className="text-ink">{t(lang, settings.privacy.resumeVisibility)}</strong>
        </p>
        <Link href="/settings?tab=privacy" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold no-underline">
          {t(lang, "Change in Privacy settings")} <Icon name="arrow-right" size={14} />
        </Link>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
