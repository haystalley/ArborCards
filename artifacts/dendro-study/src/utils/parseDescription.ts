import type { SpeciesData } from "@/data/types";

type Sections = NonNullable<SpeciesData["sections"]>;

const LABEL_MAP: Array<[RegExp, keyof Sections]> = [
  [/^Leaf:/i,       "leaf"],
  [/^Bark:/i,       "bark"],
  [/^Form:/i,       "form"],
  [/^Twig:/i,       "twig"],
  [/^Flower:/i,     "flower"],
  [/^Fruit:/i,      "fruit"],
  [/^Looks like:/i, "looksLike"],
];

const STOP_LABELS = /^(Additional Range Information|More Information|External Links|All material)/i;

export function parseDescriptionSections(description: string): Sections {
  const result: Sections = {};
  const lines = description.split("\n").map((l) => l.trim()).filter(Boolean);

  let currentKey: keyof Sections | null = null;
  let currentText: string[] = [];

  function flush() {
    if (currentKey && currentText.length) {
      result[currentKey] = currentText.join(" ").trim();
    }
    currentKey = null;
    currentText = [];
  }

  for (const line of lines) {
    if (STOP_LABELS.test(line)) {
      flush();
      break;
    }

    let matched = false;
    for (const [re, key] of LABEL_MAP) {
      if (re.test(line)) {
        flush();
        currentKey = key;
        currentText = [line.replace(re, "").trim()];
        matched = true;
        break;
      }
    }

    if (!matched && currentKey) {
      currentText.push(line);
    }
  }

  flush();
  return result;
}
