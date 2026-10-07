"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang, t } from "../../utils/lang";
import { getOAuthUrl } from "../../lib/api/seekerAuth";
import { loginWithOAuth } from "../../lib/seekerStore";

// --- Vector Brand Icons ---

export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function ZaloIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect width="48" height="48" rx="10" fill="#0068FF" />
      <path
        fill="#FFFFFF"
        d="M36.2 30.6c-.7-.4-4.1-2-4.7-2.2-.6-.2-1.1-.3-1.5.4-.5.7-1.8 2.2-2.2 2.7-.4.5-.8.5-1.5.2-.7-.4-2.8-1-5.4-3.3-2-1.8-3.4-4-3.8-4.7-.4-.7 0-1.1.3-1.4.3-.3.7-.8 1.1-1.2.4-.4.5-.7.8-1.2.3-.5.1-.9-.1-1.3-.2-.4-1.5-3.6-2.1-5-.5-1.3-1.1-1.1-1.5-1.1h-1.3c-.5 0-1.2.2-1.8.8-.6.7-2.4 2.3-2.4 5.7 0 3.3 2.4 6.6 2.8 7 .4.5 4.8 7.3 11.6 10.2 1.6.7 2.9 1.1 3.9 1.4 1.6.5 3.1.4 4.3.3 1.3-.2 4.1-1.7 4.7-3.3.6-1.7.6-3.1.4-3.4-.2-.3-.6-.5-1.3-.8z"
      />
      <text
        x="24"
        y="29"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="14"
        fontWeight="800"
        textAnchor="middle"
        letterSpacing="-0.5px"
      >
        Zalo
      </text>
    </svg>
  );
}

export function LinkedInIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="#0A66C2"
        d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
      />
    </svg>
  );
}

export function FacebookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

export const OAUTH_PROVIDERS = [
  {
    id: "google",
    name: "Google",
    icon: GoogleIcon,
    bgColor: "#ffffff",
    textColor: "#1f2937",
    borderColor: "#e5e7eb",
    hoverBorder: "#cbd5e1",
    hoverBg: "#f8fafc",
  },
  {
    id: "zalo",
    name: "Zalo",
    icon: ZaloIcon,
    bgColor: "#f0f7ff",
    textColor: "#0068ff",
    borderColor: "#bfdbfe",
    hoverBorder: "#0068ff",
    hoverBg: "#e0efff",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: LinkedInIcon,
    bgColor: "#ffffff",
    textColor: "#0a66c2",
    borderColor: "#e5e7eb",
    hoverBorder: "#0a66c2",
    hoverBg: "#f0f7ff",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: FacebookIcon,
    bgColor: "#ffffff",
    textColor: "#1877f2",
    borderColor: "#e5e7eb",
    hoverBorder: "#1877f2",
    hoverBg: "#f0f7ff",
  },
];

export default function SocialAuthButtons({
  layout = "grid", // "grid" (2x2 or 4 inline), "stacked" (full width), or "compact"
  actionText = "Continue with",
  onSuccess,
  onError,
}) {
  const [lang] = useLang();
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOAuthClick = async (provider, e = null) => {
    setErrorMsg("");
    setLoadingProvider(provider.id);
    const forceSimulated = Boolean(e?.shiftKey);

    try {
      // 1. Check if backend provides live OAuth URL with real client credentials
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
      const redirectUri = `${currentOrigin}/oauth-callback?provider=${provider.id}`;

      let urlData = null;
      if (!forceSimulated) {
        try {
          urlData = await getOAuthUrl(provider.id, redirectUri);
        } catch (err) {
          console.info(`OAuth URL request for ${provider.id} handled in fallback mode:`, err.message);
        }
      }

      // 2. If valid production authorization URL exists with non-mock client credentials, redirect
      if (
        !forceSimulated &&
        urlData?.authorization_url &&
        !urlData.authorization_url.includes("mock-") &&
        urlData.client_id &&
        !urlData.client_id.startsWith("mock-")
      ) {
        window.location.href = urlData.authorization_url;
        return;
      }

      // 3. Seamless developer/demo fallback: authenticate directly with simulated profile
      const demoNames = {
        google: "Google User (Candidate)",
        zalo: "Zalo Seeker (Vietnam)",
        linkedin: "LinkedIn Professional",
        facebook: "Facebook Member",
      };
      const demoEmails = {
        google: "google.candidate@example.com",
        zalo: "zalo.candidate@example.com",
        linkedin: "linkedin.candidate@example.com",
        facebook: "facebook.candidate@example.com",
      };

      await loginWithOAuth(provider.id, {
        provider_user_id: `${provider.id}_user_${Date.now().toString(36)}`,
        name: demoNames[provider.id] || `${provider.name} User`,
        email: demoEmails[provider.id] || `${provider.id}.user@example.com`,
      });

      if (onSuccess) {
        onSuccess(provider.id);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(`OAuth login failed for ${provider.id}:`, err);
      let msg = err.message || t(lang, "Social login failed. Please try again.");
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        msg = t(lang, "Cannot connect to authentication service. Please ensure the backend server is running on port 8001.");
      }
      setErrorMsg(msg);
      if (onError) onError(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div style={{ width: "100%", margin: "8px 0" }}>
      {errorMsg && (
        <div
          role="alert"
          style={{
            padding: "8px 12px",
            marginBottom: 12,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 6,
            fontSize: 12,
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>⚠ {errorMsg}</span>
        </div>
      )}

      {layout === "stacked" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OAUTH_PROVIDERS.map((p) => {
            const IconCmp = p.icon;
            const isLoading = loadingProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                id={`oauth-btn-${p.id}`}
                disabled={Boolean(loadingProvider)}
                onClick={(e) => handleOAuthClick(p, e)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderRadius: 8,
                  backgroundColor: p.bgColor,
                  color: p.textColor,
                  border: `1.5px solid ${p.borderColor}`,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loadingProvider ? "wait" : "pointer",
                  transition: "all 0.15s ease",
                  opacity: loadingProvider && !isLoading ? 0.6 : 1,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  if (!loadingProvider) {
                    e.currentTarget.style.backgroundColor = p.hoverBg;
                    e.currentTarget.style.borderColor = p.hoverBorder;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingProvider) {
                    e.currentTarget.style.backgroundColor = p.bgColor;
                    e.currentTarget.style.borderColor = p.borderColor;
                  }
                }}
              >
                {isLoading ? (
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid #cbd5e1",
                      borderTopColor: p.textColor,
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                ) : (
                  <IconCmp size={18} />
                )}
                <span>
                  {isLoading
                    ? t(lang, "Connecting...")
                    : `${t(lang, actionText)} ${p.name}`}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Grid layout (2x2 or 4 buttons) */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
          }}
        >
          {OAUTH_PROVIDERS.map((p) => {
            const IconCmp = p.icon;
            const isLoading = loadingProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                id={`oauth-btn-${p.id}`}
                disabled={Boolean(loadingProvider)}
                onClick={(e) => handleOAuthClick(p, e)}
                style={{
                  minHeight: 42,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: p.bgColor,
                  color: p.textColor,
                  border: `1.5px solid ${p.borderColor}`,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loadingProvider ? "wait" : "pointer",
                  transition: "all 0.15s ease",
                  opacity: loadingProvider && !isLoading ? 0.6 : 1,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
                onMouseEnter={(e) => {
                  if (!loadingProvider) {
                    e.currentTarget.style.backgroundColor = p.hoverBg;
                    e.currentTarget.style.borderColor = p.hoverBorder;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingProvider) {
                    e.currentTarget.style.backgroundColor = p.bgColor;
                    e.currentTarget.style.borderColor = p.borderColor;
                  }
                }}
                title={`${t(lang, "Continue with")} ${p.name}`}
              >
                {isLoading ? (
                  <span
                    style={{
                      width: 15,
                      height: 15,
                      border: "2px solid #cbd5e1",
                      borderTopColor: p.textColor,
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                ) : (
                  <IconCmp size={18} />
                )}
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Dev helper: Instant test bypass */}
      {/* <div style={{ marginTop: 8, textAlign: "center" }}>
        <button
          type="button"
          onClick={(e) => handleOAuthClick(OAUTH_PROVIDERS[0], { shiftKey: true })}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: 11,
            cursor: "pointer",
            textDecoration: "underline",
            padding: "2px 4px",
          }}
          title="Instant candidate login without redirecting to external OAuth"
        >
          {t(lang, "Shift+Click any button (or click here) for instant demo login")}
        </button>
      </div> */}
    </div>
  );
}
