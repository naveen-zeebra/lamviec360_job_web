"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button, Input } from "../../../components/ds";
import OtpInput from "../../../components/ds/OtpInput";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { getAuth, verifyEmail, sendVerificationCode } from "../../../lib/seekerStore";

const RESEND_SECONDS = 45;

export default function VerifyEmailClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams?.get("email") || "";

  const [email, setEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [toast, setToast] = useToast();

  useEffect(() => {
    const authEmail = getAuth()?.email || "";
    const target = (queryEmail || authEmail || "").trim();
    setEmail(target);
    setTempEmail(target);
    if (!target) {
      setEditingEmail(true);
    }
  }, [queryEmail]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const otpSchema = Yup.object().shape({
    code: Yup.string()
      .length(6, t(lang, "Enter the 6-digit code sent to your email."))
      .required(t(lang, "Enter the 6-digit code sent to your email.")),
  });

  const formik = useFormik({
    initialValues: {
      code: "",
    },
    validationSchema: otpSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      const targetEmail = (email || tempEmail || "").trim().toLowerCase();
      if (!targetEmail) {
        setStatus(t(lang, "Please enter your email address to verify."));
        setEditingEmail(true);
        setSubmitting(false);
        return;
      }
      try {
        await verifyEmail(targetEmail, values.code.trim());
        setToast(t(lang, "Email verified successfully!"));
        setTimeout(() => router.push("/onboarding"), 600);
      } catch (error) {
        const msg = error?.message || t(lang, "Invalid verification code.");
        setStatus(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const resend = async () => {
    const targetEmail = (email || tempEmail || "").trim().toLowerCase();
    if (!targetEmail) {
      setToast(t(lang, "Email address is required to send code."));
      setEditingEmail(true);
      return;
    }
    setSeconds(RESEND_SECONDS);
    try {
      await sendVerificationCode(targetEmail);
      setToast(t(lang, "A new verification code has been sent to your email."));
    } catch (err) {
      setToast(err.message || t(lang, "Failed to send code. Please try again."));
    }
  };

  const handleSaveEmail = async () => {
    const clean = tempEmail.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setToast(t(lang, "Please enter a valid email address."));
      return;
    }
    setEmail(clean);
    setEditingEmail(false);
    formik.setStatus(null);
    setSeconds(RESEND_SECONDS);
    try {
      await sendVerificationCode(clean);
      setToast(t(lang, "Verification code sent to your updated email!"));
    } catch (e) {
      setToast(e.message || t(lang, "Could not send code. Please try again."));
    }
  };

  return (
    <>
      <Header lang={lang} setLang={setLang} app="seeker" />
      <main className="lv-simple-auth">
        <div className="lv-simple-card">
          <div className="lv-simple-icon">
            <Icon name="mail-check" size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: 8 }}>
              {t(lang, "Verify your email")}
            </h1>
            {!editingEmail ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>
                {t(lang, "We sent a 6-digit code to")}{" "}
                <strong style={{ color: "var(--text-primary)" }}>{email || t(lang, "your email")}</strong>.{" "}
                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-brand)",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "var(--text-xs)",
                    padding: 0,
                    marginLeft: 4,
                  }}
                >
                  {t(lang, "Change")}
                </button>
              </p>
            ) : (
              <div style={{ marginTop: 8, marginBottom: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                  {t(lang, "Confirm your email address:")}
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{ flex: 1 }}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={handleSaveEmail}>
                    {t(lang, "Send Code")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={formik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <OtpInput
              value={formik.values.code}
              onChange={(v) => {
                formik.setFieldValue("code", v);
                formik.setStatus(null);
              }}
            />

            {formik.touched.code && formik.errors.code && (
              <p className="lv-error" role="alert" style={{ color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                <Icon name="alert-circle" size={14} />
                <span>{formik.errors.code}</span>
              </p>
            )}

            {formik.status && (
              <p className="lv-error" role="alert" style={{ color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6, lineHeight: 1.4 }}>
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
              {formik.isSubmitting ? t(lang, "Verifying...") : t(lang, "Verify Email")}
            </Button>
          </form>

          <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
            {seconds > 0 ? (
              <span>
                {t(lang, "Resend code in")} {seconds}s
              </span>
            ) : (
              <button
                type="button"
                onClick={resend}
                style={{ background: "none", border: "none", color: "var(--text-brand)", fontWeight: 700, cursor: "pointer", fontSize: "var(--text-sm)" }}
              >
                {t(lang, "Resend code")}
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
      <Toast msg={toast} />
    </>
  );
}
