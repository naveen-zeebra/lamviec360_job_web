"use client";
import { useRef } from "react";

export default function OtpInput({ length = 6, value = "", onChange, autoFocus = true }) {
  const refs = useRef([]);
  const cleanVal = String(value || "").replace(/\D/g, "").slice(0, length);
  const digits = Array.from({ length }, (_, i) => cleanVal[i] || "");

  const handleDigitChange = (i, incoming) => {
    const numeric = incoming.replace(/\D/g, "");
    if (!numeric) {
      // User erased character
      const nextArr = [...digits];
      nextArr[i] = "";
      onChange?.(nextArr.join("").trimEnd());
      return;
    }

    if (numeric.length > 1) {
      // Pasted or multi-character input
      const combined = (cleanVal.slice(0, i) + numeric + cleanVal.slice(i + 1)).slice(0, length);
      onChange?.(combined);
      const nextFocus = Math.min(i + numeric.length, length - 1);
      refs.current[nextFocus]?.focus();
      return;
    }

    // Single numeric character
    const nextArr = [...digits];
    nextArr[i] = numeric;
    const nextString = nextArr.join("");
    onChange?.(nextString);
    if (i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        e.preventDefault();
        const nextArr = [...digits];
        nextArr[i - 1] = "";
        onChange?.(nextArr.join("").trimEnd());
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange?.(text);
    const targetIdx = Math.min(text.length, length - 1);
    refs.current[targetIdx]?.focus();
  };

  return (
    <div className="flex justify-center gap-2.5" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="h-[52px] w-11 rounded-md border-[1.5px] border-line text-center font-mono text-lg font-bold focus:border-line-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100 max-sm:h-[46px] max-sm:w-[38px] transition-colors"
          inputMode="numeric"
          type="text"
          value={d}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleDigitChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
        />
      ))}
    </div>
  );
}
