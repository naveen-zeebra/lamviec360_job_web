"use client";

export default function Switch({ on, onChange, label }) {
  return (
    <div className="lv-settings-toggle-row">
      <span>{label}</span>
      <button
        type="button"
        className={`lv-switch ${on ? "on" : ""}`}
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
      >
        <span />
      </button>
    </div>
  );
}

