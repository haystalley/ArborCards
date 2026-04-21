import { useState } from "react";
import type { VisibilitySettings } from "@/data/types";

interface Props {
  vis: VisibilitySettings;
  onChange: (v: VisibilitySettings) => void;
}

interface CheckboxItem {
  key: string;
  label: string;
}

const FRONT_ITEMS: CheckboxItem[] = [
  { key: "family",         label: "Family" },
  { key: "commonName",     label: "Common Name" },
  { key: "scientificName", label: "Scientific Name" },
  { key: "tags",           label: "Tags" },
];

const BACK_ITEMS: CheckboxItem[] = [
  { key: "leafImage",  label: "Leaf image" },
  { key: "barkImage",  label: "Bark image" },
  { key: "formImage",  label: "Form image" },
  { key: "rangeMap",   label: "Range map" },
  { key: "backTags",   label: "Tag pills" },
  { key: "metadata",   label: "Metadata strip" },
  { key: "leafText",   label: "Leaf text" },
  { key: "barkText",   label: "Bark text" },
  { key: "formText",   label: "Form text" },
  { key: "looksLike",  label: "Looks Like" },
  { key: "twigText",   label: "Twig text" },
  { key: "flowerText", label: "Flower text" },
  { key: "fruitText",  label: "Fruit text" },
];

export function SettingsDrawer({ vis, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function toggleFront(key: string) {
    onChange({
      ...vis,
      front: { ...vis.front, [key]: !vis.front[key as keyof typeof vis.front] },
    });
  }

  function toggleBack(key: string) {
    onChange({
      ...vis,
      back: { ...vis.back, [key]: !vis.back[key as keyof typeof vis.back] },
    });
  }

  function Check({
    checked, label, onToggle,
  }: { checked: boolean; label: string; onToggle: () => void }) {
    return (
      <label style={{
        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
        fontSize: 12, color: "#d8f3dc", fontFamily: "'Segoe UI', sans-serif",
        padding: "4px 0", userSelect: "none",
      }}>
        <div
          onClick={onToggle}
          style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
            border: `2px solid ${checked ? "#40916c" : "rgba(255,255,255,0.25)"}`,
            background: checked ? "#40916c" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span onClick={onToggle}>{label}</span>
      </label>
    );
  }

  return (
    <>
      {/* Gear trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Card settings"
        style={{
          background: open ? "rgba(64,145,108,0.25)" : "rgba(255,255,255,0.08)",
          border: "1px solid rgba(149,213,178,0.2)",
          color: "#95d5b2",
          borderRadius: 10,
          padding: "8px 10px",
          fontSize: 18,
          cursor: "pointer",
          lineHeight: 1,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
      >
        ⚙
      </button>

      {/* Drawer overlay */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1001,
        width: 300,
        background: "linear-gradient(180deg, #0d2b1e 0%, #1b4332 100%)",
        borderLeft: "1px solid rgba(149,213,178,0.15)",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
        padding: "20px 18px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#95d5b2", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Segoe UI', sans-serif", opacity: 0.8, marginBottom: 3 }}>
              Card Settings
            </div>
            <div style={{ color: "rgba(216,243,220,0.5)", fontSize: 10, fontFamily: "'Segoe UI', sans-serif" }}>
              Choose what to show on each side
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "none", border: "none", color: "#95d5b2",
              fontSize: 20, cursor: "pointer", padding: "4px 8px", lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Two-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
          {/* Front column */}
          <div>
            <div style={{
              color: "#40916c", fontSize: 10, fontFamily: "'Segoe UI', sans-serif",
              fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase",
              marginBottom: 10, paddingBottom: 6,
              borderBottom: "1px solid rgba(64,145,108,0.3)",
            }}>
              Front
            </div>
            {FRONT_ITEMS.map(({ key, label }) => (
              <Check
                key={key}
                checked={vis.front[key as keyof typeof vis.front]}
                label={label}
                onToggle={() => toggleFront(key)}
              />
            ))}
          </div>

          {/* Back column */}
          <div>
            <div style={{
              color: "#40916c", fontSize: 10, fontFamily: "'Segoe UI', sans-serif",
              fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase",
              marginBottom: 10, paddingBottom: 6,
              borderBottom: "1px solid rgba(64,145,108,0.3)",
            }}>
              Back
            </div>
            {BACK_ITEMS.map(({ key, label }) => (
              <Check
                key={key}
                checked={vis.back[key as keyof typeof vis.back]}
                label={label}
                onToggle={() => toggleBack(key)}
              />
            ))}
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={() => {
            onChange({
              front: { family: true, commonName: true, scientificName: true, tags: true },
              back: Object.fromEntries(BACK_ITEMS.map(({ key }) => [key, true])) as typeof vis.back,
            });
          }}
          style={{
            marginTop: 20, padding: "8px 0", width: "100%",
            background: "rgba(64,145,108,0.15)", border: "1px solid rgba(64,145,108,0.3)",
            color: "#95d5b2", borderRadius: 8, fontSize: 12,
            fontFamily: "'Segoe UI', sans-serif", cursor: "pointer",
          }}
        >
          Reset to defaults
        </button>
      </div>
    </>
  );
}
