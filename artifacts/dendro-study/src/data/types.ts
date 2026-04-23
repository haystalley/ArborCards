export interface SpeciesImage {
  file: string;
  alt: string;
  isMap: boolean;
}

export interface SpeciesData {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  tags: string[];
  description: string;
  usda: {
    symbol: string;
    group: string;
    duration: string;
    growthHabit: string;
    nativeStatus: string;
  };
  images: SpeciesImage[];
  mapImage: string | null;
  pdfs: string[];
  sourceUrl: string;
  folder: string;
  sections?: {
    leaf?: string;
    bark?: string;
    form?: string;
    twig?: string;
    flower?: string;
    fruit?: string;
    looksLike?: string;
  };
}

export interface VisibilitySettings {
  front: {
    family: boolean;
    commonName: boolean;
    scientificName: boolean;
    tags: boolean;
  };
  back: {
    leafImage: boolean;
    barkImage: boolean;
    formImage: boolean;
    rangeMap: boolean;
    backTags: boolean;
    metadata: boolean;
    leafText: boolean;
    barkText: boolean;
    formText: boolean;
    looksLike: boolean;
    twigText: boolean;
    flowerText: boolean;
    fruitText: boolean;
  };
}

export const DEFAULT_VISIBILITY: VisibilitySettings = {
  front: { family: true, commonName: true, scientificName: true, tags: true },
  back: {
    leafImage: true, barkImage: true, formImage: true,
    rangeMap: true, backTags: true, metadata: true,
    leafText: true, barkText: true, formText: true,
    looksLike: true, twigText: true, flowerText: true, fruitText: true,
  },
};

export interface Deck {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon: string;
  filter: (species: SpeciesData[]) => SpeciesData[];
}
