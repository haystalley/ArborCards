import { useState } from "react";

// ── Species data (Acer rubrum — nail the UI here, then expand) ────────────────
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
      { descriptor: "Leaf",   url: "/__mockup/images/acer_rubrum/leaf.jpg" },
      { descriptor: "Bark",   url: "/__mockup/images/acer_rubrum/bark.jpg" },
      { descriptor: "Form",   url: "/__mockup/images/acer_rubrum/form.jpg" },
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
  if (t === "native")     return { bg: "#2d6a4f", text: "#fff",     border: "#1b4332" };
  if (t === "invasive")   return { bg: "#c1121f", text: "#fff",     border: "#9d0208" };
  if (t.includes("planted") || t.includes("ornamental") || t.includes("introduced"))
                          return { bg: "#e9c46a", text: "#1a1a00",  border: "#c9a227" };
  if (t.includes("tree")) return { bg: "#1b4332", text: "#d4edda",  border: "#0d2b20" };
  if (t.includes("shrub"))return { bg: "#7b3f00", text: "#fff",     border: "#5c2e00" };
  if (t.includes("conifer") || t.includes("evergreen"))
                          return { bg: "#1a3a2a", text: "#b7e4c7",  border: "#0d2b1e" };
  if (t.includes("deciduous"))
                          return { bg: "#606c38", text: "#fff",     border: "#4a5428" };
  return                         { bg: "#4a4a4a", text: "#fff",     border: "#333"    };
}

// ── DescRow ───────────────────────────────────────────────────────────────────
function DescRow({ label, text, accent }: { label: string; text: string; accent: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{
        fontSize: 9.5,
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
        fontSize: 11,
        color: "#2a2a22",
        lineHeight: 1.45,
        margin: 0,
        flex: 1,
        fontFamily: "'Segoe UI', sans-serif",
      }}>
        {text}
      </p>
    </div>
  );
}

// ── PhotoCell ─────────────────────────────────────────────────────────────────
function PhotoCell({ url, label }: { url: string; label: string }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
      {/* Absolutely-positioned inner so the img percentage resolves against a known size */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={url}
          alt={label}
          draggable={false}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
      <div style={{
        position: "absolute", bottom: 5, left: 7,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)",
        color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10,
        fontFamily: "'Segoe UI', sans-serif", fontWeight: 700,
        letterSpacing: "0.8px", textTransform: "uppercase",
      }}>
        {label}
      </div>
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
        padding: "8px 24px",
        fontSize: 18,
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
  const [index, setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total   = SPECIES.length;
  const species = SPECIES[index];

  function navigate(dir: 1 | -1) {
    setFlipped(false);
    setTimeout(() => setIndex(i => (i + dir + total) % total), 200);
  }

  return (
    // Outer wrapper: exactly the iframe viewport — no scroll
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
        color: "#95d5b2", fontSize: 10, letterSpacing: "2.5px",
        textTransform: "uppercase", marginBottom: 4, opacity: 0.75,
        fontFamily: "'Segoe UI', sans-serif", flexShrink: 0,
      }}>
        Dendrology Flashcard
      </div>

      {/* Counter */}
      <div style={{
        color: "#d8f3dc", fontSize: 12, marginBottom: 10, opacity: 0.65,
        fontFamily: "'Segoe UI', sans-serif", flexShrink: 0,
      }}>
        {index + 1} / {total}
      </div>

      {/* ── 3D Card (flex: 1 → fills all remaining height) ── */}
      <div style={{
        perspective: "1400px",
        width: 820,
        maxWidth: "100%",
        flex: 1,
        minHeight: 0,
        flexShrink: 1,
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
            borderRadius: 16,
            boxShadow: "0 24px 70px rgba(0,0,0,0.5), 0 6px 20px rgba(0,0,0,0.25)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Green stripe */}
            <div style={{ height: 7, flexShrink: 0, background: "linear-gradient(90deg, #1b4332, #2d6a4f, #40916c)" }} />

            {/* Content */}
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "28px 60px", textAlign: "center", position: "relative",
            }}>
              <div style={{ fontSize: 64, opacity: 0.05, position: "absolute", pointerEvents: "none" }}>🌿</div>

              <p style={{ color: "#9b8c75", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Segoe UI', sans-serif", marginBottom: 14 }}>
                {species.family}
              </p>
              <h1 style={{ fontSize: 44, fontWeight: "bold", color: "#1b4332", lineHeight: 1.1, marginBottom: 12 }}>
                {species.commonName}
              </h1>
              <p style={{ fontSize: 20, fontStyle: "italic", color: "#6b6658", lineHeight: 1.3 }}>
                {species.scientificName}
              </p>

              <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
                {species.tags.map(tag => {
                  const s = tagStyle(tag);
                  return (
                    <span key={tag} style={{
                      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
                      padding: "4px 13px", borderRadius: 20, fontSize: 11,
                      fontFamily: "'Segoe UI', sans-serif", fontWeight: 700,
                      letterSpacing: "0.5px", textTransform: "uppercase",
                    }}>{tag}</span>
                  );
                })}
              </div>
            </div>

            {/* Hint bar */}
            <div style={{
              padding: "10px 24px", flexShrink: 0,
              background: "#f0ede5", borderTop: "1px solid #e0dbd0",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, color: "#9b8c75", fontSize: 12,
              fontFamily: "'Segoe UI', sans-serif",
            }}>
              <span style={{ fontSize: 14 }}>👆</span>
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
            borderRadius: 16,
            boxShadow: "0 24px 70px rgba(0,0,0,0.5), 0 6px 20px rgba(0,0,0,0.25)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>

            {/* ── Photo zone: top 64% ── */}
            <div style={{
              flex: "0 0 64%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 2,
              position: "relative",
              background: "#0a0a0a",
            }}>
              {/* Left col — leaf, spans both rows */}
              <div style={{ gridRow: "1 / 3", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={species.images[0].url} alt="leaf" draggable={false}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                </div>
                <div style={{ position: "absolute", bottom: 5, left: 7, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontFamily: "'Segoe UI', sans-serif", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>Leaf</div>
              </div>

              {/* Top right — bark */}
              <div style={{ position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={species.images[1].url} alt="bark" draggable={false}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                </div>
                <div style={{ position: "absolute", bottom: 5, left: 7, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontFamily: "'Segoe UI', sans-serif", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>Bark</div>
              </div>

              {/* Bottom right — form */}
              <div style={{ position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={species.images[2].url} alt="form" draggable={false}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                </div>
                <div style={{ position: "absolute", bottom: 5, left: 7, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontFamily: "'Segoe UI', sans-serif", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>Form</div>
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
                  }}>
                    Native Range
                  </div>
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

            {/* ── Info panel: bottom 36% ── */}
            <div style={{
              flex: 1,
              background: "#f8f5ef",
              display: "flex", flexDirection: "column",
              overflow: "hidden", minHeight: 0,
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
                    <div style={{ fontSize: 8, fontFamily: "'Segoe UI', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "#9b8c75", marginBottom: 1 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#1a1a14", fontFamily: "'Segoe UI', sans-serif", fontWeight: 500, lineHeight: 1.2 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Description — scrollable area */}
              <div style={{
                flex: 1, minHeight: 0,
                padding: "7px 13px 6px",
                overflowY: "auto",
                display: "flex", flexDirection: "column", gap: 5,
              }}>
                {/* Primary: Leaf, Bark, Form, Looks Like */}
                <DescRow label="Leaf"       text={species.sections.leaf}      accent="#2d6a4f" />
                <DescRow label="Bark"       text={species.sections.bark}      accent="#2d6a4f" />
                <DescRow label="Form"       text={species.sections.form}      accent="#2d6a4f" />
                <DescRow label="Looks Like" text={species.sections.looksLike} accent="#c1121f" />

                {/* Secondary: Twig / Flower / Fruit — 3-col compact grid */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "4px 10px", marginTop: 3,
                  paddingTop: 5, borderTop: "1px dashed #d6d1c5",
                }}>
                  {(["twig", "flower", "fruit"] as const).map(key => (
                    <div key={key}>
                      <div style={{ fontSize: 8.5, fontFamily: "'Segoe UI', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.7px", color: "#9b8c75", marginBottom: 2 }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </div>
                      <p style={{ fontSize: 10.5, color: "#4a4a3a", lineHeight: 1.4, margin: 0, fontFamily: "'Segoe UI', sans-serif" }}>
                        {species.sections[key]}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer: sci name + flip hint */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  paddingTop: 4, marginTop: "auto", borderTop: "1px solid #e4e0d6",
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
        display: "flex", gap: 18, marginTop: 10, alignItems: "center", flexShrink: 0,
      }}>
        <NavButton label="←" onClick={() => navigate(-1)} />
        <div style={{
          color: "#95d5b2", fontSize: 11, opacity: 0.65,
          fontFamily: "'Segoe UI', sans-serif", width: 60, textAlign: "center",
          textTransform: "uppercase", letterSpacing: "1px",
        }}>
          {flipped ? "back" : "front"}
        </div>
        <NavButton label="→" onClick={() => navigate(1)} />
      </div>

    </div>
  );
}
