import { useState, useMemo, useRef, useEffect } from "react";
import type { SpeciesData, Deck } from "@/data/types";

const LS_KEY = "dendro-custom-decks-v1";

export interface CustomDeckDef {
  id: string;
  title: string;
  speciesIds: string[];
  createdAt: number;
}

export function loadCustomDecks(): CustomDeckDef[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomDecks(decks: CustomDeckDef[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(decks));
}

export function customDecksToDeckObjects(
  defs: CustomDeckDef[]
): Deck[] {
  return defs.map((def) => ({
    id: def.id,
    title: def.title,
    description: `Custom deck · ${def.speciesIds.length} species`,
    icon: "✏️",
    filter: (all: SpeciesData[]) =>
      all.filter((sp) => def.speciesIds.includes(sp.id)),
  }));
}

interface Props {
  allSpecies: SpeciesData[];
  presetDecks: Deck[];
  onClose: () => void;
  onSave: (def: CustomDeckDef) => void;
}

type Tab = "species" | "decks";

export function DeckBuilder({ allSpecies, presetDecks, onClose, onSave }: Props) {
  const [tab, setTab] = useState<Tab>("species");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deckName, setDeckName] = useState("");
  const [nameError, setNameError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const filteredSpecies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSpecies.slice(0, 80);
    return allSpecies
      .filter(
        (sp) =>
          sp.commonName.toLowerCase().includes(q) ||
          sp.scientificName.toLowerCase().includes(q) ||
          sp.family.toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [query, allSpecies]);

  const filteredDecks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presetDecks;
    return presetDecks.filter((d) => d.title.toLowerCase().includes(q));
  }, [query, presetDecks]);

  function toggleSpecies(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function addDeck(deck: Deck) {
    const ids = deck.filter(allSpecies).map((sp) => sp.id);
    setSelectedIds((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => n.add(id));
      return n;
    });
  }

  function removeDeck(deck: Deck) {
    const ids = new Set(deck.filter(allSpecies).map((sp) => sp.id));
    setSelectedIds((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => n.delete(id));
      return n;
    });
  }

  function deckFullyIncluded(deck: Deck) {
    return deck.filter(allSpecies).every((sp) => selectedIds.has(sp.id));
  }

  function handleSave() {
    if (!deckName.trim()) { setNameError(true); return; }
    if (selectedIds.size === 0) return;
    const def: CustomDeckDef = {
      id: `custom-${Date.now()}`,
      title: deckName.trim(),
      speciesIds: [...selectedIds],
      createdAt: Date.now(),
    };
    const existing = loadCustomDecks();
    saveCustomDecks([...existing, def]);
    onSave(def);
    onClose();
  }

  const selectedList = allSpecies.filter((sp) => selectedIds.has(sp.id));

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)",
    border: "1.5px solid rgba(149,213,178,0.2)",
    borderRadius: 12, padding: "10px 14px",
    color: "#d8f3dc", fontSize: 14, outline: "none",
    fontFamily: "'Segoe UI', sans-serif",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(7,18,12,0.88)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 760, height: "min(88vh, 680px)",
        background: "linear-gradient(160deg, #0d2b1e, #1b4332)",
        borderRadius: 20,
        border: "1px solid rgba(64,145,108,0.3)",
        boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid rgba(64,145,108,0.18)",
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        }}>
          <span style={{ fontSize: 22 }}>✏️</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#74c69d", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Build a Custom Deck
            </div>
            <input
              value={deckName}
              onChange={(e) => { setDeckName(e.target.value); setNameError(false); }}
              placeholder="Name your deck…"
              style={{
                ...inputStyle, marginTop: 6,
                border: nameError
                  ? "1.5px solid #e63946"
                  : "1.5px solid rgba(149,213,178,0.2)",
                padding: "6px 10px", fontSize: 16, fontWeight: 700,
              }}
            />
            {nameError && <div style={{ color: "#e63946", fontSize: 11, marginTop: 3 }}>Please enter a deck name.</div>}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#95d5b2", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}
          >✕</button>
        </div>

        {/* Main 2-col layout */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

          {/* Left: search & browse */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            borderRight: "1px solid rgba(64,145,108,0.15)",
            minWidth: 0,
          }}>
            {/* Search bar */}
            <div style={{ padding: "12px 14px 0" }}>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "species"
                  ? "Search species by name or family…"
                  : "Search decks…"}
                style={inputStyle}
              />
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", padding: "10px 14px 0", gap: 6 }}>
              {(["species", "decks"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "5px 14px", borderRadius: 10,
                    border: tab === t
                      ? "1.5px solid #40916c"
                      : "1.5px solid rgba(255,255,255,0.1)",
                    background: tab === t
                      ? "rgba(64,145,108,0.22)"
                      : "rgba(255,255,255,0.04)",
                    color: tab === t ? "#95d5b2" : "rgba(149,213,178,0.45)",
                    fontSize: 12, fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Segoe UI', sans-serif",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Results list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 12px" }}>
              {tab === "species" && filteredSpecies.map((sp) => {
                const sel = selectedIds.has(sp.id);
                return (
                  <button
                    key={sp.id}
                    onClick={() => toggleSpecies(sp.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", textAlign: "left",
                      padding: "8px 10px", marginBottom: 3, borderRadius: 10,
                      background: sel ? "rgba(64,145,108,0.18)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${sel ? "rgba(64,145,108,0.4)" : "rgba(255,255,255,0.06)"}`,
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `2px solid ${sel ? "#40916c" : "rgba(149,213,178,0.3)"}`,
                      background: sel ? "#40916c" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all 0.12s",
                      color: "#fff", fontSize: 12,
                    }}>
                      {sel ? "✓" : ""}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#d8f3dc", fontSize: 13, fontWeight: 600, display: "block" }}>
                        {sp.commonName}
                      </span>
                      <span style={{ color: "rgba(149,213,178,0.5)", fontSize: 11, fontStyle: "italic" }}>
                        {sp.scientificName}
                      </span>
                    </span>
                    <span style={{ color: "rgba(149,213,178,0.35)", fontSize: 10, flexShrink: 0 }}>
                      {sp.family}
                    </span>
                  </button>
                );
              })}

              {tab === "decks" && filteredDecks.map((deck) => {
                const included = deckFullyIncluded(deck);
                const count = deck.filter(allSpecies).length;
                return (
                  <button
                    key={deck.id}
                    onClick={() => included ? removeDeck(deck) : addDeck(deck)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", textAlign: "left",
                      padding: "10px 12px", marginBottom: 5, borderRadius: 12,
                      background: included ? "rgba(64,145,108,0.18)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${included ? "rgba(64,145,108,0.4)" : "rgba(255,255,255,0.06)"}`,
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{deck.icon}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#d8f3dc", fontSize: 13, fontWeight: 600, display: "block" }}>
                        {deck.title}
                      </span>
                      <span style={{ color: "#40916c", fontSize: 11 }}>{count} species</span>
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: included ? "#95d5b2" : "rgba(149,213,178,0.45)",
                      border: `1px solid ${included ? "#40916c" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 8, padding: "3px 10px",
                      background: included ? "rgba(64,145,108,0.2)" : "transparent",
                      flexShrink: 0,
                    }}>
                      {included ? "Added ✓" : "Add all"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: selected species */}
          <div style={{
            width: 230, display: "flex", flexDirection: "column",
            background: "rgba(0,0,0,0.15)", flexShrink: 0,
          }}>
            <div style={{
              padding: "12px 14px 8px",
              borderBottom: "1px solid rgba(64,145,108,0.15)",
              flexShrink: 0,
            }}>
              <div style={{ color: "#74c69d", fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Selected · {selectedIds.size}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
              {selectedList.length === 0 && (
                <div style={{ color: "rgba(149,213,178,0.3)", fontSize: 12, textAlign: "center", marginTop: 24 }}>
                  Nothing selected yet.<br />Click species or add whole decks.
                </div>
              )}
              {selectedList.map((sp) => (
                <div key={sp.id} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 8px", marginBottom: 3, borderRadius: 8,
                  background: "rgba(64,145,108,0.1)",
                }}>
                  <span style={{ flex: 1, color: "#d8f3dc", fontSize: 11.5, lineHeight: 1.3 }}>
                    {sp.commonName}
                  </span>
                  <button
                    onClick={() => toggleSpecies(sp.id)}
                    style={{
                      background: "none", border: "none", color: "rgba(149,213,178,0.4)",
                      cursor: "pointer", padding: "0 2px", fontSize: 14, lineHeight: 1, flexShrink: 0,
                    }}
                  >✕</button>
                </div>
              ))}
            </div>

            {/* Save button */}
            <div style={{ padding: "12px 14px 16px", flexShrink: 0, borderTop: "1px solid rgba(64,145,108,0.15)" }}>
              <button
                onClick={handleSave}
                disabled={selectedIds.size === 0}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "none",
                  background: selectedIds.size > 0
                    ? "linear-gradient(90deg, #2d6a4f, #40916c)"
                    : "rgba(255,255,255,0.06)",
                  color: selectedIds.size > 0 ? "#fff" : "rgba(255,255,255,0.25)",
                  fontSize: 13, fontWeight: 800,
                  cursor: selectedIds.size > 0 ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  fontFamily: "'Segoe UI', sans-serif",
                }}
              >
                Save Deck ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
