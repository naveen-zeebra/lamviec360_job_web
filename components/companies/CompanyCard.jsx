import Link from "next/link";
import { Badge } from "../ds";
import Icon from "../ds/Icon";
import { useLang, t } from "../../utils/lang";

export default function CompanyCard({ c, lang }) {
  const compName = c.name || c.company_name || "Company";
  const logoText = (c.logo || compName).slice(0, 2).toUpperCase();
  const openCount = c.openJobs ?? c.jobs ?? 1;

  return (
    <div className="lv-company-card">
      <div className="lv-company-logo" aria-hidden="true">
        {logoText}
      </div>
      <div className="lv-company-name">{compName}</div>
      {c.verified && (
        <div>
          <Badge tone="brand">
            <Icon name="shield-check" size={11} /> {t(lang, "Verified Company")}
          </Badge>
        </div>
      )}
      <div className="lv-company-meta">
        <span>
          <Icon name="building-2" size={14} />
          {(lang === "VN" || lang === "VI" ? c.industryVi || c.industry : c.industry) || "Technology"}
        </span>
        <span>
          <Icon name="map-pin" size={14} />
          {(lang === "VN" || lang === "VI" ? c.locationVi || c.location || c.city : c.location || c.city) || "Vietnam"}
        </span>
      </div>
      <div className="lv-company-foot">
        <strong style={{ fontSize: "var(--text-sm)" }}>
          {openCount} {t(lang, "Open Jobs")}
        </strong>
        <Link href={`/jobs?company=${encodeURIComponent(compName)}`} className="lv-job-view">
          {t(lang, "View Company")} <Icon name="arrow-right" size={14} />
        </Link>
      </div>
    </div>
  );
}
