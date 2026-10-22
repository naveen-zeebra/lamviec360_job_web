"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input, Select, Badge } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import ErrorState from "../../../components/ds/ErrorState";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t, tr } from "../../../utils/lang";
import { formatDate, relativeTime, formatBytes } from "../../../utils/format";
import {
  getResumes,
  saveResume,
  removeResume,
  setDefaultResume,
  renameResume,
  refreshResumesFromApi,
  getSettings,
  getCertifications,
  MAX_PROFILE_RESUMES,
  MAX_RESUME_ERROR,
  DOCUMENT_CATEGORIES,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  MAX_ARCHIVE_STORAGE_BYTES,
  getArchivedDocuments,
  getArchiveStorageUsage,
  refreshArchivedDocuments,
  uploadArchivedDocument,
  deleteArchivedDocument,
  getProfile,
  getProfileAttachmentUsage,
  getArchiveSecurityStatus,
  setArchiveSecurityPin,
  verifyArchiveSecurityPin,
  lockArchiveSecurityPin,
  removeArchiveSecurityPin,
} from "../../../lib/seekerStore";
import { UPLOAD_CONFIG } from "../../../config/uploadConfig";
import {
  validateResumeFile,
  validateArchiveDocumentFile,
  validateCumulativeProfileAttachmentQuota,
} from "../../../utils/fileValidation";
import { getSeekerToken } from "../../../lib/api/client";
import {
  downloadSeekerResume,
  downloadSeekerDocument,
  downloadFileFromUrl,
} from "../../../lib/api/seekerApi";


const PAGE = "mx-auto max-w-[1000px] px-6 pb-24 pt-10 max-md:px-4 max-md:pb-12 max-md:pt-7";
const CARD = "rounded-lg border border-line bg-card p-6 shadow-sm max-md:p-5 ";
const EMPTY = "rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted [&_h3]:mb-2 [&_h3]:text-lg";
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

const ACCEPT = UPLOAD_CONFIG.RESUME.accept;
const MAX_BYTES = UPLOAD_CONFIG.RESUME.maxBytes;
const STORE_BYTES = 2 * 1024 * 1024;

const DOC_ACCEPT = UPLOAD_CONFIG.DOCUMENT_ARCHIVE.accept;

function useResumeData() {
  const [state, setState] = useState({ loading: true, error: false, data: null });
  const load = async () => {
    try {
      const [resumes, docs] = await Promise.all([
        refreshResumesFromApi(),
        refreshArchivedDocuments(),
      ]);
      setState({
        loading: false,
        error: false,
        data: {
          resumes,
          documents: docs,
          settings: getSettings(),
          certifications: getCertifications(),
          archiveSecurity: getArchiveSecurityStatus(),
        },
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

  // Tab state: "resumes" | "archive"
  const [activeTab, setActiveTab] = useState("resumes");

  // Resume state
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [uploadErr, setUploadErr] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editingResumeId, setEditingResumeId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const fileRef = useRef(null);

  // Document Archive state
  const [archiveCategory, setArchiveCategory] = useState("all");
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docCategory, setDocCategory] = useState("contract");
  const [docTitle, setDocTitle] = useState("");
  const [docUploadErr, setDocUploadErr] = useState("");
  const [docUploading, setDocUploading] = useState(false);
  const [confirmRemoveDocId, setConfirmRemoveDocId] = useState(null);
  const docFileRef = useRef(null);

  // Archive Security & PIN state
  const [secStatus, setSecStatus] = useState({ hasPin: false, isLocked: false, encryptionStandard: "AES-256" });
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState("set"); // "set" | "change" | "unlock" | "remove"
  const [pinInput, setPinInput] = useState("");
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [pinModalErr, setPinModalErr] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);

  // Direct download PIN prompt modal
  const [pinPromptDoc, setPinPromptDoc] = useState(null);
  const [pinPromptInput, setPinPromptInput] = useState("");
  const [pinPromptErr, setPinPromptErr] = useState("");
  const [pinPromptLoading, setPinPromptLoading] = useState(false);

  // Upload modal PIN options
  const [docProtectWithPin, setDocProtectWithPin] = useState(false);
  const [docUploadPin, setDocUploadPin] = useState("");

  useEffect(() => {
    if (data?.archiveSecurity) {
      setSecStatus(data.archiveSecurity);
    } else {
      setSecStatus(getArchiveSecurityStatus());
    }
  }, [data]);

  const setResumes = (resumes) => setState((s) => ({ ...s, data: { ...s.data, resumes } }));
  const setDocuments = (documents) => setState((s) => ({ ...s, data: { ...s.data, documents } }));

  // --- Resume actions ---
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    setUploadErr("");
    const validation = validateResumeFile(file, lang);
    if (!validation.valid) {
      setUploadErr(t(lang, validation.error));
      return;
    }
    const profile = getProfile();
    const quotaValidation = validateCumulativeProfileAttachmentQuota(file.size, profile, {}, lang);
    if (!quotaValidation.valid) {
      setUploadErr(t(lang, quotaValidation.error));
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

  const handleStartRename = (resume) => {
    setEditingResumeId(resume.id);
    setEditingName(resume.resumeName || resume.fileName || "");
  };

  const handleSaveRename = async (resumeId) => {
    if (!editingName.trim()) return;
    try {
      await renameResume(resumeId, editingName.trim());
      setResumes(getResumes());
      setEditingResumeId(null);
      setToast(tr(lang, "Đã đổi tên CV thành công", "Résumé renamed successfully"));
    } catch (e) {
      setToast(e.message || "Failed to rename résumé");
    }
  };

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadResume = async (resume) => {
    if (!resume) return;
    const targetId = resume.id;
    const fileName = resume.fileName || resume.resumeName || "resume.pdf";
    setDownloadingId(targetId || "preview");
    try {
      const isBackendResume = targetId && !String(targetId).startsWith("res-") && getSeekerToken();
      if (isBackendResume) {
        await downloadSeekerResume(targetId, fileName);
      } else if (resume.dataUrl || resume.fileUrl) {
        await downloadFileFromUrl(resume.dataUrl || resume.fileUrl, fileName);
      } else {
        throw new Error(tr(lang, "Không tìm thấy tệp để tải xuống", "File not found for download"));
      }
    } catch (err) {
      console.error("Resume download error:", err);
      if (resume.dataUrl && resume.dataUrl.startsWith("data:")) {
        try {
          const a = document.createElement("a");
          a.href = resume.dataUrl;
          a.download = fileName;
          a.click();
          return;
        } catch (_) { }
      }
      setToast(err.message || tr(lang, "Không thể tải xuống CV", "Failed to download résumé"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadDocument = async (doc, inputPin = null) => {
    if (!doc) return;
    const targetId = doc.id;
    const fileName = doc.fileName || doc.title || "document";
    const sec = getArchiveSecurityStatus();
    const isProtected = !!(doc.isPasswordProtected || doc.is_password_protected);
    const requiresPin = sec.hasPin && (sec.isLocked || isProtected);

    if (requiresPin && !inputPin && sec.isLocked) {
      setPinPromptDoc(doc);
      setPinPromptInput("");
      setPinPromptErr("");
      return;
    }
    setDownloadingId(targetId);
    try {
      const isBackendDoc = targetId && !String(targetId).startsWith("doc-") && getSeekerToken();
      if (isBackendDoc) {
        await downloadSeekerDocument(targetId, fileName, inputPin);
      } else if (doc.dataUrl || doc.fileUrl) {
        await downloadFileFromUrl(doc.dataUrl || doc.fileUrl, fileName);
      } else {
        throw new Error(tr(lang, "Không tìm thấy tệp để tải xuống", "File not found for download"));
      }
      setPinPromptDoc(null);
      setPinPromptInput("");
      setPinPromptErr("");
      setToast(tr(lang, "Đã tải xuống tài liệu thành công", "Document downloaded successfully"));
    } catch (err) {
      console.error("Document download error:", err);
      const msg = err.message || "";
      if (
        msg.toLowerCase().includes("pin") ||
        msg.toLowerCase().includes("password") ||
        msg.toLowerCase().includes("locked") ||
        msg.includes("401") ||
        msg.includes("403")
      ) {
        setPinPromptDoc(doc);
        setPinPromptErr(
          inputPin
            ? tr(lang, "Mã PIN bảo mật không chính xác. Vui lòng thử lại.", "Incorrect Security PIN. Please try again.")
            : tr(lang, "Kho lưu trữ đang bị khóa. Vui lòng nhập mã PIN bảo mật.", "Archive is locked. Please enter your Security PIN.")
        );
        return;
      }
      if (doc.dataUrl && doc.dataUrl.startsWith("data:")) {
        try {
          const a = document.createElement("a");
          a.href = doc.dataUrl;
          a.download = fileName;
          a.click();
          return;
        } catch (_) { }
      }
      setToast(err.message || tr(lang, "Không thể tải xuống tài liệu", "Failed to download document"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePinAction = async () => {
    setPinModalErr("");
    setPinSubmitting(true);
    try {
      if (pinModalMode === "set") {
        if (!pinInput || pinInput.length < 4 || pinInput.length > 8) {
          throw new Error(tr(lang, "Mã PIN phải từ 4 đến 8 chữ số", "PIN must be between 4 and 8 digits"));
        }
        await setArchiveSecurityPin(pinInput);
        setToast(tr(lang, "Thiết lập mã PIN bảo mật thành công", "Security PIN created successfully"));
      } else if (pinModalMode === "change") {
        if (!currentPinInput) {
          throw new Error(tr(lang, "Vui lòng nhập mã PIN hiện tại", "Please enter current PIN"));
        }
        if (!pinInput || pinInput.length < 4 || pinInput.length > 8) {
          throw new Error(tr(lang, "Mã PIN mới phải từ 4 đến 8 chữ số", "New PIN must be between 4 and 8 digits"));
        }
        await setArchiveSecurityPin(pinInput, currentPinInput);
        setToast(tr(lang, "Đổi mã PIN bảo mật thành công", "Security PIN changed successfully"));
      } else if (pinModalMode === "unlock") {
        if (!pinInput) {
          throw new Error(tr(lang, "Vui lòng nhập mã PIN", "Please enter PIN"));
        }
        await verifyArchiveSecurityPin(pinInput);
        setToast(tr(lang, "Đã mở khóa kho lưu trữ", "Archive unlocked"));
      } else if (pinModalMode === "remove") {
        if (!currentPinInput) {
          throw new Error(tr(lang, "Vui lòng nhập mã PIN hiện tại để gỡ bỏ", "Please enter current PIN to remove"));
        }
        await removeArchiveSecurityPin(currentPinInput);
        setToast(tr(lang, "Đã gỡ bỏ mã PIN bảo mật", "Security PIN removed"));
      }
      setSecStatus(getArchiveSecurityStatus());
      setShowPinModal(false);
      setPinInput("");
      setCurrentPinInput("");
    } catch (e) {
      setPinModalErr(e.message || "Action failed");
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleLockArchive = async () => {
    try {
      await lockArchiveSecurityPin();
      setSecStatus(getArchiveSecurityStatus());
      setToast(tr(lang, "Đã khóa kho lưu trữ", "Archive locked"));
    } catch (e) {
      setToast(e.message || "Failed to lock archive");
    }
  };

  const handlePinPromptSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pinPromptInput) {
      setPinPromptErr(tr(lang, "Vui lòng nhập mã PIN", "Please enter PIN"));
      return;
    }
    setPinPromptLoading(true);
    setPinPromptErr("");
    try {
      await handleDownloadDocument(pinPromptDoc, pinPromptInput);
    } catch (e) {
      setPinPromptErr(e.message || "Download failed");
    } finally {
      setPinPromptLoading(false);
    }
  };

  // --- Document Archive actions ---
  const handleDocFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    setDocUploadErr("");
    const usage = getArchiveStorageUsage();
    const validation = validateArchiveDocumentFile(file, usage.usedBytes, lang);
    if (!validation.valid) {
      setDocUploadErr(t(lang, validation.error));
      return;
    }
    setDocFile(file);
    if (!docTitle) {
      // Auto-populate title without extension
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setDocTitle(nameWithoutExt);
    }
  };

  const handleUploadDocument = async () => {
    if (!docFile) {
      setDocUploadErr(tr(lang, "Vui lòng chọn tệp tài liệu", "Please select a file to upload"));
      return;
    }
    setDocUploading(true);
    setDocUploadErr("");
    try {
      const selectedCategory = docCategory || "contract";
      const updatedDocs = await uploadArchivedDocument({
        file: docFile,
        category: selectedCategory,
        title: docTitle.trim() || docFile.name,
        protectWithPin: docProtectWithPin,
        pin: docUploadPin.trim(),
      });
      setSecStatus(getArchiveSecurityStatus());
      setDocuments(updatedDocs || getArchivedDocuments());
      setArchiveCategory(selectedCategory);
      setShowUploadDocModal(false);
      setDocFile(null);
      setDocTitle("");
      setDocProtectWithPin(false);
      setDocUploadPin("");
      setToast(tr(lang, "Tải lên tài liệu thành công", "Document uploaded successfully"));
    } catch (e) {
      setDocUploadErr(e.message || tr(lang, "Tải lên thất bại", "Upload failed"));
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await deleteArchivedDocument(docId);
      const updatedDocs = getArchivedDocuments();
      setDocuments(updatedDocs);
      setConfirmRemoveDocId(null);
      setToast(tr(lang, "Đã xóa tài liệu", "Document removed"));
    } catch (e) {
      setToast(e.message || "Failed to delete document");
    }
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

  const resumes = data?.resumes || [];
  const documents = data?.documents || [];
  const { settings } = data || { settings: { privacy: {} } };
  const atCap = resumes.length >= MAX_PROFILE_RESUMES;
  const selected = resumes.find((r) => String(r.id) === String(selectedId)) || resumes.find((r) => r.isDefault) || resumes[0] || null;
  const { href, isImage, isPdf, canPreview } = previewMeta(selected);

  const archiveUsage = getArchiveStorageUsage();
  const filteredDocuments = archiveCategory === "all"
    ? documents
    : documents.filter((d) => (d.category || "").toLowerCase() === archiveCategory.toLowerCase());

  const getCategoryBadgeClass = (category) => {
    switch ((category || "").toLowerCase()) {
      case "contract":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "relieving":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "payslip":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "certificate":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className={PAGE}>
      <input ref={fileRef} type="file" accept={ACCEPT} onChange={onFile} className="hidden" aria-hidden="true" />
      <input ref={docFileRef} type="file" accept={DOC_ACCEPT} onChange={handleDocFileSelect} className="hidden" aria-hidden="true" />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/settings" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold no-underline text-brand hover:underline">
            <Icon name="arrow-left" size={14} /> {t(lang, "Back to Settings")}
          </Link>
          <h1 className="text-2xl font-extrabold">{t(lang, "My Resume & Documents")}</h1>
          <p className="mt-1 text-base text-muted">
            {tr(
              lang,
              "Quản lý thư viện CV ứng tuyển và lưu trữ hồ sơ bằng cấp, hợp đồng bảo mật.",
              "Manage your application résumés and archive employment documents securely."
            )}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab("resumes")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${activeTab === "resumes"
            ? "border-brand text-brand"
            : "border-transparent text-muted hover:text-ink"
            }`}
        >
          <Icon name="file-text" size={18} />
          <span>{tr(lang, "Thư viện CV", "My Résumés")}</span>
          <span className="ml-1 rounded-full bg-sunken px-2 py-0.5 text-xs text-ink font-semibold">
            {resumes.length} / {MAX_PROFILE_RESUMES}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("archive")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${activeTab === "archive"
            ? "border-brand text-brand"
            : "border-transparent text-muted hover:text-ink"
            }`}
        >
          <Icon name="archive" size={18} />
          <span>{tr(lang, "Kho lưu trữ hồ sơ", "Document Archive")}</span>
          <span className="ml-1 rounded-full bg-sunken px-2 py-0.5 text-xs text-ink font-semibold">
            {documents.length} ({archiveUsage.usedMb}MB)
          </span>
        </button>
      </div>

      {/* ──────────────── TAB 1: MY RÉSUMÉS ──────────────── */}
      {activeTab === "resumes" && (
        <>
          {(() => {
            const attachUsage = getProfileAttachmentUsage();
            return (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <Icon name="hard-drive" size={15} className="text-brand" />
                  <span className="font-semibold text-ink">
                    {tr(lang, "Hạn mức tài liệu hồ sơ", "Profile Documents Quota")}:
                  </span>
                  <span className="text-muted">
                    {tr(
                      lang,
                      "Tổng dung lượng CV, Hồ sơ năng lực & Chứng chỉ tối đa 10MB.",
                      "Total attachment size across Resume, Portfolio, and Certificates must not exceed 10MB."
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-sunken">
                    <div
                      className={`h-full transition-all ${attachUsage.percentUsed >= 100
                        ? "bg-danger"
                        : attachUsage.percentUsed > 80
                          ? "bg-amber-500"
                          : "bg-brand"
                        }`}
                      style={{ width: `${Math.min(100, attachUsage.percentUsed)}%` }}
                    />
                  </div>
                  <span
                    className={`font-bold ${attachUsage.percentUsed >= 100
                      ? "text-danger"
                      : attachUsage.percentUsed > 80
                        ? "text-amber-600"
                        : "text-muted"
                      }`}
                  >
                    {attachUsage.usedMb} / {attachUsage.maxMb} MB
                  </span>
                </div>
              </div>
            );
          })()}
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
                  <div>
                    <span className={LABEL} style={{ marginBottom: 0 }}>
                      {tr(lang, "Danh sách CV đã lưu", "Saved Résumés")}
                    </span>
                    <p className="text-xs text-muted mt-0.5">
                      {tr(
                        lang,
                        "Đặt tên cho từng CV để lựa chọn phù hợp khi ứng tuyển một chạm.",
                        "Name your résumés to easily select the best fit during one-click apply."
                      )}
                    </p>
                  </div>
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

                <div className="flex flex-col gap-3">
                  {resumes.map((resume) => {
                    const active = selected && String(selected.id) === String(resume.id);
                    const isEditing = editingResumeId === resume.id;

                    return (
                      <div
                        key={resume.id}
                        className={`rounded-lg border p-4 transition-all ${active ? "border-brand bg-brand-subtle/40 ring-1 ring-brand/30" : "border-line bg-card hover:bg-sunken/40"
                          }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedId(resume.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedId(resume.id);
                              }
                            }}
                            className="flex flex-1 items-start gap-3 text-left min-w-0 cursor-pointer"
                          >
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                              <Icon name="file-text" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                              {isEditing ? (
                                <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    placeholder={tr(lang, "Nhập tên CV", "Enter résumé name")}
                                    className="rounded border border-line bg-card px-2.5 py-1 text-sm font-semibold text-ink focus:border-brand focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveRename(resume.id);
                                      if (e.key === "Escape") setEditingResumeId(null);
                                    }}
                                  />
                                  <Button size="sm" variant="primary" onClick={() => handleSaveRename(resume.id)}>
                                    {tr(lang, "Lưu", "Save")}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingResumeId(null)}>
                                    {tr(lang, "Hủy", "Cancel")}
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                  <strong className="text-base text-ink break-words">
                                    {resume.resumeName || resume.fileName}
                                  </strong>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartRename(resume);
                                    }}
                                    className="text-xs text-brand hover:underline flex items-center gap-0.5"
                                    title={tr(lang, "Đổi tên CV", "Rename résumé")}
                                  >
                                    <Icon name="edit" size={12} />
                                    <span>{tr(lang, "Đổi tên", "Rename")}</span>
                                  </button>
                                </div>
                              )}

                              <p className="text-xs text-muted mt-0.5 break-all">
                                {resume.fileName} · {formatBytes(resume.size)}
                                {resume.uploadedAt && ` · ${t(lang, "uploaded")} ${formatDate(lang, resume.uploadedAt)} (${relativeTime(lang, resume.uploadedAt)})`}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {resume.isDefault && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                                    <Icon name="check" size={10} /> {t(lang, "Default")}
                                  </span>
                                )}
                                {resume.usedCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 px-2.5 py-0.5 text-xs font-medium">
                                    <Icon name="briefcase" size={12} />
                                    {tr(
                                      lang,
                                      `Đã dùng trong ${resume.usedCount} đơn ứng tuyển`,
                                      `Used in ${resume.usedCount} application${resume.usedCount > 1 ? "s" : ""}`
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-muted">
                                    {tr(lang, "Chưa nộp đơn nào", "Not used in any applications yet")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 self-start">
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
                            {(resume.id || resume.dataUrl || resume.fileUrl) && (
                              <button
                                type="button"
                                disabled={downloadingId === resume.id}
                                onClick={() => handleDownloadResume(resume)}
                                className="inline-flex items-center justify-center rounded-md font-semibold font-body border-[1.5px] border-line-brand bg-card text-brand hover:bg-brand-subtle px-3.5 py-1.5 text-sm gap-1.5 transition-[background,opacity,filter] duration-150 disabled:opacity-50"
                              >
                                <Icon
                                  name={downloadingId === resume.id ? "loader-2" : "download"}
                                  size={14}
                                  className={downloadingId === resume.id ? "animate-spin" : ""}
                                />{" "}
                                {downloadingId === resume.id ? tr(lang, "Đang tải...", "Downloading...") : t(lang, "Download")}
                              </button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveId(resume.id)}>
                              <Icon name="trash-2" size={14} /> {t(lang, "Remove")}
                            </Button>
                          </div>
                        </div>

                        {String(confirmRemoveId) === String(resume.id) && (
                          <div className="mt-3.5 flex flex-col items-start gap-2.5 rounded-lg border border-red-200 bg-danger-bg p-3.5 text-sm text-danger-fg" role="alert">
                            <span>{t(lang, "Remove this résumé? Employers won't see it until you upload another.")}</span>
                            <div className="flex gap-2">
                              <Button variant="danger" size="sm" onClick={() => onRemove(resume.id)}>
                                {t(lang, "Remove résumé")}
                              </Button>
                              <Button variant="secondary" size="sm" onClick={() => setConfirmRemoveId(null)}>
                                {t(lang, "Cancel")}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className={`${CARD} mb-5 hidden`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className={LABEL} style={{ marginBottom: 0 }}>{t(lang, "Preview")}</span>
                  {selected && (
                    <span className="text-xs text-muted">
                      {selected.resumeName || selected.fileName}
                    </span>
                  )}
                </div>
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
                    {(href || selected?.id) && (
                      <button
                        type="button"
                        disabled={downloadingId === (selected?.id || "preview")}
                        onClick={() => handleDownloadResume(selected)}
                        className="mt-3 inline-flex items-center justify-center rounded-md font-semibold font-body border-[1.5px] border-line-brand bg-card text-brand hover:bg-brand-subtle px-3.5 py-1.5 text-sm gap-1.5 transition-[background,opacity,filter] duration-150 disabled:opacity-50"
                      >
                        <Icon
                          name={downloadingId === (selected?.id || "preview") ? "loader-2" : "download"}
                          size={14}
                          className={downloadingId === (selected?.id || "preview") ? "animate-spin" : ""}
                        />{" "}
                        {downloadingId === (selected?.id || "preview") ? tr(lang, "Đang tải...", "Downloading...") : t(lang, "Download to view")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className={`${CARD} hidden`}>
            <span className={LABEL}>{t(lang, "Résumé visibility")}</span>
            <p className="text-sm text-muted">
              {t(lang, "Current setting")}: <strong className="text-ink">{t(lang, settings?.privacy?.resumeVisibility || "Visible when I apply")}</strong>
            </p>
            <Link href="/settings?tab=privacy" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand no-underline hover:underline">
              {t(lang, "Change in Privacy settings")} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </>
      )}

      {/* ──────────────── TAB 2: CANDIDATE DOCUMENT ARCHIVE (JSP-FR-012) ──────────────── */}
      {activeTab === "archive" && (
        <>
          {/* Security & Encryption Banner */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="flex items-start gap-3.5 max-w-xl">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Icon name="shield" size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-ink">
                    {tr(lang, "Kho hồ sơ mã hóa chuẩn AES-256", "AES-256 Encrypted Document Storage")}
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Icon name="check" size={11} /> {tr(lang, "Bảo mật cấp cao", "High Security")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {tr(
                    lang,
                    "Hợp đồng cũ, quyết định thôi việc, bảng lương và chứng chỉ được mã hóa lưu trữ. Nhà tuyển dụng chỉ có quyền xem khi bạn được đưa vào vòng Tuyển chọn (Shortlisted) trở đi.",
                    "Contracts, relieving letters, payslips, and certificates are encrypted at rest. Employers can only access them when you advance to the Shortlisted stage or beyond."
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {secStatus.hasPin ? (
                secStatus.isLocked ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPinModalMode("unlock");
                      setPinModalErr("");
                      setPinInput("");
                      setShowPinModal(true);
                    }}
                    className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <Icon name="lock" size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>{tr(lang, "Mở khóa kho hồ sơ", "Unlock Archive")}</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Icon name="unlock" size={13} />
                      {tr(lang, "Đã mở khóa", "Unlocked")}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleLockArchive}
                      className="border-line text-ink hover:bg-sunken"
                    >
                      <Icon name="lock" size={14} />
                      <span>{tr(lang, "Khóa lại", "Lock")}</span>
                    </Button>
                  </div>
                )
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPinModalMode("set");
                    setPinModalErr("");
                    setPinInput("");
                    setShowPinModal(true);
                  }}
                  className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-card dark:text-emerald-300"
                >
                  <Icon name="key" size={14} />
                  <span>{tr(lang, "Cài mã PIN bảo vệ", "Set Security PIN")}</span>
                </Button>
              )}

              {secStatus.hasPin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPinModalMode("change");
                    setPinModalErr("");
                    setPinInput("");
                    setCurrentPinInput("");
                    setShowPinModal(true);
                  }}
                  title={tr(lang, "Quản lý mã PIN", "Manage PIN")}
                >
                  <Icon name="settings" size={15} />
                </Button>
              )}
            </div>
          </div>

          {/* Storage Meter Card */}
          <div className={`${CARD} mb-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {tr(lang, "Dung lượng lưu trữ hồ sơ", "Document Storage Quota")}
                </h3>
                <p className="text-xs text-muted">
                  {tr(
                    lang,
                    "Giới hạn tối đa 10 MB/tệp và 100 MB tổng kho lưu trữ hồ sơ xác thực.",
                    "Max 10 MB per file, 100 MB total archive limit for verification documents."
                  )}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-ink">
                  {archiveUsage.usedMb} MB / {archiveUsage.maxMb} MB
                </span>
                <span className="text-xs text-muted ml-1.5">
                  ({archiveUsage.percentUsed}%)
                </span>
              </div>
            </div>

            {/* Storage bar */}
            <div className="h-3 w-full rounded-full bg-sunken overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${archiveUsage.percentUsed >= 90
                  ? "bg-danger-fg"
                  : archiveUsage.percentUsed >= 75
                    ? "bg-amber-500"
                    : "bg-brand"
                  }`}
                style={{ width: `${Math.min(100, Math.max(3, archiveUsage.percentUsed))}%` }}
              />
            </div>
            {archiveUsage.percentUsed >= 90 && (
              <p className="mt-2 text-xs font-semibold text-danger-fg">
                {tr(lang, "Cảnh báo: Bộ nhớ sắp đầy. Vui lòng xóa bớt tài liệu cũ trước khi tải thêm.", "Warning: Storage quota nearly full. Please delete old documents before adding more.")}
              </p>
            )}
          </div>

          {/* Document Section Controls */}
          <div className={`${CARD} mb-5`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {DOCUMENT_CATEGORIES.map((cat) => {
                  const isSelected = archiveCategory === cat.id;
                  const count = cat.id === "all"
                    ? documents.length
                    : documents.filter((d) => (d.category || "").toLowerCase() === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setArchiveCategory(cat.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${isSelected
                        ? "bg-brand text-white shadow-sm"
                        : "bg-sunken text-muted hover:text-ink hover:bg-line/60"
                        }`}
                    >
                      {lang === "VN" || lang === "VI" ? cat.labelVi : cat.label}
                      <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? "bg-white/20 text-white" : "bg-card text-muted"
                        }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Upload Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (archiveCategory && archiveCategory !== "all") {
                    setDocCategory(archiveCategory);
                  }
                  setShowUploadDocModal(true);
                }}
              >
                <Icon name="upload" size={14} />
                <span>{tr(lang, "Tải lên tài liệu mới", "Upload Document")}</span>
              </Button>
            </div>

            {/* Document Upload Modal / Drawer */}
            {showUploadDocModal && (
              <div className="mb-6 rounded-lg border-2 border-dashed border-brand/50 bg-brand-subtle/30 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                    <Icon name="upload-cloud" size={18} className="text-brand" />
                    {tr(lang, "Thêm tài liệu vào kho lưu trữ", "Add Document to Archive")}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadDocModal(false);
                      setDocFile(null);
                      setDocTitle("");
                      setDocUploadErr("");
                    }}
                    className="text-muted hover:text-ink"
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>
                      {tr(lang, "Phân loại tài liệu", "Document Category")} *
                    </label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                    >
                      <option value="contract">{tr(lang, "Hợp đồng lao động (Contracts)", "Employment Contract")}</option>
                      <option value="relieving">{tr(lang, "Quyết định thôi việc (Relieving Letters)", "Relieving Letter")}</option>
                      <option value="payslip">{tr(lang, "Phiếu lương (Payslips)", "Payslip")}</option>
                      <option value="certificate">{tr(lang, "Bằng cấp & Chứng chỉ (Certificates)", "Certificate / Degree")}</option>
                      <option value="other">{tr(lang, "Tài liệu khác (Other)", "Other Document")}</option>
                    </select>
                  </div>

                  <div>
                    <label className={LABEL}>
                      {tr(lang, "Tiêu đề tài liệu", "Document Title")}
                    </label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder={tr(lang, "VD: Hợp đồng TechCorp 2024", "e.g., TechCorp Contract 2024")}
                      className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className={LABEL}>
                    {tr(lang, "Chọn tệp (PDF, DOC, DOCX, JPG, PNG - tối đa 10 MB)", "Select File (PDF, DOC, DOCX, JPG, PNG - max 10 MB)")} *
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => docFileRef.current && docFileRef.current.click()}
                    >
                      <Icon name="paperclip" size={14} />
                      {docFile ? tr(lang, "Chọn tệp khác", "Change File") : tr(lang, "Duyệt tệp...", "Browse File...")}
                    </Button>
                    <span className="text-xs text-muted truncate max-w-[300px]">
                      {docFile ? `${docFile.name} (${formatBytes(docFile.size)})` : tr(lang, "Chưa chọn tệp", "No file selected")}
                    </span>
                  </div>
                </div>

                {/* PIN Protection Option */}
                <div className="mt-4 rounded-lg border border-line bg-card p-3.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docProtectWithPin}
                      onChange={(e) => setDocProtectWithPin(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand"
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-ink flex items-center gap-1.5">
                        <Icon name="lock" size={13} className="text-amber-500" />
                        {tr(lang, "Bảo vệ tài liệu này bằng mã PIN bảo mật", "Protect this document with Security PIN")}
                      </span>
                      <p className="mt-0.5 text-muted leading-relaxed">
                        {tr(
                          lang,
                          "Tài liệu sẽ yêu cầu mã PIN khi bạn tải xuống trên tài khoản này.",
                          "Requires your Security PIN whenever downloading from your account."
                        )}
                      </p>
                    </div>
                  </label>

                  {docProtectWithPin && !secStatus.hasPin && (
                    <div className="mt-3 pt-3 border-t border-line/60">
                      <label className={LABEL}>
                        {tr(lang, "Nhập mã PIN bảo mật mới (4-8 chữ số)", "Enter new Security PIN (4-8 digits)")} *
                      </label>
                      <input
                        type="password"
                        maxLength={8}
                        value={docUploadPin}
                        onChange={(e) => setDocUploadPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                        className="w-full max-w-xs rounded-md border border-line bg-card px-3 py-2 text-sm tracking-widest text-ink focus:border-brand focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-muted">
                        {tr(
                          lang,
                          "Mã PIN này sẽ trở thành mã PIN bảo mật kho hồ sơ của bạn.",
                          "This PIN will also serve as your general archive security PIN."
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {docUploadErr && (
                  <p className="mt-3 text-sm text-danger-fg font-medium">{docUploadErr}</p>
                )}

                <div className="mt-5 flex justify-end gap-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowUploadDocModal(false);
                      setDocFile(null);
                      setDocTitle("");
                      setDocUploadErr("");
                    }}
                  >
                    {tr(lang, "Hủy", "Cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!docFile || docUploading}
                    onClick={handleUploadDocument}
                  >
                    {docUploading ? (
                      <span>{tr(lang, "Đang tải lên...", "Uploading...")}</span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Icon name="check" size={14} />
                        {tr(lang, "Lưu vào kho", "Save to Archive")}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Document Listing */}
            {filteredDocuments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line bg-sunken/40 px-6 py-12 text-center text-muted">
                <Icon name="folder" size={32} className="mx-auto mb-2 text-faint" />
                <h4 className="text-base font-bold text-ink">
                  {tr(lang, "Chưa có tài liệu nào trong mục này", "No documents in this category")}
                </h4>
                <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                  {tr(
                    lang,
                    "Lưu giữ hợp đồng, thư xác nhận công tác hoặc phiếu lương để sẵn sàng cung cấp khi nhà tuyển dụng yêu cầu thẩm định hồ sơ (onboarding/background check).",
                    "Store contracts, relieving letters, and payslips to quickly share when employers request verification during onboarding."
                  )}
                </p>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowUploadDocModal(true)}
                  >
                    <Icon name="upload" size={14} /> {tr(lang, "Tải lên ngay", "Upload now")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredDocuments.map((doc) => {
                  const catMeta = DOCUMENT_CATEGORIES.find((c) => c.id === (doc.category || "").toLowerCase()) || {
                    label: doc.category || "Other",
                    labelVi: doc.category || "Khác",
                  };
                  const downloadHref = doc.dataUrl || doc.fileUrl;

                  return (
                    <div
                      key={doc.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card p-4 transition-all hover:bg-sunken/40"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sunken text-muted">
                          <Icon name="file" size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm font-bold text-ink break-words">
                              {doc.title || doc.fileName}
                            </strong>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getCategoryBadgeClass(doc.category)}`}>
                              {lang === "VN" || lang === "VI" ? catMeta.labelVi : catMeta.label}
                            </span>
                            {doc.isEncrypted && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                <Icon name="shield" size={10} /> {tr(lang, "Mã hóa AES", "AES Encrypted")}
                              </span>
                            )}
                            {doc.isPasswordProtected && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold">
                                <Icon name="lock" size={10} /> {tr(lang, "Khóa PIN", "PIN Protected")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-0.5 break-all">
                            {doc.fileName} · {formatBytes(doc.sizeBytes || doc.size || 0)}
                            {doc.createdAt && ` · ${formatDate(lang, doc.createdAt)}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(doc.id || downloadHref) && (
                          <button
                            type="button"
                            disabled={downloadingId === doc.id}
                            onClick={() => handleDownloadDocument(doc)}
                            className="inline-flex items-center justify-center rounded-md font-semibold font-body border-[1.5px] border-line-brand bg-card text-brand hover:bg-brand-subtle px-3.5 py-1.5 text-sm gap-1.5 transition-[background,opacity,filter] duration-150 disabled:opacity-50"
                          >
                            <Icon
                              name={downloadingId === doc.id ? "loader-2" : (secStatus.hasPin && secStatus.isLocked ? "lock" : "download")}
                              size={14}
                              className={downloadingId === doc.id ? "animate-spin" : ""}
                            />{" "}
                            {downloadingId === doc.id
                              ? tr(lang, "Đang tải...", "Downloading...")
                              : (secStatus.hasPin && secStatus.isLocked
                                ? tr(lang, "Mở khóa tải", "Unlock & Download")
                                : t(lang, "Download"))}
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmRemoveDocId(doc.id)}
                        >
                          <Icon name="trash-2" size={14} />
                        </Button>
                      </div>

                      {String(confirmRemoveDocId) === String(doc.id) && (
                        <div className="w-full mt-2 flex flex-col items-start gap-2 rounded-lg border border-red-200 bg-danger-bg p-3 text-xs text-danger-fg" role="alert">
                          <span>{tr(lang, "Bạn có chắc muốn xóa tài liệu này khỏi kho lưu trữ?", "Are you sure you want to delete this document from your archive?")}</span>
                          <div className="flex gap-2">
                            <Button variant="danger" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                              {tr(lang, "Xác nhận xóa", "Confirm Delete")}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setConfirmRemoveDocId(null)}>
                              {t(lang, "Cancel")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal: Manage Archive Security PIN ── */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Icon name="shield" size={18} className="text-brand" />
                {pinModalMode === "set" && tr(lang, "Thiết lập mã PIN bảo mật kho hồ sơ", "Set Archive Security PIN")}
                {pinModalMode === "change" && tr(lang, "Đổi mã PIN bảo mật", "Change Security PIN")}
                {pinModalMode === "unlock" && tr(lang, "Mở khóa kho hồ sơ bảo mật", "Unlock Encrypted Archive")}
                {pinModalMode === "remove" && tr(lang, "Gỡ bỏ mã PIN bảo vệ", "Remove Security PIN")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput("");
                  setCurrentPinInput("");
                  setPinModalErr("");
                }}
                className="rounded-lg p-1 text-muted hover:bg-sunken hover:text-ink"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <p className="text-xs text-muted mb-4 leading-relaxed">
              {pinModalMode === "set" && tr(
                lang,
                "Tạo mã PIN (4-8 số) để bảo vệ tài liệu quan trọng của bạn. Chỉ người có mã PIN mới có thể tải xuống các tài liệu này.",
                "Create a 4-8 digit PIN to protect sensitive documents. Only you with this PIN can download them."
              )}
              {pinModalMode === "unlock" && tr(
                lang,
                "Nhập mã PIN để mở khóa kho lưu trữ tài liệu bảo mật trên phiên làm việc hiện tại.",
                "Enter your PIN to unlock encrypted documents during this session."
              )}
              {pinModalMode === "change" && tr(
                lang,
                "Nhập mã PIN hiện tại và mã PIN mới để cập nhật bảo mật.",
                "Enter your current PIN and a new PIN to update security."
              )}
              {pinModalMode === "remove" && tr(
                lang,
                "Xác nhận mã PIN hiện tại để gỡ bỏ bảo vệ mã PIN cho kho lưu trữ.",
                "Enter your current PIN to remove PIN protection from your archive."
              )}
            </p>

            <div className="space-y-3">
              {(pinModalMode === "change" || pinModalMode === "remove") && (
                <div>
                  <label className={LABEL}>
                    {tr(lang, "Mã PIN hiện tại", "Current PIN")} *
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm tracking-widest text-ink focus:border-brand focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              {pinModalMode !== "remove" && (
                <div>
                  <label className={LABEL}>
                    {pinModalMode === "change"
                      ? tr(lang, "Mã PIN mới (4-8 số)", "New PIN (4-8 digits)")
                      : tr(lang, "Mã PIN (4-8 số)", "PIN (4-8 digits)")} *
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm tracking-widest text-ink focus:border-brand focus:outline-none"
                    autoFocus={pinModalMode === "set" || pinModalMode === "unlock"}
                  />
                </div>
              )}

              {pinModalErr && (
                <p className="text-xs text-danger font-semibold">{pinModalErr}</p>
              )}

              <div className="flex justify-between items-center pt-2">
                {pinModalMode === "change" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPinModalMode("remove");
                      setPinModalErr("");
                    }}
                    className="text-xs text-danger hover:underline font-semibold"
                  >
                    {tr(lang, "Gỡ bỏ mã PIN", "Remove PIN")}
                  </button>
                ) : <span />}

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPinModal(false);
                      setPinInput("");
                      setCurrentPinInput("");
                      setPinModalErr("");
                    }}
                  >
                    {tr(lang, "Hủy", "Cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={pinSubmitting}
                    onClick={handlePinAction}
                  >
                    {pinSubmitting
                      ? tr(lang, "Đang xử lý...", "Processing...")
                      : pinModalMode === "unlock"
                        ? tr(lang, "Mở khóa", "Unlock")
                        : pinModalMode === "remove"
                          ? tr(lang, "Xác nhận gỡ", "Confirm Remove")
                          : tr(lang, "Lưu mã PIN", "Save PIN")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Enter PIN to Download Document ── */}
      {pinPromptDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-line bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Icon name="lock" size={16} className="text-amber-500" />
                {tr(lang, "Nhập mã PIN để tải tài liệu", "Enter Security PIN to Download")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPinPromptDoc(null);
                  setPinPromptInput("");
                  setPinPromptErr("");
                }}
                className="text-muted hover:text-ink"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-xs text-muted mb-4">
              <span className="font-semibold text-ink">{pinPromptDoc.fileName || pinPromptDoc.title}</span>{" "}
              {tr(
                lang,
                "được bảo vệ bằng mã PIN bảo mật. Vui lòng nhập mã PIN để giải mã và tải xuống.",
                "is protected with a Security PIN. Please enter your PIN to decrypt and download."
              )}
            </p>

            <form onSubmit={handlePinPromptSubmit} className="space-y-3">
              <input
                type="password"
                maxLength={8}
                value={pinPromptInput}
                onChange={(e) => setPinPromptInput(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-center text-lg tracking-[0.5em] font-mono text-ink focus:border-brand focus:outline-none"
                autoFocus
              />

              {pinPromptErr && (
                <p className="text-xs text-danger font-semibold text-center">{pinPromptErr}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setPinPromptDoc(null);
                    setPinPromptInput("");
                    setPinPromptErr("");
                  }}
                >
                  {tr(lang, "Hủy", "Cancel")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={pinPromptLoading || !pinPromptInput}
                >
                  {pinPromptLoading ? (
                    tr(lang, "Đang giải mã...", "Decrypting...")
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Icon name="download" size={14} />
                      {tr(lang, "Giải mã & Tải", "Decrypt & Download")}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast msg={toast} />
    </div>
  );
}
