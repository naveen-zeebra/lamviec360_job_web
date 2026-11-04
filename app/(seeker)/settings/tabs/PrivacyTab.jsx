"use client";
import { Select } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";

const VISIBILITY_OPTIONS = ["Public to employers", "Private", "Hidden from current employer"];
const RESUME_VISIBILITY_OPTIONS = ["Visible when I apply", "Always visible to employers", "Hidden"];

export default function PrivacyTab({
  profile,
  settings,
  handleJobAvailabilityChange,
  handleProfileVisibilityChange,
  persistSettings,
  liveSuccessMessage,
  lang,
  t,
}) {
  const currentAvailability =
    profile.jobAvailability || settings.privacy?.jobAvailability || "open_to_work";

  return (
    <div className="flex flex-col gap-5">
      {liveSuccessMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 animate-in fade-in duration-200">
          <Icon name="check-circle" size={16} className="text-emerald-600 shrink-0" />
          <span>{liveSuccessMessage}</span>
        </div>
      )}

      {/* ── Job Availability ── */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="m-0 text-base font-bold text-ink">
              {t(lang, "Availability Status")}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {t(lang, "Signal your hiring availability to employers and automated matching systems.")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t(lang, "Live Status")}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* 🟢 Open to Work */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleJobAvailabilityChange("open_to_work")}
            onKeyDown={(e) => e.key === "Enter" && handleJobAvailabilityChange("open_to_work")}
            className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
              currentAvailability === "open_to_work"
                ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-950/40"
                : "border-line bg-card hover:border-slate-300 hover:bg-sunken dark:hover:border-slate-700"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
                <strong className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {t(lang, "Open to Work")}
                </strong>
              </div>
              {currentAvailability === "open_to_work" && (
                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  {t(lang, "Active")}
                </span>
              )}
            </div>
            <p className="m-0 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
              {t(
                lang,
                "Actively looking for work. You are immediately available for interviews and prioritised in employer searches."
              )}
            </p>
          </div>

          {/* 🟡 Open to Relevant Opportunities */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleJobAvailabilityChange("open_to_opportunities")}
            onKeyDown={(e) => e.key === "Enter" && handleJobAvailabilityChange("open_to_opportunities")}
            className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
              currentAvailability === "open_to_opportunities"
                ? "border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-500/30 dark:bg-amber-950/40"
                : "border-line bg-card hover:border-slate-300 hover:bg-sunken dark:hover:border-slate-700"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]" />
                <strong className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {t(lang, "Open to Relevant Opportunities")}
                </strong>
              </div>
              {currentAvailability === "open_to_opportunities" && (
                <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  {t(lang, "Active")}
                </span>
              )}
            </div>
            <p className="m-0 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              {t(
                lang,
                "Passive matching. Open to hearing from recruiters about compelling positions matching your target salary and role."
              )}
            </p>
          </div>

          {/* 🔴 Not Looking */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleJobAvailabilityChange("not_looking")}
            onKeyDown={(e) => e.key === "Enter" && handleJobAvailabilityChange("not_looking")}
            className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
              currentAvailability === "not_looking"
                ? "border-rose-500 bg-rose-50/70 shadow-sm ring-1 ring-rose-500/30 dark:bg-rose-950/40"
                : "border-line bg-card hover:border-slate-300 hover:bg-sunken dark:hover:border-slate-700"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" />
                <strong className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  {t(lang, "Not Looking")}
                </strong>
              </div>
              {currentAvailability === "not_looking" && (
                <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  {t(lang, "Active")}
                </span>
              )}
            </div>
            <p className="m-0 text-xs leading-relaxed text-rose-800 dark:text-rose-300">
              {t(
                lang,
                "Not interested in job offers right now. Your profile is hidden from general talent discovery and recruiter search."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Profile Visibility Controls ── */}
      <div className="border-t border-line pt-5 hidden">
        <div className="mb-3.5">
          <h3 className="m-0 text-base font-bold text-ink">
            {t(lang, "Profile Visibility")}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {t(
              lang,
              "Profile visibility changes take effect immediately across all employer discovery channels."
            )}
          </p>
        </div>

        <div className="lv-form-grid">
          <Select
            label={t(lang, "Profile visibility")}
            value={settings.privacy?.profileVisibility}
            onChange={(e) => handleProfileVisibilityChange(e.target.value)}
            options={VISIBILITY_OPTIONS.map((v) => ({ value: v, label: t(lang, v) }))}
            placeholder={t(lang, "Select profile visibility")}
          />
          <Select
            label={t(lang, "Resume visibility")}
            value={settings.privacy?.resumeVisibility}
            onChange={(e) =>
              persistSettings({
                privacy: { ...settings.privacy, resumeVisibility: e.target.value },
              })
            }
            options={RESUME_VISIBILITY_OPTIONS.map((v) => ({ value: v, label: t(lang, v) }))}
            placeholder={t(lang, "Select resume visibility")}
          />
        </div>
      </div>

      {/* ── Inactive Profile Lifecycle Policy ── */}
      <div className="mt-1 rounded-xl border border-line bg-sunken p-4">
        <div className="flex items-start gap-3">
          <Icon name="archive" size={20} className="mt-0.5 shrink-0 text-indigo-500" />
          <div>
            <h4 className="m-0 text-sm font-bold text-ink">
              {t(lang, "Inactive Profile Archiving Policy")}
            </h4>
            <p className="my-1 text-xs leading-relaxed text-muted">
              {t(
                lang,
                "Profiles with no login activity for 12 months are automatically archived to protect privacy and maintain recruiter talent freshness. Archived profiles are hidden from employer discovery. Logging into your account at any time automatically unarchives and restores your profile."
              )}
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              {t(lang, "Account Status: Active (Logged in today)")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

