import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { FlashCard } from "@/components/FlashCard";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import type { SpeciesData, Deck, VisibilitySettings } from "@/data/types";

interface Props {
  deck: Deck | null;
  cards: SpeciesData[];
  vis: VisibilitySettings;
  onVisChange: (v: VisibilitySettings) => void;
}

export function StudyPage({ deck, cards, vis, onVisChange }: Props) {
  const [, navigate] = useLocation();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<number[]>([]);

  // Build shuffled order when cards change
  useEffect(() => {
    if (cards.length === 0) { navigate("/"); return; }
    const arr = Array.from({ length: cards.length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setIndex(0);
    setFlipped(false);
  }, [cards]);

  const current = cards[order[index] ?? 0];
  const progress = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

  const goNext = useCallback(() => {
    if (index < cards.length - 1) { setIndex(i => i + 1); setFlipped(false); }
  }, [index, cards.length]);

  const goPrev = useCallback(() => {
    if (index > 0) { setIndex(i => i - 1); setFlipped(false); }
  }, [index]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      else if (e.key === " " || e.key === "Enter") setFlipped(f => !f);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  if (!current) return null;

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
        padding: "16px 24px", flexShrink: 0,
      }}>
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(149,213,178,0.2)",
            color: "#95d5b2", borderRadius: 10, padding: "8px 14px",
            fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          ← Decks
        </button>

        {/* Deck title */}
        <div style={{ flex: 1 }}>
          <div style={{
            color: "#74c69d", fontSize: 12, fontWeight: 700,
            letterSpacing: "1.5px", textTransform: "uppercase",
          }}>
            {deck?.title ?? "Study"}
          </div>
          <div style={{
            color: "rgba(216,243,220,0.5)", fontSize: 11,
          }}>
            Card {index + 1} of {cards.length}
            {flipped ? " · Back" : " · Front"}
          </div>
        </div>

        {/* Settings drawer trigger */}
        <SettingsDrawer vis={vis} onChange={onVisChange} />
      </div>

      {/* ── Progress bar ── */}
      <div style={{ height: 3, flexShrink: 0, background: "rgba(255,255,255,0.08)" }}>
        <div style={{
          height: "100%", background: "#40916c",
          width: `${progress}%`, transition: "width 0.3s",
        }} />
      </div>

      {/* ── Card stage ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "20px 28px",
        minHeight: 0,
      }}>
        <div style={{
          width: "100%",
          maxWidth: 880,
          height: "min(520px, calc(100dvh - 180px))",
          perspective: "1400px",
          position: "relative",
        }}>
          <FlashCard
            species={current}
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            vis={vis}
          />
        </div>
      </div>

      {/* ── Navigation ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 16, padding: "16px 24px", flexShrink: 0,
      }}>
        <NavBtn
          disabled={index === 0}
          onClick={goPrev}
          label="← Prev"
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {/* Always-visible numeric counter */}
          <span style={{
            color: "#74c69d", fontSize: 14, fontWeight: 700,
            fontFamily: "'Segoe UI', sans-serif",
          }}>
            {index + 1} / {cards.length}
          </span>

          {/* Dot indicators for small decks */}
          {cards.length <= 20 && (
            <div style={{ display: "flex", gap: 5 }}>
              {Array.from({ length: cards.length }, (_, i) => (
                <div
                  key={i}
                  onClick={() => { setIndex(i); setFlipped(false); }}
                  style={{
                    width: i === index ? 22 : 7,
                    height: 7, borderRadius: 4,
                    background: i === index ? "#40916c" : "rgba(255,255,255,0.2)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <NavBtn
          disabled={index === cards.length - 1}
          onClick={goNext}
          label="Next →"
        />
      </div>

      {/* Keyboard hint */}
      <div style={{
        textAlign: "center", color: "rgba(116,198,157,0.4)",
        fontSize: 11, paddingBottom: 16, flexShrink: 0,
      }}>
        ← → keys to navigate · Space to flip
      </div>
    </div>
  );
}

function NavBtn({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "rgba(255,255,255,0.04)" : "rgba(64,145,108,0.2)",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : "rgba(64,145,108,0.4)"}`,
        color: disabled ? "rgba(255,255,255,0.25)" : "#95d5b2",
        borderRadius: 10, padding: "10px 20px",
        fontSize: 14, cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
