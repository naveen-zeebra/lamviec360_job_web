"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "../ds";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";
import { resolveMediaUrl } from "../../lib/api/publicApi";

export default function CompanyCard({ c, lang }) {
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);
  const compName = c.name || c.company_name || "Company";
  const logoText = (compName || "CO").slice(0, 2).toUpperCase();
  const rawLogo = c.logo_url || c.logo;
  const logoUrl = resolveMediaUrl(rawLogo);
  const openCount = c.open_jobs_count ?? c.openJobs ?? c.jobs ?? 0;
  const companyTarget = `/companies/${c.id || encodeURIComponent(compName)}`;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(companyTarget)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(companyTarget);
        }
      }}
      className="lv-company-card cursor-pointer"
    >
      <div className="lv-company-card-top">
        <Link href={companyTarget} onClick={(e) => e.stopPropagation()} className="lv-company-logo-wrap">
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={compName}
              className="lv-company-logo-img"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="lv-company-logo" aria-hidden="true">
              {logoText}
            </div>
          )}
        </Link>
        <div className="lv-company-card-title-group">
          <Link href={companyTarget} onClick={(e) => e.stopPropagation()} className="lv-company-name hover:text-blue-600 line-clamp-1">
            {compName}
          </Link>
          {c.verified && (
            <div className="mt-1">
              <Badge tone="brand">
                <Icon name="shield-check" size={11} /> {t(lang, "Verified")}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {c.tagline && (
        <p className="lv-company-tagline line-clamp-2">
          {c.tagline}
        </p>
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
        {(c.company_size || c.size) && (
          <span>
            <Icon name="users" size={14} />
            {c.company_size || c.size}
          </span>
        )}
      </div>

      <div className="lv-company-foot">
        <strong style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
          {openCount} {t(lang, "Open Jobs")}
        </strong>
        <Link href={companyTarget} onClick={(e) => e.stopPropagation()} className="lv-job-view">
          {t(lang, "Explore Showcase")} <Icon name="arrow-right" size={14} />
        </Link>
      </div>
    </div>
  );
}
