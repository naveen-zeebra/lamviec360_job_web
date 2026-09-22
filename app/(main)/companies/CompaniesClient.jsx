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
import { fetchPublicJobs } from "../../../lib/api/publicApi";

export default function CompaniesClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [ind, setInd] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [allCompanies, setAllCompanies] = useState([]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await fetchPublicJobs();
        if (Array.isArray(data)) {
          const unique = [];
          const seen = new Set();
          data.forEach((j) => {
            const cName = j.company_name || j.company?.company_name || j.company;
            if (cName && !seen.has(cName)) {
              seen.add(cName);
              unique.push({
                id: cName,
                name: cName,
                logo: cName.slice(0, 2).toUpperCase(),
                verified: true,
                industry: j.department || "Technology",
                jobs: data.filter(jb => (jb.company_name || jb.company?.company_name || jb.company) === cName).length,
                type: "Tech",
                location: j.location,
              });
            }
          });
          setAllCompanies(unique);
        }
      } catch (e) {}
    }
    loadCompanies();
  }, []);

  const inds = [...new Set(allCompanies.map((c) => c.industry))];
  const list = allCompanies.filter((c) => (!q || c.name.toLowerCase().includes(q.toLowerCase())) && (!ind || c.industry === ind) && (!verifiedOnly || c.verified));

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
          <div style={{ maxWidth: 320, marginTop: "var(--space-4)" }}>
            <Field>
              <Select label={t(lang, "Industry")} placeholder={t(lang, "All industries")} value={ind} onChange={(e) => setInd(e.target.value)} options={inds.map((i) => ({ value: i, label: i }))} />
            </Field>
          </div>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Check label={t(lang, "Show verified companies only")} checked={verifiedOnly} onChange={() => setVerifiedOnly((v) => !v)} />
          </div>
        </PageHead>
        <section className="lv-section" style={{ paddingTop: 56 }}>
          <div className="lv-results-bar">
            <div className="lv-results-count">
              <strong>{list.length}</strong> {t(lang, "companies")}
            </div>
          </div>
          {list.length ? (
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
              <p>{t(lang, "Try a different search term.")}</p>
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
