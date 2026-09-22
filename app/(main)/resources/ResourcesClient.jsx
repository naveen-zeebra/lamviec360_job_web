"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Reveal from "../../../components/ds/Reveal";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import PageHead from "../../../components/layout/PageHead";
import { RESOURCES } from "../../../lib/data";

export default function ResourcesClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [cat, setCat] = useState("");
  const cats = [...new Set(RESOURCES.map((r) => (lang === "VN" || lang === "VI" ? r.cat[0] : r.cat[1])))];
  const list = RESOURCES.filter((r) => !cat || (lang === "VN" || lang === "VI" ? r.cat[0] : r.cat[1]) === cat);

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main>
        <PageHead
          lang={lang}
          crumb={t(lang, "Career Resources")}
          title={t(lang, "Practical guidance for your career.")}
          desc={t(lang, "Short reads on profiles, applications, interviews and growing your career in Vietnam.")}
        />
        <section className="lv-section" style={{ paddingTop: 56 }}>
          <div className="lv-filter-row" style={{ justifyContent: "flex-start" }}>
            <button className={`lv-filter-chip ${!cat ? "active" : ""}`} onClick={() => setCat("")}>
              {t(lang, "All")}
            </button>
            {cats.map((c) => (
              <button key={c} className={`lv-filter-chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="lv-res-grid">
            {list.map((r) => (
              <Reveal key={r.title[1]}>
                <article className="lv-res-card">
                  <span className="lv-res-cat">{(lang === "VN" || lang === "VI" ? r.cat[0] : r.cat[1])}</span>
                  <h3>{(lang === "VN" || lang === "VI" ? r.title[0] : r.title[1])}</h3>
                  <p>{(lang === "VN" || lang === "VI" ? r.desc[0] : r.desc[1])}</p>
                  <div className="lv-res-foot">
                    <span>{(lang === "VN" || lang === "VI" ? r.read[0] : r.read[1])}</span>
                    <a href="#" className="lv-job-view" onClick={(e) => e.preventDefault()}>
                      {t(lang, "Read ")}
                      <Icon name="arrow-right" size={14} />
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="lv-section lv-section-blue">
          <Reveal className="lv-section-head">
            <h2>{t(lang, "Need help using LàmViệc360?")}</h2>
            <p>{t(lang, "The Help Center answers questions about profiles, applications and company accounts.")}</p>
          </Reveal>
          <div className="lv-steps" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            {[
              ["user", "Hồ sơ & tài khoản", "Profiles & accounts"],
              ["file-text", "Ứng tuyển", "Applications"],
              ["building-2", "Tài khoản doanh nghiệp", "Company accounts"],
            ].map((x) => (
              <Reveal key={x[2]}>
                <Card style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <div className="lv-trust-icon">
                    <Icon name={x[0]} size={20} />
                  </div>
                  <h3 className="lv-feature-title">{(lang === "VN" || lang === "VI" ? x[1] : x[2])}</h3>
                  <a href="#" className="lv-job-view" onClick={(e) => e.preventDefault()}>
                    {t(lang, "Browse articles ")}
                    <Icon name="arrow-right" size={14} />
                  </a>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>
        <Reveal as="section" className="lv-final-cta lv-final-cta-blue">
          <h2>{t(lang, "Ready to apply?")}</h2>
          <p>{t(lang, "Put what you have read into practice — explore jobs that match your skills.")}</p>
          <div className="lv-final-cta-buttons">
            <Button variant="primary" size="lg" style={{ background: "var(--surface-card)", color: "var(--blue-700)" }} onClick={() => router.push("/jobs")}>
              {t(lang, "Explore Jobs")}
            </Button>
            <Button variant="ghost" size="lg" style={{ color: "var(--text-inverse)", border: "1.5px solid rgba(255,255,255,0.5)" }} onClick={() => router.push("/register")}>
              {t(lang, "Create Free Profile")}
            </Button>
          </div>
        </Reveal>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
    </>
  );
}
