"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Input } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import { useLang, t } from "../../../utils/lang";
import Toast, { useToast } from "../../../components/ds/Toast";
import NaukriShell from "../../../components/auth/NaukriShell";
import { login } from "../../../lib/seekerStore";

export default function LoginClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useToast();

  const bullets = [
    t(lang, "One click apply using your profile."),
    t(lang, "Get relevant job recommendations."),
    t(lang, "Showcase profile to top companies."),
    t(lang, "Know application status on applied jobs.")
  ];

  const loginSchema = Yup.object().shape({
    email: Yup.string()
      .email(t(lang, "Please enter a valid email address"))
      .required(t(lang, "Please enter your email")),
    password: Yup.string().required(t(lang, "Please enter your password")),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        await login(values.email.trim(), values.password);
        router.push("/dashboard");
      } catch (error) {
        setStatus(error.message || t(lang, "Incorrect email or password."));
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <>
      <NaukriShell
        lang={lang}
        setLang={setLang}
        app="seeker"
        title={t(lang, "New to LàmViệc360?")}
        bullets={bullets}
        ctaText={t(lang, "Register for Free")}
        ctaHref="/register"
      >
        <h1>{t(lang, "Login")}</h1>
        <form onSubmit={formik.handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
              {t(lang, "Email ID / Username")}
            </label>
            <Input
              id="email"
              name="email"
              type="text"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="name@example.com"
            />
            {formik.touched.email && formik.errors.email && (
              <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="alert-circle" size={13} />
                <span>{formik.errors.email}</span>
              </p>
            )}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
              {t(lang, "Password")}
            </label>
            <div style={{ position: "relative" }}>
              <Input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="••••••••"
              />
              <div
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 12,
                  fontSize: 13,
                  color: "#4f46e5",
                  cursor: "pointer",
                  fontWeight: 500
                }}
              >
                {showPw ? t(lang, "Hide") : t(lang, "Show")}
              </div>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="alert-circle" size={13} />
                <span>{formik.errors.password}</span>
              </p>
            )}
          </div>

          {formik.status && (
            <p className="lv-error" role="alert" style={{ margin: "10px 0", color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="alert-circle" size={16} />
              <span>{formik.status}</span>
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <a
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                router.push("/forgot-password");
              }}
              style={{ fontSize: 12, color: "#4f46e5", fontWeight: 500 }}
            >
              {t(lang, "Forgot Password?")}
            </a>
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="lv-reg-submit"
            style={{
              width: "100%",
              padding: "12px",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: 16,
              fontWeight: 600,
              background: formik.isSubmitting ? "#93c5fd" : "#3b82f6",
              cursor: formik.isSubmitting ? "not-allowed" : "pointer"
            }}
          >
            {formik.isSubmitting ? t(lang, "Logging in...") : t(lang, "Login")}
          </button>
        </form>

        <div className="lv-reg-divider" style={{ margin: "24px 0" }}>Or</div>

        <button
          type="button"
          className="lv-reg-social"
          style={{ width: "100%", padding: "10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 500, cursor: "pointer", color: "#374151" }}
          onClick={async () => {
            try {
              await login("minh.tran@example.com", "password123");
              router.push("/dashboard");
            } catch (err) {
              setToast(t(lang, "Demo sign-in ready"));
            }
          }}
        >
          <Icon name="chrome" size={18} style={{ color: "#4285F4" }} />
          {t(lang, "Sign in with Google (Demo)")}
        </button>
      </NaukriShell>
      <Toast msg={toast} />
    </>
  );
}
