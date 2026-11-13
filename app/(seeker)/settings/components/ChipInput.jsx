"use client";
import { useState } from "react";
import { Button, Input } from "../../../../components/ds";

export default function ChipInput({
  label,
  values = [],
  onAdd,
  onRemove,
  placeholder,
  allowSpecial = true,
  error,
  list,
}) {
  const [v, setV] = useState("");
  const [chipErr, setChipErr] = useState("");

  const handleAdd = () => {
    let clean = v.trim();
    if (!clean) return;
    if (!allowSpecial) {
      if (/[^a-zA-Z0-9\s\u00C0-\u024F\u1EA0-\u1EF9\-\.]/.test(clean)) {
        setChipErr("Special characters are not allowed.");
        return;
      }
    }
    setChipErr("");
    onAdd(clean);
    setV("");
  };

  return (
    <div>
      <label
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          value={v}
          list={list}
          onChange={(e) => {
            let val = e.target.value;
            if (!allowSpecial) {
              val = val.replace(/[^a-zA-Z0-9\s\u00C0-\u024F\u1EA0-\u1EF9\-\.]/g, "");
            }
            setV(val);
            setChipErr("");
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          error={chipErr || error}
        />
        <Button type="button" variant="secondary" onClick={handleAdd}>
          Add
        </Button>
      </div>
      <div className="lv-chip-list">
        {(values || []).map((val, i) => (
          <span key={i} className="lv-chip">
            {val}
            <button type="button" onClick={() => onRemove(val)}>
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

