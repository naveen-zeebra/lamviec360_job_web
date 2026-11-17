"use client";
import { useState } from "react";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button, Input } from "../../../components/ds";
import { useLang, t } from "../../../utils/lang";
import { requestPasswordReset } from "../../../lib/seekerStore";

export default function ForgotPasswordClient() {
  const [lang, setLang] = useLang();
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  const forgotSchema = Yup.object().shape({
    email: Yup.string()
      .email(t(lang, "Enter a valid email address."))
      .required(t(lang, "Enter a valid email address.")),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: forgotSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      setErrorInfo(null);
      const email = values.email.trim();
      try {
        const res = await requestPasswordReset(email);
        const resData = res?.data || res;
        setSubmittedEmail(email);
        setRemainingAttempts(
          typeof resData?.remaining_attempts === "number" ? resData.remaining_attempts : null
        );
        setSent(true);
      } catch (err) {
        const statusCode = err?.status || err?.response?.status;
        const rawMsg = err?.message || t(lang, "Failed to send reset link. Please try again.");

        let type = "GENERAL";
        const lowerMsg = rawMsg.toLowerCase();
        if (statusCode === 404 || lowerMsg.includes("no account found")) {
          type = "NOT_FOUND";
        } else if (statusCode === 429 || lowerMsg.includes("limit reached")) {
          type = "RATE_LIMITED";
        } else if (
          statusCode === 400 &&
          (lowerMsg.includes("employer") || lowerMsg.includes("admin"))
        ) {
          type = "ROLE_MISMATCH";
        }

        setErrorInfo({
          type,
          message: rawMsg,
          email,
        });
        setStatus(rawMsg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main className="lv-simple-auth">
        <div className="lv-simple-card">
          {sent ? (
            <>
              <div className="lv-simple-icon">
                <Icon name="mail-check" size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: 8 }}>
                  {t(lang, "Check your email")}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>
                  {t(lang, "A password reset link has been sent to")} <strong>{submittedEmail}</strong>. {t(lang, "The link is valid for 60 minutes.")}
                </p>
                {remainingAttempts !== null && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 9999,
                      backgroundColor: remainingAttempts > 0 ? "#f0fdf4" : "#fef2f2",
                      border: `1px solid ${remainingAttempts > 0 ? "#bbf7d0" : "#fecaca"}`,
                      color: remainingAttempts > 0 ? "#166534" : "#991b1b",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <Icon name={remainingAttempts > 0 ? "clock" : "alert-circle"} size={14} />
                    <span>
                      {t(lang, "Daily reset requests remaining")}: {remainingAttempts} / 3 (LV-BR-0034)
                    </span>
                  </div>
                )}
              </div>
              <Link href={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}>
                <Button variant="primary" size="lg" style={{ width: "100%", justifyContent: "center" }}>
                  {t(lang, "Continue (open reset link)")}
                </Button>
              </Link>
              <div style={{ textAlign: "center", marginTop: 8 }}>
                {remainingAttempts === 0 ? (
                  <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-xs)", margin: 0 }}>
                    {t(
                      lang,
                      "You have reached the maximum 3 reset requests for today (LV-BR-0034). Please check your inbox or try again in 24 hours."
                    )}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setErrorInfo(null);
                      formik.setStatus(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--blue-600)",
                      cursor: "pointer",
                      fontSize: "var(--text-sm)",
                      fontWeight: 600,
                    }}
                  >
                    {t(lang, "Didn't receive the email? Try again")}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="lv-simple-icon">
                <Icon name="key-round" size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: 8 }}>
                  {t(lang, "Forgot your password?")}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>
                  {t(lang, "Enter your email and we'll send you a link to reset it.")}
                </p>
              </div>
              <form onSubmit={formik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <Input
                    id="email"
                    name="email"
                    label={t(lang, "Email")}
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && formik.errors.email}
                    placeholder="name@example.com"
                  />
                </div>

                {errorInfo?.type === "NOT_FOUND" ? (
                  <div
                    style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                    role="alert"
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Icon name="alert-circle" size={18} style={{ color: "#dc2626", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ color: "#991b1b", fontSize: 13, lineHeight: 1.4 }}>
                        <strong>{t(lang, "No account found")}</strong>: {errorInfo.message}
                      </div>
                    </div>
                    <Link
                      href={`/register?email=${encodeURIComponent(errorInfo.email)}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "8px 14px",
                        backgroundColor: "#dc2626",
                        color: "#ffffff",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                        width: "fit-content",
                        marginTop: 2,
                      }}
                    >
                      <span>{t(lang, "Create an account with this email")}</span>
                      <Icon name="arrow-right" size={14} />
                    </Link>
                  </div>
                ) : errorInfo?.type === "RATE_LIMITED" ? (
                  <div
                    style={{
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 8,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                    role="alert"
                  >
                    <Icon name="clock" size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
                    <div style={{ color: "#92400e", fontSize: 13, lineHeight: 1.4 }}>
                      <strong>{t(lang, "Limit Reached (LV-BR-0034)")}</strong>: {errorInfo.message}
                    </div>
                  </div>
                ) : errorInfo?.type === "ROLE_MISMATCH" ? (
                  <div
                    style={{
                      backgroundColor: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: 8,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                    role="alert"
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Icon name="info" size={18} style={{ color: "#2563eb", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ color: "#1e40af", fontSize: 13, lineHeight: 1.4 }}>
                        {errorInfo.message}
                      </div>
                    </div>
                    <a
                      href="http://localhost:3002/forgot-password"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#1d4ed8",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <span>{t(lang, "Go to Employer Portal")}</span>
                      <Icon name="external-link" size={14} />
                    </a>
                  </div>
                ) : formik.status ? (
                  <p className="lv-error" role="alert" style={{ color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="alert-circle" size={16} />
                    <span>{formik.status}</span>
                  </p>
                ) : null}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={formik.isSubmitting}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {formik.isSubmitting ? t(lang, "Sending...") : t(lang, "Send Reset Link")}
                </Button>
              </form>
            </>
          )}
          <div style={{ textAlign: "center", fontSize: "var(--text-sm)", marginTop: 12 }}>
            <Link href="/login" style={{ fontWeight: 600 }}>
              {t(lang, "Back to Login")}
            </Link>
          </div>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
    </>
  );
}
