import { apiRequest } from "./client";

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

  let formattedSalary = "Negotiable";
  if (j.salary) {
    formattedSalary = j.salary;
  } else if (j.salary_min && j.salary_max) {
    const currency = j.salary_currency || "VND";
    if (currency === "VND") {
      formattedSalary = `${Math.round(j.salary_min / 1000000)}M – ${Math.round(
        j.salary_max / 1000000
      )}M VND`;
    } else {
      formattedSalary = `${j.salary_min.toLocaleString()} – ${j.salary_max.toLocaleString()} ${currency}`;
    }
  } else if (j.salary_min) {
    formattedSalary = `From ${j.salary_min.toLocaleString()} ${
      j.salary_currency || "VND"
    }`;
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
  };
}

export async function fetchPublicJobs(params = {}) {
  const res = await apiRequest("/jobs", {
    method: "GET",
    params,
  });
  const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  return list.map(normalizeJob);
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
