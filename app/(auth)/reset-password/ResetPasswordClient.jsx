"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button, Input } from "../../../components/ds";
import { useLang, t } from "../../../utils/lang";

function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3);
}

const LABELS = ["Weak", "Fair", "Good", "Strong"];
const COLORS = ["var(--color-error)", "var(--color-warning)", "var(--blue-500)", "var(--color-success)"];

export default function ResetPasswordClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [done, setDone] = useState(false);

  const resetSchema = Yup.object().shape({
    pw: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters."))
      .required(t(lang, "Password must be at least 8 characters.")),
    confirm: Yup.string()
      .oneOf([Yup.ref("pw"), null], t(lang, "Passwords do not match."))
      .required(t(lang, "Please confirm your password.")),
  });

  const formik = useFormik({
    initialValues: {
      pw: "",
      confirm: "",
    },
    validationSchema: resetSchema,
    onSubmit: () => {
      setDone(true);
      setTimeout(() => router.push("/login"), 1400);
    },
  });

  const s = strength(formik.values.pw);

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main className="lv-simple-auth">
        <div className="lv-simple-card">
          {done ? (
            <>
              <div className="lv-simple-icon" style={{ color: "var(--color-success)" }}>
                <Icon name="check-circle" size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: 8 }}>
                  {t(lang, "Password updated")}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                  {t(lang, "Redirecting you to login...")}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="lv-simple-icon">
                <Icon name="lock" size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: 8 }}>
                  {t(lang, "Set a new password")}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>
                  {t(lang, "Choose a strong password you haven't used before.")}
                </p>
              </div>
              <form onSubmit={formik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <Input
                    id="pw"
                    name="pw"
                    label={t(lang, "New password")}
                    type="password"
                    value={formik.values.pw}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.pw && formik.errors.pw}
                    placeholder="••••••••"
                  />
                  {formik.values.pw && (
                    <div className="lv-pw-strength">
                      <div className="lv-pw-strength-bars">
                        {[0, 1, 2].map((i) => (
                          <span key={i} style={{ background: i <= s ? COLORS[s] : "var(--gray-200)" }} />
                        ))}
                      </div>
                      <span style={{ color: COLORS[s] }}>{t(lang, LABELS[s])}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    id="confirm"
                    name="confirm"
                    label={t(lang, "Confirm new password")}
                    type="password"
                    value={formik.values.confirm}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirm && formik.errors.confirm}
                    placeholder="••••••••"
                  />
                </div>

                {formik.status && (
                  <p className="lv-error" role="alert" style={{ color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="alert-circle" size={16} />
                    <span>{formik.status}</span>
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={formik.isSubmitting}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {t(lang, "Update Password")}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
    </>
  );
}
