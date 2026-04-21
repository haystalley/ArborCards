import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import type { SpeciesData, Deck, VisibilitySettings } from "@/data/types";
import { DEFAULT_VISIBILITY } from "@/data/types";
import { HomePage } from "@/pages/HomePage";
import { StudyPage } from "@/pages/StudyPage";
import { MapView } from "@/pages/MapView";
import NotFound from "@/pages/not-found";

const LS_VIS = "dendro-vis-v1";

function loadVis(): VisibilitySettings {
  try {
    const raw = localStorage.getItem(LS_VIS);
    if (raw) return { ...DEFAULT_VISIBILITY, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_VISIBILITY;
}

function App() {
  const [species, setSpecies] = useState<SpeciesData[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<SpeciesData[]>([]);
  const [vis, setVis] = useState<VisibilitySettings>(loadVis);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load species data from public/data/species_data.json
  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? "/";
    const url = `${base}data/species_data.json`.replace(/\/+/g, "/");
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: SpeciesData[]) => { setSpecies(data); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  // Persist visibility settings
  useEffect(() => {
    localStorage.setItem(LS_VIS, JSON.stringify(vis));
  }, [vis]);

  function handleSelectDeck(deck: Deck, filtered: SpeciesData[]) {
    setActiveDeck(deck);
    setDeckCards(filtered);
  }

  if (loading) return <LoadScreen text="Loading species data…" />;
  if (error)   return <LoadScreen text={`Error: ${error}`} isError />;

  return (
    <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}>
      <Switch>
        <Route path="/">
          <HomePage species={species} onSelectDeck={handleSelectDeck} />
        </Route>
        <Route path="/study">
          <StudyPage
            deck={activeDeck}
            cards={deckCards}
            vis={vis}
            onVisChange={setVis}
          />
        </Route>
        <Route path="/map">
          <MapView species={species} onSelectDeck={handleSelectDeck} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function LoadScreen({ text, isError = false }: { text: string; isError?: boolean }) {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #0d2b1e 0%, #1b4332 50%, #0a1f15 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16,
    }}>
      {!isError && <div style={{ fontSize: 48 }}>🌳</div>}
      {isError  && <div style={{ fontSize: 48 }}>⚠️</div>}
      <p style={{
        color: isError ? "#f4a261" : "#74c69d",
        fontFamily: "'Segoe UI', sans-serif", fontSize: 16, margin: 0,
      }}>
        {text}
      </p>
    </div>
  );
}

export default App;
