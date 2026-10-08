"use client";
import React, { useState, useRef } from "react";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";

/** Wrapper: read File as base64 data-URL */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function AchievementsManager({
  achievements = [],
  onChange,
  lang = "EN",
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    issuer: "",
    date: "",
    description: "",
    url: "",
    fileName: "",
    fileSize: 0,
    fileDataUrl: "",
  });
  const [err, setErr] = useState("");
  const fileInputRef = useRef(null);

  const list = Array.isArray(achievements) ? achievements : [];

  const resetForm = () => {
    setForm({
      title: "",
      issuer: "",
      date: "",
      description: "",
      url: "",
      fileName: "",
      fileSize: 0,
      fileDataUrl: "",
    });
    setErr("");
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (item) => {
    setForm({
      title: item.title || "",
      issuer: item.issuer || "",
      date: item.date || "",
      description: item.description || "",
      url: item.url || "",
      fileName: item.fileName || "",
      fileSize: item.fileSize || 0,
      fileDataUrl: item.fileDataUrl || "",
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErr(t(lang, "Certificate file must be under 5MB."));
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: file.size,
        fileDataUrl: dataUrl,
      }));
      setErr("");
    } catch {
      setErr(t(lang, "Failed to read file."));
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      setErr(t(lang, "Achievement title is required."));
      return;
    }

    const itemData = {
      id: editingId || `ach-${Date.now()}`,
      title: form.title.trim(),
      issuer: form.issuer.trim(),
      date: form.date.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      fileName: form.fileName || "",
      fileSize: form.fileSize || 0,
      fileDataUrl: form.fileDataUrl || "",
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    let updated;
    if (editingId) {
      updated = list.map((a) => (a.id === editingId ? itemData : a));
    } else {
      updated = [...list, itemData];
    }

    onChange(updated);
    resetForm();
  };

  const handleDelete = (id) => {
    const updated = list.filter((a) => a.id !== id);
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-3 font-body">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Icon name="award" size={16} className="text-amber-500" />
            {t(lang, "Achievements, Honors & Certifications")}
          </h4>
          <p className="text-xs text-muted">
            {t(lang, "Highlight awards, hackathons, academic honors, or company recognition.")}
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100/60 transition-colors cursor-pointer shadow-xs"
          >
            <Icon name="plus" size={14} />
            {t(lang, "Add Achievement")}
          </button>
        )}
      </div>

      {/* Inline Form */}
      {isAdding && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/50 bg-card shadow-sm flex flex-col gap-3 transition-all animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <strong className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Icon name="trophy" size={14} className="text-amber-500" />
              {editingId ? t(lang, "Edit Achievement") : t(lang, "Add Achievement / Award")}
            </strong>
            <button
              type="button"
              onClick={resetForm}
              className="text-muted hover:text-ink text-xs p-1"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Achievement / Award Title")} *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t(lang, "e.g. Winner - Vietnam TechFest Hackathon 2024")}
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Issuing Organization / Event")}
              </label>
              <input
                type="text"
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                placeholder={t(lang, "e.g. Ministry of Science and Technology, Shopee")}
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Issue Date / Year")}
              </label>
              <input
                type="text"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder={t(lang, "e.g. 2024 or Nov 2024")}
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Verification Link (optional)")}
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="e.g. https://credential.net/award or news article"
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Description / Key Highlights")}
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t(lang, "Describe the context, competition size, or reason for recognition...")}
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Proof Attachment */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Certificate / Proof File (optional)")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-line bg-card hover:bg-slate-50 text-ink cursor-pointer"
                >
                  <Icon name="upload-cloud" size={14} />
                  {form.fileName ? t(lang, "Replace Certificate") : t(lang, "Upload Certificate / Proof")}
                </button>

                {form.fileName && (
                  <div className="inline-flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-ink">
                    <Icon name="file-text" size={13} className="text-brand" />
                    <span className="font-medium truncate max-w-[200px]">{form.fileName}</span>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, fileName: "", fileSize: 0, fileDataUrl: "" }))}
                      className="text-muted hover:text-danger ml-1"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {err && (
            <p className="text-xs text-danger font-medium flex items-center gap-1">
              <Icon name="alert-circle" size={13} />
              {err}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-line bg-card hover:bg-slate-50 text-ink cursor-pointer"
            >
              {t(lang, "Cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 cursor-pointer shadow-xs"
            >
              {editingId ? t(lang, "Save Changes") : t(lang, "Add Achievement")}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {list.length === 0 && !isAdding ? (
        <div className="text-center py-6 px-4 border border-dashed border-line rounded-xl text-muted text-xs bg-slate-50/50 dark:bg-slate-900/30">
          <Icon name="award" size={24} className="mx-auto mb-1 text-amber-500/60" />
          <p className="font-semibold text-ink mb-0.5">{t(lang, "No achievements added yet")}</p>
          <p className="max-w-md mx-auto">
            {t(lang, "Add awards, hackathons, certifications, or standout milestones to elevate your profile.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-line bg-card hover:border-amber-400/50 transition-all flex flex-col justify-between gap-2 shadow-xs group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-ink truncate flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Icon name="medal" size={12} />
                      </span>
                      <span className="truncate">{item.title}</span>
                    </h5>
                    {(item.issuer || item.date) && (
                      <p className="text-[11px] text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {item.issuer && <span className="font-medium text-ink">{item.issuer}</span>}
                        {item.issuer && item.date && <span>•</span>}
                        {item.date && <span>{item.date}</span>}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="p-1 text-muted hover:text-brand rounded transition-colors cursor-pointer"
                      title={t(lang, "Edit")}
                    >
                      <Icon name="edit-2" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-muted hover:text-danger rounded transition-colors cursor-pointer"
                      title={t(lang, "Delete")}
                    >
                      <Icon name="trash-2" size={13} />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-muted line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {(item.url || item.fileName) && (
                <div className="pt-2 mt-2 border-t border-line/60 flex items-center justify-between text-xs">
                  {item.url && (
                    <a
                      href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline inline-flex items-center gap-1 font-semibold truncate text-[11.5px]"
                    >
                      <Icon name="external-link" size={12} />
                      <span className="truncate">{t(lang, "View Credential")}</span>
                    </a>
                  )}

                  {item.fileName && (
                    <span className="text-[11px] text-muted inline-flex items-center gap-1 ml-auto">
                      <Icon name="paperclip" size={11} className="text-amber-600" />
                      <span className="truncate max-w-[120px]">{item.fileName}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
