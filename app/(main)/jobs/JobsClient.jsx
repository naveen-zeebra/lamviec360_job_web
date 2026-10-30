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
import { FILTER_VI } from "../../../lib/data";
import { isSaved, toggleSavedJob, isLoggedIn, hasAppliedToJob } from "../../../lib/seekerStore";
import { fetchPublicJobs } from "../../../lib/api/publicApi";
import { useMasterData, DEFAULT_MASTER_DATA } from "../../../lib/masterData";

const TYPES = DEFAULT_MASTER_DATA.jobTypes;
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


const SALARY_PRESETS = [
  { id: "all", label: "All Salaries", labelVi: "Tất cả mức lương", min: 0, max: Infinity },
  { id: "under-15m", label: "Under 15M VND", labelVi: "Dưới 15 triệu", min: 0, max: 15000000 },
  { id: "15m-30m", label: "15M – 30M VND", labelVi: "15 – 30 triệu", min: 15000000, max: 30000000 },
  { id: "30m-50m", label: "30M – 50M VND", labelVi: "30 – 50 triệu", min: 30000000, max: 50000000 },
  { id: "over-50m", label: "50M+ VND", labelVi: "Trên 50 triệu", min: 50000000, max: Infinity },
  { id: "negotiable", label: "Negotiable", labelVi: "Thỏa thuận", isNegotiable: true },
];

function parseJobSalary(j) {
  let min = j.salary_min !== undefined && j.salary_min !== null ? Number(j.salary_min) : null;
  let max = j.salary_max !== undefined && j.salary_max !== null ? Number(j.salary_max) : null;
  const s = String(j.salary || "").toLowerCase();
  const isNeg = Boolean(j.is_negotiable || s.includes("negotiable") || s.includes("thỏa thuận"));

  if (min === null && max === null && s) {
    const mMatch = s.match(/(\d+(?:\.\d+)?)\s*m/gi);
    if (mMatch && mMatch.length >= 2) {
      const nums = mMatch.map((v) => parseFloat(v) * 1000000);
      min = nums[0];
      max = nums[1];
    } else if (mMatch && mMatch.length === 1) {
      min = parseFloat(mMatch[0]) * 1000000;
      max = min;
    } else {
      const digits = s.replace(/,/g, "").match(/\d{7,10}/g);
      if (digits && digits.length >= 2) {
        min = Number(digits[0]);
        max = Number(digits[1]);
      } else if (digits && digits.length === 1) {
        min = Number(digits[0]);
      }
    }
  }
  return { min, max, isNegotiable: isNeg };
}

const EXP_PRESETS = [
  { id: "all", label: "All (0-30y)", labelVi: "Tất cả", min: 0, max: 30 },
  { id: "fresher", label: "Fresher (0y)", labelVi: "Fresher (0n)", min: 0, max: 0 },
  { id: "0-1", label: "0 - 1 yr", labelVi: "0 - 1 năm", min: 0, max: 1 },
  { id: "1-3", label: "1 - 3 yrs", labelVi: "1 - 3 năm", min: 1, max: 3 },
  { id: "3-5", label: "3 - 5 yrs", labelVi: "3 - 5 năm", min: 3, max: 5 },
  { id: "5-10", label: "5 - 10 yrs", labelVi: "5 - 10 năm", min: 5, max: 10 },
  { id: "10-30", label: "10+ yrs", labelVi: "10+ năm", min: 10, max: 30 },
];

function parseJobExperience(j) {
  const expRaw = j.experience || j.experience_level || "";
  const s = String(expRaw).trim().toLowerCase();
  if (!s) return { min: 0, max: 30, text: "" };
  if (s === "0" || s === "fresher" || s.includes("thực tập") || s.includes("intern")) return { min: 0, max: 0, text: "Fresher" };
  if (s === "0-1" || s.includes("entry")) return { min: 0, max: 1, text: "0 - 1 yr" };
  if (s === "1-3" || s === "junior") return { min: 1, max: 3, text: "1 - 3 yrs" };
  if (s === "3-5" || s.includes("mid")) return { min: 3, max: 5, text: "3 - 5 yrs" };
  if (s === "5-10" || s === "senior") return { min: 5, max: 10, text: "5 - 10 yrs" };
  if (s === "10+" || s.includes("lead") || s.includes("director") || s.includes("expert")) return { min: 10, max: 30, text: "10+ yrs" };
  
  const rangeMatch = s.match(/(\d+)\s*[-–to]\s*(\d+)/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10), text: rangeMatch[1] + " - " + rangeMatch[2] + " yrs" };
  }
  
  const numMatch = s.match(/\d+/);
  if (numMatch) {
    const val = parseInt(numMatch[0], 10);
    return s.includes("+")
      ? { min: val, max: 30, text: val + "+ yrs" }
      : { min: Math.max(0, val - 1), max: val, text: val + " yrs" };
  }
  return { min: 0, max: 30, text: "" };
}

export default function JobsClient() {
  const [lang, setLang] = useLang();
  const { jobTypes, industries } = useMasterData();
  const employmentTypes = jobTypes && jobTypes.length > 0 ? jobTypes : TYPES;
  const availableIndustries = industries && industries.length > 0 ? industries : DEFAULT_MASTER_DATA.industries;
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [loc, setLoc] = useState(params.get("loc") || "");
  const [types, setTypes] = useState(params.get("type") ? [params.get("type")] : []);
  const [modes, setModes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [expMin, setExpMin] = useState(0);
  const [expMax, setExpMax] = useState(30);
  const [salaryPreset, setSalaryPreset] = useState("all");
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [company, setCompany] = useState(params.get("company") || "");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState({});
  const [appliedMap, setAppliedMap] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [jobList, setJobList] = useState([]);
  const [toast, setToast] = useToast();

  useEffect(() => {
    async function loadBackendJobs() {
      try {
        const data = await fetchPublicJobs();
        if (Array.isArray(data) && data.length) {
          setJobList(data);
        }
      } catch (err) {
        console.warn("Could not load backend public jobs:", err.message);
      }
    }
    loadBackendJobs();
  }, []);

  useEffect(() => {
    const updateStoreState = () => {
      const isUserLoggedIn = isLoggedIn();
      setLoggedIn(isUserLoggedIn);

      const savedMap = {};
      const applied = {};
      jobList.forEach((j) => {
        savedMap[j.id] = isSaved(j.id);
        applied[j.id] = hasAppliedToJob(j.id);
      });
      setSaved(savedMap);
      setAppliedMap(applied);
    };

    updateStoreState();
    window.addEventListener("lv360-store", updateStoreState);
    return () => window.removeEventListener("lv360-store", updateStoreState);
  }, [jobList]);

  const toggle = (list, set, v) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    setPage(1);
  };

  const now = Date.now();
  const liveJobList = jobList.filter((j) => {
    if (!j) return false;
    // BR-201-09: Live jobs only - exclude expired, closed, or unapproved jobs
    if (j.isLive === false || j.isExpired === true || j.isNoLongerAvailable === true) {
      return false;
    }
    if (j.expires_at || j.deadline) {
      const exp = new Date(j.expires_at || j.deadline).getTime();
      if (!isNaN(exp) && exp < now) return false;
    }
    const status = String(j.status || "published").toLowerCase();
    if (status !== "published" && status !== "active" && status !== "open") {
      return false;
    }
    if (j.is_closed || j.is_deleted) return false;
    if (j.moderation_status && j.moderation_status.toLowerCase() !== "approved") return false;
    return true;
  });

  let jobs = liveJobList.filter((j) => {
    const skillsText = Array.isArray(j.skills) ? j.skills.join(" ") : j.skills || "";
    const hay = (
      (j.title || "") +
      " " +
      (j.titleVi || "") +
      " " +
      (j.company || "") +
      " " +
      skillsText
    ).toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (loc && !((j.location || "") + " " + (j.locationVi || "")).toLowerCase().includes(loc.toLowerCase())) return false;
    if (company && j.company !== company) return false;
    if (types.length && !types.includes(j.type || j.job_type)) return false;
    if (modes.length && !modes.includes(j.mode || j.workplace_type)) return false;
    if (levels.length && !levels.includes(j.level || j.experience_level)) return false;
    if (expMin > 0 || expMax < 30) {
      const jExp = parseJobExperience(j);
      if (jExp.max < expMin || jExp.min > expMax) return false;
    }
    // Salary Range Filter
    if (salaryPreset !== "all") {
      const jSal = parseJobSalary(j);
      if (salaryPreset === "negotiable") {
        if (!jSal.isNegotiable && (jSal.min !== null || jSal.max !== null)) return false;
      } else {
        const preset = SALARY_PRESETS.find((p) => p.id === salaryPreset);
        if (preset) {
          if (jSal.isNegotiable && jSal.min === null && jSal.max === null) return false;
          const jMin = jSal.min !== null ? jSal.min : 0;
          const jMax = jSal.max !== null ? jSal.max : (jSal.min !== null ? jSal.min : Infinity);
          if (jMax < preset.min || jMin > preset.max) return false;
        }
      }
    }
    // Industry Filter
    if (selectedIndustries.length > 0) {
      const jInd = (j.industry || j.department || "").toLowerCase();
      const matchesIndustry = selectedIndustries.some((ind) => {
        const target = ind.toLowerCase();
        return jInd.includes(target) || target.includes(jInd);
      });
      if (!matchesIndustry) return false;
    }
    return true;
  });

  if (sort === "salary") {
    jobs = [...jobs].sort((a, b) => parseInt(b.salary) - parseInt(a.salary));
  } else if (sort === "title") {
    jobs = [...jobs].sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // BR-201-08: Featured jobs appear at top of results
    jobs = [...jobs].sort((a, b) => {
      const aFeatured = a.is_featured || a.companyObj?.is_featured ? 1 : 0;
      const bFeatured = b.is_featured || b.companyObj?.is_featured ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }
  const pages = Math.max(1, Math.ceil(jobs.length / PER));
  const currentPage = Math.min(Math.max(1, page), pages);
  const shown = jobs.slice((currentPage - 1) * PER, currentPage * PER);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", pages];
    }
    if (currentPage >= pages - 3) {
      return [1, "...", pages - 4, pages - 3, pages - 2, pages - 1, pages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", pages];
  };

  const clearAll = () => {
    setTypes([]);
    setModes([]);
    setLevels([]);
    setExpMin(0);
    setExpMax(30);
    setSalaryPreset("all");
    setSelectedIndustries([]);
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
                {employmentTypes.map((t) => (
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

            {/* Industry Filter (Super Admin Master Data) */}
            <div className="lv-filter-group">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>{t(lang, "Industry")}</h4>
                {selectedIndustries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIndustries([]);
                      setPage(1);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--brand-600, #2563eb)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {lang === "VN" || lang === "VI" ? "Đặt lại" : "Reset"}
                  </button>
                )}
              </div>
              <div className="lv-filter-opts" style={{ maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                {availableIndustries.map((ind) => (
                  <Check
                    key={ind}
                    label={ind}
                    checked={selectedIndustries.includes(ind)}
                    onChange={() => toggle(selectedIndustries, setSelectedIndustries, ind)}
                  />
                ))}
              </div>
            </div>
            {/* Experience Slider Group (0 - 30 Years) */}
            <div className="lv-filter-group">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>{t(lang, "Experience level")}</h4>
                {(expMin > 0 || expMax < 30) && (
                  <button
                    type="button"
                    onClick={() => {
                      setExpMin(0);
                      setExpMax(30);
                      setPage(1);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--brand-600, #2563eb)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {lang === "VN" || lang === "VI" ? "Đặt lại" : "Reset"}
                  </button>
                )}
              </div>

              {/* Dynamic Range Value Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 10px",
                  borderRadius: 8,
                  backgroundColor: (expMin > 0 || expMax < 30) ? "#eff6ff" : "#f8fafc",
                  border: (expMin > 0 || expMax < 30) ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="award" size={14} style={{ color: (expMin > 0 || expMax < 30) ? "#2563eb" : "#64748b" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: (expMin > 0 || expMax < 30) ? "#1d4ed8" : "#334155" }}>
                    {expMin === 0 && expMax >= 30
                      ? (lang === "VN" || lang === "VI" ? "Tất cả (0 – 30+ năm)" : "Any (0 – 30+ yrs)")
                      : expMin === 0 && expMax === 0
                      ? (lang === "VN" || lang === "VI" ? "Fresher (0 năm)" : "Fresher (0 yrs)")
                      : expMin === 0 && expMax === 1
                      ? (lang === "VN" || lang === "VI" ? "Dưới 1 năm" : "Up to 1 yr")
                      : expMin === expMax
                      ? expMin + " " + (lang === "VN" || lang === "VI" ? "năm" : "years")
                      : expMin + " – " + expMax + " " + (lang === "VN" || lang === "VI" ? "năm" : "years")}
                  </span>
                </div>
              </div>

              {/* Range Slider 0 to 30 years */}
              <div style={{ padding: "4px 2px 8px 2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                  <span>0 yr (Fresher)</span>
                  <span style={{ fontWeight: 600, color: "#2563eb" }}>Max: {expMax >= 30 ? "30+ yrs" : expMax + " yrs"}</span>
                  <span>30 yrs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={expMax}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setExpMax(val);
                    if (expMin > val) setExpMin(val);
                    setPage(1);
                  }}
                  style={{
                    width: "100%",
                    accentColor: "#2563eb",
                    cursor: "pointer",
                    height: 6,
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* Quick Preset Filter Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {EXP_PRESETS.map((p) => {
                  const isActive = expMin === p.min && expMax === p.max;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setExpMin(p.min);
                        setExpMax(p.max);
                        setPage(1);
                      }}
                      style={{
                        padding: "3px 8px",
                        fontSize: 11,
                        borderRadius: 6,
                        border: isActive ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                        backgroundColor: isActive ? "#eff6ff" : "#ffffff",
                        color: isActive ? "#1d4ed8" : "#475569",
                        fontWeight: isActive ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {lang === "VN" || lang === "VI" ? p.labelVi : p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Salary Range Filter (VND) */}
            <div className="lv-filter-group">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>{t(lang, "Salary Range (VND)")}</h4>
                {salaryPreset !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSalaryPreset("all");
                      setPage(1);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--brand-600, #2563eb)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {lang === "VN" || lang === "VI" ? "Đặt lại" : "Reset"}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SALARY_PRESETS.map((p) => {
                  const isActive = salaryPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSalaryPreset(p.id);
                        setPage(1);
                      }}
                      style={{
                        padding: "5px 10px",
                        fontSize: 12,
                        borderRadius: 6,
                        border: isActive ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                        backgroundColor: isActive ? "#eff6ff" : "#ffffff",
                        color: isActive ? "#1d4ed8" : "#475569",
                        fontWeight: isActive ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {lang === "VN" || lang === "VI" ? p.labelVi : p.label}
                    </button>
                  );
                })}
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
                  options={Array.from(new Set(liveJobList.map(j => j.company))).filter(Boolean).map(c => ({ value: c, label: c }))}
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
                    isLoggedIn={loggedIn}
                    hasApplied={appliedMap[j.id]}
                    onSave={() => {
                      if (!loggedIn) {
                        setToast(t(lang, "Please log in to save jobs."));
                        return;
                      }
                      toggleSavedJob(j.id, j);
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
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label={t(lang, "Previous page")}
                >
                  ‹
                </button>
                {getPageNumbers().map((num, i) =>
                  num === "..." ? (
                    <span key={`dots-${i}`} style={{ padding: "0 8px", opacity: 0.6, userSelect: "none" }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={num}
                      className={currentPage === num ? "active" : ""}
                      aria-current={currentPage === num ? "page" : undefined}
                      onClick={() => handlePageChange(num)}
                    >
                      {num}
                    </button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pages}
                  aria-label={t(lang, "Next page")}
                >
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
