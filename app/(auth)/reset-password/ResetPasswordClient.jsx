"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button, Input } from "../../../components/ds";
import { useLang, t } from "../../../utils/lang";
import { completePasswordReset, getAuth } from "../../../lib/seekerStore";

function strength(pw) {
  let score = 0;
  if (!pw) return 0;
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
  const searchParams = useSearchParams();

  const urlToken = searchParams?.get("token") || "";
  const urlEmail = searchParams?.get("email") || "";

  const [done, setDone] = useState(false);

  const resetSchema = Yup.object().shape({
    email: Yup.string()
      .email(t(lang, "Enter a valid email address."))
      .required(t(lang, "Email address is required.")),
    token: Yup.string().required(t(lang, "Verification code or reset token is required.")),
    pw: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters."))
      .required(t(lang, "Password must be at least 8 characters.")),
    confirm: Yup.string()
      .oneOf([Yup.ref("pw"), null], t(lang, "Passwords do not match."))
      .required(t(lang, "Please confirm your password.")),
  });

  const formik = useFormik({
    initialValues: {
      email: urlEmail || getAuth()?.email || "",
      token: urlToken || "",
      pw: "",
      confirm: "",
    },
    enableReinitialize: false,
    validationSchema: resetSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        await completePasswordReset({
          token: values.token.trim(),
          email: values.email.trim(),
          code: values.token.trim(),
          newPassword: values.pw,
        });
        setDone(true);
        setTimeout(() => router.push("/login"), 1500);
      } catch (err) {
        setStatus(err.message || t(lang, "Invalid or expired reset token/code. Please request a new link."));
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (urlToken && !formik.values.token) {
      formik.setFieldValue("token", urlToken);
    }
    if (urlEmail && !formik.values.email) {
      formik.setFieldValue("email", urlEmail);
    }
  }, [urlToken, urlEmail]);

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
                  {t(lang, "Your password has been reset successfully. Redirecting you to login...")}
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
                  {t(lang, "Enter your email, reset code or token, and choose a new password.")}
                </p>
              </div>

              <form onSubmit={formik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <Input
                    id="email"
                    name="email"
                    label={t(lang, "Email address")}
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && formik.errors.email}
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <Input
                    id="token"
                    name="token"
                    label={t(lang, "Reset Code / Token")}
                    type="text"
                    value={formik.values.token}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.token && formik.errors.token}
                    placeholder={t(lang, "6-digit code or reset token from email")}
                  />
                  {urlToken && (
                    <span style={{ fontSize: 11, color: "var(--color-success)", display: "block", marginTop: 4 }}>
                      ✓ {t(lang, "Reset token loaded from link")}
                    </span>
                  )}
                </div>

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
                    <div className="lv-pw-strength" style={{ marginTop: 6 }}>
                      <div className="lv-pw-strength-bars">
                        {[0, 1, 2].map((i) => (
                          <span key={i} style={{ background: i <= s ? COLORS[s] : "var(--gray-200)" }} />
                        ))}
                      </div>
                      <span style={{ color: COLORS[s], fontSize: 12 }}>{t(lang, LABELS[s])}</span>
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
                  {formik.isSubmitting ? t(lang, "Updating Password...") : t(lang, "Update Password")}
                </Button>
              </form>

              <div style={{ textAlign: "center", fontSize: "var(--text-sm)", marginTop: 12 }}>
                <Link href="/forgot-password" style={{ color: "var(--text-secondary)", marginRight: 16 }}>
                  {t(lang, "Resend reset link")}
                </Link>
                <Link href="/login" style={{ fontWeight: 600 }}>
                  {t(lang, "Back to Login")}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
    </>
  );
}

