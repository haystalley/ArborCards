import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { buildDecks } from "@/data/decks";
import type { SpeciesData, Deck } from "@/data/types";
import { DeckBuilder, loadCustomDecks, customDecksToDeckObjects } from "@/components/DeckBuilder";
import type { CustomDeckDef } from "@/components/DeckBuilder";

interface Props {
  species: SpeciesData[];
  syllabusIds?: Set<string>;
  onSelectDeck: (deck: Deck, filtered: SpeciesData[]) => void;
}

export function HomePage({ species, syllabusIds, onSelectDeck }: Props) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [customDefs, setCustomDefs] = useState<CustomDeckDef[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    setDecks(buildDecks(species, syllabusIds));
    setCustomDefs(loadCustomDecks());
  }, [species, syllabusIds]);

  const customDecks = customDecksToDeckObjects(customDefs);

  function handleSelect(deck: Deck) {
    const filtered = deck.filter(species);
    if (filtered.length === 0) return;
    onSelectDeck(deck, filtered);
    navigate("/setup");
  }

  function handleDeleteCustom(id: string) {
    const updated = customDefs.filter((d) => d.id !== id);
    setCustomDefs(updated);
    localStorage.setItem("dendro-custom-decks-v1", JSON.stringify(updated));
  }

  function handleSaveCustom(def: CustomDeckDef) {
    setCustomDefs((prev) => [...prev, def]);
  }

  const families = [...new Set(decks.filter(d => d.id.startsWith("family-")).map(d => d.id))];

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #0d2b1e 0%, #1b4332 50%, #0a1f15 100%)",
      padding: "40px 20px 80px",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto 44px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🌳</div>
        <h1 style={{
          fontSize: 40, fontWeight: 800, color: "#d8f3dc",
          margin: "0 0 10px", textShadow: "0 2px 16px rgba(0,0,0,0.5)",
          letterSpacing: "-0.5px",
        }}>
          Dendrology Flashcards
        </h1>
        <p style={{ color: "#74c69d", fontSize: 16, margin: 0 }}>
          {species.length} species loaded — choose a deck to study
        </p>
      </div>

      {/* Study from Map button */}
      <div style={{ maxWidth: 960, margin: "0 auto 32px", display: "flex", justifyContent: "center" }}>
        <MapButton onClick={() => navigate("/map")} />
      </div>

      {/* Preset deck grid */}
      <div style={{ maxWidth: 960, margin: "0 auto 48px" }}>
        <SectionLabel>Study Decks</SectionLabel>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}>
          {decks.filter(d => !d.id.startsWith("family-")).map(deck => {
            const count = deck.filter(species).length;
            const empty = count === 0;
            return (
              <DeckCard
                key={deck.id} deck={deck} count={count} empty={empty}
                hovered={hovered === deck.id}
                onHover={() => setHovered(deck.id)}
                onLeave={() => setHovered(null)}
                onClick={() => handleSelect(deck)}
              />
            );
          })}
        </div>
      </div>

      {/* Custom decks */}
      <div style={{ maxWidth: 960, margin: "0 auto 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(64,145,108,0.3)" }} />
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "2px",
            textTransform: "uppercase", color: "#40916c",
          }}>
            Custom Decks
          </div>
          <div style={{ flex: 1, height: 1, background: "rgba(64,145,108,0.3)" }} />

          {/* + button */}
          <button
            onClick={() => setShowBuilder(true)}
            title="Build a custom deck"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "rgba(64,145,108,0.18)",
              border: "1.5px solid rgba(64,145,108,0.4)",
              color: "#95d5b2", fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1, flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            +
          </button>
        </div>

        {customDecks.length === 0 ? (
          <button
            onClick={() => setShowBuilder(true)}
            style={{
              width: "100%", padding: "28px 20px",
              border: "2px dashed rgba(64,145,108,0.25)",
              borderRadius: 14, background: "rgba(64,145,108,0.04)",
              color: "rgba(149,213,178,0.45)", cursor: "pointer",
              fontSize: 14, fontFamily: "'Segoe UI', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>+</span>
            Create your first custom deck
          </button>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}>
            {customDecks.map((deck, i) => {
              const count = deck.filter(species).length;
              return (
                <div key={deck.id} style={{ position: "relative" }}>
                  <DeckCard
                    deck={deck} count={count} empty={count === 0}
                    hovered={hovered === deck.id}
                    onHover={() => setHovered(deck.id)}
                    onLeave={() => setHovered(null)}
                    onClick={() => handleSelect(deck)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCustom(customDefs[i].id); }}
                    title="Delete custom deck"
                    style={{
                      position: "absolute", top: 8, right: 8,
                      background: "rgba(200,50,50,0.18)",
                      border: "1px solid rgba(200,50,50,0.3)",
                      color: "rgba(255,120,120,0.7)", borderRadius: 7,
                      width: 24, height: 24, cursor: "pointer",
                      fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >✕</button>
                </div>
              );
            })}
            {/* inline + card */}
            <button
              onClick={() => setShowBuilder(true)}
              style={{
                border: "2px dashed rgba(64,145,108,0.25)",
                borderRadius: 14, background: "rgba(64,145,108,0.04)",
                color: "rgba(149,213,178,0.45)", cursor: "pointer",
                fontSize: 13, fontFamily: "'Segoe UI', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                minHeight: 80,
              }}
            >
              <span style={{ fontSize: 20 }}>+</span>
              New deck
            </button>
          </div>
        )}
      </div>

      {/* Family decks */}
      {families.length > 0 && (
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <SectionLabel>By Family</SectionLabel>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}>
            {decks.filter(d => d.id.startsWith("family-")).map(deck => {
              const count = deck.filter(species).length;
              return (
                <DeckCard
                  key={deck.id} deck={deck} count={count} empty={false}
                  hovered={hovered === deck.id} compact
                  onHover={() => setHovered(deck.id)}
                  onLeave={() => setHovered(null)}
                  onClick={() => handleSelect(deck)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Deck builder modal */}
      {showBuilder && (
        <DeckBuilder
          allSpecies={species}
          presetDecks={decks}
          onClose={() => setShowBuilder(false)}
          onSave={handleSaveCustom}
        />
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, letterSpacing: "2px",
      textTransform: "uppercase", color: "#40916c",
      marginBottom: 14, display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ flex: 1, height: 1, background: "rgba(64,145,108,0.3)" }} />
      {children}
      <div style={{ flex: 1, height: 1, background: "rgba(64,145,108,0.3)" }} />
    </div>
  );
}

function DeckCard({
  deck, count, empty, hovered, compact = false, onHover, onLeave, onClick,
}: {
  deck: Deck; count: number; empty: boolean; hovered: boolean;
  compact?: boolean; onHover: () => void; onLeave: () => void; onClick: () => void;
}) {
  return (
    <div
      onClick={!empty ? onClick : undefined}
      onMouseEnter={onHover} onMouseLeave={onLeave}
      style={{
        background: hovered && !empty
          ? "rgba(64,145,108,0.18)"
          : "rgba(255,255,255,0.05)",
        border: `1px solid ${hovered && !empty ? "rgba(149,213,178,0.4)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 14,
        padding: compact ? "14px 16px" : "18px 20px",
        cursor: empty ? "not-allowed" : "pointer",
        transition: "all 0.18s",
        opacity: empty ? 0.45 : 1,
        boxShadow: hovered && !empty ? "0 8px 24px rgba(0,0,0,0.35)" : "none",
        transform: hovered && !empty ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: compact ? 20 : 26 }}>{deck.icon}</span>
        <div>
          <div style={{
            color: "#d8f3dc", fontWeight: 700,
            fontSize: compact ? 13 : 15, lineHeight: 1.2,
          }}>
            {deck.title}
          </div>
          {deck.subtitle && (
            <div style={{
              color: "#74c69d", fontSize: 11, fontWeight: 500,
              marginTop: 1, fontStyle: "italic",
            }}>
              {deck.subtitle}
            </div>
          )}
          <div style={{
            color: "#40916c", fontSize: 11, fontWeight: 700,
            marginTop: 2,
          }}>
            {count} species
          </div>
        </div>
      </div>
      {!compact && (
        <p style={{
          margin: 0, color: "rgba(216,243,220,0.6)",
          fontSize: 12, lineHeight: 1.45,
        }}>
          {deck.description}
        </p>
      )}
    </div>
  );
}

function MapButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "rgba(64,145,108,0.25)"
          : "rgba(64,145,108,0.1)",
        border: `1.5px solid ${hovered ? "rgba(149,213,178,0.5)" : "rgba(149,213,178,0.25)"}`,
        color: hovered ? "#95d5b2" : "#74c69d",
        borderRadius: 14, padding: "14px 32px",
        fontSize: 15, cursor: "pointer",
        fontFamily: "'Segoe UI', sans-serif", fontWeight: 600,
        display: "flex", alignItems: "center", gap: 12,
        transition: "all 0.18s",
        boxShadow: hovered ? "0 6px 20px rgba(0,0,0,0.4)" : "none",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      <span style={{ fontSize: 22 }}>🗺️</span>
      Study from Map
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.6px",
        background: "rgba(64,145,108,0.3)",
        padding: "3px 9px", borderRadius: 8,
        color: "#74c69d",
      }}>
        Pick a state
      </span>
    </button>
  );
}
