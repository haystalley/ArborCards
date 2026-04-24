import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SpeciesData, Deck } from "@/data/types";
import {
  STATE_NAME_TO_ABBR,
  STATE_ABBR_TO_NAME,
  stateDeckCounts,
} from "@/utils/stateFilter";
import { STATE_MARQUEE } from "@/data/marqueeSpecies";

// ── Style constants ──────────────────────────────────────────────────────────
const STYLE_DEFAULT: L.PathOptions = {
  color: "#40916c", weight: 1.5, opacity: 0.8,
  fillColor: "#1b4332", fillOpacity: 0.55,
};
const STYLE_HOVER: L.PathOptions = {
  color: "#74c69d", weight: 2, opacity: 1,
  fillColor: "#2d6a4f", fillOpacity: 0.75,
};
const STYLE_SELECTED: L.PathOptions = {
  color: "#95d5b2", weight: 2.5, opacity: 1,
  fillColor: "#40916c", fillOpacity: 0.9,
};

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  species: SpeciesData[];
  onSelectDeck: (deck: Deck, filtered: SpeciesData[]) => void;
}

// ── MapView ──────────────────────────────────────────────────────────────────
export function MapView({ species, onSelectDeck }: Props) {
  const [, navigate] = useLocation();
  const [geoData, setGeoData] = useState<object | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Map<string, L.Path>>(new Map());
  const selectedRef = useRef<string | null>(null);

  // Load US states GeoJSON
  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? "/";
    const url = `${base}data/us-states.json`.replace(/\/+/g, "/");
    fetch(url)
      .then((r) => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Init Leaflet map imperatively
  useEffect(() => {
    if (!geoData) return;
    if (mapRef.current) return;

    const container = document.getElementById("dendro-map");
    if (!container) return;

    const map = L.map(container, {
      center: [38, -95],
      zoom: 4,
      zoomControl: true,
      attributionControl: true,
      minZoom: 3,
      maxZoom: 7,
    });
    mapRef.current = map;

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    L.geoJSON(geoData as Parameters<typeof L.geoJSON>[0], {
      style: () => ({ ...STYLE_DEFAULT }),
      onEachFeature(feature, layer) {
        const name: string = feature.properties?.name ?? "";
        const pathLayer = layer as L.Path;
        layersRef.current.set(name, pathLayer);

        layer.on("mouseover", () => {
          if (selectedRef.current !== name) {
            pathLayer.setStyle({ ...STYLE_HOVER });
            pathLayer.bringToFront();
          }
        });
        layer.on("mouseout", () => {
          if (selectedRef.current !== name) {
            pathLayer.setStyle({ ...STYLE_DEFAULT });
          }
        });
        layer.on("click", () => {
          if (selectedRef.current && selectedRef.current !== name) {
            const prev = layersRef.current.get(selectedRef.current);
            if (prev) prev.setStyle({ ...STYLE_DEFAULT });
          }
          selectedRef.current = name;
          pathLayer.setStyle({ ...STYLE_SELECTED });
          pathLayer.bringToFront();
          setSelectedStateName(name);
        });
      },
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current.clear();
    };
  }, [geoData]);

  function closePanel() {
    if (selectedRef.current) {
      const prev = layersRef.current.get(selectedRef.current);
      if (prev) prev.setStyle({ ...STYLE_DEFAULT });
      selectedRef.current = null;
    }
    setSelectedStateName(null);
  }

  const stateAbbr = selectedStateName
    ? (STATE_NAME_TO_ABBR[selectedStateName] ?? null)
    : null;

  const counts = stateAbbr ? stateDeckCounts(species, stateAbbr) : null;

  // Marquee species: cross-reference curated list with actual data
  const marqueeSpecies = stateAbbr
    ? (STATE_MARQUEE[stateAbbr] ?? [])
        .map((sciName) =>
          species.find((sp) => sp.scientificName.toLowerCase() === sciName.toLowerCase())
        )
        .filter(Boolean) as SpeciesData[]
    : [];

  function startDeck(
    title: string,
    icon: string,
    cards: SpeciesData[],
    deckId: string
  ) {
    if (cards.length === 0) return;
    const deck: Deck = {
      id: deckId,
      title,
      description: `Species filtered for ${selectedStateName}`,
      icon,
      filter: (s) => s.filter((sp) => cards.includes(sp)),
    };
    onSelectDeck(deck, cards);
    navigate("/setup");
  }

  return (
    <div style={{
      width: "100%", height: "100dvh", position: "relative", overflow: "hidden",
      background: "#0a1a0f",
    }}>
      {/* ── Back button ── */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute", top: 16, left: 16, zIndex: 1000,
          background: "rgba(13,43,30,0.92)", border: "1px solid rgba(149,213,178,0.25)",
          color: "#95d5b2", borderRadius: 10, padding: "8px 16px",
          fontSize: 13, cursor: "pointer", fontFamily: "'Segoe UI', sans-serif",
          backdropFilter: "blur(6px)",
        }}
      >
        ← Decks
      </button>

      {/* ── Title ── */}
      <div style={{
        position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000,
        background: "rgba(13,43,30,0.88)", border: "1px solid rgba(64,145,108,0.3)",
        borderRadius: 12, padding: "8px 20px", backdropFilter: "blur(6px)",
        textAlign: "center",
      }}>
        <div style={{ color: "#74c69d", fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'Segoe UI', sans-serif" }}>
          Study from Map
        </div>
        <div style={{ color: "rgba(149,213,178,0.5)", fontSize: 11, fontFamily: "'Segoe UI', sans-serif", marginTop: 2 }}>
          Click a state to build a study deck
        </div>
      </div>

      {/* ── Loading indicator ── */}
      {!geoData && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(10,26,15,0.7)", color: "#74c69d",
          fontSize: 16, fontFamily: "'Segoe UI', sans-serif",
        }}>
          🌿 Loading map…
        </div>
      )}

      {/* ── Leaflet map container ── */}
      <div id="dendro-map" style={{ width: "100%", height: "100%" }} />

      {/* ── State selection panel (right side slide-in) ── */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 1001,
        width: 310,
        background: "linear-gradient(180deg, #0d2b1e 0%, #1b4332 100%)",
        borderLeft: "1px solid rgba(149,213,178,0.15)",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
        transform: selectedStateName ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {selectedStateName && (
          <>
            {/* Panel header */}
            <div style={{
              padding: "18px 18px 12px",
              borderBottom: "1px solid rgba(64,145,108,0.2)", flexShrink: 0,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  {stateAbbr && (
                    <div style={{ color: "#95d5b2", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Segoe UI', sans-serif", opacity: 0.7, marginBottom: 4 }}>
                      {stateAbbr}
                    </div>
                  )}
                  <div style={{ color: "#d8f3dc", fontSize: 20, fontWeight: 800, fontFamily: "'Segoe UI', sans-serif", lineHeight: 1.1 }}>
                    {selectedStateName}
                  </div>
                  {counts && (
                    <div style={{ color: "#40916c", fontSize: 12, marginTop: 4, fontFamily: "'Segoe UI', sans-serif" }}>
                      {counts.all.length} species found
                    </div>
                  )}
                  {!stateAbbr && (
                    <div style={{ color: "rgba(149,213,178,0.45)", fontSize: 11, marginTop: 4, fontFamily: "'Segoe UI', sans-serif" }}>
                      No species data for this region
                    </div>
                  )}
                </div>
                <button
                  onClick={closePanel}
                  style={{ background: "none", border: "none", color: "#95d5b2", fontSize: 18, cursor: "pointer", padding: "2px 6px", lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              {/* Marquee species chips */}
              {marqueeSpecies.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase",
                    color: "#40916c", fontFamily: "'Segoe UI', sans-serif", marginBottom: 6,
                  }}>
                    Marquee Species
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {marqueeSpecies.map((sp) => (
                      <div
                        key={sp.id}
                        title={sp.scientificName}
                        style={{
                          background: "rgba(64,145,108,0.15)",
                          border: "1px solid rgba(64,145,108,0.3)",
                          borderRadius: 8, padding: "3px 9px",
                          fontSize: 11, color: "#95d5b2",
                          fontFamily: "'Segoe UI', sans-serif",
                          cursor: "default",
                        }}
                      >
                        {sp.commonName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Deck options */}
            {counts && (
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: "#40916c", fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'Segoe UI', sans-serif", marginBottom: 8, paddingLeft: 4 }}>
                    Choose a deck
                  </div>

                  <DeckOption
                    icon="🌿" label={`All species · ${selectedStateName}`}
                    count={counts.all.length}
                    onClick={() => startDeck(`All Species · ${selectedStateName}`, "🌿", counts.all, `map-all-${stateAbbr}`)}
                  />
                  <DeckOption
                    icon="🌱" label={`Natives · ${selectedStateName}`}
                    count={counts.natives.length}
                    onClick={() => startDeck(`Natives · ${selectedStateName}`, "🌱", counts.natives, `map-native-${stateAbbr}`)}
                  />
                  <DeckOption
                    icon="⚠️" label={`Invasives · ${selectedStateName}`}
                    count={counts.invasives.length}
                    onClick={() => startDeck(`Invasives · ${selectedStateName}`, "⚠️", counts.invasives, `map-invasive-${stateAbbr}`)}
                  />
                </div>

                {/* Family breakdown */}
                {counts.byFamily.length > 0 && (
                  <div>
                    <div style={{ color: "#40916c", fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'Segoe UI', sans-serif", marginBottom: 8, paddingLeft: 4, paddingTop: 4, borderTop: "1px solid rgba(64,145,108,0.2)" }}>
                      By Family
                    </div>
                    {counts.byFamily.map(({ family, species: fsp }) => (
                      <DeckOption
                        key={family}
                        icon="🔬"
                        label={family}
                        count={fsp.length}
                        onClick={() => startDeck(`${family} · ${selectedStateName}`, "🔬", fsp, `map-family-${family}-${stateAbbr}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dismiss overlay */}
      {selectedStateName && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 500, right: 310 }}
          onClick={closePanel}
        />
      )}
    </div>
  );
}

// ── Deck option row ──────────────────────────────────────────────────────────
function DeckOption({
  icon, label, count, onClick,
}: {
  icon: string; label: string; count: number; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const disabled = count === 0;

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "10px 12px", borderRadius: 10, marginBottom: 6,
        background: hovered && !disabled ? "rgba(64,145,108,0.22)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${hovered && !disabled ? "rgba(149,213,178,0.3)" : "rgba(255,255,255,0.07)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, color: "#d8f3dc", fontSize: 12.5, fontFamily: "'Segoe UI', sans-serif", lineHeight: 1.3 }}>
        {label}
      </span>
      <span style={{
        color: count > 0 ? "#40916c" : "#666",
        fontSize: 12, fontWeight: 700, fontFamily: "'Segoe UI', sans-serif",
        background: "rgba(0,0,0,0.3)", padding: "2px 7px", borderRadius: 10,
        flexShrink: 0,
      }}>
        {count}
      </span>
    </button>
  );
}
