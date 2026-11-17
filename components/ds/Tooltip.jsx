"use client";

import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

/**
 * Reusable Tooltip component for hover pointer and focus events.
 * Supports "top", "bottom", "left", and "right" positioning with directional arrow.
 */
export default function Tooltip({
  children,
  content,
  title,
  position = "top",
  variant = "dark",
  delay = 120,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!content) return children;

  // Position classes & Arrow styles
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent",
  };

  const cardArrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-card border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-card border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-card border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-card border-y-transparent border-l-transparent",
  };

  const isCard = variant === "card";

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none transition-all duration-150 ease-out animate-in fade-in zoom-in-95 ${
            positionClasses[position] || positionClasses.top
          }`}
          style={{ width: "max-content", maxWidth: "280px" }}
        >
          <div
            className={`rounded-lg text-xs leading-relaxed shadow-lg ${
              isCard
                ? "bg-card text-ink border border-line p-2.5 shadow-xl font-body"
                : "bg-slate-900 text-slate-100 px-3 py-1.5 font-body"
            }`}
          >
            {title && (
              <div
                className={`font-semibold mb-1 ${
                  isCard ? "text-ink border-b border-line pb-1" : "text-slate-200"
                }`}
              >
                {title}
              </div>
            )}
            <div className={isCard ? "text-muted" : "text-slate-200"}>{content}</div>
          </div>

          {/* Directional Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${
              isCard
                ? cardArrowClasses[position] || cardArrowClasses.top
                : arrowClasses[position] || arrowClasses.top
            }`}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Dedicated Icon-based Tip component for mouseover pointer.
 * Renders an inline info/question icon with smooth hover popup balloon.
 */
export function InfoTip({
  content,
  title,
  position = "top",
  variant = "dark",
  size = 13,
  icon = "info",
  className = "",
  ariaLabel,
}) {
  return (
    <Tooltip
      content={content}
      title={title}
      position={position}
      variant={variant}
      className={className}
    >
      <button
        type="button"
        tabIndex={0}
        aria-label={ariaLabel || (typeof content === "string" ? content : "More info")}
        className="inline-flex items-center justify-center text-muted hover:text-brand p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-brand"
        onClick={(e) => e.preventDefault()}
      >
        <Icon name={icon} size={size} />
      </button>
    </Tooltip>
  );
}
