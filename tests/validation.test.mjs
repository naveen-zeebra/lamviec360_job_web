/**
 * -----------------------------------------------------------------------------
 * Automated Test Suite: Job Seeker Frontend Validations
 * Run with: node tests/validation.test.mjs
 * -----------------------------------------------------------------------------
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { UPLOAD_CONFIG } from "../config/uploadConfig.js";
import {
  formatBytes,
  validateAvatarFile,
  validateResumeFile,
  validateCertificationFile,
  validatePortfolioFile,
  validateArchiveDocumentFile,
  calculateProfileAttachmentBytes,
  validateCumulativeProfileAttachmentQuota,
} from "../utils/fileValidation.js";
import {
  NAME_REGEX,
  LOCATION_REGEX,
  createProfileValidationSchema,
} from "../lib/validation/profileValidation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Translation mock helper
const t = (lang, text) => text;

console.log("============================================================");
console.log("RUNNING JOB SEEKER FRONTEND VALIDATION TEST SUITE");
console.log("============================================================");

// 1. Test UPLOAD_CONFIG defaults & structure
console.log("\n[TEST 1] UPLOAD_CONFIG constants & limits:");
assert.equal(UPLOAD_CONFIG.AVATAR.maxMb, 2, "Avatar maxMb must be 2MB");
assert.equal(UPLOAD_CONFIG.AVATAR.maxBytes, 2 * 1024 * 1024, "Avatar maxBytes must be 2MB in bytes");
assert.deepEqual(UPLOAD_CONFIG.AVATAR.extensions, [".jpg", ".jpeg", ".png"]);

assert.equal(UPLOAD_CONFIG.RESUME.maxMb, 5, "Resume maxMb must be 5MB");
assert.equal(UPLOAD_CONFIG.RESUME.maxBytes, 5 * 1024 * 1024, "Resume maxBytes must be 5MB in bytes");
assert.equal(UPLOAD_CONFIG.RESUME.maxCount, 5, "Resume maxCount must be 5");
assert.deepEqual(UPLOAD_CONFIG.RESUME.extensions, [".pdf", ".doc", ".docx"]);

assert.equal(UPLOAD_CONFIG.CERTIFICATION.maxMb, 5, "Certification maxMb must be 5MB");
assert.equal(UPLOAD_CONFIG.PORTFOLIO.maxMb, 5, "Portfolio maxMb must be 5MB");

assert.equal(UPLOAD_CONFIG.DOCUMENT_ARCHIVE.maxMb, 10, "Document archive maxMb must be 10MB");
assert.equal(UPLOAD_CONFIG.DOCUMENT_ARCHIVE.quotaMb, 100, "Document archive quotaMb must be 100MB");
assert.equal(UPLOAD_CONFIG.DOCUMENT_ARCHIVE.quotaBytes, 100 * 1024 * 1024);
console.log("  ✓ UPLOAD_CONFIG central limits verified.");

// 2. Test formatBytes helper
console.log("\n[TEST 2] formatBytes helper:");
assert.equal(formatBytes(0), "0 B");
assert.equal(formatBytes(500 * 1024), "500 KB");
assert.equal(formatBytes(2 * 1024 * 1024), "2 MB");
assert.equal(formatBytes(5.5 * 1024 * 1024), "5.5 MB");
console.log("  ✓ formatBytes formatting verified.");

// 3. Test Avatar File Validation
console.log("\n[TEST 3] Avatar validation (validateAvatarFile):");
const validAvatar = { name: "avatar.jpg", size: 1.5 * 1024 * 1024, type: "image/jpeg" };
assert.equal(validateAvatarFile(validAvatar, "EN").valid, true);

const oversizedAvatar = { name: "huge.png", size: 2.5 * 1024 * 1024, type: "image/png" };
const avatarSizeRes = validateAvatarFile(oversizedAvatar, "EN");
assert.equal(avatarSizeRes.valid, false);
assert.match(avatarSizeRes.error, /2MB/);

const invalidAvatarType = { name: "doc.pdf", size: 500 * 1024, type: "application/pdf" };
assert.equal(validateAvatarFile(invalidAvatarType, "EN").valid, false);

const avatarViRes = validateAvatarFile(oversizedAvatar, "VN");
assert.equal(avatarViRes.valid, false);
assert.match(avatarViRes.error, /2MB/);
console.log("  ✓ Avatar validation (size, format, bilingual errors) verified.");

// 4. Test Resume File Validation
console.log("\n[TEST 4] Resume validation (validateResumeFile):");
const validPdfResume = { name: "Alex_Resume.pdf", size: 3 * 1024 * 1024, type: "application/pdf" };
assert.equal(validateResumeFile(validPdfResume, "EN").valid, true);

const validDocxResume = { name: "Alex_Resume.docx", size: 2 * 1024 * 1024, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
assert.equal(validateResumeFile(validDocxResume, "EN").valid, true);

const oversizedResume = { name: "Alex_Resume.pdf", size: 6 * 1024 * 1024, type: "application/pdf" };
const resumeSizeRes = validateResumeFile(oversizedResume, "EN");
assert.equal(resumeSizeRes.valid, false);
assert.match(resumeSizeRes.error, /5 MB/);

const invalidResumeExt = { name: "Alex_Resume.png", size: 1 * 1024 * 1024, type: "image/png" };
assert.equal(validateResumeFile(invalidResumeExt, "EN").valid, false);

const emptyResume = { name: "Empty.pdf", size: 0, type: "application/pdf" };
assert.equal(validateResumeFile(emptyResume, "EN").valid, false);
console.log("  ✓ Resume validation (format, max 5MB, non-empty) verified.");

// 5. Test Certification & Portfolio Validation
console.log("\n[TEST 5] Certification & Portfolio validation:");
const validCert = { name: "aws_cert.pdf", size: 4 * 1024 * 1024, type: "application/pdf" };
assert.equal(validateCertificationFile(validCert, "EN").valid, true);

const oversizedCert = { name: "cert.pdf", size: 6 * 1024 * 1024, type: "application/pdf" };
assert.equal(validateCertificationFile(oversizedCert, "EN").valid, false);

const validPortfolio = { name: "portfolio.png", size: 2 * 1024 * 1024, type: "image/png" };
assert.equal(validatePortfolioFile(validPortfolio, "EN").valid, true);

const oversizedPortfolio = { name: "portfolio.pdf", size: 7 * 1024 * 1024, type: "application/pdf" };
assert.equal(validatePortfolioFile(oversizedPortfolio, "EN").valid, false);
console.log("  ✓ Certification and portfolio validation verified.");

// 6. Test Document Archive Validation (JSP-FR-012)
console.log("\n[TEST 6] Document Archive validation (validateArchiveDocumentFile):");
const validDoc = { name: "contract.pdf", size: 8 * 1024 * 1024, type: "application/pdf" };
assert.equal(validateArchiveDocumentFile(validDoc, 50 * 1024 * 1024, "EN").valid, true);

const oversizedDoc = { name: "contract.pdf", size: 12 * 1024 * 1024, type: "application/pdf" };
assert.equal(validateArchiveDocumentFile(oversizedDoc, 10 * 1024 * 1024, "EN").valid, false);

// Exceeding cumulative 100MB quota
const quotaExceedingDoc = { name: "payslip.pdf", size: 5 * 1024 * 1024, type: "application/pdf" };
const quotaRes = validateArchiveDocumentFile(quotaExceedingDoc, 98 * 1024 * 1024, "EN");
assert.equal(quotaRes.valid, false);
assert.match(quotaRes.error, /100MB/);
console.log("  ✓ Document archive validation (10MB per file, 100MB quota) verified.");

// 7. Test Profile Form Validation Schema (Yup)
console.log("\n[TEST 7] Profile Form Validation Schema (Yup):");
const schema = createProfileValidationSchema(t, "EN");

const validProfile = {
  fullName: "Nguyen Van A",
  location: "Ha Noi, Vietnam",
  phone: "+84 912 345 678",
  citizenId: "001095012345",
  title: "Senior Frontend Engineer",
  portfolioUrl: "https://github.com/nguyenvana",
  salary: "35,000,000",
};
assert.doesNotThrow(() => schema.validateSync(validProfile));

// Salary in 'M' notation (e.g. '35M')
assert.doesNotThrow(() => schema.validateSync({ ...validProfile, salary: "35M" }));

// Invalid full name (contains numbers)
assert.throws(() => {
  schema.validateSync({ ...validProfile, fullName: "Nguyen Van A 123" });
}, /Numbers are not allowed/);

// Invalid full name (too short)
assert.throws(() => {
  schema.validateSync({ ...validProfile, fullName: "N" });
}, /at least 2 characters/);

// Invalid phone (too few digits)
assert.throws(() => {
  schema.validateSync({ ...validProfile, phone: "09123" });
}, /at least 7 digits/);

// Invalid citizen ID (neither 9 nor 12 digits)
assert.throws(() => {
  schema.validateSync({ ...validProfile, citizenId: "12345" });
}, /either 9 digits/);

// Valid citizen ID with 9 digits (CMND)
assert.doesNotThrow(() => schema.validateSync({ ...validProfile, citizenId: "123456789" }));

// Invalid salary (below 1M VND)
assert.throws(() => {
  schema.validateSync({ ...validProfile, salary: "500000" });
}, /Salary expectation must be between 1M and 500M VND/);

// Invalid salary (above 500M VND)
assert.throws(() => {
  schema.validateSync({ ...validProfile, salary: "600,000,000" });
}, /Salary expectation must be between 1M and 500M VND/);
console.log("  ✓ Reusable Yup profile validation schema verified.");

// 8. Verify seekerStore.js derivation from UPLOAD_CONFIG
console.log("\n[TEST 8] Static verification of seekerStore.js integration:");
const seekerStoreContent = fs.readFileSync(path.join(__dirname, "../lib/seekerStore.js"), "utf-8");
assert.ok(seekerStoreContent.includes("UPLOAD_CONFIG.RESUME.maxCount"), "seekerStore must derive MAX_PROFILE_RESUMES from UPLOAD_CONFIG");
assert.ok(seekerStoreContent.includes("UPLOAD_CONFIG.DOCUMENT_ARCHIVE.maxBytes"), "seekerStore must derive MAX_DOCUMENT_FILE_SIZE_BYTES from UPLOAD_CONFIG");
assert.ok(seekerStoreContent.includes("UPLOAD_CONFIG.DOCUMENT_ARCHIVE.quotaBytes"), "seekerStore must derive MAX_ARCHIVE_STORAGE_BYTES from UPLOAD_CONFIG");
console.log("  ✓ seekerStore.js derives from UPLOAD_CONFIG.");

// 9. Verify category classification and filtering
console.log("\n[TEST 9] Candidate Document Archive category verification:");
const testDocs = [
  { id: "1", category: "contract", title: "Contract 2024" },
  { id: "2", category: "relieving", title: "Relieving Letter" },
  { id: "3", category: "payslip", title: "October Payslip" },
  { id: "4", category: "certificate", title: "Degree" },
  { id: "5", category: "other", title: "Other Doc" },
];
const contractDocs = testDocs.filter((d) => d.category === "contract");
assert.equal(contractDocs.length, 1);
const relievingDocs = testDocs.filter((d) => d.category === "relieving");
assert.equal(relievingDocs.length, 1);
const categories = UPLOAD_CONFIG.DOCUMENT_ARCHIVE.categories.map((c) => c.id);
assert.ok(categories.includes("contract"));
assert.ok(categories.includes("relieving"));
assert.ok(categories.includes("payslip"));
assert.ok(categories.includes("certificate"));
assert.ok(categories.includes("other"));
console.log("  ✓ Category filtering and definitions verified.");

// 10. Cumulative Profile Attachment Quota Validation (JSP-FR-004: 10MB Max across Resume, Portfolio, Certificates)
console.log("\n[TEST 10] Cumulative Profile Attachment Quota Validation (10MB Max):");

// Verify configuration
assert.equal(UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxMb, 10, "Profile attachment maxMb must be 10MB");
assert.equal(UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxBytes, 10 * 1024 * 1024, "Profile attachment maxBytes must be 10MB in bytes");

// Example from requirement: Resume (3MB) + Portfolio (5MB) + Certificate (2MB) = 10MB total
const profileAt10Mb = {
  resumes: [{ id: "r1", fileName: "Resume.pdf", size: 3 * 1024 * 1024 }],
  portfolio: { fileName: "Portfolio.pdf", size: 5 * 1024 * 1024 },
  certifications: [{ id: "c1", fileName: "Cert.pdf", fileSize: 2 * 1024 * 1024 }],
};

const exactTotalBytes = calculateProfileAttachmentBytes(profileAt10Mb);
assert.equal(exactTotalBytes, 10 * 1024 * 1024, "Total bytes must equal exactly 10MB");
console.log("  ✓ Formula verified: Resume (3MB) + Portfolio (5MB) + Certificate (2MB) = 10MB total.");

// Test 10MB limit enforcement: attempting to add a 1-byte file to the 10MB profile must fail
const exceedResEn = validateCumulativeProfileAttachmentQuota(1024, profileAt10Mb, {}, "EN");
assert.equal(exceedResEn.valid, false, "Adding to a 10MB profile must fail quota check");
assert.equal(
  exceedResEn.error,
  "Total file size cannot exceed 10MB. Please reduce file sizes or remove some documents.",
  "Must return exact English error message"
);

// Test Vietnamese error message
const exceedResVi = validateCumulativeProfileAttachmentQuota(1024, profileAt10Mb, {}, "VN");
assert.equal(exceedResVi.valid, false);
assert.equal(
  exceedResVi.error,
  "Tổng dung lượng tệp không được vượt quá 10MB. Vui lòng giảm kích thước tệp hoặc xóa bớt tài liệu.",
  "Must return exact Vietnamese error message"
);
console.log("  ✓ Exact bilingual error messages verified.");

// Test Valid upload within quota: empty profile adding 3MB resume
const emptyProfile = { resumes: [], portfolio: null, certifications: [] };
const validResumeRes = validateCumulativeProfileAttachmentQuota(3 * 1024 * 1024, emptyProfile, {}, "EN");
assert.equal(validResumeRes.valid, true);

// Test Replacement scenario:
// Current profile has 10MB. Replace 3MB resume with 2MB resume -> (10MB - 3MB) + 2MB = 9MB (Valid)
const replaceValidRes = validateCumulativeProfileAttachmentQuota(
  2 * 1024 * 1024,
  profileAt10Mb,
  { excludeResumeId: "r1" },
  "EN"
);
assert.equal(replaceValidRes.valid, true, "Replacing 3MB resume with 2MB must be valid");

// Replace 3MB resume with 4MB resume -> (10MB - 3MB) + 4MB = 11MB (Invalid)
const replaceInvalidRes = validateCumulativeProfileAttachmentQuota(
  4 * 1024 * 1024,
  profileAt10Mb,
  { excludeResumeId: "r1" },
  "EN"
);
assert.equal(replaceInvalidRes.valid, false, "Replacing 3MB resume with 4MB must exceed 10MB");
assert.equal(
  replaceInvalidRes.error,
  "Total file size cannot exceed 10MB. Please reduce file sizes or remove some documents."
);

// Replace portfolio (5MB) with 4MB -> (10MB - 5MB) + 4MB = 9MB (Valid)
const replacePortValid = validateCumulativeProfileAttachmentQuota(
  4 * 1024 * 1024,
  profileAt10Mb,
  { excludePortfolio: true },
  "EN"
);
assert.equal(replacePortValid.valid, true);

// Replace certificate (2MB) with 3MB -> (10MB - 2MB) + 3MB = 11MB (Invalid)
const replaceCertInvalid = validateCumulativeProfileAttachmentQuota(
  3 * 1024 * 1024,
  profileAt10Mb,
  { excludeCertId: "c1" },
  "EN"
);
assert.equal(replaceCertInvalid.valid, false);
console.log("  ✓ Replacement-aware quota recalculation verified.");

// Test seekerStore integration
assert.ok(seekerStoreContent.includes("getProfileAttachmentUsage"), "seekerStore must export getProfileAttachmentUsage");
assert.ok(seekerStoreContent.includes("UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxBytes"), "seekerStore must derive MAX_PROFILE_ATTACHMENT_BYTES");
console.log("  ✓ seekerStore.js cumulative attachment integration verified.");

console.log("\n============================================================");
console.log("ALL 10 VALIDATION TEST SUITES PASSED CLEANLY! (100% SUCCESS)");
console.log("============================================================\n");

