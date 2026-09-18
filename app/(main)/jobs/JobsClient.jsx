"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import PageHead from "../../../components/layout/PageHead";
import JobRow from "../../../components/jobs/JobRow";
import Field from "../../../components/ds/Field";
import Check from "../../../components/ds/Check";
import Toast, { useToast } from "../../../components/ds/Toast";
import { JOBS, COMPANIES, FILTER_VI } from "../../../lib/data";
import { isSaved, toggleSavedJob } from "../../../lib/seekerStore";
import { fetchPublicJobs } from "../../../lib/api/publicApi";

const TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const MODES = [
  ["Remote", "Từ xa"],
  ["Hybrid", "Kết hợp"],
  ["On-site", "Tại văn phòng"],
];
const LEVELS = [
  ["Entry-level", "Mới bắt đầu"],
  ["Mid-level", "Trung cấp"],
  ["Senior", "Cấp cao"],
];
const PER = 6;

export default function JobsClient() {
  const [lang, setLang] = useLang();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [loc, setLoc] = useState(params.get("loc") || "");
  const [types, setTypes] = useState(params.get("type") ? [params.get("type")] : []);
  const [modes, setModes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [company, setCompany] = useState(params.get("company") || "");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState({});
  const [jobList, setJobList] = useState(JOBS);
  const [toast, setToast] = useToast();

  useEffect(() => {
    async function loadBackendJobs() {
      try {
        const data = await fetchPublicJobs();
        if (Array.isArray(data) && data.length) {
          const transformed = data.map((j) => ({
            id: j.id,
            title: j.title,
            titleVi: j.title,
            company: j.company_name || "ABC Technologies",
            verified: true,
            location: j.location,
            locationVi: j.location,
            salary: j.salary_min && j.salary_max ? `${Math.round(j.salary_min / 1000000)}M – ${Math.round(j.salary_max / 1000000)}M VND` : "Negotiable",
            type: j.type,
            mode: (j.location || "").toLowerCase().includes("remote") ? "Remote" : "On-site",
            level: "Mid-level",
            industry: j.department || "Technology",
            posted: j.created_at || "Recently",
            postedVi: j.created_at || "Gần đây",
            skills: j.skills || [],
          }));
          const existingIds = new Set(transformed.map((t) => String(t.id)));
          const combined = [...transformed, ...JOBS.filter((j) => !existingIds.has(String(j.id)))];
          setJobList(combined);
        }
      } catch (err) {
        console.warn("Could not load backend public jobs:", err.message);
      }
    }
    loadBackendJobs();
  }, []);

  useEffect(() => {
    const map = {};
    jobList.forEach((j) => {
      map[j.id] = isSaved(j.id);
    });
    setSaved(map);
  }, [jobList]);

  const toggle = (list, set, v) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    setPage(1);
  };

  let jobs = jobList.filter((j) => {
    const hay = (j.title + " " + j.titleVi + " " + j.company + " " + j.skills.join(" ")).toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (loc && !(j.location + " " + j.locationVi).toLowerCase().includes(loc.toLowerCase())) return false;
    if (company && j.company !== company) return false;
    if (types.length && !types.includes(j.type)) return false;
    if (modes.length && !modes.includes(j.mode)) return false;
    if (levels.length && !levels.includes(j.level)) return false;
    return true;
  });
  if (sort === "salary") jobs = [...jobs].sort((a, b) => parseInt(b.salary) - parseInt(a.salary));
  if (sort === "title") jobs = [...jobs].sort((a, b) => a.title.localeCompare(b.title));
  const pages = Math.max(1, Math.ceil(jobs.length / PER));
  const shown = jobs.slice((page - 1) * PER, page * PER);
  const clearAll = () => {
    setTypes([]);
    setModes([]);
    setLevels([]);
    setCompany("");
    setQ("");
    setLoc("");
    setPage(1);
  };

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main>
        <PageHead
          lang={lang}
          crumb={t(lang, "Find Jobs")}
          title={t(lang, "Find the job that fits you.")}
          desc={t(lang, "Search by role, skills, company and location across Vietnam.")}
        >
          <form
            className="lv-search-bar"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
            }}
          >
            <div className="lv-search-field">
              <Icon name="search" size={18} />
              <input
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder={t(lang, "Job title, skills or company")}
                aria-label={t(lang, "Job title, skills or company")}
              />
            </div>
            <div className="lv-search-field lv-search-field-loc">
              <Icon name="map-pin" size={18} />
              <input
                type="text"
                value={loc}
                onChange={(e) => {
                  setLoc(e.target.value);
                  setPage(1);
                }}
                placeholder={t(lang, "Location")}
                aria-label={t(lang, "Location")}
              />
            </div>
            <Button variant="primary" size="lg" type="submit" style={{ whiteSpace: "nowrap" }}>
              {t(lang, "Search Jobs")}
            </Button>
          </form>
        </PageHead>
        <div className="lv-jobs-layout">
          <aside className="lv-sidebar" aria-label={t(lang, "Filters")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "var(--text-base)" }}>{t(lang, "Filters")}</strong>
              <button className="lv-quick-filter" onClick={clearAll}>
                {t(lang, "Clear all")}
              </button>
            </div>
            <div className="lv-filter-group">
              <h4>{t(lang, "Employment type")}</h4>
              <div className="lv-filter-opts">
                {TYPES.map((t) => (
                  <Check key={t} label={(lang === "VN" || lang === "VI" ? FILTER_VI[t] : t)} checked={types.includes(t)} onChange={() => toggle(types, setTypes, t)} />
                ))}
              </div>
            </div>
            <div className="lv-filter-group">
              <h4>{t(lang, "Work mode")}</h4>
              <div className="lv-filter-opts">
                {MODES.map((m) => (
                  <Check key={m[0]} label={(lang === "VN" || lang === "VI" ? m[1] : m[0])} checked={modes.includes(m[0])} onChange={() => toggle(modes, setModes, m[0])} />
                ))}
              </div>
            </div>
            <div className="lv-filter-group">
              <h4>{t(lang, "Experience level")}</h4>
              <div className="lv-filter-opts">
                {LEVELS.map((l) => (
                  <Check key={l[0]} label={(lang === "VN" || lang === "VI" ? l[1] : l[0])} checked={levels.includes(l[0])} onChange={() => toggle(levels, setLevels, l[0])} />
                ))}
              </div>
            </div>
            <div className="lv-filter-group">
              <Field>
                <Select
                  label={t(lang, "Company")}
                  placeholder={t(lang, "All companies")}
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    setPage(1);
                  }}
                  options={COMPANIES.map((c) => ({ value: c.name, label: c.name }))}
                />
              </Field>
            </div>
          </aside>
          <section>
            <div className="lv-results-bar">
              <div className="lv-results-count">
                <strong>{jobs.length}</strong> {t(lang, "jobs match your search")}
              </div>
              <label className="lv-sort">
                {t(lang, "Sort")}
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="recent">{t(lang, "Most recent")}</option>
                  <option value="salary">{t(lang, "Salary")}</option>
                  <option value="title">{t(lang, "Job title")}</option>
                </select>
              </label>
            </div>
            {shown.length ? (
              <div className="lv-job-list">
                {shown.map((j) => (
                  <JobRow
                    key={j.id}
                    job={j}
                    lang={lang}
                    saved={saved[j.id]}
                    onSave={() => {
                      toggleSavedJob(j.id);
                      const nowSaved = !saved[j.id];
                      setSaved((s) => ({ ...s, [j.id]: nowSaved }));
                      setToast(nowSaved ? t(lang, "Job saved") : t(lang, "Removed from saved jobs"));
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="lv-empty">
                <h3>{t(lang, "No jobs match those filters")}</h3>
                <p>{t(lang, "Try adjusting your keywords or clearing a few filters.")}</p>
                <div style={{ marginTop: 20 }}>
                  <Button variant="secondary" onClick={clearAll}>
                    {t(lang, "Clear filters")}
                  </Button>
                </div>
              </div>
            )}
            {pages > 1 && (
              <nav className="lv-pager" aria-label={t(lang, "Pagination")}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label={t(lang, "Previous page")}>
                  ‹
                </button>
                {Array.from({ length: pages }).map((_, i) => (
                  <button key={i} className={page === i + 1 ? "active" : ""} aria-current={page === i + 1 ? "page" : undefined} onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} aria-label={t(lang, "Next page")}>
                  ›
                </button>
              </nav>
            )}
          </section>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
      <Toast msg={toast} />
    </>
  );
}
