"use client";

import React, { useState, useRef } from "react";
import Icon from "../ds/Icon";
import { Tooltip, InfoTip } from "../ds";
import { t } from "../../utils/lang";
import { validateCertificationFile, validateCumulativeProfileAttachmentQuota } from "../../utils/fileValidation";
import { getProfile } from "../../lib/seekerStore";
import { getProjectsFromDefaultResume } from "../../utils/resumeParser";

/** Helper: read File as base64 data-URL */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Helper: format date YYYY-MM to readable string */
function formatProjectDate(val, lang = "EN") {
  if (!val) return "";
  if (val.toLowerCase() === "present") {
    return lang === "VI" ? "Hiện tại" : "Present";
  }
  const parts = val.split("-");
  if (parts.length >= 2) {
    const d = new Date(+parts[0], +parts[1] - 1, 1);
    return d.toLocaleString(lang === "VI" ? "vi-VN" : "en-US", { month: "short", year: "numeric" });
  }
  return val;
}

/**
 * Derives project entries from candidate profile experience records.
 * Returns empty array if no genuine experiences exist.
 */
function extractProjectsFromResume(profile, lang = "EN") {
  const exp = Array.isArray(profile?.experience) ? profile.experience : [];
  const results = [];

  exp.forEach((item, idx) => {
    if (!item.title && !item.company && !item.description) return;
    const comp = item.company || "";
    const role = item.title || profile.professional?.title || "";
    const fromDate = item.start ? item.start.slice(0, 7) : "";
    const toDate = item.isCurrent || item.end === "Present" ? "Present" : item.end ? item.end.slice(0, 7) : "";

    results.push({
      id: `ext-${Date.now()}-${idx}`,
      title: comp ? `${role ? role + " - " : ""}${comp}` : role || (item.description ? item.description.slice(0, 50) : ""),
      role,
      fromDate,
      toDate,
      isOngoing: toDate === "Present",
      description: item.description || "",
      url: "",
      extractedFromResume: true,
    });
  });

  return results.filter((r) => r.title || r.description);
}

export default function PortfolioManager({
  portfolio = {},
  profile: propProfile,
  onChange,
  lang = "EN",
}) {
  const isVi = lang === "VI";
  const items = Array.isArray(portfolio.items)
    ? portfolio.items
    : Array.isArray(portfolio.projects)
    ? portfolio.projects
    : [];

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState("");
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [extractedList, setExtractedList] = useState([]);
  const [selectedExtractIds, setSelectedExtractIds] = useState(new Set());
  const [sourceResumeName, setSourceResumeName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Form State
  const [form, setForm] = useState({
    title: "",
    role: "",
    fromDate: "",
    toDate: "",
    isOngoing: false,
    url: "",
    description: "",
    fileName: "",
    fileSize: 0,
    fileType: "",
    fileDataUrl: "",
  });

  const fileInputRef = useRef(null);

  const resetForm = () => {
    setForm({
      title: "",
      role: "",
      fromDate: "",
      toDate: "",
      isOngoing: false,
      url: "",
      description: "",
      fileName: "",
      fileSize: 0,
      fileType: "",
      fileDataUrl: "",
    });
    setErr("");
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (item) => {
    setForm({
      title: item.title || "",
      role: item.role || "",
      fromDate: item.fromDate || "",
      toDate: item.isOngoing ? "" : item.toDate || "",
      isOngoing: !!item.isOngoing || item.toDate === "Present",
      url: item.url || item.linkUrl || "",
      description: item.description || "",
      fileName: item.fileName || "",
      fileSize: item.fileSize || 0,
      fileType: item.fileType || "",
      fileDataUrl: item.fileDataUrl || "",
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;

    // Supports standard formats (PDF, DOC, DOCX, PNG, JPG, JPEG) up to 5MB
    const validation = validateCertificationFile(file, lang);
    if (!validation.valid) {
      setErr(t(lang, validation.error));
      return;
    }

    // Cumulative 10MB quota validation across the profile
    const currentProfile = getProfile();
    const quotaValidation = validateCumulativeProfileAttachmentQuota(
      file.size,
      currentProfile,
      { excludePortfolioItemId: editingId },
      lang
    );

    if (!quotaValidation.valid) {
      setErr(t(lang, quotaValidation.error));
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        fileDataUrl: dataUrl,
      }));
      setErr("");
    } catch {
      setErr(t(lang, "Failed to read attachment file."));
    }
  };

  const handleRemoveFile = () => {
    setForm((prev) => ({
      ...prev,
      fileName: "",
      fileSize: 0,
      fileType: "",
      fileDataUrl: "",
    }));
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      setErr(isVi ? "Vui lòng nhập tên dự án / sản phẩm (bắt buộc)." : "Project title is required.");
      return;
    }

    // Normalize URL
    let cleanUrl = form.url.trim();
    if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const itemData = {
      id: editingId || `port-${Date.now()}`,
      title: form.title.trim(),
      role: form.role.trim(),
      fromDate: form.fromDate.trim(),
      toDate: form.isOngoing ? "Present" : form.toDate.trim(),
      isOngoing: !!form.isOngoing,
      url: cleanUrl,
      description: form.description.trim(),
      fileName: form.fileName || "",
      fileSize: form.fileSize || 0,
      fileType: form.fileType || "",
      fileDataUrl: form.fileDataUrl || "",
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    let updatedList;
    if (editingId) {
      updatedList = items.map((it) => (it.id === editingId ? itemData : it));
    } else {
      updatedList = [itemData, ...items];
    }

    onChange({
      ...portfolio,
      items: updatedList,
      projects: updatedList,
    });

    resetForm();
  };

  const handleDelete = (id) => {
    const updatedList = items.filter((it) => it.id !== id);
    onChange({
      ...portfolio,
      items: updatedList,
      projects: updatedList,
    });
    if (editingId === id) resetForm();
  };

  // ── Default Résumé Projects Extraction Trigger ──
  const handleOpenExtract = async () => {
    setIsExtracting(true);
    const currentProfile = propProfile || getProfile();
    try {
      const { projects, sourceName } = await getProjectsFromDefaultResume(currentProfile, lang);
      setSourceResumeName(sourceName || (isVi ? "CV mặc định" : "Default Résumé"));
      setExtractedList(projects || []);
      setSelectedExtractIds(new Set((projects || []).map((x) => x.id)));
      setIsExtracting(false);
      setIsExtractModalOpen(true);
    } catch (err) {
      console.warn("Failed to extract projects from default resume:", err);
      setSourceResumeName(isVi ? "CV mặc định" : "Default Résumé");
      setExtractedList([]);
      setSelectedExtractIds(new Set());
      setIsExtracting(false);
      setIsExtractModalOpen(true);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedExtractIds.size === extractedList.length) {
      setSelectedExtractIds(new Set());
    } else {
      setSelectedExtractIds(new Set(extractedList.map((x) => x.id)));
    }
  };

  const toggleSelectExtract = (id) => {
    setSelectedExtractIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApplyExtracted = () => {
    const toImport = extractedList.filter((x) => selectedExtractIds.has(x.id));
    if (toImport.length === 0) {
      setIsExtractModalOpen(false);
      return;
    }

    const merged = [...toImport, ...items];
    onChange({
      ...portfolio,
      items: merged,
      projects: merged,
    });

    setIsExtractModalOpen(false);
    setFeedbackMsg(
      isVi
        ? `Đã thêm thành công ${toImport.length} dự án từ CV mặc định!`
        : `Successfully imported ${toImport.length} projects from default résumé!`
    );
    setTimeout(() => setFeedbackMsg(""), 3500);
  };

  return (
    <div className="flex flex-col gap-4 font-body">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <Icon name="briefcase" size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink m-0">
                {t(lang, "Portfolio & Project Showcase")}
              </h3>
              <InfoTip
                content={
                  isVi
                    ? "Giới thiệu các dự án nổi bật, sản phẩm thực tế, đường dẫn GitHub, Behance hoặc đính kèm tệp hồ sơ năng lực (tối đa 5MB)."
                    : "Showcase notable projects, code repositories, design portfolios, or project attachments (max 5MB)."
                }
                title={t(lang, "Portfolio & Projects")}
              />
            </div>
            <p className="text-xs text-muted m-0 mt-0.5">
              {t(lang, "Showcase your projects and accomplishments to employers.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Extract from Resume Button */}
          <button
            type="button"
            onClick={handleOpenExtract}
            disabled={isExtracting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors shadow-2xs cursor-pointer"
            title={t(lang, "Automatically extract projects from your default resume")}
          >
            <Icon name={isExtracting ? "refresh-cw" : "sparkles"} size={14} className={isExtracting ? "lv-spin" : "text-purple-600"} />
            <span>{isExtracting ? (isVi ? "Đang trích xuất…" : "Extracting…") : isVi ? "Trích xuất từ CV mặc định" : "Extract from Default Résumé"}</span>
          </button>

          {!isAdding && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-hover transition-colors shadow-2xs cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>{isVi ? "Thêm dự án" : "Add Project"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Inline Add / Edit Form ── */}
      {isAdding && (
        <div className="p-4 sm:p-5 rounded-2xl border border-brand/40 bg-card shadow-sm flex flex-col gap-4 animate-in fade-in transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <strong className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2">
              <Icon name={editingId ? "edit-2" : "folder-plus"} size={16} className="text-brand" />
              {editingId
                ? isVi ? "Chỉnh sửa dự án / tác phẩm" : "Edit Portfolio Project"
                : isVi ? "Thêm dự án / tác phẩm mới" : "Add New Portfolio Project"}
            </strong>
            <button
              type="button"
              onClick={resetForm}
              className="text-muted hover:text-ink text-xs p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {err && (
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <Icon name="alert-circle" size={14} className="shrink-0 text-rose-600" />
              <span>{err}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Title (Mandatory) */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-ink flex items-center gap-1 mb-1">
                <span>{isVi ? "Tên dự án / Sản phẩm" : "Project Title"}</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={isVi ? "Ví dụ: Ứng dụng Quản lý Tài chính FinTech" : "e.g. Next.js Enterprise E-Commerce Platform"}
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-shadow"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                {isVi ? "Vai trò của bạn trong dự án" : "Your Role"}
              </label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder={isVi ? "Ví dụ: Lead Frontend Developer, Product Designer" : "e.g. Lead Fullstack Engineer, UX/UI Lead"}
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-shadow"
              />
            </div>

            {/* Project URL */}
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                {isVi ? "Đường dẫn dự án / Demo URL" : "Project Link (URL)"}
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="e.g. https://github.com/myname/project or https://behance.net/..."
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-shadow"
              />
            </div>

            {/* From Date */}
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                {isVi ? "Thời gian bắt đầu (Từ)" : "From Date"}
              </label>
              <input
                type="month"
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* To Date + Ongoing Checkbox */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-ink">
                  {isVi ? "Thời gian hoàn thành (Đến)" : "To Date"}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted hover:text-ink">
                  <input
                    type="checkbox"
                    checked={form.isOngoing}
                    onChange={(e) => setForm({ ...form, isOngoing: e.target.checked })}
                    className="rounded border-slate-300 text-brand focus:ring-brand h-3.5 w-3.5"
                  />
                  <span>{isVi ? "Đang phát triển / Hiện tại" : "Ongoing / Present"}</span>
                </label>
              </div>
              <input
                type="month"
                disabled={form.isOngoing}
                value={form.isOngoing ? "" : form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                placeholder={form.isOngoing ? (isVi ? "Hiện tại" : "Present") : ""}
                className={`w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
                  form.isOngoing ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900" : ""
                }`}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-ink block mb-1">
                {isVi ? "Mô tả dự án & kết quả nổi bật" : "Description & Achievements"}
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={
                  isVi
                    ? "Mô tả bài toán dự án, các công nghệ sử dụng, giải pháp kiến trúc và kết quả đạt được..."
                    : "Detail the problem solved, technologies implemented, key architecture decisions, and business impact..."
                }
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand leading-relaxed"
              />
            </div>

            {/* File Attachment (PDF, DOC, DOCX, PNG, JPG up to 5MB) */}
            <div className="md:col-span-2 pt-2 border-t border-line">
              <label className="text-xs font-semibold text-ink block mb-1">
                {isVi ? "Tệp đính kèm dự án / Case Study (Tùy chọn)" : "Project Attachment / Case Study (Optional)"}
              </label>

              {form.fileName ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-sunken">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon name="file-text" size={16} className="text-brand shrink-0" />
                    <div className="truncate">
                      <span className="block text-xs font-bold text-ink truncate">{form.fileName}</span>
                      <span className="block text-[11px] text-muted">
                        {(form.fileSize / 1024).toFixed(0)} KB · {isVi ? "Đính kèm sẵn sàng" : "Attached & ready"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                    title={isVi ? "Xóa tệp đính kèm" : "Remove attachment"}
                  >
                    <Icon name="trash-2" size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-line bg-card hover:bg-sunken text-ink transition-colors cursor-pointer shadow-2xs"
                  >
                    <Icon name="upload-cloud" size={14} className="text-muted" />
                    <span>{isVi ? "Tải lên tài liệu / Ảnh" : "Upload Document / Image"}</span>
                  </button>
                  <span className="text-[11px] text-muted">
                    {isVi ? "Hỗ trợ PDF, DOC, DOCX, PNG, JPG tối đa 5MB" : "PDF, DOC, DOCX, PNG, JPG up to 5MB (counts towards 10MB quota)"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
            <button
              type="button"
              onClick={resetForm}
              className="px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-ink rounded-lg border border-line hover:bg-sunken transition-colors"
            >
              {isVi ? "Hủy bỏ" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg shadow-2xs transition-colors"
            >
              {editingId ? (isVi ? "Cập nhật dự án" : "Update Project") : isVi ? "Lưu dự án" : "Save Project"}
            </button>
          </div>
        </div>
      )}

      {/* ── Feedback Toast / Banner ── */}
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Icon name="check-circle" size={16} className="text-purple-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── Empty State ── */}
      {items.length === 0 && !isAdding && (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center bg-sunken/40 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
            <Icon name="folder-git-2" size={24} />
          </div>
          <div className="max-w-md">
            <h4 className="text-sm font-bold text-ink">
              {isVi ? "Chưa có dự án nào trong hồ sơ năng lực" : "No portfolio items added yet"}
            </h4>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {isVi
                ? "Thêm các dự án tiêu biểu, ứng dụng, thiết kế hoặc trích xuất tự động từ CV của bạn để gây ấn tượng mạnh với nhà tuyển dụng."
                : "Add notable projects, apps, case studies, or extract them automatically from your uploaded CV to stand out to employers."}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenExtract}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Icon name="sparkles" size={14} className="text-purple-600" />
              <span>{isVi ? "Trích xuất từ CV mặc định" : "Extract from Default Résumé"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-hover transition-colors shadow-2xs cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>{isVi ? "Thêm dự án đầu tiên" : "Add First Project"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Portfolio Items List ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5">
          {items.map((item) => {
            const dateRange = [
              formatProjectDate(item.fromDate, lang),
              item.isOngoing || item.toDate === "Present"
                ? isVi ? "Hiện tại" : "Present"
                : formatProjectDate(item.toDate, lang),
            ]
              .filter(Boolean)
              .join(" – ");

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border border-line bg-card hover:border-line-strong transition-all shadow-2xs flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-ink truncate m-0">
                        {item.title}
                      </h4>
                      {item.role && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-subtle text-brand border border-brand/20">
                          {item.role}
                        </span>
                      )}
                      {item.extractedFromResume && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Icon name="sparkles" size={10} />
                          <span>CV</span>
                        </span>
                      )}
                    </div>

                    {dateRange && (
                      <span className="text-xs font-medium text-muted flex items-center gap-1.5">
                        <Icon name="calendar" size={12} className="text-faint" />
                        <span>{dateRange}</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="p-1.5 text-muted hover:text-brand hover:bg-brand-subtle rounded-lg transition-colors cursor-pointer"
                      title={isVi ? "Chỉnh sửa dự án" : "Edit project"}
                    >
                      <Icon name="edit-2" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={isVi ? "Xóa dự án" : "Delete project"}
                    >
                      <Icon name="trash-2" size={14} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-ink/80 leading-relaxed m-0 whitespace-pre-wrap">
                    {item.description}
                  </p>
                )}

                {/* Footer Links & Attachment */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-line/60">
                  {/* External Project Link */}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-link hover:text-brand-hover transition-colors"
                    >
                      <Icon name="external-link" size={13} />
                      <span className="truncate max-w-[240px] sm:max-w-md">{item.url}</span>
                    </a>
                  ) : (
                    <span />
                  )}

                  {/* Attachment Chip */}
                  {item.fileName && (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-line bg-sunken text-xs font-medium text-ink">
                      <Icon name="paperclip" size={12} className="text-muted" />
                      <span className="truncate max-w-[160px]">{item.fileName}</span>
                      {item.fileSize ? (
                        <span className="text-[10px] text-muted">
                          ({(item.fileSize / 1024).toFixed(0)} KB)
                        </span>
                      ) : null}
                      {item.fileDataUrl && (
                        <a
                          href={item.fileDataUrl}
                          download={item.fileName}
                          className="text-brand hover:text-brand-hover p-0.5"
                          title="Download file"
                        >
                          <Icon name="download" size={12} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Resume Extraction Modal ── */}
      {isExtractModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[85vh] my-auto overflow-hidden">
            <div className="flex items-start justify-between pb-3 border-b border-line gap-3 shrink-0">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shrink-0 mt-0.5">
                  <Icon name="sparkles" size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-ink m-0 leading-tight">
                    {isVi ? "Dự án phát hiện từ CV mặc định" : "Projects Detected from Default Résumé"}
                  </h4>
                  <p className="text-xs text-muted m-0 mt-1">
                    {isVi ? "Chọn các mục bạn muốn thêm vào hồ sơ năng lực:" : "Select the projects you wish to import to your portfolio:"}
                  </p>
                  {sourceResumeName && (
                    <div className="mt-1.5">
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {isVi ? "Nguồn: " : "Source: "}{sourceResumeName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExtractModalOpen(false)}
                className="text-muted hover:text-ink p-1 rounded-md shrink-0 cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {extractedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-sunken/40 rounded-xl border border-dashed border-line my-auto">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                  <Icon name="folder" size={24} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-ink m-0">
                    {isVi ? "Không tìm thấy dự án trong CV mặc định" : "No projects detected in default résumé"}
                  </h5>
                  <p className="text-xs text-muted m-0 mt-1 max-w-sm">
                    {isVi
                      ? "CV không có mục dự án hoặc kết quả công việc riêng biệt. Bạn có thể tự thêm dự án bằng nút \"Thêm dự án\"."
                      : "The résumé does not contain separate project records or deliverables. You can add your projects manually using the \"Add Project\" button."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 shrink-0">
                  <span className="text-xs text-muted">
                    {selectedExtractIds.size} / {extractedList.length} {isVi ? "mục được chọn" : "selected"}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
                  >
                    {selectedExtractIds.size === extractedList.length
                      ? isVi ? "Bỏ chọn tất cả" : "Deselect All"
                      : isVi ? "Chọn tất cả" : "Select All"}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {extractedList.map((ext) => {
                    const isSelected = selectedExtractIds.has(ext.id);
                    const displayDateRange = [
                      formatProjectDate(ext.fromDate, lang),
                      ext.isOngoing || ext.toDate === "Present"
                        ? isVi ? "Hiện tại" : "Present"
                        : formatProjectDate(ext.toDate, lang),
                    ]
                      .filter(Boolean)
                      .join(" – ");

                    return (
                      <div
                        key={ext.id}
                        onClick={() => toggleSelectExtract(ext.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? "border-purple-300 bg-purple-50/50 shadow-2xs"
                            : "border-line bg-card hover:border-line-strong"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-ink">{ext.title}</span>
                            {ext.role && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {ext.role}
                              </span>
                            )}
                          </div>
                          {displayDateRange && (
                            <span className="block text-[11px] text-muted">
                              {displayDateRange}
                            </span>
                          )}
                          {ext.description && (
                            <p className="text-xs text-ink/80 leading-relaxed m-0">
                              {ext.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-line shrink-0">
              <span className="text-xs text-muted">
                {extractedList.length > 0
                  ? `${selectedExtractIds.size} / ${extractedList.length} ${isVi ? "mục được chọn" : "selected"}`
                  : (isVi ? "0 dự án" : "0 projects")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExtractModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-ink rounded-lg border border-line hover:bg-sunken cursor-pointer"
                >
                  {extractedList.length === 0 ? (isVi ? "Đóng" : "Close") : (isVi ? "Hủy" : "Cancel")}
                </button>
                {extractedList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyExtracted}
                    disabled={selectedExtractIds.size === 0}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="check" size={14} />
                    <span>{isVi ? "Thêm vào Portfolio" : "Import to Portfolio"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
