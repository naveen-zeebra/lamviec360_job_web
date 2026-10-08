"use client";
import React, { useState, useRef, useEffect } from "react";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";

/**
 * Validates Vietnamese Citizenship Identification formats:
 * - Old CMND: exactly 9 digits (e.g. 123456789)
 * - Old CCCD & New Căn cước / Citizen ID: exactly 12 digits (e.g. 001234567890)
 */
export function validateVietnamCitizenId(val, lang = "EN") {
  if (!val || !val.trim()) return { isValid: true, type: null, error: null };
  const digits = val.replace(/\D/g, "");
  if (digits.length !== val.trim().length) {
    return {
      isValid: false,
      type: null,
      error: t(lang, "Only numeric digits are allowed in Citizenship ID."),
    };
  }
  if (digits.length === 9) {
    return {
      isValid: true,
      type: "CMND_9",
      label: t(lang, "Valid 9-digit Old CMND"),
      error: null,
    };
  }
  if (digits.length === 12) {
    return {
      isValid: true,
      type: "CCCD_12",
      label: t(lang, "Valid 12-digit CCCD / Citizen ID"),
      error: null,
    };
  }
  return {
    isValid: false,
    type: null,
    error: t(
      lang,
      `Citizenship ID must be either 9 digits (Old CMND) or 12 digits (CCCD / New Citizen ID). Currently ${digits.length} digits.`
    ),
  };
}

export default function CitizenshipIdInput({
  value = "",
  onChange,
  onBlur,
  error,
  lang = "EN",
  label,
  id = "citizenId",
  name = "citizenId",
  required = false,
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);

  // Close tooltip on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowTooltip(false);
      }
    }
    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTooltip]);

  const cleanVal = (value || "").replace(/\D/g, "").slice(0, 12);
  const len = cleanVal.length;
  const is9 = len === 9;
  const is12 = len === 12;
  const isValidFormat = is9 || is12;

  const handleInputChange = (e) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/\D/g, "").slice(0, 12);
    if (onChange) onChange(sanitized);
  };

  const handleApplySample = (sampleVal) => {
    if (onChange) onChange(sampleVal);
    setShowTooltip(false);
  };

  return (
    <div className="flex flex-col gap-1.5 font-body" ref={containerRef}>
      {/* Label with info-icon tooltip popup */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 relative">
          <label
            htmlFor={id}
            className="text-xs sm:text-sm font-semibold text-ink select-none flex items-center gap-1.5"
          >
            <Icon name="credit-card" size={15} className="text-brand" />
            <span>{label || t(lang, "Citizenship ID / Căn cước công dân")}</span>
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>

          {/* i-icon click trigger */}
          <div className="relative inline-flex items-center">
            <button
              type="button"
              onClick={() => setShowTooltip((prev) => !prev)}
              aria-label={t(lang, "Vietnam Citizen ID Formats")}
              title={t(lang, "Click for valid ID formats")}
              className={`w-5 h-5 rounded-full inline-flex items-center justify-center transition-all cursor-pointer ${
                showTooltip
                  ? "bg-brand text-white shadow-xs scale-105"
                  : "text-muted hover:text-brand hover:bg-brand-subtle"
              }`}
            >
              <Icon name="info" size={13} />
            </button>

            {/* Tooltip Variant Popup */}
            {showTooltip && (
              <div
                className="absolute left-0 sm:left-2 top-full mt-2 z-50 w-72 sm:w-80 p-3.5 rounded-xl border border-line bg-card shadow-xl text-xs font-body animate-fadeIn text-ink"
                style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.12))" }}
              >
                {/* Pointer triangle */}
                <div className="absolute -top-1.5 left-2.5 w-3 h-3 bg-card border-t border-l border-line rotate-45" />

                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-brand">
                    <Icon name="shield-check" size={14} />
                    {t(lang, "Vietnam Citizen ID Formats")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTooltip(false)}
                    className="p-1 text-muted hover:text-ink rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>

                {/* Simple 2-option guide */}
                <div className="space-y-2">
                  {/* Old CMND */}
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        {t(lang, "Old CMND")}: <strong>9 {t(lang, "digits")}</strong>
                      </p>
                      <p className="font-mono text-[11px] text-muted mt-0.5">
                        {t(lang, "Example")}: 123456789
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplySample("123456789")}
                      className="px-2 py-1 text-[10.5px] font-semibold rounded bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50 cursor-pointer shadow-xs"
                    >
                      {t(lang, "Use 9-digit")}
                    </button>
                  </div>

                  {/* CCCD / New Citizen ID */}
                  <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-300 text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                        {t(lang, "CCCD / New Căn cước")}: <strong>12 {t(lang, "digits")}</strong>
                      </p>
                      <p className="font-mono text-[11px] text-muted mt-0.5">
                        {t(lang, "Example")}: 001234567890
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplySample("001234567890")}
                      className="px-2 py-1 text-[10.5px] font-semibold rounded bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 cursor-pointer shadow-xs"
                    >
                      {t(lang, "Use 12-digit")}
                    </button>
                  </div>
                </div>

                <p className="text-[10.5px] text-muted mt-2 leading-relaxed">
                  {t(lang, "Only numbers are accepted. Format is validated automatically as you type.")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live digit counter */}
        <span className="text-[11px] font-mono text-muted">
          {len}/12
        </span>
      </div>

      {/* Input container */}
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={12}
          value={cleanVal}
          onChange={handleInputChange}
          onBlur={onBlur}
          placeholder={t(lang, "9 or 12 digits (e.g. 123456789 or 001234567890)")}
          className={`w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm text-ink transition-colors outline-none tracking-wider font-mono ${
            error
              ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger"
              : isValidFormat
              ? "border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              : "border-line focus:border-brand focus:ring-1 focus:ring-brand"
          }`}
        />

        {/* Clear and Success Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {cleanVal && (
            <button
              type="button"
              onClick={() => onChange && onChange("")}
              className="text-muted hover:text-ink p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t(lang, "Clear")}
            >
              <Icon name="x" size={13} />
            </button>
          )}

          {isValidFormat && (
            <span
              className="text-emerald-600 dark:text-emerald-400 flex items-center"
              title={is9 ? t(lang, "Valid 9-digit Old CMND") : t(lang, "Valid 12-digit CCCD / Citizen ID")}
            >
              <Icon name="check-circle" size={17} />
            </span>
          )}
        </div>
      </div>

      {/* Subtle Real-time Status / Feedback */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {cleanVal.length > 0 ? (
          is9 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Icon name="check" size={13} />
              {t(lang, "Valid 9-digit Old CMND")}
            </span>
          ) : is12 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Icon name="check" size={13} />
              {t(lang, "Valid 12-digit CCCD / Citizen ID")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Icon name="alert-triangle" size={12} />
              {len < 9
                ? `${len}/9 ${t(lang, "digits")} (${9 - len} more)`
                : `${len}/12 ${t(lang, "digits")} (${12 - len} more)`}
            </span>
          )
        ) : (
          <span className="text-[11px] text-muted">
            {t(lang, "Vietnam accepts 9 digits (CMND) or 12 digits (CCCD).")}
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-danger font-medium flex items-center gap-1 mt-0.5">
          <Icon name="alert-circle" size={13} />
          {error}
        </p>
      )}
    </div>
  );
}
