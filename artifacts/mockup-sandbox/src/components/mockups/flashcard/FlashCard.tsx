import { useState } from "react";

// ── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE_SPECIES = [
  {
    id: "Acer_rubrum",
    commonName: "Red Maple",
    scientificName: "Acer rubrum",
    family: "Aceraceae",
    tags: ["Tree", "Deciduous", "Native"],
    usda: {
      symbol: "ACRU",
      group: "Dicot",
      duration: "Perennial",
      growthHabit: "Tree",
      nativeStatus: "CAN (N) | L48 (N)",
    },
    images: [
      { descriptor: "leaf", url: "/__mockup/images/acer_rubrum/leaf.jpg" },
      { descriptor: "bark", url: "/__mockup/images/acer_rubrum/bark.jpg" },
      { descriptor: "form", url: "/__mockup/images/acer_rubrum/form.jpg" },
    ],
    mapUrl: "/__mockup/images/acer_rubrum/map.jpg",
    sections: {
      leaf: "Opposite, simple, 3 to 5 palmate lobes with serrated margin, sinuses relatively shallow (but highly variable), 2 to 4 inches long; green above, whitened and sometimes glaucous or hairy beneath.",
      bark: "On young trees, smooth and light gray; with age becomes darker and breaks up into long, fine scaly plates.",
      form: "Medium sized tree up to 90 feet. In forest, trunk usually clear for some distance; in the open the trunk is shorter and the crown rounded.",
      twig: "Reddish and lustrous with small lenticels; buds usually blunt, green or reddish with several loose scales; leaf scars V-shaped, 3 bundle scars; lateral buds slightly stalked.",
      flower: "Attractive but small, occur in hanging clusters, usually bright red but occasionally yellow; appear in early spring, usually before leaves.",
      fruit: "Clusters of ½ to ¾ inch samaras with slightly divergent wings on long slender stems; light brown and often reddish; ripen in late spring and early summer.",
      looksLike: "silver maple — Norway maple — mapleleaf viburnum — sugar maple",
    },
  },
  {
    id: "Pinus_strobus",
    commonName: "Eastern White Pine",
    scientificName: "Pinus strobus",
    family: "Pinaceae",
    tags: ["Tree", "Conifer", "Native"],
    usda: {
      symbol: "PIST",
      group: "Gymnosperm",
      duration: "Perennial",
      growthHabit: "Tree",
      nativeStatus: "CAN N | L48 N | SPM N",
    },
    images: [
      { descriptor: "leaf", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&q=80" },
      { descriptor: "bark", url: "https://images.unsplash.com/photo-1565127952204-ce8a01d12a51?w=700&q=80" },
      { descriptor: "form", url: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=700&q=80" },
    ],
    mapUrl: null,
    sections: {
      leaf: "Needles in fascicles of 5, 3–5 inches long, soft and flexible, blue-green with white stomatal lines on inner faces. The only eastern 5-needle pine.",
      bark: "Young bark smooth, greenish-gray. Older bark dark gray-brown with broad scaly ridges and deep furrows.",
      form: "Tall straight conifer, 80–150 ft; broadly pyramidal when young becoming irregular with age. Tallest tree in eastern North America.",
      twig: "Slender, orange-brown, glabrous. Buds ovoid, brown, slightly resinous.",
      flower: "Monoecious. Male cones yellow, clustered at branch tips; female cones reddish, becoming long cylindrical cones.",
      fruit: "Pendulous cylindrical cones 4–8 inches long, thin scales, often resinous. Seeds small, winged.",
      looksLike: "No other native 5-needle pine in eastern range. Western white pine (P. monticola) has larger cones and strictly western distribution.",
    },
  },
  {
    id: "Ailanthus_altissima",
    commonName: "Tree of Heaven",
    scientificName: "Ailanthus altissima",
    family: "Simaroubaceae",
    tags: ["Tree", "Deciduous", "Invasive"],
    usda: {
      symbol: "AIAL",
      group: "Dicot",
      duration: "Perennial",
      growthHabit: "Tree",
      nativeStatus: "L48 (I)",
    },
    images: [
      { descriptor: "leaf", url: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=700&q=80" },
      { descriptor: "bark", url: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=700&q=80" },
      { descriptor: "form", url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=700&q=80" },
    ],
    mapUrl: null,
    sections: {
      leaf: "Large pinnately compound leaves, 1–4 ft long with 11–41 leaflets. Each leaflet has 1–2 gland-tipped teeth near the base—key diagnostic feature. Foul odor when crushed.",
      bark: "Smooth, gray-brown, resembling ash. Older bark develops pale tan stripes and slight roughness. Light-colored inner bark.",
      form: "Fast-growing to 80 ft, with an open, irregular crown of large spreading branches. Grows in any disturbed habitat—roadsides, abandoned lots, forest edges.",
      twig: "Stout, velvety when young, with large heart-shaped leaf scars having many bundle scars. Odor when cut.",
      flower: "Monoecious or dioecious. Small yellow-green flowers in large terminal panicles. Unpleasant odor.",
      fruit: "Clusters of 1-seeded samaras (twisted), light brown, turning tan, persisting through winter.",
      looksLike: "Staghorn sumac (Rhus typhina)—similar compound leaves but leaflets lack basal glands and are toothed throughout. Black walnut (Juglans nigra)—compound but fragrant, not fetid.",
    },
  },
  {
    id: "Cercis_canadensis",
    commonName: "Eastern Redbud",
    scientificName: "Cercis canadensis",
    family: "Fabaceae",
    tags: ["Tree", "Deciduous", "Native", "Planted Commercially"],
    usda: {
      symbol: "CECA4",
      group: "Dicot",
      duration: "Perennial",
      growthHabit: "Tree",
      nativeStatus: "L48 (N)",
    },
    images: [
      { descriptor: "leaf", url: "https://images.unsplash.com/photo-1562832135-14a35d25edef?w=700&q=80" },
      { descriptor: "bark", url: "https://images.unsplash.com/photo-1476842634003-7dcca8f832de?w=700&q=80" },
      { descriptor: "form", url: "https://images.unsplash.com/photo-1490750967868-88df5691cc3e?w=700&q=80" },
    ],
    mapUrl: null,
    sections: {
      leaf: "Simple, alternate, heart-shaped (cordate), 3–5 inches wide with entire margin. Both surfaces glabrous. Turns yellow in fall.",
      bark: "Young bark smooth, dark gray-brown. Older bark develops narrow scaly ridges and slightly orange-tinged furrows.",
      form: "Small tree or large shrub, 20–30 ft. Multi-stemmed, wide-spreading crown. Spectacular in spring with magenta-pink flowers directly on branches and trunk.",
      twig: "Slender, zigzag, with small pointed buds. Stipule scars present.",
      flower: "Magenta-pink pea-like flowers appear in early spring before leaves, directly on branches and trunk (cauliflory). One of the most ornamental native trees.",
      fruit: "Flat, brown legume pods 2–3 inches long, persisting into winter.",
      looksLike: "No lookalikes when in flower. Vegetatively, large-leaved plants like catalpa may be confused, but redbud's cordate simple leaves are distinctive.",
    },
  },
];

// ── Tag color system ──────────────────────────────────────────────────────────
function tagStyle(tag: string): { bg: string; text: string; border: string } {
  const t = tag.toLowerCase();
  if (t === "native")
    return { bg: "#2d6a4f", text: "#fff", border: "#1b4332" };
  if (t === "invasive")
    return { bg: "#c1121f", text: "#fff", border: "#9d0208" };
  if (t.includes("planted") || t.includes("ornamental") || t.includes("introduced"))
    return { bg: "#e9c46a", text: "#1a1a00", border: "#c9a227" };
  if (t.includes("tree"))
    return { bg: "#1b4332", text: "#d4edda", border: "#0d2b20" };
  if (t.includes("shrub"))
    return { bg: "#7b3f00", text: "#fff", border: "#5c2e00" };
  if (t.includes("conifer") || t.includes("evergreen"))
    return { bg: "#1a3a2a", text: "#b7e4c7", border: "#0d2b1e" };
  if (t.includes("deciduous"))
    return { bg: "#606c38", text: "#fff", border: "#4a5428" };
  return { bg: "#4a4a4a", text: "#fff", border: "#333" };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SECTION_LABELS: Record<string, string> = {
  leaf: "Leaf",
  bark: "Bark",
  form: "Form",
  twig: "Twig",
  flower: "Flower",
  fruit: "Fruit",
  looksLike: "Looks Like",
};

const PRIMARY_SECTIONS = ["leaf", "bark", "form", "looksLike"];
const SECONDARY_SECTIONS = ["twig", "flower", "fruit"];
const ALL_SECTION_KEYS = [...PRIMARY_SECTIONS, ...SECONDARY_SECTIONS];

function DescRow({
  label,
  text,
  isLooksLike,
  isPrimary,
}: {
  label: string;
  text: string;
  isLooksLike?: boolean;
  isPrimary?: boolean;
}) {
  const accentColor = isLooksLike ? "#c1121f" : "#2d6a4f";
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span
        style={{
          fontSize: 10,
          fontFamily: "'Segoe UI', sans-serif",
          fontWeight: 800,
          textTransform: "uppercase" as const,
          letterSpacing: "0.9px",
          color: accentColor,
          minWidth: 58,
          paddingTop: 1,
          borderLeft: `3px solid ${accentColor}`,
          paddingLeft: 5,
          flexShrink: 0,
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
      <p
        style={{
          fontSize: isPrimary ? 12.5 : 12,
          color: "#2a2a22",
          lineHeight: 1.5,
          margin: 0,
          flex: 1,
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        {text}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function FlashCard() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({
    leaf: true,
    bark: true,
    form: true,
    looksLike: true,
    twig: true,
    flower: true,
    fruit: false,
  });

  const species = SAMPLE_SPECIES[index];
  const total = SAMPLE_SPECIES.length;

  function navigate(dir: 1 | -1) {
    setFlipped(false);
    setTimeout(() => setIndex((i) => (i + dir + total) % total), 200);
  }

  function toggleSection(key: string) {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
  }

  const activePrimary = PRIMARY_SECTIONS.filter(
    (k) => visible[k] && species.sections[k as keyof typeof species.sections]
  );
  const activeSecondary = SECONDARY_SECTIONS.filter(
    (k) => visible[k] && species.sections[k as keyof typeof species.sections]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #0d2b1e 0%, #1b4332 45%, #0a1f15 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        userSelect: "none",
      }}
    >
      {/* Top label */}
      <div
        style={{
          color: "#95d5b2",
          fontSize: 11,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          marginBottom: 10,
          opacity: 0.8,
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        Dendrology Flashcard
      </div>

      {/* Counter */}
      <div
        style={{
          color: "#d8f3dc",
          fontSize: 13,
          marginBottom: 18,
          opacity: 0.7,
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        {index + 1} / {total}
      </div>

      {/* ── 3D Card ── */}
      <div style={{ perspective: "1400px", width: 740, maxWidth: "100%" }}>
        <div
          style={{
            width: "100%",
            height: 490,
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            cursor: "pointer",
          }}
          onClick={() => setFlipped((f) => !f)}
          title={flipped ? "Click to see front" : "Click to reveal details"}
        >
          {/* ════ FRONT ════ */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "#f8f5ef",
              borderRadius: 18,
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Accent stripe */}
            <div
              style={{
                height: 7,
                background:
                  "linear-gradient(90deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)",
              }}
            />

            {/* Front body */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 60px",
                textAlign: "center",
              }}
            >
              {/* Decorative leaf watermark */}
              <div
                style={{
                  fontSize: 72,
                  opacity: 0.06,
                  position: "absolute",
                  pointerEvents: "none",
                }}
              >
                🌿
              </div>

              {/* Family */}
              <p
                style={{
                  color: "#9b8c75",
                  fontSize: 12,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontFamily: "'Segoe UI', sans-serif",
                  marginBottom: 16,
                }}
              >
                {species.family}
              </p>

              {/* Common name */}
              <h1
                style={{
                  fontSize: 46,
                  fontWeight: "bold",
                  color: "#1b4332",
                  lineHeight: 1.1,
                  marginBottom: 14,
                  textShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {species.commonName}
              </h1>

              {/* Scientific name */}
              <p
                style={{
                  fontSize: 21,
                  fontStyle: "italic",
                  color: "#6b6658",
                  lineHeight: 1.3,
                }}
              >
                {species.scientificName}
              </p>

              {/* Tags */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 28,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {species.tags.map((tag) => {
                  const s = tagStyle(tag);
                  return (
                    <span
                      key={tag}
                      style={{
                        background: s.bg,
                        color: s.text,
                        border: `1px solid ${s.border}`,
                        padding: "5px 14px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontFamily: "'Segoe UI', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.6px",
                        textTransform: "uppercase",
                      }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Bottom hint */}
            <div
              style={{
                padding: "12px 24px",
                background: "#f0ede5",
                borderTop: "1px solid #e0dbd0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "#9b8c75",
                fontSize: 13,
                fontFamily: "'Segoe UI', sans-serif",
              }}
            >
              <span style={{ fontSize: 15 }}>👆</span>
              Click card to reveal identification details
            </div>
          </div>

          {/* ════ BACK ════ */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#111",
              borderRadius: 18,
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ── Photo zone (top ~52%) ── */}
            <div
              style={{
                flex: "0 0 52%",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr",
                gap: 2,
                position: "relative",
                background: "#000",
              }}
            >
              {/* Left col: leaf (full height) */}
              <div
                style={{
                  gridRow: "1 / 3",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <img
                  src={species.images[0]?.url}
                  alt={species.images[0]?.descriptor}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  draggable={false}
                />
                <PhotoLabel label={species.images[0]?.descriptor ?? "leaf"} />
              </div>

              {/* Top right: bark */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <img
                  src={species.images[1]?.url}
                  alt={species.images[1]?.descriptor}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  draggable={false}
                />
                <PhotoLabel label={species.images[1]?.descriptor ?? "bark"} />
              </div>

              {/* Bottom right: form */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <img
                  src={species.images[2]?.url}
                  alt={species.images[2]?.descriptor}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  draggable={false}
                />
                <PhotoLabel label={species.images[2]?.descriptor ?? "form"} />
              </div>

              {/* ── Map inset — top left overlay ── */}
              {species.mapUrl && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    zIndex: 10,
                    width: 112,
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: "0 3px 12px rgba(0,0,0,0.6)",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    background: "#c8e6f5",
                  }}
                >
                  <img
                    src={species.mapUrl}
                    alt="Native range map"
                    style={{ width: "100%", display: "block" }}
                    draggable={false}
                  />
                  <div
                    style={{
                      background: "rgba(0,0,0,0.58)",
                      color: "#fff",
                      fontSize: 10,
                      textAlign: "center",
                      padding: "3px 0",
                      fontFamily: "'Segoe UI', sans-serif",
                      fontWeight: 700,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                    }}
                  >
                    Native Range
                  </div>
                </div>
              )}

              {/* ── Tags — top right overlay ── */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  alignItems: "flex-end",
                  zIndex: 10,
                }}
              >
                {species.tags.map((tag) => {
                  const s = tagStyle(tag);
                  return (
                    <span
                      key={tag}
                      style={{
                        background: s.bg,
                        color: s.text,
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontFamily: "'Segoe UI', sans-serif",
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        border: `1px solid rgba(255,255,255,0.15)`,
                      }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* ── Info panel (bottom ~48%) ── */}
            <div
              style={{
                flex: 1,
                background: "#f8f5ef",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              {/* Metadata strip */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #d6d1c5",
                  background: "#f0ede5",
                  flexShrink: 0,
                }}
              >
                {[
                  ["Family", species.family],
                  ["Group", species.usda.group],
                  ["Duration", species.usda.duration],
                  ["Habit", species.usda.growthHabit],
                  ["Symbol", species.usda.symbol],
                ].map(([label, value], i, arr) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      padding: "7px 8px",
                      borderRight: i < arr.length - 1 ? "1px solid #d6d1c5" : "none",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontFamily: "'Segoe UI', sans-serif",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        color: "#9b8c75",
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#1a1a14",
                        fontFamily: "'Segoe UI', sans-serif",
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Description sections — scrollable */}
              <div
                style={{
                  flex: 1,
                  padding: "10px 14px 6px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                  minHeight: 0,
                }}
              >
                {/* Primary sections */}
                {activePrimary.map((key) => (
                  <DescRow
                    key={key}
                    label={SECTION_LABELS[key]}
                    text={species.sections[key as keyof typeof species.sections]}
                    isLooksLike={key === "looksLike"}
                    isPrimary
                  />
                ))}

                {/* Secondary sections — shown in a 2-col grid, smaller */}
                {activeSecondary.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px 14px",
                      marginTop: 4,
                      paddingTop: 6,
                      borderTop: "1px dashed #d6d1c5",
                    }}
                  >
                    {activeSecondary.map((key) => (
                      <div key={key}>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "'Segoe UI', sans-serif",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            color: "#9b8c75",
                          }}
                        >
                          {SECTION_LABELS[key]}
                        </span>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#4a4a3a",
                            lineHeight: 1.45,
                            margin: "2px 0 0",
                            fontFamily: "'Segoe UI', sans-serif",
                          }}
                        >
                          {species.sections[key as keyof typeof species.sections]}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {activePrimary.length === 0 && activeSecondary.length === 0 && (
                  <p
                    style={{
                      color: "#9b8c75",
                      fontSize: 13,
                      textAlign: "center",
                      padding: "20px 0",
                      fontFamily: "'Segoe UI', sans-serif",
                    }}
                  >
                    All sections hidden — toggle some on below.
                  </p>
                )}
              </div>

              {/* Bottom name bar */}
              <div
                style={{
                  padding: "6px 14px",
                  borderTop: "1px solid #e0dbd0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                  background: "#f0ede5",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontStyle: "italic",
                    color: "#9b8c75",
                  }}
                >
                  {species.scientificName}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#bbb",
                    fontFamily: "'Segoe UI', sans-serif",
                  }}
                >
                  click to flip ↻
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 24,
          alignItems: "center",
        }}
      >
        <NavButton onClick={() => navigate(-1)} label="←" />
        <div
          style={{
            color: "#95d5b2",
            fontSize: 12,
            opacity: 0.7,
            fontFamily: "'Segoe UI', sans-serif",
            width: 70,
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {flipped ? "back" : "front"}
        </div>
        <NavButton onClick={() => navigate(1)} label="→" />
      </div>

      {/* ── Section toggles ── */}
      <div
        style={{
          marginTop: 22,
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
          justifyContent: "center",
          maxWidth: 740,
        }}
      >
        <span
          style={{
            color: "#95d5b2",
            fontSize: 10,
            opacity: 0.6,
            fontFamily: "'Segoe UI', sans-serif",
            width: "100%",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 2,
          }}
        >
          Show / hide sections on back
        </span>
        {ALL_SECTION_KEYS.map((key) => {
          const on = visible[key];
          const isPrimary = PRIMARY_SECTIONS.includes(key);
          return (
            <button
              key={key}
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(key);
              }}
              style={{
                background: on
                  ? isPrimary
                    ? "rgba(45,106,79,0.9)"
                    : "rgba(45,106,79,0.55)"
                  : "rgba(255,255,255,0.08)",
                border: on ? "1px solid rgba(149,213,178,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: on ? "#d8f3dc" : "#5a7060",
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                fontFamily: "'Segoe UI', sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.4px",
                transition: "all 0.15s",
                textDecoration: on ? "none" : "line-through",
              }}
            >
              {SECTION_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PhotoLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 6,
        left: 8,
        background: "rgba(0,0,0,0.58)",
        backdropFilter: "blur(4px)",
        color: "#fff",
        fontSize: 11,
        padding: "2px 9px",
        borderRadius: 10,
        fontFamily: "'Segoe UI', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
}

function NavButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(149,213,178,0.2)",
        color: "#95d5b2",
        borderRadius: 40,
        padding: "10px 26px",
        fontSize: 20,
        cursor: "pointer",
        transition: "background 0.15s",
        fontFamily: "sans-serif",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.18)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
      }
    >
      {label}
    </button>
  );
}
