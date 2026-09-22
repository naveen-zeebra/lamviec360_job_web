"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Avatar } from "../ds";
import Icon from "../ds/Icon";
import Reveal from "../ds/Reveal";
import { useLang, t } from "../../utils/lang";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import CompanyCard from "../companies/CompanyCard";
import Testimonials from "../marketing/Testimonials";
import { FILTER_VI } from "../../lib/data";
import { fetchPublicJobs } from "../../lib/api/publicApi";
import { isSaved, toggleSavedJob } from "../../lib/seekerStore";

function HeroVisual({ lang }) {
  const steps = [
    ["search", "Tìm kiếm", "Search"],
    ["sparkles", "Gợi ý phù hợp", "Match"],
    ["file-text", "Ứng tuyển", "Apply"],
    ["users", "Phỏng vấn", "Interview"],
    ["check-circle", "Được tuyển", "Hired"],
  ];
  return (
    <div className="lv-hero-visual">
      <div className="lv-hero-visual-track">
        {steps.map((s, i) => (
          <span key={s[1]} style={{ display: "contents" }}>
            <div className="lv-hero-step">
              <div className="lv-hero-step-icon">
                <Icon name={s[0]} size={20} />
              </div>
              <span>{(lang === "VN" || lang === "VI" ? s[1] : s[2])}</span>
            </div>
            {i < steps.length - 1 && <div className="lv-hero-step-line"></div>}
          </span>
        ))}
      </div>
      <div className="lv-hero-card lv-hero-card-1">
        <div className="lv-hero-card-row">
          <Avatar name="ABC" size={36} />
          <div>
            <div className="lv-hero-card-title">{t(lang, "Backend Engineer")}</div>
            <div className="lv-hero-card-sub">ABC Technologies</div>
          </div>
        </div>
        <Badge tone="success">{t(lang, "92% match")}</Badge>
      </div>
      <div className="lv-hero-card lv-hero-card-2">
        <Icon name="sparkles" size={16} style={{ color: "var(--blue-600)" }} />
        <span>{t(lang, "6 jobs recommended for your profile")}</span>
      </div>
      <div className="lv-hero-card lv-hero-card-3">
        <Icon name="trending-up" size={16} style={{ color: "var(--green-600)" }} />
        <span>{t(lang, "Profile 80% complete")}</span>
      </div>
    </div>
  );
}

function Hero({ lang }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const go = (extra) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (loc) p.set("loc", loc);
    if (extra) p.set("type", extra);
    router.push("/jobs" + (p.toString() ? "?" + p : ""));
  };
  return (
    <section className="lv-hero">
      <div className="lv-hero-inner">
        <Reveal className="lv-hero-copy">
          <span className="lv-eyebrow">{t(lang, "FOR JOB SEEKERS")}</span>
          <h1 className="lv-hero-h1">
            {t(lang, "Find the Right Job.")}
            <br />
            {t(lang, "Build Your Future.")}
          </h1>
          <p className="lv-hero-sub">
            {t(lang, "Discover relevant opportunities, create a professional profile, apply faster and track every application in one place.")}
          </p>
          <form
            className="lv-search"
            onSubmit={(e) => {
              e.preventDefault();
              go();
            }}
          >
            <div className="lv-search-field">
              <Icon name="search" size={18} />
              <input
                type="text"
                placeholder={t(lang, "Job title, skill or company")}
                aria-label={t(lang, "Job title, skill or company")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="lv-search-field lv-search-field-loc">
              <Icon name="map-pin" size={18} />
              <input
                type="text"
                placeholder={t(lang, "Location")}
                aria-label={t(lang, "Location")}
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
              />
            </div>
            <Button variant="primary" size="lg" type="submit" style={{ whiteSpace: "nowrap" }}>
              {t(lang, "Find Jobs")}
            </Button>
          </form>
          <div className="lv-quick-filters">
            {["Full-time", "Remote", "Part-time", "Contract", "Internship"].map((f) => (
              <button key={f} className="lv-quick-filter" onClick={() => go(f)}>
                {(lang === "VN" || lang === "VI" ? FILTER_VI[f] : f)}
              </button>
            ))}
          </div>
          <div className="lv-hero-ctas">
            <Button variant="primary" size="lg" onClick={() => router.push("/jobs")}>
              {t(lang, "Find Jobs")}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => router.push("/register")}>
              {t(lang, "Create Your Profile")}
            </Button>
          </div>
        </Reveal>
        <Reveal className="lv-hero-visual-wrap">
          <HeroVisual lang={lang} />
        </Reveal>
      </div>
    </section>
  );
}

function WhyUs({ lang }) {
  const items =
    lang === "VI"
      ? [
        ["sparkles", "Gợi ý việc làm thông minh", "Nhận đề xuất dựa trên kỹ năng, kinh nghiệm và mục tiêu nghề nghiệp của bạn."],
        ["zap", "Ứng tuyển một lần nhấn", "Dùng hồ sơ đã lưu để gửi đơn ứng tuyển mà không phải nhập lại thông tin."],
        ["user-check", "So khớp theo hồ sơ", "Hồ sơ của bạn được so khớp với yêu cầu thực tế của từng vị trí."],
        ["list-checks", "Theo dõi ứng tuyển", "Xem trạng thái từng đơn từ Đã nộp đến Được tuyển."],
        ["trending-up", "Thông tin nghề nghiệp", "Tìm hiểu về mức lương, kỹ năng và ngành nghề đang tuyển dụng."],
      ]
      : [
        ["sparkles", "Smart job recommendations", "Get suggestions based on your skills, experience and career goals."],
        ["zap", "One-click applications", "Use your saved profile to apply without re-entering your details."],
        ["user-check", "Profile-based matching", "Your profile is matched against the real requirements of each role."],
        ["list-checks", "Application tracking", "See where every application stands, from Applied to Hired."],
        ["trending-up", "Career insights", "Understand salary ranges, in-demand skills and hiring industries."],
      ];
  return (
    <section className="lv-section lv-section-blue" id="why">
      <Reveal className="lv-section-head">
        <span className="lv-eyebrow">{t(lang, "WHY JOB SEEKERS CHOOSE US")}</span>
        <h2>{t(lang, "Everything you need for your career journey.")}</h2>
      </Reveal>
      <div className="lv-sol-grid">
        {items.map((x) => (
          <Reveal key={x[1]}>
            <div className="lv-sol-card">
              <div className="lv-sol-icon">
                <Icon name={x[0]} size={22} />
              </div>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks({ lang }) {
  const steps =
    lang === "VI"
      ? [
        ["01", "Tạo hồ sơ", "Thêm kinh nghiệm, kỹ năng và mục tiêu nghề nghiệp của bạn."],
        ["02", "Khám phá việc phù hợp", "Tìm và lọc theo những điều quan trọng với bạn."],
        ["03", "Ứng tuyển", "Gửi đơn ứng tuyển chỉ trong vài bước với hồ sơ đã lưu."],
        ["04", "Theo dõi ứng tuyển", "Xem trạng thái và phản hồi ở từng giai đoạn."],
        ["05", "Được tuyển dụng", "Nhận đề nghị và bắt đầu công việc mới."],
      ]
      : [
        ["01", "Create your profile", "Add your experience, skills and career goals."],
        ["02", "Discover relevant jobs", "Search and filter by what matters to you."],
        ["03", "Apply", "Submit an application in a few steps using your saved profile."],
        ["04", "Track applications", "See status and feedback at every stage."],
        ["05", "Get hired", "Receive your offer and start your new role."],
      ];
  return (
    <section className="lv-section" id="how">
      <Reveal className="lv-section-head">
        <h2>{t(lang, "How it works")}</h2>
      </Reveal>
      <div className="lv-steps" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
        {steps.map((s) => (
          <Reveal key={s[0]}>
            <div className="lv-step">
              <span className="lv-step-num">{s[0]}</span>
              <h3>{s[1]}</h3>
              <p>{s[2]}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FeaturedJobs({ lang, jobsData }) {
  const router = useRouter();
  const [filter, setFilter] = useState(null);
  const [saved, setSaved] = useState({});

  useEffect(() => {
    const map = {};
    (jobsData || []).forEach((j) => {
      map[j.id] = isSaved(j.id);
    });
    setSaved(map);
  }, [jobsData]);

  const jobs = jobsData
    .filter(
      (j) =>
        !filter ||
        j.type === filter ||
        j.job_type === filter ||
        j.mode === filter ||
        j.workplace_type === filter
    )
    .slice(0, 6);
  return (
    <section className="lv-section lv-section-blue" id="jobs">
      <Reveal className="lv-section-head">
        <span className="lv-eyebrow">{t(lang, "OPPORTUNITIES AWAIT")}</span>
        <h2>{t(lang, "Featured jobs")}</h2>
        <p>{t(lang, "Explore the latest opportunities from companies looking for talented people.")}</p>
      </Reveal>
      <Reveal className="lv-filter-row">
        <button className={`lv-filter-chip ${!filter ? "active" : ""}`} onClick={() => setFilter(null)}>
          {t(lang, "All")}
        </button>
        {["Full-time", "Remote", "Part-time", "Contract", "Internship"].map((f) => (
          <button key={f} className={`lv-filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {(lang === "VN" || lang === "VI" ? FILTER_VI[f] : f)}
          </button>
        ))}
      </Reveal>
      <div className="lv-job-grid">
        {jobs.map((j) => {
          const companyName =
            typeof j.company === "string"
              ? j.company
              : j.company_name || j.company?.company_name || "Company";
          const logoText = companyName.slice(0, 2).toUpperCase();
          return (
            <Reveal key={j.id}>
              <Card hoverable style={{ padding: "var(--space-5)" }}>
                <div className="lv-job-top">
                  <div className="lv-job-logo" aria-hidden="true">
                    {logoText}
                  </div>
                  <button
                    className="lv-job-save"
                    aria-label={saved[j.id] ? t(lang, "Unsave job") : t(lang, "Save job")}
                    aria-pressed={!!saved[j.id]}
                    onClick={() => {
                      toggleSavedJob(j.id, j);
                      setSaved((s) => ({ ...s, [j.id]: !s[j.id] }));
                    }}
                  >
                    <Icon name="heart" size={18} style={{ fill: saved[j.id] ? "var(--red-500)" : "none", color: saved[j.id] ? "var(--red-500)" : "var(--gray-400)" }} />
                  </button>
                </div>
                <h3 className="lv-job-title">
                  <Link href={`/job-detail?id=${j.id}`} style={{ color: "inherit" }}>
                    {(lang === "VN" || lang === "VI" ? j.titleVi || j.title : j.title)}
                  </Link>
                </h3>
                <div className="lv-job-company">
                  {companyName}
                  {(j.company?.verification_status === "verified" || j.verified) && (
                    <Badge tone="brand">
                      <Icon name="check" size={11} /> {t(lang, "Verified")}
                    </Badge>
                  )}
                </div>
                <div className="lv-job-meta">
                  <span>
                    <Icon name="map-pin" size={14} />
                    {(lang === "VN" || lang === "VI" ? j.locationVi || j.location : j.location || j.city)}
                  </span>
                  <span>
                    <Icon name="wallet" size={14} />
                    {j.salary || "Negotiable"}
                  </span>
                  <span>
                    <Icon name="briefcase" size={14} />
                    {(lang === "VN" || lang === "VI" ? j.levelVi || j.level || j.experience_level : j.level || j.experience_level)}
                  </span>
                </div>
                <div className="lv-job-tags">
                  <Badge tone="neutral">{(lang === "VN" || lang === "VI" ? FILTER_VI[j.job_type || j.type] || j.job_type || j.type : j.job_type || j.type)}</Badge>
                  <Badge tone="neutral">{(lang === "VN" || lang === "VI" ? j.modeVi || j.mode || j.workplace_type : j.mode || j.workplace_type)}</Badge>
                </div>
                <div className="lv-job-footer">
                  <span className="lv-job-posted">{(lang === "VN" || lang === "VI" ? j.postedVi || "Gần đây" : j.posted || "Recently")}</span>
                  <Button variant="primary" size="sm" onClick={() => router.push(`/job-detail?id=${j.id}`)}>
                    {t(lang, "Apply")}
                  </Button>
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>
      <Reveal style={{ textAlign: "center", marginTop: "var(--space-10)" }}>
        <Link href="/jobs" className="lv-view-all">
          {t(lang, "View all jobs ")}
          <Icon name="arrow-right" size={16} />
        </Link>
      </Reveal>
    </section>
  );
}

function TopCompanies({ lang, companiesData }) {
  return (
    <section className="lv-section" id="companies">
      <Reveal className="lv-section-head">
        <span className="lv-eyebrow">{t(lang, "TRUSTED EMPLOYERS")}</span>
        <h2>{t(lang, "Top companies hiring now")}</h2>
        <p>{t(lang, "Explore opportunities from companies reviewed and approved by LàmViệc360.")}</p>
      </Reveal>
      <div className="lv-company-grid">
        {companiesData.slice(0, 6).map((c) => (
          <Reveal key={c.id}>
            <CompanyCard c={c} lang={lang} />
          </Reveal>
        ))}
      </div>
      <Reveal style={{ textAlign: "center", marginTop: "var(--space-10)" }}>
        <Link href="/companies" className="lv-view-all">
          {t(lang, "View all companies ")}
          <Icon name="arrow-right" size={16} />
        </Link>
      </Reveal>
    </section>
  );
}

function DashboardPreview({ lang, jobsData }) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const tabs = lang === "VI" ? ["Việc làm gợi ý", "Việc đã lưu", "Đã ứng tuyển", "Phỏng vấn"] : ["Recommended", "Saved jobs", "Applied", "Interviews"];
  const rows = [jobsData.slice(0, 3), jobsData.slice(3, 5), jobsData.slice(1, 4), jobsData.slice(0, 2)][tab] || [];
  const stages = lang === "VI" ? ["Đang xét duyệt", "Danh sách rút gọn", "Phỏng vấn"] : ["Under Review", "Shortlisted", "Interview"];
  return (
    <section className="lv-section lv-section-blue" id="dashboard">
      <Reveal className="lv-section-head">
        <span className="lv-eyebrow">{t(lang, "YOUR DASHBOARD")}</span>
        <h2>{t(lang, "Manage your job search in one place")}</h2>
      </Reveal>
      <Reveal>
        <div className="lv-preview">
          <div className="lv-preview-head">
            <div>
              <strong style={{ fontSize: "var(--text-md)" }}>{t(lang, "Your profile")}</strong>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", marginTop: "var(--space-1)" }}>
                {t(lang, "80% complete — add skills for better recommendations")}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => router.push("/register")}>
              {t(lang, "Complete profile")}
            </Button>
          </div>
          <div className="lv-progress">
            <i style={{ width: "80%" }}></i>
          </div>
          <div className="lv-preview-stats">
            <div className="lv-stat">
              <span>{t(lang, "Recommended")}</span>
              <strong>12</strong>
            </div>
            <div className="lv-stat">
              <span>{t(lang, "Saved jobs")}</span>
              <strong>5</strong>
            </div>
            <div className="lv-stat">
              <span>{t(lang, "Applied")}</span>
              <strong>8</strong>
            </div>
            <div className="lv-stat">
              <span>{t(lang, "Interviews")}</span>
              <strong>2</strong>
            </div>
          </div>
          <div className="lv-filter-row" style={{ justifyContent: "flex-start", marginBottom: 0 }}>
            {tabs.map((t, i) => (
              <button key={t} className={`lv-filter-chip ${tab === i ? "active" : ""}`} aria-pressed={tab === i} onClick={() => setTab(i)}>
                {t}
              </button>
            ))}
          </div>
          <div className="lv-dash-list">
            {rows.map((j, i) => {
              const compName =
                typeof j.company === "string"
                  ? j.company
                  : j.company_name || j.company?.company_name || "Company";
              return (
                <div key={j.id} className="lv-dash-row">
                  <div className="lv-job-logo" style={{ width: 36, height: 36, fontSize: 12 }} aria-hidden="true">
                    {compName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="lv-dash-row-info">
                    <strong>{(lang === "VN" || lang === "VI" ? j.titleVi || j.title : j.title)}</strong>
                    <span>
                      {compName} · {(lang === "VN" || lang === "VI" ? j.locationVi || j.city : j.city || j.location)}
                    </span>
                  </div>
                  <Badge tone={tab === 3 ? "success" : "brand"}>{tab === 0 ? t(lang, "Strong match") : tab === 1 ? t(lang, "Saved") : stages[i % 3]}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FinalCTA({ lang }) {
  const router = useRouter();
  return (
    <Reveal as="section" className="lv-final-cta lv-final-cta-blue">
      <h2>{t(lang, "Your next opportunity starts here.")}</h2>
      <p>{t(lang, "Create your free account and start applying to jobs that match your skills.")}</p>
      <div className="lv-final-cta-buttons">
        <Button variant="primary" size="lg" style={{ background: "var(--surface-card)", color: "var(--blue-700)" }} onClick={() => router.push("/register")}>
          {t(lang, "Create Your Job Seeker Account")}
        </Button>
        <Button variant="ghost" size="lg" style={{ color: "var(--text-inverse)", border: "1.5px solid rgba(255,255,255,0.5)" }} onClick={() => router.push("/jobs")}>
          {t(lang, "Find Jobs")}
        </Button>
      </div>
    </Reveal>
  );
}

export default function HomeClient() {
  const [lang, setLang] = useLang();
  const quotes = [
    {
      name: "Nguyễn Thị Lan",
      role: "Backend Engineer",
      roleVi: "Kỹ sư Backend",
      en: "I applied to four roles in one evening using my saved profile. Two came back within a week and I could see exactly where each application stood.",
      vi: "Tôi đã ứng tuyển bốn vị trí trong một buổi tối nhờ hồ sơ đã lưu. Hai nơi phản hồi trong vòng một tuần và tôi luôn biết rõ trạng thái từng đơn.",
    },
    {
      name: "Trần Văn Minh",
      role: "Marketing Specialist",
      roleVi: "Chuyên viên Marketing",
      en: "The recommendations actually matched what I do. I found a role in Da Nang that I would never have searched for myself.",
      vi: "Các gợi ý thực sự phù hợp với công việc của tôi. Tôi tìm được một vị trí ở Đà Nẵng mà tự mình sẽ không nghĩ đến.",
    },
    {
      name: "Lê Thị Hoa",
      role: "Product Designer",
      roleVi: "Thiết kế Sản phẩm",
      en: "Being able to prepare with questions related to the actual role made the interview far less stressful.",
      vi: "Việc luyện tập với câu hỏi liên quan trực tiếp đến vị trí ứng tuyển giúp buổi phỏng vấn bớt căng thẳng hơn nhiều.",
    },
  ];
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const jobsData = await fetchPublicJobs();
        if (Array.isArray(jobsData)) {
          setJobs(jobsData);
          // Derive unique companies from jobs
          const compMap = new Map();
          jobsData.forEach((j) => {
            const cName =
              typeof j.company === "string"
                ? j.company
                : j.company_name || j.company?.company_name;
            const compId = j.companyObj?.id || j.company?.id || cName;
            if (cName && !compMap.has(compId)) {
              compMap.set(compId, {
                id: compId,
                name: cName,
                company_name: cName,
                logo: cName.slice(0, 2).toUpperCase(),
                verified:
                  j.company?.verification_status === "verified" ||
                  j.verified !== false,
                industry: j.industry || j.company?.industry || "Technology",
                location: j.location || "Vietnam",
                openJobs: jobsData.filter(
                  (jb) => (jb.company_name || jb.company) === cName
                ).length,
              });
            }
          });
          setCompanies(Array.from(compMap.values()));
        }
      } catch (err) {
        console.warn("Failed to load jobs", err);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main>
        <Hero lang={lang} />
        <WhyUs lang={lang} />
        <HowItWorks lang={lang} />
        <FeaturedJobs lang={lang} jobsData={jobs} />
        <TopCompanies lang={lang} companiesData={companies} />
        <DashboardPreview lang={lang} jobsData={jobs} />
        <Testimonials
          lang={lang}
          items={quotes}
          eyebrow={t(lang, "SUCCESS STORIES")}
          title={t(lang, "People who found the right role")}
        />
        <FinalCTA lang={lang} />
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
    </>
  );
}
