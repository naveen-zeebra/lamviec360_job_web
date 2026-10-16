import assert from "node:assert/strict";
import { UPLOAD_CONFIG, syncUploadConfig } from "../config/uploadConfig.js";
import {
  validateAvatarFile,
  validateResumeFile,
  validateCertificationFile,
  validateArchiveDocumentFile,
  formatBytes,
} from "../utils/fileValidation.js";

console.log("=== Running Integration Upload Config Tests ===");

// 1. Initial State verification
assert.equal(UPLOAD_CONFIG.AVATAR.maxMb, 2);
assert.equal(UPLOAD_CONFIG.RESUME.maxMb, 5);
assert.equal(UPLOAD_CONFIG.RESUME.maxCount, 5);
assert.equal(UPLOAD_CONFIG.DOCUMENT_ARCHIVE.quotaMb, 100);
console.log("✔ Initial defaults verified");

// 2. Validate Avatar before dynamic update (2.5MB should fail with 2MB limit)
const fake2_5MbAvatar = {
  name: "photo.jpg",
  size: 2.5 * 1024 * 1024,
  type: "image/jpeg",
};
const resBefore = validateAvatarFile(fake2_5MbAvatar);
assert.equal(resBefore.valid, false);
assert.match(resBefore.error, /2MB/);
console.log("✔ Validation with 2MB default successfully rejects 2.5MB file");

// 3. Dynamic sync from backend payload (simulating GET /profile/upload-config returning 4MB avatar, 10MB resume)
const remotePayload = {
  AVATAR: {
    maxMb: 4,
    maxBytes: 4 * 1024 * 1024,
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    errorMessage: "Profile photo must not exceed 4MB.",
  },
  RESUME: {
    maxMb: 10,
    maxBytes: 10 * 1024 * 1024,
    maxCount: 8,
    extensions: [".pdf", ".docx"],
    errorMessage: "Resume file size must not exceed 10 MB.",
  },
  DOCUMENT_ARCHIVE: {
    maxMb: 20,
    maxBytes: 20 * 1024 * 1024,
    quotaMb: 200,
    quotaBytes: 200 * 1024 * 1024,
    extensions: [".pdf", ".doc", ".docx", ".jpg", ".png"],
  },
  PROFILE_ATTACHMENT_QUOTA: {
    maxMb: 15,
    maxBytes: 15 * 1024 * 1024,
  },
};

syncUploadConfig(remotePayload);

// Verify in-place update
assert.equal(UPLOAD_CONFIG.AVATAR.maxMb, 4);
assert.equal(UPLOAD_CONFIG.AVATAR.maxBytes, 4 * 1024 * 1024);
assert.equal(UPLOAD_CONFIG.AVATAR.accept, ".jpg,.jpeg,.png,.webp");
assert.match(UPLOAD_CONFIG.AVATAR.labelEn, /4MB/);
assert.match(UPLOAD_CONFIG.AVATAR.errors.sizeEn, /4MB/);

assert.equal(UPLOAD_CONFIG.RESUME.maxMb, 10);
assert.equal(UPLOAD_CONFIG.RESUME.maxCount, 8);
assert.match(UPLOAD_CONFIG.RESUME.maxCountErrorEn, /8/);

assert.equal(UPLOAD_CONFIG.DOCUMENT_ARCHIVE.maxMb, 20);
assert.equal(UPLOAD_CONFIG.DOCUMENT_ARCHIVE.quotaMb, 200);

assert.equal(UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxMb, 15);
assert.equal(UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxBytes, 15 * 1024 * 1024);
console.log("✔ Dynamic sync updated UPLOAD_CONFIG in-place (including PROFILE_ATTACHMENT_QUOTA)");

// 4. Validate Avatar after dynamic update (2.5MB should now pass with 4MB limit)
const resAfter = validateAvatarFile(fake2_5MbAvatar);
assert.equal(resAfter.valid, true);
assert.equal(resAfter.error, null);
console.log("✔ Dynamic update takes immediate effect in validateAvatarFile (2.5MB now valid)");

// 5. Test 7MB resume with 10MB limit (should now pass, previously would fail 5MB)
const fake7MbResume = {
  name: "cv.docx",
  size: 7 * 1024 * 1024,
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
const resumeRes = validateResumeFile(fake7MbResume);
assert.equal(resumeRes.valid, true);
console.log("✔ Dynamic update takes immediate effect in validateResumeFile (7MB now valid)");

// 6. Reset back to original defaults for test isolation
syncUploadConfig({
  AVATAR: { maxMb: 2, maxBytes: 2 * 1024 * 1024, extensions: [".jpg", ".jpeg", ".png"] },
  RESUME: { maxMb: 5, maxBytes: 5 * 1024 * 1024, maxCount: 5, extensions: [".pdf", ".doc", ".docx"] },
  DOCUMENT_ARCHIVE: { maxMb: 10, maxBytes: 10 * 1024 * 1024, quotaMb: 100, quotaBytes: 100 * 1024 * 1024 },
  PROFILE_ATTACHMENT_QUOTA: { maxMb: 10, maxBytes: 10 * 1024 * 1024 },
});
assert.equal(UPLOAD_CONFIG.AVATAR.maxMb, 2);
assert.equal(UPLOAD_CONFIG.RESUME.maxMb, 5);
assert.equal(UPLOAD_CONFIG.PROFILE_ATTACHMENT_QUOTA.maxMb, 10);
console.log("✔ Defaults safely restored for test suite isolation");

console.log("\nALL INTEGRATION TESTS PASSED SUCCESSFULLY! (7/7)");
