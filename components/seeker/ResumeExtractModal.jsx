"use client";

import React, { useState, useEffect } from "react";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";

export default function ResumeExtractModal({
  isOpen,
  onClose,
  extractedData,
  onApply,
  lang = "EN",
}) {
  const isVi = lang === "VI";

  const [activeTab, setActiveTab] = useState("all");
  const [selectedSections, setSelectedSections] = useState({
    personal: true,
    professional: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
  });

  const [selectedProjectIds, setSelectedProjectIds] = useState(new Set());

  useEffect(() => {
    if (extractedData?.projects) {
      setSelectedProjectIds(new Set(extractedData.projects.map((p) => p.id)));
    }
  }, [extractedData]);

  if (!isOpen || !extractedData) return null;

  const toggleSection = (key) => {
    setSelectedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleProject = (id) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    const toApply = {};

    if (selectedSections.personal && extractedData.personal) {
      toApply.personal = extractedData.personal;
    }
    if (selectedSections.professional && extractedData.professional) {
      toApply.professional = {
        title: extractedData.professional.title,
        bio: extractedData.professional.bio,
      };
    }
    if (selectedSections.skills && extractedData.professional?.skills) {
      toApply.skills = extractedData.professional.skills;
    }
    if (selectedSections.experience && extractedData.experience) {
      toApply.experience = extractedData.experience;
    }
    if (selectedSections.education && extractedData.education) {
      toApply.education = extractedData.education;
    }
    if (selectedSections.projects && extractedData.projects) {
      toApply.projects = extractedData.projects.filter((p) => selectedProjectIds.has(p.id));
    }

    onApply(toApply);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl border border-line bg-card shadow-2xl flex flex-col max-h-[92vh] overflow-hidden font-body">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shadow-2xs">
              <Icon name="sparkles" size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink m-0">
                {isVi ? "Dữ liệu gốc trích xuất từ CV của bạn" : "Original Data Extracted from Résumé"}
              </h3>
              <p className="text-xs text-muted m-0 mt-0.5">
                {isVi
                  ? "Xem lại các thông tin được nhận diện và chọn mục cần cập nhật vào hồ sơ."
                  : "Review the extracted information and choose sections to auto-fill into your profile."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Section Selectors Bar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-line bg-sunken/40">
          <span className="text-xs font-semibold text-muted mr-1">
            {isVi ? "Chọn mục áp dụng:" : "Select to apply:"}
          </span>
          {[
            { key: "personal", label: isVi ? "Thông tin cá nhân" : "Personal Info" },
            { key: "professional", label: isVi ? "Chức danh & Giới thiệu" : "Title & Bio" },
            { key: "skills", label: isVi ? "Kỹ năng chuyên môn" : "Skills" },
            { key: "experience", label: isVi ? "Kinh nghiệm làm việc" : "Experience" },
            { key: "education", label: isVi ? "Học vấn" : "Education" },
            { key: "projects", label: isVi ? "Dự án / Portfolio" : "Portfolio Projects" },
          ].map((sec) => (
            <label
              key={sec.key}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                selectedSections[sec.key]
                  ? "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40"
                  : "bg-card text-muted border-line hover:text-ink"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedSections[sec.key]}
                onChange={() => toggleSection(sec.key)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
              />
              <span>{sec.label}</span>
            </label>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Personal & Contact */}
          {selectedSections.personal && extractedData.personal && (
            <div className="rounded-xl border border-line bg-card p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase tracking-wider text-muted">
                  <Icon name="user" size={14} className="text-brand" />
                  {isVi ? "Thông tin liên hệ & Cá nhân" : "Personal & Contact Information"}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {isVi ? "Đã nhận diện" : "Detected"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted block text-[11px]">{isVi ? "Họ và tên" : "Full Name"}:</span>
                  <strong className="text-ink text-sm">{extractedData.personal.fullName || "—"}</strong>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">{isVi ? "Chức danh hiện tại" : "Current Title"}:</span>
                  <strong className="text-ink text-sm">{extractedData.professional?.title || "—"}</strong>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Email:</span>
                  <span className="text-ink font-medium">{extractedData.personal.email || "—"}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">{isVi ? "Số điện thoại" : "Phone"}:</span>
                  <span className="text-ink font-medium">{extractedData.personal.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">{isVi ? "Địa điểm" : "Location"}:</span>
                  <span className="text-ink font-medium">{extractedData.personal.location || "—"}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Professional Summary & Bio */}
          {selectedSections.professional && extractedData.professional?.bio && (
            <div className="rounded-xl border border-line bg-card p-4 space-y-2 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Icon name="file-text" size={14} className="text-blue-600" />
                {isVi ? "Tóm tắt chuyên môn" : "Executive Summary & Bio"}
              </span>
              <p className="text-xs text-ink/80 leading-relaxed m-0 italic bg-sunken/40 p-3 rounded-lg border border-line/60">
                "{extractedData.professional.bio}"
              </p>
            </div>
          )}

          {/* 3. Core Technical Skills */}
          {selectedSections.skills && extractedData.professional?.skills?.length > 0 && (
            <div className="rounded-xl border border-line bg-card p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Icon name="code" size={14} className="text-indigo-600" />
                  {isVi ? "Kỹ năng chuyên môn trích xuất" : "Extracted Technical Skills"}
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {extractedData.professional.skills.length} {isVi ? "kỹ năng" : "skills"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {extractedData.professional.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-sunken border border-line text-ink"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4. Work Experience */}
          {selectedSections.experience && (extractedData.experience?.length > 0 ? (
            <div className="rounded-xl border border-line bg-card p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Icon name="briefcase" size={14} className="text-amber-600" />
                  {isVi ? "Kinh nghiệm làm việc" : "Work Experience Records"}
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {extractedData.experience.length} {isVi ? "vị trí" : "positions"}
                </span>
              </div>
              <div className="space-y-3">
                {extractedData.experience.map((exp, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-sunken/40 border border-line/80 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs text-ink font-bold">
                        {exp.title} — <span className="text-brand">{exp.company}</span>
                      </strong>
                      <span className="text-[11px] font-semibold text-muted shrink-0">
                        {exp.start} – {exp.end}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-ink/80 leading-relaxed whitespace-pre-wrap m-0">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-sunken/30 p-3.5 text-center">
              <span className="text-xs text-muted">
                {isVi ? "Không tìm thấy kinh nghiệm làm việc trong CV này." : "No work experience detected in this résumé."}
              </span>
            </div>
          ))}

          {/* 5. Education */}
          {selectedSections.education && (extractedData.education?.length > 0 ? (
            <div className="rounded-xl border border-line bg-card p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Icon name="book-open" size={14} className="text-cyan-600" />
                  {isVi ? "Học vấn & Bằng cấp" : "Education & Credentials"}
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {extractedData.education.length} {isVi ? "bằng cấp" : "credentials"}
                </span>
              </div>
              <div className="space-y-2">
                {extractedData.education.map((edu, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-sunken/40 border border-line/80 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-ink block font-bold">{edu.degree}</strong>
                      <span className="text-muted text-[11px]">{edu.institution}</span>
                    </div>
                    <span className="font-semibold text-muted">{edu.year}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-sunken/30 p-3.5 text-center">
              <span className="text-xs text-muted">
                {isVi ? "Không tìm thấy bằng cấp / học vấn trong CV này." : "No education records detected in this résumé."}
              </span>
            </div>
          ))}

          {/* 6. Portfolio Projects */}
          {selectedSections.projects && (extractedData.projects?.length > 0 ? (
            <div className="rounded-xl border border-line bg-card p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Icon name="folder-git-2" size={14} className="text-purple-600" />
                  {isVi ? "Dự án / Portfolio từ kết quả thực tế" : "Portfolio Projects from Real Deliverables"}
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {selectedProjectIds.size} / {extractedData.projects.length} {isVi ? "chọn" : "selected"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {extractedData.projects.map((proj) => {
                  const isChecked = selectedProjectIds.has(proj.id);
                  return (
                    <div
                      key={proj.id}
                      onClick={() => toggleProject(proj.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? "border-purple-300 bg-purple-50/40 dark:bg-purple-950/20"
                          : "border-line bg-card hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-xs text-ink">{proj.title}</strong>
                          {proj.role && (
                            <span className="text-[10px] font-bold text-brand bg-brand-subtle px-2 py-0.5 rounded">
                              {proj.role}
                            </span>
                          )}
                        </div>
                        {proj.description && (
                          <p className="text-xs text-ink/80 leading-relaxed m-0">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-sunken/30 p-3.5 text-center">
              <span className="text-xs text-muted">
                {isVi ? "Không tìm thấy dự án nào trong CV này." : "No projects detected in this résumé."}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-line bg-card">
          <span className="text-xs text-muted">
            {isVi
              ? "Dữ liệu được trích xuất trực tiếp từ tệp CV gốc đã tải lên."
              : "Original data parsed directly from your uploaded CV."}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-lg border border-line hover:bg-sunken transition-colors"
            >
              {isVi ? "Đóng" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="check" size={14} />
              <span>{isVi ? "Cập nhật vào hồ sơ" : "Apply to Profile"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
