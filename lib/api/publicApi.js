import { apiRequest } from "./client.js";

export function normalizeJob(j) {
  if (!j) return null;

  const companyObj =
    typeof j.company === "object" && j.company !== null ? j.company : null;
  const companyName =
    j.company_name ||
    companyObj?.company_name ||
    (typeof j.company === "string" ? j.company : "") ||
    "Company";
  const companyLogo = companyObj?.logo_url || j.company_logo || "";

  const city = j.city || "";
  const country = j.country || "";
  const locationStr =
    j.location ||
    (city && country ? `${city}, ${country}` : city || country || "Remote");

  const salaryType = j.salary_type || j.salaryType || "Gross";
  let formattedSalary = "Negotiable";
  if (j.salary) {
    formattedSalary = j.salary;
  } else if (j.salary_min && j.salary_max) {
    const currency = j.salary_currency || "VND";
    if (currency === "VND") {
      formattedSalary = `${Math.round(j.salary_min / 1000000)}M – ${Math.round(
        j.salary_max / 1000000
      )}M VND (${salaryType})`;
    } else {
      formattedSalary = `${j.salary_min.toLocaleString()} – ${j.salary_max.toLocaleString()} ${currency} (${salaryType})`;
    }
  } else if (j.salary_min) {
    formattedSalary = `From ${j.salary_min.toLocaleString()} ${
      j.salary_currency || "VND"
    } (${salaryType})`;
  } else if (j.is_negotiable) {
    formattedSalary = "Negotiable";
  }

  let skillsArr = [];
  if (Array.isArray(j.skills)) {
    skillsArr = j.skills;
  } else if (typeof j.required_skills === "string" && j.required_skills) {
    skillsArr = j.required_skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (typeof j.skills === "string" && j.skills) {
    skillsArr = j.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const jobType = j.job_type || j.type || "Full-time";
  const workplaceType =
    j.workplace_type ||
    j.mode ||
    (locationStr.toLowerCase().includes("remote") ? "Remote" : "On-site");
  const experienceLevel = j.experience_level || j.level || "Mid-level";

  const now = Date.now();
  const rawExpiresAt = j.expires_at || j.deadline || null;
  const expiresAtTime = rawExpiresAt ? new Date(rawExpiresAt).getTime() : null;
  const isExpired =
    j.is_expired === true ||
    (expiresAtTime !== null && !isNaN(expiresAtTime) && expiresAtTime < now);

  const status = String(j.status || "published").toLowerCase();
  const isClosed =
    j.is_closed === true ||
    status === "closed" ||
    status === "archived" ||
    status === "draft";
  const isDeleted = j.is_deleted === true;
  const isModerated =
    !j.moderation_status || j.moderation_status.toLowerCase() === "approved";

  const isLive =
    !isExpired &&
    !isClosed &&
    !isDeleted &&
    isModerated &&
    (status === "published" || status === "active" || status === "open");

  const isNoLongerAvailable = !isLive || isExpired || isClosed;

  return {
    ...j,
    id: j.id,
    title: j.title || "Job Title",
    titleVi: j.titleVi || j.title || "Vị trí tuyển dụng",
    company: companyName, // Guaranteed string representation so j.company.slice(0, 2) never crashes
    company_name: companyName,
    company_logo: companyLogo,
    companyObj: companyObj || {
      id: j.company_id || j.id,
      company_name: companyName,
      logo_url: companyLogo,
      verification_status: "verified",
    },
    location: locationStr,
    locationVi: j.locationVi || locationStr,
    city: j.city || locationStr,
    country: j.country || "VN",
    salary: formattedSalary,
    salary_min: j.salary_min,
    salary_max: j.salary_max,
    salary_currency: j.salary_currency || "VND",
    salary_type: salaryType,
    salaryType: salaryType,
    vacancies: j.vacancies !== undefined && j.vacancies !== null ? Number(j.vacancies) : 1,
    education: j.education || "Bachelor's Degree",
    attitude_type: j.attitude_type || j.attitudeType || "",
    attitudeType: j.attitude_type || j.attitudeType || "",
    social_type: j.social_type || j.socialType || "",
    socialType: j.social_type || j.socialType || "",
    personality_type: j.personality_type || j.personalityType || "",
    personalityType: j.personality_type || j.personalityType || "",
    overtime_willingness: j.overtime_willingness || j.overtimeWillingness || "",
    overtimeWillingness: j.overtime_willingness || j.overtimeWillingness || "",
    project_work_reqs: j.project_work_reqs || j.projectWorkReqs || "",
    projectWorkReqs: j.project_work_reqs || j.projectWorkReqs || "",
    ai_generated: Boolean(j.ai_generated || j.aiGenerated),
    aiGenerated: Boolean(j.ai_generated || j.aiGenerated),
    type: jobType,
    job_type: jobType,
    mode: workplaceType,
    workplace_type: workplaceType,
    level: experienceLevel,
    experience_level: experienceLevel,
    industry:
      companyObj?.industry || j.industry || j.department || "Technology",
    posted: j.posted || (j.created_at ? new Date(j.created_at).toLocaleDateString() : "Recently"),
    postedVi: j.postedVi || (j.created_at ? new Date(j.created_at).toLocaleDateString("vi-VN") : "Gần đây"),
    skills: skillsArr,
    required_skills: j.required_skills || skillsArr.join(", "),
    verified: companyObj?.verification_status === "verified" || j.verified !== false,
    description: j.description || j.jd || "",
    jd: j.jd || j.description || "",
    requirements: j.requirements || "",
    benefits: j.benefits || "",
    views_count: j.views_count || 0,
    applications_count: j.applications_count || 0,
    status: j.status || "published",
    expires_at: rawExpiresAt,
    deadline: rawExpiresAt,
    is_expired: isExpired,
    isExpired,
    is_live: isLive,
    isLive,
    is_closed: isClosed,
    isClosed,
    isNoLongerAvailable,
  };
}

export async function fetchPublicJobs(params = {}) {
  const { include_expired = false, ...restParams } = params;
  const queryParams = { page_size: 100, ...restParams };
  const res = await apiRequest("/jobs", {
    method: "GET",
    params: queryParams,
  });
  const list = Array.isArray(res?.items)
    ? res.items
    : Array.isArray(res?.data?.items)
    ? res.data.items
    : Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res)
    ? res
    : [];
  const normalized = list.map(normalizeJob).filter(Boolean);
  return include_expired ? normalized : normalized.filter((j) => j.isLive);
}

export async function fetchPublicJobDetail(id) {
  const res = await apiRequest(`/jobs/${id}`, {
    method: "GET",
  });
  const item = res?.data || (res?.id ? res : null);
  return item ? normalizeJob(item) : null;
}

export async function fetchMasterData() {
  const res = await apiRequest("/public/master-data", {
    method: "GET",
  });
  return res?.data || res;
}

export async function reportJob(jobId, payload) {
  return await apiRequest(`/jobs/${jobId}/report`, {
    method: "POST",
    body: payload,
  });
}

export function normalizeCompany(c) {
  if (!c) return null;
  const name = c.company_name || c.name || "Company";
  return {
    ...c,
    id: c.id,
    name,
    company_name: name,
    logo_url: c.logo_url || c.logo || "",
    cover_image_url: c.cover_image_url || c.coverImage || "",
    tagline: c.tagline || "",
    industry: c.industry || "Technology",
    company_size: c.company_size || c.size || "11–50 employees",
    city: c.city || "Vietnam",
    country: c.country || "Vietnam",
    address: c.address || "",
    website: c.website || "",
    contact_email: c.contact_email || c.email || "",
    contact_phone: c.contact_phone || c.phone || "",
    contact_person: c.contact_person || "",
    founded_year: c.founded_year || null,
    linkedin_url: c.linkedin_url || "",
    facebook_url: c.facebook_url || "",
    verified: c.verified !== false && c.verification_status !== "rejected",
    is_featured: !!c.is_featured,
    is_public: c.is_public !== false,
    open_jobs_count: c.open_jobs_count ?? (Array.isArray(c.open_jobs) ? c.open_jobs.length : (c.jobs || 0)),
    about: c.about || c.description || "",
    benefits: c.benefits || "",
    workplace_model: c.workplace_model || "Hybrid",
    working_hours: c.working_hours || "Monday – Friday (9:00 AM – 6:00 PM)",
    culture_values: Array.isArray(c.culture_values) ? c.culture_values : [],
    open_jobs: Array.isArray(c.open_jobs) ? c.open_jobs.map(normalizeJob).filter(Boolean) : [],
  };
}

export async function fetchPublicCompanies(params = {}) {
  const res = await apiRequest("/companies", {
    method: "GET",
    params: { page_size: 50, ...params },
  });
  const list = Array.isArray(res?.items)
    ? res.items
    : Array.isArray(res?.data?.items)
    ? res.data.items
    : Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res)
    ? res
    : [];
  return list.map(normalizeCompany).filter(Boolean);
}

export async function fetchPublicCompanyDetail(idOrSlug) {
  const res = await apiRequest(`/companies/${encodeURIComponent(idOrSlug)}`, {
    method: "GET",
  });
  const item = res?.data || (res?.id ? res : null);
  return item ? normalizeCompany(item) : null;
}

