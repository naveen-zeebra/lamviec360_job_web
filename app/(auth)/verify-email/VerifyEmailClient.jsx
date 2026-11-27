"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button } from "../../../components/ds";
import OtpInput from "../../../components/ds/OtpInput";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t, tr } from "../../../utils/lang";
import { getAuth, verifyEmail, sendVerificationCode } from "../../../lib/seekerStore";

const RESEND_SECONDS = 45;
const OTP_EXPIRY_SECONDS = 15 * 60; // 15 minutes (900 seconds)

export default function VerifyEmailClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams?.get("email") || "";
  const rawRedirect = searchParams?.get("redirect") || "";
  const safeRedirect =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "";

  const [email, setEmail] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SECONDS);
  const [deliveryWarning, setDeliveryWarning] = useState("");
  const [devCode, setDevCode] = useState("");
  const [toast, setToast] = useToast();

  useEffect(() => {
    const auth = getAuth();
    const authEmail = auth?.email || "";
    const target = (queryEmail || authEmail || "").trim();
    setEmail(target);
    const delivery = auth?.emailDelivery;
    if (delivery && delivery.emailDelivered === false) {
      setDeliveryWarning(
        delivery.warning ||
        tr(
          lang,
          "Không thể gửi email thực lúc này; mã xác thực đã được ghi vào console backend ở chế độ local.",
          "Email delivery is unavailable right now; verification code was logged to the backend console in local mode."
        )
      );
      setDevCode(delivery.devCode || "");
    }
  }, [queryEmail]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  useEffect(() => {
    if (expirySeconds <= 0) return;
    const id = setTimeout(() => setExpirySeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [expirySeconds]);

  const formatExpiryTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
  };

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
      if (expirySeconds <= 0) {
        setStatus(t(lang, "This verification code has expired. Please request a new one."));
        setSubmitting(false);
        return;
      }
      const targetEmail = (email || "").trim().toLowerCase();
      if (!targetEmail) {
        setStatus(t(lang, "Email address is missing. Please register or sign in again."));
        setSubmitting(false);
        return;
      }
      try {
        await verifyEmail(targetEmail, values.code.trim());
        setToast(t(lang, "Email verified successfully!"));
        const nextUrl = safeRedirect
          ? `/onboarding?redirect=${encodeURIComponent(safeRedirect)}`
          : "/onboarding";
        setTimeout(() => router.push(nextUrl), 600);
      } catch (error) {
        const msg = error?.message || t(lang, "Invalid verification code.");
        setStatus(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const applyDeliveryFeedback = (res, defaultSuccessMsg) => {
    if (res && res.email_delivered === false) {
      const warnMsg =
        res.warning ||
        tr(
          lang,
          "Không thể gửi email thực lúc này; mã xác thực đã được ghi vào console backend ở chế độ local.",
          "Email delivery is unavailable right now; verification code was logged to the backend console in local mode."
        );
      setDeliveryWarning(warnMsg);
      setDevCode(res.dev_code || "");
      setToast(warnMsg);
    } else {
      setDeliveryWarning("");
      setDevCode("");
      setToast(defaultSuccessMsg);
    }
  };

  const resend = async () => {
    const targetEmail = (email || "").trim().toLowerCase();
    if (!targetEmail) {
      setToast(t(lang, "Email address is required to send code."));
      return;
    }
    setSeconds(RESEND_SECONDS);
    setExpirySeconds(OTP_EXPIRY_SECONDS);
    try {
      const res = await sendVerificationCode(targetEmail);
      applyDeliveryFeedback(res, t(lang, "A new verification code has been sent to your email."));
    } catch (err) {
      setSeconds(0);
      const msg = err.message || t(lang, "Failed to send code. Please try again.");
      setDeliveryWarning(msg);
      setToast(msg);
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
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>
              {t(lang, "We sent a 6-digit code to")}{" "}
              <strong style={{ color: "var(--text-primary)" }}>{email || t(lang, "your email")}</strong>.
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: "var(--radius-pill, 9999px)",
                background: expirySeconds > 0 ? "rgba(37, 99, 235, 0.08)" : "rgba(220, 38, 38, 0.08)",
                border: expirySeconds > 0 ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid rgba(220, 38, 38, 0.2)",
                color: expirySeconds > 0 ? "var(--text-brand, #2563eb)" : "#dc2626",
                fontSize: "var(--text-xs, 12px)",
                fontWeight: 600,
                margin: "0 auto",
                width: "fit-content",
                transition: "all 0.2s ease",
              }}
            >
              <Icon name={expirySeconds > 0 ? "clock" : "alert-circle"} size={14} />
              <span>
                {expirySeconds > 0
                  ? `${t(lang, "Code expires in")}: ${formatExpiryTime(expirySeconds)}`
                  : t(lang, "Code expired. Please request a new code.")}
              </span>
            </div>

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
            <p style={{ marginTop: 8, fontSize: "var(--text-xs)", color: "var(--text-muted, #94a3b8)" }}>
              {t(lang, "Verification codes are valid for 15 minutes.")}
            </p>
          </div>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
      <Toast msg={toast} />
    </>
  );
}
