import { useState } from "react";
import { useLocation } from "wouter";
import type { Deck, SpeciesData, VisibilitySettings } from "@/data/types";
import { exportToAnki } from "@/utils/ankiExport";

interface Props {
  deck: Deck | null;
  cards: SpeciesData[];
  vis: VisibilitySettings;
  onVisChange: (v: VisibilitySettings) => void;
}

interface ToggleChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

function ToggleChip({ label, active, onToggle }: ToggleChipProps) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "6px 14px",
        borderRadius: 20,
        border: active
          ? "1.5px solid #40916c"
          : "1.5px solid rgba(255,255,255,0.14)",
        background: active
          ? hov ? "rgba(64,145,108,0.32)" : "rgba(64,145,108,0.22)"
          : hov ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        color: active ? "#95d5b2" : "rgba(149,213,178,0.45)",
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "'Segoe UI', sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span style={{ fontSize: 13 }}>{active ? "✓" : "○"}</span>
      {label}
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: "2px",
      textTransform: "uppercase", color: "#40916c",
      marginBottom: 12, display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ flex: 1, height: 1, background: "rgba(64,145,108,0.3)" }} />
      {children}
      <div style={{ flex: 1, height: 1, background: "rgba(64,145,108,0.3)" }} />
    </div>
  );
}

export function SetupPage({ deck, cards, vis, onVisChange }: Props) {
  const [, navigate] = useLocation();
  const [exportFeedback, setExportFeedback] = useState(false);

  if (!deck || cards.length === 0) {
    navigate("/");
    return null;
  }

  function tf(key: keyof typeof vis.front) {
    onVisChange({ ...vis, front: { ...vis.front, [key]: !vis.front[key] } });
  }
  function tb(key: keyof typeof vis.back) {
    onVisChange({ ...vis, back: { ...vis.back, [key]: !vis.back[key] } });
  }

  function handleExport() {
    exportToAnki(cards, vis, deck!.title);
    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 2500);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #0d2b1e 0%, #1b4332 50%, #0a1f15 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 24px 14px", flexShrink: 0,
        borderBottom: "1px solid rgba(64,145,108,0.15)",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(149,213,178,0.18)",
            color: "#95d5b2", borderRadius: 10, padding: "8px 14px",
            fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          ← Decks
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ color: "#74c69d", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Deck Setup
          </div>
          <div style={{ color: "#d8f3dc", fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            {deck.icon} {deck.title}
            <span style={{ color: "#40916c", fontSize: 12, fontWeight: 500, marginLeft: 10 }}>
              {cards.length} cards
            </span>
          </div>
        </div>

        {/* Anki export button */}
        <button
          onClick={handleExport}
          title="Export deck as Anki-importable .txt file"
          style={{
            background: exportFeedback
              ? "rgba(64,145,108,0.35)"
              : "rgba(255,255,255,0.06)",
            border: `1.5px solid ${exportFeedback ? "#40916c" : "rgba(149,213,178,0.2)"}`,
            color: exportFeedback ? "#95d5b2" : "rgba(149,213,178,0.65)",
            borderRadius: 10, padding: "8px 14px",
            fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
            transition: "all 0.2s",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 16 }}>📤</span>
          {exportFeedback ? "Exported!" : "Export to Anki"}
        </button>
      </div>

      {/* ── Scrollable config area ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 120px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>

          {/* Learn Mode */}
          <div style={{ marginBottom: 36 }}>
            <SectionHeading>Learn Mode</SectionHeading>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button style={{
                padding: "14px 24px",
                borderRadius: 14,
                border: "2px solid #40916c",
                background: "rgba(64,145,108,0.2)",
                color: "#95d5b2",
                fontSize: 14, fontWeight: 700,
                cursor: "default",
                display: "flex", alignItems: "center", gap: 10,
                fontFamily: "'Segoe UI', sans-serif",
              }}>
                <span style={{ fontSize: 20 }}>🃏</span>
                Flashcards
                <span style={{
                  fontSize: 10, background: "#40916c", color: "#fff",
                  padding: "2px 8px", borderRadius: 10, fontWeight: 800,
                  letterSpacing: "0.5px",
                }}>Selected</span>
              </button>
              {[
                { icon: "📝", label: "Written Quiz", soon: true },
                { icon: "🔤", label: "Spelling", soon: true },
              ].map(({ icon, label }) => (
                <button key={label} style={{
                  padding: "14px 24px", borderRadius: 14,
                  border: "1.5px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(149,213,178,0.3)",
                  fontSize: 14, fontWeight: 600,
                  cursor: "not-allowed",
                  display: "flex", alignItems: "center", gap: 10,
                  fontFamily: "'Segoe UI', sans-serif",
                }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  {label}
                  <span style={{
                    fontSize: 9, border: "1px solid rgba(149,213,178,0.2)",
                    color: "rgba(149,213,178,0.3)",
                    padding: "2px 7px", borderRadius: 10, fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}>Soon</span>
                </button>
              ))}
            </div>
          </div>

          {/* Front of Card */}
          <div style={{ marginBottom: 36 }}>
            <SectionHeading>Front of Card</SectionHeading>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <ToggleChip label="Common Name"    active={vis.front.commonName}     onToggle={() => tf("commonName")} />
              <ToggleChip label="Scientific Name" active={vis.front.scientificName} onToggle={() => tf("scientificName")} />
              <ToggleChip label="Family"          active={vis.front.family}         onToggle={() => tf("family")} />
              <ToggleChip label="Tags"            active={vis.front.tags}           onToggle={() => tf("tags")} />
            </div>
          </div>

          {/* Back — Photos */}
          <div style={{ marginBottom: 28 }}>
            <SectionHeading>Back — Photos</SectionHeading>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <ToggleChip label="Leaf"   active={vis.back.leafImage}   onToggle={() => tb("leafImage")} />
              <ToggleChip label="Bark"   active={vis.back.barkImage}   onToggle={() => tb("barkImage")} />
              <ToggleChip label="Form"   active={vis.back.formImage}   onToggle={() => tb("formImage")} />
              <ToggleChip label="Twig"   active={vis.back.twigImage}   onToggle={() => tb("twigImage")} />
              <ToggleChip label="Flower" active={vis.back.flowerImage} onToggle={() => tb("flowerImage")} />
              <ToggleChip label="Fruit"  active={vis.back.fruitImage}  onToggle={() => tb("fruitImage")} />
              <ToggleChip label="Range Map"   active={vis.back.rangeMap}  onToggle={() => tb("rangeMap")} />
              <ToggleChip label="Status Tags" active={vis.back.backTags}  onToggle={() => tb("backTags")} />
            </div>
          </div>

          {/* Back — Text */}
          <div style={{ marginBottom: 40 }}>
            <SectionHeading>Back — Text & Metadata</SectionHeading>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <ToggleChip label="Leaf Text"    active={vis.back.leafText}    onToggle={() => tb("leafText")} />
              <ToggleChip label="Bark Text"    active={vis.back.barkText}    onToggle={() => tb("barkText")} />
              <ToggleChip label="Form Text"    active={vis.back.formText}    onToggle={() => tb("formText")} />
              <ToggleChip label="Twig Text"    active={vis.back.twigText}    onToggle={() => tb("twigText")} />
              <ToggleChip label="Flower Text"  active={vis.back.flowerText}  onToggle={() => tb("flowerText")} />
              <ToggleChip label="Fruit Text"   active={vis.back.fruitText}   onToggle={() => tb("fruitText")} />
              <ToggleChip label="Looks Like"   active={vis.back.looksLike}   onToggle={() => tb("looksLike")} />
              <ToggleChip label="USDA Metadata" active={vis.back.metadata}   onToggle={() => tb("metadata")} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Start button ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 28px 28px",
        background: "linear-gradient(0deg, rgba(10,26,15,1) 60%, rgba(10,26,15,0) 100%)",
        display: "flex", justifyContent: "center",
      }}>
        <button
          onClick={() => navigate("/study")}
          style={{
            background: "linear-gradient(90deg, #2d6a4f, #40916c)",
            border: "none",
            color: "#fff",
            borderRadius: 16, padding: "16px 56px",
            fontSize: 16, fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "0.3px",
            boxShadow: "0 8px 28px rgba(40,145,108,0.4)",
            transition: "transform 0.15s, box-shadow 0.15s",
            fontFamily: "'Segoe UI', sans-serif",
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(40,145,108,0.55)";
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.transform = "";
            (e.target as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(40,145,108,0.4)";
          }}
        >
          Start Studying →
        </button>
      </div>
    </div>
  );
}
