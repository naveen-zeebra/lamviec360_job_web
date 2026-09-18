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
import { getResume, saveResume, removeResume, getSettings } from "../../../lib/seekerStore";

const PAGE = "mx-auto max-w-[1000px] px-6 pb-24 pt-10 max-md:px-4 max-md:pb-12 max-md:pt-7";
const CARD = "rounded-lg border border-line bg-card p-6 shadow-sm max-md:p-5";
const EMPTY = "rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted [&_h3]:mb-2 [&_h3]:text-lg";
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
const ALLOWED_EXT = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const STORE_BYTES = 2 * 1024 * 1024; // keep a preview copy only under 2 MB

function useResumeData() {
  const [state, setState] = useState({ loading: true, error: false, data: null });
  const load = () => {
    try {
      setState({ loading: false, error: false, data: { resume: getResume(), settings: getSettings() } });
    } catch (e) {
      setState({ loading: false, error: true, data: null });
    }
  };
  useEffect(() => {
    load();
  }, []);
  return [state, load, setState];
}

export default function ResumeClient() {
  const [lang] = useLang();
  const [{ loading, error, data }, reload, setState] = useResumeData();
  const [toast, setToast] = useToast();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  const setResume = (resume) => setState((s) => ({ ...s, data: { ...s.data, resume } }));

  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploadErr("");
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setUploadErr(t(lang, "Use a PDF, DOC, DOCX, JPG or PNG file."));
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadErr(t(lang, "File is larger than 10MB."));
      return;
    }
    const finish = (dataUrl) => {
      saveResume({ fileName: file.name, size: file.size, type: file.type, dataUrl: dataUrl || "" });
      setResume(getResume());
      setConfirmRemove(false);
      setToast(t(lang, "Résumé saved"));
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

  const onRemove = () => {
    removeResume();
    setResume(getResume());
    setConfirmRemove(false);
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

  const { resume, settings } = data;
  const hasResume = !!resume.fileName;
  const isImage = /^image\//.test(resume.type) || /\.(jpe?g|png)$/i.test(resume.fileName);
  const isPdf = resume.type === "application/pdf" || /\.pdf$/i.test(resume.fileName);
  const canPreview = !!resume.dataUrl && (isImage || isPdf);

  return (
    <div className={PAGE}>
      <input ref={fileRef} type="file" accept={ACCEPT} onChange={onFile} className="hidden" aria-hidden="true" />

      <div className="mb-6">
        <Link href="/settings" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold no-underline">
          <Icon name="arrow-left" size={14} /> {t(lang, "Back to Settings")}
        </Link>
        <h1 className="text-2xl font-extrabold">{t(lang, "My Résumé")}</h1>
        <p className="mt-1 text-base text-muted">{t(lang, "This is the résumé employers see when you apply.")}</p>
      </div>

      {!hasResume ? (
        <div className={EMPTY}>
          <h3>{t(lang, "No résumé on file yet")}</h3>
          <p>{t(lang, "PDF, DOC, DOCX, JPG or PNG. Max 10MB.")}</p>
          <div className="mt-4">
            <Button variant="primary" onClick={() => fileRef.current && fileRef.current.click()}>
              <Icon name="upload" size={16} /> {t(lang, "Upload résumé")}
            </Button>
          </div>
          {uploadErr && <p className="mt-3 text-sm text-danger-fg">{uploadErr}</p>}
        </div>
      ) : (
        <>
          <div className={`${CARD} mb-5`}>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand">
                <Icon name="file-text" size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block break-words text-base">{resume.fileName}</strong>
                <span className="text-sm text-faint">
                  {[formatBytes(resume.size), resume.uploadedAt && `${t(lang, "uploaded")} ${formatDate(lang, resume.uploadedAt)} (${relativeTime(lang, resume.uploadedAt)})`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.dataUrl && (
                  <a href={resume.dataUrl} download={resume.fileName}>
                    <Button variant="secondary" size="sm"><Icon name="download" size={15} /> {t(lang, "Download")}</Button>
                  </a>
                )}
                <Button variant="secondary" size="sm" onClick={() => fileRef.current && fileRef.current.click()}>
                  <Icon name="repeat" size={15} /> {t(lang, "Replace")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>
                  <Icon name="trash-2" size={15} /> {t(lang, "Remove")}
                </Button>
              </div>
            </div>

            {uploadErr && <p className="mt-3 text-sm text-danger-fg">{uploadErr}</p>}

            {confirmRemove && (
              <div className="mt-4 flex flex-col items-start gap-2.5 rounded-md border border-red-100 bg-danger-bg px-4 py-3 text-sm text-danger-fg" role="alert">
                <span>{t(lang, "Remove this résumé? Employers won't see a résumé until you upload a new one.")}</span>
                <div className="flex gap-2.5">
                  <Button variant="danger" size="sm" onClick={onRemove}>{t(lang, "Remove résumé")}</Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmRemove(false)}>{t(lang, "Cancel")}</Button>
                </div>
              </div>
            )}
          </div>

          <div className={`${CARD} mb-5`}>
            <span className={LABEL}>{t(lang, "Preview")}</span>
            {canPreview ? (
              isPdf ? (
                <iframe title={t(lang, "Résumé preview")} src={resume.dataUrl} className="h-[560px] w-full rounded-md border border-line bg-sunken max-md:h-[420px]" />
              ) : (
                <img src={resume.dataUrl} alt={t(lang, "Résumé preview")} className="mx-auto max-h-[560px] rounded-md border border-line" />
              )
            ) : (
              <div className="rounded-md border border-dashed border-line bg-sunken px-6 py-12 text-center text-sm text-muted">
                <Icon name="file-search" size={26} />
                <p className="mt-2">{t(lang, "Preview isn't available for this file.")}</p>
                {resume.dataUrl && (
                  <a href={resume.dataUrl} download={resume.fileName} className="mt-3 inline-block">
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
