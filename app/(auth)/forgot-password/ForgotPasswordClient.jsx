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

export default function ForgotPasswordClient() {
  const [lang, setLang] = useLang();
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

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
    onSubmit: (values) => {
      setSubmittedEmail(values.email);
      setSent(true);
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
                  {t(lang, "If an account exists for")} <strong>{submittedEmail}</strong>, {t(lang, "a reset link has been sent.")}
                </p>
              </div>
              <Link href="/reset-password">
                <Button variant="primary" size="lg" style={{ width: "100%", justifyContent: "center" }}>
                  {t(lang, "Continue (open reset link)")}
                </Button>
              </Link>
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
                  {t(lang, "Send Reset Link")}
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
