"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Reveal from "../../../components/ds/Reveal";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import PageHead from "../../../components/layout/PageHead";
import CompanyCard from "../../../components/companies/CompanyCard";
import Field from "../../../components/ds/Field";
import Check from "../../../components/ds/Check";
import { fetchPublicCompanies, fetchPublicJobs } from "../../../lib/api/publicApi";

const POPULAR_INDUSTRIES = [
  "All",
  "Technology",
  "Software & IT",
  "Finance & Banking",
  "Retail & Commerce",
  "Manufacturing",
  "Media & Creative",
];

export default function CompaniesClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [ind, setInd] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanies() {
      setLoading(true);
      try {
        const companiesData = await fetchPublicCompanies({
          search: q || undefined,
          industry: ind || undefined,
          verified_only: verifiedOnly || undefined,
        });

        if (Array.isArray(companiesData) && companiesData.length > 0) {
          setAllCompanies(companiesData);
        } else {
          // Fallback to extracting from jobs if company directory is cold-starting
          const data = await fetchPublicJobs();
          if (Array.isArray(data)) {
            const unique = [];
            const seen = new Set();
            data.forEach((j) => {
              const cName = j.company_name || j.company?.company_name || j.company;
              if (cName && !seen.has(cName)) {
                seen.add(cName);
                unique.push({
                  id: j.company_id || cName,
                  name: cName,
                  company_name: cName,
                  logo_url: j.company_logo || "",
                  verified: true,
                  industry: j.department || "Technology",
                  open_jobs_count: data.filter(
                    (jb) => (jb.company_name || jb.company?.company_name || jb.company) === cName
                  ).length,
                  location: j.location,
                  city: j.city || "Vietnam",
                  tagline: "Hiring top talent on LàmViệc360",
                });
              }
            });
            setAllCompanies(unique);
          }
        }
      } catch (e) {
        console.warn("Failed to load companies:", e);
      } finally {
        setLoading(false);
      }
    }
    loadCompanies();
  }, [q, ind, verifiedOnly]);

  const inds = [
    ...new Set(
      allCompanies
        .map((c) => c.industry)
        .filter(Boolean)
    ),
  ];

  const list = allCompanies.filter(
    (c) =>
      c.is_public !== false &&
      (!q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.tagline && c.tagline.toLowerCase().includes(q.toLowerCase()))) &&
      (!ind || c.industry === ind) &&
      (!verifiedOnly || c.verified)
  );

  const featuredCompanies = allCompanies.filter((c) => c.is_featured && c.is_public !== false);

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main>
        <PageHead
          lang={lang}
          crumb={t(lang, "Companies")}
          title={t(lang, "Discover companies you can trust.")}
          desc={t(lang, "Explore opportunities from companies reviewed and approved by LàmViệc360.")}
        >
          <form className="lv-search-bar" onSubmit={(e) => e.preventDefault()}>
            <div className="lv-search-field">
              <Icon name="search" size={18} />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t(lang, "Search by company name")}
                aria-label={t(lang, "Search by company name")}
              />
            </div>
          </form>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "var(--space-4)" }}>
            {POPULAR_INDUSTRIES.map((industryName) => {
              const active = (!ind && industryName === "All") || ind === industryName;
              return (
                <button
                  key={industryName}
                  type="button"
                  onClick={() => setInd(industryName === "All" ? "" : industryName)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: active ? "1.5px solid var(--blue-600)" : "1px solid var(--border-default)",
                    backgroundColor: active ? "var(--blue-50)" : "var(--surface-card)",
                    color: active ? "var(--blue-700)" : "var(--text-secondary)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {industryName === "All" ? t(lang, "All Industries") : t(lang, industryName)}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "var(--space-4)" }}>
            <Check label={t(lang, "Show verified companies only")} checked={verifiedOnly} onChange={() => setVerifiedOnly((v) => !v)} />
          </div>
        </PageHead>

        {featuredCompanies.length > 0 && !ind && !q && (
          <section className="lv-section" style={{ paddingTop: 36, paddingBottom: 12 }}>
            <div className="lv-spotlight-box">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="sparkles" size={16} style={{ color: "var(--blue-600)" }} />
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                  {t(lang, "Featured Employers on LàmViệc360")}
                </h3>
              </div>
              <div className="lv-company-grid">
                {featuredCompanies.slice(0, 3).map((c) => (
                  <CompanyCard key={c.id} c={c} lang={lang} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="lv-section" style={{ paddingTop: 36 }}>
          <div className="lv-results-bar">
            <div className="lv-results-count">
              <strong>{list.length}</strong> {t(lang, "companies")}
            </div>
          </div>
          {loading ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-tertiary)" }}>
              <p>{t(lang, "Loading verified companies...")}</p>
            </div>
          ) : list.length ? (
            <div className="lv-company-grid">
              {list.map((c) => (
                <Reveal key={c.id}>
                  <CompanyCard c={c} lang={lang} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="lv-empty">
              <h3>{t(lang, "No companies found")}</h3>
              <p>{t(lang, "Try adjusting your search keywords or industry filters.")}</p>
              {(q || ind || verifiedOnly) && (
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    setQ("");
                    setInd("");
                    setVerifiedOnly(false);
                  }}
                >
                  {t(lang, "Reset all filters")}
                </Button>
              )}
            </div>
          )}
        </section>
        <Reveal as="section" className="lv-final-cta lv-final-cta-navy">
          <h2>{t(lang, "Is your company hiring?")}</h2>
          <p>{t(lang, "Register, get verified and start posting jobs on LàmViệc360.")}</p>
          <div className="lv-final-cta-buttons">
            <Button variant="primary" size="lg" onClick={() => router.push("/company-register")}>
              {t(lang, "Register Your Company")}
            </Button>
            <Button variant="ghost" size="lg" style={{ color: "var(--text-inverse)", border: "1.5px solid rgba(255,255,255,0.5)" }} onClick={() => router.push("/employers")}>
              {t(lang, "For Employers")}
            </Button>
          </div>
        </Reveal>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
    </>
  );
}
