/**
 * -------------------------------------------------------
 * File: config/storage.config.js
 * Description: Stage-wise centralized storage configuration (baseName + stage prefix)
 * -------------------------------------------------------
 */
import { ENVIRONMENT } from "./index";

export const STORAGE_CONFIG = {
  // Base name prefix (configurable via env, default: "lv360")
  baseName:
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_STORAGE_BASE_NAME) || "lv360",

  // Environment stage: "local", "uat", "staging", "production"
  stage: ENVIRONMENT || "local",

  // Default cookie options
  cookieDefaults: {
    path: "/",
    sameSite: "Lax",
    secure: typeof process !== "undefined" && process.env.NODE_ENV === "production",
    maxAgeDays: 30,
  },

  // Declarative Storage Keys Registry
  keys: {
    // Auth tokens
    SEEKER_TOKEN: { key: "seeker_token", type: "local", legacyKey: "lv360_seeker_token" },
    SEEKER_REFRESH_TOKEN: { key: "seeker_refresh_token", type: "local", legacyKey: "lv360_seeker_refresh_token" },
    COMPANY_TOKEN: { key: "company_token", type: "local", legacyKey: "lv360_company_token" },

    // Persistent cache & state
    SEEKER_STORE: { key: "seeker_store", type: "local", legacyKey: "lv360-seeker-store-v1" },
    APP_LANGUAGE: { key: "lang", type: "local", legacyKey: "lv360-lang" },
    THEME_MODE: { key: "theme", type: "local", legacyKey: "lv360_theme" },

    // Session-scoped state (tab/session storage)
    SESSION_2FA: { key: "2fa_session", type: "session" },
    DRAFT_JOB_FILTERS: { key: "draft_job_filters", type: "session" },
    ONBOARDING_PROGRESS: { key: "onboarding_progress", type: "session" },
  },
};

/**
 * Returns the stage-scoped storage key:
 * e.g. "lv360_local_seeker_token" or "lv360_uat_seeker_token"
 */
export function getScopedKey(key) {
  return `${STORAGE_CONFIG.baseName}_${STORAGE_CONFIG.stage}_${key}`;
}
