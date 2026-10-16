/**
 * -----------------------------------------------------------------------------
 * File: lib/validation/profileValidation.js
 * Description: Reusable Formik/Yup validation schemas and field rules for
 *              Job Seeker profile forms (Settings, Onboarding, Registration).
 * -----------------------------------------------------------------------------
 */

import * as Yup from "yup";

/**
 * Standard regex for allowable name characters (Unicode Vietnamese accents, spaces, hyphens, apostrophes)
 */
export const NAME_REGEX = /^[a-zA-Z\s\u00C0-\u024F\u1EA0-\u1EF9\-'.]+$/;

/**
 * Standard regex for allowable location characters (alphanumeric, Vietnamese accents, spaces, hyphens, commas, periods)
 */
export const LOCATION_REGEX = /^[a-zA-Z0-9\s\u00C0-\u024F\u1EA0-\u1EF9\-.,]*$/;

/**
 * Build Full Name validator
 */
export function buildFullNameSchema(t, lang) {
  return Yup.string()
    .required(t(lang, "Please enter your full name."))
    .max(100, t(lang, "Full name must not exceed 100 characters."))
    .min(2, t(lang, "Full name must be at least 2 characters."))
    .test("no-leading-space", t(lang, "First character cannot be a space."), (val) => !val || !/^\s/.test(val))
    .test("no-numbers", t(lang, "Numbers are not allowed in full name."), (val) => !val || !/\d/.test(val))
    .test(
      "no-special-chars",
      t(lang, "Numbers and special characters are not allowed in full name."),
      (val) => !val || NAME_REGEX.test(val)
    );
}

/**
 * Build Location / City validator
 */
export function buildLocationSchema(t, lang, fieldName = "location") {
  const label = fieldName === "city" ? "City" : "Location";
  return Yup.string()
    .max(30, t(lang, `${label} must not exceed 30 characters.`))
    .test(
      "no-special-chars",
      t(lang, `Special characters are not allowed in ${label.toLowerCase()}.`),
      (val) => !val || LOCATION_REGEX.test(val)
    );
}

/**
 * Build Phone Number validator
 * Requires 7 to 15 digits when provided
 */
export function buildPhoneSchema(t, lang) {
  return Yup.string().test(
    "phone-valid",
    t(lang, "Please enter a valid phone number (at least 7 digits)."),
    function (val) {
      if (!val || !val.trim()) return true;
      const digits = val.replace(/\D/g, "");
      if (digits.length <= 3) return true;
      return digits.length >= 7 && digits.length <= 15;
    }
  );
}

/**
 * Build Citizen ID (CCCD/CMND) validator
 * Optional, but if provided must be exactly 9 digits (CMND) or 12 digits (CCCD)
 */
export function buildCitizenIdSchema(t, lang) {
  return Yup.string().test(
    "citizen-id-valid",
    t(lang, "Citizenship ID must be either 9 digits (Old CMND) or 12 digits (CCCD / New Citizen ID)."),
    function (val) {
      if (!val || !val.trim()) return true;
      const digits = val.replace(/\D/g, "");
      return digits.length === 9 || digits.length === 12;
    }
  );
}

/**
 * Build Expected Salary validator (BR-101-05: 1M - 500M VND)
 * Supports '20M', '25,000,000', or raw numbers
 */
export function buildSalarySchema(t, lang) {
  return Yup.string().test(
    "salary-valid",
    t(lang, "Salary expectation must be between 1M and 500M VND per month"),
    function (val) {
      if (!val || !val.trim()) return true;
      const raw = String(val).replace(/,/g, "").trim();
      let num = null;
      const matchM = raw.match(/^(\d+(\.\d+)?)\s*M?$/i);
      if (matchM && raw.toUpperCase().includes("M")) {
        num = parseFloat(matchM[1]) * 1_000_000;
      } else {
        const matchNum = raw.match(/\d+/);
        if (matchNum) {
          const parsed = parseFloat(matchNum[0]);
          num = parsed < 1000 ? parsed * 1_000_000 : parsed;
        }
      }
      if (num !== null && (num < 1_000_000 || num > 500_000_000)) {
        return false;
      }
      return true;
    }
  );
}

/**
 * Build URL validator (Portfolio, GitHub, LinkedIn)
 */
export function buildUrlSchema(t, lang) {
  return Yup.string().test(
    "url-valid",
    t(lang, "Please enter a valid URL (e.g. https://github.com/yourname)"),
    function (val) {
      if (!val || !val.trim()) return true;
      try {
        const test = val.startsWith("http://") || val.startsWith("https://") ? val : `https://${val}`;
        new URL(test);
        return true;
      } catch {
        return false;
      }
    }
  );
}

/**
 * Factory for complete Profile Validation Schema
 * @param {Function} t - translation function
 * @param {string} lang - current language code ('EN' or 'VN')
 * @param {object} [options] - optional config (e.g., requireTitleForStep)
 */
export function createProfileValidationSchema(t, lang, options = {}) {
  const { requireTitleForStep = null } = options;

  let titleSchema = Yup.string();
  if (requireTitleForStep !== null) {
    titleSchema = Yup.string().when("$step", {
      is: requireTitleForStep,
      then: (schema) => schema.required(t(lang, "Job title is required.")),
      otherwise: (schema) => schema.notRequired(),
    });
  }

  return Yup.object().shape({
    fullName: buildFullNameSchema(t, lang),
    location: buildLocationSchema(t, lang, "location"),
    city: buildLocationSchema(t, lang, "city"),
    phone: buildPhoneSchema(t, lang),
    citizenId: buildCitizenIdSchema(t, lang),
    title: titleSchema,
    portfolioUrl: buildUrlSchema(t, lang),
    salary: buildSalarySchema(t, lang),
  });
}
