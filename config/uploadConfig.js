/**
 * -----------------------------------------------------------------------------
 * File: config/uploadConfig.js
 * Description: Centralized file upload rules, limits, allowed formats,
 *              and bilingual messaging for LamViec360 Job Seeker Portal.
 * -----------------------------------------------------------------------------
 */

export const UPLOAD_CONFIG = {
  // Job Seeker Profile Photo / Avatar
  AVATAR: {
    maxMb: 2,
    maxBytes: 2 * 1024 * 1024,
    extensions: [".jpg", ".jpeg", ".png"],
    accept: ".jpg,.jpeg,.png",
    mimes: ["image/jpeg", "image/png", "image/jpg"],
    labelEn: "JPG, JPEG, PNG · Max 2MB",
    labelVi: "JPG, JPEG, PNG · Tối đa 2MB",
    errors: {
      formatEn: "Unsupported file format. Allowed formats: JPG, JPEG, and PNG only.",
      formatVi: "Định dạng tệp không được hỗ trợ. Chỉ chấp nhận JPG, JPEG và PNG.",
      sizeEn: "Profile photo must not exceed 2MB.",
      sizeVi: "Ảnh đại diện không được vượt quá 2MB.",
    },
  },

  // Job Seeker Profile & Application Résumés (CV)
  RESUME: {
    maxMb: 5,
    maxBytes: 5 * 1024 * 1024,
    maxCount: 5,
    extensions: [".pdf", ".doc", ".docx"],
    accept: ".pdf,.doc,.docx",
    labelEn: "PDF, DOC, DOCX only. Max 5MB.",
    labelVi: "Chỉ chấp nhận PDF, DOC, DOCX. Tối đa 5MB.",
    maxCountErrorEn: "You can save a maximum of 5 résumés. Remove one before uploading another.",
    maxCountErrorVi: "Bạn chỉ có thể lưu tối đa 5 bản CV. Vui lòng xóa bớt để tải lên bản mới.",
    errors: {
      formatEn: "Unsupported file format. Allowed formats: PDF, DOC, and DOCX only",
      formatVi: "Định dạng tệp không được hỗ trợ. Chỉ chấp nhận PDF, DOC và DOCX.",
      sizeEn: "Resume file size must not exceed 5 MB.",
      sizeVi: "Kích thước tệp CV không được vượt quá 5 MB.",
      emptyEn: "Resume file is empty.",
      emptyVi: "Tệp CV không có nội dung.",
    },
  },

  // Job Seeker Profile Certification Documents
  CERTIFICATION: {
    maxMb: 5,
    maxBytes: 5 * 1024 * 1024,
    extensions: [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"],
    accept: ".pdf,.png,.jpg,.jpeg,.doc,.docx",
    labelEn: "PDF, PNG, JPG, or DOCX (max 5MB)",
    labelVi: "PDF, PNG, JPG hoặc DOCX (tối đa 5MB)",
    errors: {
      formatEn: "Unsupported file format. Allowed formats: PDF, PNG, JPG, and DOCX only.",
      formatVi: "Định dạng không được hỗ trợ. Chỉ chấp nhận PDF, PNG, JPG và DOCX.",
      sizeEn: "Certificate file size must not exceed 5 MB.",
      sizeVi: "Kích thước tệp chứng chỉ không được vượt quá 5 MB.",
      emptyEn: "File is empty. Please select a valid document.",
      emptyVi: "Tệp rỗng. Vui lòng chọn tài liệu hợp lệ.",
    },
  },

  // Job Seeker Portfolio Document Attachment
  PORTFOLIO: {
    maxMb: 5,
    maxBytes: 5 * 1024 * 1024,
    extensions: [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"],
    accept: ".pdf,.png,.jpg,.jpeg,.doc,.docx",
    labelEn: "PDF, PNG, JPG, DOCX up to 5MB",
    labelVi: "PDF, PNG, JPG, DOCX tối đa 5MB",
    errors: {
      formatEn: "Unsupported portfolio format. Allowed: PDF, PNG, JPG, DOC, DOCX.",
      formatVi: "Định dạng không hỗ trợ. Cho phép: PDF, PNG, JPG, DOC, DOCX.",
      sizeEn: "Portfolio file size must not exceed 5 MB.",
      sizeVi: "Kích thước tệp Portfolio không được vượt quá 5 MB.",
    },
  },

  // JSP-FR-004: Cumulative Profile Attachment Quota (Resume + Portfolio + Certificates = 10MB max)
  PROFILE_ATTACHMENT_QUOTA: {
    maxMb: 10,
    maxBytes: 10 * 1024 * 1024,
    errors: {
      quotaEn: "Total file size cannot exceed 10MB. Please reduce file sizes or remove some documents.",
      quotaVi: "Tổng dung lượng tệp không được vượt quá 10MB. Vui lòng giảm kích thước tệp hoặc xóa bớt tài liệu.",
    },
  },

  // JSP-FR-012: Candidate Document Archive (Contracts, Payslips, Relieving Letters, Certificates)
  DOCUMENT_ARCHIVE: {
    maxMb: 10,
    maxBytes: 10 * 1024 * 1024,
    quotaMb: 100,
    quotaBytes: 100 * 1024 * 1024,
    extensions: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    categories: [
      { id: "all", label: "All Documents", labelVi: "Tất cả tài liệu" },
      { id: "contract", label: "Employment Contracts", labelVi: "Hợp đồng lao động" },
      { id: "relieving", label: "Relieving Letters", labelVi: "Quyết định thôi việc" },
      { id: "payslip", label: "Payslips", labelVi: "Phiếu lương" },
      { id: "certificate", label: "Certificates / Degrees", labelVi: "Bằng cấp & Chứng chỉ" },
      { id: "other", label: "Other", labelVi: "Khác" },
    ],
    errors: {
      formatEn: "Unsupported format. Allowed: PDF, DOC, DOCX, JPG, PNG",
      formatVi: "Định dạng không hỗ trợ. Cho phép: PDF, DOC, DOCX, JPG, PNG",
      sizeEn: "File size must not exceed 10 MB.",
      sizeVi: "Kích thước tệp không được vượt quá 10 MB.",
      quotaEn: "Total document storage limit (100MB) exceeded. Please delete some documents first.",
      quotaVi: "Đã vượt quá hạn mức lưu trữ 100MB. Vui lòng xóa bớt tài liệu trước khi tải lên.",
      requiredEn: "Please select a file to upload.",
      requiredVi: "Vui lòng chọn tệp tài liệu để tải lên.",
    },
  },
};

/**
 * Synchronize runtime upload configuration with remote backend settings.
 * Updates UPLOAD_CONFIG in-place to ensure all consumers immediately reflect new limits.
 *
 * @param {Object} remoteData Backend upload config object (e.g. from GET /api/v1/jobseeker/profile/upload-config)
 * @returns {Object} Updated UPLOAD_CONFIG
 */
export function syncUploadConfig(remoteData) {
  if (!remoteData || typeof remoteData !== "object") return UPLOAD_CONFIG;

  if (remoteData.AVATAR) {
    const av = remoteData.AVATAR;
    if (av.maxMb) {
      UPLOAD_CONFIG.AVATAR.maxMb = av.maxMb;
      UPLOAD_CONFIG.AVATAR.maxBytes = av.maxBytes || av.maxMb * 1024 * 1024;
      UPLOAD_CONFIG.AVATAR.labelEn = `JPG, JPEG, PNG · Max ${av.maxMb}MB`;
      UPLOAD_CONFIG.AVATAR.labelVi = `JPG, JPEG, PNG · Tối đa ${av.maxMb}MB`;
      UPLOAD_CONFIG.AVATAR.errors.sizeEn = `Profile photo must not exceed ${av.maxMb}MB.`;
      UPLOAD_CONFIG.AVATAR.errors.sizeVi = `Ảnh đại diện không được vượt quá ${av.maxMb}MB.`;
    }
    if (Array.isArray(av.extensions)) {
      UPLOAD_CONFIG.AVATAR.extensions = av.extensions;
      UPLOAD_CONFIG.AVATAR.accept = av.extensions.join(",");
    }
  }

  if (remoteData.RESUME) {
    const res = remoteData.RESUME;
    if (res.maxMb) {
      UPLOAD_CONFIG.RESUME.maxMb = res.maxMb;
      UPLOAD_CONFIG.RESUME.maxBytes = res.maxBytes || res.maxMb * 1024 * 1024;
      UPLOAD_CONFIG.RESUME.labelEn = `PDF, DOC, DOCX only. Max ${res.maxMb}MB.`;
      UPLOAD_CONFIG.RESUME.labelVi = `Chỉ chấp nhận PDF, DOC, DOCX. Tối đa ${res.maxMb}MB.`;
      UPLOAD_CONFIG.RESUME.errors.sizeEn = `Resume file size must not exceed ${res.maxMb} MB.`;
      UPLOAD_CONFIG.RESUME.errors.sizeVi = `Kích thước tệp CV không được vượt quá ${res.maxMb} MB.`;
    }
    if (res.maxCount) {
      UPLOAD_CONFIG.RESUME.maxCount = res.maxCount;
      UPLOAD_CONFIG.RESUME.maxCountErrorEn = `You can save a maximum of ${res.maxCount} résumés. Remove one before uploading another.`;
      UPLOAD_CONFIG.RESUME.maxCountErrorVi = `Bạn chỉ có thể lưu tối đa ${res.maxCount} bản CV. Vui lòng xóa bớt để tải lên bản mới.`;
    }
    if (Array.isArray(res.extensions)) {
      UPLOAD_CONFIG.RESUME.extensions = res.extensions;
      UPLOAD_CONFIG.RESUME.accept = res.extensions.join(",");
    }
  }

  if (remoteData.CERTIFICATION) {
    const cert = remoteData.CERTIFICATION;
    if (cert.maxMb) {
      UPLOAD_CONFIG.CERTIFICATION.maxMb = cert.maxMb;
      UPLOAD_CONFIG.CERTIFICATION.maxBytes = cert.maxBytes || cert.maxMb * 1024 * 1024;
      UPLOAD_CONFIG.CERTIFICATION.labelEn = `PDF, PNG, JPG, or DOCX (max ${cert.maxMb}MB)`;
      UPLOAD_CONFIG.CERTIFICATION.labelVi = `PDF, PNG, JPG hoặc DOCX (tối đa ${cert.maxMb}MB)`;
      UPLOAD_CONFIG.CERTIFICATION.errors.sizeEn = `Certificate file size must not exceed ${cert.maxMb} MB.`;
      UPLOAD_CONFIG.CERTIFICATION.errors.sizeVi = `Kích thước tệp chứng chỉ không được vượt quá ${cert.maxMb} MB.`;
    }
    if (Array.isArray(cert.extensions)) {
      UPLOAD_CONFIG.CERTIFICATION.extensions = cert.extensions;
      UPLOAD_CONFIG.CERTIFICATION.accept = cert.extensions.join(",");
    }
  }

  if (remoteData.PORTFOLIO) {
    const port = remoteData.PORTFOLIO;
    if (port.maxMb) {
      UPLOAD_CONFIG.PORTFOLIO.maxMb = port.maxMb;
      UPLOAD_CONFIG.PORTFOLIO.maxBytes = port.maxBytes || port.maxMb * 1024 * 1024;
      UPLOAD_CONFIG.PORTFOLIO.labelEn = `PDF, PNG, JPG, DOCX up to ${port.maxMb}MB`;
      UPLOAD_CONFIG.PORTFOLIO.labelVi = `PDF, PNG, JPG, DOCX tối đa ${port.maxMb}MB`;
      UPLOAD_CONFIG.PORTFOLIO.errors.sizeEn = `Portfolio file size must not exceed ${port.maxMb} MB.`;
      UPLOAD_CONFIG.PORTFOLIO.errors.sizeVi = `Kích thước tệp Portfolio không được vượt quá ${port.maxMb} MB.`;
    }
  }

  if (remoteData.DOCUMENT_ARCHIVE) {
    const doc = remoteData.DOCUMENT_ARCHIVE;
    if (doc.maxMb) {
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.maxMb = doc.maxMb;
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.maxBytes = doc.maxBytes || doc.maxMb * 1024 * 1024;
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.errors.sizeEn = `File size must not exceed ${doc.maxMb} MB.`;
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.errors.sizeVi = `Kích thước tệp không được vượt quá ${doc.maxMb} MB.`;
    }
    if (doc.quotaMb) {
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.quotaMb = doc.quotaMb;
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.quotaBytes = doc.quotaBytes || doc.quotaMb * 1024 * 1024;
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.errors.quotaEn = `Total document storage limit (${doc.quotaMb}MB) exceeded. Please delete some documents first.`;
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.errors.quotaVi = `Đã vượt quá hạn mức lưu trữ ${doc.quotaMb}MB. Vui lòng xóa bớt tài liệu trước khi tải lên.`;
    }
    if (Array.isArray(doc.extensions)) {
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.extensions = doc.extensions;
      UPLOAD_CONFIG.DOCUMENT_ARCHIVE.accept = doc.extensions.join(",");
    }
  }

  if (remoteData.PROFILE_ATTACHMENT_QUOTA) {
    const quota = remoteData.PROFILE_ATTACHMENT_QUOTA;
    if (quota.maxMb) {
      UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxMb = quota.maxMb;
      UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxBytes = quota.maxBytes || quota.maxMb * 1024 * 1024;
    }
    if (quota.errorEn) {
      UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.errors.quotaEn = quota.errorEn;
    }
    if (quota.errorVi) {
      UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.errors.quotaVi = quota.errorVi;
    }
  }

  return UPLOAD_CONFIG;
}

export default UPLOAD_CONFIG;

