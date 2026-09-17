"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button, Input } from "../../../components/ds";
import Check from "../../../components/ds/Check";
import { useLang, t } from "../../../utils/lang";
import { login } from "../../../lib/companyStore";

function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3);
}
const LABELS = ["Weak", "Fair", "Good", "Strong"];
const COLORS = ["var(--color-danger)", "var(--color-warning)", "var(--color-blue-500)", "var(--color-success)"];

const SUMMARY =
  "flex flex-col gap-3 text-left [&_div]:flex [&_div]:justify-between [&_div]:gap-4 [&_div]:border-b [&_div]:border-line [&_div]:pb-3 [&_div:last-child]:border-0 [&_div:last-child]:pb-0 [&_dt]:m-0 [&_dt]:text-faint [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold [&_dd]:[overflow-wrap:anywhere]";
const ERR = "flex items-start gap-2 rounded-md border border-red-100 bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger-fg";

export default function EmployeeActivationClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const params = useSearchParams();

  const companyName = params.get("company") || "ABC Technologies";
  const email = params.get("email") || "duc.hoang@abctech.vn";
  const role = params.get("role") || "HR / Recruiter";
  const invStatus = params.get("status") || "Valid";
  const valid = invStatus === "Valid";

  const [done, setDone] = useState(false);

  const activationSchema = Yup.object().shape({
    pw: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters."))
      .required(t(lang, "Password must be at least 8 characters.")),
    confirm: Yup.string()
      .oneOf([Yup.ref("pw"), null], t(lang, "Passwords do not match."))
      .required(t(lang, "Please confirm your password.")),
    agree: Yup.boolean().oneOf([true], t(lang, "Please accept the terms to continue.")),
  });

  const formik = useFormik({
    initialValues: {
      pw: "",
      confirm: "",
      agree: false,
    },
    validationSchema: activationSchema,
    onSubmit: async () => {
      login();
      setDone(true);
      setTimeout(() => router.push("/company/overview"), 1400);
    },
  });

  const s = strength(formik.values.pw);

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-brand-subtle px-6 py-12">
        <div className="flex w-full max-w-[440px] flex-col gap-5 rounded-xl bg-card p-8 text-center shadow-lg">
          {done ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-success">
                <Icon name="check-circle" size={28} />
              </div>
              <div>
                <h1 className="mb-2 text-2xl font-extrabold">{t(lang, "Account activated")}</h1>
                <p className="text-sm text-muted">{t(lang, "Taking you to your workspace…")}</p>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
                <Icon name="user-check" size={28} />
              </div>
              <div>
                <h1 className="mb-2 text-2xl font-extrabold">{t(lang, "Activate your account")}</h1>
                <p className="text-sm leading-relaxed text-muted">
                  {t(lang, "Set a password to join the company workspace. No separate company registration is needed.")}
                </p>
              </div>

              <dl className={SUMMARY}>
                <div>
                  <dt>{t(lang, "Company")}</dt>
                  <dd>{companyName}</dd>
                </div>
                <div>
                  <dt>{t(lang, "Invited Email")}</dt>
                  <dd>{email}</dd>
                </div>
                <div>
                  <dt>{t(lang, "Assigned Role")}</dt>
                  <dd>{t(lang, role)}</dd>
                </div>
                <div>
                  <dt>{t(lang, "Invitation Status")}</dt>
                  <dd className={valid ? "text-success-fg" : "text-danger-fg"}>{t(lang, invStatus)}</dd>
                </div>
              </dl>

              {!valid ? (
                <p className={ERR} role="alert">
                  <Icon name="alert-circle" size={16} />
                  <span>{t(lang, "This invitation is no longer valid. Please ask your company admin to send a new one.")}</span>
                </p>
              ) : (
                <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4 text-left">
                  <div>
                    <Input
                      id="pw"
                      name="pw"
                      label={t(lang, "New Password")}
                      type="password"
                      value={formik.values.pw}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.pw && formik.errors.pw}
                      placeholder="••••••••"
                    />
                    {formik.values.pw && (
                      <div className="mt-2 flex items-center gap-2.5">
                        <div className="flex flex-1 gap-1">
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="h-1 flex-1 rounded-pill" style={{ background: i <= s ? COLORS[s] : "var(--color-gray-200)" }} />
                          ))}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: COLORS[s] }}>{t(lang, LABELS[s])}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Input
                      id="confirm"
                      name="confirm"
                      label={t(lang, "Confirm Password")}
                      type="password"
                      value={formik.values.confirm}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.confirm && formik.errors.confirm}
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <Check
                      label={t(lang, "I agree to the Terms of Service and Privacy Policy")}
                      checked={formik.values.agree}
                      onChange={() => formik.setFieldValue("agree", !formik.values.agree)}
                    />
                    {formik.touched.agree && formik.errors.agree && (
                      <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                        {formik.errors.agree}
                      </p>
                    )}
                  </div>

                  {formik.status && (
                    <p className={ERR} role="alert">
                      <Icon name="alert-circle" size={16} />
                      <span>{formik.status}</span>
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={formik.isSubmitting}
                    className="w-full justify-center"
                  >
                    {formik.isSubmitting ? t(lang, "Activating...") : t(lang, "Activate & Continue")}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
    </>
  );
}
