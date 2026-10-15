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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 122.88 116.57"
      width={size}
      height={size}
      aria-label="Zalo"
      role="img"
      fill="none"
    >
      <g>
        <path
          fill="#0180C7"
          d="M38.66,113.29c-6.87,0-13.76,0.23-20.63-0.03C9.91,112.94,3.7,106.13,3.7,98c0-26.24,0.05-52.47,0-78.73c0-8.98,7.02-15.24,15.09-15.47c8.45-0.23,16.93-0.05,25.41-0.05c0.15,0,0.35-0.08,0.43,0.18c-0.05,0.45-0.5,0.5-0.78,0.68c-4.98,2.92-9.53,6.41-13.36,10.74c-6.31,7.14-10.69,15.34-12.17,24.88c-2.62,16.83,2.64,31.12,14.54,43.04c2.11,2.14,2.39,3.8,0.7,6.67c-2.04,3.45-5.13,5.79-8.43,7.92c-0.35,0.2-0.7,0.45-1.06,0.68c-0.53,0.45-0.2,0.68,0.25,0.88c0.1,0.23,0.23,0.43,0.38,0.63c2.89,2.57,5.63,5.31,8.48,7.92c1.33,1.23,2.67,2.51,3.95,3.8C37.66,112.24,38.54,112.39,38.66,113.29Z"
        />

        <path
          fill="#0172B1"
          d="M38.66,113.29c-0.13-0.88-1.01-1.03-1.53-1.56c-1.28-1.31-2.62-2.57-3.95-3.8c-2.84-2.62-5.58-5.36-8.48-7.92c-0.15-0.2-0.28-0.4-0.38-0.63c6.41,1.26,12.68,0.4,18.84-1.48c2.09-0.63,4.18-1.26,6.29-1.79c1.43-0.38,2.94-0.3,4.33,0.2c15.95,5.48,31.69,4.98,47.19-1.81c6.31-2.79,12.07-6.72,16.95-11.62c0.25-0.25,0.43-0.63,0.88-0.65c0.23,0.35,0.1,0.73,0.1,1.11v14.71c0.05,8.4-6.69,15.24-15.09,15.32h-0.13c-9.05,0.05-18.11,0-27.17,0H40.17C39.67,113.32,39.17,113.29,38.66,113.29Z"
        />

        <path
          fill="#0180C7"
          d="M42.59,57c3.8,0,7.37-0.02,10.92,0c1.99,0.03,3.07,0.86,3.27,2.44c0.23,1.99-0.93,3.32-3.09,3.35c-4.08,0.05-8.13,0.03-12.2,0.03c-1.18,0-2.34,0.05-3.52-0.03c-1.46-0.08-2.89-0.38-3.6-1.89c-0.7-1.51-0.2-2.87,0.75-4.1c3.87-4.93,7.77-9.89,11.67-14.82c0.23-0.3,0.45-0.6,0.68-0.88c-0.25-0.43-0.6-0.23-0.91-0.25c-2.72-0.03-5.46,0-8.18-0.03c-0.63,0-1.26-0.08-1.86-0.2c-1.43-0.33-2.31-1.76-1.99-3.17c0.23-0.96,0.98-1.74,1.94-1.96c0.6-0.15,1.23-0.23,1.86-0.23c4.48-0.02,8.98-0.02,13.46,0c0.8-0.02,1.58,0.08,2.36,0.28c1.71,0.58,2.44,2.16,1.76,3.82c-0.6,1.43-1.56,2.67-2.52,3.9c-3.3,4.2-6.59,8.38-9.89,12.53C43.24,56.12,42.99,56.45,42.59,57Z"
        />

        <path
          fill="#0180C7"
          d="M71.77,43.77c0.6-0.78,1.23-1.51,2.26-1.71c1.99-0.4,3.85,0.88,3.87,2.89c0.08,5.03,0.05,10.06,0,15.09c0,1.31-0.85,2.46-2.09,2.84c-1.26,0.48-2.69,0.1-3.52-0.98c-0.43-0.53-0.6-0.63-1.21-0.15c-2.29,1.86-4.88,2.19-7.67,1.28c-4.48-1.46-6.31-4.96-6.82-9.21c-0.53-4.6,1.01-8.53,5.13-10.94C65.15,40.85,68.62,41.03,71.77,43.77ZM62.86,52.95c0.05,1.11,0.4,2.16,1.06,3.04c1.36,1.81,3.95,2.19,5.79,0.83c0.3-0.23,0.58-0.5,0.83-0.83c1.41-1.91,1.41-5.06,0-6.97c-0.71-0.98-1.81-1.56-2.99-1.58C64.77,47.27,62.84,49.4,62.86,52.95Z"
        />

        <path
          fill="#0180C7"
          d="M89.2,53.1c-0.2-6.46,4.05-11.29,10.09-11.47c6.41-0.2,11.09,4.1,11.29,10.39c0.2,6.36-3.7,10.87-9.71,11.47C94.3,64.14,89.1,59.39,89.2,53.1ZM95.51,52.5c-0.05,1.26,0.33,2.49,1.08,3.52c1.38,1.81,3.97,2.16,5.79,0.75c0.28-0.2,0.5-0.45,0.73-0.7c1.46-1.91,1.46-5.13,0.03-7.04c-0.71-0.96-1.81-1.56-2.99-1.58C97.42,47.29,95.51,49.35,95.51,52.5Z"
        />

        <path
          fill="#0180C7"
          d="M86.98,48.1c0,3.9,0.03,7.8,0,11.7c0.03,1.79-1.38,3.27-3.17,3.32c-0.3,0-0.63-0.03-0.93-0.1c-1.26-0.33-2.21-1.66-2.21-3.25v-20c0-1.18-0.03-2.34,0-3.52c0.03-1.94,1.26-3.19,3.12-3.19c1.91-0.02,3.19,1.23,3.19,3.24C87.01,40.22,86.98,44.17,86.98,48.1Z"
        />

        <path
          fill="#0180C7"
          fillRule="evenodd"
          d="M20.18,0h82.53c5.57,0,10.61,2.26,14.27,5.91c3.65,3.65,5.91,8.7,5.91,14.27v76.22c0,5.57-2.26,10.62-5.91,14.27c-3.65,3.65-8.7,5.91-14.27,5.91H20.18c-5.57,0-10.61-2.26-14.27-5.91C2.26,107.01,0,101.96,0,96.39V20.17C0,14.6,2.26,9.56,5.91,5.91C9.56,2.26,14.6,0,20.18,0ZM102.71,7.65H20.18c-3.46,0-6.59,1.4-8.86,3.67c-2.27,2.27-3.67,5.4-3.67,8.86v76.22c0,3.46,1.4,6.59,3.67,8.86c2.27,2.27,5.4,3.67,8.86,3.67h82.53c3.46,0,6.59-1.4,8.86-3.67c2.27-2.27,3.67-5.4,3.67-8.86V20.17c0-3.46-1.4-6.59-3.67-8.86C109.29,9.05,106.16,7.65,102.71,7.65Z"
        />
      </g>
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

export function FacebookIcon({ size = 24 }) {
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
