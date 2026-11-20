/**
 * Resume text and structured data extraction utility (client-side).
 * Extracts original candidate information, skills, experiences, education,
 * and portfolio projects directly from PDF, DOCX, and text resume streams.
 */

/**
 * Extracts printable text strings from a PDF data URL or raw string.
 * Inspects PDF content stream text operators: (string) Tj, (string)', and [(string)] TJ.
 */
export function extractTextFromPdfDataUrl(dataUrlOrText) {
  if (!dataUrlOrText || typeof dataUrlOrText !== "string") return [];

  let content = "";

  if (dataUrlOrText.startsWith("data:")) {
    const commaIdx = dataUrlOrText.indexOf(",");
    if (commaIdx !== -1) {
      const base64Str = dataUrlOrText.slice(commaIdx + 1);
      try {
        if (typeof atob === "function") {
          content = atob(base64Str);
        } else if (typeof Buffer !== "undefined") {
          content = Buffer.from(base64Str, "base64").toString("binary");
        }
      } catch (err) {
        console.warn("Base64 decode error in resume parser:", err);
      }
    }
  } else {
    content = dataUrlOrText;
  }

  if (!content) return [];

  const rawLines = [];

  // 1. Match literal text in PDF streams: (escaped text) Tj
  const tjRegex = /\(((?:\\.|[^()\\])*)\)\s*(?:Tj|'|")/g;
  let match;
  while ((match = tjRegex.exec(content)) !== null) {
    const unescaped = match[1]
      .replace(/\\([()\\])/g, "$1")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\t/g, " ")
      .trim();
    if (unescaped.length > 0) {
      rawLines.push(unescaped);
    }
  }

  // 2. Match array text in PDF streams: [(part1) -10 (part2)] TJ
  const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
  while ((match = arrayTjRegex.exec(content)) !== null) {
    const inner = match[1];
    const subMatches = [...inner.matchAll(/\(((?:\\.|[^()\\])*)\)/g)].map((m) =>
      m[1].replace(/\\([()\\])/g, "$1")
    );
    const combined = subMatches.join("").trim();
    if (combined.length > 0) {
      rawLines.push(combined);
    }
  }

  // 3. Fallback: if not standard PDF operator format, parse line-by-line text
  if (rawLines.length === 0) {
    const plain = content.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    return plain;
  }

  return rawLines;
}

/**
 * Parses raw text lines into structured profile data:
 * - personal: fullName, email, phone, location
 * - professional: title, bio, skills
 * - experience: array of { company, title, start, end, isCurrent, description }
 * - education: array of { degree, institution, year }
 * - projects: array of { title, role, fromDate, toDate, description, url }
 */
export function parseStructuredResumeData(rawLines = [], fallbackProfile = {}) {
  const lines = Array.isArray(rawLines) ? rawLines.filter((l) => l && l.length > 0) : [];

  const result = {
    personal: {
      fullName: fallbackProfile.personal?.fullName || "",
      email: fallbackProfile.personal?.email || "",
      phone: fallbackProfile.personal?.phone || "",
      location: fallbackProfile.personal?.location || "",
    },
    professional: {
      title: fallbackProfile.professional?.title || "",
      bio: "",
      skills: fallbackProfile.professional?.skills ? [...fallbackProfile.professional.skills] : [],
    },
    experience: [],
    education: [],
    projects: [],
  };

  if (lines.length === 0) {
    return result;
  }

  // ── Step 1: Detect Header (Name, Title, Contact Info) ──
  if (lines[0] && !lines[0].includes(":") && lines[0].length < 40) {
    result.personal.fullName = lines[0].trim();
  }

  if (lines[1] && !lines[1].includes("@") && !lines[1].includes(":") && lines[1].length < 60) {
    result.professional.title = lines[1].trim();
  }

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];

    // Email
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !result.personal.email) {
      result.personal.email = emailMatch[0].trim();
    }

    // Phone
    const phoneMatch = line.match(/(?:\+?84|0)\s*(?:[1-9]\d{1,2}|[2-9]\d{2,3})[\s.-]?\d{3}[\s.-]?\d{3,4}/);
    if (phoneMatch && !result.personal.phone) {
      result.personal.phone = phoneMatch[0].trim();
    }

    // Location
    if (/ho chi minh|ha noi|hanoi|da nang|vietnam|việt nam/i.test(line)) {
      if (/ho chi minh/i.test(line)) result.personal.location = "Ho Chi Minh City";
      else if (/ha noi|hanoi/i.test(line)) result.personal.location = "Hanoi";
      else if (/da nang/i.test(line)) result.personal.location = "Da Nang";
      else if (/vietnam|việt nam/i.test(line)) result.personal.location = "Vietnam";
    }
  }

  // ── Step 2: Segment into Named Sections ──
  const sectionHeaders = [
    { key: "summary", patterns: [/executive summary/i, /^summary$/i, /^profile$/i, /about me/i, /tổng quan/i, /mục tiêu/i] },
    { key: "skills", patterns: [/core competencies/i, /technical skills/i, /^skills$/i, /kỹ năng/i, /chuyên môn/i] },
    { key: "experience", patterns: [/professional work experience/i, /work experience/i, /^experience$/i, /kinh nghiệm/i] },
    { key: "education", patterns: [/education & credentials/i, /^education$/i, /học vấn/i] },
    { key: "projects", patterns: [/^projects$/i, /featured projects/i, /key projects/i, /dự án/i] },
  ];

  let currentSection = "header";
  const sections = { header: [], summary: [], skills: [], experience: [], education: [], projects: [] };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const cleanHeader = line.replace(/^[#*\\-_\\s]+|[#*\\-_\\s]+$/g, "");

    let matchedSection = null;
    if (cleanHeader.length <= 45) {
      for (const sh of sectionHeaders) {
        if (sh.patterns.some((p) => p.test(cleanHeader))) {
          matchedSection = sh.key;
          break;
        }
      }
    }

    if (matchedSection) {
      currentSection = matchedSection;
    } else {
      sections[currentSection].push(line);
    }
  }

  // ── Step 3: Parse Summary ──
  if (sections.summary.length > 0) {
    result.professional.bio = sections.summary.join(" ").trim();
  }

  // ── Step 4: Parse Skills ──
  if (sections.skills.length > 0) {
    const skillTokens = new Set(result.professional.skills);
    sections.skills.forEach((line) => {
      const cleaned = line.replace(/^(?:key proficiencies|technical skills|proficiencies|kỹ năng chính):\s*/i, "");
      const items = cleaned.split(/[,|•·;]+/).map((s) => s.trim()).filter((s) => s.length >= 2 && s.length <= 30);
      items.forEach((item) => skillTokens.add(item));
    });
    result.professional.skills = Array.from(skillTokens);
  }

  // ── Step 5: Parse Experience ──
  const expLines = sections.experience;
  let currentExp = null;

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i].trim();
    const dateMatch = line.match(/((?:19|20)\d{2}(?:\s*[-/.]\s*\d{1,2})?)\s*(?:[-–—]|to)\s*(present|current|hiện tại|(?:19|20)\d{2}(?:\s*[-/.]\s*\d{1,2})?)/i);
    const isCompanyRoleLine = (line.includes(" - ") || line.includes(" – ") || line.includes(" at ") || line.includes(" | ")) && !dateMatch && !line.startsWith("-") && !line.startsWith("•");

    if (isCompanyRoleLine) {
      if (currentExp && (currentExp.company || currentExp.title)) {
        result.experience.push(currentExp);
      }
      const parts = line.split(/\s*[-–—|]\s*|\s+at\s+/);
      const titleCandidate = parts[0]?.trim() || "";
      const companyCandidate = parts[1]?.trim() || "";

      currentExp = {
        title: titleCandidate,
        company: companyCandidate,
        start: "",
        end: "",
        isCurrent: false,
        description: "",
      };
    } else if (dateMatch && currentExp) {
      const rawStart = dateMatch[1].trim();
      const rawEnd = dateMatch[2].trim();
      currentExp.start = /^\d{4}$/.test(rawStart) ? `${rawStart}-01` : rawStart;
      currentExp.end = /present|current|hiện tại/i.test(rawEnd)
        ? "Present"
        : /^\d{4}$/.test(rawEnd)
        ? `${rawEnd}-12`
        : rawEnd;
      currentExp.isCurrent = currentExp.end === "Present";
    } else if (currentExp) {
      const bullet = line.replace(/^[-*•·\s]+/, "").trim();
      if (bullet.length > 0) {
        currentExp.description = currentExp.description
          ? `${currentExp.description}\n• ${bullet}`
          : `• ${bullet}`;
      }
    }
  }

  if (currentExp && (currentExp.company || currentExp.title)) {
    result.experience.push(currentExp);
  }

  // ── Step 6: Parse Education ──
  const eduLines = sections.education;
  let currentEdu = null;

  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i].trim();
    const dateMatch = line.match(/(?:19|20)\d{2}\s*(?:[-–—]|to)\s*(?:19|20)\d{2}/);

    if (/bachelor|master|phd|degree|engineer|cử nhân|thạc sĩ|kỹ sư/i.test(line)) {
      if (currentEdu) result.education.push(currentEdu);
      currentEdu = {
        degree: line,
        institution: "",
        year: "",
      };
    } else if (dateMatch && currentEdu) {
      const years = line.match(/(?:19|20)\d{2}/g);
      currentEdu.year = years ? years[years.length - 1] : "";
    } else if (/university|college|institute|trường|đại học/i.test(line) && currentEdu) {
      currentEdu.institution = line;
    }
  }
  if (currentEdu) {
    result.education.push(currentEdu);
  }

  // ── Step 7: Parse Portfolio Projects (Original Data Deliverables) ──
  if (sections.projects.length > 0) {
    let proj = null;
    sections.projects.forEach((l) => {
      const line = l.trim();
      if (line.includes(" - ") && !line.startsWith("-")) {
        if (proj) result.projects.push(proj);
        const p = line.split(" - ");
        proj = {
          id: `ext-p-${Date.now()}-${result.projects.length}`,
          title: p[0].trim(),
          role: p[1]?.trim() || result.professional.title || "",
          fromDate: "",
          toDate: "",
          isOngoing: false,
          description: "",
          url: "",
          extractedFromResume: true,
        };
      } else if (proj) {
        proj.description = proj.description ? `${proj.description} ${line}` : line;
      }
    });
    if (proj) result.projects.push(proj);
  }

  // Only extract genuine projects if an explicit projects section was detected.
  // Do NOT synthesize fake projects from experience bullets when no projects exist in the resume.

  return result;
}

/**
 * Generates a clean, professional project title from an achievement bullet point.
 */
export function cleanProjectTitle(bullet, role = "", company = "") {
  if (!bullet || typeof bullet !== "string") return "";
  let text = bullet.replace(/^[•\-*\d.)\s]+/, "").trim();
  if (!text) return "";

  // Split on clause delimiters to keep title concise
  const firstClause = text.split(/(?:[.;]\s+|\s+[-–—]\s+|\s+by\s+|\s+utilizing\s+|\s+resulting in\s+)/i)[0] || text;
  let cleaned = firstClause.trim();

  // Strip trailing metrics clauses
  cleaned = cleaned.replace(/\s+(?:handling|reducing|across|serving|supporting|achieving|with \d+).*$/i, "");

  // Length boundary check
  if (cleaned.length > 60) {
    const sub = cleaned.slice(0, 60);
    const lastSpace = sub.lastIndexOf(" ");
    cleaned = lastSpace > 25 ? sub.slice(0, lastSpace) : sub;
  }

  // Remove dangling prepositions or conjunctions
  while (/\s+(?:and|with|for|to|of|in|at|by|from|or|on|via|,|-|–|—)$/i.test(cleaned)) {
    cleaned = cleaned.replace(/\s+(?:and|with|for|to|of|in|at|by|from|or|on|via|,|-|–|—)$/i, "").trim();
  }

  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Derives structured project deliverables from work experience bullet points.
 */
export function deriveProjectsFromExperiences(experiences = [], skills = [], defaultRole = "", lang = "EN") {
  const results = [];

  const normalizeDate = (val, isEnd = false) => {
    if (!val) return "";
    if (/present|current|hiện tại/i.test(val)) return "Present";
    const str = String(val).trim();
    if (/^\d{4}$/.test(str)) return isEnd ? `${str}-12` : `${str}-01`;
    return str.slice(0, 7);
  };

  experiences.forEach((exp, expIdx) => {
    const bullets = exp.description
      ? exp.description
          .split("\n")
          .map((b) => b.replace(/^[•\-*\s]+/, "").trim())
          .filter(Boolean)
      : [];

    const fromDate = normalizeDate(exp.start, false);
    const toDate = exp.isCurrent ? "Present" : normalizeDate(exp.end, true);
    const isOngoing = exp.isCurrent || toDate === "Present";
    const role = exp.title || defaultRole || "";

    bullets.forEach((bullet, bIdx) => {
      const projectTitle = cleanProjectTitle(bullet, role, exp.company);
      if (!projectTitle) return;

      results.push({
        id: `ext-proj-${Date.now()}-${expIdx}-${bIdx}`,
        title: projectTitle,
        role: role,
        fromDate: fromDate,
        toDate: toDate,
        isOngoing: isOngoing,
        description: bullet,
        url: "",
        extractedFromResume: true,
      });
    });
  });

  return results;
}

/**
 * Resolves the candidate's default resume and extracts genuine project deliverables.
 * Hierarchy:
 * 1. profile.resumes.find(r => r.isDefault)
 * 2. profile.resume (designated default resume slot)
 * 3. profile.resumes[0]
 * 4. deriveProjectsFromExperiences(profile.experience) if genuine bullets exist
 * Returns empty array if no projects are found.
 */
export async function getProjectsFromDefaultResume(profile = {}, lang = "EN") {
  const isVi = lang === "VI";
  const resumesList = Array.isArray(profile?.resumes) ? profile.resumes : [];
  const defaultResume =
    resumesList.find((r) => r.isDefault) ||
    profile?.resume ||
    resumesList[0] ||
    null;

  let sourceName =
    defaultResume?.fileName ||
    defaultResume?.resumeName ||
    "";

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read blob"));
      reader.readAsDataURL(blob);
    });

  // 1. Inlined base64 dataUrl
  if (defaultResume?.dataUrl && String(defaultResume.dataUrl).startsWith("data:")) {
    try {
      const text = await extractTextFromPdfDataUrl(defaultResume.dataUrl);
      const parsed = parseStructuredResumeData(text);
      if (parsed.projects && parsed.projects.length > 0) {
        return { projects: parsed.projects, sourceName: sourceName || (isVi ? "CV Mặc định" : "Default Résumé") };
      }
    } catch (e) {
      console.warn("Base64 resume parse failed:", e);
    }
  }

  // 2. Remote or relative file URL
  const remoteUrl =
    defaultResume?.fileUrl ||
    (defaultResume?.dataUrl && !String(defaultResume.dataUrl).startsWith("data:")
      ? defaultResume.dataUrl
      : null);

  if (remoteUrl && typeof window !== "undefined") {
    try {
      const res = await fetch(remoteUrl);
      if (res.ok) {
        const blob = await res.blob();
        const dataUrl = await blobToDataUrl(blob);
        const text = await extractTextFromPdfDataUrl(dataUrl);
        const parsed = parseStructuredResumeData(text);
        if (parsed.projects && parsed.projects.length > 0) {
          return { projects: parsed.projects, sourceName: sourceName || (isVi ? "CV Mặc định" : "Default Résumé") };
        }
      }
    } catch (e) {
      console.warn("Remote resume fetch failed:", e);
    }
  }

  // If no explicit projects exist in the resume, return empty list so unmatched/fake data is not prepopulated
  return { projects: [], sourceName: sourceName || "" };
}
