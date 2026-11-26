"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Reveal from "../../../components/ds/Reveal";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import PageHead from "../../../components/layout/PageHead";

export default function PricingClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(0);
  const isVi = lang === "VI" || lang === "VN";

  const freemiumPlan = isVi
    ? {
        name: "Gói Miễn phí (Freemium)",
        tag: "Dành cho toàn bộ doanh nghiệp",
        price: "0 ₫",
        desc: "Đăng tin tuyển dụng, quản lý ứng viên và làm việc nhóm tối đa 6 thành viên hoàn toàn miễn phí.",
        features: [
          "Tối đa 999 tin tuyển dụng đang hoạt động",
          "Tối đa 6 thành viên đội ngũ tuyển dụng",
          "Quản lý ứng viên & Nhắn tin trực tiếp",
          "Trang doanh nghiệp đã xác thực",
          "Hỗ trợ chuẩn qua email",
        ],
        cta: "Đăng ký doanh nghiệp miễn phí",
      }
    : {
        name: "Freemium Plan",
        tag: "Active Plan for All Employers",
        price: "0 VND",
        desc: "Post jobs, manage applicants, and collaborate with up to 6 team members completely free.",
        features: [
          "Up to 999 active job postings",
          "Up to 6 workspace team members",
          "Candidate pipeline management & Direct Messages",
          "Verified company profile page",
          "Standard email support",
        ],
        cta: "Start Free as Employer",
      };

  const faqs = isVi
    ? [
        [
          "LàmViệc360 có miễn phí cho người tìm việc không?",
          "Có. Tìm việc, tạo hồ sơ, ứng tuyển và theo dõi đơn ứng tuyển luôn hoàn toàn miễn phí đối với người tìm việc.",
        ],
        [
          "Nhà tuyển dụng được dùng những gì trong gói Freemium?",
          "Doanh nghiệp nhận gói Freemium (0 ₫) gồm tối đa 999 tin tuyển dụng đang hoạt động, tối đa 6 thành viên đội ngũ và trang hồ sơ xác thực.",
        ],
        [
          "Doanh nghiệp được xác thực như thế nào?",
          "Sau khi đăng ký, thông tin doanh nghiệp của bạn được xem xét trước khi huy hiệu “Đã xác thực” xuất hiện trên trang và tin tuyển dụng.",
        ],
      ]
    : [
        [
          "Is LàmViệc360 free for job seekers?",
          "Yes. Searching, creating a profile, applying and tracking applications are always free for job seekers.",
        ],
        [
          "What do employers get under the Freemium plan?",
          "All employers operate on the Freemium plan (0 VND) with up to 999 active job postings, up to 6 team members, and full pipeline tools.",
        ],
        [
          "How does company verification work?",
          "After you register, your company details are reviewed before the \"Verified\" badge appears on your page and job postings.",
        ],
      ];

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main>
        <PageHead
          lang={lang}
          home="/"
          crumb={t(lang, "Pricing")}
          title={isVi ? "Miễn phí cho ứng viên & Gói Freemium cho doanh nghiệp." : "Free for Job Seekers & Freemium for Employers."}
          desc={
            isVi
              ? "Luôn miễn phí cho người tìm việc. Doanh nghiệp dùng gói Freemium (0 ₫) với tối đa 6 thành viên."
              : "Always free for job seekers. Employers get full hiring access on our Freemium plan (max 6 team members)."
          }
        />

        <section className="lv-section" style={{ paddingTop: 48 }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <Reveal>
              <div className="lv-price-card featured" style={{ padding: "36px 32px" }}>
                <span className="lv-price-badge">
                  {isVi ? "Miễn phí 100% · Freemium" : "100% Free · Freemium Plan"}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, margin: 0 }}>{freemiumPlan.name}</h2>
                    <p className="lv-price-tag" style={{ marginTop: 4 }}>{freemiumPlan.tag}</p>
                  </div>
                  <div className="lv-price-amount" style={{ margin: 0 }}>
                    {freemiumPlan.price}
                  </div>
                </div>
                <p className="lv-price-desc" style={{ marginTop: 12 }}>{freemiumPlan.desc}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0 20px" }}>
                  <Badge tone="brand">{isVi ? "999 tin tuyển dụng" : "999 Active Jobs"}</Badge>
                  <Badge tone="success">{isVi ? "Tối đa 6 thành viên" : "Max 6 Team Members"}</Badge>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {freemiumPlan.features.map((feat) => (
                    <li key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                      <Icon name="check" size={16} style={{ color: "var(--green-600)", flexShrink: 0 }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/company-register")}>
                  {freemiumPlan.cta}
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="lv-section lv-section-blue">
          <Reveal className="lv-section-head">
            <h2>{t(lang, "Frequently asked questions")}</h2>
          </Reveal>
          <div className="lv-faq">
            {faqs.map((f, i) => (
              <Reveal key={f[0]}>
                <div className="lv-faq-item">
                  <button className="lv-faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                    {f[0]}
                    <Icon name={open === i ? "minus" : "plus"} size={18} />
                  </button>
                  {open === i && <div className="lv-faq-a">{f[1]}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
    </>
  );
}
