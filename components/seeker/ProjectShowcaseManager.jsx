"use client";
import React, { useState } from "react";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";

export default function ProjectShowcaseManager({
  projects = [],
  onChange,
  lang = "EN",
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    role: "",
    url: "",
    technologies: "",
    description: "",
  });
  const [err, setErr] = useState("");

  const projectList = Array.isArray(projects) ? projects : [];

  const resetForm = () => {
    setForm({ title: "", role: "", url: "", technologies: "", description: "" });
    setErr("");
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (proj) => {
    setForm({
      title: proj.title || "",
      role: proj.role || "",
      url: proj.url || "",
      technologies: Array.isArray(proj.technologies)
        ? proj.technologies.join(", ")
        : proj.technologies || "",
      description: proj.description || "",
    });
    setEditingId(proj.id);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      setErr(t(lang, "Please enter a project title."));
      return;
    }

    const techList = form.technologies
      .split(/[,+]/)
      .map((x) => x.trim())
      .filter(Boolean);

    const projectData = {
      id: editingId || `proj-${Date.now()}`,
      title: form.title.trim(),
      role: form.role.trim(),
      url: form.url.trim(),
      technologies: techList,
      description: form.description.trim(),
    };

    let updated;
    if (editingId) {
      updated = projectList.map((p) => (p.id === editingId ? projectData : p));
    } else {
      updated = [...projectList, projectData];
    }

    onChange(updated);
    resetForm();
  };

  const handleDelete = (id) => {
    onChange(projectList.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-3 font-body">
      {/* Header section with explicit title & subtitle */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Icon name="folder-git-2" size={16} className="text-brand" />
            {t(lang, "Featured Projects & Case Studies")}
          </h4>
          <p className="text-xs text-muted">
            {t(lang, "Add your notable projects, apps, or design work (optional).")}
          </p>
        </div>

        {!isAdding && projectList.length > 0 && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-brand/30 bg-brand-subtle text-brand hover:bg-brand/10 transition-colors cursor-pointer shadow-xs"
          >
            <Icon name="plus" size={14} />
            {t(lang, "New Project")}
          </button>
        )}
      </div>

      {/* Empty State when no projects added */}
      {projectList.length === 0 && !isAdding && (
        <div className="border border-dashed border-line rounded-xl p-5 text-center bg-slate-50/50 dark:bg-slate-900/20 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-brand-subtle text-brand flex items-center justify-center">
            <Icon name="folder-git-2" size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">
              {t(lang, "No projects added yet")}
            </p>
            <p className="text-xs text-muted max-w-sm mt-0.5">
              {t(lang, "Add your notable projects, apps, or design work (optional).")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-hover transition-colors cursor-pointer shadow-xs mt-1"
          >
            <Icon name="plus" size={14} />
            {t(lang, "New Project")}
          </button>
        </div>
      )}

      {/* Inline Creation / Edit Form */}
      {isAdding && (
        <div className="p-3.5 rounded-xl border border-brand/30 bg-card shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-line">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Icon name={editingId ? "edit-2" : "plus-circle"} size={14} className="text-brand" />
              {editingId ? t(lang, "Edit Project") : t(lang, "New Project")}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-muted hover:text-ink text-xs p-1"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Project Title")} *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t(lang, "e.g. E-Commerce Web App")}
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Your Role / Contribution")}
              </label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Lead Developer, UI Designer"
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Project Link / Demo URL")}
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="e.g. https://github.com/myname/project or https://behance.net/..."
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Technologies (comma separated)")}
              </label>
              <input
                type="text"
                value={form.technologies}
                onChange={(e) => setForm({ ...form, technologies: e.target.value })}
                placeholder="e.g. React, Node.js, PostgreSQL"
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-ink block mb-1">
                {t(lang, "Short Description")}
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t(lang, "Brief summary of what you built and key results...")}
                className="w-full text-xs rounded-lg border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {err && (
            <p className="text-xs text-danger font-medium flex items-center gap-1">
              <Icon name="alert-circle" size={13} />
              {err}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-line">
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
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-brand text-white hover:bg-brand-hover cursor-pointer shadow-xs"
            >
              {editingId ? t(lang, "Save Changes") : t(lang, "Add Project")}
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      {projectList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {projectList.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-lg border border-line bg-card hover:border-brand/40 transition-all flex flex-col justify-between gap-2 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-ink truncate flex items-center gap-1.5">
                      <Icon name="code" size={14} className="text-brand shrink-0" />
                      <span>{p.title}</span>
                    </h5>
                    {p.role && (
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-brand bg-brand-subtle px-1.5 py-0.2 rounded">
                        {p.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="p-1 text-muted hover:text-brand rounded cursor-pointer"
                      title={t(lang, "Edit")}
                    >
                      <Icon name="edit-2" size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="p-1 text-muted hover:text-danger rounded cursor-pointer"
                      title={t(lang, "Delete")}
                    >
                      <Icon name="trash-2" size={13} />
                    </button>
                  </div>
                </div>

                {p.description && (
                  <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">
                    {p.description}
                  </p>
                )}
              </div>

              <div>
                {Array.isArray(p.technologies) && p.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.technologies.map((tItem, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted"
                      >
                        {tItem}
                      </span>
                    ))}
                  </div>
                )}

                {p.url && (
                  <div className="pt-1.5 mt-1.5 border-t border-line/60">
                    <a
                      href={p.url.startsWith("http") ? p.url : `https://${p.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand hover:underline inline-flex items-center gap-1 font-semibold truncate"
                    >
                      <Icon name="external-link" size={12} />
                      <span className="truncate">{p.url.replace(/^https?:\/\//, "")}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
