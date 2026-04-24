import type { SpeciesData, VisibilitySettings } from "@/data/types";
import { parseDescriptionSections } from "@/utils/parseDescription";
import { imgUrl } from "@/config";

function esc(s: string): string {
  return s.replace(/"/g, '""').replace(/\n/g, "<br>");
}

export function exportToAnki(
  cards: SpeciesData[],
  vis: VisibilitySettings,
  deckTitle: string
): void {
  const rows: string[] = [
    "#separator:tab",
    "#html:true",
    `#deck:${deckTitle}`,
    "#notetype:Basic",
    "#columns:Front\tBack",
  ];

  for (const sp of cards) {
    const sec = sp.sections ?? parseDescriptionSections(sp.description ?? "");

    // ── Front ──
    const frontParts: string[] = [];
    if (vis.front.family)        frontParts.push(`<div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9b8c75;">${esc(sp.family)}</div>`);
    if (vis.front.commonName)    frontParts.push(`<div style="font-size:28px;font-weight:bold;color:#1b4332;">${esc(sp.commonName)}</div>`);
    if (vis.front.scientificName) frontParts.push(`<div style="font-size:14px;font-style:italic;color:#6b6658;">${esc(sp.scientificName)}</div>`);
    if (vis.front.tags && sp.tags.length)
      frontParts.push(`<div style="margin-top:10px;">${sp.tags.map(t => `<span style="background:#2d6a4f;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;margin:2px;">${esc(t)}</span>`).join(" ")}</div>`);

    // ── Back ──
    const backParts: string[] = [];

    // Images row
    const imgs: [string, string | null][] = [];
    const findImg = (key: string) =>
      imgUrl(sp.images.find(i => i.alt.toLowerCase().includes(key))?.file) ?? null;

    if (vis.back.leafImage)   imgs.push(["Leaf",   findImg("leaf")]);
    if (vis.back.barkImage)   imgs.push(["Bark",   findImg("bark")]);
    if (vis.back.formImage)   imgs.push(["Form",   findImg("form")]);
    if (vis.back.twigImage)   imgs.push(["Twig",   findImg("twig")]);
    if (vis.back.flowerImage) imgs.push(["Flower", findImg("flower")]);
    if (vis.back.fruitImage)  imgs.push(["Fruit",  findImg("fruit")]);

    if (imgs.length) {
      const imgHtml = imgs
        .filter(([, url]) => url)
        .map(([label, url]) =>
          `<div style="display:inline-block;margin:4px;text-align:center;">` +
          `<img src="${url}" style="max-height:120px;max-width:120px;object-fit:contain;"/>` +
          `<div style="font-size:10px;color:#666;">${label}</div></div>`
        )
        .join("");
      if (imgHtml) backParts.push(`<div style="margin-bottom:8px;">${imgHtml}</div>`);
    }

    // Range map
    if (vis.back.rangeMap && sp.mapImage) {
      backParts.push(`<div style="margin-bottom:6px;"><img src="${imgUrl(sp.mapImage)}" style="max-height:80px;" /><div style="font-size:10px;color:#666;">Native Range</div></div>`);
    }

    // Metadata
    if (vis.back.metadata) {
      const meta = [
        sp.family && `Family: ${sp.family}`,
        sp.usda.group && `Group: ${sp.usda.group}`,
        sp.usda.growthHabit && `Habit: ${sp.usda.growthHabit}`,
        sp.usda.duration && `Duration: ${sp.usda.duration}`,
        sp.usda.symbol && `Symbol: ${sp.usda.symbol}`,
      ].filter(Boolean).join(" | ");
      if (meta) backParts.push(`<div style="font-size:11px;color:#555;margin-bottom:6px;">${esc(meta)}</div>`);
    }

    // Text sections
    if (vis.back.leafText   && sec.leaf)     backParts.push(`<b>Leaf:</b> ${esc(sec.leaf)}<br>`);
    if (vis.back.barkText   && sec.bark)     backParts.push(`<b>Bark:</b> ${esc(sec.bark)}<br>`);
    if (vis.back.formText   && sec.form)     backParts.push(`<b>Form:</b> ${esc(sec.form)}<br>`);
    if (vis.back.looksLike  && sec.looksLike) backParts.push(`<b>Looks Like:</b> ${esc(sec.looksLike)}<br>`);
    if (vis.back.twigText   && sec.twig)     backParts.push(`<b>Twig:</b> ${esc(sec.twig)}<br>`);
    if (vis.back.flowerText && sec.flower)   backParts.push(`<b>Flower:</b> ${esc(sec.flower)}<br>`);
    if (vis.back.fruitText  && sec.fruit)    backParts.push(`<b>Fruit:</b> ${esc(sec.fruit)}<br>`);

    // Factsheet link
    if (sp.sourceUrl) backParts.push(`<div style="margin-top:8px;"><a href="${sp.sourceUrl}" style="font-size:11px;color:#2d6a4f;">VT Factsheet ↗</a></div>`);

    const front = frontParts.join("\n") || esc(sp.commonName);
    const back  = backParts.join("\n")  || esc(sp.scientificName);

    rows.push(`"${front}"\t"${back}"`);
  }

  const blob = new Blob([rows.join("\n")], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${deckTitle.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
