"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Badge } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import JobRow from "../../../components/jobs/JobRow";
import Toast, { useToast } from "../../../components/ds/Toast";
import { JOBS, FILTER_VI } from "../../../lib/data";
import { isSaved, toggleSavedJob, hasAppliedToJob } from "../../../lib/seekerStore";

import { fetchPublicJobDetail } from "../../../lib/api/publicApi";

const STAGES = [
  ["Applied", "Đã nộp"],
  ["Under Review", "Đang xét duyệt"],
  ["Shortlisted", "Danh sách rút gọn"],
  ["Interview", "Phỏng vấn"],
  ["Offer", "Đề nghị"],
  ["Hired", "Được tuyển"],
];

export default function JobDetailClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [toast, setToast] = useToast();
  const params = useSearchParams();
  const rawId = params.get("id") || "1";
  const defaultJob = JOBS.find((j) => String(j.id) === String(rawId)) || JOBS[0];
  const [job, setJob] = useState(defaultJob);

  useEffect(() => {
    async function loadJobDetail() {
      if (rawId && String(rawId).startsWith("JOB-")) {
        try {
          const remote = await fetchPublicJobDetail(rawId);
          if (remote) {
            setJob({
              id: remote.id,
              title: remote.title,
              titleVi: remote.title,
              company: remote.company_name || "ABC Technologies",
              companyLogo: remote.company_logo || "",
              verified: true,
              location: remote.location,
              locationVi: remote.location,
              salary: remote.salary_min && remote.salary_max ? `${Math.round(remote.salary_min / 1000000)}M – ${Math.round(remote.salary_max / 1000000)}M VND` : "Negotiable",
              type: remote.type,
              mode: (remote.location || "").toLowerCase().includes("remote") ? "Remote" : "On-site",
              level: "Mid-level",
              industry: remote.department || "Technology",
              posted: remote.created_at || "Recently",
              postedVi: remote.created_at || "Gần đây",
              skills: remote.skills || [],
              jd: remote.jd,
              vacancies: remote.vacancies,
              deadline: remote.deadline,
            });
          }
        } catch (e) {
          console.warn("Could not fetch remote job detail:", e.message);
        }
      }
    }
    loadJobDetail();
  }, [rawId]);

  useEffect(() => {
    if (job?.id) {
      setSaved(isSaved(job.id));
      setApplied(hasAppliedToJob(job.id));
    }
  }, [job?.id]);
  const related = JOBS.filter((j) => j.id !== job.id && (j.industry === job.industry || j.company === job.company)).slice(0, 3);
  const resp =
    lang === "VI"
      ? ["Tham gia thiết kế, xây dựng và bảo trì các tính năng của sản phẩm.", "Hợp tác với thiết kế, sản phẩm và các kỹ sư khác trong nhóm.", "Xem xét mã nguồn và góp phần nâng cao chất lượng kỹ thuật.", "Theo dõi và cải thiện hiệu năng, độ tin cậy của hệ thống."]
      : ["Help design, build and maintain product features.", "Work closely with design, product and other engineers on the team.", "Review code and contribute to overall technical quality.", "Monitor and improve system performance and reliability."];
  const reqs =
    lang === "VI"
      ? ["Kinh nghiệm thực tế phù hợp với cấp bậc của vị trí.", "Thành thạo các kỹ năng chính được liệt kê cho vai trò này.", "Khả năng giao tiếp rõ ràng bằng tiếng Việt; tiếng Anh là một lợi thế.", "Tinh thần hợp tác và chủ động trong công việc nhóm."]
      : ["Relevant hands-on experience for the level of the role.", "Working proficiency in the core skills listed for this role.", "Clear communication in Vietnamese; English is an advantage.", "A collaborative, self-directed approach to teamwork."];
  const bens =
    lang === "VI"
      ? ["Bảo hiểm theo quy định pháp luật", "Thưởng theo hiệu quả công việc", "Ngân sách học tập và phát triển", "Chính sách làm việc linh hoạt"]
      : ["Statutory insurance coverage", "Performance-based bonus", "Learning and development budget", "Flexible working arrangements"];

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main>
        <section className="lv-page-head">
          <div className="lv-page-head-inner">
            <div className="lv-crumbs">
              <Link href="/">{t(lang, "Home")}</Link>
              <Icon name="chevron-right" size={14} />
              <Link href="/jobs">{t(lang, "Find Jobs")}</Link>
              <Icon name="chevron-right" size={14} />
              <span>{(lang === "VN" || lang === "VI" ? job.titleVi : job.title)}</span>
            </div>
            <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div className="lv-company-logo" style={{ width: 60, height: 60, fontSize: "var(--text-lg)" }} aria-hidden="true">
                {job.company.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-2)" }}>{(lang === "VN" || lang === "VI" ? job.titleVi : job.title)}</h1>
                <div className="lv-job-company" style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-3)" }}>
                  {job.company}
                  {job.verified && (
                    <Badge tone="brand">
                      <Icon name="shield-check" size={11} /> {t(lang, "Verified Company")}
                    </Badge>
                  )}
                </div>
                <div className="lv-job-meta" style={{ marginBottom: 0 }}>
                  <span>
                    <Icon name="map-pin" size={15} />
                    {(lang === "VN" || lang === "VI" ? job.locationVi : job.location)}
                  </span>
                  <span>
                    <Icon name="wallet" size={15} />
                    {job.salary}
                  </span>
                  <span>
                    <Icon name="briefcase" size={15} />
                    {(lang === "VN" || lang === "VI" ? FILTER_VI[job.type] || job.type : job.type)} · {(lang === "VN" || lang === "VI" ? job.modeVi : job.mode)}
                  </span>
                  <span>
                    <Icon name="clock" size={15} />
                    {(lang === "VN" || lang === "VI" ? job.postedVi : job.posted)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="lv-detail-layout">
          <div>
            <div className="lv-detail-card">
              <h2>{t(lang, "About the role")}</h2>
              <p>
                {t(lang, "${job.company} is looking for a ${job.title} in ${job.location}. This is a ${job.type.toLowerCase()} role working ${job.mode.toLowerCase()}, suited to ${job.level.toLowerCase()} candidates.")}
              </p>
              <h2>{t(lang, "Responsibilities")}</h2>
              <ul>
                {resp.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <h2>{t(lang, "Requirements")}</h2>
              <ul>
                {reqs.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <h2>{t(lang, "Skills")}</h2>
              <div className="lv-job-tags" style={{ marginBottom: 0 }}>
                {job.skills.map((s) => (
                  <Badge key={s} tone="neutral">
                    {s}
                  </Badge>
                ))}
              </div>
              <h2>{t(lang, "Benefits")}</h2>
              <ul>
                {bens.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <h2>{t(lang, "Hiring process")}</h2>
              <div className="lv-journey" style={{ marginTop: "var(--space-5)", maxWidth: "100%" }}>
                {STAGES.slice(0, 4).map((s, i) => (
                  <span key={s[0]} style={{ display: "contents" }}>
                    <div className="lv-journey-step">
                      <div className="lv-journey-dot">{`0${i + 1}`}</div>
                      <span>{(lang === "VN" || lang === "VI" ? s[1] : s[0])}</span>
                    </div>
                    {i < 3 && <div className="lv-journey-bar"></div>}
                  </span>
                ))}
              </div>
            </div>
            {related.length > 0 && (
              <section style={{ marginTop: "var(--space-10)" }}>
                <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-5)" }}>{t(lang, "Similar jobs")}</h2>
                <div className="lv-job-list">
                  {related.map((j) => (
                    <JobRow key={j.id} job={j} lang={lang} />
                  ))}
                </div>
              </section>
            )}
          </div>
          <aside className="lv-apply-card">
            <strong style={{ fontSize: "var(--text-md)" }}>{t(lang, "Apply for this role")}</strong>
            <div className="lv-apply-row">
              <span>{t(lang, "Salary")}</span>
              <strong>{job.salary}</strong>
            </div>
            <div className="lv-apply-row">
              <span>{t(lang, "Type")}</span>
              <strong>{(lang === "VN" || lang === "VI" ? FILTER_VI[job.type] || job.type : job.type)}</strong>
            </div>
            <div className="lv-apply-row">
              <span>{t(lang, "Work mode")}</span>
              <strong>{(lang === "VN" || lang === "VI" ? job.modeVi : job.mode)}</strong>
            </div>
            <div className="lv-apply-row">
              <span>{t(lang, "Level")}</span>
              <strong>{(lang === "VN" || lang === "VI" ? job.levelVi : job.level)}</strong>
            </div>
            <div className="lv-apply-row">
              <span>{t(lang, "Location")}</span>
              <strong>{(lang === "VN" || lang === "VI" ? job.locationVi : job.location)}</strong>
            </div>
            <Button
              variant="primary"
              size="lg"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={applied}
              onClick={() => {
                if (!applied) router.push(`/apply/${job.id}`);
              }}
            >
              {applied ? t(lang, "Applied") : t(lang, "Apply Now")}
            </Button>
            <Button
              variant="secondary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                toggleSavedJob(job.id);
                const nowSaved = !saved;
                setSaved(nowSaved);
                setToast(nowSaved ? t(lang, "Job saved") : t(lang, "Removed from saved jobs"));
              }}
            >
              <Icon name="heart" size={16} style={{ fill: saved ? "currentColor" : "none" }} /> {saved ? t(lang, "Saved") : t(lang, "Save Job")}
            </Button>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: "var(--leading-relaxed)" }}>
              {t(lang, "You need a LàmViệc360 profile to apply. Your details are shared only with your consent.")}
            </p>
            <Link href={`/jobs?company=${encodeURIComponent(job.company)}`} className="lv-job-view">
              {t(lang, "All jobs at this company ")}
              <Icon name="arrow-right" size={14} />
            </Link>
          </aside>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
      <Toast msg={toast} />
    </>
  );
}
