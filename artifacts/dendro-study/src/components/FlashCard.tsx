import type { SpeciesData, VisibilitySettings } from "@/data/types";
import { imgUrl } from "@/config";
import { parseDescriptionSections } from "@/utils/parseDescription";

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

// ── DescRow — label always visible; text hidden with visibility when off ──────
function DescRow({
  label, text, accent, show,
}: {
  label: string; text: string; accent: string; show: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{
        fontSize: 10.5, fontFamily: "'Segoe UI', sans-serif", fontWeight: 800,
        textTransform: "uppercase" as const, letterSpacing: "0.8px",
        color: accent, minWidth: 62, flexShrink: 0, paddingTop: 1,
        borderLeft: `3px solid ${accent}`, paddingLeft: 5, lineHeight: 1.5,
      }}>
        {label}
      </span>
      <p style={{
        fontSize: 12, lineHeight: 1.4, margin: 0, flex: 1,
        fontFamily: "'Segoe UI', sans-serif",
        color: show ? "#2a2a22" : "transparent",
        minHeight: "1em",
      }}>
        {text || " "}
      </p>
    </div>
  );
}

// ── PhotoLabel chip ───────────────────────────────────────────────────────────
function PhotoLabel({ text }: { text: string }) {
  return (
    <div style={{
      position: "absolute", bottom: 5, left: 7, zIndex: 2,
      background: "rgba(0,0,0,0.58)", backdropFilter: "blur(3px)",
      color: "#fff", fontSize: 11.5, padding: "3px 9px", borderRadius: 10,
      fontFamily: "'Segoe UI', sans-serif", fontWeight: 700,
      letterSpacing: "0.8px", textTransform: "uppercase",
    }}>
      {text}
    </div>
  );
}

// ── Photo cell — always rendered; image hidden or missing shows placeholder ───
function PhotoCell({
  url, label, show, style,
}: {
  url: string | null; label: string; show: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "#0a0a0a", ...style }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Show image only when url exists and show is true */}
        {url && show && (
          <img src={url} alt={label} draggable={false}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
        )}
        {/* "No image" placeholder only when show is true but no url — preserves labeled space */}
        {!url && show && (
          <span style={{
            fontSize: 10, color: "rgba(255,255,255,0.18)",
            fontFamily: "'Segoe UI', sans-serif", letterSpacing: "0.8px",
            textTransform: "uppercase",
          }}>
            No image
          </span>
        )}
        {/* When show is false: slot stays same size, content is blank (nothing rendered) */}
      </div>
      <PhotoLabel text={label} />
    </div>
  );
}

// ── Main FlashCard component ──────────────────────────────────────────────────
interface Props {
  species: SpeciesData;
  flipped: boolean;
  onFlip: () => void;
  vis: VisibilitySettings;
}

export function FlashCard({ species, flipped, onFlip, vis }: Props) {
  // Resolve images by alt text keyword (e.g. "leaf", "bark", "form")
  const findImg = (key: string) =>
    imgUrl(species.images.find((i) => i.alt.toLowerCase().includes(key.toLowerCase()))?.file);

  const leafImg   = findImg("leaf");
  const barkImg   = findImg("bark");
  const formImg   = findImg("form");
  const twigImg   = findImg("twig");
  const flowerImg = findImg("flower");
  const fruitImg  = findImg("fruit");

  // Resolve text sections — parse from description string if sections not pre-populated
  const sec = species.sections ?? parseDescriptionSections(species.description ?? "");
  const leafText  = sec.leaf  ?? species.description ?? "";
  const barkText  = sec.bark  ?? "";
  const formText  = sec.form  ?? "";
  const twigText  = sec.twig  ?? "";
  const flowText  = sec.flower ?? "";
  const fruitText = sec.fruit ?? "";
  const looksText = sec.looksLike ?? "";

  const V = vis;

  return (
    <div
      style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        cursor: "pointer",
      }}
      onClick={onFlip}
    >
      {/* ════════ FRONT ════════ */}
      <div style={{
        position: "absolute", inset: 0,
        backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
        background: "#f8f5ef", borderRadius: 18,
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

          <p style={{
            color: "#9b8c75", fontSize: 13, letterSpacing: "2px",
            textTransform: "uppercase", fontFamily: "'Segoe UI', sans-serif", marginBottom: 16,
            visibility: V.front.family ? "visible" : "hidden",
          }}>
            {species.family}
          </p>
          <h1 style={{
            fontSize: 52, fontWeight: "bold", color: "#1b4332",
            lineHeight: 1.1, marginBottom: 14, textShadow: "0 1px 3px rgba(0,0,0,0.06)",
            visibility: V.front.commonName ? "visible" : "hidden",
          }}>
            {species.commonName}
          </h1>
          <p style={{
            fontSize: 23, fontStyle: "italic", color: "#6b6658", lineHeight: 1.3,
            visibility: V.front.scientificName ? "visible" : "hidden",
          }}>
            {species.scientificName}
          </p>

          <div style={{
            display: "flex", gap: 8, marginTop: 28, flexWrap: "wrap", justifyContent: "center",
            visibility: V.front.tags ? "visible" : "hidden",
          }}>
            {species.tags.map((tag) => {
              const s = tagStyle(tag);
              return (
                <span key={tag} style={{
                  background: s.bg, color: s.text, border: `1px solid ${s.border}`,
                  padding: "6px 16px", borderRadius: 20, fontSize: 13,
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
          gap: 8, color: "#9b8c75", fontSize: 13, fontFamily: "'Segoe UI', sans-serif",
        }}>
          <span style={{ fontSize: 15 }}>👆</span>
          Click card to reveal identification details
        </div>
      </div>

      {/* ════════ BACK ════════ */}
      <div style={{
        position: "absolute", inset: 0,
        backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg)", background: "#111", borderRadius: 18,
        boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* ── Photo zone: top 57% — 6 images: leaf big left, 5 others in 2×3 right grid ── */}
        <div style={{
          flex: "0 0 57%",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr",
          gap: 2, position: "relative", background: "#0a0a0a", overflow: "hidden",
        }}>
          <PhotoCell url={leafImg}   label="Leaf"   show={V.back.leafImage}   style={{ gridRow: "1 / 4" }} />
          <PhotoCell url={barkImg}   label="Bark"   show={V.back.barkImage} />
          <PhotoCell url={formImg}   label="Form"   show={V.back.formImage} />
          <PhotoCell url={twigImg}   label="Twig"   show={V.back.twigImage} />
          <PhotoCell url={flowerImg} label="Flower" show={V.back.flowerImage} />
          <PhotoCell url={fruitImg}  label="Fruit"  show={V.back.fruitImage}  style={{ gridColumn: "2 / 4" }} />

          {/* Range map — top left overlay — always rendered, hidden when unchecked */}
          <div style={{
            position: "absolute", top: 9, left: 9, zIndex: 10,
            width: 108, borderRadius: 7, overflow: "hidden",
            boxShadow: species.mapImage && V.back.rangeMap ? "0 3px 10px rgba(0,0,0,0.65)" : "none",
            border: "1.5px solid rgba(255,255,255,0.2)",
            background: "#c8e6f5",
            visibility: species.mapImage ? "visible" : "hidden",
          }}>
            <img
              src={imgUrl(species.mapImage) ?? ""}
              alt="Native range map"
              style={{ width: "100%", display: "block", opacity: V.back.rangeMap ? 1 : 0 }}
              draggable={false}
            />
            <div style={{
              background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255," + (V.back.rangeMap ? "1" : "0") + ")", fontSize: 9,
              textAlign: "center", padding: "3px 0",
              fontFamily: "'Segoe UI', sans-serif", fontWeight: 700,
              letterSpacing: "0.8px", textTransform: "uppercase",
            }}>Native Range</div>
          </div>

          {/* Tags — top right overlay — always rendered, hidden when unchecked */}
          <div style={{
            position: "absolute", top: 9, right: 9, zIndex: 10,
            display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end",
            minWidth: 60,
          }}>
            {species.tags.map((tag) => {
              const s = tagStyle(tag);
              return (
                <span key={tag} style={{
                  background: V.back.backTags ? s.bg : "transparent",
                  color: V.back.backTags ? s.text : "transparent",
                  border: V.back.backTags ? `1px solid rgba(255,255,255,0.12)` : "1px solid transparent",
                  padding: "3px 9px", borderRadius: 11, fontSize: 10,
                  fontFamily: "'Segoe UI', sans-serif", fontWeight: 800,
                  letterSpacing: "0.4px", textTransform: "uppercase",
                  boxShadow: V.back.backTags ? "0 2px 6px rgba(0,0,0,0.45)" : "none",
                  minWidth: 48, textAlign: "center",
                }}>{tag}</span>
              );
            })}
          </div>
        </div>

        {/* ── Info panel: bottom 43% ── */}
        <div style={{
          flex: 1, background: "#f8f5ef",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Metadata strip */}
          <div style={{
            display: "flex", flexShrink: 0,
            borderBottom: "1px solid #d6d1c5", background: "#eeebe2",
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
                padding: "6px 5px",
                borderRight: i < arr.length - 1 ? "1px solid #d6d1c5" : "none",
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: 9, fontFamily: "'Segoe UI', sans-serif",
                  fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.6px", color: "#9b8c75", marginBottom: 1,
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 12, color: V.back.metadata ? "#1a1a14" : "transparent",
                  fontFamily: "'Segoe UI', sans-serif", fontWeight: 500, lineHeight: 1.2,
                  minHeight: "1em",
                }}>
                  {value || " "}
                </div>
              </div>
            ))}
          </div>

          {/* Description rows */}
          <div style={{
            flex: 1, padding: "7px 13px 5px",
            overflow: "hidden", display: "flex", flexDirection: "column", gap: 5,
          }}>
            <DescRow label="Leaf"       text={leafText}  accent="#2d6a4f" show={V.back.leafText} />
            <DescRow label="Bark"       text={barkText}  accent="#2d6a4f" show={V.back.barkText} />
            <DescRow label="Form"       text={formText}  accent="#2d6a4f" show={V.back.formText} />
            <DescRow label="Looks Like" text={looksText} accent="#c1121f" show={V.back.looksLike} />

            {/* Secondary: Twig / Flower / Fruit */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0 10px", paddingTop: 5,
              borderTop: "1px dashed #d6d1c5",
              flex: 1, minHeight: 0,
            }}>
              {([
                ["twig",   twigText,  "twigText"],
                ["flower", flowText,  "flowerText"],
                ["fruit",  fruitText, "fruitText"],
              ] as [string, string, keyof typeof vis.back][]).map(([key, text, visKey]) => (
                <div key={key} style={{ overflow: "hidden" }}>
                  <div style={{
                    fontSize: 10, fontFamily: "'Segoe UI', sans-serif",
                    fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.7px", color: "#9b8c75", marginBottom: 2,
                  }}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                  <p style={{
                    fontSize: 11.5, lineHeight: 1.35, margin: 0,
                    fontFamily: "'Segoe UI', sans-serif",
                    color: V.back[visKey] ? "#4a4a3a" : "transparent",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    minHeight: "1em",
                  } as React.CSSProperties}>
                    {text || " "}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: 5, borderTop: "1px solid #e4e0d6", flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, fontStyle: "italic", color: "#9b8c75" }}>
                {species.scientificName}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {species.sourceUrl && (
                  <a
                    href={species.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Open VT Dendrology factsheet"
                    style={{
                      fontSize: 11.5, color: "#2d6a4f",
                      textDecoration: "none",
                      border: "1px solid rgba(45,106,79,0.3)",
                      borderRadius: 6, padding: "2px 7px",
                      fontFamily: "'Segoe UI', sans-serif",
                      fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 3,
                      background: "rgba(45,106,79,0.06)",
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(45,106,79,0.15)";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(45,106,79,0.6)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(45,106,79,0.06)";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(45,106,79,0.3)";
                    }}
                  >
                    📄 Factsheet ↗
                  </a>
                )}
                <span style={{ fontSize: 9.5, color: "#bbb", fontFamily: "'Segoe UI', sans-serif" }}>
                  click to flip ↻
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
