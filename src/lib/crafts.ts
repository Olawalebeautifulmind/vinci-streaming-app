export type CraftSlug =
  | "bead-making"
  | "pottery"
  | "painting"
  | "sculpture"
  | "textile"
  | "tailoring"
  | "furniture"
  | "culinary";

export type Craft = {
  slug: CraftSlug;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  disciplines: string[];
  materials: string[];
  accent: string;
  base: string;
  enabled: boolean;
};

// Bead Making and Pottery are live end to end. The rest are announced as coming soon,
// and the database refuses streams, works and battles for them (crafts.enabled).
export const crafts: Craft[] = [
  {
    slug: "bead-making",
    name: "Bead Making",
    emoji: "📿",
    tagline: "Jewellery, wearable art, decorative beadwork",
    description:
      "Hand-strung pieces, lampwork beads and intricate wearable art. Bid on one-of-one strands as they're finished.",
    disciplines: ["Jewellery", "Wearable art", "Decorative beadwork", "Lampwork", "Beadweaving"],
    materials: [
      "Glass seed beads",
      "Borosilicate glass",
      "Mandrel",
      "Torch",
      "Waxed cord",
      "Brass findings",
    ],
    accent: "#f0d78c",
    base: "#15110a",
    enabled: true,
  },
  {
    slug: "pottery",
    name: "Pottery",
    emoji: "🏺",
    tagline: "Wheel throwing, hand-building, glazing, kiln work",
    description:
      "Wheel-throwing, hand-building and kiln reveals. Bid on individual cups, vases or commissions.",
    disciplines: ["Wheel throwing", "Hand-building", "Glazing", "Kiln work", "Restoration"],
    materials: [
      "Stoneware clay",
      "Porcelain",
      "Ash glaze",
      "Kiln cone 10",
      "Wooden ribs",
      "Underglaze",
    ],
    accent: "#c9a84c",
    base: "#1a1208",
    enabled: true,
  },
  {
    slug: "painting",
    name: "Painting",
    emoji: "🖌️",
    tagline: "Canvas, watercolour, oil, acrylic",
    description: "",
    disciplines: [],
    materials: [],
    accent: "#e8a87c",
    base: "#1a1208",
    enabled: false,
  },
  {
    slug: "sculpture",
    name: "Sculpture",
    emoji: "🗿",
    tagline: "Clay modelling, stone, metal",
    description: "",
    disciplines: [],
    materials: [],
    accent: "#c0c0c0",
    base: "#141414",
    enabled: false,
  },
  {
    slug: "textile",
    name: "Textile",
    emoji: "🧵",
    tagline: "Weaving, embroidery, macramé",
    description: "",
    disciplines: [],
    materials: [],
    accent: "#c4654a",
    base: "#1a1208",
    enabled: false,
  },
  {
    slug: "tailoring",
    name: "Tailoring",
    emoji: "✂️",
    tagline: "Garment making, hand-stitching",
    description: "",
    disciplines: [],
    materials: [],
    accent: "#9bd0b0",
    base: "#0c1410",
    enabled: false,
  },
  {
    slug: "furniture",
    name: "Furniture",
    emoji: "🪑",
    tagline: "Woodworking, upcycling",
    description: "",
    disciplines: [],
    materials: [],
    accent: "#d4a574",
    base: "#150f08",
    enabled: false,
  },
  {
    slug: "culinary",
    name: "Culinary",
    emoji: "🍳",
    tagline: "Pastry, fermentation, plating",
    description: "",
    disciplines: [],
    materials: [],
    accent: "#f0a868",
    base: "#1a1108",
    enabled: false,
  },
];

export const enabledCrafts = crafts.filter((c) => c.enabled);
export const getCraft = (slug: string | null | undefined) => crafts.find((c) => c.slug === slug);

export const FORMATS = [
  { slug: "studio", label: "Studio session" },
  { slug: "tutorial", label: "Tutorial / masterclass" },
  { slug: "commission", label: "Live commission" },
  { slug: "versus", label: "Versus battle" },
  { slug: "showcase", label: "Showcase / drop" },
] as const;

export const DIFFICULTIES = [
  "Beginner-friendly",
  "Intermediate",
  "Advanced",
  "Master class",
] as const;

export const GIFTS = [
  { id: "shell", label: "🐚 Shell", amount: 25 },
  { id: "bouquet", label: "🌹 Bouquet", amount: 100 },
  { id: "spark", label: "✨ Spark", amount: 250 },
  { id: "patron", label: "🏆 Patron", amount: 1000 },
] as const;
