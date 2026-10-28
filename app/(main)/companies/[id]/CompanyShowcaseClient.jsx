"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/layout/Footer";
import { Button, Badge } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import Reveal from "../../../../components/ds/Reveal";
import { useLang, t } from "../../../../utils/lang";
import { fetchPublicCompanyDetail } from "../../../../lib/api/publicApi";

export default function CompanyShowcaseClient() {
  const params = useParams();
  const router = useRouter();
  const [lang, setLang] = useLang();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about"); // "about" | "jobs" | "contact"
  const [jobSearch, setJobSearch] = useState("");

  const idOrSlug = params?.id ? decodeURIComponent(params.id) : "";

  useEffect(() => {
    async function loadShowcase() {
      if (!idOrSlug) return;
      setLoading(true);
      try {
        const data = await fetchPublicCompanyDetail(idOrSlug);
        setCompany(data);
      } catch (err) {
        console.warn("Failed to load company detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShowcase();
  }, [idOrSlug]);

  if (loading) {
    return (
      <>
        <Header lang={lang} setLang={setLang} app="seeker" />
        <main className="lv-showcase-loading">
          <div className="lv-loading-spinner" />
          <p>{t(lang, "Loading company showcase...")}</p>
        </main>
        <Footer lang={lang} setLang={setLang} app="seeker" />
      </>
    );
  }

  // Guard for non-existent or private company
  if (!company || company.is_public === false) {
    return (
      <>
        <Header lang={lang} setLang={setLang} app="seeker" />
        <main className="lv-section" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="lv-empty" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
            <div className="flex justify-center mb-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Icon name="lock" size={24} />
              </span>
            </div>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: 8 }}>
              {t(lang, "Company Profile Unavailable")}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6, marginBottom: 20 }}>
              {t(
                lang,
                "This employer profile is currently private, undergoing review, or does not exist. Browse our verified companies directory to discover active opportunities."
              )}
            </p>
            <Button variant="primary" onClick={() => router.push("/companies")}>
              {t(lang, "Explore All Companies")}
            </Button>
          </div>
        </main>
        <Footer lang={lang} setLang={setLang} app="seeker" />
      </>
    );
  }

  const compName = company.company_name || company.name || "Company";
  const logoText = compName.slice(0, 2).toUpperCase();
  const openJobs = Array.isArray(company.open_jobs) ? company.open_jobs : [];

  const filteredJobs = openJobs.filter(
    (j) =>
      !jobSearch ||
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      (j.department && j.department.toLowerCase().includes(jobSearch.toLowerCase()))
  );

  const perksList = company.benefits
    ? company.benefits
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean)
    : [
        "13th Month Salary Bonus",
        "Comprehensive Healthcare Package",
        "Modern Engineering Hardware",
        "Flexible Hybrid Work Options",
        "Annual Company Retreat",
      ];

  const defaultCultureValues = [
    { title: "Innovation & Impact", description: "Empowering developers to build mission-critical products that redefine industries." },
    { title: "People & Continuous Growth", description: "Fostering mentorship, personal development budgets, and an inclusive work environment." },
    { title: "Integrity & High Standards", description: "Clear communication, quality code architecture, and high product ownership." },
  ];

  const cultureValues = company.culture_values && company.culture_values.length > 0
    ? company.culture_values
    : defaultCultureValues;

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main className="lv-showcase-page">
        {/* HERO HEADER SECTION (Clean showcase, no banner image) */}
        <section className="lv-showcase-hero" style={{ background: "linear-gradient(to bottom, var(--surface-bg) 0%, #ffffff 100%)", paddingTop: 36 }}>
          <div className="lv-showcase-header-wrap">
            <div className="lv-showcase-header" style={{ marginTop: 0 }}>
              {/* Company Logo */}
              <div className="lv-showcase-logo-box" style={{ width: 96, height: 96, borderRadius: 16 }}>
                {company.logo_url || company.logo ? (
                  <img
                    src={company.logo_url || company.logo}
                    alt={compName}
                    className="lv-showcase-logo-img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="lv-showcase-logo-fallback">{logoText}</div>
                )}
              </div>

              {/* Title & Tagline Group */}
              <div className="lv-showcase-title-box">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="lv-showcase-name">{compName}</h1>
                  {company.verified && (
                    <Badge tone="brand">
                      <Icon name="shield-check" size={12} /> {t(lang, "Verified Employer")}
                    </Badge>
                  )}
                  {company.is_featured && (
                    <Badge tone="info">
                      <Icon name="sparkles" size={12} /> {t(lang, "Featured")}
                    </Badge>
                  )}
                </div>

                {company.tagline && <p className="lv-showcase-tagline">{company.tagline}</p>}

                {/* Quick Facts Pills */}
                <div className="lv-showcase-meta-row">
                  <span>
                    <Icon name="building-2" size={14} />
                    {company.industry || "Technology"}
                  </span>
                  <span>
                    <Icon name="map-pin" size={14} />
                    {company.city || "Vietnam"}
                  </span>
                  {(company.company_size || company.size) && (
                    <span>
                      <Icon name="users" size={14} />
                      {company.company_size || company.size}
                    </span>
                  )}
                  {company.founded_year && (
                    <span>
                      <Icon name="calendar" size={14} />
                      {t(lang, "Founded")} {company.founded_year}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lv-showcase-link"
                    >
                      <Icon name="globe" size={14} />
                      {company.website.replace(/^https?:\/\//, "")}
                      <Icon name="arrow-up-right" size={12} />
                    </a>
                  )}
                </div>
              </div>

              {/* Right CTA */}
              <div className="lv-showcase-action-box">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setActiveTab("jobs");
                    const el = document.getElementById("showcase-tabs-anchor");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Icon name="briefcase" size={15} style={{ marginRight: 6 }} />
                  {t(lang, "View")} {openJobs.length} {t(lang, "Jobs")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* TABS NAVIGATION */}
        <div id="showcase-tabs-anchor" className="lv-showcase-tabs-bar">
          <div className="lv-showcase-tabs-container">
            <button
              type="button"
              className={`lv-showcase-tab ${activeTab === "about" ? "active" : ""}`}
              onClick={() => setActiveTab("about")}
            >
              <Icon name="info" size={16} />
              <span>{t(lang, "About & Culture")}</span>
            </button>
            <button
              type="button"
              className={`lv-showcase-tab ${activeTab === "jobs" ? "active" : ""}`}
              onClick={() => setActiveTab("jobs")}
            >
              <Icon name="briefcase" size={16} />
              <span>{t(lang, "Open Positions")}</span>
              <span className="lv-tab-count">{openJobs.length}</span>
            </button>
            <button
              type="button"
              className={`lv-showcase-tab ${activeTab === "contact" ? "active" : ""}`}
              onClick={() => setActiveTab("contact")}
            >
              <Icon name="map-pin" size={16} />
              <span>{t(lang, "Location & Office")}</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="lv-showcase-body">
          {/* TAB 1: ABOUT & CULTURE */}
          {activeTab === "about" && (
            <div className="lv-showcase-content-grid">
              <div className="lv-showcase-main-col">
                {/* About Story */}
                <Reveal as="div" className="lv-showcase-card">
                  <h2 className="lv-card-heading">
                    <Icon name="building-2" size={20} />
                    {t(lang, "About")} {compName}
                  </h2>
                  <p className="lv-showcase-description">
                    {company.about ||
                      t(
                        lang,
                        "We are a forward-thinking organization committed to delivering innovative products, empowering top talent, and shaping the future of work."
                      )}
                  </p>
                </Reveal>

                {/* Core Culture Values */}
                <Reveal as="div" className="lv-showcase-card">
                  <h2 className="lv-card-heading">
                    <Icon name="heart-handshake" size={20} />
                    {t(lang, "Our Core Culture & Values")}
                  </h2>
                  <p className="text-sm text-secondary mb-4">
                    {t(lang, "Principles that define how we build products, collaborate, and grow together.")}
                  </p>
                  <div className="lv-culture-values-grid">
                    {cultureValues.map((val, idx) => (
                      <div key={idx} className="lv-culture-value-card">
                        <div className="lv-value-num">0{idx + 1}</div>
                        <h3 className="lv-value-title">{val.title}</h3>
                        <p className="lv-value-desc">{val.description}</p>
                      </div>
                    ))}
                  </div>
                </Reveal>

                {/* Perks & Benefits */}
                <Reveal as="div" className="lv-showcase-card">
                  <h2 className="lv-card-heading">
                    <Icon name="gift" size={20} />
                    {t(lang, "Perks, Benefits & Rewards")}
                  </h2>
                  <div className="lv-perks-wrap">
                    {perksList.map((perk, idx) => (
                      <div key={idx} className="lv-perk-chip">
                        <Icon name="check-circle-2" size={15} style={{ color: "var(--blue-600)" }} />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>

              {/* Sidebar Info */}
              <div className="lv-showcase-side-col">
                <div className="lv-showcase-card">
                  <h3 className="lv-side-heading">{t(lang, "Workplace & Environment")}</h3>
                  <div className="lv-side-meta-list">
                    <div className="lv-side-meta-item">
                      <span className="lv-meta-label">{t(lang, "Work Model")}</span>
                      <strong className="lv-meta-val">{company.workplace_model || company.workplaceModel || "Hybrid"}</strong>
                    </div>
                    <div className="lv-side-meta-item">
                      <span className="lv-meta-label">{t(lang, "Working Schedule")}</span>
                      <strong className="lv-meta-val">{company.working_hours || company.workingHours || "Monday – Friday"}</strong>
                    </div>
                    <div className="lv-side-meta-item">
                      <span className="lv-meta-label">{t(lang, "Organization Type")}</span>
                      <strong className="lv-meta-val">{company.industry || "Technology"}</strong>
                    </div>
                    <div className="lv-side-meta-item">
                      <span className="lv-meta-label">{t(lang, "Team Size")}</span>
                      <strong className="lv-meta-val">{company.company_size || company.size || "11–50 employees"}</strong>
                    </div>
                  </div>
                </div>

                <div className="lv-showcase-card lv-cta-card">
                  <h3>{t(lang, "Join Our Team")}</h3>
                  <p>
                    {t(lang, "We are currently looking for motivated individuals to join our growing team.")}
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    style={{ width: "100%" }}
                    onClick={() => setActiveTab("jobs")}
                  >
                    {t(lang, "Explore Open Positions")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPEN POSITIONS */}
          {activeTab === "jobs" && (
            <div className="lv-showcase-jobs-section">
              <div className="lv-jobs-header-bar">
                <div>
                  <h2 className="lv-card-heading" style={{ margin: 0 }}>
                    {t(lang, "Current Openings at")} {compName}
                  </h2>
                  <span className="text-xs text-secondary">
                    {filteredJobs.length} {t(lang, "active job vacancies")}
                  </span>
                </div>

                <div className="lv-jobs-search-input">
                  <Icon name="search" size={15} />
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder={t(lang, "Search openings by title or team...")}
                  />
                </div>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="lv-showcase-jobs-list">
                  {filteredJobs.map((j) => (
                    <div key={j.id} className="lv-job-item-card">
                      <div className="lv-job-item-main">
                        <Link href={`/job-detail/${j.id}`} className="lv-job-item-title">
                          {j.title}
                        </Link>
                        <div className="lv-job-item-tags">
                          <span className="lv-job-tag">{j.department || "Engineering"}</span>
                          <span className="lv-job-tag">{j.mode || j.workplace_type || "Hybrid"}</span>
                          <span className="lv-job-tag">{j.type || j.job_type || "Full-time"}</span>
                          <span className="lv-job-tag salary">{j.salary}</span>
                        </div>
                        <div className="lv-job-item-meta">
                          <span>
                            <Icon name="map-pin" size={13} /> {j.location || j.city || "Vietnam"}
                          </span>
                          <span>
                            <Icon name="clock" size={13} /> {t(lang, "Posted")} {j.posted || "Recently"}
                          </span>
                        </div>
                      </div>

                      <div className="lv-job-item-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/job-detail/${j.id}`)}
                        >
                          {t(lang, "View Details")}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => router.push(`/job-detail/${j.id}?apply=true`)}
                        >
                          {t(lang, "Apply Now")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="lv-empty" style={{ padding: "48px 0" }}>
                  <Icon name="briefcase" size={32} style={{ color: "var(--text-tertiary)", margin: "0 auto 12px" }} />
                  <h3>{t(lang, "No openings match your search")}</h3>
                  <p>{t(lang, "Try searching with different keywords or check back soon.")}</p>
                  {jobSearch && (
                    <Button variant="ghost" size="sm" onClick={() => setJobSearch("")} style={{ marginTop: 12 }}>
                      {t(lang, "Clear search")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LOCATION & CONTACT */}
          {activeTab === "contact" && (
            <div className="lv-showcase-content-grid">
              <div className="lv-showcase-main-col">
                <div className="lv-showcase-card">
                  <h2 className="lv-card-heading">
                    <Icon name="map-pin" size={20} />
                    {t(lang, "Headquarters & Office")}
                  </h2>
                  <div className="lv-address-box">
                    <strong className="block text-base font-bold text-ink mb-1">{compName}</strong>
                    <p className="text-sm text-secondary leading-relaxed">
                      {company.address || `${company.city || "Ho Chi Minh City"}, ${company.country || "Vietnam"}`}
                    </p>
                  </div>

                  {company.legal_name && (
                    <div className="mt-4 pt-4 border-t border-line text-xs text-secondary">
                      <span className="font-semibold text-ink">{t(lang, "Legal Registered Entity")}:</span>{" "}
                      {company.legal_name}
                    </div>
                  )}
                </div>
              </div>

              <div className="lv-showcase-side-col">
                <div className="lv-showcase-card">
                  <h3 className="lv-side-heading">{t(lang, "Connect & Verify")}</h3>
                  <div className="flex flex-col gap-3 text-sm">
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-brand hover:underline font-medium"
                      >
                        <Icon name="globe" size={15} />
                        <span>{company.website}</span>
                      </a>
                    )}
                    {company.linkedin_url && (
                      <a
                        href={company.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-brand hover:underline font-medium"
                      >
                        <Icon name="link" size={15} />
                        <span>LinkedIn Profile</span>
                      </a>
                    )}
                    {company.facebook_url && (
                      <a
                        href={company.facebook_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-brand hover:underline font-medium"
                      >
                        <Icon name="link" size={15} />
                        <span>Facebook Fanpage</span>
                      </a>
                    )}
                    {(company.contact_email || company.email) && (
                      <div className="flex items-center gap-2 text-muted">
                        <Icon name="mail" size={15} />
                        <span>{company.contact_email || company.email}</span>
                      </div>
                    )}
                    {(company.contact_phone || company.phone) && (
                      <div className="flex items-center gap-2 text-muted">
                        <Icon name="phone" size={15} />
                        <span>{company.contact_phone || company.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
    </>
  );
}
