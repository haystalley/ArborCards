import type { Deck, SpeciesData } from "./types";

export function buildDecks(all: SpeciesData[]): Deck[] {
  const decks: Deck[] = [
    {
      id: "vt-syllabus",
      title: "VT Syllabus",
      description: "All species in the Virginia Tech Dendrology database",
      icon: "🎓",
      filter: (s) => s,
    },
    {
      id: "native",
      title: "Native Species",
      description: "Species native to North America",
      icon: "🌿",
      filter: (s) =>
        s.filter((sp) => sp.tags.some((t) => t.toLowerCase() === "native")),
    },
    {
      id: "invasive",
      title: "Invasive & Introduced",
      description: "Non-native invasive and planted species",
      icon: "⚠️",
      filter: (s) =>
        s.filter((sp) =>
          sp.tags.some(
            (t) =>
              t.toLowerCase() === "invasive" ||
              t.toLowerCase().includes("introduced") ||
              t.toLowerCase().includes("planted")
          )
        ),
    },
    {
      id: "deciduous-trees",
      title: "Deciduous Trees",
      description: "Broad-leaved trees that shed leaves each season",
      icon: "🍂",
      filter: (s) =>
        s.filter(
          (sp) =>
            sp.tags.some((t) => t.toLowerCase() === "deciduous") &&
            sp.usda.growthHabit.toLowerCase() === "tree"
        ),
    },
    {
      id: "conifers",
      title: "Conifers & Evergreens",
      description: "Needle-bearing and broadleaf evergreen species",
      icon: "🌲",
      filter: (s) =>
        s.filter((sp) =>
          sp.tags.some(
            (t) =>
              t.toLowerCase().includes("conifer") ||
              t.toLowerCase().includes("evergreen")
          )
        ),
    },
    {
      id: "shrubs",
      title: "Shrubs",
      description: "Woody shrubs and multi-stemmed plants",
      icon: "🌱",
      filter: (s) =>
        s.filter((sp) => sp.usda.growthHabit.toLowerCase() === "shrub"),
    },
  ];

  // Family decks for families with ≥2 species
  const families: Record<string, SpeciesData[]> = {};
  all.forEach((sp) => {
    if (!families[sp.family]) families[sp.family] = [];
    families[sp.family].push(sp);
  });

  Object.entries(families)
    .filter(([, members]) => members.length >= 2)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([family]) => {
      decks.push({
        id: `family-${family.toLowerCase().replace(/\s+/g, "-")}`,
        title: `Family: ${family}`,
        description: `Species in the ${family} family`,
        icon: "🔬",
        filter: (s) => s.filter((sp) => sp.family === family),
      });
    });

  return decks;
}
