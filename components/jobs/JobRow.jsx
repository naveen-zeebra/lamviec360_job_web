"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button } from "../ds";
import Icon from "../ds/Icon";
import { useLang, t } from "../../utils/lang";
import { FILTER_VI } from "../../lib/data";


function formatJobRowExperience(job, lang) {
  const exp = job.experience || job.experience_level;
  if (exp === undefined || exp === null || exp === "") return job.level ? (lang === "VN" || lang === "VI" ? job.levelVi || job.level : job.level) : null;
  const s = String(exp).trim().toLowerCase();
  if (s === "0" || s === "fresher") return "Fresher";
  if (s === "0-1") return lang === "VN" || lang === "VI" ? "0 - 1 năm" : "0 - 1 yr";
  if (s === "1-3") return lang === "VN" || lang === "VI" ? "1 - 3 năm" : "1 - 3 yrs";
  if (s === "3-5") return lang === "VN" || lang === "VI" ? "3 - 5 năm" : "3 - 5 yrs";
  if (s === "5-10") return lang === "VN" || lang === "VI" ? "5 - 10 năm" : "5 - 10 yrs";
  if (s === "10+") return lang === "VN" || lang === "VI" ? "10+ năm" : "10+ yrs";
  if (/^\d+$/.test(s)) return s + " " + (lang === "VN" || lang === "VI" ? "năm" : "yrs");
  return lang === "VN" || lang === "VI" ? job.levelVi || job.level : job.level;
}

export default function JobRow({ job, lang, saved, onSave, isLoggedIn = false, hasApplied = false, allowClosed = false }) {
  // BR-201-09: Do not show expired, closed, or inactive jobs in public listings
  if (!allowClosed && (job?.isNoLongerAvailable || job?.isExpired || job?.isLive === false)) {
    return null;
  }

  const router = useRouter();
  const [imgFailed, setImgFailed] = useState(false);

  const companyName =
    typeof job.company === "string"
      ? job.company
      : job.company_name || job.company?.company_name || "Company";
  const logoText = companyName.slice(0, 2).toUpperCase();

  const logoUrl =
    !imgFailed && (job.company_logo || job.company?.logo_url || (job.companyObj && job.companyObj.logo_url))
      ? job.company_logo || job.company?.logo_url || job.companyObj.logo_url
      : null;

  const jobDetailHref = `/job-detail/${encodeURIComponent((job.title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + job.id)}`;

  return (
    <article className="lv-jobrow transition-all hover:shadow-sm">
      <div className="lv-job-logo flex items-center justify-center overflow-hidden bg-white border border-line rounded-xl" style={{ width: 56, height: 56 }} aria-hidden="true">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={companyName}
            className="h-full w-full object-contain p-1 rounded-xl"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="font-extrabold text-brand text-sm">{logoText}</span>
        )}
      </div>

      <div className="lv-jobrow-body flex-1 min-w-0">
        <h3 className="lv-job-title" style={{ marginBottom: "var(--space-1)" }}>
          <Link href={jobDetailHref} style={{ color: "inherit" }} className="hover:text-brand transition-colors">
            {(lang === "VN" || lang === "VI" ? job.titleVi || job.title : job.title)}
          </Link>
        </h3>

        <div className="lv-job-company flex items-center gap-2">
          <span className="truncate">{companyName}</span>
          {job.verified && (
            <Badge tone="brand">
              <Icon name="check" size={11} /> {t(lang, "Verified")}
            </Badge>
          )}

        </div>

        <div className="lv-job-meta mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Icon name="map-pin" size={13} />
            {(lang === "VN" || lang === "VI" ? job.locationVi || job.location : job.location)}
          </span>
          <span className="flex items-center gap-1 font-semibold text-ink">
            <Icon name="wallet" size={13} className="text-emerald-600" />
            {job.salary}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="clock" size={13} />
            {(lang === "VN" || lang === "VI" ? job.postedVi || job.posted : job.posted)}
          </span>
          {/* Application End Date / Deadline */}
          {(() => {
            const rawDeadline = job.deadline || job.expires_at;
            if (!rawDeadline) {
              return (
                <span className="flex items-center gap-1 text-slate-500">
                  <Icon name="calendar" size={13} />
                  <span>{lang === "VN" || lang === "VI" ? "Hạn nộp: Tuyển liên tục" : "Apply by: Open until filled"}</span>
                </span>
              );
            }
            try {
              const d = new Date(rawDeadline);
              if (isNaN(d.getTime())) return null;
              const now = new Date();
              const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const dateStr = d.toLocaleDateString(lang === "VN" || lang === "VI" ? "vi-VN" : "en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
              const isUrgent = diffDays > 0 && diffDays <= 3;
              return (
                <span className={`flex items-center gap-1 font-medium ${isUrgent ? "text-amber-600 font-semibold" : ""}`}>
                  <Icon name="calendar" size={13} className={isUrgent ? "text-amber-600" : "text-muted"} />
                  <span>
                    {lang === "VN" || lang === "VI" ? `Hạn nộp: ${dateStr}` : `Apply by: ${dateStr}`}
                    {isUrgent && (
                      <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        {lang === "VN" || lang === "VI" ? `Còn ${diffDays} ngày` : `${diffDays}d left`}
                      </span>
                    )}
                  </span>
                </span>
              );
            } catch {
              return null;
            }
          })()}
        </div>

        {/* Tags & Skills */}
        <div className="lv-job-tags mt-2 flex flex-wrap items-center gap-1.5">
          {job.isNoLongerAvailable && (
            <Badge tone="danger">
              <Icon name="alert-circle" size={11} /> {lang === "VN" || lang === "VI" ? "Đã đóng" : "No Longer Available"}
            </Badge>
          )}
          <Badge tone="neutral">{(lang === "VN" || lang === "VI" ? FILTER_VI[job.type] || job.type : job.type)}</Badge>
          <Badge tone="neutral">{(lang === "VN" || lang === "VI" ? job.modeVi || job.mode : job.mode)}</Badge>
          {formatJobRowExperience(job, lang) && <Badge tone="neutral">{formatJobRowExperience(job, lang)}</Badge>}

          {/* Top Required Skills Tags */}
          {Array.isArray(job.skills) &&
            job.skills.slice(0, 3).map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {s}
              </span>
            ))}
        </div>
      </div>

      <div className="lv-jobrow-actions flex items-center gap-2">
        {isLoggedIn && (
          <button
            className="lv-job-save flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card hover:bg-sunken cursor-pointer transition-colors"
            aria-label={saved ? t(lang, "Unsave job") : t(lang, "Save job")}
            aria-pressed={!!saved}
            onClick={onSave}
          >
            <Icon
              name="heart"
              size={18}
              style={{
                fill: saved ? "var(--red-500, #ef4444)" : "none",
                color: saved ? "var(--red-500, #ef4444)" : "var(--gray-400, #94a3b8)",
              }}
            />
          </button>
        )}

        {job.isNoLongerAvailable ? (
          <Button
            variant="secondary"
            size="sm"
            disabled
            style={{ opacity: 0.65, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <Icon name="slash" size={13} style={{ color: "#dc2626" }} />
            {lang === "VN" || lang === "VI" ? "Đã đóng" : "No Longer Available"}
          </Button>
        ) : hasApplied ? (
          <Button
            variant="secondary"
            size="sm"
            disabled
            style={{ opacity: 0.85, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <Icon name="check-circle" size={14} style={{ color: "#16a34a" }} />
            {t(lang, "Applied")}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push(jobDetailHref)}
          >
            {t(lang, "Apply")}
          </Button>
        )}
      </div>
    </article>
  );
}
