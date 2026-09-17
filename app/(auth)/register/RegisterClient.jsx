"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Input } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import { useLang, t } from "../../../utils/lang";
import Toast, { useToast } from "../../../components/ds/Toast";
import { registerDraft } from "../../../lib/seekerStore";

export default function RegisterClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [toast, setToast] = useToast();

  const registerSchema = Yup.object().shape({
    name: Yup.string().required(t(lang, "Please enter your full name")),
    email: Yup.string()
      .email(t(lang, "Please enter a valid email"))
      .required(t(lang, "Please enter your email")),
    password: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters"))
      .required(t(lang, "Password is required")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], t(lang, "Passwords do not match"))
      .required(t(lang, "Please confirm your password")),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        await registerDraft(values.name.trim(), values.email.trim(), values.password);
        router.push("/verify-email");
      } catch (error) {
        setStatus(error.message || t(lang, "An account with this email address already exists."));
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <>
      <main className="lv-reg-wrap">
        <div className="lv-reg-container">
          {/* Left Marketing Panel */}
          <div className="lv-reg-left">
            <div className="lv-reg-left-brand">
              <img src="/logo-cropped.png" alt="LàmViệc360" style={{ height: 28 }} />
            </div>

            <h1>{t(lang, "The AI platform for hiring and careers")}</h1>
            <p>
              {t(lang, "Get our all-in-one platform that simplifies the way you find jobs, connect with companies, and build your career path.")}
            </p>

            <div className="lv-reg-left-cards">
              <div className="lv-reg-left-card">
                <strong>35K+</strong>
                <span>{t(lang, "Companies hiring")}</span>
              </div>
              <div className="lv-reg-left-card">
                <strong>500K+</strong>
                <span>{t(lang, "Professionals matched")}</span>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lv-reg-right">
            <h2>{t(lang, "Create your account")}</h2>
            <p>{t(lang, "Sign up using the form, or the Google account you use.")}</p>

            <button type="button" className="lv-reg-social" onClick={() => setToast("Social login demo")}>
              <Icon name="chrome" size={18} style={{ color: "#4285F4" }} />
              {t(lang, "Sign up with Google")}
            </button>

            <div className="lv-reg-divider">or</div>

            <form onSubmit={formik.handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <Input
                  id="name"
                  name="name"
                  label={t(lang, "Full name")}
                  type="text"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Sarah Vaughn"
                />
                {formik.touched.name && formik.errors.name && (
                  <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="alert-circle" size={13} />
                    <span>{formik.errors.name}</span>
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <Input
                  id="email"
                  name="email"
                  label={t(lang, "Email")}
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="sarahvaughn42@gmail.com"
                />
                {formik.touched.email && formik.errors.email && (
                  <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="alert-circle" size={13} />
                    <span>{formik.errors.email}</span>
                  </p>
                )}
              </div>

              <div className="lv-reg-row" style={{ marginBottom: 4 }}>
                <div>
                  <Input
                    id="password"
                    name="password"
                    label={t(lang, "Password")}
                    type={showPw ? "text" : "password"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    iconRight={<Icon name={showPw ? "eye-off" : "eye"} size={18} style={{ color: "#9ca3af" }} />}
                    onIconRightClick={() => setShowPw(!showPw)}
                  />
                  {formik.touched.password && formik.errors.password && (
                    <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="alert-circle" size={13} />
                      <span>{formik.errors.password}</span>
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    label={t(lang, "Confirm password")}
                    type={showConfirmPw ? "text" : "password"}
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    iconRight={<Icon name={showConfirmPw ? "eye-off" : "eye"} size={18} style={{ color: "#9ca3af" }} />}
                    onIconRightClick={() => setShowConfirmPw(!showConfirmPw)}
                  />
                  {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                    <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="alert-circle" size={13} />
                      <span>{formik.errors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>

              <p className="lv-reg-hint">
                {t(lang, "Min 8 characters, including letters, numbers and special characters")}
              </p>

              {formik.status && (
                <p className="lv-error" role="alert" style={{ marginTop: 16, color: "var(--color-error)", fontSize: 14, display: "flex", gap: 6, alignItems: "center" }}>
                  <Icon name="alert-circle" size={16} />
                  <span>{formik.status}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="lv-reg-submit"
                style={{ opacity: formik.isSubmitting ? 0.7 : 1, cursor: formik.isSubmitting ? "not-allowed" : "pointer" }}
              >
                {formik.isSubmitting ? t(lang, "Creating account...") : t(lang, "Submit")}
              </button>
            </form>

            <p style={{ marginTop: 24, fontSize: 14, color: "#4b5563", textAlign: "center" }}>
              {t(lang, "Already have an account?")}{" "}
              <Link href="/login" style={{ fontWeight: 600, color: "#111827" }}>
                {t(lang, "Log in")}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Toast msg={toast} />
    </>
  );
}
