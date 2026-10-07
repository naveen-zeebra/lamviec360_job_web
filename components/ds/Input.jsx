"use client";
import { useState } from "react";

export default function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  icon,
  iconRight,
  onIconRightClick,
  size = "md",
  className = "",
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`flex flex-col gap-1.5 font-body ${className}`}>
      {label && (
        <label className="text-xs sm:text-sm font-semibold text-ink select-none">
          {label}
        </label>
      )}
      <div
        className={[
          "flex items-center gap-2 rounded-md border-[1.5px] bg-card transition-shadow w-full min-w-0 relative",
          size === "sm" ? "px-3 py-1.5 min-h-[38px]" : "px-3.5 py-2 min-h-[44px]",
          error
            ? "border-danger ring-[3px] ring-red-100"
            : focused
            ? "border-line-brand ring-[3px] ring-blue-100"
            : "border-line hover:border-line-strong",
        ].join(" ")}
      >
        {icon && <img src={icon} alt="" className="h-4 w-4 opacity-60 shrink-0" />}
        <input
          type={type}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
            rest.onBlur?.(e);
          }}
          className={[
            "flex-1 w-full min-w-0 border-none bg-transparent font-body text-ink outline-none",
            size === "sm" ? "text-sm py-0.5" : "text-base py-0.5",
          ].join(" ")}
          {...rest}
        />
        {iconRight && (
          <button
            type="button"
            tabIndex={-1}
            className="flex cursor-pointer items-center justify-center p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors shrink-0 focus:outline-none"
            onClick={onIconRightClick}
          >
            {iconRight}
          </button>
        )}
      </div>
      {typeof error === "string" && error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
