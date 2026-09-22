"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Avatar } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Reveal from "../../../components/ds/Reveal";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import PageHead from "../../../components/layout/PageHead";
import { FILTER_VI } from "../../../lib/data";
import { fetchPublicJobs } from "../../../lib/api/publicApi";

const SOLS = [
  {
    id: "posting",
    icon: "file-plus",
    vi: ["Đăng tin tuyển dụng", "Tạo tin tuyển dụng rõ ràng, chuyên nghiệp trong vài phút."],
    en: ["Job Posting", "Create clear, professional job postings in minutes."],
    ptsVi: ["Mô tả công việc có hỗ trợ AI, luôn được bạn xem lại trước khi đăng.", "Mẫu tin theo từng nhóm vị trí phổ biến.", "Đăng nhiều tin và quản lý trạng thái từng tin.", "Tin tuyển dụng hiển thị trên trang doanh nghiệp đã xác thực của bạn."],
    ptsEn: ["AI-assisted job descriptions that you always review before publishing.", "Templates for common role families.", "Publish multiple postings and manage the status of each.", "Postings appear on your verified company page."],
  },
  {
    id: "search",
    icon: "search",
    vi: ["Tìm kiếm ứng viên", "Tìm đúng người thay vì chờ họ tìm thấy bạn."],
    en: ["Candidate Search", "Find the right people instead of waiting to be found."],
    ptsVi: ["Tìm theo kỹ năng, chức danh, kinh nghiệm và địa điểm.", "Lọc theo cấp bậc và hình thức làm việc.", "So khớp kỹ năng với yêu cầu của tin tuyển dụng.", "Lưu tìm kiếm để dùng lại cho các vị trí tương tự."],
    ptsEn: ["Search by skills, job title, experience and location.", "Filter by seniority and work mode.", "Match skills against your posting requirements.", "Save searches to reuse for similar roles."],
  },
  {
    id: "tracking",
    icon: "list-checks",
    vi: ["Quản lý ứng tuyển", "Mọi hồ sơ ứng tuyển ở một nơi, không cần bảng tính."],
    en: ["Applicant Tracking", "Every application in one place — no spreadsheets."],
    ptsVi: ["Pipeline theo giai đoạn: Ứng tuyển, Xét duyệt, Rút gọn, Phỏng vấn, Đề nghị.", "Ghi chú và đánh giá dùng chung cho cả đội tuyển dụng.", "Lịch sử trao đổi gắn với từng ứng viên.", "Trạng thái luôn hiển thị cho ứng viên để giữ sự minh bạch."],
    ptsEn: ["Stage-based pipeline: Applied, Review, Shortlist, Interview, Offer.", "Shared notes and evaluations across your hiring team.", "Communication history attached to each candidate.", "Status stays visible to candidates for transparency."],
  },
  {
    id: "shortlist",
    icon: "user-check",
    vi: ["Rút gọn danh sách", "Tập trung vào những ứng viên đáng để trao đổi."],
    en: ["Candidate Shortlisting", "Focus on the candidates worth talking to."],
    ptsVi: ["So sánh ứng viên cạnh nhau theo tiêu chí của bạn.", "Đánh dấu, xếp hạng và gắn thẻ hồ sơ.", "Gợi ý từ AI về mức độ phù hợp, con người quyết định.", "Chia sẻ danh sách rút gọn với quản lý tuyển dụng."],
    ptsEn: ["Compare candidates side by side against your criteria.", "Flag, rank and tag profiles.", "AI suggests fit; people make the call.", "Share your shortlist with hiring managers."],
  },
  {
    id: "interviews",
    icon: "calendar",
    vi: ["Quản lý phỏng vấn", "Phối hợp phỏng vấn mà không cần chuỗi email dài."],
    en: ["Interview Management", "Coordinate interviews without long email threads."],
    ptsVi: ["Lên lịch và gửi thông tin buổi phỏng vấn cho ứng viên.", "Phân công người phỏng vấn theo vai trò.", "Mẫu ghi chú đánh giá thống nhất cho cả đội.", "Tổng hợp phản hồi trước khi ra quyết định."],
    ptsEn: ["Schedule and send interview details to candidates.", "Assign interviewers by role.", "Consistent evaluation note templates for the team.", "Collect feedback before making a decision."],
  },
  {
    id: "analytics",
    icon: "bar-chart-3",
    vi: ["Phân tích tuyển dụng", "Hiểu rõ điều gì đang hiệu quả trong tuyển dụng của bạn."],
    en: ["Hiring Analytics", "Understand what is working in your hiring."],
    ptsVi: ["Số lượt xem và ứng tuyển theo từng tin.", "Thời gian tuyển dụng theo vị trí và phòng ban.", "Tỷ lệ chuyển đổi giữa các giai đoạn pipeline.", "Xuất báo cáo để chia sẻ với ban lãnh đạo."],
    ptsEn: ["Views and applications per posting.", "Time-to-hire by role and department.", "Conversion rates between pipeline stages.", "Export reports to share with leadership."],
  },
];

export default function SolutionsClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [active, setActive] = useState(SOLS[0].id);
  const [previewJobs, setPreviewJobs] = useState([]);

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await fetchPublicJobs();
        if (Array.isArray(data)) setPreviewJobs(data.slice(0, 4));
      } catch (e) {}
    }
    loadJobs();
  }, []);

  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (SOLS.some((s) => s.id === h)) setActive(h);
  }, []);
  const sol = SOLS.find((s) => s.id === active) || SOLS[0];
  const solTitle = lang === "VI" ? sol.vi : sol.en;
  const pts = lang === "VI" ? sol.ptsVi : sol.ptsEn;

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main>
        <PageHead
          lang={lang}
          home="/employers"
          crumb={t(lang, "Solutions")}
          title={t(lang, "Hiring solutions for every step of your process.")}
          desc={t(lang, "From job posting to hiring analytics — use what you need, all in one workspace.")}
        >
          <div className="lv-hero-ctas" style={{ marginTop: "var(--space-8)" }}>
            <Button variant="primary" size="lg" onClick={() => router.push("/company-register")}>
              {t(lang, "Start Hiring")}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => router.push("/pricing")}>
              {t(lang, "View Pricing")}
            </Button>
          </div>
        </PageHead>
        <section className="lv-section" style={{ paddingTop: "var(--space-12)" }}>
          <div className="lv-sol-grid">
            {SOLS.map((s) => (
              <Reveal key={s.id}>
                <div className="lv-sol-card" id={s.id}>
                  <div className="lv-sol-icon">
                    <Icon name={s.icon} size={22} />
                  </div>
                  <h3>{lang === "VI" ? s.vi[0] : s.en[0]}</h3>
                  <p>{lang === "VI" ? s.vi[1] : s.en[1]}</p>
                  <button
                    className="lv-job-view"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--text-link)" }}
                    aria-pressed={active === s.id}
                    onClick={() => setActive(s.id)}
                  >
                    {t(lang, "See details ")}
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="lv-section lv-section-blue">
          <div className="lv-employer-grid">
            <Reveal className="lv-employer-copy">
              <span className="lv-eyebrow">{t(lang, "SOLUTION DETAIL")}</span>
              <h2 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-4)" }}>{t[0]}</h2>
              <p>{t[1]}</p>
              <ul className="lv-check-list">
                {pts.map((p) => (
                  <li key={p}>
                    <Icon name="check" size={16} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="lv-hero-ctas" style={{ marginTop: "var(--space-8)" }}>
                <Button variant="primary" onClick={() => router.push("/company-register")}>
                  {t(lang, "Start Hiring")}
                </Button>
                <Button variant="ghost" onClick={() => router.push("/employer-resources")}>
                  {t(lang, "Read the guides")}
                </Button>
              </div>
            </Reveal>
            <Reveal>
              <div className="lv-preview">
                <div className="lv-preview-head">
                  <strong style={{ fontSize: "var(--text-md)" }}>{t[0]}</strong>
                  <Badge tone="brand">{t(lang, "Preview")}</Badge>
                </div>
                <div className="lv-filter-row" style={{ justifyContent: "flex-start", marginBottom: 0 }}>
                  {SOLS.map((s) => (
                    <button key={s.id} className={`lv-filter-chip ${active === s.id ? "active" : ""}`} aria-pressed={active === s.id} onClick={() => setActive(s.id)}>
                      {lang === "VI" ? s.vi[0] : s.en[0]}
                    </button>
                  ))}
                </div>
                {active === "analytics" ? (
                  <div>
                    <div className="lv-bars" role="img" aria-label={t(lang, "Applications per week")}>
                      {[45, 62, 38, 71, 55, 84].map((h, i) => (
                        <div key={i} style={{ height: h + "%" }}></div>
                      ))}
                    </div>
                  </div>
                ) : active === "tracking" || active === "shortlist" ? (
                  <div className="lv-pipeline">
                    {(lang === "VI" ? ["Ứng tuyển", "Xét duyệt", "Rút gọn", "Phỏng vấn", "Đề nghị"] : ["Applied", "Review", "Shortlist", "Interview", "Offer"]).map((c, ci) => (
                      <div key={c} className="lv-pipe-col">
                        <h5>{c}</h5>
                        {Array.from({ length: Math.max(1, 3 - Math.floor(ci / 2)) }).map((_, i) => {
                          const n = ["Nguyễn Lan", "Trần Minh", "Lê Hoa", "Phạm Anh", "Vũ Nam"][(ci * 2 + i) % 5];
                          return (
                            <div key={i} className="lv-pipe-card">
                              <Avatar name={n} size={20} />
                              {n}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="lv-dash-list">
                    {previewJobs.map((j) => {
                      const companyName = j.company_name || j.company?.company_name || "Company";
                      return (
                      <div key={j.id} className="lv-dash-row">
                        <div className="lv-job-logo" style={{ width: 36, height: 36, fontSize: 12 }} aria-hidden="true">
                          {companyName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="lv-dash-row-info">
                          <strong>{(lang === "VN" || lang === "VI" ? j.titleVi || j.title : j.title)}</strong>
                          <span>
                            {(lang === "VN" || lang === "VI" ? j.locationVi || j.location : j.location)} · {(lang === "VN" || lang === "VI" ? FILTER_VI[j.type] || j.type : j.type)}
                          </span>
                        </div>
                        <Badge tone="success">{t(lang, "Active")}</Badge>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>
        <Reveal as="section" className="lv-final-cta lv-final-cta-navy">
          <h2>{t(lang, "Ready to build your next team?")}</h2>
          <p>{t(lang, "Register your company and start hiring with the full toolkit.")}</p>
          <div className="lv-final-cta-buttons">
            <Button variant="primary" size="lg" onClick={() => router.push("/company-register")}>
              {t(lang, "Start Hiring")}
            </Button>
            <Button variant="ghost" size="lg" style={{ color: "var(--text-inverse)", border: "1.5px solid rgba(255,255,255,0.5)" }} onClick={() => router.push("/pricing")}>
              {t(lang, "View Pricing")}
            </Button>
          </div>
        </Reveal>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
    </>
  );
}
