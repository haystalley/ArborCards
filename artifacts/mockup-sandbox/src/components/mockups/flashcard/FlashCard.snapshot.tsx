// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  APPROVED DESIGN SNAPSHOT — DO NOT EDIT                                 ║
// ║  Captured: 2026-04-21  (Task #15 approved, Task #18)                    ║
// ║  This file is a read-only reference of the approved flashcard layout.   ║
// ║  Front: parchment card, family/name/tags, green accent stripe.          ║
// ║  Back: 57% dark photo zone (leaf×2, bark, form) + range map + tag pills ║
// ║        43% parchment info panel (metadata strip + 4 primary rows +      ║
// ║        twig/flower/fruit 3-col grid + footer). No scrolling.            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { useState } from "react";

// ── Species data (Acer rubrum — design reference card) ────────────────────────
const SPECIES = [
  {
    id: "Acer_rubrum",
    commonName: "Red Maple",
    scientificName: "Acer rubrum",
    family: "Aceraceae",
    tags: ["Tree", "Deciduous", "Native"],
    usda: {
      symbol: "ACRU",
      group: "Dicot",
      duration: "Perennial",
      growthHabit: "Tree",
      nativeStatus: "CAN (N) | L48 (N)",
    },
    images: [
      { descriptor: "Leaf", url: "/__mockup/images/acer_rubrum/leaf.jpg" },
      { descriptor: "Bark", url: "/__mockup/images/acer_rubrum/bark.jpg" },
      { descriptor: "Form", url: "/__mockup/images/acer_rubrum/form.jpg" },
    ],
    mapUrl: "/__mockup/images/acer_rubrum/map.jpg",
    sections: {
      leaf:      "Opposite, simple, 3 to 5 palmate lobes with serrated margin, sinuses relatively shallow (but highly variable), 2 to 4 inches long; green above, whitened and sometimes glaucous or hairy beneath.",
      bark:      "On young trees, smooth and light gray; with age becomes darker and breaks up into long, fine scaly plates.",
      form:      "Medium sized tree up to 90 feet. In forest, trunk usually clear for some distance; in the open the trunk is shorter and the crown rounded.",
      twig:      "Reddish and lustrous with small lenticels; buds usually blunt, green or reddish with several loose scales; leaf scars V-shaped, 3 bundle scars; lateral buds slightly stalked.",
      flower:    "Attractive but small, occur in hanging clusters, usually bright red but occasionally yellow; appear in early spring, usually before leaves.",
      fruit:     "Clusters of ½ to ¾ inch samaras with slightly divergent wings on long slender stems; light brown and often reddish; ripen in late spring and early summer.",
      looksLike: "silver maple — Norway maple — mapleleaf viburnum — sugar maple",
    },
  },
];

// ── Tag colour map ────────────────────────────────────────────────────────────
function tagStyle(tag: string): { bg: string; text: string; border: string } {
  const t = tag.toLowerCase();
  if (t === "native")      return { bg: "#2d6a4f", text: "#fff",    border: "#1b4332" };
  if (t === "invasive")    return { bg: "#c1121f", text: "#fff",    border: "#9d0208" };
  if (t.includes("planted") || t.includes("ornamental") || t.includes("introduced"))
                           return { bg: "#e9c46a", text: "#1a1a00", border: "#c9a227" };
  if (t.includes("tree"))  return { bg: "#1b4332", text: "#d4edda", border: "#0d2b20" };
  if (t.includes("shrub")) return { bg: "#7b3f00", text: "#fff",    border: "#5c2e00" };
  if (t.includes("conifer") || t.includes("evergreen"))
                           return { bg: "#1a3a2a", text: "#b7e4c7", border: "#0d2b1e" };
  if (t.includes("deciduous"))
                           return { bg: "#606c38", text: "#fff",    border: "#4a5428" };
  return                          { bg: "#4a4a4a", text: "#fff",    border: "#333"    };
}

// ── DescRow ───────────────────────────────────────────────────────────────────
function DescRow({ label, text, accent }: { label: string; text: string; accent: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{
        fontSize: 9,
        fontFamily: "'Segoe UI', sans-serif",
        fontWeight: 800,
        textTransform: "uppercase" as const,
        letterSpacing: "0.8px",
        color: accent,
        minWidth: 56,
        flexShrink: 0,
        paddingTop: 1,
        borderLeft: `3px solid ${accent}`,
        paddingLeft: 5,
        lineHeight: 1.5,
      }}>
        {label}
      </span>
      <p style={{
        fontSize: 10.5,
        color: "#2a2a22",
        lineHeight: 1.4,
        margin: 0,
        flex: 1,
        fontFamily: "'Segoe UI', sans-serif",
      }}>
        {text}
      </p>
    </div>
  );
}

// ── NavButton ─────────────────────────────────────────────────────────────────
function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(149,213,178,0.2)",
        color: "#95d5b2",
        borderRadius: 40,
        padding: "10px 26px",
        fontSize: 20,
        cursor: "pointer",
        fontFamily: "sans-serif",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
    >
      {label}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function FlashCard() {
  const [index, setIndex]     = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total   = SPECIES.length;
  const species = SPECIES[index];

  function navigate(dir: 1 | -1) {
    setFlipped(false);
    setTimeout(() => setIndex(i => (i + dir + total) % total), 200);
  }

  return (
    // height: 100vh + overflow: hidden keeps everything inside the iframe
    <div style={{
      height: "100vh",
      overflow: "hidden",
      background: "linear-gradient(160deg, #0d2b1e 0%, #1b4332 45%, #0a1f15 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 16px",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      userSelect: "none",
      boxSizing: "border-box",
    }}>

      {/* Header */}
      <div style={{
        color: "#95d5b2", fontSize: 11, letterSpacing: "2.5px",
        textTransform: "uppercase", marginBottom: 6, opacity: 0.8,
        fontFamily: "'Segoe UI', sans-serif", flexShrink: 0,
      }}>
        Dendrology Flashcard
      </div>

      {/* Counter */}
      <div style={{
        color: "#d8f3dc", fontSize: 13, marginBottom: 12, opacity: 0.7,
        fontFamily: "'Segoe UI', sans-serif", flexShrink: 0,
      }}>
        {index + 1} / {total}
      </div>

      {/* ── 3D Card — fills remaining vertical space ── */}
      <div style={{
        perspective: "1400px",
        width: 820,
        maxWidth: "100%",
        flex: 1,
        minHeight: 0,
      }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            cursor: "pointer",
          }}
          onClick={() => setFlipped(f => !f)}
        >

          {/* ════════ FRONT ════════ */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "#f8f5ef",
            borderRadius: 18,
            boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Accent stripe */}
            <div style={{ height: 7, flexShrink: 0, background: "linear-gradient(90deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)" }} />

            {/* Front body */}
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "36px 60px", textAlign: "center", position: "relative",
            }}>
              <div style={{ fontSize: 72, opacity: 0.06, position: "absolute", pointerEvents: "none" }}>🌿</div>

              <p style={{ color: "#9b8c75", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Segoe UI', sans-serif", marginBottom: 16 }}>
                {species.family}
              </p>
              <h1 style={{ fontSize: 46, fontWeight: "bold", color: "#1b4332", lineHeight: 1.1, marginBottom: 14, textShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {species.commonName}
              </h1>
              <p style={{ fontSize: 21, fontStyle: "italic", color: "#6b6658", lineHeight: 1.3 }}>
                {species.scientificName}
              </p>

              <div style={{ display: "flex", gap: 8, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
                {species.tags.map(tag => {
                  const s = tagStyle(tag);
                  return (
                    <span key={tag} style={{
                      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
                      padding: "5px 14px", borderRadius: 20, fontSize: 12,
                      fontFamily: "'Segoe UI', sans-serif", fontWeight: 700,
                      letterSpacing: "0.6px", textTransform: "uppercase",
                    }}>{tag}</span>
                  );
                })}
              </div>
            </div>

            {/* Hint bar */}
            <div style={{
              padding: "12px 24px", flexShrink: 0,
              background: "#f0ede5", borderTop: "1px solid #e0dbd0",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, color: "#9b8c75", fontSize: 13,
              fontFamily: "'Segoe UI', sans-serif",
            }}>
              <span style={{ fontSize: 15 }}>👆</span>
              Click card to reveal identification details
            </div>
          </div>

          {/* ════════ BACK ════════ */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "#111",
            borderRadius: 18,
            boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>

            {/* ── Photo zone: top 57% ── */}
            <div style={{
              flex: "0 0 57%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 2,
              position: "relative",
              background: "#0a0a0a",
              overflow: "hidden",
            }}>
              {/* Left col — leaf, spans both rows */}
              <div style={{ gridRow: "1 / 3", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={species.images[0].url} alt="leaf" draggable={false}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                </div>
                <PhotoLabel text="Leaf" />
              </div>

              {/* Top right — bark */}
              <div style={{ position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={species.images[1].url} alt="bark" draggable={false}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                </div>
                <PhotoLabel text="Bark" />
              </div>

              {/* Bottom right — form */}
              <div style={{ position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={species.images[2].url} alt="form" draggable={false}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                </div>
                <PhotoLabel text="Form" />
              </div>

              {/* Range map — top left overlay */}
              {species.mapUrl && (
                <div style={{
                  position: "absolute", top: 9, left: 9, zIndex: 10,
                  width: 108, borderRadius: 7, overflow: "hidden",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.65)",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  background: "#c8e6f5",
                }}>
                  <img src={species.mapUrl} alt="Native range map"
                    style={{ width: "100%", display: "block" }} draggable={false} />
                  <div style={{
                    background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 9,
                    textAlign: "center", padding: "3px 0",
                    fontFamily: "'Segoe UI', sans-serif", fontWeight: 700,
                    letterSpacing: "0.8px", textTransform: "uppercase",
                  }}>Native Range</div>
                </div>
              )}

              {/* Tags — top right overlay */}
              <div style={{
                position: "absolute", top: 9, right: 9, zIndex: 10,
                display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end",
              }}>
                {species.tags.map(tag => {
                  const s = tagStyle(tag);
                  return (
                    <span key={tag} style={{
                      background: s.bg, color: s.text,
                      padding: "3px 9px", borderRadius: 11, fontSize: 10,
                      fontFamily: "'Segoe UI', sans-serif", fontWeight: 800,
                      letterSpacing: "0.4px", textTransform: "uppercase",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}>{tag}</span>
                  );
                })}
              </div>
            </div>

            {/* ── Info panel: bottom 43% ── */}
            <div style={{
              flex: 1,
              background: "#f8f5ef",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}>
              {/* Metadata strip */}
              <div style={{
                display: "flex", flexShrink: 0,
                borderBottom: "1px solid #d6d1c5",
                background: "#eeebe2",
              }}>
                {([
                  ["Family",   species.family],
                  ["Group",    species.usda.group],
                  ["Habit",    species.usda.growthHabit],
                  ["Duration", species.usda.duration],
                  ["Symbol",   species.usda.symbol],
                  ["Range",    species.usda.nativeStatus],
                ] as [string, string][]).map(([label, value], i, arr) => (
                  <div key={label} style={{
                    flex: label === "Range" ? 2 : 1,
                    padding: "5px 5px",
                    borderRight: i < arr.length - 1 ? "1px solid #d6d1c5" : "none",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 7.5, fontFamily: "'Segoe UI', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "#9b8c75", marginBottom: 1 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#1a1a14", fontFamily: "'Segoe UI', sans-serif", fontWeight: 500, lineHeight: 1.2 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Description rows — no scroll, all content visible ── */}
              <div style={{
                flex: 1,
                padding: "7px 13px 5px",
                overflow: "hidden",
                display: "flex", flexDirection: "column", gap: 5,
              }}>
                {/* Primary: Leaf, Bark, Form, Looks Like */}
                <DescRow label="Leaf"       text={species.sections.leaf}      accent="#2d6a4f" />
                <DescRow label="Bark"       text={species.sections.bark}      accent="#2d6a4f" />
                <DescRow label="Form"       text={species.sections.form}      accent="#2d6a4f" />
                <DescRow label="Looks Like" text={species.sections.looksLike} accent="#c1121f" />

                {/* Secondary: Twig / Flower / Fruit — compact 3-col grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0 10px",
                  paddingTop: 5,
                  borderTop: "1px dashed #d6d1c5",
                  flex: 1,
                  minHeight: 0,
                }}>
                  {(["twig", "flower", "fruit"] as const).map(key => (
                    <div key={key} style={{ overflow: "hidden" }}>
                      <div style={{
                        fontSize: 8, fontFamily: "'Segoe UI', sans-serif",
                        fontWeight: 800, textTransform: "uppercase",
                        letterSpacing: "0.7px", color: "#9b8c75", marginBottom: 2,
                      }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </div>
                      <p style={{
                        fontSize: 10, color: "#4a4a3a", lineHeight: 1.35,
                        margin: 0, fontFamily: "'Segoe UI', sans-serif",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                      } as React.CSSProperties}>
                        {species.sections[key]}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  paddingTop: 4, borderTop: "1px solid #e4e0d6", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 10.5, fontStyle: "italic", color: "#9b8c75" }}>
                    {species.scientificName}
                  </span>
                  <span style={{ fontSize: 9.5, color: "#bbb", fontFamily: "'Segoe UI', sans-serif" }}>
                    click to flip ↻
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div style={{
        display: "flex", gap: 20, marginTop: 16, alignItems: "center", flexShrink: 0,
      }}>
        <NavButton label="←" onClick={() => navigate(-1)} />
        <div style={{
          color: "#95d5b2", fontSize: 12, opacity: 0.7,
          fontFamily: "'Segoe UI', sans-serif", width: 70, textAlign: "center",
          textTransform: "uppercase", letterSpacing: "1px",
        }}>
          {flipped ? "back" : "front"}
        </div>
        <NavButton label="→" onClick={() => navigate(1)} />
      </div>

    </div>
  );
}

// ── Photo label chip ──────────────────────────────────────────────────────────
function PhotoLabel({ text }: { text: string }) {
  return (
    <div style={{
      position: "absolute", bottom: 5, left: 7, zIndex: 2,
      background: "rgba(0,0,0,0.58)", backdropFilter: "blur(3px)",
      color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10,
      fontFamily: "'Segoe UI', sans-serif", fontWeight: 700,
      letterSpacing: "0.8px", textTransform: "uppercase",
    }}>
      {text}
    </div>
  );
}
