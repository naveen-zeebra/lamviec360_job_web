"use client";
import React, { useState } from "react";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";

const POPULAR_SKILLS = [
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "JavaScript",
  "SQL",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Figma",
  "Next.js",
  "Git",
  "REST APIs",
  "Tailwind CSS",
  "Agile / Scrum",
  "English",
];

export default function SkillSelectorRedesigned({
  skills = [],
  onChange,
  jobTitle = "",
  industry = "",
  lang = "EN",
}) {
  const [query, setQuery] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const currentSkills = Array.isArray(skills) ? skills : [];

  const addSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || query).trim();
    if (!trimmed) return;

    if (trimmed.length > 40) {
      setErrorNotice(t(lang, "Skill name must not exceed 40 characters."));
      return;
    }

    const exists = currentSkills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setErrorNotice(t(lang, `"${trimmed}" is already added.`));
      setTimeout(() => setErrorNotice(""), 2500);
      return;
    }

    setErrorNotice("");
    onChange([...currentSkills, trimmed]);
    setQuery("");
  };

  const removeSkill = (skillToRemove) => {
    onChange(currentSkills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="flex flex-col gap-3 font-body">
      {/* Input row */}
      <div>
        <label className="text-xs sm:text-sm font-semibold text-ink select-none block mb-1.5">
          {t(lang, "Skills")}
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (errorNotice) setErrorNotice("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={t(
                lang,
                "Type a skill and press Enter or comma (e.g. React, Python)"
              )}
              className="w-full rounded-lg border border-line bg-card px-3.5 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 cursor-pointer"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => addSkill()}
            disabled={!query.trim()}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            {t(lang, "Add")}
          </button>
        </div>

        {errorNotice && (
          <p className="text-xs text-danger font-medium flex items-center gap-1 mt-1.5">
            <Icon name="alert-circle" size={13} />
            {errorNotice}
          </p>
        )}
      </div>

      {/* Suggested popular skills */}
      <div>
        <span className="text-xs text-muted block mb-1.5">
          {t(lang, "Suggested skills (click to add):")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SKILLS.map((sk) => {
            const isAdded = currentSkills.some(
              (s) => s.toLowerCase() === sk.toLowerCase()
            );
            return (
              <button
                key={sk}
                type="button"
                onClick={() => (isAdded ? removeSkill(sk) : addSkill(sk))}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                  isAdded
                    ? "bg-brand/10 text-brand border border-brand/30 font-semibold"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-ink border border-transparent"
                }`}
              >
                <Icon name={isAdded ? "check" : "plus"} size={12} />
                <span>{sk}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected skills */}
      {currentSkills.length > 0 && (
        <div className="pt-2 border-t border-line">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink">
              {t(lang, "Selected Skills")} ({currentSkills.length}):
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] text-muted hover:text-danger cursor-pointer"
            >
              {t(lang, "Clear all")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-brand-subtle text-brand border border-brand/20 shadow-xs"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  aria-label={t(lang, "Remove") + " " + s}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-brand/70 hover:text-danger hover:bg-danger/10 cursor-pointer"
                >
                  <Icon name="x" size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
