import type { Deck, SpeciesData } from "./types";
import { speciesInvasiveInRegion } from "@/utils/stateFilter";

const FAMILY_COMMON_NAMES: Record<string, string> = {
  Rosaceae: "Rose / Apple / Cherry",
  Pinaceae: "Pine / Fir / Spruce",
  Fagaceae: "Oak / Beech / Chestnut",
  Ericaceae: "Heath / Blueberry",
  Fabaceae: "Locust / Redbud",
  Caprifoliaceae: "Honeysuckle / Elderberry",
  Cupressaceae: "Cypress / Juniper",
  Salicaceae: "Willow / Poplar",
  Betulaceae: "Birch / Alder",
  Oleaceae: "Ash / Privet",
  Anacardiaceae: "Sumac",
  Cactaceae: "Cactus",
  Aceraceae: "Maple",
  Juglandaceae: "Walnut / Hickory",
  Cornaceae: "Dogwood",
  Arecaceae: "Palm",
  Magnoliaceae: "Magnolia",
  Ulmaceae: "Elm",
  Platanaceae: "Sycamore",
  Taxaceae: "Yew",
};

export function buildDecks(all: SpeciesData[], syllabusIds?: Set<string>): Deck[] {
  const decks: Deck[] = [
    {
      id: "all-species",
      title: "All Species",
      description: "Every species in the Virginia Tech Dendrology database",
      icon: "🌳",
      filter: (s) => s,
    },
    {
      id: "vt-syllabus",
      title: "VT Syllabus",
      description: "Species covered in VT's Dendrology course syllabus",
      icon: "🎓",
      filter: (s) => {
        if (!syllabusIds || syllabusIds.size === 0) return s;
        return s.filter((sp) => {
          const m = sp.sourceUrl && sp.sourceUrl.match(/ID=(\d+)/i);
          return m ? syllabusIds.has(m[1]) : false;
        });
      },
    },
    {
      id: "invasives-l48",
      title: "Invasives · Lower 48",
      description: "Non-native invasive species in the contiguous United States",
      icon: "⚠️",
      filter: (s) => s.filter((sp) => speciesInvasiveInRegion(sp, "L48")),
    },
    {
      id: "invasives-can",
      title: "Invasives · Canada",
      description: "Non-native invasive species in Canada",
      icon: "⚠️",
      filter: (s) => s.filter((sp) => speciesInvasiveInRegion(sp, "CAN")),
    },
    {
      id: "invasives-hi",
      title: "Invasives · Hawaii",
      description: "Non-native invasive species in Hawaii",
      icon: "⚠️",
      filter: (s) => s.filter((sp) => speciesInvasiveInRegion(sp, "HI")),
    },
    {
      id: "invasives-pr",
      title: "Invasives · Puerto Rico",
      description: "Non-native invasive species in Puerto Rico",
      icon: "⚠️",
      filter: (s) => s.filter((sp) => speciesInvasiveInRegion(sp, "PR")),
    },
    {
      id: "invasives-pb",
      title: "Invasives · Pacific Islands",
      description: "Non-native invasive species in U.S. Pacific Islands",
      icon: "⚠️",
      filter: (s) => s.filter((sp) => speciesInvasiveInRegion(sp, "PB")),
    },
    {
      id: "invasives-vi",
      title: "Invasives · Virgin Islands",
      description: "Non-native invasive species in the U.S. Virgin Islands",
      icon: "⚠️",
      filter: (s) => s.filter((sp) => speciesInvasiveInRegion(sp, "VI")),
    },
    {
      id: "invasives-ak",
      title: "Invasives · Alaska",
      description: "Non-native invasive species in Alaska",
      icon: "⚠️",
      filter: (s) => s.filter((sp) => speciesInvasiveInRegion(sp, "AK")),
    },
    {
      id: "deciduous-trees",
      title: "All Deciduous Trees",
      description: "Broad-leaved trees that shed their leaves each season",
      icon: "🍂",
      filter: (s) =>
        s.filter(
          (sp) =>
            sp.tags.some((t) => t.toLowerCase() === "deciduous") ||
            (sp.usda.growthHabit.toLowerCase() === "tree" &&
              !sp.tags.some((t) =>
                t.toLowerCase().includes("evergreen") ||
                t.toLowerCase().includes("conifer")
              ))
        ),
    },
    {
      id: "conifers",
      title: "All Conifers",
      description: "Needle-bearing conifers and cone-producing evergreen trees",
      icon: "🌲",
      filter: (s) =>
        s.filter(
          (sp) =>
            sp.tags.some(
              (t) =>
                t.toLowerCase().includes("conifer") ||
                t.toLowerCase().includes("evergreen")
            ) || sp.usda.group.toLowerCase().includes("gymnosperm")
        ),
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
      id: "shrubs",
      title: "Shrubs",
      description: "Woody shrubs and multi-stemmed plants",
      icon: "🌱",
      filter: (s) =>
        s.filter((sp) => sp.usda.growthHabit.toLowerCase() === "shrub"),
    },
  ];

  // Family decks — sorted largest first, with common name subtitles
  const families: Record<string, SpeciesData[]> = {};
  all.forEach((sp) => {
    if (!families[sp.family]) families[sp.family] = [];
    families[sp.family].push(sp);
  });

  Object.entries(families)
    .filter(([, members]) => members.length >= 2)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([family]) => {
      const commonName = FAMILY_COMMON_NAMES[family];
      decks.push({
        id: `family-${family.toLowerCase().replace(/\s+/g, "-")}`,
        title: family,
        subtitle: commonName,
        description: `Species in the ${family} family`,
        icon: "🔬",
        filter: (s) => s.filter((sp) => sp.family === family),
      });
    });

  return decks;
}
