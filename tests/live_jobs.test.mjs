import assert from "node:assert/strict";
import { normalizeJob } from "../lib/api/publicApi.js";

console.log("============================================================");
console.log("RUNNING LIVE JOBS & EXPIRATION VERIFICATION SUITE (BR-201-09)");
console.log("============================================================");

// Mock data
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

// Test 1: Live, published, approved job with future deadline
console.log("\n[TEST 1] Live active job verification:");
const liveJobRaw = {
  id: 101,
  title: "Senior Backend Developer",
  company_name: "Tech Corp",
  status: "published",
  moderation_status: "approved",
  expires_at: futureDate,
  is_deleted: false,
};
const liveJob = normalizeJob(liveJobRaw);
assert.equal(liveJob.isLive, true, "Active job must have isLive = true");
assert.equal(liveJob.isExpired, false, "Active job must have isExpired = false");
assert.equal(liveJob.isNoLongerAvailable, false, "Active job must have isNoLongerAvailable = false");
console.log("  ✓ Live job correctly identified as isLive = true.");

// Test 2: Expired job (past deadline)
console.log("\n[TEST 2] Expired job verification:");
const expiredJobRaw = {
  id: 102,
  title: "DevOps Engineer",
  company_name: "Cloud Solutions",
  status: "published",
  moderation_status: "approved",
  expires_at: pastDate,
  is_deleted: false,
};
const expiredJob = normalizeJob(expiredJobRaw);
assert.equal(expiredJob.isLive, false, "Expired job must NOT be live");
assert.equal(expiredJob.isExpired, true, "Expired job must have isExpired = true");
assert.equal(expiredJob.isNoLongerAvailable, true, "Expired job must be marked isNoLongerAvailable = true");
console.log("  ✓ Expired job correctly identified as isExpired = true and isLive = false.");

// Test 3: Closed job
console.log("\n[TEST 3] Closed / archived job verification:");
const closedJobRaw = {
  id: 103,
  title: "Frontend Developer",
  company_name: "Creative Labs",
  status: "closed",
  moderation_status: "approved",
  expires_at: futureDate,
  is_deleted: false,
};
const closedJob = normalizeJob(closedJobRaw);
assert.equal(closedJob.isLive, false, "Closed job must NOT be live");
assert.equal(closedJob.isClosed, true, "Closed job must have isClosed = true");
assert.equal(closedJob.isNoLongerAvailable, true, "Closed job must be marked isNoLongerAvailable = true");
console.log("  ✓ Closed job correctly flagged as isLive = false.");

// Test 4: Unapproved / pending moderation job
console.log("\n[TEST 4] Unapproved moderation job verification:");
const unapprovedJobRaw = {
  id: 104,
  title: "Product Manager",
  company_name: "NextGen Inc",
  status: "published",
  moderation_status: "pending",
  expires_at: futureDate,
  is_deleted: false,
};
const unapprovedJob = normalizeJob(unapprovedJobRaw);
assert.equal(unapprovedJob.isLive, false, "Pending moderation job must NOT be live on public site");
console.log("  ✓ Pending moderation job excluded from live jobs.");

// Test 5: Search exclusion filter simulation
console.log("\n[TEST 5] JobsClient filter simulation (BR-201-09):");
const mockJobList = [
  liveJobRaw,
  expiredJobRaw,
  closedJobRaw,
  unapprovedJobRaw,
  {
    id: 105,
    title: "AI Specialist",
    company_name: "AI Hub",
    status: "published",
    moderation_status: "approved",
    expires_at: futureDate,
    is_deleted: false,
    is_featured: true,
  },
].map(normalizeJob);

const now = Date.now();
const liveFiltered = mockJobList.filter((j) => {
  if (!j) return false;
  if (j.isLive === false || j.isExpired === true || j.isNoLongerAvailable === true) {
    return false;
  }
  if (j.expires_at || j.deadline) {
    const exp = new Date(j.expires_at || j.deadline).getTime();
    if (!isNaN(exp) && exp < now) return false;
  }
  const status = String(j.status || "published").toLowerCase();
  if (status !== "published" && status !== "active" && status !== "open") {
    return false;
  }
  if (j.is_closed || j.is_deleted) return false;
  if (j.moderation_status && j.moderation_status.toLowerCase() !== "approved") return false;
  return true;
});

assert.equal(liveFiltered.length, 2, "Only 2 active jobs out of 5 should remain");
assert.deepEqual(liveFiltered.map(j => j.id), [101, 105], "Only jobs 101 and 105 should pass the filter");
console.log("  ✓ Only live, approved, non-expired jobs remain in public search.");

// Test 6: Featured jobs sorted to the top (BR-201-08)
console.log("\n[TEST 6] Featured jobs sorting (BR-201-08):");
const sortedJobs = [...liveFiltered].sort((a, b) => {
  const aFeatured = a.is_featured || a.companyObj?.is_featured ? 1 : 0;
  const bFeatured = b.is_featured || b.companyObj?.is_featured ? 1 : 0;
  if (bFeatured !== aFeatured) return bFeatured - aFeatured;
  const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
  return bTime - aTime;
});

assert.equal(sortedJobs[0].id, 105, "Featured job #105 must appear at the top");
console.log("  ✓ Featured job appears at top of results.");

console.log("\n============================================================");
console.log("ALL LIVE JOBS & EXPIRATION TESTS PASSED CLEANLY! (100% SUCCESS)");
console.log("============================================================\n");
