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
        router.push(`/verify-email?email=${encodeURIComponent(values.email.trim())}`);
      } catch (error) {
        setStatus(error.message || t(lang, "An account with this email address already exists."));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const FieldError = ({ touched, error }) => (
    <p className="lv-reg2-err">
      {touched && error ? (
        <>
          <Icon name="alert-circle" size={12} />
          <span>{error}</span>
        </>
      ) : (
        <span>&nbsp;</span>
      )}
    </p>
  );

  return (
    <>
      <main className="lv-reg2-wrap">
        <div className="lv-reg2-container">

          {/* ── Left panel ─────────────────────────────── */}
          <div className="lv-reg2-left">
            <div className="lv-reg2-brand">
              <img src="/logo-cropped.png" alt="LàmViệc360" style={{ height: 26 }} />
            </div>

            <div className="lv-reg2-left-body">
              <h1 className="lv-reg2-headline">
                {t(lang, "Start Your Career Journey")}
              </h1>
              <p className="lv-reg2-subtext">
                {t(lang, "Get our all-in-one platform that simplifies the way you find jobs, connect with companies, and build your career path.")}
              </p>

              <div className="lv-reg2-pills">
                <span className="lv-reg2-pill">
                  <strong>35K+</strong>&nbsp;{t(lang, "Companies hiring")}
                </span>
                <span className="lv-reg2-pill">
                  <strong>500K+</strong>&nbsp;{t(lang, "Professionals matched")}
                </span>
              </div>

              {/* Minimal decorative icon grid */}
              <div className="lv-reg2-deco" aria-hidden="true">
                <div className="lv-reg2-deco-icon"><Icon name="briefcase" size={22} /></div>
                <div className="lv-reg2-deco-icon"><Icon name="users" size={22} /></div>
                <div className="lv-reg2-deco-icon"><Icon name="trending-up" size={22} /></div>
                <div className="lv-reg2-deco-icon"><Icon name="star" size={22} /></div>
                <div className="lv-reg2-deco-icon"><Icon name="zap" size={22} /></div>
                <div className="lv-reg2-deco-icon"><Icon name="globe" size={22} /></div>
              </div>
            </div>
          </div>

          {/* ── Right form panel ─────────────────────── */}
          <div className="lv-reg2-right">
            <div className="lv-reg2-form-head">
              <h2>{t(lang, "Create account")}</h2>
              {/* <p>{t(lang, "Sign up using the form, or your Google account.")}</p> */}
            </div>



            {/* Form */}
            <form onSubmit={formik.handleSubmit} noValidate>
              {/* Full Name */}
              <div className="lv-reg2-field">
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
                <FieldError touched={formik.touched.name} error={formik.errors.name} />
              </div>

              {/* Email */}
              <div className="lv-reg2-field">
                <Input
                  id="email"
                  name="email"
                  label={t(lang, "Email address")}
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="sarahvaughn42@gmail.com"
                />
                <FieldError touched={formik.touched.email} error={formik.errors.email} />
              </div>

              {/* Password row */}
              <div className="lv-reg2-pw-row">
                <div className="lv-reg2-field">
                  <Input
                    id="password"
                    name="password"
                    label={t(lang, "Password")}
                    type={showPw ? "text" : "password"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    iconRight={<Icon name={showPw ? "eye-off" : "eye"} size={17} style={{ color: "#94a3b8" }} />}
                    onIconRightClick={() => setShowPw(!showPw)}
                  />
                  <FieldError touched={formik.touched.password} error={formik.errors.password} />
                </div>

                <div className="lv-reg2-field">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    label={t(lang, "Confirm password")}
                    type={showConfirmPw ? "text" : "password"}
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    iconRight={<Icon name={showConfirmPw ? "eye-off" : "eye"} size={17} style={{ color: "#94a3b8" }} />}
                    onIconRightClick={() => setShowConfirmPw(!showConfirmPw)}
                  />
                  <FieldError touched={formik.touched.confirmPassword} error={formik.errors.confirmPassword} />
                </div>
              </div>

              {/* Password hint */}
              <div className="lv-reg2-hint">
                <Icon name="info" size={14} style={{ color: "#0d9488", flexShrink: 0, marginTop: 1 }} />
                <span>{t(lang, "Min 8 characters, including letters, numbers and special characters")}</span>
              </div>

              {/* Global API error */}
              {formik.status && (
                <div className="lv-reg2-alert" role="alert">
                  <Icon name="alert-circle" size={15} />
                  <span>{formik.status}</span>
                </div>
              )}

              {/* Submit */}
              <button
                id="register-submit-btn"
                type="submit"
                disabled={formik.isSubmitting}
                className="lv-reg2-submit"
              >
                {formik.isSubmitting ? (
                  <>
                    <span className="lv-reg2-spinner" />
                    {t(lang, "Creating account...")}
                  </>
                ) : (
                  t(lang, "Create account")
                )}
              </button>
            </form>

            <p className="lv-reg2-login-link">
              {t(lang, "Already have an account?")}{" "}
              <Link href="/login">{t(lang, "Log in")}</Link>
            </p>
          </div>

        </div>
      </main>
      <Toast msg={toast} />
    </>
  );
}
