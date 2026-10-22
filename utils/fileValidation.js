/**
 * -----------------------------------------------------------------------------
 * File: utils/fileValidation.js
 * Description: Reusable, bilingual file validation helper functions for
 *              avatars, résumés, certifications, portfolios, and archived documents.
 * -----------------------------------------------------------------------------
 */

import { UPLOAD_CONFIG } from "../config/uploadConfig.js";

/**
 * Format bytes into readable string (e.g. 5 MB, 500 KB)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "") + " MB";
  }
  return (bytes / 1024).toFixed(0) + " KB";
}

/**
 * Check if active language is Vietnamese
 */
function isVietnamese(lang) {
  return String(lang).toUpperCase() === "VN" || String(lang).toUpperCase() === "VI";
}

/**
 * Extract normalized lowercase extension with leading dot (e.g. ".pdf")
 */
function getExtension(fileName) {
  if (!fileName) return "";
  const lastDot = fileName.lastIndexOf(".");
  return lastDot !== -1 ? fileName.slice(lastDot).toLowerCase() : "";
}

/**
 * Validate Avatar (Profile photo)
 * Limit: 2MB, JPG/JPEG/PNG
 * @param {File} file
 * @param {string} [lang]
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateAvatarFile(file, lang = "EN") {
  if (!file) {
    return {
      valid: false,
      error: isVietnamese(lang) ? "Vui lòng chọn ảnh đại diện." : "Please select an image file.",
    };
  }

  const cfg = UPLOAD_CONFIG.AVATAR;
  const ext = getExtension(file.name);
  const mime = (file.type || "").toLowerCase();

  const isExtOk = cfg.extensions.includes(ext);
  const isMimeOk = !mime || cfg.mimes.includes(mime);

  if (!isExtOk || !isMimeOk) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.formatVi : cfg.errors.formatEn,
    };
  }

  if (file.size > cfg.maxBytes) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.sizeVi : cfg.errors.sizeEn,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate Resume (CV)
 * Limit: 5MB, PDF/DOC/DOCX
 * @param {File} file
 * @param {string} [lang]
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateResumeFile(file, lang = "EN") {
  if (!file) {
    return {
      valid: false,
      error: isVietnamese(lang) ? "Vui lòng chọn tệp CV." : "Please select a resume file.",
    };
  }

  const cfg = UPLOAD_CONFIG.RESUME;
  if (file.size === 0) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.emptyVi : cfg.errors.emptyEn,
    };
  }

  const ext = getExtension(file.name);
  if (!cfg.extensions.includes(ext)) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.formatVi : cfg.errors.formatEn,
    };
  }

  if (file.size > cfg.maxBytes) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.sizeVi : cfg.errors.sizeEn,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate Certification Document
 * Limit: 5MB, PDF/PNG/JPG/JPEG/DOC/DOCX
 * @param {File} file
 * @param {string} [lang]
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateCertificationFile(file, lang = "EN") {
  if (!file) {
    return {
      valid: false,
      error: isVietnamese(lang) ? "Vui lòng chọn tệp chứng chỉ." : "Please select a certificate file.",
    };
  }

  const cfg = UPLOAD_CONFIG.CERTIFICATION;
  if (file.size === 0) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.emptyVi : cfg.errors.emptyEn,
    };
  }

  const ext = getExtension(file.name);
  if (!cfg.extensions.includes(ext)) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.formatVi : cfg.errors.formatEn,
    };
  }

  if (file.size > cfg.maxBytes) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.sizeVi : cfg.errors.sizeEn,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate Portfolio File Attachment
 * Limit: 5MB, PDF/PNG/JPG/JPEG/DOC/DOCX
 * @param {File} file
 * @param {string} [lang]
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validatePortfolioFile(file, lang = "EN") {
  if (!file) {
    return {
      valid: false,
      error: isVietnamese(lang) ? "Vui lòng chọn tệp portfolio." : "Please select a portfolio file.",
    };
  }

  const cfg = UPLOAD_CONFIG.PORTFOLIO;
  const ext = getExtension(file.name);
  if (!cfg.extensions.includes(ext)) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.formatVi : cfg.errors.formatEn,
    };
  }

  if (file.size > cfg.maxBytes) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.sizeVi : cfg.errors.sizeEn,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate Candidate Document Archive File (JSP-FR-012)
 * Limit: 10MB per file, 100MB cumulative quota
 * @param {File} file
 * @param {number} [currentUsageBytes=0]
 * @param {string} [lang]
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateArchiveDocumentFile(file, currentUsageBytes = 0, lang = "EN") {
  const cfg = UPLOAD_CONFIG.DOCUMENT_ARCHIVE;
  if (!file) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.requiredVi : cfg.errors.requiredEn,
    };
  }

  const ext = getExtension(file.name);
  if (!cfg.extensions.includes(ext)) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.formatVi : cfg.errors.formatEn,
    };
  }

  if (file.size > cfg.maxBytes) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.sizeVi : cfg.errors.sizeEn,
    };
  }

  if (currentUsageBytes + file.size > cfg.quotaBytes) {
    return {
      valid: false,
      error: isVietnamese(lang) ? cfg.errors.quotaVi : cfg.errors.quotaEn,
    };
  }

  return { valid: true, error: null };
}

/**
 * Calculate total byte size of existing profile attachments (resumes, portfolio, certifications, achievements).
 *
 * @param {Object} profile - Seeker profile object
 * @param {Object} [excludeOptions={}] - Items being replaced
 * @param {string|number} [excludeOptions.excludeResumeId] - Resume being replaced
 * @param {boolean} [excludeOptions.excludePortfolio] - True if replacing portfolio file
 * @param {string|number} [excludeOptions.excludeCertId] - Certificate ID being replaced
 * @param {number} [excludeOptions.excludeCertIndex] - Certificate index being replaced
 * @param {string} [excludeOptions.excludeAchievementId] - Achievement ID being replaced
 * @returns {number} Current byte usage
 */
export function calculateProfileAttachmentBytes(profile, excludeOptions = {}) {
  if (!profile || typeof profile !== "object") return 0;
  let total = 0;

  // 1. Resumes
  const resumes = Array.isArray(profile.resumes) && profile.resumes.length > 0
    ? profile.resumes
    : (profile.resume?.fileName ? [profile.resume] : []);

  resumes.forEach((r, idx) => {
    const rId = r.id || idx;
    if (excludeOptions.excludeResumeId !== undefined && String(rId) === String(excludeOptions.excludeResumeId)) {
      return;
    }
    total += Number(r.size || r.sizeBytes || 0);
  });

  // 2. Portfolio file
  if (!excludeOptions.excludePortfolio) {
    const portSize = Number(profile.portfolio?.size || profile.portfolioFile?.size || 0);
    total += portSize;
  }

  // 3. Certifications
  if (Array.isArray(profile.certifications)) {
    profile.certifications.forEach((c, idx) => {
      const cId = c.id || idx;
      if (
        (excludeOptions.excludeCertId !== undefined && String(cId) === String(excludeOptions.excludeCertId)) ||
        (excludeOptions.excludeCertIndex !== undefined && idx === excludeOptions.excludeCertIndex)
      ) {
        return;
      }
      total += Number(c.fileSize || c.size || 0);
    });
  }

  // 4. Achievements with attached files
  if (Array.isArray(profile.achievements)) {
    profile.achievements.forEach((a) => {
      if (excludeOptions.excludeAchievementId !== undefined && String(a.id) === String(excludeOptions.excludeAchievementId)) {
        return;
      }
      total += Number(a.fileSize || a.size || 0);
    });
  }

  return total;
}

/**
 * Validate cumulative profile attachment quota (JSP-FR-004: max 10MB total across Résumé, Portfolio, and Certificates).
 *
 * Example: Resume (3MB) + Portfolio (5MB) + Certificate (2MB) = 10MB total.
 * If total exceeds 10MB: error message "Total file size cannot exceed 10MB. Please reduce file sizes or remove some documents."
 *
 * @param {number} incomingFileBytes - Byte size of incoming file to attach
 * @param {Object} profile - Current profile object from seekerStore
 * @param {Object} [excludeOptions={}] - Items being replaced (e.g. { excludePortfolio: true })
 * @param {string} [lang="EN"] - "EN" or "VI"
 * @returns {{ valid: boolean, error: string | null, currentBytes: number, newTotalBytes: number, maxBytes: number }}
 */
export function validateCumulativeProfileAttachmentQuota(
  incomingFileBytes,
  profile,
  excludeOptions = {},
  lang = "EN"
) {
  const cfg = UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA;
  const currentBytes = calculateProfileAttachmentBytes(profile, excludeOptions);
  const newTotalBytes = currentBytes + Number(incomingFileBytes || 0);

  if (newTotalBytes > cfg.maxBytes) {
    const errorMsg = isVietnamese(lang) ? cfg.errors.quotaVi : cfg.errors.quotaEn;
    return {
      valid: false,
      error: errorMsg,
      currentBytes,
      newTotalBytes,
      maxBytes: cfg.maxBytes,
    };
  }

  return {
    valid: true,
    error: null,
    currentBytes,
    newTotalBytes,
    maxBytes: cfg.maxBytes,
  };
}

