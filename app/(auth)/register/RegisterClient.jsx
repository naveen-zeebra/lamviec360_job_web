"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Input, PhoneInput } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import { useLang, t } from "../../../utils/lang";
import Toast, { useToast } from "../../../components/ds/Toast";
import SocialAuthButtons from "../../../components/auth/SocialAuthButtons";
import { registerDraft } from "../../../lib/seekerStore";

export default function RegisterClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [toast, setToast] = useToast();

  const registerSchema = Yup.object().shape({
    name: Yup.string().required(t(lang, "Full name is required")),
    email: Yup.string()
      .email(t(lang, "Invalid email address"))
      .required(t(lang, "Email is required")),
    phone: Yup.string()
      .nullable()
      .notRequired()
      .test(
        "valid-phone",
        t(lang, "Valid phone: 7-15 digits"),
        (val) => {
          if (!val) return true;
          const digitsOnly = val.replace(/\D/g, "");
          if (digitsOnly.length <= 3) return true;
          return digitsOnly.length >= 7 && digitsOnly.length <= 15;
        }
      ),
    password: Yup.string()
      .min(8, t(lang, "Min 8 characters required"))
      .required(t(lang, "Password is required")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], t(lang, "Passwords do not match"))
      .required(t(lang, "Confirm password is required")),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        const digitsOnly = values.phone ? values.phone.replace(/\D/g, "") : "";
        const fullPhone = digitsOnly.length > 3 ? values.phone.trim() : "";
        await registerDraft(values.name.trim(), values.email.trim(), values.password, fullPhone);
        router.push(`/verify-email?email=${encodeURIComponent(values.email.trim())}`);
      } catch (error) {
        setStatus(error.message || t(lang, "An account with this email address already exists."));
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Prevent typing space as first character
  const handleKeyDownNoLeadingSpace = (e) => {
    if (e.key === " " && (!e.target.value || e.target.selectionStart === 0)) {
      e.preventDefault();
    }
  };

  // Strip leading spaces on change (e.g. if pasted)
  const handleChangeNoLeadingSpace = (field) => (e) => {
    const val = e.target.value.replace(/^\s+/, "");
    formik.setFieldValue(field, val);
  };

  // Fixed height error container prevents layout shifts and UI glitching
  const FieldError = ({ touched, error }) => {
    if (!touched || !error) return <div className="h-4" aria-hidden="true" />;
    return (
      <div className="flex items-center gap-1 text-[11px] text-red-600 h-4 leading-none truncate">
        <Icon name="alert-circle" size={12} className="shrink-0 text-red-500" />
        <span className="truncate">{error}</span>
      </div>
    );
  };

  const isPasswordConfirmed =
    Boolean(formik.values.confirmPassword) &&
    formik.values.confirmPassword.length >= 8 &&
    formik.values.confirmPassword === formik.values.password;

  return (
    <>
      <main className="min-h-screen lg:h-screen lg:max-h-screen flex items-center justify-center bg-slate-50 p-3 sm:p-5 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 w-full max-w-[1020px] bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden my-auto max-h-[96vh]">

          {/* ── Left panel (Brand & Benefits) ─────────────────────── */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-slate-50/80 border-r border-slate-200/80 p-7 xl:p-8 overflow-hidden">
            <div>
              <div className="flex items-center justify-between gap-3 mb-5">
                <img src="/logo-cropped.png" alt="LàmViệc360" className="h-[25px] w-auto" />
              </div>

              <h1 className="text-2xl xl:text-[27px] font-extrabold text-slate-900 leading-tight mb-2 tracking-tight">
                {t(lang, "Start Your Career Journey")}
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {t(lang, "Get our all-in-one platform that simplifies the way you find jobs, connect with companies, and build your career path.")}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center text-[11.5px] text-slate-700 bg-white border border-slate-200 rounded-full px-2.5 py-1 font-medium shadow-2xs">
                  <strong className="text-blue-600 font-bold">35K+</strong>&nbsp;{t(lang, "Companies hiring")}
                </span>
                <span className="inline-flex items-center text-[11.5px] text-slate-700 bg-white border border-slate-200 rounded-full px-2.5 py-1 font-medium shadow-2xs">
                  <strong className="text-blue-600 font-bold">500K+</strong>&nbsp;{t(lang, "Professionals matched")}
                </span>
              </div>
            </div>

            {/* Feature benefit highlights */}
            <div className="space-y-2.5 my-auto py-1">
              <div className="flex items-start gap-2.5 bg-white/80 border border-slate-200/70 rounded-xl p-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Icon name="briefcase" size={15} />
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-slate-800 text-[12px]">{t(lang, "Verified Employers")}</p>
                  <p className="text-slate-500 text-[11px] leading-tight truncate">{t(lang, "Connect directly with 35,000+ top hiring companies.")}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white/80 border border-slate-200/70 rounded-xl p-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Icon name="zap" size={15} />
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-slate-800 text-[12px]">{t(lang, "One-Click Apply")}</p>
                  <p className="text-slate-500 text-[11px] leading-tight truncate">{t(lang, "Quick application with your personalized profile & CV.")}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white/80 border border-slate-200/70 rounded-xl p-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Icon name="trending-up" size={15} />
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-slate-800 text-[12px]">{t(lang, "Track Status in Real-Time")}</p>
                  <p className="text-slate-500 text-[11px] leading-tight truncate">{t(lang, "Instant updates on your applications and interviews.")}</p>
                </div>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-1.5 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500">
              <Icon name="check-circle" size={13} className="text-emerald-500 shrink-0" />
              <span>{t(lang, "Free forever for job seekers • No credit card required")}</span>
            </div>
          </div>

          {/* ── Right form panel ─────────────────────── */}
          <div className="lg:col-span-7 p-5 sm:p-7 xl:p-8 flex flex-col justify-center overflow-y-auto overflow-x-hidden">
            {/* Header row with back button and title */}
            <div className="flex items-center gap-2.5 mb-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/login");
                  }
                }}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer shrink-0"
                aria-label={t(lang, "Back")}
              >
                <Icon name="arrow-left" size={14} />
              </button>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {t(lang, "Create account")}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={formik.handleSubmit} noValidate>
              {/* Full Name */}
              <div className="mb-0.5">
                <Input
                  id="name"
                  name="name"
                  label={t(lang, "Full name")}
                  type="text"
                  size="sm"
                  value={formik.values.name}
                  onChange={handleChangeNoLeadingSpace("name")}
                  onKeyDown={handleKeyDownNoLeadingSpace}
                  onBlur={formik.handleBlur}
                  placeholder={t(lang, "Enter your full name")}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                />
                <FieldError touched={formik.touched.name} error={formik.errors.name} />
              </div>

              {/* Email */}
              <div className="mb-0.5">
                <Input
                  id="email"
                  name="email"
                  label={t(lang, "Email address")}
                  type="email"
                  size="sm"
                  value={formik.values.email}
                  onChange={handleChangeNoLeadingSpace("email")}
                  onKeyDown={handleKeyDownNoLeadingSpace}
                  onBlur={formik.handleBlur}
                  placeholder={t(lang, "Enter your email address")}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                />
                <FieldError touched={formik.touched.email} error={formik.errors.email} />
              </div>

              {/* Phone using react-international-phone component */}
              <div className="mb-0.5">
                <PhoneInput
                  id="phone"
                  name="phone"
                  label={t(lang, "Phone number")}
                  size="sm"
                  value={formik.values.phone}
                  onChange={(phone) => formik.setFieldValue("phone", phone)}
                  onBlur={formik.handleBlur}
                  placeholder={t(lang, "Enter your phone number")}
                  defaultCountry="vn"
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                />
                <FieldError touched={formik.touched.phone} error={formik.errors.phone} />
              </div>

              {/* Password row with min-w-0 grid safety */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <div className="min-w-0 mb-0.5">
                  <Input
                    id="password"
                    name="password"
                    label={t(lang, "Password")}
                    type={showPw ? "text" : "password"}
                    size="sm"
                    value={formik.values.password}
                    onChange={handleChangeNoLeadingSpace("password")}
                    onKeyDown={handleKeyDownNoLeadingSpace}
                    onBlur={formik.handleBlur}
                    placeholder={t(lang, "Enter your password")}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    iconRight={
                      <Icon
                        name={showPw ? "eye-off" : "eye"}
                        size={15}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      />
                    }
                    onIconRightClick={() => setShowPw(!showPw)}
                  />
                  <FieldError touched={formik.touched.password} error={formik.errors.password} />
                </div>

                <div className="min-w-0 mb-0.5">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    label={t(lang, "Confirm password")}
                    type={showConfirmPw ? "text" : "password"}
                    size="sm"
                    value={formik.values.confirmPassword}
                    onChange={handleChangeNoLeadingSpace("confirmPassword")}
                    onKeyDown={handleKeyDownNoLeadingSpace}
                    onBlur={formik.handleBlur}
                    placeholder={t(lang, "Confirm your password")}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    iconRight={
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isPasswordConfirmed && (
                          <span title={t(lang, "Passwords match")} className="flex items-center">
                            <Icon name="check-circle" size={15} className="text-emerald-500 shrink-0" />
                          </span>
                        )}
                        <Icon
                          name={showConfirmPw ? "eye-off" : "eye"}
                          size={15}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        />
                      </div>
                    }
                    onIconRightClick={() => setShowConfirmPw(!showConfirmPw)}
                  />
                  <FieldError touched={formik.touched.confirmPassword} error={formik.errors.confirmPassword} />
                </div>
              </div>

              {/* Password hint */}
              <div className="flex items-center gap-1.5 text-[11px] text-teal-800 bg-emerald-50/80 border border-emerald-200/70 rounded-md px-2.5 py-1 mb-2.5 leading-normal">
                <Icon name="info" size={13} className="text-teal-600 shrink-0" />
                <span className="truncate">{t(lang, "Min 8 characters, including letters, numbers & symbols")}</span>
              </div>

              {/* Global API error */}
              {formik.status && (
                <div className="flex items-center gap-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md p-2 mb-2" role="alert">
                  <Icon name="alert-circle" size={14} className="shrink-0" />
                  <span>{formik.status}</span>
                </div>
              )}

              {/* Submit */}
              <button
                id="register-submit-btn"
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-65 disabled:cursor-not-allowed mb-2.5 cursor-pointer"
              >
                {formik.isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin shrink-0" />
                    {t(lang, "Creating account...")}
                  </>
                ) : (
                  t(lang, "Create account")
                )}
              </button>

              {/* Social Auth Divider */}
              <div className="flex items-center my-1.5 mb-2 gap-2.5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  {t(lang, "or sign up with")}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google, Zalo, LinkedIn, Facebook OAuth */}
              <SocialAuthButtons
                layout="grid"
                actionText="Sign up with"
                onSuccess={() => router.push("/dashboard")}
                onError={(msg) => setToast(msg)}
              />
            </form>

            <p className="text-center text-xs text-slate-500 mt-2">
              {t(lang, "Already have an account?")}{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
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
