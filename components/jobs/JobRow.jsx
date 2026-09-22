"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button } from "../ds";
import Icon from "../ds/Icon";
import { useLang, t } from "../../utils/lang";
import { FILTER_VI } from "../../lib/data";

export default function JobRow({ job, lang, saved, onSave }) {
  const router = useRouter();
  const companyName =
    typeof job.company === "string"
      ? job.company
      : job.company_name || job.company?.company_name || "Company";
  const logoText = companyName.slice(0, 2).toUpperCase();

  return (
    <article className="lv-jobrow">
      <div className="lv-job-logo" style={{ width: 52, height: 52 }} aria-hidden="true">
        {logoText}
      </div>
      <div className="lv-jobrow-body">
        <h3 className="lv-job-title" style={{ marginBottom: "var(--space-2)" }}>
          <Link href={`/job-detail?id=${job.id}`} style={{ color: "inherit" }}>
            {(lang === "VN" || lang === "VI" ? job.titleVi || job.title : job.title)}
          </Link>
        </h3>
        <div className="lv-job-company">
          {companyName}
          {job.verified && (
            <Badge tone="brand">
              <Icon name="check" size={11} /> {t(lang, "Verified")}
            </Badge>
          )}
        </div>
        <div className="lv-job-meta">
          <span>
            <Icon name="map-pin" size={14} />
            {(lang === "VN" || lang === "VI" ? job.locationVi : job.location)}
          </span>
          <span>
            <Icon name="wallet" size={14} />
            {job.salary}
          </span>
          <span>
            <Icon name="clock" size={14} />
            {(lang === "VN" || lang === "VI" ? job.postedVi : job.posted)}
          </span>
        </div>
        <div className="lv-job-tags">
          <Badge tone="neutral">{(lang === "VN" || lang === "VI" ? FILTER_VI[job.type] || job.type : job.type)}</Badge>
          <Badge tone="neutral">{(lang === "VN" || lang === "VI" ? job.modeVi : job.mode)}</Badge>
          <Badge tone="neutral">{(lang === "VN" || lang === "VI" ? job.levelVi : job.level)}</Badge>
        </div>
      </div>
      <div className="lv-jobrow-actions">
        <button
          className="lv-job-save"
          aria-label={saved ? t(lang, "Unsave job") : t(lang, "Save job")}
          aria-pressed={!!saved}
          onClick={onSave}
        >
          <Icon name="heart" size={18} style={{ fill: saved ? "var(--red-500)" : "none", color: saved ? "var(--red-500)" : "var(--gray-400)" }} />
        </button>
        <Button variant="primary" size="sm" onClick={() => router.push(`/job-detail?id=${job.id}`)}>
          {t(lang, "Apply")}
        </Button>
      </div>
    </article>
  );
}
