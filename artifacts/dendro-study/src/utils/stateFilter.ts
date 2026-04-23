import type { SpeciesData } from "@/data/types";

// Full state name (from GeoJSON) → 2-letter abbreviation
// Includes DC and Puerto Rico so all clickable polygons have defined behavior
export const STATE_NAME_TO_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR",
  California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};

// Abbreviation → full name (reverse lookup)
export const STATE_ABBR_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_TO_ABBR).map(([name, abbr]) => [abbr, name])
);

// Lower 48 contiguous states (excludes AK and HI)
export const L48_ABBRS = new Set(
  Object.values(STATE_NAME_TO_ABBR).filter((a) => a !== "AK" && a !== "HI")
);

// ── Parsing ────────────────────────────────────────────────────────────────────
interface StatusSegment {
  code: string;
  status: string; // "N" | "I" | "W" | "?" etc.
}

function parseSegments(nativeStatus: string): StatusSegment[] {
  if (!nativeStatus) return [];
  const result: StatusSegment[] = [];
  for (const part of nativeStatus.split(/[,|]/).map((p) => p.trim())) {
    const m = part.match(/^([A-Z0-9]+)\s*\(([A-Z?]+)\)/);
    if (m) result.push({ code: m[1], status: m[2] });
  }
  return result;
}

function coversState(code: string, stateAbbr: string): boolean {
  return (
    code === stateAbbr ||
    (code === "L48" && L48_ABBRS.has(stateAbbr)) ||
    (code === "AK" && stateAbbr === "AK") ||
    (code === "HI" && stateAbbr === "HI")
  );
}

// ── Public helpers ─────────────────────────────────────────────────────────────

/** Is the species present (any status) in the given state? */
export function speciesInState(species: SpeciesData, stateAbbr: string): boolean {
  return parseSegments(species.usda.nativeStatus).some(({ code }) =>
    coversState(code, stateAbbr)
  );
}

/** Is the species native (status = N) in the given state? */
export function speciesNativeInState(species: SpeciesData, stateAbbr: string): boolean {
  return parseSegments(species.usda.nativeStatus).some(
    ({ code, status }) => status === "N" && coversState(code, stateAbbr)
  );
}

/** Is the species invasive (I, I? or W) in the given state? */
export function speciesInvasiveInState(species: SpeciesData, stateAbbr: string): boolean {
  return parseSegments(species.usda.nativeStatus).some(
    ({ code, status }) =>
      (status === "I" || status === "I?" || status === "W") && coversState(code, stateAbbr)
  );
}

/**
 * Is the species invasive (I or I?) in the given USDA region code?
 * Region codes: L48, CAN, HI, PR, PB, VI, AK — matched directly (no state expansion).
 * Uses I and I? only (not W/waif) to match official invasive species counts.
 */
export function speciesInvasiveInRegion(species: SpeciesData, regionCode: string): boolean {
  return parseSegments(species.usda.nativeStatus).some(
    ({ code, status }) =>
      code === regionCode && (status === "I" || status === "I?")
  );
}

/** Build ad-hoc deck filter results for a given state */
export function stateDeckCounts(
  all: SpeciesData[],
  stateAbbr: string
): {
  all: SpeciesData[];
  natives: SpeciesData[];
  invasives: SpeciesData[];
  byFamily: { family: string; species: SpeciesData[] }[];
} {
  const inState = all.filter((sp) => speciesInState(sp, stateAbbr));
  const natives = all.filter((sp) => speciesNativeInState(sp, stateAbbr));
  const invasives = all.filter((sp) => speciesInvasiveInState(sp, stateAbbr));

  const familyMap: Record<string, SpeciesData[]> = {};
  inState.forEach((sp) => {
    if (!familyMap[sp.family]) familyMap[sp.family] = [];
    familyMap[sp.family].push(sp);
  });

  const byFamily = Object.entries(familyMap)
    .filter(([, members]) => members.length >= 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, species]) => ({ family, species }));

  return { all: inState, natives, invasives, byFamily };
}
