"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { oauthSeekerLogin } from "../../../lib/api/seekerAuth";
import { getStore, write, syncSeekerWithBackend } from "../../../lib/seekerStore";
import { useLang, t } from "../../../utils/lang";
import { GoogleIcon, ZaloIcon, LinkedInIcon, FacebookIcon } from "../../../components/auth/SocialAuthButtons";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang] = useLang();
  const [status, setStatus] = useState("processing"); // "processing" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const provider = (searchParams.get("provider") || "google").toLowerCase();
  const code = searchParams.get("code");
  const error = searchParams.get("error") || searchParams.get("error_description");

  useEffect(() => {
    async function processOAuth() {
      if (error) {
        setStatus("error");
        setErrorMsg(error || t(lang, "Access denied by provider"));
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMsg(t(lang, "Missing authorization code from provider"));
        return;
      }

      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
        const redirect_uri = `${origin}/oauth-callback?provider=${provider}`;

        const data = await oauthSeekerLogin({
          provider,
          code,
          redirect_uri,
        });

        const store = getStore();
        store.initialized = true;
        const userData = data?.user || data || {};
        store.auth = {
          loggedIn: true,
          emailVerified: true,
          name: userData.full_name || userData.name || store.auth.name,
          email: userData.email || store.auth.email,
          userId: userData.id || userData.user_id,
          role: userData.role || userData.user_type || "jobseeker",
          avatarUrl: userData.avatar_url || "",
          oauthProvider: provider,
        };

        if (store.profile?.personal) {
          if (userData.avatar_url && !store.profile.personal.photo) {
            store.profile.personal.photo = userData.avatar_url;
          }
          if (userData.full_name && !store.profile.personal.fullName) {
            store.profile.personal.fullName = userData.full_name;
          }
        }

        write(store);
        await syncSeekerWithBackend();

        setStatus("success");
        setTimeout(() => {
          if (data?.is_new_user) {
            router.push("/onboarding");
          } else {
            router.push("/dashboard");
          }
        }, 800);
      } catch (err) {
        console.error("OAuth callback exchange failed:", err);
        setStatus("error");
        let msg = err.message || t(lang, "Failed to authenticate with social account");
        if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
          msg = t(lang, "Cannot connect to authentication service. Please ensure the backend server is running on port 8001.");
        }
        setErrorMsg(msg);
      }
    }

    processOAuth();
  }, [code, provider, error]);

  const providerIcons = {
    google: GoogleIcon,
    zalo: ZaloIcon,
    linkedin: LinkedInIcon,
    facebook: FacebookIcon,
  };
  const IconCmp = providerIcons[provider] || GoogleIcon;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: "36px 32px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#f1f5f9",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <IconCmp size={28} />
        </div>

        {status === "processing" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
              {t(lang, "Connecting your account...")}
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>
              {t(lang, "Authenticating with")} {provider.charAt(0).toUpperCase() + provider.slice(1)}...
            </p>
            <div
              style={{
                display: "inline-block",
                width: 32,
                height: 32,
                border: "3px solid #e2e8f0",
                borderTopColor: "#3b82f6",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </>
        )}

        {status === "success" && (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "#dcfce7",
                color: "#16a34a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                marginBottom: 16,
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
              {t(lang, "Welcome!")}
            </h2>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              {t(lang, "Logged in successfully. Redirecting to your dashboard...")}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                marginBottom: 16,
              }}
            >
              ✕
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
              {t(lang, "Authentication Failed")}
            </h2>
            <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 24 }}>
              {errorMsg}
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                width: "100%",
                padding: "11px 16px",
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {t(lang, "Return to Login")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span>Loading...</span>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
